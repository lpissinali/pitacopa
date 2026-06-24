/**
 * swap-predictions.js
 *
 * Swaps home/away prediction values in Firestore's user_predictions collection
 * for match IDs whose home/away teams were inverted in wc2026.js across the
 * last 5 commits (e6fe595, 57553a0, 48a1acf, 48b8b50, 6aab6c1).
 *
 * Only affects users whose updatedAt is BEFORE the last fixing commit was
 * deployed (2026-06-23T19:21:58Z). Users who re-saved predictions after the
 * fix was live already saw the correct team labels and should not be swapped.
 *
 * Run from the project root:
 *   node scripts/swap-predictions.js [--dry-run]
 *
 * With --dry-run it prints what would change without writing to Firestore.
 */

'use strict';

const admin  = require('firebase-admin');
const path   = require('path');
const fs     = require('fs');

// Affected match IDs (from git diff across last 5 commits)
const SWAPPED_IDS = new Set([
  'G004', 'G005', 'G010', 'G011', 'G016', 'G017',
  'G022', 'G023', 'G028', 'G029', 'G034', 'G035',
  'G040', 'G041', 'G046', 'G047', 'G052', 'G053',
  'G058', 'G059', 'G064', 'G065', 'G070', 'G071',
]);

// Cutoff: last fixing commit (6aab6c1) at 2026-06-23T19:21:58Z
// Users who saved predictions AFTER this saw correct team labels already.
const CUTOFF_MS = new Date('2026-06-23T19:21:58Z').getTime();

// Init Firebase Admin
const keyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('serviceAccountKey.json not found at', keyPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath)),
  projectId:  'pitacopa-a2cea',
});

const db      = admin.firestore();
const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) console.log('DRY RUN -- no writes will be made\n');
console.log('Cutoff: ' + new Date(CUTOFF_MS).toISOString() + ' -- skipping users who updated after this\n');

async function main() {
  const col  = db.collection('user_predictions');
  const snap = await col.get();

  console.log('Found ' + snap.size + ' user_predictions documents\n');

  let totalUsers   = 0;
  let totalSwaps   = 0;
  let totalSkipped = 0;
  const BATCH_MAX  = 400;

  let batch      = db.batch();
  let batchOps   = 0;
  let batchCount = 0;

  async function commitBatch() {
    if (batchOps === 0) return;
    if (!DRY_RUN) await batch.commit();
    batchCount++;
    console.log('  Batch #' + batchCount + ' committed (' + batchOps + ' writes)');
    batch    = db.batch();
    batchOps = 0;
  }

  for (const doc of snap.docs) {
    const uid   = doc.id;
    const data  = doc.data();
    const games = data.games || {};

    // Skip users who updated predictions after the fix was deployed
    const updatedAt = data.updatedAt;
    if (updatedAt) {
      const updatedMs = updatedAt.toMillis ? updatedAt.toMillis() : new Date(updatedAt).getTime();
      if (updatedMs >= CUTOFF_MS) {
        console.log('  SKIP uid=' + uid + '  updatedAt=' + new Date(updatedMs).toISOString() + ' >= cutoff');
        totalSkipped++;
        continue;
      }
    }

    const swapsForUser = [];

    for (const gid of SWAPPED_IDS) {
      const pred = games[gid];
      if (pred === undefined || pred === null) continue;

      const home = pred.home;
      const away = pred.away;

      // Skip if both values are empty (no prediction entered)
      if ((home === '' || home == null) && (away === '' || away == null)) continue;

      swapsForUser.push({ gid, beforeHome: home, beforeAway: away });
    }

    if (swapsForUser.length === 0) continue;

    totalUsers++;
    totalSwaps += swapsForUser.length;

    // Build update payload -- only touch affected fields
    const update = {};
    for (const { gid, beforeHome, beforeAway } of swapsForUser) {
      update['games.' + gid + '.home'] = beforeAway;
      update['games.' + gid + '.away'] = beforeHome;
      console.log('  uid=' + uid + '  ' + gid + ': ' + beforeHome + '-' + beforeAway + ' -> ' + beforeAway + '-' + beforeHome);
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, update);
      batchOps++;
      if (batchOps >= BATCH_MAX) await commitBatch();
    }
  }

  await commitBatch();

  console.log('\n-- Summary --');
  console.log('Users skipped  : ' + totalSkipped + ' (updated after cutoff)');
  console.log('Users affected : ' + totalUsers);
  console.log('Total swaps    : ' + totalSwaps);
  if (DRY_RUN) {
    console.log('\nDRY RUN -- run without --dry-run to apply changes');
  } else {
    console.log('\nDone. Restart the server to trigger re-scoring.');
  }

  process.exit(0);
}

main().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
