// =============================================
// Scoring System — Bolão Copa 2026
// =============================================

const SCORING_RULES = {
  EXACT_SCORE: 3,       // Placar exato / Exact score
  CORRECT_RESULT: 1,    // Resultado certo (V/E/D) / Correct result
  CHAMPION: 10,         // Campeão / Champion
  RUNNER_UP: 5,         // Vice-campeão / Runner-up
  TOP_SCORER: 5,        // Artilheiro / Top scorer
};

/**
 * Calculate the result type from a score
 * Returns 'home', 'draw', or 'away'
 */
function getResult(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

/**
 * Calculate points for a single game prediction
 * @param {Object} prediction - { home: number, away: number }
 * @param {Object} result - { home: number, away: number }
 * @returns {{ points: number, exact: boolean, correct: boolean }}
 */
function scoreGame(prediction, result) {
  if (!prediction || result === null || result === undefined) {
    return { points: 0, exact: false, correct: false };
  }

  const predHome = parseInt(prediction.home ?? prediction.homeScore ?? -1);
  const predAway = parseInt(prediction.away ?? prediction.awayScore ?? -1);
  const resHome = parseInt(result.home ?? result.homeScore ?? -1);
  const resAway = parseInt(result.away ?? result.awayScore ?? -1);

  if (predHome < 0 || predAway < 0 || resHome < 0 || resAway < 0) {
    return { points: 0, exact: false, correct: false };
  }

  const exactScore = predHome === resHome && predAway === resAway;
  const correctResult = getResult(predHome, predAway) === getResult(resHome, resAway);

  let points = 0;
  if (exactScore) points += SCORING_RULES.EXACT_SCORE;
  else if (correctResult) points += SCORING_RULES.CORRECT_RESULT;

  return { points, exact: exactScore, correct: correctResult && !exactScore };
}

/**
 * Calculate total score for a participant
 * @param {Object} predictions - { games: {gameId: {home, away}}, champion, runnerUp, topScorer }
 * @param {Object} results - { games: {gameId: {home, away}}, champion, runnerUp, topScorer }
 * @returns {{ points: number, exactScores: number, correctResults: number, breakdown: Array }}
 */
function calculateScore(predictions, results) {
  let totalPoints = 0;
  let exactScores = 0;
  let correctResults = 0;
  const breakdown = [];

  // Game predictions
  if (predictions.games && results.games) {
    Object.entries(results.games).forEach(([gameId, result]) => {
      if (!result || !result.confirmed) return;
      const pred = predictions.games[gameId];
      const score = scoreGame(pred, result);
      totalPoints += score.points;
      if (score.exact) exactScores++;
      if (score.correct) correctResults++;
      breakdown.push({ gameId, ...score });
    });
  }

  // Champion
  if (results.champion && predictions.champion) {
    if (predictions.champion.toLowerCase() === results.champion.toLowerCase()) {
      totalPoints += SCORING_RULES.CHAMPION;
      breakdown.push({ type: 'champion', points: SCORING_RULES.CHAMPION });
    }
  }

  // Runner-up
  if (results.runnerUp && predictions.runnerUp) {
    if (predictions.runnerUp.toLowerCase() === results.runnerUp.toLowerCase()) {
      totalPoints += SCORING_RULES.RUNNER_UP;
      breakdown.push({ type: 'runnerUp', points: SCORING_RULES.RUNNER_UP });
    }
  }

  // Top scorer
  if (results.topScorer && predictions.topScorer) {
    if (predictions.topScorer.toLowerCase() === results.topScorer.toLowerCase()) {
      totalPoints += SCORING_RULES.TOP_SCORER;
      breakdown.push({ type: 'topScorer', points: SCORING_RULES.TOP_SCORER });
    }
  }

  return { points: totalPoints, exactScores, correctResults, breakdown };
}

/**
 * Rank participants by points
 * @param {Array} participants - [{ uid, name, points, exactScores, correctResults }]
 * @returns {Array} sorted with rank added
 */
function rankParticipants(participants) {
  const sorted = [...participants].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    return (b.correctResults || 0) - (a.correctResults || 0);
  });

  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0 && (sorted[i-1].points !== p.points || sorted[i-1].exactScores !== p.exactScores)) {
      rank = i + 1;
    }
    return { ...p, rank };
  });
}

/**
 * Get max possible points remaining
 */
function getMaxPossiblePoints(remainingGames) {
  return remainingGames * SCORING_RULES.EXACT_SCORE;
}

// Dual-mode export: in the browser these stay as globals (module is undefined);
// under Node (server.js) they become a CommonJS module.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SCORING_RULES,
    getResult,
    scoreGame,
    calculateScore,
    rankParticipants,
    getMaxPossiblePoints,
  };
}
