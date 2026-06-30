/**
 * PitaCopa — Dev Server + api-football.com Proxy
 *
 * Run:  node server.js
 * Open: http://localhost:3000
 *
 * What it does:
 *  - Serves all static files (HTML, CSS, JS, img)
 *  - Proxies /api/matches → api-football.com (normalises response to the
 *    same shape the frontend expects, keeping CORS key server-side)
 *
 * API key:
 *  Production: set env var API_FOOTBALL_KEY in Railway → Variables
 *  Local dev:  create a .env file in this folder with:
 *              API_FOOTBALL_KEY=your_key_here
 */

require('dotenv').config();   // loads .env for local dev (no-op in production)

const express  = require('express');
const fetch    = require('node-fetch');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Firebase Admin (trusted server-side writes) ───────────────────────────────
// Predictions and scoring are written ONLY here, via the Admin SDK, which bypasses
// Firestore security rules. Clients can no longer write user_predictions directly,
// so the per-match / global-pick locks below can't be bypassed from devtools.
//
// Setup (one-time): Firebase console → Project settings → Service accounts →
// "Generate new private key". Paste the WHOLE JSON into a Railway variable named
// FIREBASE_SERVICE_ACCOUNT. Locally, put it in .env on one line (gitignored).
const admin = require('firebase-admin');
const { calculateScore } = require('./js/scoring');

let adminReady = false;
(function initAdmin() {
  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.applicationDefault();
    } else {
      console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT not set — prediction saving & scoring are DISABLED.');
      return;
    }
    admin.initializeApp({ credential, projectId: 'pitacopa-a2cea' });
    adminReady = true;
  } catch (e) {
    console.error('Firebase Admin init failed:', e.message);
  }
})();
const adminDb = () => admin.firestore();

// Optional allow-list for the manual rescore endpoint (comma-separated emails).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// Global picks (champion/runner-up/top-scorer) lock one day after the opener.
// 2026-06-12T03:00:00Z == midnight 12/06 in Brazil (UTC-3); matches the client.
const PICKS_LOCK_MS = Date.parse('2026-06-12T03:00:00Z');

// ─── Match schedule (parsed from js/wc2026.js — single source of truth) ────────
// We only need each game's id, kickoff, and team codes; a regex over the ALL_GAMES
// object literals avoids duplicating the fixture list (and any drift with it).
const SCHEDULE = (function loadSchedule() {
  const out = {}; // gameId -> { date, home, away, kickoffMs }
  try {
    const src = fs.readFileSync(path.join(__dirname, 'js', 'wc2026.js'), 'utf8');
    // Match a single game object only. Game objects are flat (no nested braces),
    // so [^{}] keeps each match inside one object and never spans across objects.
    // Team objects have no `date:` field, so they can't match here.
    const objRe = /\{[^{}]*?\bid:\s*"([^"]+)"[^{}]*?\bdate:\s*"([^"]+)"[^{}]*?\}/g;
    let m;
    while ((m = objRe.exec(src)) !== null) {
      const chunk = m[0];
      const homeM = chunk.match(/\bhome:\s*"([^"]+)"/);
      const awayM = chunk.match(/\baway:\s*"([^"]+)"/);
      out[m[1]] = {
        date: m[2],
        home: homeM ? homeM[1] : '',
        away: awayM ? awayM[1] : '',
        kickoffMs: new Date(m[2]).getTime(),
      };
    }
  } catch (e) {
    console.error('Schedule parse failed:', e.message);
  }
  return out;
})();
// Teams (id + names), parsed from WC2026_TEAMS in js/wc2026.js — used to map
// api-football fixtures (which carry team names) back to our game IDs.
const TEAM_BY_ID = {};       // code -> { name, nameEn }
const CODE_BY_NAME = {};     // normalized name/nameEn -> code
function normName(s) {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
(function loadTeams() {
  try {
    const src = fs.readFileSync(path.join(__dirname, 'js', 'wc2026.js'), 'utf8');
    const re = /id:\s*"([a-z][a-z0-9]{1,4})",\s*name:\s*"([^"]+)",\s*nameEn:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const [, id, name, nameEn] = m;
      TEAM_BY_ID[id] = { name, nameEn };
      CODE_BY_NAME[normName(name)]   = id;
      CODE_BY_NAME[normName(nameEn)] = id;
      CODE_BY_NAME[id] = id;
    }
  } catch (e) {
    console.error('Teams parse failed:', e.message);
  }
})();

