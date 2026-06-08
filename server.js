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
  const score = {
    fullTime: {
      home: f.goals?.home  ?? null,
      away: f.goals?.away  ?? null,
    },
    halfTime: {
      home: f.score?.halftime?.home ?? null,
      away: f.score?.halftime?.away ?? null,
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

  return { utcDate, status, stage, group, homeTeam, awayTeam, score };
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
const HTML_PAGES = ['login', 'dashboard', 'bolao', 'join', 'profile', 'games', 'ranking', 'admin', 'terms', 'privacy', 'cookies', 'rules', 'seed'];
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
  console.log('');
});
