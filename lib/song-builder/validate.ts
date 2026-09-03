/**
 * Turns untrusted JSON from the studio into a `SongInput` the repository can store.
 *
 * Anything unparseable is clamped or replaced rather than rejected: a song is a
 * toy, and losing a take to a validation error is worse than a coerced BPM.
 * `SongBuilderError` is reserved for requests that make no sense at all.
 */

import { normalizeHits } from "./pattern";
import {
  DEFAULT_BPM,
  DEFAULT_ROOT,
  DEFAULT_STEPS,
  MAX_AUTHOR_LENGTH,
  MAX_BPM,
  MAX_ROOT,
  MAX_STEPS,
  MAX_TITLE_LENGTH,
  MIN_BPM,
  MIN_ROOT,
  MIN_STEPS,
  SCALES,
  TRACK_KINDS,
  type ScaleName,
  type Track,
} from "./types";

/** A song as accepted by the API — no timestamps, those are the server's. */
export type SongInput = {
  id: string;
  title: string;
  author: string;
  bpm: number;
  steps: number;
  root: number;
  scale: ScaleName;
  tracks: Track[];
};

export class SongBuilderError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "SongBuilderError";
  }
}

/** Public song ids and owner keys share this shape: url-safe, short, opaque. */
const ID_RE = /^[a-z0-9-]{6,40}$/;
const INSTRUMENT_ID_RE = /^[a-z0-9-]{1,32}$/;

export function isSongId(value: unknown): value is string {
  return typeof value === "string" && ID_RE.test(value);
}

/** Rejects a malformed owner key instead of silently storing a song nobody owns. */
export function requireOwnerKey(value: unknown): string {
  if (!isSongId(value)) throw new SongBuilderError("Missing or malformed owner key.");
  return value;
}

export function newSongId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function parseSongInput(raw: unknown): SongInput {
  if (!raw || typeof raw !== "object") throw new SongBuilderError("Expected a song object.");
  const body = raw as Record<string, unknown>;

  const steps = int(body.steps, DEFAULT_STEPS, MIN_STEPS, MAX_STEPS);

  return {
    id: isSongId(body.id) ? body.id : newSongId(),
    title: text(body.title, MAX_TITLE_LENGTH) || "Untitled jam",
    author: text(body.author, MAX_AUTHOR_LENGTH) || "anon",
    bpm: int(body.bpm, DEFAULT_BPM, MIN_BPM, MAX_BPM),
    steps,
    root: int(body.root, DEFAULT_ROOT, MIN_ROOT, MAX_ROOT),
    scale: SCALES.includes(body.scale as ScaleName) ? (body.scale as ScaleName) : "minor",
    tracks: parseTracks(body.tracks, steps),
  };
}

/**
 * Rebuilds all five rows in canonical order, so a stored song always has exactly
 * the kinds this version knows about — extra rows are dropped, missing ones come
 * back empty.
 */
function parseTracks(raw: unknown, steps: number): Track[] {
  const byKind = new Map<string, Record<string, unknown>>();
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (entry && typeof entry === "object") {
        const track = entry as Record<string, unknown>;
        if (typeof track.kind === "string") byKind.set(track.kind, track);
      }
    }
  }

  return TRACK_KINDS.map((kind) => {
    const track = byKind.get(kind);
    const instrumentId = typeof track?.instrumentId === "string" ? track.instrumentId : "";
    return {
      kind,
      instrumentId: INSTRUMENT_ID_RE.test(instrumentId) ? instrumentId : "",
      hits: normalizeHits(Array.isArray(track?.hits) ? (track.hits as never[]) : [], steps),
      gain: number(track?.gain, 0.8, 0, 1),
      muted: track?.muted === true,
    };
  });
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function int(value: unknown, fallback: number, min: number, max: number) {
  return Math.round(number(value, fallback, min, max));
}
