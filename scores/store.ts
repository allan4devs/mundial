import type { Collection, Db, Document } from "mongodb";

import { SCORES_COLLECTIONS } from "./db";
import type { Competition, Match, MatchStatus, Sport } from "./types";
import { toIso } from "./validators";
import { seedDemoCompetitions, seedDemoMatches } from "./seed";
import { isMatchClosed } from "./rules";

export { isMatchClosed } from "./rules";

export type MatchDoc = Omit<Match, "startsAt" | "kickoffAt" | "predictionClosesAt"> & {
  startsAt: Date;
  kickoffAt: Date;
  predictionClosesAt: Date;
  sourceUpdatedAt?: Date;
  manualOverrideAt?: Date;
  manualResultOverrideAt?: Date;
  predictionGateVersion?: number;
  predictionGateCheckedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PredictionDoc = {
  matchId: string;
  userId: string;
  displayNameSnapshot: string;
  playerName?: string;
  homeScore: number;
  awayScore: number;
  predictedScore?: { home: number; away: number };
  locked?: boolean;
  lockedAt?: Date | null;
  scoredResultVersion?: number;
  scoring?: {
    points: number;
    exact: boolean;
    correctOutcome: boolean;
    ruleVersion: string;
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CompetitionDoc = Competition & {
  createdAt?: Date;
  updatedAt?: Date;
};

async function createIndexStrict<T extends Document>(
  col: Collection<T>,
  keys: Record<string, 1 | -1>,
  options?: { unique?: boolean; name?: string; expireAfterSeconds?: number }
) {
  try {
    await col.createIndex(keys, options ?? {});
  } catch (error) {
    console.error("[scores] index failed", col.collectionName, keys, error);
    throw error;
  }
}

export async function ensureScoresData(db: Db) {
  const matches = db.collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES);
  const predictions = db.collection(SCORES_COLLECTIONS.PREDICTIONS);
  const competitions = db.collection<CompetitionDoc>(SCORES_COLLECTIONS.COMPETITIONS);

  await Promise.all([
    createIndexStrict(matches, { id: 1 }, { unique: true }),
    createIndexStrict(matches, { competitionId: 1, startsAt: 1 }),
    createIndexStrict(matches, { status: 1, startsAt: 1 }),
    createIndexStrict(matches, { sortOrder: 1, id: 1 }),
    createIndexStrict(matches, { provider: 1, providerMatchId: 1 }),
    createIndexStrict(predictions, { matchId: 1, userId: 1 }, { unique: true }),
    createIndexStrict(predictions, { userId: 1, updatedAt: -1 }),
    createIndexStrict(predictions, { matchId: 1, createdAt: 1 }),
    createIndexStrict(competitions, { id: 1 }, { unique: true }),
    createIndexStrict(
      db.collection(SCORES_COLLECTIONS.SYNC_STATE),
      { competitionId: 1 },
      { unique: true }
    ),
    createIndexStrict(
      db.collection(SCORES_COLLECTIONS.PRIVATE_LEAGUES),
      { inviteCodeHash: 1 },
      { unique: true }
    ),
    createIndexStrict(
      db.collection(SCORES_COLLECTIONS.PRIVATE_LEAGUES),
      { memberUserIds: 1 }
    ),
    createIndexStrict(
      db.collection(SCORES_COLLECTIONS.USER_ACHIEVEMENTS),
      { userId: 1, achievementId: 1 },
      { unique: true }
    ),
    createIndexStrict(
      db.collection(SCORES_COLLECTIONS.NOTIFICATION_DELIVERIES),
      { userId: 1, matchId: 1, type: 1 },
      { unique: true }
    ),
    createIndexStrict(
      db.collection(SCORES_COLLECTIONS.ANALYTICS),
      { happenedAt: 1 },
      { name: "scores_analytics_retention", expireAfterSeconds: 180 * 24 * 60 * 60 }
    ),
    createIndexStrict(
      db.collection(SCORES_COLLECTIONS.MODEL_PREDICTIONS),
      { matchId: 1, modelVersion: 1 },
      { unique: true }
    ),
  ]);

  await seedDemoCompetitions(db);
  await seedDemoMatches(db);
}

export function serializeMatch(doc: MatchDoc, now = new Date()) {
  const startsAt = toIso(doc.startsAt) || toIso(doc.kickoffAt) || "";
  const status = normalizeStatus(doc.status || doc.liveStatus);
  return {
    id: doc.id,
    competitionId: doc.competitionId,
    sourceId: doc.sourceId || doc.competitionId,
    league: doc.league,
    sport: doc.sport,
    number: doc.number,
    homeTeam: doc.homeTeam,
    awayTeam: doc.awayTeam,
    startsAt,
    kickoffAt: startsAt,
    venue: doc.venue ?? "",
    timezone: "UTC" as const,
    status,
    liveStatus: status,
    period: doc.period ?? null,
    clock: doc.clock ?? null,
    homeScore: doc.homeScore ?? null,
    awayScore: doc.awayScore ?? null,
    homeLiveScore: doc.homeLiveScore ?? null,
    awayLiveScore: doc.awayLiveScore ?? null,
    liveMinute: doc.liveMinute ?? null,
    liveNote: doc.liveNote ?? "",
    forceClosed: Boolean(doc.forceClosed),
    predictionClosesAt: toIso(doc.predictionClosesAt) || startsAt,
    resultVersion: doc.resultVersion ?? 0,
    provider: doc.provider ?? null,
    providerMatchId: doc.providerMatchId ?? null,
    closed: isMatchClosed(doc, now),
    sortOrder: doc.sortOrder ?? doc.number,
  };
}

function normalizeStatus(value: unknown): MatchStatus {
  if (value === "fulltime") return "finished";
  if (
    value === "scheduled" ||
    value === "live" ||
    value === "halftime" ||
    value === "finished" ||
    value === "postponed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "scheduled";
}

export async function readMatches(
  db: Db,
  opts?: {
    competitionId?: string;
    sport?: Sport;
    status?: string;
    liveOnly?: boolean;
    limit?: number;
    dateFrom?: Date;
    dateTo?: Date;
    cursor?: { sortOrder: number; id: string };
  }
): Promise<MatchDoc[]> {
  await ensureScoresData(db);
  const filter: Record<string, unknown> = {};
  if (opts?.competitionId) filter.competitionId = opts.competitionId;
  if (opts?.sport) filter.sport = opts.sport;
  if (opts?.liveOnly) filter.status = { $in: ["live", "halftime"] };
  else if (opts?.status) filter.status = opts.status === "fulltime" ? "finished" : opts.status;
  if (opts?.dateFrom || opts?.dateTo) {
    filter.startsAt = {
      ...(opts.dateFrom ? { $gte: opts.dateFrom } : {}),
      ...(opts.dateTo ? { $lte: opts.dateTo } : {}),
    };
  }
  if (opts?.cursor) {
    filter.$or = [
      { sortOrder: { $gt: opts.cursor.sortOrder } },
      { sortOrder: opts.cursor.sortOrder, id: { $gt: opts.cursor.id } },
    ];
  }

  return db
    .collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES)
    .find(filter)
    .sort({ sortOrder: 1, id: 1 })
    .limit(opts?.limit ?? 200)
    .toArray();
}

export async function readCompetitions(db: Db, includeDisabled = false) {
  await ensureScoresData(db);
  const filter = includeDisabled ? {} : { enabled: true };
  return db.collection<CompetitionDoc>(SCORES_COLLECTIONS.COMPETITIONS).find(filter).toArray();
}

export { toIso };
