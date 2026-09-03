/** Web Audio plumbing shared by the live engine and the offline bounce. */

import { DB_OFF } from "./constants";
import { bandFrequencies, bandGainDb, dbToGain } from "./dsp";
import type { Spectral } from "../types";

export function getAudioCtor(): typeof AudioContext {
  const ctor = window.AudioContext || window.webkitAudioContext;
  if (!ctor) throw new Error("Web Audio API is not supported in this browser.");
  return ctor;
}

export function getOfflineCtor(): typeof OfflineAudioContext {
  const ctor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!ctor) throw new Error("Offline rendering is not supported in this browser.");
  return ctor;
}

/** Disconnects nodes that may already be detached — the common teardown in this file. */
export function disconnectAll(...nodes: (AudioNode | undefined)[]) {
  for (const node of nodes) {
    if (!node) continue;
    try {
      node.disconnect();
    } catch {
      // already detached
    }
  }
}

/**
 * Build one Linkwitz-Riley band (two cascaded Butterworth sections per edge) and wire
 * input -> filters -> bandGain -> out. Works for realtime and offline contexts.
 */
export function connectBand(
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
  // Butterworth pairs at the shared edges make the summed bands flat (LR4).
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

export type Filterbank = {
  filters: BiquadFilterNode[];
  gains: GainNode[];
  analysers: AnalyserNode[];
};

const ANALYSER_FFT = 1024;
const ANALYSER_SMOOTHING = 0.6;

/**
 * Fans `input` into the bank described by `sp` and sums it back into `out`.
 * When the bank is off this is a single passthrough connection.
 */
export function buildFilterbank(
  ctx: BaseAudioContext,
  input: AudioNode,
  out: AudioNode,
  sp: Spectral,
  withAnalysers = false,
): Filterbank {
  const bank: Filterbank = { filters: [], gains: [], analysers: [] };
  if (!sp.enabled) {
    input.connect(out);
    return bank;
  }
  const { edges, centers } = bandFrequencies(sp.bands);
  for (let i = 0; i < sp.bands; i += 1) {
    let analyser: AnalyserNode | undefined;
    if (withAnalysers) {
      analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT;
      analyser.smoothingTimeConstant = ANALYSER_SMOOTHING;
      bank.analysers.push(analyser);
    }
    const { filters, gain } = connectBand(
      ctx,
      input,
      out,
      i,
      sp.bands,
      edges,
      dbToGain(bandGainDb(sp, centers[i], i)),
      analyser,
    );
    bank.filters.push(...filters);
    bank.gains.push(gain);
  }
  return bank;
}

/** Re-applies band gains in place — used when only the curve moved, not the band count. */
export function applyBandGains(
  ctx: BaseAudioContext,
  gains: GainNode[],
  sp: Spectral,
  ramp: number,
) {
  const { centers } = bandFrequencies(sp.bands);
  gains.forEach((g, i) => {
    const db = centers[i] === undefined ? DB_OFF : bandGainDb(sp, centers[i], i);
    g.gain.setTargetAtTime(dbToGain(db), ctx.currentTime, ramp);
  });
}
