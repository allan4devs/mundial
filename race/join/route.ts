import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { joinRoom, serializeRoom } from "../../../../lib/realtime/race";
import { raceRouteError, readRaceBody } from "../route-utils";

export async function POST(request: Request) {
  try {
    const body = await readRaceBody(request);
    const { code, playerId, name } = body;
    if (!code || !playerId || !name) return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
    const db = await getDb();
    const result = await joinRoom(db, code.toUpperCase().trim(), playerId, name);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, room: serializeRoom(result.room!) });
  } catch (error) {
    return raceRouteError(error);
  }
}
