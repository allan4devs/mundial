// app/api/mundial/penalitos/route.ts
// GET current state snapshot (non-streaming). Used for debugging / admin.
// Real-time clients connect to /api/mundial/penalitos/live (SSE).
import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { ensureState, serializeState, tickState } from "@/lib/mundial/penalitos";
import { notifyPenalitosChanged } from "@/lib/mundial/penalitos-events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    await ensureState(db);
    await tickState(db);
    const state = await ensureState(db);
    return NextResponse.json(serializeState(state));
  } catch (err) {
    console.error("penalitos GET error", err);
    return NextResponse.json({ error: "Error al leer estado" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = await getDb();
    await db.collection("penalitos_state").deleteOne({ _id: "active" } as any);
    notifyPenalitosChanged();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("penalitos DELETE error", err);
    return NextResponse.json({ error: "Error al resetear" }, { status: 500 });
  }
}
