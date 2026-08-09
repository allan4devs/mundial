import { NextRequest, NextResponse } from "next/server";

import {
  getScoresDb,
  ensureIdentityIndexes,
  readViewer,
  cleanText,
  recordScoresAnalyticsEvent,
} from "@/lib/scores";

export async function POST(req: NextRequest) {
  try {
    const db = await getScoresDb();
    await ensureIdentityIndexes(db);
    const viewer = await readViewer(db, req);
    if (!viewer) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const body = await req.json();
    if (body.event !== "share_pick") {
      return NextResponse.json({ error: "Evento invalido." }, { status: 400 });
    }
    await recordScoresAnalyticsEvent(db, "share_pick", viewer.userId, {
      matchId: cleanText(body.matchId, 100),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[scores/analytics]", error);
    return NextResponse.json({ error: "No se pudo registrar el evento." }, { status: 500 });
  }
}
