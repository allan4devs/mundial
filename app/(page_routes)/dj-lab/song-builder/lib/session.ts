/**
 * Building a song around a style pack, and looking things up inside it.
 *
 * Nothing here is persisted: the song lives for as long as the tab does. Mongo
 * holds the sounds, not the songs, so switching style is the only thing that
 * rebuilds the document.
 */

import { decodePattern, normalizeHits } from "@/lib/song-builder/pattern";
import {
  TRACK_KINDS,
  type Song,
  type Sound,
  type StylePack,
  type Track,
  type TrackKind,
} from "@/lib/song-builder/types";

/** Every sound a row can be played through, in pack order. */
export function soundsFor(pack: StylePack, kind: TrackKind) {
  return pack.sounds.filter((sound) => sound.kind === kind);
}

/**
 * The sound a row is set to. Never fails: an id from another style, or one an
 * edit to the collection removed, falls back to the row's first sound.
 */
export function soundFor(pack: StylePack, kind: TrackKind, soundId: string): Sound {
  const options = soundsFor(pack, kind);
  return options.find((sound) => sound.id === soundId) ?? options[0];
}

function createTrack(pack: StylePack, kind: TrackKind, hits: Track["hits"] = []): Track {
  return { kind, soundId: soundFor(pack, kind, "").id, hits };
}

export function createSong(pack: StylePack): Song {
  return {
    style: pack.style,
    bpm: pack.bpm,
    tracks: TRACK_KINDS.map((kind) => createTrack(pack, kind)),
  };
}

/**
 * Re-seats a song on a new style pack: the rhythms survive, every row moves to
 * the new pack's first sound, and the tempo follows the style.
 */
export function restyle(song: Song, pack: StylePack): Song {
  return {
    style: pack.style,
    bpm: pack.bpm,
    tracks: song.tracks.map((track) => createTrack(pack, track.kind, track.hits)),
  };
}

/**
 * A hand-written starter, so the studio makes noise before anyone reaches for a
 * microphone - most first visits never grant mic access at all.
 *
 * Each line is one pass over a row. `tone` is what a take would have carried:
 * the drums get three passes because brightness is what picks the kit piece, and
 * writing them separately is how that reads. `normalizeHits` merges the passes,
 * keeping the loudest where two land on the same step.
 */
const DEMO_ROWS: { kind: TrackKind; pattern: string; tone: number }[] = [
  { kind: "drums", pattern: "!.......|.......!.......|.|.....", tone: 0.08 },
  { kind: "drums", pattern: "....|.......|.......|.......|...", tone: 0.45 },
  { kind: "drums", pattern: "..|...|...|...|...|...|...|...|.", tone: 0.9 },
  { kind: "bass", pattern: "|.......|...|...|.......|...|...", tone: 0.0 },
  { kind: "guitarLead", pattern: "....|...|.....|.....|...|.|.....", tone: 0.62 },
  { kind: "guitarFill", pattern: "..|...|.....|.....|.....|...|...", tone: 0.4 },
  { kind: "synth", pattern: "|...............!...............", tone: 0.5 },
];

export function createDemoSong(pack: StylePack): Song {
  return {
    ...createSong(pack),
    tracks: TRACK_KINDS.map((kind) =>
      createTrack(
        pack,
        kind,
        normalizeHits(
          DEMO_ROWS.filter((row) => row.kind === kind).flatMap((row) =>
            decodePattern(row.pattern).map((hit) => ({ ...hit, tone: row.tone })),
          ),
        ),
      ),
    ),
  };
}

/** Replaces one row, leaving the other four untouched. */
export function patchTrack(song: Song, kind: TrackKind, patch: Partial<Track>): Song {
  return {
    ...song,
    tracks: song.tracks.map((track) => (track.kind === kind ? { ...track, ...patch } : track)),
  };
}

export function trackFor(song: Song, kind: TrackKind) {
  return song.tracks.find((track) => track.kind === kind);
}
