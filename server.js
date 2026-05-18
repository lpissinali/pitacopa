/**
 * PitaCopa — Dev Server + football-data.org Proxy
 *
 * Run:  node server.js
 * Open: http://localhost:3000
 *
 * What it does:
 *  - Serves all static files (HTML, CSS, JS, img)
 *  - Proxies /api/matches → football-data.org (adds your API key server-side,
 *    bypassing the CORS restriction on the free tier)
 */

const express  = require('express');
const fetch    = require('node-fetch');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Read API key — env var takes priority, fallback to js/config.js ─────────
function readApiKey() {
  if (process.env.FOOTBALL_DATA_API_KEY) return process.env.FOOTBALL_DATA_API_KEY;
  try {
    const cfg = fs.readFileSync(path.join(__dirname, 'js', 'config.js'), 'utf8');
    const m   = cfg.match(/FOOTBALL_DATA_API_KEY\s*=\s*['"]([^'"]+)['"]/);
    return m ? m[1] : '';
  } catch { return ''; }
}

// ─── www → canonical redirect ─────────────────────────────────────────────────
// Redirects www.pitacopa.com → pitacopa.com (or any www.* → bare domain)
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
// Proxy forwards: https://api.football-data.org/v4/competitions/WC/matches?season=2026
app.get('/api/matches', async (req, res) => {
  const API_KEY = readApiKey();
  if (!API_KEY) {
    return res.status(503).json({ error: 'API key not configured in js/config.js' });
  }

  const season   = req.query.season || '2026';
  const upstream = `https://api.football-data.org/v4/competitions/WC/matches?season=${season}`;

  try {
    const upstream_res = await fetch(upstream, {
      headers: { 'X-Auth-Token': API_KEY }
    });
    const data = await upstream_res.json();

    // Pass through status + JSON
    res.status(upstream_res.status).json(data);
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
const HTML_PAGES = ['login', 'dashboard', 'bolao', 'join', 'profile', 'games', 'ranking', 'admin', 'terms', 'privacy', 'rules', 'seed'];
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
    console.log(`   football-data.org key: ${key.slice(0,6)}…${key.slice(-4)} ✓`);
  } else {
    console.log(`   ⚠️  No API key found in js/config.js`);
  }
  console.log('');
});
