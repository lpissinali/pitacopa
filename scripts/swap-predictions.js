/**
 * swap-predictions.js
 *
 * Swaps home/away prediction values in Firestore's user_predictions collection
 * for match IDs whose home/away teams were inverted in wc2026.js across the
 * last 5 commits (e6fe595, 57553a0, 48a1acf, 48b8b50).
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

// ── Affected match IDs (from git diff across last 5 commits) ─────────────────
const SWAPPED_IDS = new Set([
  'G004',  // RSA ↔ CZE          (48a1acf)
  'G005',  // MEX ↔ CZE round 3  (48b8b50)
  'G010',  // BIH ↔ SUI          (e6fe595)
  'G011',  // CAN ↔ SUI round 3  (48b8b50)
  'G016',  // MAR ↔ SCO          (57553a0)
  'G017',  // BRA ↔ SCO round 3  (48b8b50)
  'G022',  // PAR ↔ TUR          (48a1acf)
  'G023',  // USA ↔ TUR round 3  (48b8b50)
  'G028',  // CUW ↔ ECU round 2  (48b8b50)
  'G029',  // GER ↔ ECU round 3  (48b8b50)
  'G034',  // JAP ↔ TUN round 2  (48b8b50)
  'G035',  // NLD ↔ TUN round 3  (48b8b50)
  'G040',  // EGY ↔ NZL round 2  (48b8b50)
  'G041',  // BEL ↔ NZL round 3  (48b8b50)
  'G046',  // CPV ↔ URU round 2  (48b8b50)
  'G047',  // ESP ↔ URU round 3  (48b8b50)
  'G052',  // SEN ↔ NOR round 2  (48b8b50)
  'G053',  // FRA ↔ NOR round 3  (48b8b50)
  'G058',  // ALG ↔ JOR round 2  (48b8b50)
  'G059',  // ARG ↔ JOR round 3  (48b8b50)
  'G064',  // COD ↔ COL round 2  (48b8b50)
  'G065',  // POR ↔ COL round 3  (48b8b50)
  'G070',  // CRO ↔ PAN round 2  (48b8b50)
  'G071',  // ENG ↔ PAN round 3  (48b8b50)
]);

// ── Init Firebase Admin ───────────────────────────────────────────────────────
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

if (DRY_RUN) console.log('🔍 DRY RUN — no writes will be made\n');

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const col  = db.collection('user_predictions');
  const snap = await col.get();

  console.log(`Found ${snap.size} user_predictions documents\n`);

  let totalUsers  = 0;
  let totalSwaps  = 0;
  const BATCH_MAX = 400; // Firestore batch limit is 500 ops, keep headroom

  let batch      = db.batch();
  let batchOps   = 0;
  let batchCount = 0;

  async function commitBatch() {
    if (batchOps === 0) return;
    if (!DRY_RUN) await batch.commit();
    batchCount++;
    console.log(`  ✅ Batch #${batchCount} committed (${batchOps} writes)`);
    batch   = db.batch();
    batchOps = 0;
  }

  for (const doc of snap.docs) {
    const uid  = doc.id;
    const data = doc.data();
    const games = data.games || {};

    const swapsForUser = [];

    for (const gid of SWAPPED_IDS) {
      const pred = games[gid];
      if (pred === undefined || pred === null) continue;

      const { home, away } = pred;

      // Skip if both values are empty strings (no prediction entered)
      if ((home === '' || home == null) && (away === '' || away == null)) continue;

      swapsForUser.push({ gid, before: { home, away }, after: { home: away, away: home } });
    }

    if (swapsForUser.length === 0) continue;

    totalUsers++;
    totalSwaps += swapsForUser.length;

    // Build the update payload — only touch the affected fields
    const update = {};
    for (const { gid, before, after } of swapsForUser) {
      update[`games.${gid}.home`] = after.home;
      update[`games.${gid}.away`] = after.away;
      console.log(`  uid=${uid}  ${gid}: ${before.home}-${before.away} → ${after.home}-${after.away}`);
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, update);
      batchOps++;
      if (batchOps >= BATCH_MAX) await commitBatch();
    }
  }

  await commitBatch();

  console.log(`\n── Summary ─────────────────────────────────────`);
  console.log(`Users affected : ${totalUsers}`);
  console.log(`Total swaps    : ${totalSwaps}`);
  if (DRY_RUN) {
    console.log(`\n⚠️  DRY RUN — run without --dry-run to apply changes`);
  } else {
    console.log(`\n✅ Done. Restart the server to trigger re-scoring.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
