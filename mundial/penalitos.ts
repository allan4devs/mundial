// lib/mundial/penalitos.ts
import type { Db } from "mongodb";

export const PENALITOS_COLLECTION = "penalitos_state";
export const PENALITOS_STATE_ID = "active";

const CHOOSE_TIMEOUT_MS = 10_000;
const FINISHED_DURATION_MS = 5_000;
const ANIM_REVEAL_MS = 1_800; // client uses this constant too (exported)
const MAX_HISTORY = 30;

export { ANIM_REVEAL_MS };

export type PenalitosDirection = "left" | "center" | "right";
export type PenalitosStatus = "waiting" | "choosing" | "finished";
export type PenalitosRoleKey = "goalkeeper" | "shooter";

export type PenalitosPlayerDoc = {
  visitorId: string;
  name: string;
};

export type PenalitosGameDoc = {
  id: string;
  status: PenalitosStatus;
  goalkeeper: PenalitosPlayerDoc | null;
  shooter: PenalitosPlayerDoc | null;
  goalkeeperChoice: PenalitosDirection | null;
  shooterChoice: PenalitosDirection | null;
  winner: PenalitosRoleKey | null;
  outcome: "goal" | "save" | null;
  chooseDeadline: Date | null;
  resolvedAt: Date | null;
  finishedUntil: Date | null;
  roundNumber: number;
  startedAt: Date;
};

export type PenalitosQueueEntry = {
  visitorId: string;
  name: string;
  preferredRole: PenalitosRoleKey;
  joinedAt: Date;
};

export type PenalitosStateDoc = {
  _id: string;
  game: PenalitosGameDoc | null;
  queue: PenalitosQueueEntry[];
  scores: Record<string, number>;
  history?: PenalitosRoundHistoryDoc[];
  version?: number;
  updatedAt: Date;
};

export type PenalitosRoundHistoryDoc = {
  gameId: string;
  roundNumber: number;
  goalkeeper: PenalitosPlayerDoc | null;
  shooter: PenalitosPlayerDoc | null;
  goalkeeperChoice: PenalitosDirection;
  shooterChoice: PenalitosDirection;
  winner: PenalitosRoleKey;
  outcome: "goal" | "save";
  resolvedAt: Date;
};

export type SerializedLiveMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLiveScore: number | null;
  awayLiveScore: number | null;
  liveMinute: number | null;
  liveStatus: "live" | "halftime" | "fulltime" | "scheduled";
  liveNote: string;
};

export type SerializedPenalitosState = {
  game: SerializedGame | null;
  queue: SerializedQueueEntry[];
  scores: Record<string, number>;
  history: SerializedRoundHistory[];
  liveMatch: SerializedLiveMatch | null;
  viewerCount: number;
  viewers: SerializedPenalitosViewer[];
  recentViewers: SerializedPenalitosViewer[];
  version: number;
  serverTime: string;
  updatedAt: string | null;
};

export type SerializedPenalitosViewer = {
  visitorId: string;
  name: string;
  connectedAt: string;
  lastSeenAt: string;
};

export type SerializedGame = {
  id: string;
  status: PenalitosStatus;
  goalkeeper: PenalitosPlayerDoc | null;
  shooter: PenalitosPlayerDoc | null;
  goalkeeperChoice: PenalitosDirection | null;
  shooterChoice: PenalitosDirection | null;
  winner: PenalitosRoleKey | null;
  outcome: "goal" | "save" | null;
  chooseDeadline: string | null;
  resolvedAt: string | null;
  finishedUntil: string | null;
  roundNumber: number;
  startedAt: string;
};

export type SerializedQueueEntry = {
  visitorId: string;
  name: string;
  preferredRole: PenalitosRoleKey;
  joinedAt: string;
};

export type SerializedRoundHistory = {
  gameId: string;
  roundNumber: number;
  goalkeeper: PenalitosPlayerDoc | null;
  shooter: PenalitosPlayerDoc | null;
  goalkeeperChoice: PenalitosDirection;
  shooterChoice: PenalitosDirection;
  winner: PenalitosRoleKey;
  outcome: "goal" | "save";
  resolvedAt: string;
};

const DIRECTIONS: PenalitosDirection[] = ["left", "center", "right"];
export const MAX_QUEUE = 20;

