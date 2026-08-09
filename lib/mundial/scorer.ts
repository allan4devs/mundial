// lib/mundial/scorer.ts
import type { Db } from "mongodb";

export const SCORER_COLLECTION = "scorer_state";
export const SCORER_STATE_ID = "active";

const BET_WINDOW_MS = 5_000;
const RESOLVE_SHOW_MS = 8_000;
const GOAL_WAIT_TIMEOUT_MS = 8 * 60_000; // 8 min without goal → "nadie"

export const POINTS_EXACT = 80;       // named player correct
export const POINTS_CUALQUIERA = 30;  // picked "cualquiera", goal scored
export const POINTS_NADIE = 20;       // picked "nadie", no goal in time

// ─── DB document types ────────────────────────────────────────────────────────

export type ScorerPlayerDoc = {
  name: string;
  team: "home" | "away";
  position: string;
  squadNumber: number | null;
};

export type ScorerBetDoc = {
  visitorId: string;
  playerName: string; // quiniela display name
  pick: string;       // roster player name | "cualquiera" | "nadie"
  placedAt: Date;
};

export type ScorerRoundStatus = "betting" | "waiting" | "resolved";

export type ScorerRoundDoc = {
  id: string;
  matchId: string;
  status: ScorerRoundStatus;
  betsOpenUntil: Date | null;
  startedAt: Date;
  resolvedAt: Date | null;
  finishedUntil: Date | null;
  actualScorer: string | null;
  bets: ScorerBetDoc[];
  roundNumber: number;
  players: ScorerPlayerDoc[];
  homeTeam: string;
  awayTeam: string;
};

export type ScorerStateDoc = {
  _id: string;
  round: ScorerRoundDoc | null;
  leaderboard: Record<string, number>; // displayName → cumulative points
  lastSeenGoalIds: string[];           // goal event ids already processed
  totalRounds: number;
  version: number;
  updatedAt: Date;
};

// ─── Serialized (client-facing) types ─────────────────────────────────────────

export type SerializedScorerRound = {
  id: string;
  matchId: string;
  status: ScorerRoundStatus;
  betsOpenUntil: string | null;
  startedAt: string;
  resolvedAt: string | null;
  actualScorer: string | null;
  betCount: number;
  roundNumber: number;
  players: ScorerPlayerDoc[];
  homeTeam: string;
  awayTeam: string;
};

export type SerializedScorerLiveMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLiveScore: number | null;
  awayLiveScore: number | null;
  liveMinute: number | null;
  liveUpdatedAt: string | null;
  liveStatus: string;
};

