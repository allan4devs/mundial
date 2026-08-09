import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { joinGame, serializeGame } from "../../../../lib/realtime/game";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { gameId, visitorId, name } = body;
  if (!gameId || !visitorId || !name) return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  const db = await getDb();
  const state = await joinGame(db, gameId, visitorId, name);
  return NextResponse.json({ ok: true, state: serializeGame(state) });
}
