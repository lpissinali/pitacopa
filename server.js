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
 *  Set env var API_FOOTBALL_KEY=<your key>  (Railway → Variables)
 *  or add  export const API_FOOTBALL_KEY = "xxx"  to js/config.js
 */

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

// ─── Normalise api-football.com fixture → football-data.org-compatible shape ──
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
    shortName: f.