// "home_away" (team codes) → gameId, for group-stage fixtures (codes are known).
const GAME_ID_BY_TEAMS = {};
// "YYYY-MM-DDTHH:MM" → [gameId, …] (a list — simultaneous matches share a slot).
const SCHEDULE_BY_DT = {};
for (const [id, g] of Object.entries(SCHEDULE)) {
  if (g.home && g.away && g.home !== 'TBD' && g.away !== 'TBD') {
    GAME_ID_BY_TEAMS[`${g.home}_${g.away}`] = id;
  }
  const key = (g.date || '').substring(0, 16);
  if (key) (SCHEDULE_BY_DT[key] = SCHEDULE_BY_DT[key] || []).push(id);
}
// A match is "scoring-relevant" from kickoff until 4h later (covers 90' + halftime
// + stoppage + knockout extra-time/penalties + a buffer to catch the FINISHED state).
const SYNC_WINDOW_AFTER_MS = 4 * 60 * 60 * 1000;
function isWithinMatchWindow(now = Date.now()) {
  for (const g of Object.values(SCHEDULE)) {
    if (g.kickoffMs && now >= g.kickoffMs && now <= g.kickoffMs + SYNC_WINDOW_AFTER_MS) {
      return true;
    }
  }
  return false;
}

function codeFromName(name) { return CODE_BY_NAME[normName(name)] || null; }
function teamTokens(code) {
  const t = TEAM_BY_ID[code];
  return new Set(normName(t ? `${t.name} ${t.nameEn}` : code).split(' ').filter(Boolean));
}
function tokenOverlap(text, codeTokens) {
  const ts = new Set(normName(text).split(' ').filter(Boolean));
  let n = 0; for (const w of ts) if (codeTokens.has(w)) n++;
  return n;
}

// Map a normalised api-football fixture to one of our game IDs.
//   1) exact team-code match (group stage) — most reliable, time-drift proof
//   2) unique kickoff slot — covers knockout (distinct times) & non-colliding group
//   3) fuzzy team match among games sharing a kickoff slot (simultaneous matches)
function fixtureToGameId(m) {
  const h = codeFromName(m.homeTeam?.name);
  const a = codeFromName(m.awayTeam?.name);
  if (h && a && GAME_ID_BY_TEAMS[`${h}_${a}`]) return GAME_ID_BY_TEAMS[`${h}_${a}`];

  const cands = SCHEDULE_BY_DT[(m.utcDate || '').substring(0, 16)] || [];
  if (cands.length === 1) return cands[0];
  if (cands.length === 0) return null;

  let best = null, bestScore = 0;
  for (const gid of cands) {
    const g = SCHEDULE[gid];
    const sc = tokenOverlap(m.homeTeam?.name, teamTokens(g.home))
             + tokenOverlap(m.awayTeam?.name, teamTokens(g.away));
    if (sc > bestScore) { bestScore = sc; best = gid; }
  }
  return bestScore > 0 ? best : null;
}

// ─── Read API key ─────────────────────────────────────────────────────────────
function readApiKey() {
  if (process.env.API_FOOTBALL_KEY) return process.env.API_FOOTBALL_KEY;
  try {
    const cfg = fs.readFileSync(path.join(__dirname, 'js', 'config.js'), 'utf8');
    const m   = cfg.match(/API_FOOTBALL_KEY\s*=\s*['"]([^'"]+)['"]/);
    return m ? m[1] : '';
  } catch { return ''; }
}

