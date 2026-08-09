import type { Db } from "mongodb";

/**
 * Race lobby state for the "La Vieja" platformer (app/(page_routes)/mapa/juego/online).
 *
 * Rooms live in `ghost_race_rooms` keyed by their 4-letter join code. The
 * websocket relay in scripts/game-ws-server.mjs tails `updatedAt` to push
 * changes, so every mutation here must bump `updatedAt` and `version`.
 */

export const RACE_ROOMS_COLLECTION = "ghost_race_rooms";

const ROOM_TTL_MS = 6 * 60 * 60 * 1000; // rooms expire after 6h
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
const CODE_LENGTH = 4;
const MAX_PLAYERS = 8;

export type RaceStatus = "lobby" | "racing" | "finished";

export type RacePlayerDoc = {
  id: string;
  name: string;
  ready: boolean;
  pct: number;
  x: number | null;
  y: number | null;
  finished: boolean;
  rank: number | null;
  finishedAt: Date | null;
};

export type RaceRoomDoc = {
  _id: string;
  hostId: string;
  status: RaceStatus;
  levelIndex: number;
  players: RacePlayerDoc[];
  startedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  version: number;
};

/** Mirrored by app/(page_routes)/mapa/juego/online/types.ts */
export type RacePlayerView = {
  id: string;
  name: string;
  ready: boolean;
  pct: number;
  x: number | null;
  y: number | null;
  finished: boolean;
  rank: number | null;
  finishedAt: number | null;
};

export type RaceRoomView = {
  code: string;
  hostId: string;
  status: RaceStatus;
  levelIndex: number;
  players: RacePlayerView[];
  startedAt: string | null;
  updatedAt: string;
  version: number;
};

function rooms(db: Db) {
  return db.collection<RaceRoomDoc>(RACE_ROOMS_COLLECTION);
}

function randomCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function newPlayer(id: string, name: string): RacePlayerDoc {
  return {
    id,
    name: name.trim().slice(0, 20) || "Jugador",
    ready: false,
    pct: 0,
    x: null,
    y: null,
    finished: false,
    rank: null,
    finishedAt: null,
  };
}

export async function createRoom(
  db: Db,
  hostId: string,
  name: string,
  levelIndex = 0
): Promise<string> {
  const now = new Date();

  // Codes are short, so retry on the (rare) collision instead of pre-checking.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = randomCode();
    try {
      await rooms(db).insertOne({
        _id: code,
        hostId,
        status: "lobby",
        levelIndex,
        players: [newPlayer(hostId, name)],
        startedAt: null,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + ROOM_TTL_MS),
        version: 1,
      });
      return code;
    } catch (error) {
      const isDuplicate = (error as { code?: number })?.code === 11000;
      if (!isDuplicate) throw error;
    }
  }

  throw new Error("No se pudo generar un código de sala disponible");
}

export async function getRoom(db: Db, code: string): Promise<RaceRoomDoc | null> {
  return rooms(db).findOne({ _id: code });
}

export async function joinRoom(
  db: Db,
  code: string,
  playerId: string,
  name: string
): Promise<{ ok: boolean; error?: string; room?: RaceRoomDoc }> {
  const room = await getRoom(db, code);
  if (!room) return { ok: false, error: "not_found" };

  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    // Rejoin: refresh the display name, keep progress.
    const now = new Date();
    const updated = await rooms(db).findOneAndUpdate(
      { _id: code, "players.id": playerId },
      {
        $set: { "players.$.name": newPlayer(playerId, name).name, updatedAt: now },
        $inc: { version: 1 },
      },
      { returnDocument: "after" }
    );
    return { ok: true, room: updated ?? room };
  }

  if (room.status !== "lobby") return { ok: false, error: "already_started" };
  if (room.players.length >= MAX_PLAYERS) return { ok: false, error: "room_full" };

  const now = new Date();
  const updated = await rooms(db).findOneAndUpdate(
    { _id: code, status: "lobby" },
    {
      $push: { players: newPlayer(playerId, name) },
      $set: { updatedAt: now },
      $inc: { version: 1 },
    },
    { returnDocument: "after" }
  );
  return updated ? { ok: true, room: updated } : { ok: false, error: "not_found" };
}

