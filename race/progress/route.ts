import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongo";
import { updateProgress } from "../../../../lib/realtime/race";
import { raceRouteError, readRaceBody } from "../route-utils";

export async function POST(request: Request) {
  try {
    const body = await readRaceBody(request);
    const { code, playerId, pct, x, y } = body;
    if (!code || !playerId || typeof pct !== "number") {
      return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
    }
    const db = await getDb();
    await updateProgress(
      db,
      code.toUpperCase(),
      playerId,
      pct,
      typeof x === "number" ? x : undefined,
      typeof y === "number" ? y : undefined
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return raceRouteError(error);
  }
}
