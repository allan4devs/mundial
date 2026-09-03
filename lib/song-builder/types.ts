/**
 * Song Builder v1 domain model — shared by the browser studio and the API routes.
 *
 * A song is five fixed rows. Each row holds a rhythm the user beat-boxed with their
 * mouth, decoded into grid-snapped `Hit`s. Playback replays those hits with a real
 * instrument voice, so the user hears a guitar where they hummed.
 *
 * Nothing here imports React, Mongo or the Web Audio API: it is the contract both
 * sides agree on, and the shape a future model will be trained to produce.
 */

/** The five rows of a v1 song, in the order they appear on screen. */
export const TRACK_KINDS = ["guitarLead", "bass", "drums", "guitarFill", "synth"] as const;

export type TrackKind = (typeof TRACK_KINDS)[number];

/** Scales the melodic voices may quantise to. */
export const SCALES = ["minor", "major", "pentatonic"] as const;

export type ScaleName = (typeof SCALES)[number];

/**
 * One decoded mouth-hit, snapped to the loop grid.
 *
 * `velocity` and `tone` are what turn a flat `....|..|` rhythm into something
 * musical: how hard it was voiced, and how bright the vocalisation was. The
 * brightness picks the drum piece (boom -> kick, tss -> hat) and the scale degree
 * for the pitched rows. A future model replaces how these two are estimated, not
 * what they mean.
 */
export type Hit = {
  /** Step index inside the loop, `0 .. steps - 1`. */
  step: number;
  /** Loudness of the vocalisation, 0..1. */
  velocity: number;
  /** Spectral brightness of the vocalisation, 0..1. */
  tone: number;
};

/** One instrument row. */
export type Track = {
  kind: TrackKind;
  /** Id of a preset in the client instrument registry for this `kind`. */
  instrumentId: string;
  hits: Hit[];
  /** Row level, 0..1. */
  gain: number;
  muted: boolean;
};

/** A saved song, as it lives in Mongo and travels over the wire. */
export type Song = {
  id: string;
  title: string;
  author: string;
  /** Playback tempo. The recording window is always `RECORD_SECONDS` long. */
  bpm: number;
  /** Steps in one loop. Always sixteenth notes, so `steps / 4` beats. */
  steps: number;
  /** Root note as a MIDI number — the tonal centre for the pitched rows. */
  root: number;
  scale: ScaleName;
  tracks: Track[];
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
};

/**
 * A song as returned by the API: every track carries the `....|..|` rendering of
 * its hits. It is derived from `hits` on read — never stored — so the two can
 * never drift apart.
 */
export type TrackWire = Track & { pattern: string };
export type SongWire = Omit<Song, "tracks"> & { tracks: TrackWire[] };

/** How long the microphone stays open for one row. */
export const RECORD_SECONDS = 5;

/** Sixteenth-note grid. `DEFAULT_STEPS` sixteenths at `DEFAULT_BPM` last exactly 5s. */
export const STEPS_PER_BEAT = 4;
export const DEFAULT_STEPS = 32;
export const DEFAULT_BPM = 96;

export const MIN_BPM = 50;
export const MAX_BPM = 200;
export const MIN_STEPS = 8;
export const MAX_STEPS = 64;

/** MIDI range offered as a song root: C2 .. B3. `DEFAULT_ROOT` is A2. */
export const MIN_ROOT = 36;
export const MAX_ROOT = 59;
export const DEFAULT_ROOT = 45;

/** Header the studio sends its opaque per-browser owner key in. */
export const OWNER_HEADER = "x-studio-owner";

export const MAX_TITLE_LENGTH = 60;
export const MAX_AUTHOR_LENGTH = 40;

/** Seconds one sixteenth-note step lasts at `bpm`. */
export function stepSeconds(bpm: number) {
  return 60 / bpm / STEPS_PER_BEAT;
}

/** Seconds one full loop lasts. */
export function loopSeconds(bpm: number, steps: number) {
  return stepSeconds(bpm) * steps;
}