function randDir(): PenalitosDirection {
  return DIRECTIONS[Math.floor(Math.random() * 3)];
}

function newGameId() {
  return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function col(db: Db) {
  return db.collection<PenalitosStateDoc>(PENALITOS_COLLECTION);
}

export async function getState(db: Db): Promise<PenalitosStateDoc | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return col(db).findOne({ _id: PENALITOS_STATE_ID } as any);
}

export async function ensureState(db: Db): Promise<PenalitosStateDoc> {
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await col(db).updateOne(
    { _id: PENALITOS_STATE_ID } as any,
    {
      $setOnInsert: {
        _id: PENALITOS_STATE_ID,
        game: null,
        queue: [],
        scores: {},
        history: [],
        version: 1,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  return (await getState(db))!;
}

/**
 * Advance the game state machine if time-based deadlines have passed.
 * Safe to call concurrently — guards use MongoDB's atomic update filters.
 */
export async function tickState(db: Db): Promise<void> {
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = await col(db).findOne({ _id: PENALITOS_STATE_ID } as any);
  if (!state?.game) return;

  const { game } = state;

  if (game.status === "choosing") {
    const deadlinePassed = game.chooseDeadline && game.chooseDeadline <= now;
    const bothChose = game.goalkeeperChoice != null && game.shooterChoice != null;

    if (deadlinePassed || bothChose) {
      const gkChoice = game.goalkeeperChoice ?? randDir();
      const shChoice = game.shooterChoice ?? randDir();
      const goalkeeperSaves = gkChoice === shChoice;
      const winner: PenalitosRoleKey = goalkeeperSaves ? "goalkeeper" : "shooter";
      const outcome = goalkeeperSaves ? "save" : "goal";

      const resolvedAt = now;
      const finishedUntil = new Date(now.getTime() + FINISHED_DURATION_MS);

      const scores = { ...state.scores };
      if (outcome === "goal" && game.shooter?.name) {
        scores[game.shooter.name] = (scores[game.shooter.name] ?? 0) + 1;
      }
      const historyEntry: PenalitosRoundHistoryDoc = {
        gameId: game.id,
        roundNumber: game.roundNumber,
        goalkeeper: game.goalkeeper,
        shooter: game.shooter,
        goalkeeperChoice: gkChoice,
        shooterChoice: shChoice,
        winner,
        outcome,
        resolvedAt,
      };

      await col(db).updateOne(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { _id: PENALITOS_STATE_ID as any, "game.status": "choosing", "game.id": game.id },
        {
          $set: {
            "game.status": "finished",
            "game.goalkeeperChoice": gkChoice,
            "game.shooterChoice": shChoice,
            "game.winner": winner,
            "game.outcome": outcome,
            "game.resolvedAt": resolvedAt,
            "game.finishedUntil": finishedUntil,
            "game.chooseDeadline": null,
            scores,
            updatedAt: now,
          },
          $push: {
            history: {
              $each: [historyEntry],
              $slice: -MAX_HISTORY,
            },
          },
          $inc: { version: 1 },
        }
      );
      return;
    }
  }

  if (game.status === "finished" && game.finishedUntil && game.finishedUntil <= now) {
    await advanceToNextRound(db, state, now);
  }
}

async function advanceToNextRound(
  db: Db,
  state: PenalitosStateDoc,
  now: Date
): Promise<void> {
  const completedIds = new Set(
    [state.game?.goalkeeper?.visitorId, state.game?.shooter?.visitorId].filter((id): id is string => Boolean(id))
  );
  const queue = state.queue.filter((entry) => !completedIds.has(entry.visitorId));
  const newRound = (state.game?.roundNumber ?? 0) + 1;
  const usedIds = new Set(completedIds);

  function pull(preferred: PenalitosRoleKey): PenalitosPlayerDoc | null {
    let idx = queue.findIndex((e) => e.preferredRole === preferred && !usedIds.has(e.visitorId));
    if (idx < 0) idx = queue.findIndex((e) => !usedIds.has(e.visitorId));
    if (idx < 0) return null;
    const entry = queue[idx];
    queue.splice(idx, 1);
    usedIds.add(entry.visitorId);
    return { visitorId: entry.visitorId, name: entry.name };
  }

  const goalkeeper = pull("goalkeeper");
  const shooter = pull("shooter");
  const hasPlayers = goalkeeper && shooter;

  const newGame: PenalitosGameDoc = {
    id: newGameId(),
    status: hasPlayers ? "choosing" : "waiting",
    goalkeeper,
    shooter,
    goalkeeperChoice: null,
    shooterChoice: null,
    winner: null,
    outcome: null,
    chooseDeadline: hasPlayers ? new Date(now.getTime() + CHOOSE_TIMEOUT_MS) : null,
    resolvedAt: null,
    finishedUntil: null,
    roundNumber: newRound,
    startedAt: now,
  };

  await col(db).updateOne(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { _id: PENALITOS_STATE_ID as any, "game.status": "finished" },
    { $set: { game: newGame, queue, updatedAt: now }, $inc: { version: 1 } }
  );
}

/** Start a fresh game with given players (skips queue — used by join when spots are open). */
export async function startGame(
  db: Db,
  goalkeeper: PenalitosPlayerDoc,
  shooter: PenalitosPlayerDoc,
  roundNumber: number
): Promise<void> {
  const now = new Date();
  const newGame: PenalitosGameDoc = {
    id: newGameId(),
    status: "choosing",
    goalkeeper,
    shooter,
    goalkeeperChoice: null,
    shooterChoice: null,
    winner: null,
    outcome: null,
    chooseDeadline: new Date(now.getTime() + CHOOSE_TIMEOUT_MS),
    resolvedAt: null,
    finishedUntil: null,
    roundNumber,
    startedAt: now,
  };

  await col(db).updateOne(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { _id: PENALITOS_STATE_ID as any },
    { $set: { game: newGame, updatedAt: now }, $inc: { version: 1 } }
  );
}

export function serializeState(
  state: PenalitosStateDoc | null,
  extras: {
    liveMatch?: SerializedLiveMatch | null;
    viewerCount?: number;
    viewers?: SerializedPenalitosViewer[];
    recentViewers?: SerializedPenalitosViewer[];
  } = {}
): SerializedPenalitosState {
  const now = new Date().toISOString();
  const base = {
    liveMatch: extras.liveMatch ?? null,
    viewerCount: extras.viewerCount ?? 0,
    viewers: extras.viewers ?? [],
    recentViewers: extras.recentViewers ?? [],
    version: state?.version ?? 0,
    serverTime: now,
    updatedAt: state?.updatedAt?.toISOString() ?? null,
  };
  if (!state) return { game: null, queue: [], scores: {}, history: [], ...base };

  const game: SerializedGame | null = state.game
    ? {
        id: state.game.id,
        status: state.game.status,
        goalkeeper: state.game.goalkeeper,
        shooter: state.game.shooter,
        goalkeeperChoice: state.game.goalkeeperChoice,
        shooterChoice: state.game.shooterChoice,
        winner: state.game.winner,
        outcome: state.game.outcome,
        chooseDeadline: state.game.chooseDeadline?.toISOString() ?? null,
        resolvedAt: state.game.resolvedAt?.toISOString() ?? null,
        finishedUntil: state.game.finishedUntil?.toISOString() ?? null,
        roundNumber: state.game.roundNumber,
        startedAt: state.game.startedAt?.toISOString() ?? new Date().toISOString(),
      }
    : null;

  const queue: SerializedQueueEntry[] = state.queue.map((e) => ({
    visitorId: e.visitorId,
    name: e.name,
    preferredRole: e.preferredRole,
    joinedAt: e.joinedAt?.toISOString() ?? new Date().toISOString(),
  }));

  const history: SerializedRoundHistory[] = (state.history ?? []).map((round) => ({
    gameId: round.gameId,
    roundNumber: round.roundNumber,
    goalkeeper: round.goalkeeper,
    shooter: round.shooter,
    goalkeeperChoice: round.goalkeeperChoice,
    shooterChoice: round.shooterChoice,
    winner: round.winner,
    outcome: round.outcome,
    resolvedAt: round.resolvedAt?.toISOString() ?? now,
  }));

  return { game, queue, scores: state.scores ?? {}, history, ...base };
}
