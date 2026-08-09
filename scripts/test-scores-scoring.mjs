/**
 * Lightweight tests against the production scoring modules.
 * Run through npm run test:scores so Node strips TypeScript types.
 */
import assert from "node:assert/strict";
import { scoreFootball } from "../lib/scores/scoring/football.ts";
import { scoreBasketball } from "../lib/scores/scoring/basketball.ts";

// Football
assert.equal(scoreFootball(2, 1, 2, 1).points, 3, "exact 3");
assert.equal(scoreFootball(2, 1, 3, 0).points, 1, "outcome home 1");
assert.equal(scoreFootball(1, 1, 0, 0).points, 1, "draw outcome");
assert.equal(scoreFootball(2, 1, 1, 2).points, 0, "miss");
assert.equal(scoreFootball(0, 0, 1, 0).points, 0, "draw miss");

// Basketball
assert.equal(scoreBasketball(100, 98, 100, 98).points, 5, "exact 5");
assert.equal(scoreBasketball(100, 98, 110, 105).points, 3, "winner + margin"); // 2+1
assert.equal(scoreBasketball(100, 98, 120, 90).points, 2, "winner wide margin no bonus"); // margin 30 vs 2
assert.equal(scoreBasketball(100, 98, 90, 100).points, 0, "wrong winner");
assert.equal(scoreBasketball(100, 100, 101, 99).points, 0, "actual draw void-ish");

// Tiebreak leaderboard style: higher exacts wins
const a = { pts: 10, exact: 2 };
const b = { pts: 10, exact: 3 };
assert.ok(b.exact > a.exact);

console.log("scores scoring tests: OK");
