/** Filterbank math: log frequency mapping, band layout and the response curve. */

import { DB_MAX, DB_MIN, DB_OFF, FB_MAX_HZ, FB_MIN_HZ } from "./constants";
import { clamp } from "./format";
import type { Spectral } from "../types";

const LOG_SPAN = Math.log2(FB_MAX_HZ / FB_MIN_HZ);

/** Frequency -> 0..1 across the filterbank span, log-scaled. */
export const freqToUnit = (hz: number) => clamp(Math.log2(hz / FB_MIN_HZ) / LOG_SPAN, 0, 1);

/** Inverse of {@link freqToUnit}. */
export const unitToFreq = (u: number) => FB_MIN_HZ * 2 ** (clamp(u, 0, 1) * LOG_SPAN);

/** Band edge + geometric-centre frequencies for an N-band log filterbank. */
export function bandFrequencies(n: number) {
  const edges: number[] = [];
  for (let k = 0; k <= n; k += 1) edges.push(FB_MIN_HZ * (FB_MAX_HZ / FB_MIN_HZ) ** (k / n));
  const centers: number[] = [];
  for (let i = 0; i < n; i += 1) centers.push(Math.sqrt(edges[i] * edges[i + 1]));
  return { edges, centers };
}

/** Spectral tilt + focus lens, evaluated at an arbitrary frequency (dB). */
export function spectralShapeDb(sp: Spectral, freq: number) {
  const tilt = sp.tiltDb * Math.log2(freq / 1000);
  const x = Math.log2(freq / sp.focusHz);
  const w = Math.max(0.12, sp.focusWidthOct);
  const lens = sp.focusAmtDb * (Math.exp(-(x * x) / (2 * w * w)) - 0.35);
  return tilt + lens;
}

/** Resulting gain (dB) for a single band: manual trim + tilt + lens, or hard-off. */
export function bandGainDb(sp: Spectral, center: number, index: number) {
  if (!sp.bandOn[index]) return DB_OFF;
  return clamp((sp.bandDb[index] ?? 0) + spectralShapeDb(sp, center), DB_MIN, DB_MAX);
}

export function dbToGain(db: number) {
  return db <= DB_OFF + 1 ? 0 : 10 ** (db / 20);
}

/** Interpolated manual trim (dB) at an arbitrary frequency, for the response curve. */
export function bandTrimAt(freq: number, centers: number[], bandDb: number[]) {
  const last = centers.length - 1;
  const lf = Math.log2(freq);
  if (lf <= Math.log2(centers[0])) return bandDb[0] ?? 0;
  if (lf >= Math.log2(centers[last])) return bandDb[last] ?? 0;
  for (let i = 1; i < centers.length; i += 1) {
    const l1 = Math.log2(centers[i]);
    if (lf <= l1) {
      const l0 = Math.log2(centers[i - 1]);
      const f = (lf - l0) / (l1 - l0 || 1);
      return (bandDb[i - 1] ?? 0) * (1 - f) + (bandDb[i] ?? 0) * f;
    }
  }
  return bandDb[last] ?? 0;
}

/** Full response of the bank at one frequency — manual trim plus tilt and lens. */
export function responseDbAt(sp: Spectral, centers: number[], freq: number) {
  return clamp(bandTrimAt(freq, centers, sp.bandDb) + spectralShapeDb(sp, freq), DB_MIN, DB_MAX);
}

/** Downsamples a buffer to `count` averaged absolute peaks, 0..1, for waveform drawing. */
export function buildPeaks(buffer: AudioBuffer, count = 600) {
  const channel = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channel.length / count));
  const peaks: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channel.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += Math.abs(channel[j]);
    peaks.push(Math.min(1, (sum / Math.max(1, end - start)) * 4));
  }
  return peaks;
}

/** RMS of a time-domain window, mapped to a 0..1 meter scale over a 60 dB window. */
export function rmsLevel(samples: Float32Array) {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  const rms = Math.sqrt(sum / samples.length);
  return clamp((20 * Math.log10(rms + 1e-9) + 60) / 60, 0, 1);
}
