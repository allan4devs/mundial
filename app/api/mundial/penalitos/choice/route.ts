// app/api/mundial/penalitos/choice/route.ts
// POST { visitorId, choice } — record goalkeeper or shooter direction choice.
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import {
  getState,
  PENALITOS_COLLECTION,
  PENALITOS_STATE_ID,
  serializeState,
  tickState,
  type PenalitosDirection,
} from "@/lib/mundial/penalitos";
import { notifyPenalitosChanged } from "@/lib/mundial/penalitos-events";
import { isBanned } from "@/lib/mundial/bans";

export const dynamic = "force-dynamic";

const VALID_CHOICES = new Set<PenalitosDirection>(["left", "center", "right"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { visitorId?: unknown; choice?: unknown };
    const { visitorId, choice } = body;

    if (typeof visitorId !== "string" || visitorId.length < 4) {
      return NextResponse.json({ error: "visitorId inválido" }, { status: 400 });
    }
    if (!VALID_CHOICES.has(choice as PenalitosDirection)) {
      return NextResponse.json({ error: "choice inválido" }, { status: 400 });
    }

    const db = await getDb();
    const ban = await isBanned(db, null, visitorId);
    if (ban) return NextResponse.json({ error: "Cuenta suspendida.", banned: true }, { status: 403 });

    const state = await getState(db);

    if (!state?.game || state.game.status !== "choosing") {
      return NextResponse.json({ error: "No hay ronda activa" }, { status: 409 });
    }

    const { game } = state;
    const isGoalkeeper = game.goalkeeper?.visitorId === visitorId;
    const isShooter = game.shooter?.visitorId === visitorId;

    if (!isGoalkeeper && !isShooter) {
      return NextResponse.json({ error: "No eres jugador en esta ronda" }, { status: 403 });
    }

    const field = isGoalkeeper ? "game.goalkeeperChoice" : "game.shooterChoice";
    const existing = isGoalkeeper ? game.goalkeeperChoice : game.shooterChoice;

    if (existing !== null) {
      return NextResponse.json({ ok: true, status: "already_chose" });
    }

    const now = new Date();
    const result = await db.collection(PENALITOS_COLLECTION).updateOne(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { _id: PENALITOS_STATE_ID as any, "game.status": "choosing", "game.id": game.id, [field]: null },
      { $set: { [field]: choice, updatedAt: now }, $inc: { version: 1 } }
    );

    await tickState(db);
    if (result.modifiedCount > 0) notifyPenalitosChanged();

    return NextResponse.json({ ok: true, choice, ...serializeState(await getState(db)) });
  } catch (err) {
    console.error("penalitos/choice error", err);
    return NextResponse.json({ error: "Error al registrar elección" }, { status: 500 });
  }
}