// ─── Normalise api-football.com fixture into the shape the frontend expects ──
function normaliseFixture(f) {
  // ── Status ──────────────────────────────────────────────────────────────────
  const STATUS_MAP = {
    NS:   'TIMED',    // Not Started
    TBD:  'TIMED',    // Time To Be Defined
    '1H': 'IN_PLAY',  // First Half
    HT:   'PAUSED',   // Half Time
    '2H': 'IN_PLAY',  // Second Half
    ET:   'IN_PLAY',  // Extra Time
    BT:   'PAUSED',   // Break Time (extra time)
    P:    'IN_PLAY',  // Penalty In Progress
    FT:   'FINISHED', // Full Time
    AET:  'FINISHED', // After Extra Time
    PEN:  'FINISHED', // After Penalties
    PST:  'POSTPONED',
    CANC: 'CANCELLED',
    SUSP: 'POSTPONED',
    INT:  'POSTPONED',
    AWD:  'FINISHED',
    WO:   'FINISHED',
  };
  const status = STATUS_MAP[f.fixture?.status?.short] || 'TIMED';

  // ── Stage & group from league.round ─────────────────────────────────────────
  // api-football uses strings like "Group A - 1", "Round of 16", "Final" etc.
  const round = (f.league?.round || '').trim();
  let stage = 'GROUP_STAGE';
  let group = null;

  if (/group/i.test(round)) {
    stage = 'GROUP_STAGE';
    // "Group A - 1" → "GROUP_A"
    const gm = round.match(/Group\s+([A-L])/i);
    if (gm) group = 'GROUP_' + gm[1].toUpperCase();
  } else if (/round of 32/i.test(round))      { stage = 'LAST_32'; }
  else if (/round of 16/i.test(round))         { stage = 'LAST_16'; }
  else if (/quarter/i.test(round))             { stage = 'QUARTER_FINALS'; }
  else if (/semi/i.test(round))                { stage = 'SEMI_FINALS'; }
  else if (/3rd|third|third place/i.test(round)) { stage = 'THIRD_PLACE'; }
  else if (/final/i.test(round))               { stage = 'FINAL'; }

  // ── Date: normalise to UTC ISO string ───────────────────────────────────────
  const utcDate = f.fixture?.date
    ? new Date(f.fixture.date).toISOString()
    : null;

  // ── Score ────────────────────────────────────────────────────────────────────
  // IMPORTANT: f.score.fulltime = 90-minute score only (used for point calculation)
  //            f.goals          = total goals including extra time (used for display)
  //            f.score.penalty  = penalty shootout score (separate, not added to goals)
  const score = {
    fullTime: {
      // 90-min score — this is what predictions are scored against
      home: f.score?.fulltime?.home ?? null,
      away: f.score?.fulltime?.away ?? null,
    },
    halfTime: {
      home: f.score?.halftime?.home ?? null,
      away: f.score?.halftime?.away ?? null,
    },
    extraTime: {
      home: f.score?.extratime?.home ?? null,
      away: f.score?.extratime?.away ?? null,
    },
    penalty: {
      home: f.score?.penalty?.home ?? null,
      away: f.score?.penalty?.away ?? null,
    },
    // Total goals including ET (not penalties) — used only for visual display
    liveScore: {
      home: f.goals?.home ?? null,
      away: f.goals?.away ?? null,
    },
  };

  // ── Teams ────────────────────────────────────────────────────────────────────
  const homeTeam = {
    id:        f.teams?.home?.id   || null,
    name:      f.teams?.home?.name || '',
    shortName: f.teams?.home?.name || '',
    tla:       (f.teams?.home?.name || '').slice(0, 3).toUpperCase(),
    crest:     f.teams?.home?.logo || null,
  };
  const awayTeam = {
    id:        f.teams?.away?.id   || null,
    name:      f.teams?.away?.name || '',
    shortName: f.teams?.away?.name || '',
    tla:       (f.teams?.away?.name || '').slice(0, 3).toUpperCase(),
    crest:     f.teams?.away?.logo || null,
  };

  return {
    utcDate, status, stage, group, homeTeam, awayTeam, score,
    elapsed:     f.fixture?.status?.elapsed ?? null,  // minutes played (null when not live)
    statusShort: f.fixture?.status?.short  ?? null,   // raw code: '1H','HT','2H','ET','BT','P'…
  };
}

// ─── www → canonical redirect ─────────────────────────────────────────────────
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    const bare = host.slice(4);
    return res.redirect(301, `https://${bare}${req.url}`);
  }
  next();
});

