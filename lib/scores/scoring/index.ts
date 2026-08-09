import type { Match, Prediction, LeaderboardEntry, Sport } from "../types";
import { scoreFootball } from "./football";
import { scoreBasketball } from "./basketball";
import type { ScoreResult } from "./types";

export type { ScoreResult } from "./types";
export { FOOTBALL_RULE_VERSION } from "./football";
export { BASKETBALL_RULE_VERSION } from "./basketball";

export function computePoints(
  match: Pick<Match, "homeScore" | "awayScore" | "sport" | "status">,
  pick: Pick<Prediction, "homeScore" | "awayScore">
): ScoreResult {
  if (match.status === "cancelled" || match.status === "postponed") {
    return { points: 0, exact: false, correctOutcome: false, ruleVersion: "void" };
  }
  if (match.homeScore == null || match.awayScore == null) {
    return { points: 0, exact: false, correctOutcome: false, ruleVersion: "pending" };
  }

  const sport: Sport = match.sport ?? "football";
  if (sport === "basketball") {
    return scoreBasketball(match.homeScore, match.awayScore, pick.homeScore, pick.awayScore);
  }
  return scoreFootball(match.homeScore, match.awayScore, pick.homeScore, pick.awayScore);
}

export function buildLeaderboard(
  matches: Array<Pick<Match, "id" | "homeScore" | "awayScore" | "sport" | "status" | "startsAt" | "kickoffAt">>,
  predictions: Array<{
    matchId: string;
    userId?: string;
    playerName: string;
    homeScore: number;
    awayScore: number;
    scoring?: ScoreResult | null;
  }>,
  opts?: { sport?: Sport; competitionIds?: Set<string>; fromMs?: number; toMs?: number; matchCompetition?: Map<string, string> }
): LeaderboardEntry[] {
  const byMatch = new Map(matches.map((m) => [m.id, m]));
  const byUser = new Map<string, LeaderboardEntry & { firstScoredAt?: number }>();

  for (const p of predictions) {
    const match = byMatch.get(p.matchId);
    if (!match) continue;
    if (opts?.sport && match.sport !== opts.sport) continue;
    if (opts?.competitionIds && opts.matchCompetition) {
      const cid = opts.matchCompetition.get(p.matchId);
      if (!cid || !opts.competitionIds.has(cid)) continue;
    }
    const start = new Date(match.startsAt || match.kickoffAt).getTime();
    if (opts?.fromMs != null && start < opts.fromMs) continue;
    if (opts?.toMs != null && start > opts.toMs) continue;

    const result =
      match.status !== "cancelled" &&
      match.status !== "postponed" &&
      p.scoring?.ruleVersion &&
      p.scoring.ruleVersion !== "pending"
        ? p.scoring
        : computePoints(match, p);
    if (result.ruleVersion === "pending" || result.ruleVersion === "void") continue;

    const userId = p.userId || p.playerName.toUpperCase();
    const row =
      byUser.get(userId) ??
      ({
        userId,
        playerName: p.playerName,
        totalPoints: 0,
        totalPredictions: 0,
        exactScores: 0,
        correctOutcomes: 0,
        hitRate: 0,
      } satisfies LeaderboardEntry);

    row.totalPoints += result.points;
    row.totalPredictions += 1;
    if (result.exact) row.exactScores += 1;
    if (result.correctOutcome) row.correctOutcomes += 1;
    byUser.set(userId, row);
  }

  const MIN_PICKS_FOR_RATE = 3;
  for (const row of byUser.values()) {
    row.hitRate =
      row.totalPredictions >= MIN_PICKS_FOR_RATE
        ? row.correctOutcomes / row.totalPredictions
        : 0;
  }

  return [...byUser.values()].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.exactScores - a.exactScores ||
      b.correctOutcomes - a.correctOutcomes ||
      b.hitRate - a.hitRate ||
      a.playerName.localeCompare(b.playerName)
  );
}
