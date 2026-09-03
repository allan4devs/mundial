/**
 * Turning the wire model into something the studio can hold in React state, and
 * back again. Also owns the browser's identity: an opaque key in local storage
 * that decides which saved songs this browser may overwrite or delete.
 */

import {
  DEFAULT_BPM,
  DEFAULT_ROOT,
  DEFAULT_STEPS,
  TRACK_KINDS,
  type Song,
  type SongWire,
  type Track,
  type TrackKind,
} from "@/lib/song-builder/types";
import { decodePattern, fitHits, normalizeHits } from "@/lib/song-builder/pattern";
import { defaultInstrumentId } from "./instruments";
import { uid } from "./format";

const OWNER_STORAGE_KEY = "dj-lab.song-builder.owner";
const AUTHOR_STORAGE_KEY = "dj-lab.song-builder.author";

/**
 * The per-browser owner key, minted on first use. It is not a login - it only
 * stops one visitor from overwriting another's song, and clearing site data
 * means giving up write access to whatever this browser saved.
 */
export function ownerKey() {
  const stored = window.localStorage.getItem(OWNER_STORAGE_KEY);
  if (stored) return stored;
  const created = uid("own");
  window.localStorage.setItem(OWNER_STORAGE_KEY, created);
  return created;
}

export function rememberAuthor(author: string) {
  window.localStorage.setItem(AUTHOR_STORAGE_KEY, author);
}

export function recallAuthor() {
  return window.localStorage.getItem(AUTHOR_STORAGE_KEY) ?? "";
}

function createTrack(kind: TrackKind): Track {
  return { kind, instrumentId: defaultInstrumentId(kind), hits: [], gain: 0.8, muted: false };
}

/**
 * A hand-written starter, so the studio makes noise before anyone reaches for a
 * microphone — most first visits never grant mic access at all.
 *
 * Each line is one pass over a row. `tone` is what a take would have carried:
 * the drums get three passes because brightness is what picks the kit piece, and
 * writing them separately is how that reads. `normalizeHits` merges the passes.
 */
const DEMO_ROWS: { kind: TrackKind; pattern: string; tone: number }[] = [
  { kind: "drums", pattern: "!.......|.......!.......|...|...", tone: 0.08 },
  { kind: "drums", pattern: "....|.......|.......|.......|...", tone: 0.45 },
  { kind: "drums", pattern: "..|...|...|...|...|...|...|...|.", tone: 0.9 },
  { kind: "bass", pattern: "|.......|...|...|.......|...|...", tone: 0.0 },
  { kind: "guitarLead", pattern: "....|...|.....|.....|...|.|.....", tone: 0.62 },
  { kind: "guitarFill", pattern: "..|...|.....|.....|.....|...|...", tone: 0.4 },
  { kind: "synth", pattern: "|...............!...............", tone: 0.5 },
];

/** `createSong` with the demo rows decoded into it. */
export function createDemoSong(): Song {
  const song = createSong();
  return {
    ...song,
    title: "Demo groove",
    tracks: song.tracks.map((track) => ({
      ...track,
      hits: normalizeHits(
        DEMO_ROWS.filter((row) => row.kind === track.kind).flatMap((row) =>
          decodePattern(row.pattern).map((hit) => ({ ...hit, tone: row.tone })),
        ),
        song.steps,
      ),
    })),
  };
}

export function createSong(): Song {
  const now = new Date().toISOString();
  return {
    id: uid("s"),
    title: "Untitled jam",
    author: "",
    bpm: DEFAULT_BPM,
    steps: DEFAULT_STEPS,
    root: DEFAULT_ROOT,
    scale: "minor",
    tracks: TRACK_KINDS.map(createTrack),
    createdAt: now,
    updatedAt: now,
  };
}

/** Drops the derived pattern strings and re-seats any instrument this build lost. */
export function songFromWire(wire: SongWire): Song {
  const byKind = new Map(wire.tracks.map((track) => [track.kind, track]));
  return {
    ...wire,
    tracks: TRACK_KINDS.map((kind) => {
      const track = byKind.get(kind);
      if (!track) return createTrack(kind);
      return {
        kind,
        instrumentId: track.instrumentId || defaultInstrumentId(kind),
        hits: track.hits,
        gain: track.gain,
        muted: track.muted,
      };
    }),
  };
}

/** Replaces one row, leaving the other four untouched. */
export function patchTrack(song: Song, kind: TrackKind, patch: Partial<Track>): Song {
  return {
    ...song,
    tracks: song.tracks.map((track) => (track.kind === kind ? { ...track, ...patch } : track)),
  };
}

/** Resizes the grid, dropping any hit that no longer fits. */
export function resizeSong(song: Song, steps: number): Song {
  if (steps === song.steps) return song;
  return {
    ...song,
    steps,
    tracks: song.tracks.map((track) => ({ ...track, hits: fitHits(track.hits, steps) })),
  };
}

export function trackFor(song: Song, kind: TrackKind) {
  return song.tracks.find((track) => track.kind === kind) ?? createTrack(kind);
}