// ─── api-football proxy cache ─────────────────────────────────────────────────
// Every /games page load calls /api/matches, which otherwise hits api-football
// live each time. The World Cup fixture list changes slowly, so we cache the
// upstream response and let concurrent/repeat visitors share one call. This
// protects the shared daily api-football quota (the same key powers
// fanaticscores) from traffic spikes during the tournament.
//
// The cache TTL is adaptive, driven by the fixtures themselves:
//   • a match is live now            → refresh every 2 minutes (fresh scores)
//   • nothing live, next kickoff soon → refresh around that kickoff
//   • nothing live, nothing imminent  → refresh at most once per hour (save quota)
//
// Scope note: this touches ONLY the api-football proxy. No Firestore / user data
// is involved here — all user data lives in Firebase and is accessed client-side.
const LIVE_TTL_MS = 120_000;       // 2 min — while a match is in progress
const IDLE_TTL_MS = 3_600_000;     // 1 hour — when nothing is live or imminent
const matchesCache = new Map();    // season -> { matches, fetchedAt }
const inFlight     = new Map();    // season -> Promise<matches> (stampede guard)

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED']);

// How long a cached snapshot stays valid, based on what it contains.
function ttlForMatches(matches) {
  if (matches.some(m => LIVE_STATUSES.has(m.status))) return LIVE_TTL_MS;

  // Nothing live: normally hold for an hour, but if a match kicks off within
  // that hour, expire around kickoff so we don't miss the start of live play.
  const now = Date.now();
  let nextKickoff = Infinity;
  for (const m of matches) {
    if (!m.utcDate) continue;
    const t = new Date(m.utcDate).getTime();
    // KICKED OFF but this snapshot still says TIMED: api-football flips the
    // status a minute or two after the real kickoff, so a snapshot cached in
    // that gap looks "idle" and (without this guard) would be held for the
    // full hour — exactly what froze Canada–Bosnia at TIMED minutes into the
    // match. Keep refreshing at the live TTL until the status flips or the
    // match window passes.
    if (m.status === 'TIMED' && t <= now && now - t < SYNC_WINDOW_AFTER_MS) {
      return LIVE_TTL_MS;
    }
    if (t > now && t < nextKickoff) nextKickoff = t;
  }
  const untilKickoff = nextKickoff - now;
  if (untilKickoff < IDLE_TTL_MS) return Math.max(untilKickoff, LIVE_TTL_MS);
  return IDLE_TTL_MS;
}

function afBodyHasErrors(errors) {
  if (!errors) return false;
  if (Array.isArray(errors)) return errors.length > 0;
  if (typeof errors === 'object') return Object.keys(errors).length > 0;
  return false;
}

// Fetches (or returns cached) normalised matches for a season. Coalesces
// concurrent misses into a single upstream request. Throws on upstream failure
// so the caller can decide whether to serve a stale copy.
async function getMatches(season, API_KEY) {
  const cached = matchesCache.get(season);
  if (cached && Date.now() - cached.fetchedAt < ttlForMatches(cached.matches)) {
    return { matches: cached.matches, cache: 'hit' };
  }

  if (inFlight.has(season)) {
    return { matches: await inFlight.get(season), cache: 'coalesced' };
  }

  const promise = (async () => {
    const upstream = `https://v3.football.api-sports.io/fixtures?league=1&season=${season}`;
    const upstream_res = await fetch(upstream, { headers: { 'x-apisports-key': API_KEY } });
    const data = await upstream_res.json();

    if (!upstream_res.ok) {
      const err = new Error('Upstream error');
      err.status = upstream_res.status;
      err.detail = data;
      throw err;
    }
    // api-football also returns errors inside a 200 body (bad key, quota
    // exhausted, plan limits). Don't cache those — they'd freeze a transient
    // failure for the whole TTL.
    if (afBodyHasErrors(data.errors)) {
      const err = new Error('Upstream returned errors');
      err.status = 502;
      err.detail = data.errors;
      throw err;
    }

    const matches = (data.response || []).map(normaliseFixture);
    matchesCache.set(season, { matches, fetchedAt: Date.now() });
    return matches;
  })();

  inFlight.set(season, promise);
  try {
    return { matches: await promise, cache: 'miss' };
  } finally {
    inFlight.delete(season);
  }
}

// ─── JSON body parsing (for the prediction-save endpoint) ─────────────────────
app.use(express.json({ limit: '256kb' }));

// Verify the caller's Firebase ID token from the Authorization header.
async function verifyUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) { const e = new Error('Missing token'); e.status = 401; throw e; }
  return admin.auth().verifyIdToken(token);
}

