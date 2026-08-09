import { NextRequest, NextResponse } from "next/server";
import type { ObjectId } from "mongodb";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  readMatches,
  serializeMatch,
  isMatchClosed,
  toIso,
  buildLeaderboard,
  serializePublicLeaderboard,
  readViewer,
  ensureIdentityIndexes,
  ensureScoresData,
  type PredictionDoc,
} from "@/lib/scores";
import { PredictionsError, savePredictionForViewer } from "@/lib/scores/predictions-service";

export const dynamic = "force-dynamic";

/** GET — filtered predictions (own + closed public) + leaderboard */
export async function GET(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await ensureIdentityIndexes(db);
    const viewer = await readViewer(db, req);
    const now = new Date();
    const matches = await readMatches(db);
    const preds = await db
      .collection<PredictionDoc & { _id: ObjectId }>(SCORES_COLLECTIONS.PREDICTIONS)
      .find({})
      .toArray();
    const byId = new Map(matches.map((m) => [m.id, m]));
    const serialized = matches.map((m) => serializeMatch(m, now));

    const predictions = preds
      .filter((p) => {
        if (viewer && p.userId === viewer.userId) return true;
        const match = byId.get(p.matchId);
        return match ? isMatchClosed(match, now) : false;
      })
      .map((p) => {
        const match = byId.get(p.matchId);
        const closed = match ? isMatchClosed(match, now) : false;
        const isMine = viewer?.userId === p.userId;
        return {
          id: p._id.toString(),
          matchId: p.matchId,
          userId: isMine ? p.userId : undefined,
          playerName: p.displayNameSnapshot || p.playerName || "?",
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          locked: closed,
          lockedAt: closed ? toIso(p.lockedAt) : toIso(p.lockedAt),
          createdAt: toIso(p.createdAt),
          updatedAt: toIso(p.updatedAt),
          scoring: closed ? p.scoring ?? null : isMine ? p.scoring ?? null : null,
        };
      });

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
      viewer,
      matches: serialized,
      predictions,
      leaderboard: serializePublicLeaderboard(leaderboard),
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("[scores/predictions GET]", error);
    return NextResponse.json({ error: "No se pudo cargar la quiniela." }, { status: 500 });
  }
}

/** POST — save one prediction (legacy body with matchId) */
export async function POST(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await ensureScoresData(db);
    await ensureIdentityIndexes(db);
    const body = await req.json();
    const result = await savePredictionForViewer(db, req, {
      matchId: body.matchId,
      homeScore: body.homeScore,
      awayScore: body.awayScore,
      expectedUpdatedAt: body.expectedUpdatedAt,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PredictionsError) {
      return NextResponse.json(
        { error: error.message, ...error.extra },
        { status: error.status }
      );
    }
    console.error("[scores/predictions POST]", error);
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}
