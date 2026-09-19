/** Studio copy, palette and tuning knobs. The wire model lives in `@/lib/song-builder`. */

import type { DrumPiece, TrackKind } from "@/lib/song-builder/types";

type TrackMeta = {
  label: string;
  /** What to make with your mouth so the decoder hears it clearly. */
  cue: string;
  color: string;
};

/** One entry per row, keyed by the canonical `TRACK_KINDS` order. */
export const TRACK_META: Record<TrackKind, TrackMeta> = {
  guitarLead: { label: "Guitar lead", cue: 'Sing it - "na  na-naa"', color: "#f97316" },
  bass: { label: "Bass", cue: 'Short and low - "dum  dum-dum"', color: "#22c55e" },
  drums: { label: "Drums", cue: '"boom" kick, "ka" snare, "tss" hat', color: "#38bdf8" },
  guitarFill: { label: "Fill guitar", cue: 'Chop the gaps - "chk  chk-chk"', color: "#e879f9" },
  synth: { label: "Synth", cue: 'Hold it - "aaah  aah"', color: "#facc15" },
  keys: { label: "Keys", cue: 'Bounce it - "doo  doo-doo"', color: "#a78bfa" },
  brass: { label: "Brass", cue: 'Punch it - "bah  bah-bah"', color: "#fb7185" },
  strings: { label: "Strings", cue: 'Swell it - "aaaah"', color: "#2dd4bf" },
  arp: { label: "Arp", cue: 'Trickle it - "di-di-di-di"', color: "#f472b6" },
  perc: { label: "Percussion", cue: '"tk" block, "ka" clap, "ss" shaker', color: "#94a3b8" },
};

/** What a silenced row is drawn in, in place of its own colour. */
export const MUTED_COLOR = "#475569";

/** Analysis window. 1024/256 at 44.1 kHz is a ~5.8 ms hop - tight enough for hats. */
export const FRAME_SIZE = 1024;
export const HOP_SIZE = 256;

/** Two vocal hits closer than this are one hit that wobbled. */
export const MIN_HIT_SECONDS = 0.06;

export const DEFAULT_SENSITIVITY = 0.5;

/** Beats of metronome before the microphone opens, so the take lands on the grid. */
export const COUNT_IN_BEATS = 4;

/**
 * Recorded past the end: on a beat-box take so a hit right on the loop boundary
 * is captured, on a sung take so the last notes decay into the file.
 */
export const TAKE_TAIL_SECONDS = 0.25;

/** Look-ahead scheduling: wake often, schedule a little into the future. */
export const SCHEDULER_TICK_MS = 25;
export const SCHEDULE_AHEAD_SECONDS = 0.12;

// ---------------------------------------------------------------------------
// The desk
// ---------------------------------------------------------------------------

/** Corner frequencies of a row's three-band equaliser. */
export const EQ_LOW_HZ = 220;
export const EQ_MID_HZ = 1200;
export const EQ_HIGH_HZ = 4500;

/**
 * Every row is filtered from underneath, at a corner that follows its register.
 * A row transposed two octaves up loses everything below ~120 Hz, which is what
 * keeps the bottom of the mix belonging to the bass and the kick alone.
 */
export const HPF_BASE_HZ = 30;
export const HPF_MAX_HZ = 400;

/** How long a ducked row takes to come back after a kick. */
export const DUCK_RELEASE_SECONDS = 0.22;

/**
 * The pieces the mix gets out of the way of. Whichever row plays one, everything
 * else is pulled down under it - which is the pump every dance record is built
 * on, and the only reason a bass and a kick can occupy the same octave.
 */
export const DUCKING_PIECES: DrumPiece[] = ["kick", "sub808"];

/** Time constant for `setTargetAtTime` - short enough to feel instant. */
export const RAMP_SECONDS = 0.02;

// ---------------------------------------------------------------------------
// The master chain
// ---------------------------------------------------------------------------

/**
 * The master fader, and the most important number in the file.
 *
 * Ten rows summing at full tilt arrive at the bus several times over full scale.
 * Feeding that to a compressor does not make it loud, it makes it flat: the glue
 * stops gluing and becomes a leveller, and the limiter rides the whole programme
 * instead of catching its peaks. Trimming first is what leaves a crest factor -
 * the gap between the loudest moment and the average - and that gap is what a
 * record has and a demo does not.
 */
export const BUS_TRIM = 0.15;

/** Bus compression: shallow, slow, permanently on. Glue, not level control. */
export const GLUE = { threshold: -17, knee: 14, ratio: 2.2, attack: 0.022, release: 0.24 };

/** What the glue gives away, given back before the saturator sees the signal. */
export const MAKEUP = 1.45;

/** How hard the master is driven into tape. Past ~0.5 this stops being glue. */
export const SATURATION = 0.34;

/** The master tilt. Two dB either end; anything more belongs on a row. */
export const WEIGHT_HZ = 110;
export const WEIGHT_DB = 1.6;
export const AIR_HZ = 9500;
export const AIR_DB = 2.2;

/** The brickwall. Fast enough to catch a transient, quiet enough to leave room. */
export const LIMITER = { threshold: -1.6, knee: 0, ratio: 20, attack: 0.001, release: 0.09 };

/** Final trim off the limiter. */
export const MASTER_LEVEL = 0.92;

// ---------------------------------------------------------------------------
// Groove
// ---------------------------------------------------------------------------

/**
 * How far a note may drift off its step, in seconds, at full humanisation.
 * Six milliseconds is about the tightest a session drummer plays; it reads as
 * feel rather than as error, and past ten it starts to read as sloppy.
 */
export const HUMANIZE_SECONDS = 0.006;

/**
 * The accent curve, one entry per sixteenth of a beat.
 *
 * A beat is not four equal sixteenths: the downbeat is loudest, the third
 * sixteenth is next, and the two in between are ghosts. Applying this is the
 * difference between a drum machine and a groove, and it costs one multiply.
 */
export const ACCENTS = [1, 0.78, 0.9, 0.8];
