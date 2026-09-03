/**
 * Mongo repository for Song Builder v1.
 *
 * One document per song on the shared database. `hits` is the stored truth; the
 * `....|..|` pattern string is rendered on read by {@link toWire} so the two can
 * never disagree. Songs are public to read and private to write: a browser keeps
 * an opaque `ownerKey` in local storage and only that key may update or delete.
 */

import type { Collection, Db } from "mongodb";

import { COLLECTIONS } from "@/lib/constants/db";
import { getDb } from "@/lib/helpers/mongodb";
import { encodePattern } from "./pattern";
import type { Song, SongWire } from "./types";
import { SongBuilderError, type SongInput } from "./validate";

/** Bump when a stored shape changes, so a migration can find old documents. */
export const SONG_SCHEMA_VERSION = 1;

type SongDoc = Omit<Song, "createdAt" | "updatedAt"> & {
  /** Opaque per-browser key. Never leaves the server. */
  ownerKey: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

let indexesReady: Promise<void> | null = null;

async function collection(): Promise<Collection<SongDoc>> {
  const db = await getDb();
  const songs = db.collection<SongDoc>(COLLECTIONS.SONG_BUILDER_SONGS);
  // One bootstrap per process — `createIndexes` is idempotent but not free.
  indexesReady ??= ensureSongIndexes(db).catch((error) => {
    indexesReady = null;
    throw error;
  });
  await indexesReady;
  return songs;
}

export async function ensureSongIndexes(db: Db) {
  await db.collection<SongDoc>(COLLECTIONS.SONG_BUILDER_SONGS).createIndexes([
    { key: { id: 1 }, unique: true, name: "song_id_unique" },
    { key: { updatedAt: -1 }, name: "song_recent" },
    { key: { ownerKey: 1, updatedAt: -1 }, name: "song_by_owner" },
  ]);
}

/** Strips the owner key and adds the derived pattern strings. */
function toWire(doc: SongDoc): SongWire {
  return {
    id: doc.id,
    title: doc.title,
    author: doc.author,
    bpm: doc.bpm,
    steps: doc.steps,
    root: doc.root,
    scale: doc.scale,
    tracks: doc.tracks.map((track) => ({ ...track, pattern: encodePattern(track.hits, doc.steps) })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const MAX_LIST_LIMIT = 50;

/** Most recently touched songs, optionally narrowed to one browser's own. */
export async function listSongs(options: { ownerKey?: string; limit?: number } = {}) {
  const songs = await collection();
  const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, Math.round(options.limit ?? 20)));
  const docs = await songs
    .find(options.ownerKey ? { ownerKey: options.ownerKey } : {})
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toWire);
}

export async function getSong(id: string): Promise<SongWire | null> {
  const songs = await collection();
  const doc = await songs.findOne({ id });
  return doc ? toWire(doc) : null;
}

/**
 * Creates the song, or overwrites it when `ownerKey` matches the one that first
 * saved it. Saving over someone else's id is a 403, not a silent new document.
 */
export async function saveSong(input: SongInput, ownerKey: string): Promise<SongWire> {
  const songs = await collection();
  const existing = await songs.findOne({ id: input.id }, { projection: { ownerKey: 1 } });
  if (existing && existing.ownerKey !== ownerKey) {
    throw new SongBuilderError("That song belongs to another studio session.", 403);
  }

  // `createdAt` is left to $setOnInsert, so it must not appear in $set as well —
  // Mongo rejects an update that touches the same path twice.
  const now = new Date();
  const fields: Omit<SongDoc, "createdAt"> = {
    ...input,
    ownerKey,
    schemaVersion: SONG_SCHEMA_VERSION,
    updatedAt: now,
  };

  const saved = await songs.findOneAndUpdate(
    { id: input.id },
    { $set: fields, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" },
  );
  if (!saved) throw new SongBuilderError("The song could not be saved.", 500);
  return toWire(saved);
}

export async function deleteSong(id: string, ownerKey: string) {
  const songs = await collection();
  const result = await songs.deleteOne({ id, ownerKey });
  if (result.deletedCount === 0) {
    throw new SongBuilderError("No song with that id belongs to this session.", 404);
  }
}
