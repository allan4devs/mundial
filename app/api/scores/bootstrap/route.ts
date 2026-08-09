import { NextRequest, NextResponse } from "next/server";
import type { ObjectId } from "mongodb";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureScoresData,
  ensureIdentityIndexes,
  readMatches,
  readCompetitions,
  serializeMatch,
  isMatchClosed,
  toIso,
  buildLeaderboard,
  serializePublicLeaderboard,
  readViewer,
  type PredictionDoc,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await ensureScoresData(db);
    await ensureIdentityIndexes(db);
    const now = new Date();
    const viewer = await readViewer(db, req);

    const [matches, competitions, preds] = await Promise.all([
      readMatches(db, { limit: 100 }),
      readCompetitions(db),
      db.collection<PredictionDoc & { _id: ObjectId }>(SCORES_COLLECTIONS.PREDICTIONS).find({}).toArray(),
    ]);

    const byId = new Map(matches.map((m) => [m.id, m]));
    const serialized = matches.map((m) => serializeMatch(m, now));

    const myPredictions = viewer
      ? preds
          .filter((p) => p.userId === viewer.userId)
          .map((p) => serializePred(p, byId.get(p.matchId), now, true))
      : [];

    const publicPredictions = preds
      .filter((p) => {
        if (viewer && p.userId === viewer.userId) return false;
        const match = byId.get(p.matchId);
        return match ? isMatchClosed(match, now) : false;
      })
      .map((p) => serializePred(p, byId.get(p.matchId), now, false));

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
    ).slice(0, 50);

    return NextResponse.json({
      viewer,
      competitions: competitions.map((c) => ({
        id: c.id,
        name: c.name,
        sport: c.sport,
        enabled: c.enabled,
        syncMode: c.syncMode,
        provider: c.provider,
        syncHealth: c.syncHealth,
        lastSyncedAt: toIso(c.lastSyncedAt),
      })),
      matches: serialized,
      myPredictions,
      publicPredictions,
      leaderboard: serializePublicLeaderboard(leaderboard),
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("[scores/bootstrap]", error);
    return NextResponse.json({ error: "No se pudo cargar scores." }, { status: 500 });
  }
}

function serializePred(
  doc: PredictionDoc & { _id: ObjectId },
  match: Parameters<typeof isMatchClosed>[0] | undefined,
  now: Date,
  isMine: boolean
) {
  const closed = match ? isMatchClosed(match, now) : false;
  return {
    id: doc._id.toString(),
    matchId: doc.matchId,
    userId: isMine ? doc.userId : undefined,
    playerName: doc.displayNameSnapshot || doc.playerName || "?",
    homeScore: doc.homeScore,
    awayScore: doc.awayScore,
    locked: closed,
    lockedAt: closed ? toIso(doc.lockedAt) : null,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
    scoring: closed ? doc.scoring ?? null : null,
  };
}
