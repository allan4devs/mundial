import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

type FreeBetRequest = {
  playerKey?: string;
  playerName?: string;
  betId?: string;
  betTitle?: string;
  pick?: unknown;
};

function normalizeKey(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function isPremiumAdmin(playerKey: string) {
  return playerKey === "ALLAN";
}

async function hasPremium(playerKey: string) {
  if (isPremiumAdmin(playerKey)) return true;
  const db = await getDb();
  const record = await db.collection(COLLECTIONS.MUNDIAL_PREMIUM).findOne({ playerKey });
  return Boolean(record);
}

export async function POST(req: Request) {
  try {
    const body: FreeBetRequest = await req.json();
    const playerKey = normalizeKey(body.playerKey);
    const betId = String(body.betId ?? "").trim();

    if (!playerKey || !betId || body.pick === undefined) {
      return NextResponse.json({ ok: false, message: "Faltan datos del pick." }, { status: 400 });
    }

    if (!(await hasPremium(playerKey))) {
      return NextResponse.json({ ok: false, message: "Acceso premium requerido." }, { status: 403 });
    }

    const db = await getDb();
    const existing = await db.collection(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS).findOne({ playerKey, betId });
    if (existing) {
      return NextResponse.json({ ok: false, message: "Ya tenés un pick registrado para esta categoría." }, { status: 409 });
    }

    await db.collection(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS).insertOne({
      playerKey,
      playerName: body.playerName || playerKey,
      betId,
      betTitle: body.betTitle || betId,
      pick: body.pick,
      amountPaid: 0,
      currency: "USD",
      includedInPremium: true,
      paypalOrderId: null,
      paypalCaptureId: null,
      paidAt: new Date(),
      resolved: false,
      result: null,
    });

    return NextResponse.json({ ok: true, betId });
  } catch (error) {
    console.error("MUNDIAL PREMIUM-BETS free error:", error);
    return NextResponse.json({ ok: false, message: "No se pudo guardar el pick." }, { status: 500 });
  }
}
