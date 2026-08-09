import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { getRoom, serializeRoom } from "../../../../lib/realtime/race";
import { raceRouteError } from "../route-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
    const db = await getDb();
    const room = await getRoom(db, code.toUpperCase());
    if (!room) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, room: serializeRoom(room) });
  } catch (error) {
    return raceRouteError(error);
  }
}
