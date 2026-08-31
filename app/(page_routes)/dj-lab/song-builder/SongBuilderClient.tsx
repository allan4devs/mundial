"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Disc3,
  Download,
  Eraser,
  Gauge,
  Grid3x3,
  Hand,
  Layers,
  Magnet,
  Music2,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Rewind,
  Scissors,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Waves,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GENRES, KEYS, generateSong, type GenreId } from "./songForge";

type Sample = {
  id: string;
  name: string;
  buffer: AudioBuffer;
  peaks: number[];
  color: string;
  duration: number;
  /** true when produced by the Instant Studio generator (not a user upload). */
  generated?: boolean;
};

/** Per-layer multiband spectral engine — splits the layer into N filter bands. */
type Spectral = {
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

type Layer = {
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
  /** "loop" = today's continuous seamless loop. "steps" = only fires on active Beat Grid steps. */
  triggerMode: "loop" | "steps";
  /** Beat Grid pattern — one 16th-note bar, true = hit fires on that step. */
  steps: boolean[];
};

/** Persistent Web Audio graph for one layer: source -> input -> [bands | passthrough] -> output -> master. */
type LayerChain = {
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

type Spectrogram = {
  frames: number;
  bins: number;
  sampleRate: number;
  /** magnitude in dB, normalised 0..1, row-major [frame * bins + bin] */
  mags: Float32Array;
  /** time-averaged spectrum, 0..1, length bins */
  avg: Float32Array;
};

const SAMPLE_COLORS = ["#22c55e", "#38bdf8", "#f97316", "#e879f9", "#facc15", "#a855f7", "#f43f5e", "#2dd4bf"];

const INSTRUMENT_PRESETS: { name: string; color: string }[] = [
  { name: "Drums", color: "#f97316" },
  { name: "Bass", color: "#22c55e" },
  { name: "Keys", color: "#38bdf8" },
  { name: "Vocal", color: "#e879f9" },
  { name: "FX", color: "#facc15" },
];

/** Quick chop lengths, in seconds. */
const SNAP_OPTIONS = [0.5, 1, 2, 4];

/** New layers chop this many seconds by default (clamped to the sample length). */
const DEFAULT_CLIP_SECONDS = 2;

const MIN_SPEED = 0.25;
const MAX_SPEED = 4;

/** Beat Grid: one bar of 16th-note steps. */
const STEP_COUNT = 16;

function makeSteps(): boolean[] {
  return Array.from({ length: STEP_COUNT }, () => false);
}

/** Filterbank frequency span. */
const FB_MIN_HZ = 32;
const FB_MAX_HZ = 18000;
const MIN_BANDS = 3;
const MAX_BANDS = 32;

/** dB window used by the EQ curve editor. */
const DB_MIN = -60;
const DB_MAX = 18;

const EMPTY_LEVELS: number[] = [];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function shortName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || fileName;
}

function fmtHz(hz: number) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz < 10000 ? 1 : 0)}k`;
  return `${Math.round(hz)}`;
}

/** Length of one loop pass, in real seconds (slice length divided by speed). */
function loopSeconds(layer: Layer, sample: Sample | null) {
  if (!sample) return 0;
  const region = Math.max(0.02, layer.clipEnd - layer.clipStart);
  return region / clamp(layer.speed, MIN_SPEED, MAX_SPEED);
}

function buildPeaks(buffer: AudioBuffer, count = 600) {
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

function getAudioCtor(): typeof AudioContext {
  const ctor = window.AudioContext || window.webkitAudioContext;
  if (!ctor) throw new Error("Web Audio API is not supported in this browser.");
  return ctor;
}

function getOfflineCtor(): typeof OfflineAudioContext {
  const ctor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!ctor) throw new Error("Offline rendering is not supported in this browser.");
  return ctor;
}

// ---------------------------------------------------------------------------
// DSP
// ---------------------------------------------------------------------------

/** Band edge + geometric-centre frequencies for an N-band log filterbank. */
function bandFrequencies(n: number) {
  const edges: number[] = [];
  for (let k = 0; k <= n; k += 1) edges.push(FB_MIN_HZ * (FB_MAX_HZ / FB_MIN_HZ) ** (k / n));
  const centers: number[] = [];
  for (let i = 0; i < n; i += 1) centers.push(Math.sqrt(edges[i] * edges[i + 1]));
  return { edges, centers };
}

/** Spectral tilt + focus lens, evaluated at an arbitrary frequency (dB). */
function spectralShapeDb(sp: Spectral, freq: number) {
  const tilt = sp.tiltDb * Math.log2(freq / 1000);
  const x = Math.log2(freq / sp.focusHz);
  const w = Math.max(0.12, sp.focusWidthOct);
  const lens = sp.focusAmtDb * (Math.exp(-(x * x) / (2 * w * w)) - 0.35);
  return tilt + lens;
}

/** Resulting gain (dB) for a single band: manual trim + tilt + lens, or hard-off. */
function bandGainDb(sp: Spectral, center: number, index: number) {
  if (!sp.bandOn[index]) return -120;
  return clamp((sp.bandDb[index] ?? 0) + spectralShapeDb(sp, center), DB_MIN, DB_MAX);
}

function dbToGain(db: number) {
  return db <= -119 ? 0 : 10 ** (db / 20);
}

/** In-place iterative radix-2 FFT. Length must be a power of two. */
function fftRadix2(re: Float32Array, im: Float32Array) {
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

/** Short-time Fourier transform of a chopped region — the "read every layer" view. */
function computeSpectrogram(buffer: AudioBuffer, startSec: number, endSec: number): Spectrogram {
  const sr = buffer.sampleRate;
  const ch = buffer.getChannelData(0);
  const a = clamp(Math.floor(startSec * sr), 0, Math.max(0, ch.length - 1));
  const b = clamp(Math.floor(endSec * sr), a + 1, ch.length);
  const win = 1024;
  const bins = win / 2;
  const span = b - a;
  const maxFrames = 260;
  const hop = Math.max(128, Math.ceil((span - win) / maxFrames) || 128);
  const frames = Math.max(1, Math.floor((span - win) / hop) + 1);
  const mags = new Float32Array(frames * bins);
  const avg = new Float32Array(bins);
  const re = new Float32Array(win);
  const im = new Float32Array(win);
  const hann = new Float32Array(win);
  for (let i = 0; i < win; i += 1) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (win - 1));

  const minDb = -100;
  const maxDb = -12;
  for (let f = 0; f < frames; f += 1) {
    const base = a + f * hop;
    for (let i = 0; i < win; i += 1) {
      const s = base + i;
      re[i] = s >= 0 && s < ch.length ? ch[s] * hann[i] : 0;
      im[i] = 0;
    }
    fftRadix2(re, im);
    for (let k = 0; k < bins; k += 1) {
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / win;
      const db = 20 * Math.log10(mag + 1e-9);
      const norm = clamp((db - minDb) / (maxDb - minDb), 0, 1);
      mags[f * bins + k] = norm;
      avg[k] += norm;
    }
  }
  for (let k = 0; k < bins; k += 1) avg[k] /= frames;
  return { frames, bins, sampleRate: sr, mags, avg };
}

/** viridis-ish ramp (0..1 -> [r,g,b]). */
function spectralColor(t: number): [number, number, number] {
  const stops: [number, number, number, number][] = [
    [0.0, 6, 10, 26],
    [0.35, 36, 62, 132],
    [0.6, 33, 145, 140],
    [0.8, 94, 201, 98],
    [1.0, 253, 231, 37],
  ];
  for (let i = 1; i < stops.length; i += 1) {
    if (t <= stops[i][0]) {
      const [p0, r0, g0, b0] = stops[i - 1];
      const [p1, r1, g1, b1] = stops[i];
      const f = (t - p0) / (p1 - p0 || 1);
      return [r0 + (r1 - r0) * f, g0 + (g1 - g0) * f, b0 + (b1 - b0) * f];
    }
  }
  return [253, 231, 37];
}

const logSpan = Math.log2(FB_MAX_HZ / FB_MIN_HZ);
const freqToUnit = (hz: number) => clamp(Math.log2(hz / FB_MIN_HZ) / logSpan, 0, 1);
const unitToFreq = (u: number) => FB_MIN_HZ * 2 ** (clamp(u, 0, 1) * logSpan);

function makeSpectral(bands = 12): Spectral {
  return {
    enabled: false,
    bands,
    tiltDb: 0,
    focusHz: 1000,
    focusAmtDb: 0,
    focusWidthOct: 1,
    bandDb: Array.from({ length: bands }, () => 0),
    bandOn: Array.from({ length: bands }, () => true),
  };
}

function resizeSpectral(sp: Spectral, bands: number): Spectral {
  const remap = <T,>(src: T[], fallback: T) =>
    Array.from({ length: bands }, (_, i) => {
      const j = Math.round((i / Math.max(1, bands - 1)) * (src.length - 1));
      return src[j] ?? fallback;
    });
  return { ...sp, bands, bandDb: remap(sp.bandDb, 0 as number), bandOn: remap(sp.bandOn, true as boolean) };
}

/** Interpolated manual trim (dB) at an arbitrary frequency, for the response curve. */
function bandTrimAt(freq: number, centers: number[], bandDb: number[]) {
  const lf = Math.log2(freq);
  if (lf <= Math.log2(centers[0])) return bandDb[0] ?? 0;
  const last = centers.length - 1;
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

/**
 * Build one Linkwitz-Riley band (two cascaded Butterworth sections per edge) and wire
 * input -> filters -> bandGain -> out. Works for realtime and offline contexts.
 */
function connectBand(
  ctx: BaseAudioContext,
  input: AudioNode,
  out: AudioNode,
  index: number,
  n: number,
  edges: number[],
  gainValue: number,
  analyser?: AnalyserNode,
) {
  const filters: BiquadFilterNode[] = [];
  const add = (type: BiquadFilterType, freq: number) => {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = freq;
    node.Q.value = Math.SQRT1_2;
    filters.push(node);
  };
  if (index > 0) {
    add("highpass", edges[index]);
    add("highpass", edges[index]);
  }
  if (index < n - 1) {
    add("lowpass", edges[index + 1]);
    add("lowpass", edges[index + 1]);
  }

  const gain = ctx.createGain();
  gain.gain.value = gainValue;

  let head: AudioNode = gain;
  if (filters.length) {
    for (let i = 0; i < filters.length - 1; i += 1) filters[i].connect(filters[i + 1]);
    filters[filters.length - 1].connect(gain);
    head = filters[0];
  }
  input.connect(head);
  gain.connect(out);
  if (analyser) gain.connect(analyser);
  return { filters, gain };
}

/** Reverses every channel of a whole sample once, so chop edits after that are just a coordinate flip. */
function reverseBuffer(buffer: AudioBuffer): AudioBuffer {
  const reversed = new AudioBuffer({
    numberOfChannels: buffer.numberOfChannels,
    length: buffer.length,
    sampleRate: buffer.sampleRate,
  });
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const src = buffer.getChannelData(c);
    const dst = reversed.getChannelData(c);
    for (let i = 0; i < src.length; i += 1) dst[i] = src[src.length - 1 - i];
  }
  return reversed;
}

/** Resolves which buffer + in/out points a layer should actually play, honoring `reversed`. */
function resolvePlayback(layer: Layer, sample: Sample, reversedBuffer: AudioBuffer | null) {
  if (!layer.reversed || !reversedBuffer) {
    return { buffer: sample.buffer, start: layer.clipStart, end: layer.clipEnd };
  }
  return {
    buffer: reversedBuffer,
    start: sample.duration - layer.clipEnd,
    end: sample.duration - layer.clipStart,
  };
}

function stopLayerSource(chain: LayerChain) {
  if (!chain.source) return;
  try {
    chain.source.onended = null;
    chain.source.stop();
  } catch {
    // already stopped
  }
  try {
    chain.source.disconnect();
  } catch {
    // already detached
  }
  chain.source = undefined;
  chain.sourceBufferId = undefined;
  chain.sourceLoop = undefined;
}

/** (Re)start one layer's playing source — seamless loop, or a single pass for one-shots. */
function createLayerSource(
  ctx: AudioContext,
  chain: LayerChain,
  layer: Layer,
  sample: Sample | null,
  reversedBuffer: AudioBuffer | null,
) {
  stopLayerSource(chain);
  if (!sample) return;
  const speed = clamp(layer.speed, MIN_SPEED, MAX_SPEED);
  const { buffer, start, end } = resolvePlayback(layer, sample, reversedBuffer);
  const a = clamp(start, 0, Math.max(0, buffer.duration - 0.02));
  const b = clamp(end, a + 0.02, buffer.duration);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = speed;
  src.loop = layer.loop;
  src.loopStart = a;
  src.loopEnd = b;
  src.connect(chain.input);
  const startAt = ctx.currentTime + 0.03;
  src.start(startAt, a);
  if (!layer.loop) src.stop(startAt + (b - a) / speed + 0.02);
  const self = src;
  src.onended = () => {
    if (chain.source === self) {
      chain.source = undefined;
      chain.sourceBufferId = undefined;
      chain.sourceLoop = undefined;
      chain.sourceReversed = undefined;
    }
  };
  chain.source = src;
  chain.sourceBufferId = layer.sampleId ?? "";
  chain.sourceLoop = layer.loop;
  chain.sourceReversed = layer.reversed;
}

/** One-shot trigger for a Beat Grid step hit — plays the chop once into the layer's existing chain. */
function triggerLayerStep(
  ctx: BaseAudioContext,
  input: AudioNode,
  layer: Layer,
  sample: Sample,
  reversedBuffer: AudioBuffer | null,
  when: number,
) {
  const speed = clamp(layer.speed, MIN_SPEED, MAX_SPEED);
  const { buffer, start, end } = resolvePlayback(layer, sample, reversedBuffer);
  const a = clamp(start, 0, Math.max(0, buffer.duration - 0.02));
  const b = clamp(end, a + 0.02, buffer.duration);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = speed;
  src.connect(input);
  src.start(when, a);
  src.stop(when + (b - a) / speed + 0.02);
}

// ---------------------------------------------------------------------------

function encodeWav(buffer: AudioBuffer): Blob {
  const numCh = Math.min(2, buffer.numberOfChannels);
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const blockAlign = numCh * 2;
  const dataSize = len * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c += 1) channels.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < len; i += 1) {
    for (let c = 0; c < numCh; c += 1) {
      const sample = clamp(channels[c][i], -1, 1);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

// ---------------------------------------------------------------------------

export default function SongBuilderClient() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [masterGain, setMasterGain] = useState(0.9);
  const [exportSeconds, setExportSeconds] = useState(16);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [focusedLayerId, setFocusedLayerId] = useState<string | null>(null);
  const [bandLevels, setBandLevels] = useState<number[]>(EMPTY_LEVELS);
  const [spectro, setSpectro] = useState<Spectrogram | null>(null);
  const [spectroBusy, setSpectroBusy] = useState(false);
  const [message, setMessage] = useState(
    "New here? Pick a vibe in Instant Studio and hit Generate — a full track appears, no uploads needed.",
  );

  // Instant Studio (procedural generator)
  const [genre, setGenre] = useState<GenreId>("lofi");
  const [rootPc, setRootPc] = useState(9); // A
  const [bpm, setBpm] = useState(78);
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const autoPlayRef = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterNodeRef = useRef<GainNode | null>(null);
  const masterValueRef = useRef(masterGain);
  const layerChainsRef = useRef<Map<string, LayerChain>>(new Map());
  const playingRef = useRef(false);
  const playStartRef = useRef(0);
  const sampleColorIdxRef = useRef(0);
  const reversedCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const lastFiredStepRef = useRef(-1);

  const isLoopMode = useCallback((layer: Layer) => layer.triggerMode !== "steps", []);

  /** Lazily builds + caches the fully-reversed buffer for a sample (whole sample, not just the chop). */
  const getReversedBuffer = useCallback((sample: Sample) => {
    let buf = reversedCacheRef.current.get(sample.id);
    if (!buf) {
      buf = reverseBuffer(sample.buffer);
      reversedCacheRef.current.set(sample.id, buf);
    }
    return buf;
  }, []);

  const soloActive = useMemo(() => layers.some((l) => l.soloed), [layers]);

  const focusedLayer = useMemo(
    () => layers.find((l) => l.id === focusedLayerId) ?? null,
    [layers, focusedLayerId],
  );
  const focusedSample = useMemo(
    () => (focusedLayer ? samples.find((s) => s.id === focusedLayer.sampleId) ?? null : null),
    [focusedLayer, samples],
  );
  const focusedSampleRef = useRef(focusedSample);
  focusedSampleRef.current = focusedSample;
  const spectroKey = focusedSample
    ? `${focusedSample.id}:${focusedLayer?.clipStart}:${focusedLayer?.clipEnd}`
    : "";
  const spectroTimesRef = useRef({ start: 0, end: 0 });
  spectroTimesRef.current = { start: focusedLayer?.clipStart ?? 0, end: focusedLayer?.clipEnd ?? 0 };

  const getCtx = useCallback(async () => {
    if (!audioCtxRef.current) {
      const Ctor = getAudioCtor();
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = masterValueRef.current;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterNodeRef.current = master;
    }
    if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  /** Reconcile the persistent per-layer filter graph with `layers`. */
  const syncLayerChains = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = masterNodeRef.current;
    if (!ctx || !master) return;
    const map = layerChainsRef.current;

    for (const id of [...map.keys()]) {
      if (layers.some((l) => l.id === id)) continue;
      const chain = map.get(id)!;
      stopLayerSource(chain);
      [chain.input, chain.output, ...chain.bandFilters, ...chain.bandGains, ...chain.analysers].forEach((node) => {
        try {
          node.disconnect();
        } catch {
          // already detached
        }
      });
      map.delete(id);
    }

    const solo = layers.some((l) => l.soloed);

    for (const layer of layers) {
      let chain = map.get(layer.id);
      if (!chain) {
        const input = ctx.createGain();
        const output = ctx.createGain();
        output.connect(master);
        chain = { input, output, enabled: false, bandCount: 0, bandFilters: [], bandGains: [], analysers: [] };
        map.set(layer.id, chain);
      }

      const sp = layer.spectral;

      if (chain.enabled !== sp.enabled || chain.bandCount !== sp.bands) {
        try {
          chain.input.disconnect();
        } catch {
          // nothing wired yet
        }
        [...chain.bandFilters, ...chain.bandGains, ...chain.analysers].forEach((node) => {
          try {
            node.disconnect();
          } catch {
            // already detached
          }
        });
        chain.bandFilters = [];
        chain.bandGains = [];
        chain.analysers = [];

        if (!sp.enabled) {
          chain.input.connect(chain.output);
        } else {
          const { edges, centers } = bandFrequencies(sp.bands);
          for (let i = 0; i < sp.bands; i += 1) {
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.6;
            const { filters, gain } = connectBand(
              ctx,
              chain.input,
              chain.output,
              i,
              sp.bands,
              edges,
              dbToGain(bandGainDb(sp, centers[i], i)),
              analyser,
            );
            chain.bandFilters.push(...filters);
            chain.bandGains.push(gain);
            chain.analysers.push(analyser);
          }
        }
        chain.enabled = sp.enabled;
        chain.bandCount = sp.bands;
      } else if (sp.enabled) {
        const { centers } = bandFrequencies(sp.bands);
        chain.bandGains.forEach((g, i) => {
          g.gain.setTargetAtTime(dbToGain(bandGainDb(sp, centers[i], i)), ctx.currentTime, 0.03);
        });
      }

      const audible = !layer.muted && (!solo || layer.soloed);
      chain.output.gain.setTargetAtTime(audible ? layer.gain : 0.0001, ctx.currentTime, 0.02);
    }
  }, [layers]);

  useEffect(() => {
    if (audioCtxRef.current) syncLayerChains();
  }, [syncLayerChains]);

  useEffect(() => {
    masterValueRef.current = masterGain;
    const ctx = audioCtxRef.current;
    if (ctx && masterNodeRef.current) {
      masterNodeRef.current.gain.setTargetAtTime(masterGain, ctx.currentTime, 0.02);
    }
  }, [masterGain]);

  /** Keep the running transport in step with edits: add sources for new layers, live-tweak the rest. */
  const reconcileSources = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !playingRef.current) return;

    for (const layer of layers) {
      const chain = layerChainsRef.current.get(layer.id);
      if (!chain) continue;

      if (!isLoopMode(layer)) {
        // Beat Grid steps trigger their own one-shots elsewhere; no continuous source here.
        if (chain.source) stopLayerSource(chain);
        chain.everStarted = true;
        continue;
      }

      const sample = samples.find((s) => s.id === layer.sampleId) ?? null;
      if (!sample) {
        stopLayerSource(chain);
        continue;
      }

      const reversedBuffer = layer.reversed ? getReversedBuffer(sample) : null;

      if (!chain.everStarted || !chain.source) {
        createLayerSource(ctx, chain, layer, sample, reversedBuffer);
        chain.everStarted = true;
        continue;
      }

      const bufChanged = chain.sourceBufferId !== (layer.sampleId ?? "");
      const loopChanged = chain.sourceLoop !== layer.loop;
      const reversedChanged = chain.sourceReversed !== layer.reversed;
      if (bufChanged || loopChanged || reversedChanged) {
        createLayerSource(ctx, chain, layer, sample, reversedBuffer);
        continue;
      }

      if (chain.source) {
        chain.source.playbackRate.setTargetAtTime(
          clamp(layer.speed, MIN_SPEED, MAX_SPEED),
          ctx.currentTime,
          0.03,
        );
        const { start, end } = resolvePlayback(layer, sample, reversedBuffer);
        const a = clamp(start, 0, Math.max(0, sample.duration - 0.02));
        const b = clamp(end, a + 0.02, sample.duration);
        try {
          chain.source.loopStart = a;
          chain.source.loopEnd = b;
        } catch {
          // ignore
        }
      }
    }
  }, [layers, samples, isLoopMode, getReversedBuffer]);

  useEffect(() => {
    if (playing) reconcileSources();
  }, [playing, reconcileSources]);

  const stop = useCallback(() => {
    playingRef.current = false;
    for (const chain of layerChainsRef.current.values()) {
      stopLayerSource(chain);
      chain.everStarted = false;
    }
    lastFiredStepRef.current = -1;
    setPlaying(false);
    setElapsed(0);
    setActiveStep(0);
  }, []);

  const start = useCallback(async () => {
    if (!layers.some((l) => l.sampleId)) {
      setMessage("Add a layer and assign a sample first.");
      return;
    }
    try {
      const ctx = await getCtx();
      playingRef.current = true;
      playStartRef.current = ctx.currentTime;
      lastFiredStepRef.current = -1;
      setActiveStep(0);
      syncLayerChains();
      for (const layer of layers) {
        const chain = layerChainsRef.current.get(layer.id);
        if (!chain) continue;
        if (!isLoopMode(layer)) {
          chain.everStarted = true;
          continue;
        }
        const sample = samples.find((s) => s.id === layer.sampleId) ?? null;
        const reversedBuffer = layer.reversed && sample ? getReversedBuffer(sample) : null;
        createLayerSource(ctx, chain, layer, sample, reversedBuffer);
        chain.everStarted = true;
      }
      setPlaying(true);
      setMessage("Running. Loop layers repeat their slice; Steps layers fire from the Beat Grid pattern.");
    } catch (e) {
      playingRef.current = false;
      setMessage(e instanceof Error ? e.message : "Could not start audio.");
    }
  }, [getCtx, layers, samples, syncLayerChains, isLoopMode, getReversedBuffer]);

  const toggleTransport = useCallback(() => {
    if (playing) stop();
    else void start();
  }, [playing, start, stop]);

  /** Pick a genre and snap the BPM to its signature tempo. */
  const pickGenre = useCallback((id: GenreId) => {
    setGenre(id);
    const def = GENRES.find((g) => g.id === id);
    if (def) setBpm(def.bpm);
  }, []);

  /**
   * The one-tap magic: synthesise a full locked track (drums / bass / chords /
   * melody), drop it in as layers, and auto-play. No uploads involved.
   */
  const generateSongNow = useCallback(
    async (o?: { seed?: number; genreOverride?: GenreId; rootOverride?: number; bpmOverride?: number }) => {
      const g = o?.genreOverride ?? genre;
      const rp = o?.rootOverride ?? rootPc;
      const bp = o?.bpmOverride ?? bpm;
      setGenerating(true);
      setMessage("Forging your track — drums, bass, chords and melody, all locked to the grid…");
      try {
        const ctx = await getCtx();
        const result = await generateSong({
          sampleRate: ctx.sampleRate,
          genre: g,
          rootPc: rp,
          bpm: bp,
          seed: o?.seed,
        });
        const stamp = Date.now();
        const newSamples: Sample[] = result.loops.map((loop, i) => ({
          id: `gen-${loop.role}-${stamp}-${i}`,
          name: loop.name,
          buffer: loop.buffer,
          peaks: buildPeaks(loop.buffer),
          color: loop.color,
          duration: loop.buffer.duration,
          generated: true,
        }));
        const newLayers: Layer[] = newSamples.map((s, i) => ({
          id: `layer-${stamp}-${i}`,
          name: s.name,
          color: s.color,
          sampleId: s.id,
          clipStart: 0,
          clipEnd: s.duration,
          loop: true,
          speed: 1,
          gain: 0.9,
          muted: false,
          soloed: false,
          spectral: makeSpectral(),
          reversed: false,
          sourceBpm: bp,
          triggerMode: "loop",
          steps: makeSteps(),
        }));
        stop();
        // Replace any previously generated content, keep the user's own uploads.
        setSamples((cur) => [...cur.filter((s) => !s.generated), ...newSamples]);
        setLayers(newLayers);
        setHasGenerated(true);
        autoPlayRef.current = true;
        const label = GENRES.find((x) => x.id === g)?.name ?? "Track";
        setMessage(`${label} in ${result.keyLabel} · ${result.bpm} BPM. Tweak any layer, or bounce it to a WAV.`);
      } catch (e) {
        setMessage(e instanceof Error ? `Generation failed: ${e.message}` : "Generation failed.");
      } finally {
        setGenerating(false);
      }
    },
    [genre, rootPc, bpm, getCtx, stop],
  );

  const surpriseMe = useCallback(() => {
    const def = GENRES[Math.floor(Math.random() * GENRES.length)];
    const rp = Math.floor(Math.random() * 12);
    setGenre(def.id);
    setBpm(def.bpm);
    setRootPc(rp);
    void generateSongNow({
      genreOverride: def.id,
      rootOverride: rp,
      bpmOverride: def.bpm,
      seed: Math.floor(Math.random() * 1e9),
    });
  }, [generateSongNow]);

  const remix = useCallback(() => {
    void generateSongNow({ seed: Math.floor(Math.random() * 1e9) });
  }, [generateSongNow]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const stepSeconds = 60 / bpm / 4;
    const tick = () => {
      const ctx = audioCtxRef.current;
      if (ctx) {
        const elapsedSec = Math.max(0, ctx.currentTime - playStartRef.current);
        setElapsed(elapsedSec);

        const stepFloat = elapsedSec / stepSeconds;
        const stepIndex = Math.floor(stepFloat) % STEP_COUNT;
        if (stepIndex !== lastFiredStepRef.current) {
          lastFiredStepRef.current = stepIndex;
          setActiveStep(stepIndex);
          const boundary = playStartRef.current + Math.floor(stepFloat) * stepSeconds;
          for (const layer of layers) {
            if (layer.triggerMode !== "steps" || !layer.steps[stepIndex]) continue;
            const chain = layerChainsRef.current.get(layer.id);
            const sample = samples.find((s) => s.id === layer.sampleId);
            if (!chain || !sample) continue;
            const reversedBuffer = layer.reversed ? getReversedBuffer(sample) : null;
            triggerLayerStep(ctx, chain.input, layer, sample, reversedBuffer, boundary);
          }
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [playing, layers, samples, bpm, getReversedBuffer]);

  // After Instant Studio drops in a fresh track, start it playing automatically.
  useEffect(() => {
    if (autoPlayRef.current && layers.length) {
      autoPlayRef.current = false;
      void start();
    }
  }, [layers, start]);

  // Live per-band meters for the open spectral panel.
  useEffect(() => {
    if (!focusedLayerId) {
      setBandLevels(EMPTY_LEVELS);
      return;
    }
    let raf = 0;
    const buf = new Float32Array(1024);
    const tick = () => {
      const chain = layerChainsRef.current.get(focusedLayerId);
      if (chain && chain.analysers.length) {
        const out = chain.analysers.map((an) => {
          an.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i += 1) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);
          return clamp((20 * Math.log10(rms + 1e-9) + 60) / 60, 0, 1);
        });
        setBandLevels(out);
      } else {
        setBandLevels(EMPTY_LEVELS);
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [focusedLayerId]);

  // Recompute the spectrogram only when the focused clip / sample changes.
  useEffect(() => {
    const sample = focusedSampleRef.current;
    if (!spectroKey || !sample) {
      setSpectro(null);
      return;
    }
    let cancelled = false;
    setSpectroBusy(true);
    const id = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const { start: s, end: e } = spectroTimesRef.current;
        const result = computeSpectrogram(sample.buffer, s, e);
        if (!cancelled) setSpectro(result);
      } catch {
        if (!cancelled) setSpectro(null);
      } finally {
        if (!cancelled) setSpectroBusy(false);
      }
    }, 45);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [spectroKey]);

  useEffect(() => {
    return () => {
      for (const chain of layerChainsRef.current.values()) stopLayerSource(chain);
      void audioCtxRef.current?.close();
    };
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      const list = Array.from(files).filter(
        (f) => f.type.startsWith("audio") || /\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name),
      );
      if (!list.length) {
        setMessage("Those files are not audio. Drop an MP3, WAV, or M4A.");
        return;
      }
      try {
        const ctx = await getCtx();
        const added: Sample[] = [];
        for (const file of list) {
          try {
            const data = await file.arrayBuffer();
            const buffer = await ctx.decodeAudioData(data.slice(0));
            added.push({
              id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
              name: shortName(file.name),
              buffer,
              peaks: buildPeaks(buffer),
              color: SAMPLE_COLORS[sampleColorIdxRef.current++ % SAMPLE_COLORS.length],
              duration: buffer.duration,
            });
          } catch {
            setMessage(`Could not decode ${file.name}.`);
          }
        }
        if (added.length) {
          setSamples((cur) => [...cur, ...added]);
          setMessage(`${added.length} sample(s) ready. Add a layer and chop a slice.`);
        }
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not read those files.");
      }
    },
    [getCtx],
  );

  const removeSample = useCallback((id: string) => {
    setSamples((cur) => cur.filter((s) => s.id !== id));
    setLayers((cur) => cur.map((l) => (l.sampleId === id ? { ...l, sampleId: null } : l)));
    reversedCacheRef.current.delete(id);
  }, []);

  const addLayer = useCallback(
    (preset?: { name: string; color: string }) => {
      setLayers((cur) => {
        const sample = samples[samples.length - 1] ?? null;
        const base =
          preset ?? { name: `Layer ${cur.length + 1}`, color: SAMPLE_COLORS[cur.length % SAMPLE_COLORS.length] };
        return [
          ...cur,
          {
            id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: base.name,
            color: base.color,
            sampleId: sample?.id ?? null,
            clipStart: 0,
            clipEnd: sample ? Math.min(sample.duration, DEFAULT_CLIP_SECONDS) : 0,
            loop: true,
            speed: 1,
            gain: 0.9,
            muted: false,
            soloed: false,
            spectral: makeSpectral(),
            reversed: false,
            sourceBpm: null,
            triggerMode: "loop",
            steps: makeSteps(),
          },
        ];
      });
    },
    [samples],
  );

  const updateLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setLayers((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((cur) => cur.filter((l) => l.id !== id));
    setFocusedLayerId((cur) => (cur === id ? null : cur));
  }, []);

  const assignSample = useCallback(
    (layerId: string, sampleId: string) => {
      const sample = samples.find((s) => s.id === sampleId) ?? null;
      updateLayer(layerId, {
        sampleId: sample?.id ?? null,
        clipStart: 0,
        clipEnd: sample ? Math.min(sample.duration, DEFAULT_CLIP_SECONDS) : 0,
        sourceBpm: null,
      });
    },
    [samples, updateLayer],
  );

  const toggleStep = useCallback((layerId: string, stepIndex: number, value: boolean) => {
    setLayers((cur) =>
      cur.map((l) => {
        if (l.id !== layerId) return l;
        const steps = l.steps.slice();
        steps[stepIndex] = value;
        return { ...l, steps };
      }),
    );
  }, []);

  const clearSteps = useCallback((layerId: string) => {
    setLayers((cur) => cur.map((l) => (l.id === layerId ? { ...l, steps: makeSteps() } : l)));
  }, []);

  const previewChop = useCallback(
    async (layer: Layer) => {
      const sample = samples.find((s) => s.id === layer.sampleId);
      if (!sample) return;
      try {
        const ctx = await getCtx();
        syncLayerChains();
        const reversedBuffer = layer.reversed ? getReversedBuffer(sample) : null;
        const { buffer, start: pStart, end: pEnd } = resolvePlayback(layer, sample, reversedBuffer);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = clamp(layer.speed, MIN_SPEED, MAX_SPEED);
        const region = Math.max(0.02, pEnd - pStart);
        const offset = clamp(pStart, 0, Math.max(0, buffer.duration - 0.001));
        const chain = layerChainsRef.current.get(layer.id);
        if (chain) {
          src.connect(chain.input);
          src.start(0, offset, region);
          src.onended = () => {
            try {
              src.disconnect();
            } catch {
              // ignore
            }
          };
        } else {
          const g = ctx.createGain();
          g.gain.value = layer.gain;
          g.connect(masterNodeRef.current ?? ctx.destination);
          src.connect(g);
          src.start(0, offset, region);
          src.onended = () => {
            try {
              src.disconnect();
              g.disconnect();
            } catch {
              // ignore
            }
          };
        }
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Preview failed.");
      }
    },
    [getCtx, samples, syncLayerChains, getReversedBuffer],
  );

  const exportWav = useCallback(async () => {
    const usable = layers.filter((l) => l.sampleId && samples.some((s) => s.id === l.sampleId));
    const solo = usable.some((l) => l.soloed);
    const audible = usable.filter((l) => !l.muted && (!solo || l.soloed));
    if (!audible.length) {
      setMessage("Add at least one audible layer with a sample before bouncing.");
      return;
    }
    setRendering(true);
    setMessage("Rendering your song offline — filters and all…");
    try {
      const sr = audioCtxRef.current?.sampleRate ?? 44100;
      const length = clamp(exportSeconds, 2, 120);
      const stepSeconds = 60 / bpm / 4;
      const barSeconds = stepSeconds * STEP_COUNT;
      const Ctor = getOfflineCtor();
      const offline = new Ctor(2, Math.max(1, Math.ceil(sr * (length + 0.4))), sr);
      const master = offline.createGain();
      master.gain.value = masterGain;
      master.connect(offline.destination);

      for (const layer of audible) {
        const sample = samples.find((s) => s.id === layer.sampleId);
        if (!sample) continue;

        const layerOut = offline.createGain();
        layerOut.gain.value = layer.gain;
        layerOut.connect(master);

        const input = offline.createGain();
        const sp = layer.spectral;
        if (!sp.enabled) {
          input.connect(layerOut);
        } else {
          const { edges, centers } = bandFrequencies(sp.bands);
          for (let i = 0; i < sp.bands; i += 1) {
            connectBand(offline, input, layerOut, i, sp.bands, edges, dbToGain(bandGainDb(sp, centers[i], i)));
          }
        }

        const reversedBuffer = layer.reversed ? getReversedBuffer(sample) : null;
        const speed = clamp(layer.speed, MIN_SPEED, MAX_SPEED);
        const { buffer, start: pStart, end: pEnd } = resolvePlayback(layer, sample, reversedBuffer);
        const a = clamp(pStart, 0, Math.max(0, buffer.duration - 0.02));
        const b = clamp(pEnd, a + 0.02, buffer.duration);

        if (layer.triggerMode === "steps") {
          for (let barStart = 0; barStart < length; barStart += barSeconds) {
            layer.steps.forEach((on, stepIndex) => {
              const when = barStart + stepIndex * stepSeconds;
              if (!on || when >= length) return;
              const src = offline.createBufferSource();
              src.buffer = buffer;
              src.playbackRate.value = speed;
              src.connect(input);
              src.start(when, a);
              src.stop(Math.min(length + 0.3, when + (b - a) / speed + 0.02));
            });
          }
        } else {
          const src = offline.createBufferSource();
          src.buffer = buffer;
          src.playbackRate.value = speed;
          src.loop = layer.loop;
          src.loopStart = a;
          src.loopEnd = b;
          src.connect(input);
          src.start(0, a);
          src.stop(layer.loop ? length : Math.min(length, (b - a) / speed + 0.02));
        }
      }

      const rendered = await offline.startRendering();
      const blob = encodeWav(rendered);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `song-${length}s.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setMessage(`Bounced ${formatTime(rendered.duration)} of audio to WAV.`);
    } catch (e) {
      setMessage(e instanceof Error ? `Export failed: ${e.message}` : "Export failed.");
    } finally {
      setRendering(false);
    }
  }, [exportSeconds, layers, masterGain, samples, bpm, getReversedBuffer]);

  const canPlay = layers.some((l) => l.sampleId);

  return (
    <main className="min-h-screen bg-[#080a0d] text-slate-100">
      <section className="min-h-screen border-b border-white/10 bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,#10131a,#080a0d)]">
        <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link
                href="/dj-lab"
                className="inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-200 underline-offset-4 hover:underline"
              >
                <ChevronLeft size={14} /> Back to DJ Lab
              </Link>
              <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase text-emerald-100">
                <Sparkles size={15} /> Song Builder
              </p>
              <h1 className="mt-3 text-4xl font-black leading-[0.92] text-white sm:text-6xl">Generate, chop, loop</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Tap a genre and the studio builds a full, locked track from scratch — drums, bass, chords and melody,
                no uploads. Bring your own MP3s too if you like: slice any part, stack a layer per instrument, split it
                into a real filterbank, then bounce the mix to a WAV.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
              <Stat label="Layers" value={`${layers.length}`} />
              <Stat label="Samples" value={`${samples.length}`} />
              <Stat label="Master" value={`${Math.round(masterGain * 100)}%`} />
            </div>
          </header>

          {/* Instant Studio — one-tap procedural song generator, zero uploads. */}
          <div className="grid gap-4 rounded-xl border border-fuchsia-300/25 bg-[radial-gradient(circle_at_12%_0%,rgba(232,121,249,0.18),transparent_42%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.16),transparent_40%),linear-gradient(180deg,rgba(17,20,26,0.9),rgba(8,10,13,0.9))] p-4 shadow-2xl sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-md border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1.5 text-xs font-black uppercase text-fuchsia-100">
                  <Zap size={15} /> Instant Studio
                </p>
                <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">Make a track in one tap</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  Pick a vibe and a key — the studio synthesises tight, locked drums, bass, chords and melody. No
                  uploads, no samples, no licences. Then chop, filter or bounce it like any other layer.
                </p>
              </div>
              <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[0.68rem] font-black uppercase text-emerald-100">
                100% in-browser
              </span>
            </div>

            {/* Genre chips */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {GENRES.map((g) => {
                const active = genre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => pickGenre(g.id)}
                    className={`group flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-fuchsia-300/70 bg-fuchsia-300/15 shadow-[0_0_0_1px_rgba(232,121,249,0.4)]"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.09]"
                    }`}
                  >
                    <span className="text-lg leading-none">{g.emoji}</span>
                    <span className={`text-sm font-black ${active ? "text-white" : "text-slate-100"}`}>{g.name}</span>
                    <span className="text-[0.66rem] leading-tight text-slate-400">{g.blurb}</span>
                  </button>
                );
              })}
            </div>

            {/* Key + tempo */}
            <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              <label className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="mb-2 block text-[0.68rem] font-black uppercase text-slate-500">Key</span>
                <div className="flex flex-wrap gap-1">
                  {KEYS.map((k, i) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setRootPc(i)}
                      className={`h-8 min-w-8 rounded-md border px-1.5 text-xs font-black transition ${
                        rootPc === i
                          ? "border-sky-300 bg-sky-300/20 text-sky-100"
                          : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </label>
              <label className="rounded-lg border border-white/10 bg-black/30 p-3">
                <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
                  <span>Tempo</span>
                  <span className="text-slate-300">{bpm} BPM</span>
                </span>
                <input
                  className="w-full accent-fuchsia-300"
                  type="range"
                  min={60}
                  max={180}
                  step={1}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                />
                <span className="mt-1 block text-[0.66rem] text-slate-500">
                  Snapped to the genre&apos;s signature tempo — nudge it to taste.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr]">
              <button
                type="button"
                onClick={() => void generateSongNow()}
                disabled={generating}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-fuchsia-300/50 bg-gradient-to-r from-fuchsia-400/30 to-sky-400/25 px-5 text-base font-black text-white transition hover:from-fuchsia-400/45 hover:to-sky-400/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles size={20} />
                {generating ? "Forging…" : hasGenerated ? "Generate again" : "Generate song"}
              </button>
              <button
                type="button"
                onClick={surpriseMe}
                disabled={generating}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-4 text-sm font-black text-slate-100 transition hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-50"
                title="Random genre, key and variation"
              >
                <Shuffle size={18} /> Surprise me
              </button>
              <button
                type="button"
                onClick={remix}
                disabled={generating || !hasGenerated}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-4 text-sm font-black text-slate-100 transition hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-40"
                title="Same vibe, fresh chords and melody"
              >
                <RefreshCw size={18} /> Remix
              </button>
            </div>
          </div>

          {/* Transport */}
          <div className="grid gap-3 rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl lg:grid-cols-[auto_1fr_auto]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTransport}
                disabled={!canPlay}
                className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-md border px-6 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  playing
                    ? "border-red-300 bg-red-400 text-black hover:bg-red-300"
                    : "border-emerald-300/45 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/25"
                }`}
              >
                {playing ? <Square size={18} /> : <Play size={18} />}
                {playing ? "Stop" : "Play"}
              </button>

              <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="block text-[0.68rem] font-black uppercase text-slate-500">Elapsed</span>
                <span className="text-lg font-black text-white">{formatTime(elapsed)}</span>
              </div>
            </div>

            <div className="flex min-w-0 items-center rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-xs leading-5 text-slate-400">
              Loop layers repeat their own slice. Steps layers fire from the Beat Grid, locked to Project BPM — use
              it to beat-match a vocal too.
            </div>

            <div className="flex items-center gap-3">
              <label className="w-28 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="mb-1 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
                  <span>Proj. BPM</span>
                </span>
                <input
                  className="w-full rounded bg-transparent text-lg font-black text-white outline-none"
                  type="number"
                  min={40}
                  max={220}
                  step={1}
                  value={bpm}
                  onChange={(e) => setBpm(clamp(Number(e.target.value) || bpm, 40, 220))}
                />
              </label>
              <label className="w-40 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="mb-1 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
                  <span>Master</span>
                  <span className="text-slate-300">{Math.round(masterGain * 100)}%</span>
                </span>
                <input
                  className="w-full accent-sky-300"
                  type="range"
                  min={0}
                  max={1.4}
                  step={0.01}
                  value={masterGain}
                  onChange={(e) => setMasterGain(Number(e.target.value))}
                />
              </label>
            </div>
          </div>

          <BeatGridPanel
            layers={layers}
            samples={samples}
            playing={playing}
            activeStep={activeStep}
            onToggleStep={toggleStep}
            onSetMode={(id, triggerMode) => updateLayer(id, { triggerMode })}
            onClearSteps={clearSteps}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid content-start gap-4">
              {/* Samples */}
              <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-500">Source pool</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Samples</h2>
                  </div>
                  <Music2 className="text-emerald-200" size={26} />
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    void addFiles(e.dataTransfer.files);
                  }}
                  className={`flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition ${
                    dragActive
                      ? "border-emerald-200 bg-emerald-300/20"
                      : "border-emerald-300/35 bg-emerald-300/10 hover:bg-emerald-300/15"
                  }`}
                >
                  <Upload className="mb-2 text-emerald-100" />
                  <span className="text-sm font-black text-white">Drop or pick MP3 / WAV / M4A</span>
                  <span className="mt-1 text-xs text-slate-400">Files stay in your browser — nothing is uploaded.</span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                    multiple
                    onChange={(e) => void addFiles(e.target.files)}
                  />
                </label>

                {samples.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {samples.map((sample) => (
                      <div
                        key={sample.id}
                        className="flex items-center gap-3 rounded-md border border-white/10 bg-black/30 p-3"
                      >
                        <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: sample.color }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-white">{sample.name}</span>
                          <span className="text-xs text-slate-500">
                            {formatTime(sample.duration)} · {sample.buffer.sampleRate / 1000} kHz
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSample(sample.id)}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.05] text-slate-300 transition hover:border-red-300/50 hover:text-red-200"
                          title="Remove sample"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Layers */}
              <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-500">Arrangement</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Layers</h2>
                  </div>
                  <Layers className="text-sky-200" size={26} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {INSTRUMENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => addLayer(preset)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-slate-100 transition hover:bg-white/[0.12]"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: preset.color }} />
                      {preset.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => addLayer()}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-3 text-xs font-black text-emerald-100 transition hover:bg-emerald-300/20"
                  >
                    <Plus size={15} /> Layer
                  </button>
                </div>

                {layers.length === 0 ? (
                  <p className="rounded-md border border-white/10 bg-black/30 p-6 text-center text-sm text-slate-500">
                    No layers yet. Add one per instrument, then chop the slice it should loop.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {layers.map((layer) => (
                      <LayerCard
                        key={layer.id}
                        layer={layer}
                        samples={samples}
                        soloActive={soloActive}
                        playing={playing}
                        focused={focusedLayerId === layer.id}
                        bandLevels={focusedLayerId === layer.id ? bandLevels : EMPTY_LEVELS}
                        spectro={focusedLayerId === layer.id ? spectro : null}
                        spectroBusy={focusedLayerId === layer.id ? spectroBusy : false}
                        onToggleFocus={() =>
                          setFocusedLayerId((cur) => (cur === layer.id ? null : layer.id))
                        }
                        onChange={(patch) => updateLayer(layer.id, patch)}
                        onAssign={(sampleId) => assignSample(layer.id, sampleId)}
                        onPreview={() => void previewChop(layer)}
                        onRemove={() => removeLayer(layer.id)}
                        projectBpm={bpm}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right rail */}
            <aside className="grid content-start gap-4">
              <LayerLoops layers={layers} samples={samples} playing={playing} />

              <div className="grid gap-3 rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-500">Bounce</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Export song</h2>
                  </div>
                  <Download className="text-emerald-200" size={24} />
                </div>
                <label className="rounded-md border border-white/10 bg-white/[0.04] p-3">
                  <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
                    <span>Length</span>
                    <span className="text-slate-300">{exportSeconds}s</span>
                  </span>
                  <input
                    className="w-full accent-emerald-300"
                    type="range"
                    min={4}
                    max={60}
                    step={1}
                    value={exportSeconds}
                    onChange={(e) => setExportSeconds(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void exportWav()}
                  disabled={rendering || !canPlay}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-300/15 px-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download size={18} />
                  {rendering ? "Rendering…" : `Export WAV (${exportSeconds}s)`}
                </button>
              </div>

              <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-emerald-100">
                  <Waves size={15} /> Studio log
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
              </div>

              <div className="grid gap-2 rounded-lg border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-black uppercase text-slate-500">How it works</p>
                {[
                  ["Generate", "Pick a genre + key — a full locked track appears, no uploads."],
                  ["Remix", "Same vibe, fresh chords and melody. Or Surprise for a random one."],
                  ["Chop", "Drag the waveform handles, or the middle to slide the slice."],
                  ["Split", "Open Spectral engine to fan a layer into N filter bands."],
                  ["Bounce", "Offline render a fixed number of seconds to one WAV."],
                ].map(([term, copy]) => (
                  <div key={term} className="flex gap-3 rounded-md bg-white/[0.04] px-3 py-2">
                    <span className="w-14 shrink-0 text-xs font-black uppercase text-emerald-200">{term}</span>
                    <span className="text-sm text-slate-300">{copy}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <InfoTile icon={<Gauge size={18} />} label="Engine" value="Web Audio" />
                <InfoTile icon={<Disc3 size={18} />} label="Filters" value="LR4 bank" />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------

function LayerCard({
  layer,
  samples,
  soloActive,
  playing,
  focused,
  bandLevels,
  spectro,
  spectroBusy,
  onToggleFocus,
  onChange,
  onAssign,
  onPreview,
  onRemove,
  projectBpm,
}: {
  layer: Layer;
  samples: Sample[];
  soloActive: boolean;
  playing: boolean;
  focused: boolean;
  bandLevels: number[];
  spectro: Spectrogram | null;
  spectroBusy: boolean;
  onToggleFocus: () => void;
  onChange: (patch: Partial<Layer>) => void;
  onAssign: (sampleId: string) => void;
  onPreview: () => void;
  onRemove: () => void;
  projectBpm: number;
}) {
  const sample = samples.find((s) => s.id === layer.sampleId) ?? null;
  const audible = !layer.muted && (!soloActive || layer.soloed);
  const loopDur = loopSeconds(layer, sample);

  return (
    <article
      className={`grid gap-3 rounded-lg border p-3 transition ${
        audible ? "border-white/12 bg-black/30" : "border-white/8 bg-black/20 opacity-60"
      }`}
      style={{ boxShadow: `inset 3px 0 0 ${layer.color}` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={layer.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-300/50"
        />
        <select
          value={layer.sampleId ?? ""}
          onChange={(e) => onAssign(e.target.value)}
          className="max-w-[45%] rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm font-bold text-slate-100 outline-none"
        >
          <option value="" className="bg-[#10131a]">
            — sample —
          </option>
          {samples.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#10131a]">
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onPreview}
          disabled={!sample}
          className="grid h-9 w-9 place-items-center rounded-md border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 transition hover:bg-emerald-300/20 disabled:opacity-40"
          title="Preview slice"
        >
          <Play size={15} />
        </button>
        <button
          type="button"
          onClick={() => onChange({ muted: !layer.muted })}
          className={`h-9 w-9 rounded-md border text-xs font-black transition ${
            layer.muted ? "border-red-300 bg-red-400 text-black" : "border-white/10 bg-white/[0.06] text-slate-200"
          }`}
          title="Mute"
        >
          M
        </button>
        <button
          type="button"
          onClick={() => onChange({ soloed: !layer.soloed })}
          className={`h-9 w-9 rounded-md border text-xs font-black transition ${
            layer.soloed ? "border-amber-300 bg-amber-300 text-black" : "border-white/10 bg-white/[0.06] text-slate-200"
          }`}
          title="Solo"
        >
          S
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-red-300/50 hover:text-red-200"
          title="Delete layer"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {sample ? (
        <>
          <ChopStrip sample={sample} layer={layer} onChange={onChange} />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Scissors size={13} className="text-slate-400" />
            <label className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 font-black text-slate-300">
              <span className="text-slate-500">in</span>
              <input
                type="number"
                min={0}
                max={Math.max(0, sample.duration - 0.02)}
                step={0.05}
                value={Number(layer.clipStart.toFixed(2))}
                onChange={(e) => {
                  const start = clamp(Number(e.target.value) || 0, 0, Math.max(0, sample.duration - 0.02));
                  const length = clamp(layer.clipEnd - layer.clipStart, 0.02, sample.duration - start);
                  onChange({ clipStart: start, clipEnd: start + length });
                }}
                className="w-12 bg-transparent text-right text-slate-100 outline-none"
              />
              <span className="text-slate-500">s</span>
            </label>
            <label className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 font-black text-slate-300">
              <span className="text-slate-500">len</span>
              <input
                type="number"
                min={0.02}
                max={sample.duration}
                step={0.05}
                value={Number((layer.clipEnd - layer.clipStart).toFixed(2))}
                onChange={(e) => {
                  const len = clamp(Number(e.target.value) || 0.02, 0.02, sample.duration - layer.clipStart);
                  onChange({ clipEnd: layer.clipStart + len });
                }}
                className="w-12 bg-transparent text-right text-slate-100 outline-none"
              />
              <span className="text-slate-500">s</span>
            </label>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-300/10 px-2 py-1 font-black text-emerald-100">
              <Repeat size={12} /> {loopDur > 0 ? `${loopDur.toFixed(2)}s / loop` : "—"}
            </span>
            {SNAP_OPTIONS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => onChange({ clipEnd: Math.min(sample.duration, layer.clipStart + sec) })}
                className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 font-black text-slate-200 transition hover:bg-white/[0.12]"
              >
                {sec}s
              </button>
            ))}
            <button
              type="button"
              onClick={() => onChange({ clipStart: 0, clipEnd: sample.duration })}
              className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 font-black text-slate-200 transition hover:bg-white/[0.12]"
            >
              Whole
            </button>
          </div>
        </>
      ) : (
        <p className="rounded-md border border-dashed border-white/10 bg-black/30 p-4 text-center text-xs text-slate-500">
          Assign a sample to chop and loop it.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/30 p-3">
          <span className="col-span-2 block text-[0.68rem] font-black uppercase text-slate-500">Playback</span>
          <button
            type="button"
            onClick={() => onChange({ loop: !layer.loop })}
            disabled={layer.triggerMode === "steps"}
            title={layer.triggerMode === "steps" ? "Ignored while this layer is in Steps mode" : undefined}
            className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${
              layer.loop
                ? "border-emerald-300 bg-emerald-300/15 text-emerald-100"
                : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
            }`}
          >
            <Repeat size={14} /> {layer.loop ? "Loop" : "One-shot"}
          </button>
          <button
            type="button"
            onClick={() => onChange({ reversed: !layer.reversed })}
            title="Reverse playback — the classic backwards-sample swell"
            className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-black uppercase transition ${
              layer.reversed
                ? "border-fuchsia-300 bg-fuchsia-300/15 text-fuchsia-100"
                : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
            }`}
          >
            <Rewind size={14} /> {layer.reversed ? "Reversed" : "Reverse"}
          </button>
        </div>
        <Fader
          label="Speed"
          value={layer.speed}
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={0.05}
          display={`${layer.speed.toFixed(2)}×`}
          onChange={(speed) => onChange({ speed })}
        />
        <Fader
          label="Gain"
          value={layer.gain}
          min={0}
          max={1.5}
          step={0.01}
          accent="sky"
          display={`${Math.round(layer.gain * 100)}%`}
          onChange={(gain) => onChange({ gain })}
        />
      </div>

      <BeatMatchControl
        sourceBpm={layer.sourceBpm}
        speed={layer.speed}
        projectBpm={projectBpm}
        onMatch={(sourceBpm) => {
          const ratio = clamp(projectBpm / sourceBpm, MIN_SPEED, MAX_SPEED);
          onChange({ speed: ratio, sourceBpm });
        }}
      />

      <button
        type="button"
        onClick={onToggleFocus}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-xs font-black uppercase transition ${
          focused
            ? "border-emerald-300 bg-emerald-300/15 text-emerald-100"
            : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
        }`}
      >
        <SlidersHorizontal size={14} />
        {layer.spectral.enabled ? `Spectral · ${layer.spectral.bands} bands` : "Spectral engine"}
        {focused ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {focused && (
        <SpectralPanel
          spectral={layer.spectral}
          color={layer.color}
          bandLevels={bandLevels}
          spectro={spectro}
          spectroBusy={spectroBusy}
          onChange={(patch) => onChange({ spectral: { ...layer.spectral, ...patch } })}
        />
      )}

      {/* Loop cycle sweep — restarts cleanly when it reaches the end. */}
      {sample && (
        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            key={playing ? `run-${loopDur.toFixed(3)}-${layer.loop}` : "idle"}
            className="absolute inset-y-0 left-0 w-full origin-left"
            style={{
              background: layer.color,
              transform: playing ? undefined : "scaleX(0)",
              animation: playing
                ? `sb-loopfill ${Math.max(0.08, loopDur)}s linear ${layer.loop ? "infinite" : "1"} both`
                : undefined,
            }}
          />
        </div>
      )}
    </article>
  );
}

function ChopStrip({
  sample,
  layer,
  onChange,
}: {
  sample: Sample;
  layer: Layer;
  onChange: (patch: Partial<Layer>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<
    { mode: "start" } | { mode: "end" } | { mode: "move"; grabOffset: number; length: number } | null
  >(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const wrap = wrapRef.current;
    if (!canvas || !ctx || !wrap) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 2) return;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, w, h);

    const peaks = sample.peaks;
    const bw = w / peaks.length;
    const s0 = clamp(layer.clipStart / sample.duration, 0, 1);
    const s1 = clamp(layer.clipEnd / sample.duration, 0, 1);

    peaks.forEach((peak, i) => {
      const frac = i / peaks.length;
      const inSel = frac >= s0 && frac <= s1;
      const bh = Math.max(2, peak * (h - 10));
      ctx.fillStyle = inSel ? sample.color : "rgba(148,163,184,0.22)";
      ctx.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 0.5), bh);
    });

    ctx.fillStyle = "rgba(52,211,153,0.10)";
    ctx.fillRect(s0 * w, 0, (s1 - s0) * w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s0 * w - 1, 0, 2, h);
    ctx.fillRect(s1 * w - 1, 0, 2, h);

    const selWidth = (s1 - s0) * w;
    if (selWidth > 26) {
      const midX = ((s0 + s1) / 2) * w;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      for (let d = -1; d <= 1; d += 1) ctx.fillRect(midX + d * 4 - 1, h / 2 - 7, 2, 14);
    }
  }, [layer.clipEnd, layer.clipStart, sample]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(draw);
    window.addEventListener("resize", draw);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", draw);
    };
  }, [draw]);

  const timeAt = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1) * sample.duration;
  };

  const applyDrag = (clientX: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const min = 0.02;
    const t = timeAt(clientX);
    if (drag.mode === "start") {
      onChange({ clipStart: clamp(t, 0, layer.clipEnd - min) });
    } else if (drag.mode === "end") {
      onChange({ clipEnd: clamp(t, layer.clipStart + min, sample.duration) });
    } else {
      const length = Math.min(drag.length, sample.duration);
      const start = clamp(t - drag.grabOffset, 0, sample.duration - length);
      onChange({ clipStart: start, clipEnd: start + length });
    }
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = timeAt(e.clientX);
    const edgePx = 10;
    const startPx = (layer.clipStart / sample.duration) * rect.width;
    const endPx = (layer.clipEnd / sample.duration) * rect.width;

    if (Math.abs(x - startPx) <= edgePx) {
      dragRef.current = { mode: "start" };
    } else if (Math.abs(x - endPx) <= edgePx) {
      dragRef.current = { mode: "end" };
    } else if (x > startPx && x < endPx) {
      dragRef.current = { mode: "move", grabOffset: t - layer.clipStart, length: layer.clipEnd - layer.clipStart };
    } else {
      dragRef.current =
        Math.abs(t - layer.clipStart) <= Math.abs(t - layer.clipEnd) ? { mode: "start" } : { mode: "end" };
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    applyDrag(e.clientX);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    applyDrag(e.clientX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer may not be captured
    }
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      title="Drag an edge to trim · drag the middle to move the slice as a block"
      className="relative h-20 w-full cursor-grab touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/40 active:cursor-grabbing"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {layer.reversed && (
        <span className="pointer-events-none absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-fuchsia-300/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-fuchsia-100">
          <Rewind size={10} /> reversed
        </span>
      )}
    </div>
  );
}

function BeatMatchControl({
  sourceBpm,
  speed,
  projectBpm,
  onMatch,
}: {
  sourceBpm: number | null;
  speed: number;
  projectBpm: number;
  onMatch: (sourceBpm: number) => void;
}) {
  const [draftBpm, setDraftBpm] = useState(sourceBpm ?? projectBpm);
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    if (sourceBpm) setDraftBpm(sourceBpm);
  }, [sourceBpm]);

  const tap = () => {
    const now = performance.now();
    const taps = tapsRef.current;
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now);
    if (taps.length > 6) taps.shift();
    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i += 1) intervals.push(taps[i] - taps[i - 1]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setDraftBpm(clamp(Math.round(60000 / avg), 40, 220));
    }
  };

  const idealRatio = draftBpm > 0 ? projectBpm / draftBpm : 1;
  const outOfRange = idealRatio < MIN_SPEED || idealRatio > MAX_SPEED;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-sky-300/20 bg-sky-300/5 p-3">
      <Magnet size={14} className="shrink-0 text-sky-200" />
      <span className="text-[0.68rem] font-black uppercase text-slate-500">Beat match</span>
      <label className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-xs font-black text-slate-300">
        <span className="text-slate-500">source</span>
        <input
          type="number"
          min={20}
          max={300}
          step={1}
          value={draftBpm}
          onChange={(e) => setDraftBpm(Number(e.target.value) || 0)}
          className="w-14 bg-transparent text-right text-slate-100 outline-none"
        />
        <span className="text-slate-500">bpm</span>
      </label>
      <button
        type="button"
        onClick={tap}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-2.5 text-xs font-black uppercase text-slate-200 transition hover:bg-white/[0.12]"
        title="Tap along with the vocal a few times to estimate its BPM"
      >
        <Hand size={13} /> Tap
      </button>
      <button
        type="button"
        onClick={() => draftBpm > 0 && onMatch(draftBpm)}
        disabled={!draftBpm}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-sky-300/40 bg-sky-300/15 px-2.5 text-xs font-black uppercase text-sky-100 transition hover:bg-sky-300/25 disabled:cursor-not-allowed disabled:opacity-40"
        title="Set this layer's speed so it locks to the project BPM"
      >
        <Magnet size={13} /> Match to {projectBpm}
      </button>
      <span className="text-[11px] text-slate-500">
        speed {speed.toFixed(2)}×{sourceBpm ? ` · locked from ${sourceBpm} bpm` : ""}
      </span>
      {outOfRange && (
        <span className="text-[11px] font-black text-amber-300">
          {draftBpm}→{projectBpm} needs {idealRatio.toFixed(2)}×, clamped to{" "}
          {clamp(idealRatio, MIN_SPEED, MAX_SPEED).toFixed(2)}×
        </span>
      )}
    </div>
  );
}

function BeatGridPanel({
  layers,
  samples,
  playing,
  activeStep,
  onToggleStep,
  onSetMode,
  onClearSteps,
}: {
  layers: Layer[];
  samples: Sample[];
  playing: boolean;
  activeStep: number;
  onToggleStep: (layerId: string, stepIndex: number, value: boolean) => void;
  onSetMode: (layerId: string, mode: Layer["triggerMode"]) => void;
  onClearSteps: (layerId: string) => void;
}) {
  const paintRef = useRef<{ value: boolean } | null>(null);

  useEffect(() => {
    const endPaint = () => {
      paintRef.current = null;
    };
    window.addEventListener("pointerup", endPaint);
    return () => window.removeEventListener("pointerup", endPaint);
  }, []);

  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">All layers, one grid</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
            <Grid3x3 className="text-emerald-200" size={22} /> Beat Grid
          </h2>
        </div>
        <p className="max-w-md text-xs leading-5 text-slate-400">
          Flip a layer to <span className="font-black text-slate-200">Steps</span> to program hits here instead of
          looping continuously — the playhead sweeps in sync with Project BPM. Click a cell to toggle it, or drag
          with the mouse to paint a run.
        </p>
      </div>

      {layers.length === 0 ? (
        <p className="rounded-md border border-white/10 bg-black/30 p-6 text-center text-sm text-slate-500">
          Add a layer below, then switch it to Steps to program a pattern here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] gap-2">
            {layers.map((layer) => {
              const sample = samples.find((s) => s.id === layer.sampleId) ?? null;
              const stepsMode = layer.triggerMode === "steps";
              return (
                <div key={layer.id} className="grid grid-cols-[180px_1fr] items-center gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ background: layer.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-white">{layer.name}</p>
                      <p className="truncate text-[10px] text-slate-500">{sample ? sample.name : "no sample"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSetMode(layer.id, stepsMode ? "loop" : "steps")}
                      disabled={!sample}
                      className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        stepsMode ? "bg-emerald-300 text-black" : "bg-white/[0.08] text-slate-300 hover:bg-white/[0.16]"
                      }`}
                      title={stepsMode ? "Switch back to continuous Loop" : "Switch to Steps to program hits"}
                    >
                      {stepsMode ? "Steps" : "Loop"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onClearSteps(layer.id)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-500 transition hover:text-red-200"
                      title="Clear this row's pattern"
                    >
                      <Eraser size={12} />
                    </button>
                  </div>

                  <div
                    className="relative grid overflow-hidden rounded-md border border-white/10"
                    style={{ gridTemplateColumns: `repeat(${STEP_COUNT}, minmax(0,1fr))` }}
                  >
                    {playing && (
                      <div
                        className="pointer-events-none absolute inset-y-0 bg-white/15"
                        style={{ left: `${(activeStep / STEP_COUNT) * 100}%`, width: `${100 / STEP_COUNT}%` }}
                      />
                    )}
                    {layer.steps.map((on, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={!stepsMode || !sample}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          const next = !on;
                          paintRef.current = { value: next };
                          onToggleStep(layer.id, i, next);
                        }}
                        onPointerEnter={() => {
                          if (paintRef.current) onToggleStep(layer.id, i, paintRef.current.value);
                        }}
                        className={`relative h-8 border-r border-white/10 transition last:border-r-0 disabled:cursor-not-allowed ${
                          !stepsMode || !sample
                            ? "opacity-30"
                            : Math.floor(i / 4) % 2 === 0
                              ? "bg-white/[0.05] hover:bg-white/[0.1]"
                              : "bg-white/[0.02] hover:bg-white/[0.08]"
                        }`}
                        style={on ? { background: layer.color } : undefined}
                        title={`Step ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function LayerLoops({ layers, samples, playing }: { layers: Layer[]; samples: Sample[]; playing: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between text-xs font-black uppercase text-slate-500">
        <span>Layer loops</span>
        <span>{playing ? "running" : "stopped"}</span>
      </div>
      <div className="space-y-1.5">
        {layers.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Each layer&apos;s loop cycle shows here.</p>
        ) : (
          layers.map((layer) => {
            const sample = samples.find((s) => s.id === layer.sampleId) ?? null;
            const dur = loopSeconds(layer, sample);
            const stepsMode = layer.triggerMode === "steps";
            const hits = layer.steps.filter(Boolean).length;
            return (
              <div key={layer.id} className="relative h-7 overflow-hidden rounded-md bg-white/[0.04]">
                {sample && !stepsMode && (
                  <div
                    key={playing ? `run-${dur.toFixed(3)}-${layer.loop}` : "idle"}
                    className="absolute inset-y-0 left-0 w-full origin-left"
                    style={{
                      background: `${layer.color}55`,
                      transform: playing ? undefined : "scaleX(0)",
                      animation: playing
                        ? `sb-loopfill ${Math.max(0.08, dur)}s linear ${layer.loop ? "infinite" : "1"} both`
                        : undefined,
                    }}
                  />
                )}
                <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-[11px] font-black uppercase text-white/75">
                  <span className="truncate">{layer.name}</span>
                  <span className="shrink-0 pl-2 text-white/50">
                    {!sample
                      ? "no sample"
                      : stepsMode
                        ? `${hits}/${STEP_COUNT} steps · Beat Grid`
                        : `${dur.toFixed(2)}s${layer.loop ? "" : " · once"}`}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function SpectralPanel({
  spectral,
  color,
  bandLevels,
  spectro,
  spectroBusy,
  onChange,
}: {
  spectral: Spectral;
  color: string;
  bandLevels: number[];
  spectro: Spectrogram | null;
  spectroBusy: boolean;
  onChange: (patch: Partial<Spectral>) => void;
}) {
  const { centers } = useMemo(() => bandFrequencies(spectral.bands), [spectral.bands]);

  const setBand = (i: number, db: number) => {
    const next = spectral.bandDb.slice();
    next[i] = clamp(db, DB_MIN, DB_MAX);
    onChange({ bandDb: next });
  };
  const toggleBand = (i: number) => {
    const next = spectral.bandOn.slice();
    next[i] = !next[i];
    onChange({ bandOn: next });
  };
  const flatten = () =>
    onChange({
      tiltDb: 0,
      focusAmtDb: 0,
      bandDb: spectral.bandDb.map(() => 0),
      bandOn: spectral.bandOn.map(() => true),
    });

  const focusSlider = Math.round(freqToUnit(spectral.focusHz) * 1000);

  return (
    <div className="grid gap-3 rounded-lg border border-emerald-300/20 bg-black/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ enabled: !spectral.enabled })}
          className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black uppercase transition ${
            spectral.enabled
              ? "border-emerald-300 bg-emerald-300 text-black"
              : "border-white/10 bg-white/[0.06] text-slate-200"
          }`}
        >
          {spectral.enabled ? "Bank on" : "Bank off"}
        </button>

        <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-black text-slate-300">
          <span className="text-slate-500">bands</span>
          <button
            type="button"
            onClick={() => onChange(resizeSpectral(spectral, clamp(spectral.bands - 1, MIN_BANDS, MAX_BANDS)))}
            className="grid h-6 w-6 place-items-center rounded bg-white/[0.06] hover:bg-white/[0.14]"
          >
            −
          </button>
          <span className="w-6 text-center text-white">{spectral.bands}</span>
          <button
            type="button"
            onClick={() => onChange(resizeSpectral(spectral, clamp(spectral.bands + 1, MIN_BANDS, MAX_BANDS)))}
            className="grid h-6 w-6 place-items-center rounded bg-white/[0.06] hover:bg-white/[0.14]"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={flatten}
          className="min-h-9 rounded-md border border-white/10 bg-white/[0.06] px-3 text-xs font-black uppercase text-slate-200 transition hover:bg-white/[0.12]"
        >
          Flatten
        </button>

        {spectroBusy && <span className="text-[11px] font-black uppercase text-slate-500">analysing…</span>}
      </div>

      {!spectral.enabled ? (
        <p className="rounded-md border border-dashed border-white/10 bg-black/30 p-4 text-center text-xs text-slate-500">
          Turn the bank on to fan this layer into {spectral.bands} Linkwitz-Riley bands — each one metered, mutable,
          and trimmable on its own.
        </p>
      ) : (
        <>
          <SpectrogramCanvas
            spectro={spectro}
            spectral={spectral}
            onFocusHz={(hz) => onChange({ focusHz: hz })}
          />

          <EqCurveCanvas
            spectral={spectral}
            centers={centers}
            spectro={spectro}
            onBandDb={setBand}
            onFocusHz={(hz) => onChange({ focusHz: hz })}
          />

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Fader
              label="Tilt"
              value={spectral.tiltDb}
              min={-12}
              max={12}
              step={0.5}
              display={`${spectral.tiltDb > 0 ? "+" : ""}${spectral.tiltDb.toFixed(1)} dB/oct`}
              onChange={(tiltDb) => onChange({ tiltDb })}
            />
            <Fader
              label="Lens gain"
              value={spectral.focusAmtDb}
              min={-24}
              max={24}
              step={0.5}
              display={`${spectral.focusAmtDb > 0 ? "+" : ""}${spectral.focusAmtDb.toFixed(1)} dB`}
              onChange={(focusAmtDb) => onChange({ focusAmtDb })}
            />
            <Fader
              label="Lens width"
              value={spectral.focusWidthOct}
              min={0.15}
              max={4}
              step={0.05}
              display={`${spectral.focusWidthOct.toFixed(2)} oct`}
              onChange={(focusWidthOct) => onChange({ focusWidthOct })}
            />
            <label className="rounded-md border border-white/10 bg-black/30 p-3">
              <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
                <span>Lens freq</span>
                <span className="text-slate-300">{fmtHz(spectral.focusHz)} Hz</span>
              </span>
              <input
                className="w-full accent-emerald-300"
                type="range"
                min={0}
                max={1000}
                step={1}
                value={focusSlider}
                onChange={(e) => onChange({ focusHz: Math.round(unitToFreq(Number(e.target.value) / 1000)) })}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-1">
            {centers.map((fc, i) => {
              const lvl = bandLevels[i] ?? 0;
              const on = spectral.bandOn[i];
              const trim = spectral.bandDb[i] ?? 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleBand(i)}
                  title={`${Math.round(fc)} Hz — click to ${on ? "mute" : "unmute"}`}
                  className={`relative h-14 flex-1 basis-[52px] overflow-hidden rounded-sm border text-center text-[10px] font-black leading-tight transition ${
                    on ? "border-white/15 text-white" : "border-white/[0.06] text-slate-600"
                  }`}
                >
                  <span
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      height: `${clamp(lvl, 0, 1) * 100}%`,
                      background: on ? `${color}aa` : "rgba(148,163,184,0.15)",
                    }}
                  />
                  <span className="relative block pt-1">{fmtHz(fc)}</span>
                  <span className="relative block text-slate-400">
                    {trim > 0 ? "+" : ""}
                    {Math.round(trim)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SpectrogramCanvas({
  spectro,
  spectral,
  onFocusHz,
}: {
  spectro: Spectrogram | null;
  spectral: Spectral;
  onFocusHz: (hz: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offRef = useRef<HTMLCanvasElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!spectro) {
      offRef.current = null;
      return;
    }
    const off = document.createElement("canvas");
    off.width = spectro.frames;
    off.height = spectro.bins;
    const octx = off.getContext("2d");
    if (!octx) return;
    const img = octx.createImageData(spectro.frames, spectro.bins);
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
    octx.putImageData(img, 0, 0);
    offRef.current = off;
  }, [spectro]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 2) return;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, w, h);

    const off = offRef.current;
    if (off && spectro) {
      const nyq = spectro.sampleRate / 2;
      ctx.imageSmoothingEnabled = true;
      const rows = Math.min(h, 200);
      const rowH = h / rows;
      for (let r = 0; r < rows; r += 1) {
        const unit = 1 - r / rows;
        const freq = unitToFreq(unit);
        const bin = clamp(Math.round((freq / nyq) * spectro.bins), 0, spectro.bins - 1);
        const srcY = spectro.bins - 1 - bin;
        ctx.drawImage(off, 0, srcY, spectro.frames, 1, 0, r * rowH, w, rowH + 1);
      }
    } else {
      ctx.fillStyle = "rgba(148,163,184,0.45)";
      ctx.font = "700 12px system-ui, sans-serif";
      ctx.fillText(spectro === null ? "Assign a sample to read its spectrum" : "…", 12, h / 2);
    }

    ctx.font = "700 9px system-ui, sans-serif";
    [50, 100, 250, 500, 1000, 2500, 5000, 10000].forEach((f) => {
      if (f <= FB_MIN_HZ || f >= FB_MAX_HZ) return;
      const y = (1 - freqToUnit(f)) * h;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(226,232,240,0.5)";
      ctx.fillText(fmtHz(f), 4, y - 2);
    });

    const yc = (1 - freqToUnit(spectral.focusHz)) * h;
    const yLo = (1 - freqToUnit(spectral.focusHz * 2 ** spectral.focusWidthOct)) * h;
    const yHi = (1 - freqToUnit(spectral.focusHz * 2 ** -spectral.focusWidthOct)) * h;
    ctx.fillStyle = "rgba(52,211,153,0.14)";
    ctx.fillRect(0, Math.min(yLo, yHi), w, Math.abs(yHi - yLo));
    ctx.strokeStyle = "rgba(52,211,153,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, yc);
    ctx.lineTo(w, yc);
    ctx.stroke();
    ctx.fillStyle = "rgba(52,211,153,0.95)";
    ctx.fillText(`lens ${fmtHz(spectral.focusHz)}Hz`, w - 78, yc - 4);
  }, [spectral.focusHz, spectral.focusWidthOct, spectro]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(draw);
    window.addEventListener("resize", draw);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", draw);
    };
  }, [draw]);

  const freqAt = (clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const unit = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    return clamp(Math.round(unitToFreq(unit)), 20, 20000);
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={(e) => {
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onFocusHz(freqAt(e.clientY));
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) onFocusHz(freqAt(e.clientY));
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }}
      title="Drag vertically to slide the focus lens through the spectrum"
      className="relative h-44 w-full cursor-ns-resize touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/50"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function EqCurveCanvas({
  spectral,
  centers,
  spectro,
  onBandDb,
  onFocusHz,
}: {
  spectral: Spectral;
  centers: number[];
  spectro: Spectrogram | null;
  onBandDb: (index: number, db: number) => void;
  onFocusHz: (hz: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ kind: "band"; index: number } | { kind: "lens" } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !wrap || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 2) return;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;

    const xForFreq = (f: number) => freqToUnit(f) * w;
    const yForDb = (db: number) => (1 - (db - DB_MIN) / (DB_MAX - DB_MIN)) * h;

    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    ctx.moveTo(0, yForDb(0));
    ctx.lineTo(w, yForDb(0));
    ctx.stroke();
    [100, 1000, 10000].forEach((f) => {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.moveTo(xForFreq(f), 0);
      ctx.lineTo(xForFreq(f), h);
      ctx.stroke();
    });

    if (spectro) {
      const nyq = spectro.sampleRate / 2;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let px = 0; px <= w; px += 2) {
        const freq = unitToFreq(px / w);
        const bin = clamp(Math.round((freq / nyq) * spectro.bins), 0, spectro.bins - 1);
        ctx.lineTo(px, h - spectro.avg[bin] * h * 0.9);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "rgba(56,189,248,0.16)";
      ctx.fill();
    }

    ctx.beginPath();
    for (let px = 0; px <= w; px += 2) {
      const freq = unitToFreq(px / w);
      const db = clamp(bandTrimAt(freq, centers, spectral.bandDb) + spectralShapeDb(spectral, freq), DB_MIN, DB_MAX);
      const y = yForDb(db);
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.strokeStyle = "rgba(52,211,153,0.95)";
    ctx.lineWidth = 2;
    ctx.stroke();

    centers.forEach((fc, i) => {
      const x = xForFreq(fc);
      const y = yForDb(spectral.bandDb[i] ?? 0);
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = spectral.bandOn[i] ? "#e2e8f0" : "rgba(148,163,184,0.4)";
      ctx.fill();
    });

    const lx = xForFreq(spectral.focusHz);
    ctx.strokeStyle = "rgba(52,211,153,0.55)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(226,232,240,0.45)";
    ctx.font = "700 9px system-ui, sans-serif";
    ctx.fillText("+18", 3, 10);
    ctx.fillText(`${DB_MIN}`, 3, h - 3);
  }, [centers, spectral, spectro]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(draw);
    window.addEventListener("resize", draw);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", draw);
    };
  }, [draw]);

  const dbAt = (clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const t = clamp((clientY - rect.top) / rect.height, 0, 1);
    return DB_MIN + (1 - t) * (DB_MAX - DB_MIN);
  };
  const freqAtX = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return clamp(Math.round(unitToFreq(clamp((clientX - rect.left) / rect.width, 0, 1))), 20, 20000);
  };

  const grab = (clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const lensX = freqToUnit(spectral.focusHz) * rect.width;
    let bestI = 0;
    let bestD = Infinity;
    centers.forEach((fc, i) => {
      const d = Math.abs(freqToUnit(fc) * rect.width - x);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    });
    if (Math.abs(lensX - x) < 8 && bestD > 14) {
      dragRef.current = { kind: "lens" };
      onFocusHz(freqAtX(clientX));
    } else {
      dragRef.current = { kind: "band", index: bestI };
      onBandDb(bestI, dbAt(clientY));
    }
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        grab(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current;
        if (!drag) return;
        if (drag.kind === "band") onBandDb(drag.index, dbAt(e.clientY));
        else onFocusHz(freqAtX(e.clientX));
      }}
      onPointerUp={(e) => {
        dragRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }}
      title="Drag a band point up / down · drag the dashed line to move the lens"
      className="relative h-36 w-full cursor-pointer touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/50"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

function Fader({
  label,
  value,
  min,
  max,
  step,
  display,
  accent = "emerald",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  accent?: "emerald" | "sky";
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-md border border-white/10 bg-black/30 p-3">
      <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
        <span>{label}</span>
        <span className="text-slate-300">{display}</span>
      </span>
      <input
        className={`w-full ${accent === "sky" ? "accent-sky-300" : "accent-emerald-300"}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.06] p-3">
      <p className="text-[0.68rem] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-2 text-emerald-200">
        {icon}
        <p className="text-[0.68rem] font-black uppercase text-slate-500">{label}</p>
      </div>
      <p className="mt-2 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    webkitOfflineAudioContext?: typeof OfflineAudioContext;
  }
}
