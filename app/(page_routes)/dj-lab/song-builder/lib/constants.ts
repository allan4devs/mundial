/** Tunable limits and palettes shared across the Song Builder. */

export const SAMPLE_COLORS = [
  "#22c55e",
  "#38bdf8",
  "#f97316",
  "#e879f9",
  "#facc15",
  "#a855f7",
  "#f43f5e",
  "#2dd4bf",
] as const;

export const INSTRUMENT_PRESETS = [
  { name: "Drums", color: "#f97316" },
  { name: "Bass", color: "#22c55e" },
  { name: "Keys", color: "#38bdf8" },
  { name: "Vocal", color: "#e879f9" },
  { name: "FX", color: "#facc15" },
] as const satisfies readonly { name: string; color: string }[];

/** Quick chop lengths, in seconds. */
export const SNAP_OPTIONS = [0.5, 1, 2, 4] as const;

/** New layers chop this many seconds by default (clamped to the sample length). */
export const DEFAULT_CLIP_SECONDS = 2;

/** Shortest slice the engine will play — below this a looping source stutters. */
export const MIN_CLIP_SECONDS = 0.02;

export const MIN_SPEED = 0.25;
export const MAX_SPEED = 4;

/** Beat Grid: one bar of 16th-note steps. */
export const STEP_COUNT = 16;
export const STEPS_PER_BEAT = 4;

export const MIN_BPM = 40;
export const MAX_BPM = 220;
/** Tap-tempo and the per-layer source BPM field accept a wider range than the project clock. */
export const MIN_SOURCE_BPM = 20;
export const MAX_SOURCE_BPM = 300;

export const MIN_EXPORT_SECONDS = 2;
export const MAX_EXPORT_SECONDS = 120;
/** Extra tail rendered past the bounce length so decaying one-shots are not clipped. */
export const EXPORT_TAIL_SECONDS = 0.4;

/** Filterbank frequency span. */
export const FB_MIN_HZ = 32;
export const FB_MAX_HZ = 18000;
export const MIN_BANDS = 3;
export const MAX_BANDS = 32;
export const DEFAULT_BANDS = 12;

/** dB window used by the EQ curve editor. */
export const DB_MIN = -60;
export const DB_MAX = 18;
/** Sentinel gain for a hard-muted band. */
export const DB_OFF = -120;

/** Frozen empty array so "no meters" keeps a stable identity for memoised children. */
export const EMPTY_LEVELS: number[] = [];

/** Smoothing time constants for `setTargetAtTime`, in seconds. */
export const RAMP_FAST = 0.02;
export const RAMP_SLOW = 0.03;

/** Lead-in before a freshly created source starts, so scheduling never lands in the past. */
export const START_LEAD_SECONDS = 0.03;

export const AUDIO_FILE_ACCEPT = "audio/*,.mp3,.wav,.m4a,.ogg";
export const AUDIO_FILE_RE = /\.(mp3|wav|m4a|ogg|aac|flac)$/i;

export const WELCOME_MESSAGE =
  "New here? Pick a vibe in Instant Studio and hit Generate — a full track appears, no uploads needed.";

export const HOW_IT_WORKS = [
  ["Generate", "Pick a genre + key — a full locked track appears, no uploads."],
  ["Remix", "Same vibe, fresh chords and melody. Or Surprise for a random one."],
  ["Chop", "Drag the waveform handles, or the middle to slide the slice."],
  ["Split", "Open Spectral engine to fan a layer into N filter bands."],
  ["Bounce", "Offline render a fixed number of seconds to one WAV."],
] as const satisfies readonly (readonly [string, string])[];
