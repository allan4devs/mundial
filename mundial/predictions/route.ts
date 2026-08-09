import { NextRequest, NextResponse } from "next/server";
import { Db, ObjectId } from "mongodb";

import { getDb } from "@/lib/helpers/mongodb";
import { isBanned } from "@/lib/mundial/bans";
import { recordMundialAnalyticsEvent } from "@/lib/mundial/analytics";
import type { MundialMatch } from "@/lib/mundial/fixtures";
import { serializeLiveMatchStats, type LiveMatchStats } from "@/lib/mundial/live-stats";
import { computePredictionResult } from "@/lib/mundial/prediction-scoring";
import { identitySessionMatches } from "@/lib/mundial/identity";
import {
  MUNDIAL_PREDICTIONS_COLLECTION,
  readMundialMatches,
} from "@/lib/mundial/matches-store";

export const dynamic = "force-dynamic";

const LEGACY_MATCH_ID = "mexico-sudafrica-2026-06-11-13";
const MAX_SCORE = 30;

type WinnerPick = "home" | "away" | null;

type MundialMatchDoc = MundialMatch & {
  source?: string;
  forceClosed?: boolean;
  actualWinner?: "home" | "away" | null;
  decisionMethod?: "regular" | "extraTime" | "penalties";
  homeRegulationScore?: number;
  awayRegulationScore?: number;
  liveStatus?: "scheduled" | "live" | "halftime" | "fulltime";
  liveMinute?: number | null;
  liveMinuteUpdatedAt?: Date | string | null;
  homeLiveScore?: number | null;
  awayLiveScore?: number | null;
  liveNote?: string;
  liveEvents?: LiveMatchEventDoc[];
  liveStats?: LiveMatchStats;
  liveUpdatedAt?: Date | string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type LiveMatchEventDoc = {
  id?: string;
  type?: "goal" | "penalty" | "yellow" | "red" | "var" | "substitution" | "note";
  team?: "home" | "away" | null;
  minute?: number | null;
  player?: string;
  note?: string;
  createdAt?: Date | string | null;
};

type PredictionDoc = {
  _id: ObjectId;
  matchId: string;
  matchNumber?: number;
  matchLabel?: string;
  matchTime?: string;
  stage?: string;
  playerName: string;
  normalizedName: string;
  homeScore?: number;
  awayScore?: number;
  mexicoScore?: number;
  southAfricaScore?: number;
  winnerPick?: WinnerPick;
  winnerPickMethod?: "extraTime" | "penalties" | null;
  locked?: boolean;
  lockedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type PredictionPayload = {
  matchId: unknown;
  playerName?: unknown;
  homeScore?: unknown;
  awayScore?: unknown;
  winnerPick?: unknown;
  winnerPickMethod?: unknown;
  locked?: unknown;
};

type LeaderboardEntry = {
  playerName: string;
  normalizedName: string;
  totalPoints: number;
  totalPredictions: number;
  scoredPredictions: number;
  exactScores: number;
  correctOutcomes: number;
};

class ApiError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function normalizeName(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeKey(value: string) {
  return value.trim().toUpperCase();
}

function parseScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) return null;
  return score;
}

function parseWinnerPick(value: unknown): WinnerPick {
  if (value === "home" || value === "away") return value;
  return null;
}

function parseWinnerPickMethod(value: unknown): "extraTime" | "penalties" | null {
  if (value === "extraTime" || value === "penalties") return value;
  return null;
}

function toIsoString(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function kickoffTime(match: MundialMatchDoc | MundialMatch) {
  const kickoff = new Date(match.kickoffAt).getTime();
  return Number.isNaN(kickoff) ? Number.POSITIVE_INFINITY : kickoff;
}

function isMatchClosed(match: MundialMatchDoc | MundialMatch, now = new Date()) {
  if ((match as MundialMatchDoc).forceClosed) return true;
  return kickoffTime(match) <= now.getTime();
}

function serializeLiveEvent(event: LiveMatchEventDoc, index: number) {
  return {
    id: event.id ?? `event-${index}`,
    type: event.type ?? "note",
    team: event.team === "home" || event.team === "away" ? event.team : null,
    minute: typeof event.minute === "number" ? event.minute : null,
    player: event.player ?? "",
    note: event.note ?? "",
    createdAt: toIsoString(event.createdAt),
  };
}

function serializeMatch(doc: MundialMatchDoc, now = new Date()) {
  return {
    id: doc.id,
    number: doc.number,
    stage: doc.stage,
    stageLabel: doc.stageLabel,
    group: doc.group ?? null,
    date: doc.date,
    kickoffAt: doc.kickoffAt,
    venue: doc.venue,
    homeTeam: doc.homeTeam,
    awayTeam: doc.awayTeam,
    homeSeed: doc.homeSeed ?? null,
    awaySeed: doc.awaySeed ?? null,
    homeFinalScore: typeof doc.homeFinalScore === "number" ? doc.homeFinalScore : null,
    awayFinalScore: typeof doc.awayFinalScore === "number" ? doc.awayFinalScore : null,
    homeRegulationScore: typeof doc.homeRegulationScore === "number" ? doc.homeRegulationScore : null,
    awayRegulationScore: typeof doc.awayRegulationScore === "number" ? doc.awayRegulationScore : null,
    actualWinner: doc.actualWinner ?? null,
    decisionMethod: doc.decisionMethod ?? null,
    liveStatus:
      doc.liveStatus === "live" || doc.liveStatus === "halftime" || doc.liveStatus === "fulltime"
        ? doc.liveStatus
        : "scheduled",
    liveMinute: typeof doc.liveMinute === "number" ? doc.liveMinute : null,
    liveMinuteUpdatedAt: toIsoString(doc.liveMinuteUpdatedAt),
    homeLiveScore: typeof doc.homeLiveScore === "number" ? doc.homeLiveScore : null,
    awayLiveScore: typeof doc.awayLiveScore === "number" ? doc.awayLiveScore : null,
    liveNote: doc.liveNote ?? "",
    liveEvents: Array.isArray(doc.liveEvents) ? doc.liveEvents.map(serializeLiveEvent) : [],
    liveStats: serializeLiveMatchStats(doc.liveStats),
    liveUpdatedAt: toIsoString(doc.liveUpdatedAt),
    bettingFavorite: null,
    closed: isMatchClosed(doc, now),
    sortOrder: doc.sortOrder,
  };
}

function predictionScores(doc: PredictionDoc) {
  if (typeof doc.homeScore === "number" && typeof doc.awayScore === "number") {
    return { homeScore: doc.homeScore, awayScore: doc.awayScore };
  }
  if (
    doc.matchId === LEGACY_MATCH_ID &&
    typeof doc.mexicoScore === "number" &&
    typeof doc.southAfricaScore === "number"
  ) {
    return { homeScore: doc.mexicoScore, awayScore: doc.southAfricaScore };
  }
  return { homeScore: 0, awayScore: 0 };
}

function serializePrediction(
  doc: PredictionDoc,
  matchesById: Map<string, MundialMatchDoc | MundialMatch>,
  now = new Date()
) {
  const scores = predictionScores(doc);
  const match = matchesById.get(doc.matchId);
  const closedByTime = match ? isMatchClosed(match, now) : false;

  return {
    id: doc._id.toString(),
    matchId: doc.matchId,
    matchNumber: doc.matchNumber ?? null,
    playerName: doc.playerName,
    homeScore: scores.homeScore,
    awayScore: scores.awayScore,
    winnerPick: doc.winnerPick ?? null,
    winnerPickMethod: doc.winnerPickMethod ?? null,
    locked: closedByTime,
    lockedAt: toIsoString(closedByTime ? match?.kickoffAt : doc.lockedAt),
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
}

function buildLeaderboard(
  predictionDocs: PredictionDoc[],
  matchesById: Map<string, MundialMatchDoc | MundialMatch>
) {
  const playerMap = new Map<string, LeaderboardEntry>();

  for (const prediction of predictionDocs) {
    const key = prediction.normalizedName;
    if (!playerMap.has(key)) {
      playerMap.set(key, {
        playerName: prediction.playerName,
        normalizedName: key,
        totalPoints: 0,
        totalPredictions: 0,
        scoredPredictions: 0,
        exactScores: 0,
        correctOutcomes: 0,
      });
    }

    const entry = playerMap.get(key)!;
    entry.totalPredictions++;

    const match = matchesById.get(prediction.matchId);
    if (
      match &&
      typeof match.homeFinalScore === "number" &&
      typeof match.awayFinalScore === "number"
    ) {
      const scores = predictionScores(prediction);
      const result = computePredictionResult(
        {
          stage: match.stage,
          homeFinalScore: match.homeFinalScore,
          awayFinalScore: match.awayFinalScore,
          homeRegulationScore: match.homeRegulationScore,
          awayRegulationScore: match.awayRegulationScore,
          actualWinner: match.actualWinner ?? null,
          decisionMethod: match.decisionMethod,
        },
{ homeScore: scores.homeScore, awayScore: scores.awayScore, winnerPick: prediction.winnerPick ?? null, winnerPickMethod: prediction.winnerPickMethod ?? null },
      );

      entry.scoredPredictions++;
      entry.totalPoints += result.points;
      if (result.exactScore) entry.exactScores++;
      if (result.correctOutcome) entry.correctOutcomes++;
    }
  }

  return [...playerMap.values()].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.exactScores - a.exactScores ||
      b.correctOutcomes - a.correctOutcomes ||
      a.playerName.localeCompare(b.playerName)
  );
}

function visiblePredictionDocs(predictionDocs: PredictionDoc[], playerName: string) {
  const normalizedName = normalizeKey(playerName);
  if (!normalizedName) return [];

  const unlockedMatchIds = new Set(
    predictionDocs
      .filter((prediction) => prediction.normalizedName === normalizedName)
      .map((prediction) => prediction.matchId)
  );

  return predictionDocs.filter(
    (prediction) =>
      prediction.normalizedName === normalizedName ||
      unlockedMatchIds.has(prediction.matchId)
  );
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

async function readMatches(db: Db) {
  return readMundialMatches<MundialMatchDoc>(db);
}

async function readPlayers(
  db: Db,
  matchesById: Map<string, MundialMatchDoc | MundialMatch>,
  now = new Date(),
  docs?: PredictionDoc[]
) {
  const grouped = new Map<
    string,
    { _id: string; playerName: string; totalPredictions: number; lockedPredictions: number; updatedAt?: Date }
  >();
  const predictionDocs =
    docs ??
    (await db
      .collection<PredictionDoc>(MUNDIAL_PREDICTIONS_COLLECTION)
      .find({})
      .sort({ updatedAt: -1 })
      .toArray());

  for (const prediction of predictionDocs) {
    const key = prediction.normalizedName;
    const existing = grouped.get(key);
    const match = matchesById.get(prediction.matchId);
    const lockedByTime = match ? isMatchClosed(match, now) : false;

    if (!existing) {
      grouped.set(key, {
        _id: key,
        playerName: prediction.playerName,
        totalPredictions: 1,
        lockedPredictions: lockedByTime ? 1 : 0,
        updatedAt: prediction.updatedAt,
      });
      continue;
    }

    existing.totalPredictions += 1;
    existing.lockedPredictions += lockedByTime ? 1 : 0;
    if (prediction.updatedAt && (!existing.updatedAt || prediction.updatedAt > existing.updatedAt)) {
      existing.updatedAt = prediction.updatedAt;
      existing.playerName = prediction.playerName;
    }
  }

  return [...grouped.values()].sort((a, b) => {
    const diff = (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0);
    return diff || a.playerName.localeCompare(b.playerName);
  });
}

async function savePrediction(
  db: Db,
  dbMatches: MundialMatchDoc[],
  payload: PredictionPayload,
  fallbackPlayerName: string
) {
  const matchesById = new Map(dbMatches.map((m) => [m.id, m]));
  const matchId = String(payload.matchId ?? "").trim();
  const match = matchesById.get(matchId);
  const playerName = normalizeName(payload.playerName ?? fallbackPlayerName);
  const normalizedName = normalizeKey(playerName);
  const homeScore = parseScore(payload.homeScore);
  const awayScore = parseScore(payload.awayScore);
  const winnerPick = parseWinnerPick(payload.winnerPick);
  const winnerPickMethod = parseWinnerPickMethod(payload.winnerPickMethod);
  const locked = Boolean(payload.locked);
  const now = new Date();

  if (!match) throw new ApiError("Partido invalido.");
  if (isMatchClosed(match, now)) throw new ApiError("Ese partido ya cerro. Solo se puede guardar antes del inicio.", 423);
  if (!playerName || homeScore === null || awayScore === null) throw new ApiError("Faltan datos para guardar la prediccion.");
  if (match.stage !== "group" && homeScore === awayScore) {
    if (!winnerPick) throw new ApiError("Elegis quien pasa antes de guardar una llave empatada.");
    if (!winnerPickMethod) throw new ApiError("Elegis si pasa en tiempos extra o penales.");
  }

  const predictions = db.collection<PredictionDoc>(MUNDIAL_PREDICTIONS_COLLECTION);
  const existing = await predictions.findOne({ matchId, normalizedName });
  const currentScores = existing ? predictionScores(existing) : null;
  const changesLockedScore =
    Boolean(existing?.locked) &&
    isMatchClosed(match, now) &&
    (currentScores?.homeScore !== homeScore ||
      currentScores?.awayScore !== awayScore ||
      (existing?.winnerPick ?? null) !== winnerPick ||
      (existing?.winnerPickMethod ?? null) !== winnerPickMethod);

  if (changesLockedScore) throw new ApiError("Ese resultado esta bloqueado. Desbloquealo antes de editar.", 423);

  const saved = await predictions.findOneAndUpdate(
    { matchId, normalizedName },
    {
      $set: {
        matchId,
        matchNumber: match.number,
        matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
        stage: match.stage,
        playerName,
        normalizedName,
        homeScore,
        awayScore,
        winnerPick,
        winnerPickMethod,
        locked,
        lockedAt: locked ? now : null,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
      $unset: { mexicoScore: "", southAfricaScore: "" },
    },
    { upsert: true, returnDocument: "after" }
  );

  if (!saved) throw new ApiError("No se pudo guardar la prediccion.", 500);
  return { doc: saved, action: existing ? "updated" : "created" };
}

export async function GET(req: NextRequest) {
  try {
    const playerName = normalizeName(req.nextUrl.searchParams.get("playerName"));
    const db = await getDb();
    const matches = await readMatches(db);
    const now = new Date();
    const matchesById = new Map(matches.map((m) => [m.id, m]));
    const predictions = db.collection<PredictionDoc>(MUNDIAL_PREDICTIONS_COLLECTION);
    const predictionDocs = await predictions.find({}).sort({ updatedAt: -1, playerName: 1 }).toArray();
    const players = await readPlayers(db, matchesById, now, predictionDocs);
    const visiblePredictions = visiblePredictionDocs(predictionDocs, playerName);

    return NextResponse.json({
      matches: matches.map((m) => serializeMatch(m, now)),
      predictions: visiblePredictions.map((p) => serializePrediction(p, matchesById, now)),
      players: players.map(serializePlayer),
      leaderboard: buildLeaderboard(predictionDocs, matchesById),
    });
  } catch (error) {
    console.error("Failed to load mundial predictions", error);
    return NextResponse.json({ error: "No se pudo cargar la quiniela." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const matches = await readMatches(db);

    const fallbackPlayerName = normalizeName(body.playerName);
    const fallbackNormalizedName = normalizeKey(fallbackPlayerName);
    if (!fallbackNormalizedName || !(await identitySessionMatches(db, req, fallbackPlayerName))) {
      return NextResponse.json({ error: "Sesión inválida. Verificá tu cédula y PIN nuevamente." }, { status: 401 });
    }
    if (fallbackNormalizedName) {
      const ban = await isBanned(db, fallbackNormalizedName, null);
      if (ban) return NextResponse.json({ error: "Cuenta suspendida.", banned: true }, { status: 403 });
    }

    const payloads: PredictionPayload[] = Array.isArray(body.predictions)
      ? body.predictions.map((p: PredictionPayload) => ({
          ...p,
          playerName: p.playerName ?? fallbackPlayerName,
        }))
      : [body];

    if (!payloads.length) throw new ApiError("No hay predicciones para guardar.");

    const saved = [];
    for (const payload of payloads) {
      saved.push(await savePrediction(db, matches, payload, fallbackPlayerName));
    }

    const now = new Date();
    const matchesById = new Map(matches.map((m) => [m.id, m]));

    await Promise.all(
      saved.map(({ doc, action }) => {
        const match = matchesById.get(doc.matchId);
        const scores = predictionScores(doc);
        return recordMundialAnalyticsEvent(db, req, {
          event: "pick_saved",
          playerName: doc.playerName,
          normalizedName: doc.normalizedName,
          happenedAt: doc.updatedAt ?? now,
          metadata: {
            action,
            matchId: doc.matchId,
            matchNumber: doc.matchNumber ?? match?.number ?? null,
            matchLabel: doc.matchLabel ?? (match ? `${match.homeTeam} vs ${match.awayTeam}` : null),
            stage: doc.stage ?? match?.stage ?? null,
            homeTeam: match?.homeTeam ?? null,
            awayTeam: match?.awayTeam ?? null,
            homeScore: scores.homeScore,
            awayScore: scores.awayScore,
            winnerPick: doc.winnerPick ?? null,
            savedAt: toIsoString(doc.updatedAt ?? now),
          },
        });
      })
    );

    return NextResponse.json(
      { predictions: saved.map(({ doc }) => serializePrediction(doc, matchesById, now)) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save mundial prediction", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "No se pudo guardar la prediccion." }, { status: 500 });
  }
}
