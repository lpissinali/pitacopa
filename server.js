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

// ─── Proxy endpoint ───────────────────────────────────────────────────────────
// Frontend calls: /api/matches?season=2026
// Proxy fetches:  https://v3.football.api-sports.io/fixtures?league=1&season=2026
// and normalises the response into the shape the frontend expects.
app.get('/api/matches', async (req, res) => {
  const API_KEY = readApiKey();
  if (!API_KEY) {
    return res.status(503).json({ error: 'API_FOOTBALL_KEY not configured' });
  }

  const season   = req.query.season || '2026';
  const upstream = `https://v3.football.api-sports.io/fixtures?league=1&season=${season}`;

  try {
    const upstream_res = await fetch(upstream, {
      headers: {
        'x-apisports-key': API_KEY,
      }
    });
    const data = await upstream_res.json();

    if (!upstream_res.ok) {
      return res.status(upstream_res.status).json({ error: 'Upstream error', detail: data });
    }

    const fixtures = data.response || [];
    const matches  = fixtures.map(normaliseFixture);

    res.json({ matches });
  } catch (err) {
    res.status(502).json({ error: 'Upstream request failed', detail: err.message });
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
