# PitaCopa — server-side predictions, locks & scoring

This adds a trusted server path for saving predictions and for scoring, so the
locks can't be bypassed from the browser.

## What changed

- **Saving predictions** now goes through `POST /api/predictions` (in `server.js`),
  authenticated with the user's Firebase ID token. The server enforces:
  - a game prediction is accepted **only before that match's kickoff**;
  - champion / runner-up / top-scorer are accepted **only before `PICKS_LOCK_MS`**
    (2026-06-12T03:00:00Z = midnight 12/06 in Brazil).
- **Scoring** runs on the server every 5 minutes (`syncResultsAndScore`): it pulls
  FINISHED fixtures from api-football, writes confirmed scores into
  `settings/results.games`, then recomputes every user's global score and mirrors
  `points / exactScores / correctResults` onto their `bolao_participants` docs.
- The **global ranking** (`ranking.html`) computes each user's score once from
  their predictions vs. the official results (fixes the old double-counting).
- **Firestore rules** must be deployed so clients can't write `user_predictions`,
  `settings`, or the scoring fields of `bolao_participants` (see
  `firestore-rules-snippet.txt`).

## Required setup (the server won't save or score until this is done)

1. **Service account key**
   Firebase console → ⚙ Project settings → *Service accounts* →
   **Generate new private key**. This downloads a JSON file.

2. **Railway variable**
   Railway → your PitaCopa service → *Variables* → add:
   - `FIREBASE_SERVICE_ACCOUNT` = the **entire** JSON, on one line.
   - (optional) `ADMIN_EMAILS` = `pissinali@gmail.com` — enables the manual
     rescore endpoint `POST /api/admin/sync`.
   `API_FOOTBALL_KEY` should already be set.

3. **Local dev**: put the same `FIREBASE_SERVICE_ACCOUNT=...` line in `.env`
   (already gitignored). Confirm `firebase-admin` is installed (`npm install`).

4. **Deploy the Firestore rules** from `firestore-rules-snippet.txt`
   (Firebase console → Firestore → Rules). **Check first whether you're still in
   test mode** — if so, the locks do nothing until real rules are deployed.

On boot, `server.js` logs `firebase-admin: ready ✓` when the key is picked up,
and how many games it parsed from the schedule.

## Notes

- The server is the source of truth for the clock, so changing your computer's
  time or editing the page can't unlock anything.
- `champion` / `runner-up` / `top-scorer` real results are still entered by the
  admin on the admin page; match scores come automatically from api-football.