// ─── Save predictions (authenticated, lock-enforced) ──────────────────────────
// Replaces the old client-side setDoc. Enforces the locks server-side:
//   • a game prediction is accepted only before that match's kickoff
//   • champion / runner-up / top-scorer accepted only before PICKS_LOCK_MS
// Anything locked is silently kept at its stored value (and counted in `rejected`).
app.post('/api/predictions', async (req, res) => {
  if (!adminReady) return res.status(503).json({ error: 'Server not configured for writes' });

  let decoded;
  try { decoded = await verifyUser(req); }
  catch (e) { return res.status(e.status || 401).json({ error: 'Unauthorized' }); }

  const uid  = decoded.uid;
  const now  = Date.now();
  const body = req.body || {};
  const ref  = adminDb().collection('user_predictions').doc(uid);

  try {
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : {};
    const out = { ...existing };
    if (!out.games) out.games = {};

    // Global picks — only writable before the lock.
    if (now < PICKS_LOCK_MS) {
      if ('champion'  in body) out.champion  = String(body.champion  || '');
      if ('runnerUp'  in body) out.runnerUp  = String(body.runnerUp  || '');
      if ('topScorer' in body) out.topScorer = String(body.topScorer || '').trim();
    }

    // Per-game predictions — accept only for matches that haven't kicked off.
    let rejected = 0;
    const incoming = (body.games && typeof body.games === 'object') ? body.games : {};
    for (const [gid, pred] of Object.entries(incoming)) {
      const g = SCHEDULE[gid];
      if (!g || now >= g.kickoffMs) { rejected++; continue; }  // unknown or locked
      const ph = pred && pred.home !== '' && pred.home != null ? parseInt(pred.home, 10) : '';
      const pa = pred && pred.away !== '' && pred.away != null ? parseInt(pred.away, 10) : '';
      out.games[gid] = {
        home: (ph === '' || isNaN(ph)) ? '' : ph,
        away: (pa === '' || isNaN(pa)) ? '' : pa,
      };
    }

    out.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await ref.set(out, { merge: true });
    res.json({ ok: true, rejected });
  } catch (e) {
    console.error('save predictions error:', e.message);
    res.status(500).json({ error: 'Save failed' });
  }
});

// ─── Results sync + scoring ───────────────────────────────────────────────────
// Pulls FINISHED fixtures from api-football (reusing the cached getMatches), maps
// each to our game IDs by kickoff datetime, stores confirmed scores into
// settings/results.games, then recomputes every user's GLOBAL score from their
// user_predictions and mirrors it onto their bolao_participants docs (which the
// per-bolão standings read). The global ranking page computes scores itself.
let scoringBusy = false;
async function syncResultsAndScore() {
  if (!adminReady || scoringBusy) return;
  const API_KEY = readApiKey();
  if (!API_KEY) return;
  scoringBusy = true;
  try {
    const { matches } = await getMatches('2026', API_KEY);
    const db = adminDb();

    const resultsRef = db.collection('settings').doc('results');
    const resSnap = await resultsRef.get();
    const results = resSnap.exists ? resSnap.data() : {};
    if (!results.games) results.games = {};

    let changed = false;
    for (const m of matches) {
      if (m.status !== 'FINISHED') continue;
      const h = m.score?.fullTime?.home;
      const a = m.score?.fullTime?.away;
      if (h == null || a == null) continue;
      const gid = fixtureToGameId(m);
      if (!gid) {
        console.warn(`scoring: could not map finished fixture ${m.homeTeam?.name} v ${m.awayTeam?.name} @ ${m.utcDate}`);
        continue;
      }
      const prev = results.games[gid];
      if (!prev || prev.home !== h || prev.away !== a || !prev.confirmed) {
        results.games[gid] = { home: h, away: a, confirmed: true };
        changed = true;
      }
    }
    if (changed) await resultsRef.set({ games: results.games }, { merge: true });

    // Recompute global scores.
    const fullResults = {
      games:     results.games,
      champion:  results.champion  || '',
      runnerUp:  results.runnerUp  || '',
      topScorer: results.topScorer || '',
    };
    const predsSnap = await db.collection('user_predictions').get();
    const scoreByUid = {};
    predsSnap.forEach(d => { scoreByUid[d.id] = calculateScore(d.data() || {}, fullResults); });

    // Mirror onto participations (chunked into ≤400-write batches).
    const partSnap = await db.collection('bolao_participants').get();
    const updates = [];
    partSnap.forEach(d => {
      const p = d.data();
      const s = scoreByUid[p.uid];
      if (!s) return;
      if (p.points === s.points && p.exactScores === s.exactScores && p.correctResults === s.correctResults) return;
      updates.push([d.ref, { points: s.points, exactScores: s.exactScores, correctResults: s.correctResults }]);
    });
    for (let i = 0; i < updates.length; i += 400) {
      const batch = db.batch();
      updates.slice(i, i + 400).forEach(([ref, data]) => batch.set(ref, data, { merge: true }));
      await batch.commit();
    }
    if (changed || updates.length) {
      console.log(`scoring: results ${changed ? 'updated' : 'unchanged'}, ${updates.length} participant doc(s) rescored`);
    }
  } catch (e) {
    console.error('syncResultsAndScore error:', e.message);
  } finally {
    scoringBusy = false;
  }
}

