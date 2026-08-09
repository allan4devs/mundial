import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";

/**
 * Segment-based shared board used by /api/game/*.
 *
 * State lives in `ghost_game_state` keyed by game id. scripts/game-ws-server.mjs
 * polls `updatedAt` and also maintains `viewerCount`, so mutations must bump
 * `updatedAt` for subscribers to receive the change.
 */

export const GAME_STATE_COLLECTION = "ghost_game_state";

const DEFAULT_TOTAL_SEGMENTS = 10;
const MAX_PLAYERS = 12;

export type GamePlayerDoc = {
  id: string;
  name: string;
  segment: number;
  joinedAt: Date;
};

export type GameStateDoc = {
  _id: string;
  totalSegments: number;
  players: GamePlayerDoc[];
  viewerCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type GameStateView = {
  id: string;
  totalSegments: number;
  players: { id: string; name: string; segment: number; joinedAt: string }[];
  viewerCount: number;
  updatedAt: string;
};

function games(db: Db) {
  return db.collection<GameStateDoc>(GAME_STATE_COLLECTION);
}

export async function createGame(db: Db, totalSegments = DEFAULT_TOTAL_SEGMENTS): Promise<string> {
  const now = new Date();
  const id = randomUUID();

  await games(db).insertOne({
    _id: id,
    totalSegments: Math.max(1, Math.floor(totalSegments)),
    players: [],
    viewerCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function getGame(db: Db, gameId: string): Promise<GameStateDoc | null> {
  return games(db).findOne({ _id: gameId });
}

export async function joinGame(
  db: Db,
  gameId: string,
  visitorId: string,
  name: string
): Promise<GameStateDoc | null> {
  const now = new Date();
  const displayName = name.trim().slice(0, 20) || "Jugador";

  const existing = await games(db).findOneAndUpdate(
    { _id: gameId, "players.id": visitorId },
    { $set: { "players.$.name": displayName, updatedAt: now } },
    { returnDocument: "after" }
  );
  if (existing) return existing;

  return games(db).findOneAndUpdate(
    { _id: gameId, [`players.${MAX_PLAYERS - 1}`]: { $exists: false } },
    {
      $push: { players: { id: visitorId, name: displayName, segment: 0, joinedAt: now } },
      $set: { updatedAt: now },
    },
    { returnDocument: "after" }
  );
}

export async function movePlayer(
  db: Db,
  gameId: string,
  visitorId: string,
  toSegment: number
): Promise<GameStateDoc | null> {
  const game = await getGame(db, gameId);
  if (!game) return null;

  const segment = Math.min(Math.max(0, Math.floor(toSegment)), game.totalSegments - 1);

  return games(db).findOneAndUpdate(
    { _id: gameId, "players.id": visitorId },
    { $set: { "players.$.segment": segment, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function leaveGame(db: Db, gameId: string, visitorId: string): Promise<void> {
  await games(db).updateOne(
    { _id: gameId },
    { $pull: { players: { id: visitorId } }, $set: { updatedAt: new Date() } }
  );
}

export function serializeGame(game: GameStateDoc): GameStateView;
export function serializeGame(game: GameStateDoc | null): GameStateView | null;
export function serializeGame(game: GameStateDoc | null): GameStateView | null {
  if (!game) return null;

  return {
    id: game._id,
    totalSegments: game.totalSegments,
    players: (game.players ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      segment: p.segment ?? 0,
      joinedAt: new Date(p.joinedAt).toISOString(),
    })),
    viewerCount: Math.max(0, game.viewerCount ?? 0),
    updatedAt: new Date(game.updatedAt).toISOString(),
  };
}
