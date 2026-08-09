import { NextResponse } from "next/server";

import { getScoresDb, readCompetitions, ensureScoresData } from "@/lib/scores";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getScoresDb();
    await ensureScoresData(db);
    await db.command({ ping: 1 });
    const competitions = await readCompetitions(db, true);
    const stale = competitions.filter((c) => c.syncHealth === "stale" || c.syncHealth === "error");

    return NextResponse.json({
      ok: true,
      competitions: competitions.length,
      unhealthy: stale.map((c) => ({ id: c.id, health: c.syncHealth })),
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[scores/health]", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Scores health check failed.",
      },
      { status: 500 }
    );
  }
}
