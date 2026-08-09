import { NextRequest, NextResponse } from "next/server";
import type { ObjectId } from "mongodb";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  readMatches,
  readCompetitions,
  serializeMatch,
  buildLeaderboard,
  requireAdmin,
  isAdminResult,
  type PredictionDoc,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (isAdminResult(admin)) return admin;

  try {
    const db = await getScoresDb();
    const now = new Date();
    const [matches, competitions, preds] = await Promise.all([
      readMatches(db),
      readCompetitions(db, true),
      db.collection<PredictionDoc & { _id: ObjectId }>(SCORES_COLLECTIONS.PREDICTIONS).find({}).toArray(),
    ]);

    const serialized = matches.map((m) => serializeMatch(m, now));
    const leaderboard = buildLeaderboard(
      serialized,
      preds.map((p) => ({
        matchId: p.matchId,
        userId: p.userId,
        playerName: p.displayNameSnapshot || p.playerName || "?",
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        scoring: p.scoring,
      }))
    );

    return NextResponse.json({
      admin: { id: admin.id, username: admin.username },
      competitions,
      matches: serialized,
      predictionCount: preds.length,
      leaderboard,
    });
  } catch (error) {
    console.error("[scores/admin]", error);
    return NextResponse.json({ error: "Error cargando admin." }, { status: 500 });
  }
}
