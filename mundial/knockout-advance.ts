import type { Db } from "mongodb";

import { matchWinnerSide } from "./prediction-scoring";
import {
  MUNDIAL_KNOCKOUT_MATCHES_COLLECTION,
  MUNDIAL_MATCHES_COLLECTION,
  MUNDIAL_PREDICTIONS_COLLECTION,
  readMundialMatches,
} from "./matches-store";

export type AdvanceMatchDoc = {
  id: string;
  number: number;
  stage: string;
  homeTeam: string;
  awayTeam: string;
  homeSeed?: string | null;
  awaySeed?: string | null;
  homeFinalScore?: number | null;
  awayFinalScore?: number | null;
  actualWinner?: "home" | "away" | null;
};

const SEED_PATTERN = /^([WL])(\d+)$/i;
const PLACEHOLDER_TEAM_PATTERN = /^(Ganador|Perdedor)\s+(?:Partido\s+)?(\d+)$/i;

// A bracket slot fed by a previous match: W## / L## seed, or a
// "Ganador ##" / "Perdedor ##" placeholder name from the initial seed data.
function slotSource(seed: string | null | undefined, currentTeam: string) {
  const fromSeed = seed?.match(SEED_PATTERN);
  if (fromSeed) return { takesLoser: fromSeed[1].toUpperCase() === "L", number: Number(fromSeed[2]) };
  const fromName = currentTeam?.trim().match(PLACEHOLDER_TEAM_PATTERN);
  if (fromName) return { takesLoser: fromName[1].toLowerCase() === "perdedor", number: Number(fromName[2]) };
  return null;
}

function isPlaceholderName(team: string) {
  const trimmed = (team ?? "").trim();
  return !trimmed || PLACEHOLDER_TEAM_PATTERN.test(trimmed) || /^\d+(ro|do|to|er|°)?\s+Grupo/i.test(trimmed) || /^TBD$/i.test(trimmed);
}

/**
 * Pure core of the advancement algorithm: mutates the given match list in
 * memory, filling every slot fed by a previous match (W##/L## seeds or
 * "Ganador ##"/"Perdedor ##" names) with the decided winner/loser team.
 * Never resets a slot back to a placeholder, so manual team edits survive
 * until the source match has a decided result. Returns the changed match ids.
 */
export function computeKnockoutAdvancement(matches: AdvanceMatchDoc[]): Set<string> {
  const byNumber = new Map(matches.map((match) => [match.number, match]));
  const changedIds = new Set<string>();

  // Fixed-point loop so one call cascades through every later round.
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;

    for (const match of matches) {
      if (match.stage === "group") continue;

      for (const side of ["home", "away"] as const) {
        const seed = side === "home" ? match.homeSeed : match.awaySeed;
        const current = side === "home" ? match.homeTeam : match.awayTeam;
        const source = slotSource(seed, current);
        if (!source) continue;

        const sourceMatch = byNumber.get(source.number);
        if (!sourceMatch || sourceMatch.number === match.number) continue;

        const winnerSide = matchWinnerSide(sourceMatch);
        if (!winnerSide) continue;

        const advancingSide = source.takesLoser
          ? (winnerSide === "home" ? "away" : "home")
          : winnerSide;
        const advancing = advancingSide === "home" ? sourceMatch.homeTeam : sourceMatch.awayTeam;
        if (!advancing || isPlaceholderName(advancing) || advancing === current) continue;

        if (side === "home") match.homeTeam = advancing;
        else match.awayTeam = advancing;
        changedIds.add(match.id);
        changed = true;
      }
    }

    if (!changed) break;
  }

  return changedIds;
}

/**
 * Propagates decided knockout results through the bracket, using Mongo match
 * documents as the only source of truth: the decided winner (or loser, for
 * the third-place match) is written into the next round's team slots in both
 * match collections, and the denormalized prediction labels are refreshed.
 * Idempotent — only writes slots that actually change. Returns the
 * up-to-date match list.
 */
export async function propagateKnockoutAdvancement<T = AdvanceMatchDoc>(db: Db): Promise<T[]> {
  const matches = await readMundialMatches<AdvanceMatchDoc>(db);
  const changedIds = computeKnockoutAdvancement(matches);

  if (changedIds.size > 0) {
    const now = new Date();
    const collections = [
      db.collection(MUNDIAL_MATCHES_COLLECTION),
      db.collection(MUNDIAL_KNOCKOUT_MATCHES_COLLECTION),
    ];
    const predictions = db.collection(MUNDIAL_PREDICTIONS_COLLECTION);
    const matchesById = new Map(matches.map((match) => [match.id, match]));

    await Promise.all(
      [...changedIds].flatMap((id) => {
        const match = matchesById.get(id)!;
        const teams = { homeTeam: match.homeTeam, awayTeam: match.awayTeam };
        return [
          ...collections.map((collection) =>
            collection.updateOne({ id }, { $set: { ...teams, updatedAt: now } })
          ),
          predictions.updateMany(
            { matchId: id },
            { $set: { matchLabel: `${match.homeTeam} vs ${match.awayTeam}`, updatedAt: now } }
          ),
        ];
      })
    );
  }

  return matches as unknown as T[];
}
