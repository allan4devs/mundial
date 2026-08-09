import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { ensureState, placeBet } from "@/lib/mundial/scorer";
import { notifyScorerChanged } from "@/lib/mundial/scorer-events";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { visitorId, playerName, pick, roundId } = body;

    if (typeof visitorId !== "string" || visitorId.length < 4 || visitorId.length > 64)
      return NextResponse.json({ error: "visitorId inválido" }, { status: 400 });
    if (typeof pick !== "string" || pick.trim().length === 0)
      return NextResponse.json({ error: "pick requerido" }, { status: 400 });
    if (typeof roundId !== "string")
      return NextResponse.json({ error: "roundId requerido" }, { status: 400 });

    const cleanName =
      typeof playerName === "string" && playerName.trim().length > 0
        ? playerName.trim().slice(0, 30)
        : visitorId.slice(0, 12);

    const db = await getDb();
    await ensureState(db);
    const result = await placeBet(db, roundId, visitorId, cleanName, pick.trim());

    if (result === "closed")
      return NextResponse.json({ error: "Ronda cerrada para apuestas" }, { status: 409 });

    notifyScorerChanged();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[scorer/bet] error", err);
    return NextResponse.json({ error: "Error al apostar" }, { status: 500 });
  }
}
