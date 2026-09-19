/** Studio copy, palette and tuning knobs. The wire model lives in `@/lib/song-builder`. */

import type { TrackKind } from "@/lib/song-builder/types";

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
};

/** Analysis window. 1024/256 at 44.1 kHz is a ~5.8 ms hop - tight enough for hats. */
export const FRAME_SIZE = 1024;
export const HOP_SIZE = 256;

/** Two vocal hits closer than this are one hit that wobbled. */
export const MIN_HIT_SECONDS = 0.06;

export const DEFAULT_SENSITIVITY = 0.5;

/** Beats of metronome before the microphone opens, so the take lands on the grid. */
export const COUNT_IN_BEATS = 4;

/** Recorded past the end of the loop, so a hit right on the boundary is captured. */
export const TAKE_TAIL_SECONDS = 0.25;

/** Look-ahead scheduling: wake often, schedule a little into the future. */
export const SCHEDULER_TICK_MS = 25;
export const SCHEDULE_AHEAD_SECONDS = 0.12;

/** Master bus headroom and trim, so five rows at once do not clip. */
export const MASTER_CEILING_DB = -6;
export const MASTER_LEVEL = 0.9;

/** Corner frequencies of a row's three-band equaliser. */
export const EQ_LOW_HZ = 220;
export const EQ_MID_HZ = 1200;
export const EQ_HIGH_HZ = 4500;

/** Time constant for `setTargetAtTime` - short enough to feel instant. */
export const RAMP_SECONDS = 0.02;
