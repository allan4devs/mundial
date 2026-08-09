import type { LeaderboardEntry } from "./types";

export function serializePublicLeaderboard(rows: LeaderboardEntry[]) {
  return rows.map((row) => ({
    playerName: row.playerName,
    totalPoints: row.totalPoints,
    totalPredictions: row.totalPredictions,
    exactScores: row.exactScores,
    correctOutcomes: row.correctOutcomes,
    hitRate: row.hitRate,
  }));
}
