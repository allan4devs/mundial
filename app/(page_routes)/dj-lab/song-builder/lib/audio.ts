/** Web Audio plumbing: the shared context, the master bus and a row's channel strip. */

import type { Sound } from "@/lib/song-builder/types";
import { EQ_HIGH_HZ, EQ_LOW_HZ, EQ_MID_HZ, MASTER_CEILING_DB, MASTER_LEVEL, RAMP_SECONDS } from "./constants";

let context: AudioContext | null = null;

function getAudioCtor(): typeof AudioContext {
  const ctor = window.AudioContext || window.webkitAudioContext;
  if (!ctor) throw new Error("Web Audio is not supported in this browser.");
  return ctor;
}

/**
 * The one `AudioContext` for the studio, resumed on demand. Browsers only let it
 * start inside a gesture, so every entry point (record, play, preview) awaits this.
 */
export async function getAudioContext(): Promise<AudioContext> {
  context ??= new (getAudioCtor())();
  if (context.state === "suspended") await context.resume();
  return context;
}

/**
 * A soft ceiling. The master wears one so five rows at once do not clip, and a
 * sung take wears another so the band plus a voice does not.
 */
export function createLimiter(ctx: AudioContext) {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = MASTER_CEILING_DB;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.18;
  return limiter;
}

/**
 * Master bus: every row lands on `input` and the whole band leaves through
 * `output`, which is both the speakers and the tap a sung take records off.
 */
export function createMasterBus(ctx: AudioContext) {
  const input = ctx.createGain();
  input.gain.value = 1;

  const limiter = createLimiter(ctx);

  const output = ctx.createGain();
  output.gain.value = MASTER_LEVEL;

  input.connect(limiter);
  limiter.connect(output);
  output.connect(ctx.destination);

  return { input, output };
}

/**
 * One row's channel strip: an amplifier, then three bands of equalisation.
 *
 * This is what a sound document's `amp` and `eq` drive, and it is what makes
 * "crunch stack" and "clean sparkle" genuinely different instruments rather than
 * two labels on the same oscillators. Notes are fired into `input`; the strip is
 * built once per row and only ever retuned, so changing sound mid-loop does not
 * interrupt a ringing note.
 */
export type Strip = {
  /** The drive stage - voices connect here. */
  input: WaveShaperNode;
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  high: BiquadFilterNode;
  level: GainNode;
};

export function createStrip(ctx: AudioContext, destination: AudioNode): Strip {
  const input = ctx.createWaveShaper();
  input.oversample = "2x";

  const low = ctx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = EQ_LOW_HZ;

  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = EQ_MID_HZ;
  mid.Q.value = 0.9;

  const high = ctx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = EQ_HIGH_HZ;

  const level = ctx.createGain();

  input.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(level);
  level.connect(destination);

  return { input, low, mid, high, level };
}

/** Pushes a sound's amplifier and EQ into a strip already in the graph. */
export function applyStrip(ctx: AudioContext, strip: Strip, sound: Sound) {
  strip.input.curve = driveCurve(sound.amp.drive);
  const now = ctx.currentTime;
  strip.low.gain.setTargetAtTime(sound.eq.low, now, RAMP_SECONDS);
  strip.mid.gain.setTargetAtTime(sound.eq.mid, now, RAMP_SECONDS);
  strip.high.gain.setTargetAtTime(sound.eq.high, now, RAMP_SECONDS);
  strip.level.gain.setTargetAtTime(sound.amp.level, now, RAMP_SECONDS);
}

/** Soft asymmetric clipping. At `amount` 0 the curve is a straight line, so no bypass is needed. */
function driveCurve(amount: number) {
  const samples = 1024;
  const curve = new Float32Array(samples);
  const k = amount * 40;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/** One second of white noise, reused by every snare and hat in the session. */
export function noiseBuffer(ctx: BaseAudioContext) {
  const cached = noiseCache.get(ctx);
  if (cached) return cached;

  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  noiseCache.set(ctx, buffer);
  return buffer;
}

/** Averages every channel into one array - all analysis works on mono. */
export function toMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  if (channels === 1) return buffer.getChannelData(0);

  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < channels; c += 1) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < mono.length; i += 1) mono[i] += data[i];
  }
  for (let i = 0; i < mono.length; i += 1) mono[i] /= channels;
  return mono;
}

export async function decodeBlob(ctx: AudioContext, blob: Blob) {
  return ctx.decodeAudioData(await blob.arrayBuffer());
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
