/** Short-time Fourier analysis — the "read every layer" spectrogram view. */

import { clamp } from "./format";
import type { Spectrogram } from "../types";

/** In-place iterative radix-2 FFT. Length must be a power of two. */
export function fftRadix2(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlr = Math.cos(ang);
    const wli = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let wr = 1;
      let wi = 0;
      for (let k = 0; k < half; k += 1) {
        const a = i + k;
        const b = a + half;
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
        const nwr = wr * wlr - wi * wli;
        wi = wr * wli + wi * wlr;
        wr = nwr;
      }
    }
  }
}

const WINDOW = 1024;
const MAX_FRAMES = 260;
const MIN_DB = -100;
const MAX_DB = -12;

/** Hann windows are cheap but not free — one per window size is enough. */
const hannCache = new Map<number, Float32Array>();
function hannWindow(size: number) {
  let win = hannCache.get(size);
  if (!win) {
    win = new Float32Array(size);
    for (let i = 0; i < size; i += 1) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    hannCache.set(size, win);
  }
  return win;
}

/** STFT of a chopped region, normalised to 0..1 with a time-averaged spectrum alongside. */
export function computeSpectrogram(buffer: AudioBuffer, startSec: number, endSec: number): Spectrogram {
  const sr = buffer.sampleRate;
  const ch = buffer.getChannelData(0);
  const a = clamp(Math.floor(startSec * sr), 0, Math.max(0, ch.length - 1));
  const b = clamp(Math.floor(endSec * sr), a + 1, ch.length);
  const bins = WINDOW / 2;
  const span = b - a;
  const hop = Math.max(128, Math.ceil((span - WINDOW) / MAX_FRAMES) || 128);
  const frames = Math.max(1, Math.floor((span - WINDOW) / hop) + 1);
  const mags = new Float32Array(frames * bins);
  const avg = new Float32Array(bins);
  const re = new Float32Array(WINDOW);
  const im = new Float32Array(WINDOW);
  const hann = hannWindow(WINDOW);

  for (let f = 0; f < frames; f += 1) {
    const base = a + f * hop;
    for (let i = 0; i < WINDOW; i += 1) {
      const s = base + i;
      re[i] = s >= 0 && s < ch.length ? ch[s] * hann[i] : 0;
      im[i] = 0;
    }
    fftRadix2(re, im);
    for (let k = 0; k < bins; k += 1) {
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / WINDOW;
      const db = 20 * Math.log10(mag + 1e-9);
      const norm = clamp((db - MIN_DB) / (MAX_DB - MIN_DB), 0, 1);
      mags[f * bins + k] = norm;
      avg[k] += norm;
    }
  }
  for (let k = 0; k < bins; k += 1) avg[k] /= frames;
  return { frames, bins, sampleRate: sr, mags, avg };
}

/** The bin holding `freq`, clamped to the analysis range. */
export function binForFreq(spectro: Spectrogram, freq: number) {
  const nyquist = spectro.sampleRate / 2;
  return clamp(Math.round((freq / nyquist) * spectro.bins), 0, spectro.bins - 1);
}

const RAMP: readonly [number, number, number, number][] = [
  [0.0, 6, 10, 26],
  [0.35, 36, 62, 132],
  [0.6, 33, 145, 140],
  [0.8, 94, 201, 98],
  [1.0, 253, 231, 37],
];

/** viridis-ish ramp (0..1 -> [r,g,b]). */
export function spectralColor(t: number): [number, number, number] {
  for (let i = 1; i < RAMP.length; i += 1) {
    if (t > RAMP[i][0]) continue;
    const [p0, r0, g0, b0] = RAMP[i - 1];
    const [p1, r1, g1, b1] = RAMP[i];
    const f = (t - p0) / (p1 - p0 || 1);
    return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f];
  }
  return [253, 231, 37];
}

/** Paints a spectrogram into an offscreen canvas: x = frame, y = bin (low at the bottom). */
export function spectrogramToCanvas(spectro: Spectrogram): HTMLCanvasElement | null {
  const off = document.createElement("canvas");
  off.width = spectro.frames;
  off.height = spectro.bins;
  const ctx = off.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(spectro.frames, spectro.bins);
  for (let f = 0; f < spectro.frames; f += 1) {
    for (let bin = 0; bin < spectro.bins; bin += 1) {
      const [r, g, b] = spectralColor(spectro.mags[f * spectro.bins + bin]);
      const y = spectro.bins - 1 - bin;
      const idx = (y * spectro.frames + f) * 4;
      img.data[idx] = r;
      img.data[idx + 1] = g;
      img.data[idx + 2] = b;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return off;
}