// Manual rescore trigger (admin only) — handy right after entering champion/etc.
app.post('/api/admin/sync', async (req, res) => {
  if (!adminReady) return res.status(503).json({ error: 'Server not configured' });
  let decoded;
  try { decoded = await verifyUser(req); }
  catch (e) { return res.status(e.status || 401).json({ error: 'Unauthorized' }); }
  if (!ADMIN_EMAILS.length || !ADMIN_EMAILS.includes((decoded.email || '').toLowerCase())) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  syncResultsAndScore();
  res.json({ ok: true, started: true });
});

// ─── Proxy endpoint ───────────────────────────────────────────────────────────
// Frontend calls: /api/matches?season=2026
// Proxy fetches:  https://v3.football.api-sports.io/fixtures?league=1&season=2026
// and normalises the response into the shape the frontend expects.
app.get('/api/matches', async (req, res) => {
  const API_KEY = readApiKey();
  if (!API_KEY) {
    return res.status(503).json({ error: 'API_FOOTBALL_KEY not configured' });
  }

  const season = req.query.season || '2026';

  try {
    const { matches, cache } = await getMatches(season, API_KEY);
    res.set('x-proxy-cache', cache);
    res.json({ matches });
  } catch (err) {
    // Resilience: if api-football errors (including a quota wipe-out caused by
    // the *other* site), serve the last known fixtures rather than failing the
    // page. Better a couple of minutes stale than blank.
    const stale = matchesCache.get(season);
    if (stale) {
      res.set('x-proxy-cache', 'stale');
      return res.json({ matches: stale.matches });
    }
    res.status(err.status || 502).json({ error: 'Upstream request failed', detail: err.detail || err.message });
  }
});

// ─── Strip .html — redirect /foo.html → /foo ─────────────────────────────────
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const clean = req.path.slice(0, -5) || '/';
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, clean + qs);
  }
  next();
});

// ─── Clean URLs (no .html required) ──────────────────────────────────────────
// /profile → profile.html, /games → games.html, etc.
const HTML_PAGES = ['login', 'dashboard', 'bolao', 'join', 'profile', 'games', 'ranking', 'admin', 'terms', 'privacy', 'cookies', 'rules', 'seed', 'blog', 'about'];
HTML_PAGES.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `${page}.html`));
  });
});

// ─── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(__dirname));

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏆 PitaCopa server running at http://localhost:${PORT}`);
  console.log(`   API proxy: http://localhost:${PORT}/api/matches?season=2026`);
  const key = readApiKey();
  if (key) {
    console.log(`   api-football.com key: ${key.slice(0,6)}…${key.slice(-4)} ✓`);
  } else {
    console.log(`   ⚠️  No API_FOOTBALL_KEY found — set env var or add to js/config.js`);
  }
  console.log(`   schedule: ${Object.keys(SCHEDULE).length} games parsed`);
  console.log(`   firebase-admin: ${adminReady ? 'ready ✓' : 'NOT configured ✗ (set FIREBASE_SERVICE_ACCOUNT)'}`);
  console.log('');

  // Results-sync + scoring loop. The 5-min tick is cheap (date math); it only does
  // the real work (api fetch + Firestore reads/scoring) when a match is in its
  // scoring window — from kickoff until ~4h later — so nothing runs overnight,
  // between match days, or before the tournament starts. Out-of-window result
  // entry (e.g. champion after the final) is handled by the admin "rescore" button.
  if (adminReady) {
    const tick = () => { if (isWithinMatchWindow()) syncResultsAndScore(); };
    tick();                                   // catch a restart mid-match
    setInterval(tick, 5 * 60 * 1000);
  }
});
