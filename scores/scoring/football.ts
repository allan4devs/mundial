import type { ScoreResult } from "./types";

export const FOOTBALL_RULE_VERSION = "football-v1";

export function scoreFootball(
  actualHome: number,
  actualAway: number,
  pickHome: number,
  pickAway: number
): ScoreResult {
  const exact = pickHome === actualHome && pickAway === actualAway;
  if (exact) {
    return { points: 3, exact: true, correctOutcome: true, ruleVersion: FOOTBALL_RULE_VERSION };
  }

  const actual =
    actualHome > actualAway ? "home" : actualAway > actualHome ? "away" : "draw";
  const predicted = pickHome > pickAway ? "home" : pickAway > pickHome ? "away" : "draw";
  const correctOutcome = actual === predicted;

  return {
    points: correctOutcome ? 1 : 0,
    exact: false,
    correctOutcome,
    ruleVersion: FOOTBALL_RULE_VERSION,
  };
}
