import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { movePlayer, serializeGame } from "../../../../lib/realtime/game";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { gameId, visitorId, toSegment } = body;
  if (!gameId || !visitorId || typeof toSegment !== "number") return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  const db = await getDb();
  const state = await movePlayer(db, gameId, visitorId, toSegment);
  return NextResponse.json({ ok: true, state: serializeGame(state) });
}
