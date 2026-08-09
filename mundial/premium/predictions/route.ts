import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

export const dynamic = "force-dynamic";

const STAGES = new Set(["round16", "quarterfinal", "semifinal", "thirdPlace", "final"]);
const MAX_TEXT = 80;
const MAX_NOTE = 220;

type PremiumPredictionInput = {
  stage?: unknown;
  slot?: unknown;
  teamA?: unknown;
  teamB?: unknown;
  scoreA?: unknown;
  scoreB?: unknown;
  winner?: unknown;
  confidence?: unknown;
  note?: unknown;
};

type PremiumPredictionDoc = {
  id: string;
  playerKey: string;
  playerName: string;
  stage: string;
  slot: number;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  winner: "teamA" | "teamB" | "";
  confidence: number | null;
  note: string;
  createdAt?: Date;
  updatedAt: Date;
};

function normalizeKey(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function isPremiumAdmin(playerKey: string) {
  return playerKey === "ALLAN";
}

function cleanText(value: unknown, max = MAX_TEXT) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function nullableInt(value: unknown, min = 0, max = 30) {
  if (value === "" || value === null || value === undefined) return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

function serialize(doc: PremiumPredictionDoc) {
  return {
    id: doc.id,
    playerKey: doc.playerKey,
    playerName: doc.playerName,
    stage: doc.stage,
    slot: doc.slot,
    teamA: doc.teamA,
    teamB: doc.teamB,
    scoreA: doc.scoreA,
    scoreB: doc.scoreB,
    winner: doc.winner,
    confidence: doc.confidence,
    note: doc.note,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

async function hasPremium(playerKey: string) {
  if (isPremiumAdmin(playerKey)) return true;

  const db = await getDb();
  const record = await db.collection(COLLECTIONS.MUNDIAL_PREMIUM).findOne({ playerKey });
  return Boolean(record);
}

function normalizePrediction(input: PremiumPredictionInput, playerKey: string, playerName: string): PremiumPredictionDoc | null {
  const stage = cleanText(input.stage, 32);
  const slot = Number(input.slot);
  if (!STAGES.has(stage) || !Number.isInteger(slot) || slot < 1 || slot > 8) return null;

  const winner = input.winner === "teamA" || input.winner === "teamB" ? input.winner : "";
  const now = new Date();

  return {
    id: `${playerKey}-${stage}-${slot}`,
    playerKey,
    playerName,
    stage,
    slot,
    teamA: cleanText(input.teamA),
    teamB: cleanText(input.teamB),
    scoreA: nullableInt(input.scoreA),
    scoreB: nullableInt(input.scoreB),
    winner,
    confidence: nullableInt(input.confidence, 1, 5),
    note: cleanText(input.note, MAX_NOTE),
    updatedAt: now,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerKey = normalizeKey(searchParams.get("name"));

  if (!playerKey) {
    return NextResponse.json({ hasPremium: false, predictions: [] });
  }

  const db = await getDb();
  const premium = await hasPremium(playerKey);
  if (!premium) return NextResponse.json({ hasPremium: false, predictions: [] });

  const docs = await db
    .collection<PremiumPredictionDoc>(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS)
    .find({ playerKey })
    .sort({ stage: 1, slot: 1 })
    .toArray();

  return NextResponse.json({ hasPremium: true, predictions: docs.map(serialize) });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    playerKey?: unknown;
    playerName?: unknown;
    predictions?: PremiumPredictionInput[];
  };

  const playerKey = normalizeKey(body.playerKey);
  const playerName = cleanText(body.playerName || playerKey);
  if (!playerKey) return NextResponse.json({ error: "Falta jugador." }, { status: 400 });

  const premium = await hasPremium(playerKey);
  if (!premium) return NextResponse.json({ error: "Acceso premium requerido." }, { status: 403 });

  const incoming = Array.isArray(body.predictions) ? body.predictions : [];
  const docs = incoming
    .map((item) => normalizePrediction(item, playerKey, playerName))
    .filter((item): item is PremiumPredictionDoc => Boolean(item));

  const db = await getDb();
  const collection = db.collection<PremiumPredictionDoc>(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS);
  await collection.createIndex({ playerKey: 1, stage: 1, slot: 1 }, { unique: true });

  if (docs.length) {
    await collection.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { playerKey: doc.playerKey, stage: doc.stage, slot: doc.slot },
          update: {
            $set: doc,
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  const saved = await collection.find({ playerKey }).sort({ stage: 1, slot: 1 }).toArray();
  return NextResponse.json({ ok: true, predictions: saved.map(serialize) });
}
