import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { leaveGame } from "../../../../lib/realtime/game";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { gameId, visitorId } = body;
  if (!gameId || !visitorId) return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  const db = await getDb();
  await leaveGame(db, gameId, visitorId);
  return NextResponse.json({ ok: true });
}
