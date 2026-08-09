import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { getGame, serializeGame } from "../../../../lib/realtime/game";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId");
  if (!gameId) return NextResponse.json({ ok: false, error: "missing gameId" }, { status: 400 });
  const db = await getDb();
  const state = await getGame(db, gameId);
  return NextResponse.json({ ok: true, state: serializeGame(state) });
}
