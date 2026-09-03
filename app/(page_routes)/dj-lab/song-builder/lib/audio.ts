/** Web Audio plumbing: the shared context, the master bus and decode helpers. */

import { MASTER_CEILING_DB } from "./constants";

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

/** Master bus: every row lands on `input`, a limiter keeps five rows from clipping. */
export type MasterBus = {
  input: GainNode;
  gain: GainNode;
};

export function createMasterBus(ctx: AudioContext, level: number): MasterBus {
  const input = ctx.createGain();
  input.gain.value = 1;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = MASTER_CEILING_DB;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.18;

  const gain = ctx.createGain();
  gain.gain.value = level;

  input.connect(limiter);
  limiter.connect(gain);
  gain.connect(ctx.destination);

  return { input, gain };
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

/** Averages every channel into one array — all analysis works on mono. */
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
