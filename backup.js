/**
 * PitaCopa — Firestore Backup Script
 *
 * Exports every document in every collection to a timestamped JSON file.
 *
 * Setup (one-time):
 *   1. Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → save as serviceAccountKey.json
 *      in this folder (D:\Work\pitacopa\)
 *   3. npm install firebase-admin   (only needed once)
 *
 * Run:
 *   node backup.js
 *
 * Output:
 *   backup-2026-05-26T14-30-00.json   (one file per run, in this folder)
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// ── Load service account key ──────────────────────────────────────────────────
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('❌  serviceAccountKey.json not found.');
  console.error('   Download it from: Firebase Console → Project Settings → Service Accounts');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath)),
  projectId:  'pitacopa-a2cea',
});

const db = admin.firestore();

// ── Collections to back up ────────────────────────────────────────────────────
const COLLECTIONS = [
  'users',
  'boloes',
  'bolao_participants',
  'bolao_predictions',
  'user_predictions',
  'settings',
  'moderation_log',
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function backup() {
  const result = {};
  let totalDocs = 0;

  for (const col of COLLECTIONS) {
    process.stdout.write(`  Backing up "${col}"... `);
    try {
      const snap = await db.collection(col).get();
      result[col] = {};
      snap.forEach(docSnap => {
        result[col][docSnap.id] = docSnap.data();
      });
      const count = snap.size;
      totalDocs += count;
      console.log(`${count} docs`);
    } catch (err) {
      console.log(`skipped (${err.message})`);
    }
  }

  // Write output file
  const ts       = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outFile  = path.join(__dirname, `backup-${ts}.json`);
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8');

  console.log(`\n✅  Backup complete: ${totalDocs} documents`);
  console.log(`   Saved to: ${outFile}`);
}

backup().catch(err => {
  console.error('❌  Backup failed:', err.message);
  process.exit(1);
});
