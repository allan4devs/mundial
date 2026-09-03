/**
 * Domain model for the Song Builder.
 *
 * Everything the studio manipulates is described here: the decoded audio a user
 * brought in (`Sample`), the arrangement rows built on top of it (`Layer`), and
 * the live Web Audio plumbing each row owns (`LayerChain`).
 */

/** A decoded source clip — an upload, or a loop synthesised by Instant Studio. */
export type Sample = {
  id: string;
  name: string;
  buffer: AudioBuffer;
  /** Pre-computed waveform envelope, 0..1, used by the chop strip. */
  peaks: number[];
  color: string;
  duration: number;
  /** true when produced by the Instant Studio generator (not a user upload). */
  generated?: boolean;
};

/** Per-layer multiband spectral engine — splits the layer into N filter bands. */
export type Spectral = {
  enabled: boolean;
  bands: number;
  /** spectral tilt in dB per octave, pivoting at 1 kHz */
  tiltDb: number;
  /** movable "lens": centre frequency, gain, and width (octaves) of a log-Gaussian bump */
  focusHz: number;
  focusAmtDb: number;
  focusWidthOct: number;
  /** manual trim per band, dB */
  bandDb: number[];
  bandOn: boolean[];
};

/** How a layer fires: continuously, or from the Beat Grid pattern. */
export type TriggerMode = "loop" | "steps";

/** One row of the arrangement: a chop of a sample plus how it should play. */
export type Layer = {
  id: string;
  name: string;
  color: string;
  sampleId: string | null;
  /** chop in / out points measured in seconds inside the source sample */
  clipStart: number;
  clipEnd: number;
  /** when true, the slice plays again the instant it ends — seamless, no overlap */
  loop: boolean;
  /** playback rate multiplier (0.25x .. 4x) */
  speed: number;
  gain: number;
  muted: boolean;
  soloed: boolean;
  spectral: Spectral;
  /** Moby-style backwards playback — flips the chopped region. */
  reversed: boolean;
  /** original tempo of the assigned sample, used to beat-match `speed` to the project BPM */
  sourceBpm: number | null;
  /** "loop" = continuous seamless loop. "steps" = only fires on active Beat Grid steps. */
  triggerMode: TriggerMode;
  /** Beat Grid pattern — one 16th-note bar, true = hit fires on that step. */
  steps: boolean[];
};

/** Persistent Web Audio graph for one layer: source -> input -> [bands | passthrough] -> output -> master. */
export type LayerChain = {
  input: GainNode;
  output: GainNode;
  enabled: boolean;
  bandCount: number;
  bandFilters: BiquadFilterNode[];
  bandGains: GainNode[];
  analysers: AnalyserNode[];
  source?: AudioBufferSourceNode;
  sourceBufferId?: string;
  sourceLoop?: boolean;
  sourceReversed?: boolean;
  /** true once this layer has been given a source in the current transport run */
  everStarted?: boolean;
};

/** Short-time Fourier analysis of one chopped region. */
export type Spectrogram = {
  frames: number;
  bins: number;
  sampleRate: number;
  /** magnitude in dB, normalised 0..1, row-major [frame * bins + bin] */
  mags: Float32Array;
  /** time-averaged spectrum, 0..1, length bins */
  avg: Float32Array;
};

/** Sample lookup by id — built once per `samples` change instead of re-scanning the array. */
export type SampleMap = ReadonlyMap<string, Sample>;

/** The window of the chop that actually reaches the speakers, after `reversed` is applied. */
export type ClipRange = { buffer: AudioBuffer; start: number; end: number };

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    webkitOfflineAudioContext?: typeof OfflineAudioContext;
  }
}
