/**
 * The decoder: one loop of mouth noises in, grid-snapped `Hit`s out.
 *
 * Three passes, all in the time domain so there is no FFT to pay for:
 *
 *  1. `analyzeVoice`  - per-frame loudness (RMS), brightness (the share of energy
 *     above 500 Hz) and onset strength (the rise in compressed loudness).
 *  2. `detectOnsets`  - adaptive-threshold peak picking over the onset strength.
 *  3. `quantizeHits`  - snap each onset to the nearest sixteenth of the loop.
 *
 * This is the seam a neural network slots into later: swap `detectOnsets` for a
 * learned onset model, or the brightness estimate for a learned timbre
 * classifier, and the rest of the studio does not change.
 */

import { STEPS, type Hit } from "@/lib/song-builder/types";
import { toMono } from "./audio";
import { FRAME_SIZE, HOP_SIZE, MIN_HIT_SECONDS } from "./constants";
import { clamp } from "./format";

export type VoiceAnalysis = {
  /** Per-frame RMS, linear. */
  envelope: Float32Array;
  /** Per-frame brightness, 0..1 - "boom" is dark, "ka" is mid, "tss" is bright. */
  brightness: Float32Array;
  /** Half-wave rectified rise in compressed loudness. Peaks here are attacks. */
  flux: Float32Array;
  /** Quiet-frame level, used both to compress the envelope and to gate noise. */
  noiseFloor: number;
  hopSeconds: number;
  duration: number;
};

/**
 * Brightness is measured as how little of a frame's energy is *body*: the split
 * point sits above a hummed kick and below a hissed hat, so "boom" keeps almost
 * all its energy below it, "ka" keeps a plosive's worth, and "tss" keeps none.
 *
 * A zero-crossing rate is the cheaper proxy, but it saturates - anything noisy
 * pins it, so a snare and a hat come out identical. The band ratio does not.
 */
const TONE_SPLIT_HZ = 500;

export function analyzeVoice(buffer: AudioBuffer): VoiceAnalysis {
  const mono = toMono(buffer);
  const body = lowpass(mono, buffer.sampleRate, TONE_SPLIT_HZ);
  const hopSeconds = HOP_SIZE / buffer.sampleRate;
  const frames = Math.max(0, Math.floor((mono.length - FRAME_SIZE) / HOP_SIZE) + 1);

  const envelope = new Float32Array(frames);
  const brightness = new Float32Array(frames);

  for (let f = 0; f < frames; f += 1) {
    const start = f * HOP_SIZE;
    let energy = 0;
    let bodyEnergy = 0;
    for (let i = 0; i < FRAME_SIZE; i += 1) {
      energy += mono[start + i] ** 2;
      bodyEnergy += body[start + i] ** 2;
    }
    envelope[f] = Math.sqrt(energy / FRAME_SIZE);
    brightness[f] = energy > 0 ? clamp(1 - Math.sqrt(bodyEnergy / energy), 0, 1) : 0;
  }

  smoothInPlace(envelope);
  const noiseFloor = percentile(envelope, 0.2);

  // Compressing against the noise floor keeps a quiet hat after a loud kick
  // visible, which a plain linear difference would bury.
  const compress = (rms: number) => Math.log1p(rms / (noiseFloor + 1e-6));

  // The take is seeded with an implied frame of room tone rather than silence, so
  // a hit right on the downbeat still reads as a rise instead of being lost at
  // index 0 — while a take that opens quietly does not fake an onset there.
  const flux = new Float32Array(frames);
  let previous = compress(noiseFloor);
  for (let f = 0; f < frames; f += 1) {
    const level = compress(envelope[f]);
    flux[f] = Math.max(0, level - previous);
    previous = level;
  }

  return { envelope, brightness, flux, noiseFloor, hopSeconds, duration: buffer.duration };
}

/** One picked attack, before it knows which step it belongs to. */
export type Onset = {
  /** Seconds from the start of the take. */
  at: number;
  /** Peak loudness just after the attack, linear. */
  loudness: number;
  /** Mean brightness across the attack, 0..1. */
  tone: number;
};

/**
 * Adaptive-threshold peak picking.
 *
 * `sensitivity` is the only knob the studio exposes: 0 keeps just the obvious
 * hits, 1 catches every breath. It moves both the local-mean multiplier and the
 * absolute floor, because a peak has to beat both to count.
 */
export function detectOnsets(analysis: VoiceAnalysis, sensitivity: number): Onset[] {
  const { flux, envelope, brightness, hopSeconds, noiseFloor } = analysis;
  if (flux.length === 0) return [];

  const s = clamp(sensitivity, 0, 1);
  const localMean = runningMean(flux, Math.round(0.09 / hopSeconds));
  const multiplier = 2.4 - 1.35 * s;
  const absoluteFloor = maxOf(flux) * (0.18 - 0.14 * s);
  // Below this the frame is room tone, however sharp its rise looks.
  const gate = Math.max(noiseFloor * 2.5, maxOf(envelope) * 0.05);

  const minGap = Math.max(1, Math.round(MIN_HIT_SECONDS / hopSeconds));
  const attack = Math.max(1, Math.round(0.045 / hopSeconds));

  const onsets: Onset[] = [];
  let lastFrame = -minGap;

  for (let f = 0; f < flux.length; f += 1) {
    if (f - lastFrame < minGap) continue;
    const strength = flux[f];
    if (strength < localMean[f] * multiplier || strength < absoluteFloor) continue;
    if (!isLocalMax(flux, f, 2)) continue;

    const end = Math.min(flux.length, f + attack);
    const loudness = maxOf(envelope.subarray(f, end));
    if (loudness < gate) continue;

    onsets.push({ at: f * hopSeconds, loudness, tone: weightedTone(brightness, envelope, f, end) });
    lastFrame = f;
  }

  return onsets;
}