export async function setReady(
  db: Db,
  code: string,
  playerId: string,
  ready: boolean
): Promise<RaceRoomDoc | null> {
  const now = new Date();
  return rooms(db).findOneAndUpdate(
    { _id: code, "players.id": playerId },
    { $set: { "players.$.ready": ready, updatedAt: now }, $inc: { version: 1 } },
    { returnDocument: "after" }
  );
}

export async function startRace(
  db: Db,
  code: string,
  hostId: string
): Promise<{ ok: boolean; error?: string; room?: RaceRoomDoc }> {
  const room = await getRoom(db, code);
  if (!room) return { ok: false, error: "not_found" };
  if (room.hostId !== hostId) return { ok: false, error: "not_host" };
  if (room.status !== "lobby") return { ok: false, error: "already_started" };
  if (room.players.length < 2) return { ok: false, error: "not_enough_players" };
  if (!room.players.every((p) => p.ready || p.id === hostId)) {
    return { ok: false, error: "players_not_ready" };
  }

  const now = new Date();
  const updated = await rooms(db).findOneAndUpdate(
    { _id: code, status: "lobby" },
    {
      $set: {
        status: "racing",
        startedAt: now,
        updatedAt: now,
        "players.$[].pct": 0,
        "players.$[].finished": false,
        "players.$[].rank": null,
        "players.$[].finishedAt": null,
      },
      $inc: { version: 1 },
    },
    { returnDocument: "after" }
  );

  return updated ? { ok: true, room: updated } : { ok: false, error: "already_started" };
}

export async function updateProgress(
  db: Db,
  code: string,
  playerId: string,
  pct: number,
  x?: number,
  y?: number
): Promise<void> {
  const clamped = Math.min(100, Math.max(0, pct));
  const set: Record<string, unknown> = {
    "players.$.pct": clamped,
    updatedAt: new Date(),
  };
  if (typeof x === "number") set["players.$.x"] = x;
  if (typeof y === "number") set["players.$.y"] = y;

  await rooms(db).updateOne(
    { _id: code, "players.id": playerId, "players.finished": { $ne: true } },
    { $set: set, $inc: { version: 1 } }
  );
}

export async function finishPlayer(
  db: Db,
  code: string,
  playerId: string
): Promise<RaceRoomDoc | null> {
  const room = await getRoom(db, code);
  if (!room) return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player || player.finished) return room;

  const now = new Date();
  const rank = room.players.filter((p) => p.finished).length + 1;
  const everyoneDone = room.players.every((p) => p.finished || p.id === playerId);

  return rooms(db).findOneAndUpdate(
    { _id: code, "players.id": playerId },
    {
      $set: {
        "players.$.finished": true,
        "players.$.rank": rank,
        "players.$.finishedAt": now,
        "players.$.pct": 100,
        updatedAt: now,
        ...(everyoneDone ? { status: "finished" as RaceStatus } : {}),
      },
      $inc: { version: 1 },
    },
    { returnDocument: "after" }
  );
}

export function serializeRoom(room: RaceRoomDoc): RaceRoomView;
export function serializeRoom(room: RaceRoomDoc | null): RaceRoomView | null;
export function serializeRoom(room: RaceRoomDoc | null): RaceRoomView | null {
  if (!room) return null;

  return {
    code: room._id,
    hostId: room.hostId,
    status: room.status,
    levelIndex: room.levelIndex ?? 0,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      ready: Boolean(p.ready),
      pct: p.pct ?? 0,
      x: p.x ?? null,
      y: p.y ?? null,
      finished: Boolean(p.finished),
      rank: p.rank ?? null,
      finishedAt: p.finishedAt ? new Date(p.finishedAt).getTime() : null,
    })),
    startedAt: room.startedAt ? new Date(room.startedAt).toISOString() : null,
    updatedAt: new Date(room.updatedAt).toISOString(),
    version: room.version ?? 0,
  };
}
