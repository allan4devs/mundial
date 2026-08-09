import type { Db } from "mongodb";
import { randomUUID } from "node:crypto";

import { SCORES_COLLECTIONS } from "./db";
import { getProvider } from "./providers";
import type { CompetitionDoc, MatchDoc } from "./store";
import { ensureScoresData } from "./store";

const STALE_MS = 6 * 3600_000;
const SYNC_LEASE_MS = 2 * 60_000;

/**
 * Upsert fixtures from a provider into matches.
 * Manual admin fields win when sourceUpdatedAt is newer than provider — MVP: never overwrite finished admin results.
 */
export async function syncCompetition(db: Db, competitionId: string) {
  await ensureScoresData(db);
  const competitions = db.collection<CompetitionDoc>(SCORES_COLLECTIONS.COMPETITIONS);
  const matches = db.collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES);
  const syncState = db.collection(SCORES_COLLECTIONS.SYNC_STATE);
  const competition = await competitions.findOne({ id: competitionId });
  if (!competition) throw new Error(`Competition ${competitionId} not found`);

  const providerId = competition.provider || "manual";
  const provider = getProvider(providerId);
  const now = new Date();
  const leaseOwner = randomUUID();
  const leaseUntil = new Date(now.getTime() + SYNC_LEASE_MS);

  let lease;
  try {
    lease = await syncState.findOneAndUpdate(
      {
        competitionId,
        $or: [
          { leaseUntil: { $lte: now } },
          { leaseUntil: { $exists: false } },
          { leaseOwner },
        ],
      },
      {
        $set: { competitionId, provider: providerId, leaseOwner, leaseUntil, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new Error(`Sync already running for ${competitionId}`);
    }
    throw error;
  }
  if (!lease || lease.leaseOwner !== leaseOwner) {
    throw new Error(`Sync already running for ${competitionId}`);
  }

  try {
    if (!provider || providerId === "manual") {
      await competitions.updateOne(
        { id: competitionId },
        { $set: { lastSyncedAt: now, syncHealth: "healthy", updatedAt: now } }
      );
      return { upserted: 0, provider: providerId, rescored: 0 };
    }

    const fixtures = await provider.fetchFixtures(competitionId);
    let upserted = 0;
    let rescored = 0;

    for (const [index, fx] of fixtures.entries()) {
      const id = `${fx.provider}-${fx.providerMatchId}`;
      const existing = await matches.findOne({
        $or: [{ id }, { provider: fx.provider, providerMatchId: fx.providerMatchId }],
      });

      if (existing && (existing.forceClosed || existing.manualResultOverrideAt)) {
        continue;
      }

      const startsAt = fx.startsAt;
      const manualFixture = Boolean(existing?.manualOverrideAt);
      const resultChanged = Boolean(
        existing &&
          (existing.status !== fx.status ||
            existing.homeScore !== (fx.homeScore ?? existing.homeScore ?? null) ||
            existing.awayScore !== (fx.awayScore ?? existing.awayScore ?? null))
      );
      const doc: Partial<MatchDoc> = {
        id: existing?.id || id,
        competitionId: fx.competitionId,
        sourceId: fx.competitionId,
        league: competition.name,
        sport: fx.sport,
        number: existing?.number ?? index + 1,
        homeTeam: manualFixture ? existing?.homeTeam : fx.homeTeam,
        awayTeam: manualFixture ? existing?.awayTeam : fx.awayTeam,
        startsAt: manualFixture ? existing?.startsAt : startsAt,
        kickoffAt: manualFixture ? existing?.kickoffAt : startsAt,
        predictionClosesAt: manualFixture ? existing?.predictionClosesAt : startsAt,
        venue: manualFixture ? existing?.venue : fx.venue ?? existing?.venue ?? "",
        timezone: "UTC",
        status: fx.status,
        liveStatus: fx.status,
        homeScore: fx.homeScore ?? existing?.homeScore ?? null,
        awayScore: fx.awayScore ?? existing?.awayScore ?? null,
        homeLiveScore: fx.homeLiveScore ?? null,
        awayLiveScore: fx.awayLiveScore ?? null,
        liveMinute: fx.liveMinute ?? null,
        liveNote: fx.liveNote ?? "",
        period: fx.period ?? null,
        clock: fx.clock ?? null,
        forceClosed: existing?.forceClosed ?? false,
        resultVersion:
          (existing?.resultVersion ?? 0) + (resultChanged ? 1 : 0),
        provider: fx.provider,
        providerMatchId: fx.providerMatchId,
        sortOrder: existing?.sortOrder ?? index + 1,
        sourceUpdatedAt: now,
        updatedAt: now,
      };

      await matches.updateOne(
        { id: doc.id },
        {
          $set: doc,
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      upserted += 1;

      if (
        resultChanged &&
        (fx.status === "finished" || fx.status === "cancelled" || fx.status === "postponed")
      ) {
        const updated = await matches.findOne({ id: doc.id });
        if (updated) {
          await rescoreMatch(db, updated);
          rescored += 1;
        }
      }
    }

    await competitions.updateOne(
      { id: competitionId },
      { $set: { lastSyncedAt: now, syncHealth: "healthy", updatedAt: now } }
    );
    await syncState.updateOne(
      { competitionId },
      {
        $set: {
          competitionId,
          provider: providerId,
          lastSyncedAt: now,
          lastError: null,
          upserted,
          rescored,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    return { upserted, rescored, provider: providerId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "sync failed";
    await competitions.updateOne(
      { id: competitionId },
      { $set: { syncHealth: "error", updatedAt: now } }
    );
    await syncState.updateOne(
      { competitionId },
      {
        $set: {
          competitionId,
          provider: providerId,
          lastError: message,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    throw error;
  } finally {
    await syncState.updateOne(
      { competitionId, leaseOwner },
      {
        $unset: { leaseOwner: "", leaseUntil: "" },
        $set: { updatedAt: new Date() },
      }
    );
  }
}

export async function markStaleCompetitions(db: Db) {
  const competitions = db.collection<CompetitionDoc>(SCORES_COLLECTIONS.COMPETITIONS);
  const list = await competitions.find({ syncMode: "provider" }).toArray();
  const now = Date.now();
  for (const c of list) {
    const last = c.lastSyncedAt ? new Date(c.lastSyncedAt).getTime() : 0;
    if (!last) {
      await competitions.updateOne({ id: c.id }, { $set: { syncHealth: "never_synced" } });
    } else if (now - last > STALE_MS && c.syncHealth === "healthy") {
      await competitions.updateOne({ id: c.id }, { $set: { syncHealth: "stale" } });
    }
  }
}

export async function rescoreMatch(db: Db, match: MatchDoc) {
  const preds = db.collection(SCORES_COLLECTIONS.PREDICTIONS);
  const version = match.resultVersion ?? 1;

  if (match.status === "cancelled" || match.status === "postponed") {
    await preds.updateMany(
      { matchId: match.id, scoredResultVersion: { $ne: version } },
      {
        $set: {
          scoring: {
            points: 0,
            exact: false,
            correctOutcome: false,
            ruleVersion: "void",
          },
          scoredResultVersion: version,
          updatedAt: new Date(),
        },
      }
    );
    return;
  }

  if (match.homeScore == null || match.awayScore == null) return;
  if (match.status !== "finished") return;

  const { computePoints } = await import("./scoring");
  const list = await preds.find({ matchId: match.id }).toArray();

  for (const p of list) {
    if (p.scoredResultVersion === version) continue;
    const result = computePoints(
      {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        sport: match.sport,
        status: match.status,
      },
      { homeScore: p.homeScore, awayScore: p.awayScore }
    );
    await preds.updateOne(
      { _id: p._id },
      {
        $set: {
          scoring: result,
          scoredResultVersion: version,
          updatedAt: new Date(),
        },
      }
    );
  }
}
