import { NextRequest, NextResponse } from "next/server";
import { Db, ObjectId } from "mongodb";

import { getDb } from "@/lib/helpers/mongodb";
import { UFC_FIGHTS, UFC_TOTAL_FIGHTS, type UfcFight } from "@/lib/ufc/fights";

export const dynamic = "force-dynamic";

const FIGHTS_COLLECTION = "ufc_fights";
const PREDICTIONS_COLLECTION = "ufc_predictions";
const FIXTURE_VERSION = "ufc-freedom-250-2026-06-14";
const MAX_POINTS = 2;

type CornerPick = "red" | "blue" | null;
type MethodPick = "ko_tko" | "submission" | "decision" | null;

type UfcFightDoc = UfcFight & {
  source: string;
  sourceVersion: string;
  forceClosed?: boolean;
  liveStatus?: "scheduled" | "live" | "finished";
  liveNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type PredictionDoc = {
  _id: ObjectId;
  fightId: string;
  fightNumber?: number;
  playerName: string;
  normalizedName: string;
  cornerPick?: CornerPick;
  methodPick?: MethodPick;
  locked?: boolean;
  lockedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type PredictionPayload = {
  fightId: unknown;
  playerName?: unknown;
  cornerPick?: unknown;
  methodPick?: unknown;
  locked?: unknown;
};

class ApiError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function normalizeName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeKey(value: string) {
  return value.trim().toUpperCase();
}

function parseCornerPick(value: unknown): CornerPick {
  if (value === "red" || value === "blue") return value;
  return null;
}

function parseMethodPick(value: unknown): MethodPick {
  if (value === "ko_tko" || value === "submission" || value === "decision") return value;
  return null;
}

function toIsoString(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function scheduledTime(fight: UfcFightDoc | UfcFight) {
  const t = new Date(fight.scheduledAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function isFightClosed(fight: UfcFightDoc | UfcFight, now = new Date()) {
  if ((fight as UfcFightDoc).forceClosed) return true;
  return scheduledTime(fight) <= now.getTime();
}

function serializeFight(doc: UfcFightDoc | UfcFight, now = new Date()) {
  return {
    id: doc.id,
    number: doc.number,
    section: doc.section,
    sectionLabel: doc.sectionLabel,
    weightClass: doc.weightClass,
    weightLbs: doc.weightLbs,
    titleFight: doc.titleFight,
    titleLabel: doc.titleLabel ?? null,
    scheduledRounds: doc.scheduledRounds,
    redCorner: doc.redCorner,
    blueCorner: doc.blueCorner,
    redRecord: doc.redRecord ?? null,
    blueRecord: doc.blueRecord ?? null,
    scheduledAt: doc.scheduledAt,
    venue: doc.venue,
    winnerCorner: doc.winnerCorner ?? null,
    method: doc.method ?? null,
    endRound: doc.endRound ?? null,
    endTime: doc.endTime ?? null,
    liveStatus: (doc as UfcFightDoc).liveStatus ?? "scheduled",
    liveNote: (doc as UfcFightDoc).liveNote ?? "",
    closed: isFightClosed(doc, now),
    sortOrder: doc.sortOrder,
  };
}

function serializePrediction(doc: PredictionDoc, fightsById: Map<string, UfcFightDoc | UfcFight>, now = new Date()) {
  const fight = fightsById.get(doc.fightId);
  const closedByTime = fight ? isFightClosed(fight, now) : false;

  return {
    id: doc._id.toString(),
    fightId: doc.fightId,
    fightNumber: doc.fightNumber ?? null,
    playerName: doc.playerName,
    cornerPick: doc.cornerPick ?? null,
    methodPick: doc.methodPick ?? null,
    locked: closedByTime,
    lockedAt: toIsoString(closedByTime ? fight?.scheduledAt : doc.lockedAt),
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
}

function serializePlayer(player: {
  _id: string;
  playerName?: string;
  totalPredictions?: number;
  lockedPredictions?: number;
  updatedAt?: Date;
}) {
  return {
    key: player._id,
    playerName: player.playerName ?? player._id,
    totalPredictions: player.totalPredictions ?? 0,
    lockedPredictions: player.lockedPredictions ?? 0,
    updatedAt: toIsoString(player.updatedAt),
  };
}

async function ensureUfcData(db: Db) {
  const fights = db.collection<UfcFightDoc>(FIGHTS_COLLECTION);
  const predictions = db.collection<PredictionDoc>(PREDICTIONS_COLLECTION);
  const seededCount = await fights.countDocuments({ sourceVersion: FIXTURE_VERSION });

  await Promise.all([
    fights.createIndex({ id: 1 }, { unique: true }),
    fights.createIndex({ sortOrder: 1 }),
    predictions.createIndex({ fightId: 1, normalizedName: 1 }, { unique: true }),
    predictions.createIndex({ normalizedName: 1, updatedAt: -1 }),
  ]);

  if (seededCount === UFC_TOTAL_FIGHTS) return;

  const now = new Date();
  await fights.bulkWrite(
    UFC_FIGHTS.map((fight) => {
      const { winnerCorner, method, endRound, endTime, ...fixtureData } = fight;
      return {
        updateOne: {
          filter: { id: fight.id },
          update: {
            $set: {
              ...fixtureData,
              source: "ufc-freedom-250",
              sourceVersion: FIXTURE_VERSION,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
              winnerCorner: winnerCorner ?? null,
              method: method ?? null,
              endRound: endRound ?? null,
              endTime: endTime ?? null,
            },
          },
          upsert: true,
        },
      };
    }),
    { ordered: false }
  );
}

async function readFights(db: Db) {
  await ensureUfcData(db);
  return db.collection<UfcFightDoc>(FIGHTS_COLLECTION).find({}).sort({ sortOrder: 1 }).toArray();
}

async function readPlayers(db: Db, fightsById: Map<string, UfcFightDoc | UfcFight>, now = new Date()) {
  const grouped = new Map<string, { _id: string; playerName: string; totalPredictions: number; lockedPredictions: number; updatedAt?: Date }>();
  const predictionDocs = await db
    .collection<PredictionDoc>(PREDICTIONS_COLLECTION)
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  for (const pred of predictionDocs) {
    const key = pred.normalizedName;
    const existing = grouped.get(key);
    const fight = fightsById.get(pred.fightId);
    const lockedByTime = fight ? isFightClosed(fight, now) : false;

    if (!existing) {
      grouped.set(key, {
        _id: key,
        playerName: pred.playerName,
        totalPredictions: 1,
        lockedPredictions: lockedByTime ? 1 : 0,
        updatedAt: pred.updatedAt,
      });
      continue;
    }
    existing.totalPredictions++;
    existing.lockedPredictions += lockedByTime ? 1 : 0;
    if (pred.updatedAt && (!existing.updatedAt || pred.updatedAt > existing.updatedAt)) {
      existing.updatedAt = pred.updatedAt;
      existing.playerName = pred.playerName;
    }
  }

  return [...grouped.values()].sort((a, b) => {
    const diff = (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
    return diff || a.playerName.localeCompare(b.playerName);
  });
}

async function savePrediction(db: Db, dbFights: UfcFightDoc[], payload: PredictionPayload, fallbackPlayerName: string) {
  const fightsById = new Map(dbFights.map((f) => [f.id, f]));
  const fightId = String(payload.fightId ?? "").trim();
  const fight = fightsById.get(fightId);
  const playerName = normalizeName(payload.playerName ?? fallbackPlayerName);
  const normalizedName = normalizeKey(playerName);
  const cornerPick = parseCornerPick(payload.cornerPick);
  const methodPick = parseMethodPick(payload.methodPick);
  const locked = Boolean(payload.locked);
  const now = new Date();

  if (!fight) throw new ApiError("Pelea inválida.");
  if (isFightClosed(fight, now)) throw new ApiError("Esa pelea ya cerró. Solo se puede guardar antes del inicio.", 423);
  if (!playerName || !cornerPick) throw new ApiError("Faltan datos: nombre y pick de esquina son obligatorios.");

  const predictions = db.collection<PredictionDoc>(PREDICTIONS_COLLECTION);
  const saved = await predictions.findOneAndUpdate(
    { fightId, normalizedName },
    {
      $set: {
        fightId,
        fightNumber: fight.number,
        playerName,
        normalizedName,
        cornerPick,
        methodPick,
        locked,
        lockedAt: locked ? now : null,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!saved) throw new ApiError("No se pudo guardar el pick.", 500);
  return saved;
}

export async function GET(req: NextRequest) {
  try {
    const playerName = normalizeName(req.nextUrl.searchParams.get("playerName") ?? "");
    const db = await getDb();
    const fightDocs = await readFights(db);
    const now = new Date();
    const fightsById = new Map(fightDocs.map((f) => [f.id, f]));
    const predictions = db.collection<PredictionDoc>(PREDICTIONS_COLLECTION);
    const predFilter = playerName ? { normalizedName: normalizeKey(playerName) } : {};
    const [predictionDocs, players] = await Promise.all([
      predictions.find(predFilter).sort({ updatedAt: -1, playerName: 1 }).toArray(),
      readPlayers(db, fightsById, now),
    ]);

    return NextResponse.json({
      fixtureVersion: FIXTURE_VERSION,
      fights: fightDocs.map((f) => serializeFight(f, now)),
      predictions: predictionDocs.map((p) => serializePrediction(p, fightsById, now)),
      players: players.map(serializePlayer),
    });
  } catch (error) {
    console.error("Failed to load UFC predictions", error);
    return NextResponse.json({ error: "No se pudo cargar la quiniela." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const fightDocs = await readFights(db);
    const fallbackPlayerName = normalizeName(body.playerName ?? "");

    const payloads: PredictionPayload[] = Array.isArray(body.predictions)
      ? body.predictions.map((p: PredictionPayload) => ({ ...p, playerName: p.playerName ?? fallbackPlayerName }))
      : [body];

    if (!payloads.length) throw new ApiError("No hay picks para guardar.");

    const saved = [];
    for (const payload of payloads) {
      saved.push(await savePrediction(db, fightDocs, payload, fallbackPlayerName));
    }

    const now = new Date();
    const fightsById = new Map(fightDocs.map((f) => [f.id, f]));

    return NextResponse.json(
      { predictions: saved.map((p) => serializePrediction(p, fightsById, now)) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save UFC prediction", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "No se pudo guardar el pick." }, { status: 500 });
  }
}