export type SerializedScorerState = {
  round: SerializedScorerRound | null;
  leaderboard: Array<{ name: string; points: number }>;
  liveMatch: SerializedScorerLiveMatch | null;
  viewerCount: number;
  serverTime: string;
  version: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function col(db: Db) {
  return db.collection<ScorerStateDoc>(SCORER_COLLECTION);
}

function newRoundId() {
  return `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function getState(db: Db): Promise<ScorerStateDoc | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return col(db).findOne({ _id: SCORER_STATE_ID } as any);
}

export async function ensureState(db: Db): Promise<ScorerStateDoc> {
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col(db).updateOne(
    { _id: SCORER_STATE_ID } as any,
    {
      $setOnInsert: {
        _id: SCORER_STATE_ID,
        round: null,
        leaderboard: {},
        lastSeenGoalIds: [],
        totalRounds: 0,
        version: 1,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  return (await getState(db))!;
}

// ─── Open a new round (admin) ─────────────────────────────────────────────────

export async function openRound(
  db: Db,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  players: ScorerPlayerDoc[],
  roundNumber: number
): Promise<void> {
  const now = new Date();
  const newRound: ScorerRoundDoc = {
    id: newRoundId(),
    matchId,
    homeTeam,
    awayTeam,
    status: "betting",
    betsOpenUntil: new Date(now.getTime() + BET_WINDOW_MS),
    startedAt: now,
    resolvedAt: null,
    finishedUntil: null,
    actualScorer: null,
    bets: [],
    roundNumber,
    players,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col(db).updateOne(
    { _id: SCORER_STATE_ID } as any,
    {
      $set: { round: newRound, updatedAt: now },
      $inc: { version: 1, totalRounds: 1 },
    }
  );
}

// ─── Place a bet ──────────────────────────────────────────────────────────────

export async function placeBet(
  db: Db,
  roundId: string,
  visitorId: string,
  playerName: string,
  pick: string
): Promise<"ok" | "closed" | "updated"> {
  const state = await getState(db);
  if (!state?.round || state.round.id !== roundId || state.round.status !== "betting") {
    return "closed";
  }

  const now = new Date();
  const alreadyBet = state.round.bets.some((b) => b.visitorId === visitorId);

  if (alreadyBet) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col(db).updateOne(
      { _id: SCORER_STATE_ID, "round.id": roundId, "round.bets.visitorId": visitorId } as any,
      {
        $set: {
          "round.bets.$.pick": pick,
          "round.bets.$.playerName": playerName,
          "round.bets.$.placedAt": now,
          updatedAt: now,
        },
        $inc: { version: 1 },
      }
    );
    return "updated";
  }

  const bet: ScorerBetDoc = { visitorId, playerName, pick, placedAt: now };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col(db).updateOne(
    { _id: SCORER_STATE_ID, "round.id": roundId, "round.status": "betting" } as any,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $push: { "round.bets": bet } as any,
      $set: { updatedAt: now },
      $inc: { version: 1 },
    }
  );
  return "ok";
}

// ─── State machine tick ───────────────────────────────────────────────────────

type GoalEvent = { id: string; type: string; player?: string };
type MatchWithGoals = { liveEvents?: GoalEvent[] } | null;

export async function tickState(db: Db, liveMatch: MatchWithGoals): Promise<void> {
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = await col(db).findOne({ _id: SCORER_STATE_ID } as any);
  if (!state?.round) return;
  const round = state.round;

  // betting → waiting
  if (round.status === "betting" && round.betsOpenUntil && round.betsOpenUntil <= now) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col(db).updateOne(
      { _id: SCORER_STATE_ID, "round.id": round.id, "round.status": "betting" } as any,
      {
        $set: { "round.status": "waiting", "round.betsOpenUntil": null, updatedAt: now },
        $inc: { version: 1 },
      }
    );
    return;
  }

  // waiting → resolved (goal detected or timeout)
  if (round.status === "waiting") {
    const goalEvents = (liveMatch?.liveEvents ?? []).filter((e) => e.type === "goal");
    const newGoals = goalEvents.filter((e) => !state.lastSeenGoalIds.includes(e.id));

    if (newGoals.length > 0) {
      const latest = newGoals[newGoals.length - 1];
      const scorerName = latest.player?.trim() ?? "";
      const inRoster = round.players.some((p) => p.name === scorerName);
      const actualScorer = inRoster ? scorerName : "cualquiera";
      const newSeenIds = [...state.lastSeenGoalIds, ...newGoals.map((e) => e.id)].slice(-100);
      await doResolve(db, state, round, actualScorer, newSeenIds, now);
      return;
    }

    // timeout → nadie
    if (now.getTime() - round.startedAt.getTime() > GOAL_WAIT_TIMEOUT_MS) {
      await doResolve(db, state, round, "nadie", state.lastSeenGoalIds, now);
    }
    return;
  }

  // resolved → clear
  if (round.status === "resolved" && round.finishedUntil && round.finishedUntil <= now) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col(db).updateOne(
      { _id: SCORER_STATE_ID, "round.id": round.id, "round.status": "resolved" } as any,
      { $set: { round: null, updatedAt: now }, $inc: { version: 1 } }
    );
  }
}

async function doResolve(
  db: Db,
  state: ScorerStateDoc,
  round: ScorerRoundDoc,
  actualScorer: string,
  newSeenIds: string[],
  now: Date
): Promise<void> {
  const leaderboard = { ...state.leaderboard };

  for (const bet of round.bets) {
    let pts = 0;
    if (bet.pick === actualScorer) {
      pts = bet.pick === "nadie" ? POINTS_NADIE : POINTS_EXACT;
    } else if (bet.pick === "cualquiera" && actualScorer !== "nadie") {
      pts = POINTS_CUALQUIERA;
    }
    if (pts > 0) {
      const key = bet.playerName || bet.visitorId;
      leaderboard[key] = (leaderboard[key] ?? 0) + pts;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col(db).updateOne(
    { _id: SCORER_STATE_ID, "round.id": round.id } as any,
    {
      $set: {
        "round.status": "resolved",
        "round.actualScorer": actualScorer,
        "round.resolvedAt": now,
        "round.finishedUntil": new Date(now.getTime() + RESOLVE_SHOW_MS),
        leaderboard,
        lastSeenGoalIds: newSeenIds,
        updatedAt: now,
      },
      $inc: { version: 1 },
    }
  );
}

// ─── Force-resolve (admin) ─────────────────────────────────────────────────────

export async function forceResolve(
  db: Db,
  actualScorer: string
): Promise<"ok" | "no_round"> {
  const state = await getState(db);
  if (!state?.round) return "no_round";
  await doResolve(db, state, state.round, actualScorer, state.lastSeenGoalIds, new Date());
  return "ok";
}

// ─── Serialize for client ──────────────────────────────────────────────────────

export function serializeState(
  state: ScorerStateDoc | null,
  extras: { liveMatch?: SerializedScorerLiveMatch | null; viewerCount?: number } = {}
): SerializedScorerState {
  const now = new Date().toISOString();
  const base = {
    liveMatch: extras.liveMatch ?? null,
    viewerCount: extras.viewerCount ?? 0,
    serverTime: now,
    version: state?.version ?? 0,
  };

  if (!state) return { round: null, leaderboard: [], ...base };

  const round: SerializedScorerRound | null = state.round
    ? {
        id: state.round.id,
        matchId: state.round.matchId,
        homeTeam: state.round.homeTeam,
        awayTeam: state.round.awayTeam,
        status: state.round.status,
        betsOpenUntil: state.round.betsOpenUntil?.toISOString() ?? null,
        startedAt: state.round.startedAt.toISOString(),
        resolvedAt: state.round.resolvedAt?.toISOString() ?? null,
        actualScorer: state.round.actualScorer,
        betCount: state.round.bets.length,
        roundNumber: state.round.roundNumber,
        players: state.round.players,
      }
    : null;

  const leaderboard = Object.entries(state.leaderboard ?? {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, points]) => ({ name, points }));

  return { round, leaderboard, ...base };
}
