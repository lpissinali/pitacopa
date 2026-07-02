/**
 * swap-r32-11-12.js
 *
 * Swaps user_predictions entries for R32-11 and R32-12.
 *
 * Background: R32-11 was originally set to por vs cro and R32-12 to esp vs aut
 * in wc2026.js. The correct assignment is the opposite:
 *   R32-11 → esp vs aut (2 Jul 19:00 UTC)
 *   R32-12 → por vs cro (2 Jul 23:00 UTC)
 *
 * Users made predictions against what they saw in the UI. Since the display
 * was wrong from the start, ALL existing predictions for R32-11 are actually
 * for Portugal vs Croatia, and ALL for R32-12 are for Spain vs Austria.
 * We must exchange the two entries for every user who has either.
 *
 * No cutoff is applied — neither match has started, and the IDs were never
 * correctly assigned, so every prediction needs to be swapped.
 *
 * Run from the project root:
 *   node scripts/swap-r32-11-12.js [--dry-run]
 */

'use strict';

const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');

const ID_A = 'R32-11';
const ID_B = 'R32-12';

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

async function main() {
  const col  = db.collection('user_predictions');
  const snap = await col.get();

  console.log('Found ' + snap.size + ' user_predictions documents\n');

  let totalUsers = 0;
  let totalSkipped = 0;
  const BATCH_MAX = 400;

  let batch    = db.batch();
  let batchOps = 0;
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

    const predA = games[ID_A]; // what user entered for R32-11 (really por vs cro)
    const predB = games[ID_B]; // what user entered for R32-12 (really esp vs aut)

    // Skip if neither prediction exists
    if (predA === undefined && predB === undefined) {
      totalSkipped++;
      continue;
    }

    totalUsers++;

    // Build update: put predA under ID_B and predB under ID_A
    // If one side has no prediction, we write null to clear that slot
    const update = {};

    if (predA !== undefined) {
      update['games.' + ID_B] = predA;
      console.log('  uid=' + uid + '  ' + ID_A + ' → ' + ID_B + ': ' + JSON.stringify(predA));
    } else {
      update['games.' + ID_B] = admin.firestore.FieldValue.delete();
      console.log('  uid=' + uid + '  ' + ID_B + ' cleared (no ' + ID_A + ' prediction)');
    }

    if (predB !== undefined) {
      update['games.' + ID_A] = predB;
      console.log('  uid=' + uid + '  ' + ID_B + ' → ' + ID_A + ': ' + JSON.stringify(predB));
    } else {
      update['games.' + ID_A] = admin.firestore.FieldValue.delete();
      console.log('  uid=' + uid + '  ' + ID_A + ' cleared (no ' + ID_B + ' prediction)');
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, update);
      batchOps++;
      if (batchOps >= BATCH_MAX) await commitBatch();
    }
  }

  await commitBatch();

  console.log('\n-- Summary --');
  console.log('Users skipped (no predictions for either game): ' + totalSkipped);
  console.log('Users updated : ' + totalUsers);
  if (DRY_RUN) {
    console.log('\nDRY RUN -- run without --dry-run to apply changes');
  } else {
    console.log('\nDone. Deploy wc2026.js + restart server before matches kick off.');
  }

  process.exit(0);
}

main().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
