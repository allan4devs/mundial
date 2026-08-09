import assert from "node:assert/strict";
import { serializePublicLeaderboard } from "../lib/scores/public-serialization.ts";

const serialized = serializePublicLeaderboard([
  {
    userId: "507f1f77bcf86cd799439011",
    playerName: "Ana",
    totalPoints: 7,
    totalPredictions: 3,
    exactScores: 2,
    correctOutcomes: 3,
    hitRate: 1,
  },
]);

assert.equal(serialized.length, 1);
assert.equal(serialized[0].playerName, "Ana");
assert.equal("userId" in serialized[0], false, "public leaderboard strips internal userId");

console.log("scores privacy tests: OK");