/**
 * Snaps onsets to the sixteenth-note grid and scales loudness into velocity.
 *
 * The take is recorded for exactly one loop, so absolute time maps straight onto
 * the grid; an onset landing on the final boundary wraps to the downbeat. The
 * take runs slightly past that boundary, so anything later than half a step past
 * the end is the tail and is dropped rather than wrapped onto step 1.
 *
 * `offset` is how late the recording actually started against the count-in, and
 * is added to every onset before snapping.
 */
export function quantizeHits(
  onsets: readonly Onset[],
  stepSeconds: number,
  offset = 0,
): Hit[] {
  const limit = (STEPS + 0.5) * stepSeconds;
  const inLoop = onsets.filter((onset) => onset.at + offset < limit);

  let loudest = 1e-6;
  for (const onset of inLoop) if (onset.loudness > loudest) loudest = onset.loudness;

  return inLoop.map((onset) => ({
    step: Math.round((onset.at + offset) / stepSeconds) % STEPS,
    // sqrt keeps quiet ghost notes audible instead of collapsing them to nothing.
    velocity: clamp(0.2 + 0.8 * Math.sqrt(onset.loudness / loudest), 0, 1),
    tone: onset.tone,
  }));
}

/** Downsamples the envelope to `count` bars, 0..1, for the take preview. */
export function sampleEnvelope(analysis: VoiceAnalysis, count: number) {
  const { envelope } = analysis;
  const bars = new Float32Array(count);
  const peak = maxOf(envelope);
  if (envelope.length === 0 || peak === 0) return bars;

  const width = envelope.length / count;
  for (let i = 0; i < count; i += 1) {
    const start = Math.floor(i * width);
    const end = Math.max(start + 1, Math.floor((i + 1) * width));
    bars[i] = maxOf(envelope.subarray(start, end)) / peak;
  }
  return bars;
}

// -----------------------------------------------------------------------------
// Array helpers
// -----------------------------------------------------------------------------

/** Two cascaded one-poles - 12 dB/octave, which is enough slope to tell a thump from a hiss. */
function lowpass(samples: Float32Array, sampleRate: number, hz: number) {
  const alpha = 1 - Math.exp((-2 * Math.PI * hz) / sampleRate);
  const out = new Float32Array(samples.length);
  let first = 0;
  let second = 0;
  for (let i = 0; i < samples.length; i += 1) {
    first += alpha * (samples[i] - first);
    second += alpha * (first - second);
    out[i] = second;
  }
  return out;
}

function maxOf(values: Float32Array) {
  let max = 0;
  for (let i = 0; i < values.length; i += 1) if (values[i] > max) max = values[i];
  return max;
}

/** Three-tap moving average - takes the jitter out of the RMS curve. */
function smoothInPlace(values: Float32Array) {
  let previous = values[0] ?? 0;
  for (let i = 1; i < values.length - 1; i += 1) {
    const current = values[i];
    values[i] = (previous + current + values[i + 1]) / 3;
    previous = current;
  }
}

/** Mean over a centred window, via prefix sums so the whole pass stays O(n). */
function runningMean(values: Float32Array, radius: number) {
  const sums = new Float64Array(values.length + 1);
  for (let i = 0; i < values.length; i += 1) sums[i + 1] = sums[i] + values[i];

  const means = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    const start = Math.max(0, i - radius);
    const end = Math.min(values.length, i + radius + 1);
    means[i] = (sums[end] - sums[start]) / (end - start);
  }
  return means;
}

function isLocalMax(values: Float32Array, index: number, radius: number) {
  const start = Math.max(0, index - radius);
  const end = Math.min(values.length, index + radius + 1);
  for (let i = start; i < end; i += 1) if (values[i] > values[index]) return false;
  return true;
}

function percentile(values: Float32Array, fraction: number) {
  if (values.length === 0) return 0;
  const sorted = Float32Array.from(values).sort();
  return sorted[clamp(Math.floor(sorted.length * fraction), 0, sorted.length - 1)];
}

/** Brightness across the attack, weighted by loudness so silence does not vote. */
function weightedTone(brightness: Float32Array, envelope: Float32Array, start: number, end: number) {
  let weighted = 0;
  let total = 0;
  for (let i = start; i < end; i += 1) {
    weighted += brightness[i] * envelope[i];
    total += envelope[i];
  }
  return total > 0 ? clamp(weighted / total, 0, 1) : 0.5;
}
