/**
 * Song Builder domain model - shared by the browser studio and the API route.
 *
 * A song is ten rows. Each row holds a rhythm the user beat-boxed with their
 * mouth, decoded into grid-snapped `Hit`s, plus the id of the sound it plays
 * through. The sounds themselves live in Mongo, one pack per style, so picking
 * "rock" swaps every row's options - and its harmony, groove and space - without
 * a deploy.
 *
 * Nothing here imports React, Mongo or the Web Audio API: it is the contract
 * both sides agree on, and the shape a future model will be trained to produce.
 */

/**
 * The ten rows of a song, in the order they appear on screen.
 *
 * They are laid out as a frequency map, not a wish list: `bass` owns everything
 * under 200 Hz, `arp` and `perc` own the top, and the six in between are spaced
 * by `transpose` and carved apart by each sound's EQ. Ten voices at once mask
 * each other unless every one of them is given a slot, so a new row is only ever
 * worth adding where there is an empty band for it to sit in.
 */
export const TRACK_KINDS = [
  "guitarLead",
  "bass",
  "drums",
  "guitarFill",
  "synth",
  "keys",
  "brass",
  "strings",
  "arp",
  "perc",
] as const;

export type TrackKind = (typeof TRACK_KINDS)[number];

/** The style packs the selector offers. One Mongo document each. */
export const STYLES = ["groovy", "rock", "pop"] as const;

export type Style = (typeof STYLES)[number];

/** Scales the melodic voices quantise to. A style pack picks one. */
export const SCALES = ["minor", "major", "pentatonic", "dorian", "phrygian"] as const;

export type ScaleName = (typeof SCALES)[number];

/** The synth engines a sound can name. A pack picks one and tunes it with `config`. */
export const VOICE_IDS = ["pluck", "sub", "kit", "stab", "pad", "bell", "brass"] as const;

export type VoiceId = (typeof VOICE_IDS)[number];

/**
 * The pieces the `kit` engine can fire.
 *
 * A `kit` sound names three of them, and brightness picks between them - which
 * is what makes "Congas" congas rather than a pitched-up kick, snare and hat.
 */
export const DRUM_PIECES = [
  "kick",
  "sub808",
  "snare",
  "clap",
  "rim",
  "tom",
  "conga",
  "hat",
  "openHat",
  "shaker",
  "tamb",
  "cowbell",
  "block",
  "triangle",
] as const;

export type DrumPiece = (typeof DRUM_PIECES)[number];

/** Chord qualities a progression can call for. Intervals live in `harmony.ts`. */
export const CHORD_TYPES = ["min", "maj", "min7", "maj7", "dom7", "sus2", "sus4", "min9", "maj9"] as const;

export type ChordType = (typeof CHORD_TYPES)[number];

/** One chord in a progression: a scale degree, and the quality built on it. */
export type Chord = {
  /** Degree of the pack's scale, 0-indexed. 0 is the tonic. */
  degree: number;
  type: ChordType;
};

/**
 * How a row reads the chord under it.
 *
 * This is what stops ten rows playing ten unrelated notes. Brightness still
 * decides the contour - humming higher still sounds higher - but where that
 * contour is allowed to land depends on the row's job in the arrangement.
 */
export const HARMONY_ROLES = ["root", "chord", "lead"] as const;

export type HarmonyRole = (typeof HARMONY_ROLES)[number];

/**
 * One decoded mouth-hit, snapped to the loop grid.
 *
 * `velocity` and `tone` are what turn a flat `....|..|` rhythm into something
 * musical: how hard it was voiced, and how bright the vocalisation was. The
 * brightness picks the drum piece (boom -> kick, tss -> hat) and the position in
 * the chord for the pitched rows. A future model replaces how these two are
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

/** One instrument row: a rhythm, the sound it plays through, and whether it is heard. */
export type Track = {
  kind: TrackKind;
  /** Id of a sound in the loaded style pack. */
  soundId: string;
  hits: Hit[];
  /** Silenced. The rhythm stays written down; the row's fader goes to zero. */
  muted: boolean;
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

/**
 * Where a row sits in the stereo field, and how much of the shared space it
 * takes. Ten dry mono rows stacked on one point is what a demo sounds like; a
 * record is ten rows each given a position, a distance and a duck.
 */
export type Mix = {
  /** Position, -1 hard left to +1 hard right. */
  pan: number;
  /** Stereo spread of a voice's own detuned copies, 0..1. */
  width: number;
  /** Send into the reverb bus, 0..1. */
  reverb: number;
  /** Send into the tempo-synced delay bus, 0..1. */
  delay: number;
  /** How far the kick ducks this row, 0..1. Bass and pads want it; hats do not. */
  duck: number;
};

/** One entry in a style pack's sound list - what a row's selector offers. */
export type Sound = {
  id: string;
  kind: TrackKind;
  label: string;
  voice: VoiceId;
  /** Semitones above the pack's root, so each row sits in its own register. */
  transpose: number;
  /** How this row reads the chord under it. Ignored by `kit`. */
  harmony: HarmonyRole;
  /** Which three pieces the `kit` engine fires, dark to bright. Ignored otherwise. */
  pieces: DrumPiece[];
  /** Knobs for the named voice. Unknown keys are ignored; missing ones fall back. */
  config: Record<string, number>;
  amp: Amp;
  eq: Eq;
  mix: Mix;
};

/**
 * The room the whole band is playing in.
 *
 * One reverb and one delay, shared by every row and fed by per-sound sends -
 * which is how records are mixed, and the reason ten rows sound like one band
 * rather than ten separate recordings.
 */
export type Space = {
  /** Reverb tail in seconds, 0.3..4. */
  size: number;
  /** How fast the tail loses its top end, 0..1. */
  damp: number;
  /** Return level of the reverb bus, 0..1. */
  wet: number;
  /** Delay time in sixteenth steps. 3 is the dotted eighth every record uses. */
  delaySteps: number;
  /** Delay regeneration, 0..0.85. */
  feedback: number;
};

/** Everything one style means: how it is tuned, how it swings, and what it plays. */
export type StylePack = {
  style: Style;
  label: string;
  /**
   * Bumped whenever `SEED` changes shape. A stored document older than the code
   * is replaced rather than read: a pack from before a field existed would play,
   * but it would play the fallback for every sound in it, which is worse than
   * losing a hand-edit nobody made.
   */
  version: number;
  /** Tonal centre as a MIDI number. */
  root: number;
  scale: ScaleName;
  bpm: number;
  /** The chords under the loop, spread evenly across it. Every row obeys them. */
  progression: Chord[];
  /** How far off-grid the offbeat sixteenths fall, 0..0.35. */
  swing: number;
  space: Space;
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
