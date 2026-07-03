/**
 * add-result.js
 *
 * Writes a confirmed match score to settings/results in Firestore, then
 * rescores ALL users from their predictions — without calling api-football.
 *
 * Useful when the API quota is exhausted and syncResultsAndScore() can't run.
 *
 * Usage:
 *   node scripts/add-result.js <gameId> <homeGoals> <awayGoals> [--dry-run]
 *
 * Example:
 *   node scripts/add-result.js R32-11 3 0
 *
 * With --dry-run it prints what would change without writing to Firestore.
 */

'use strict';

const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');
const { calculateScore } = require('../js/scoring');

// ── Args ──────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2).filter(a => a !== '--dry-run');
const DRY_RUN = process.argv.includes('--dry-run');

if (args.length < 3) {
  console.error('Usage: node scripts/add-result.js <gameId> <homeGoals> <awayGoals> [--dry-run]');
  console.error('Example: node scripts/add-result.js R32-11 3 0');
  process.exit(1);
}

const GAME_ID   = args[0];
const HOME_GOALS = parseInt(args[1], 10);
const AWAY_GOALS = parseInt(args[2], 10);

if (isNaN(HOME_GOALS) || isNaN(AWAY_GOALS)) {
  console.error('homeGoals and awayGoals must be integers');
  process.exit(1);
}

console.log(`Game: ${GAME_ID}  Score: ${HOME_GOALS}-${AWAY_GOALS}${DRY_RUN ? '  [DRY RUN]' : ''}\n`);

// ── Firebase ──────────────────────────────────────────────────────────────────
const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('serviceAccountKey.json not found at', keyPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath)),
  projectId:  'pitacopa-a2cea',
});

const db = admin.firestore();

async function main() {
  // 1. Read current results
  const resultsRef = db.collection('settings').doc('results');
  const resSnap    = await resultsRef.get();
  const results    = resSnap.exists ? resSnap.data() : {};
  if (!results.games) results.games = {};

  const prev = results.games[GAME_ID];
  if (prev && prev.home === HOME_GOALS && prev.away === AWAY_GOALS && prev.confirmed) {
    console.log(`Score for ${GAME_ID} already set to ${HOME_GOALS}-${AWAY_GOALS} and confirmed — no change needed.`);
  } else {
    console.log(`Writing ${GAME_ID}: ${HOME_GOALS}-${AWAY_GOALS} (confirmed: true)`);
    results.games[GAME_ID] = { home: HOME_GOALS, away: AWAY_GOALS, confirmed: true };
    if (!DRY_RUN) {
      await resultsRef.set({ games: results.games }, { merge: true });
      console.log('  ✓ Written to Firestore\n');
    } else {
      console.log('  [DRY RUN] would write to Firestore\n');
    }
  }

  // 2. Rescore all users
  const fullResults = {
    games:     results.games,
    champion:  results.champion  || '',
    runnerUp:  results.runnerUp  || '',
    topScorer: results.topScorer || '',
  };

  const predsSnap = await db.collection('user_predictions').get();
  console.log(`Rescoring ${predsSnap.size} users…`);

  const scoreByUid = {};
  predsSnap.forEach(d => {
    scoreByUid[d.id] = calculateScore(d.data() || {}, fullResults);
  });

  // 3. Mirror onto bolao_participants
  const partSnap = await db.collection('bolao_participants').get();
  const updates  = [];

  partSnap.forEach(d => {
    const p = d.data();
    const s = scoreByUid[p.uid];
    if (!s) return;
    if (
      p.points         === s.points         &&
      p.exactScores    === s.exactScores     &&
      p.correctResults === s.correctResults
    ) return;
    updates.push([
      d.ref,
      { points: s.points, exactScores: s.exactScores, correctResults: s.correctResults },
      p,
      s,
    ]);
  });

  console.log(`${updates.length} participant doc(s) need updating\n`);

  if (!DRY_RUN) {
    const BATCH_MAX = 400;
    let batchCount = 0;
    for (let i = 0; i < updates.length; i += BATCH_MAX) {
      const batch = db.batch();
      updates.slice(i, i + BATCH_MAX).forEach(([ref, data]) => {
        batch.set(ref, data, { merge: true });
      });
      await batch.commit();
      batchCount++;
      console.log(`  Batch #${batchCount} committed (${Math.min(BATCH_MAX, updates.length - i)} writes)`);
    }
  } else {
    updates.forEach(([, data, prev, next]) => {
      console.log(`  [DRY RUN] uid=${data.uid ?? '?'}  points: ${prev.points} → ${next.points}  exact: ${prev.exactScores} → ${next.exactScores}`);
    });
  }

  console.log('\n── Summary ──');
  console.log(`Game result written : ${GAME_ID} = ${HOME_GOALS}-${AWAY_GOALS}`);
  console.log(`Participants rescored: ${updates.length}`);
  if (DRY_RUN) console.log('\n[DRY RUN] No changes written. Run without --dry-run to apply.');
  else console.log('\nDone.');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
