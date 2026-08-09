import type { ScoreResult } from "./types";

export const BASKETBALL_RULE_VERSION = "basketball-v1";
const MARGIN_TOLERANCE = 5;

export function scoreBasketball(
  actualHome: number,
  actualAway: number,
  pickHome: number,
  pickAway: number
): ScoreResult {
  // No draws in basketball finals for MVP.
  if (actualHome === actualAway) {
    return { points: 0, exact: false, correctOutcome: false, ruleVersion: BASKETBALL_RULE_VERSION };
  }

  const exact = pickHome === actualHome && pickAway === actualAway;
  const actualWinner = actualHome > actualAway ? "home" : "away";
  const pickWinner = pickHome === pickAway ? null : pickHome > pickAway ? "home" : "away";
  const correctOutcome = pickWinner === actualWinner;

  let points = 0;
  if (exact) points = 5;
  else if (correctOutcome) points = 2;

  if (correctOutcome && !exact) {
    const actualMargin = Math.abs(actualHome - actualAway);
    const pickMargin = Math.abs(pickHome - pickAway);
    if (Math.abs(actualMargin - pickMargin) <= MARGIN_TOLERANCE) points += 1;
  }

  return {
    points,
    exact,
    correctOutcome,
    ruleVersion: BASKETBALL_RULE_VERSION,
  };
}
