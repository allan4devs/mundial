import type { Db } from "mongodb";
import { SCORES_COLLECTIONS } from "./db";
import type { CompetitionDoc, MatchDoc } from "./store";

const DEMO_COMPETITIONS: CompetitionDoc[] = [
  {
    id: "fcl",
    sport: "football",
    name: "FCL Demo",
    enabled: true,
    syncMode: "manual",
    provider: "manual",
    syncHealth: "healthy",
  },
  {
    id: "nba",
    sport: "basketball",
    name: "NBA Demo",
    enabled: true,
    syncMode: "provider",
    provider: "mock",
    providerCompetitionId: "nba-demo",
    syncHealth: "never_synced",
  },
  {
    id: "premier-league",
    sport: "football",
    name: "Premier League",
    enabled: false,
    syncMode: "manual",
    provider: "manual",
    syncHealth: "never_synced",
  },
  {
    id: "serie-a",
    sport: "football",
    name: "Serie A",
    enabled: false,
    syncMode: "manual",
    provider: "manual",
    syncHealth: "never_synced",
  },
  {
    id: "nbl",
    sport: "basketball",
    name: "NBL",
    enabled: false,
    syncMode: "manual",
    provider: "manual",
    syncHealth: "never_synced",
  },
  {
    id: "manual",
    sport: "other",
    name: "Manual / Admin",
    enabled: false,
    syncMode: "manual",
    provider: "manual",
    syncHealth: "healthy",
  },
];

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600_000);
}

function demoFootballMatches(): Omit<MatchDoc, "createdAt" | "updatedAt">[] {
  const m1 = hoursFromNow(26);
  const m2 = hoursFromNow(50);
  return [
    {
      id: "fcl-demo-1",
      competitionId: "fcl",
      sourceId: "fcl",
      league: "FCL Demo",
      sport: "football",
      number: 1,
      homeTeam: "San Carlos",
      awayTeam: "Alajuela",
      startsAt: m1,
      kickoffAt: m1,
      predictionClosesAt: m1,
      venue: "Estadio Carlos Ugalde",
      timezone: "UTC",
      status: "scheduled",
      liveStatus: "scheduled",
      homeScore: null,
      awayScore: null,
      homeLiveScore: null,
      awayLiveScore: null,
      liveMinute: null,
      liveNote: "",
      forceClosed: false,
      resultVersion: 0,
      provider: "manual",
      providerMatchId: "fcl-demo-1",
      sortOrder: 1,
    },
    {
      id: "fcl-demo-2",
      competitionId: "fcl",
      sourceId: "fcl",
      league: "FCL Demo",
      sport: "football",
      number: 2,
      homeTeam: "Saprissa",
      awayTeam: "Heredia",
      startsAt: m2,
      kickoffAt: m2,
      predictionClosesAt: m2,
      venue: "Ricardo Saprissa",
      timezone: "UTC",
      status: "scheduled",
      liveStatus: "scheduled",
      homeScore: null,
      awayScore: null,
      homeLiveScore: null,
      awayLiveScore: null,
      liveMinute: null,
      liveNote: "",
      forceClosed: false,
      resultVersion: 0,
      provider: "manual",
      providerMatchId: "fcl-demo-2",
      sortOrder: 2,
    },
  ];
}

function demoNbaMatches(): Omit<MatchDoc, "createdAt" | "updatedAt">[] {
  const m1 = hoursFromNow(30);
  return [
    {
      id: "nba-demo-1",
      competitionId: "nba",
      sourceId: "nba",
      league: "NBA Demo",
      sport: "basketball",
      number: 1,
      homeTeam: "Lakers",
      awayTeam: "Celtics",
      startsAt: m1,
      kickoffAt: m1,
      predictionClosesAt: m1,
      venue: "Crypto.com Arena",
      timezone: "UTC",
      status: "scheduled",
      liveStatus: "scheduled",
      homeScore: null,
      awayScore: null,
      homeLiveScore: null,
      awayLiveScore: null,
      liveMinute: null,
      liveNote: "",
      forceClosed: false,
      resultVersion: 0,
      provider: "mock",
      providerMatchId: "nba-demo-1",
      sortOrder: 1,
    },
  ];
}

export async function seedDemoCompetitions(db: Db) {
  const col = db.collection<CompetitionDoc>(SCORES_COLLECTIONS.COMPETITIONS);
  const now = new Date();
  await col.bulkWrite(
    DEMO_COMPETITIONS.map((c) => ({
      updateOne: {
        filter: { id: c.id },
        update: {
          $setOnInsert: { syncHealth: c.syncHealth, createdAt: now },
          $set: {
            id: c.id,
            sport: c.sport,
            name: c.name,
            enabled: c.enabled,
            syncMode: c.syncMode,
            provider: c.provider,
            providerCompetitionId: c.providerCompetitionId,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

/**
 * Insert demo fixtures once. If they remain scheduled/postponed but kickoff
 * already passed, roll them forward so the vertical slice stays usable.
 */
export async function seedDemoMatches(db: Db) {
  const col = db.collection<MatchDoc>(SCORES_COLLECTIONS.MATCHES);
  const now = new Date();
  const all = [...demoFootballMatches(), ...demoNbaMatches()];

  await col.bulkWrite(
    all.map((m) => ({
      updateOne: {
        filter: { id: m.id },
        update: {
          $setOnInsert: { ...m, createdAt: now, updatedAt: now },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const demoIds = all.map((m) => m.id);
  const stale = await col
    .find({
      id: { $in: demoIds },
      status: { $in: ["scheduled", "postponed"] },
      forceClosed: { $ne: true },
      startsAt: { $lte: now },
    })
    .toArray();

  for (const doc of stale) {
    const hours = doc.id.includes("nba") ? 30 : doc.number === 1 ? 26 : 50;
    const next = new Date(Date.now() + hours * 3600_000);
    await col.updateOne(
      { id: doc.id },
      {
        $set: {
          startsAt: next,
          kickoffAt: next,
          predictionClosesAt: next,
          updatedAt: now,
        },
      }
    );
  }
}
