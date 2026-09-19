/**
 * Song Builder v1 domain model - shared by the browser studio and the API route.
 *
 * A song is five rows. Each row holds a rhythm the user beat-boxed with their
 * mouth, decoded into grid-snapped `Hit`s, plus the id of the sound it plays
 * through. The sounds themselves live in Mongo, one pack per style, so picking
 * "rock" swaps every row's options without a deploy.
 *
 * Nothing here imports React, Mongo or the Web Audio API: it is the contract
 * both sides agree on, and the shape a future model will be trained to produce.
 */

/** The five rows of a song, in the order they appear on screen. */
export const TRACK_KINDS = ["guitarLead", "bass", "drums", "guitarFill", "synth"] as const;

export type TrackKind = (typeof TRACK_KINDS)[number];

/** The style packs the selector offers. One Mongo document each. */
export const STYLES = ["groovy", "rock", "pop"] as const;

export type Style = (typeof STYLES)[number];

/** Scales the melodic voices quantise to. A style pack picks one. */
export const SCALES = ["minor", "major", "pentatonic"] as const;

export type ScaleName = (typeof SCALES)[number];

/** The synth engines a sound can name. A pack picks one and tunes it with `config`. */
export const VOICE_IDS = ["pluck", "sub", "kit", "stab", "pad"] as const;

export type VoiceId = (typeof VOICE_IDS)[number];

/**
 * One decoded mouth-hit, snapped to the loop grid.
 *
 * `velocity` and `tone` are what turn a flat `....|..|` rhythm into something
 * musical: how hard it was voiced, and how bright the vocalisation was. The
 * brightness picks the drum piece (boom -> kick, tss -> hat) and the scale
 * degree for the pitched rows. A future model replaces how these two are
 * estimated, not what they mean.
 */
export type Hit = {
  /** Step index inside the loop, `0 .. STEPS - 1`. */
  step: number;
  /** Loudness of the vocalisation, 0..1. */
  velocity: number;
  /** Spectral brightness of the vocalisation, 0..1. */
  tone: number;
};

/** One instrument row: a rhythm and the sound it plays through. */
export type Track = {
  kind: TrackKind;
  /** Id of a sound in the loaded style pack. */
  soundId: string;
  hits: Hit[];
};

/** What the user is building. It is never persisted - only sounds are. */
export type Song = {
  style: Style;
  bpm: number;
  tracks: Track[];
};

/**
 * The channel strip a sound is played through: an amplifier, then three bands of
 * equalisation. This is what makes "crunch stack" and "clean sparkle" different
 * instruments rather than different labels on the same one.
 */
export type Amp = {
  /** Soft-clipping drive, 0..1. */
  drive: number;
  /** Output trim, 0..1. */
  level: number;
};

export type Eq = {
  /** Shelf and peak gains in dB, -18..+18. */
  low: number;
  mid: number;
  high: number;
};

/** One entry in a style pack's sound list - what a row's selector offers. */
export type Sound = {
  id: string;
  kind: TrackKind;
  label: string;
  voice: VoiceId;
  /** Semitones above the pack's root, so each row sits in its own register. */
  transpose: number;
  /** Knobs for the named voice. Unknown keys are ignored; missing ones fall back. */
  config: Record<string, number>;
  amp: Amp;
  eq: Eq;
};

/** Everything one style means: how it is tuned, and what it can be played with. */
export type StylePack = {
  style: Style;
  label: string;
  /** Tonal centre as a MIDI number. */
  root: number;
  scale: ScaleName;
  bpm: number;
  sounds: Sound[];
};

/** Sixteenth-note grid. Two bars, fixed - the loop length is not a setting. */
export const STEPS_PER_BEAT = 4;
export const STEPS = 32;

export const MIN_BPM = 60;
export const MAX_BPM = 180;

/** Seconds one sixteenth-note step lasts at `bpm`. */
export function stepSeconds(bpm: number) {
  return 60 / bpm / STEPS_PER_BEAT;
}

/** Seconds one full loop lasts - and so how long the microphone stays open. */
export function loopSeconds(bpm: number) {
  return stepSeconds(bpm) * STEPS;
}
