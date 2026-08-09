import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { createRoom, getRoom, serializeRoom } from "../../../../lib/realtime/race";
import { raceRouteError, readRaceBody } from "../route-utils";

export async function POST(request: Request) {
  try {
    const body = await readRaceBody(request);
    const { hostId, name, levelIndex } = body;
    if (!hostId || !name) return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
    const db = await getDb();
    const code = await createRoom(db, hostId, name, levelIndex ?? 0);
    const room = await getRoom(db, code);
    return NextResponse.json({ ok: true, code, room: serializeRoom(room) });
  } catch (error) {
    return raceRouteError(error);
  }
}
