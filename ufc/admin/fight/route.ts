import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";

export const dynamic = "force-dynamic";

const FIGHTS_COLLECTION = "ufc_fights";

type CornerPick = "red" | "blue" | null;
type MethodPick = "ko_tko" | "submission" | "decision" | null;

class ApiError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const fightId = String(body.fightId ?? "").trim();
    if (!fightId) throw new ApiError("fightId requerido.");

    const db = await getDb();
    const fights = db.collection(FIGHTS_COLLECTION);

    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if ("winnerCorner" in body) {
      const v = body.winnerCorner;
      patch.winnerCorner = (v === "red" || v === "blue") ? (v as CornerPick) : null;
    }
    if ("method" in body) {
      const v = body.method;
      patch.method = (v === "ko_tko" || v === "submission" || v === "decision") ? (v as MethodPick) : null;
    }
    if ("endRound" in body) {
      patch.endRound = typeof body.endRound === "number" ? body.endRound : null;
    }
    if ("endTime" in body) {
      patch.endTime = body.endTime ? String(body.endTime) : null;
    }
    if ("liveStatus" in body) {
      const v = body.liveStatus;
      patch.liveStatus = (v === "live" || v === "finished") ? v : "scheduled";
    }
    if ("liveNote" in body) {
      patch.liveNote = String(body.liveNote ?? "");
    }
    if ("forceClosed" in body) {
      patch.forceClosed = Boolean(body.forceClosed);
    }

    const result = await fights.updateOne({ id: fightId }, { $set: patch });
    if (!result.matchedCount) throw new ApiError("Pelea no encontrada.", 404);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to patch UFC fight", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "No se pudo actualizar la pelea." }, { status: 500 });
  }
}
