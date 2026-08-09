import { NextRequest, NextResponse } from "next/server";
import type { ObjectId } from "mongodb";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  readMatches,
  serializeMatch,
  buildLeaderboard,
  serializePublicLeaderboard,
  type PredictionDoc,
  type Sport,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sport = (searchParams.get("sport") as Sport) || undefined;
    const competitionId = searchParams.get("competitionId") || undefined;
    const period = searchParams.get("period") || "all";

    const db = await getScoresDb();
    const now = new Date();
    const matches = await readMatches(db);
    const preds = await db
      .collection<PredictionDoc & { _id: ObjectId }>(SCORES_COLLECTIONS.PREDICTIONS)
      .find({})
      .toArray();

    let fromMs: number | undefined;
    let toMs: number | undefined;
    if (period === "week") {
      fromMs = now.getTime() - 7 * 24 * 3600_000;
      toMs = now.getTime();
    } else if (period === "month") {
      fromMs = now.getTime() - 30 * 24 * 3600_000;
      toMs = now.getTime();
    }

    const serialized = matches.map((m) => serializeMatch(m, now));
    const matchCompetition = new Map(matches.map((m) => [m.id, m.competitionId]));
    const competitionIds = competitionId ? new Set([competitionId]) : undefined;

    const leaderboard = buildLeaderboard(
      serialized,
      preds.map((p) => ({
        matchId: p.matchId,
        userId: p.userId,
        playerName: p.displayNameSnapshot || p.playerName || "?",
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        scoring: p.scoring,
      })),
      { sport, competitionIds, fromMs, toMs, matchCompetition }
    );

    return NextResponse.json({
      leaderboard: serializePublicLeaderboard(leaderboard),
      period,
      sport: sport ?? null,
      competitionId: competitionId ?? null,
    });
  } catch (error) {
    console.error("[scores/leaderboard]", error);
    return NextResponse.json({ error: "No se pudo cargar ranking." }, { status: 500 });
  }
}
