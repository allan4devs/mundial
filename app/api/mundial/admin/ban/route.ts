// app/api/mundial/admin/ban/route.ts
// Admin endpoints to list, apply, and remove bans.
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import {
  listActiveBans,
  banPlayer,
  unbanPlayer,
  getBan,
} from "@/lib/mundial/bans";

export const dynamic = "force-dynamic";

function normalizeKey(v: string) {
  return v.trim().toUpperCase();
}
function normalizeName(v: unknown) {
  return String(v ?? "").trim().replace(/\s+/g, " ");
}

// GET — list all active bans
export async function GET() {
  try {
    const db = await getDb();
    const bans = await listActiveBans(db);
    return NextResponse.json({ bans });
  } catch (err) {
    console.error("[admin/ban] GET error", err);
    return NextResponse.json({ error: "Error al listar bans." }, { status: 500 });
  }
}

// POST — ban a player
// Body: { playerName, visitorId?, reason, bannedBy? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      playerName?: unknown;
      visitorId?: unknown;
      reason?: unknown;
      bannedBy?: unknown;
    };

    const playerName = normalizeName(body.playerName);
    const normalizedName = normalizeKey(playerName);
    const reason = String(body.reason ?? "").trim().slice(0, 300);
    const bannedBy = String(body.bannedBy ?? "admin").trim().slice(0, 80);
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim() : "";

    if (!playerName) return NextResponse.json({ error: "playerName requerido." }, { status: 400 });
    if (!reason) return NextResponse.json({ error: "Motivo del ban requerido." }, { status: 400 });

    const db = await getDb();
    await banPlayer(db, {
      normalizedName,
      playerName,
      bannedBy,
      reason,
      visitorIds: visitorId ? [visitorId] : [],
    });

    return NextResponse.json({ ok: true, normalizedName });
  } catch (err) {
    console.error("[admin/ban] POST error", err);
    return NextResponse.json({ error: "Error al aplicar ban." }, { status: 500 });
  }
}

// DELETE — unban a player
// Body: { normalizedName }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as { normalizedName?: unknown };
    const normalizedName = String(body.normalizedName ?? "").trim().toUpperCase();
    if (!normalizedName) return NextResponse.json({ error: "normalizedName requerido." }, { status: 400 });

    const db = await getDb();
    const ban = await getBan(db, normalizedName);
    if (!ban) return NextResponse.json({ error: "Jugador no encontrado en bans." }, { status: 404 });

    await unbanPlayer(db, normalizedName);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/ban] DELETE error", err);
    return NextResponse.json({ error: "Error al quitar ban." }, { status: 500 });
  }
}
