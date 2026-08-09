import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  SCORES_COLLECTIONS,
  ensureScoresData,
  ensureIdentityIndexes,
  readViewer,
  cleanText,
  createInviteCode,
  inviteCodeHash,
  recordScoresAnalyticsEvent,
} from "@/lib/scores";

export const dynamic = "force-dynamic";

type PrivateLeagueDoc = {
  _id: ObjectId;
  name: string;
  ownerUserId: string;
  memberUserIds: string[];
  inviteCodeHash: string;
  inviteExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function serializeLeague(doc: PrivateLeagueDoc, userId: string) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    memberCount: doc.memberUserIds.length,
    owner: doc.ownerUserId === userId,
    inviteExpiresAt: doc.ownerUserId === userId ? doc.inviteExpiresAt.toISOString() : null,
  };
}

async function viewerFor(req: NextRequest) {
  const db = await getScoresDb();
  await Promise.all([ensureScoresData(db), ensureIdentityIndexes(db)]);
  const viewer = await readViewer(db, req);
  return { db, viewer };
}

export async function GET(req: NextRequest) {
  try {
    const { db, viewer } = await viewerFor(req);
    if (!viewer) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const docs = await db
      .collection<PrivateLeagueDoc>(SCORES_COLLECTIONS.PRIVATE_LEAGUES)
      .find({ memberUserIds: viewer.userId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({
      leagues: docs.map((doc) => serializeLeague(doc, viewer.userId)),
    });
  } catch (error) {
    console.error("[scores/private-leagues GET]", error);
    return NextResponse.json({ error: "No se pudieron cargar las ligas." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, viewer } = await viewerFor(req);
    if (!viewer) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const body = await req.json();
    const name = cleanText(body.name, 60);
    if (name.length < 3) {
      return NextResponse.json({ error: "Nombre de liga invalido." }, { status: 400 });
    }

    const code = createInviteCode();
    const now = new Date();
    const doc: PrivateLeagueDoc = {
      _id: new ObjectId(),
      name,
      ownerUserId: viewer.userId,
      memberUserIds: [viewer.userId],
      inviteCodeHash: inviteCodeHash(code),
      inviteExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000),
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<PrivateLeagueDoc>(SCORES_COLLECTIONS.PRIVATE_LEAGUES).insertOne(doc);
    await recordScoresAnalyticsEvent(db, "private_league_created", viewer.userId).catch(
      (error) => console.error("[scores/analytics private_league_created]", error)
    );

    return NextResponse.json(
      { league: serializeLeague(doc, viewer.userId), inviteCode: code },
      { status: 201 }
    );
  } catch (error) {
    console.error("[scores/private-leagues POST]", error);
    return NextResponse.json({ error: "No se pudo crear la liga." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { db, viewer } = await viewerFor(req);
    if (!viewer) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const body = await req.json();
    const code = cleanText(body.inviteCode, 80).toUpperCase();
    if (!code) return NextResponse.json({ error: "Codigo requerido." }, { status: 400 });

    const result = await db
      .collection<PrivateLeagueDoc>(SCORES_COLLECTIONS.PRIVATE_LEAGUES)
      .findOneAndUpdate(
        {
          inviteCodeHash: inviteCodeHash(code),
          inviteExpiresAt: { $gt: new Date() },
          $expr: { $lt: [{ $size: "$memberUserIds" }, 100] },
        },
        {
          $addToSet: { memberUserIds: viewer.userId },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after" }
      );
    if (!result) {
      return NextResponse.json({ error: "Codigo invalido, vencido o liga llena." }, { status: 404 });
    }
    await recordScoresAnalyticsEvent(db, "private_league_joined", viewer.userId).catch(
      (error) => console.error("[scores/analytics private_league_joined]", error)
    );

    return NextResponse.json({ league: serializeLeague(result, viewer.userId) });
  } catch (error) {
    console.error("[scores/private-leagues PUT]", error);
    return NextResponse.json({ error: "No se pudo unir a la liga." }, { status: 500 });
  }
}
