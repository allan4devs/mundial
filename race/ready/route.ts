import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { setReady, serializeRoom } from "../../../../lib/realtime/race";
import { raceRouteError, readRaceBody } from "../route-utils";

export async function POST(request: Request) {
  try {
    const body = await readRaceBody(request);
    const { code, playerId, ready } = body;
    if (!code || !playerId || typeof ready !== "boolean") {
      return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
    }
    const db = await getDb();
    const room = await setReady(db, code.toUpperCase(), playerId, ready);
    return NextResponse.json({ ok: true, room: serializeRoom(room) });
  } catch (error) {
    return raceRouteError(error);
  }
}
