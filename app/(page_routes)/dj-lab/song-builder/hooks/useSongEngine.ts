"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { applyBandGains, buildFilterbank, disconnectAll, getAudioCtor } from "../lib/audio";
import { EMPTY_LEVELS, RAMP_FAST, RAMP_SLOW, STEP_COUNT } from "../lib/constants";
import { rmsLevel } from "../lib/dsp";
import { renderMix } from "../lib/export";
import { formatTime } from "../lib/format";
import { hasSolo, isAudible, isStepsMode, playableLayers, sampleOf, stepSeconds } from "../lib/layer";
import {
  createLayerSource,
  previewClip,
  retuneLayerSource,
  reverseBuffer,
  sourceIsStale,
  stopLayerSource,
  triggerLayerStep,
} from "../lib/playback";
import { downloadBlob, encodeWav } from "../lib/wav";
import { useAnimationFrame } from "./useAnimationFrame";
import { useLatest } from "./useLatest";
import type { Layer, LayerChain, Sample, SampleMap } from "../types";

const METER_WINDOW = 1024;
const SILENT_GAIN = 0.0001;
const FALLBACK_SAMPLE_RATE = 44100;

export type SongEngineOptions = {
  layers: Layer[];
  sampleById: SampleMap;
  masterGain: number;
  /** Project tempo — drives the Beat Grid playhead and the step scheduler. */
  bpm: number;
  /** Layer whose per-band meters should be live, if any. */
  focusedLayerId: string | null;
  onMessage: (text: string) => void;
};

/**
 * Owns everything that touches Web Audio: the context, one persistent filter chain
 * per layer, the transport, the Beat Grid scheduler and the offline bounce.
 *
 * Layers and samples stay in React state upstream; this hook only mirrors them into
 * the audio graph, so every callback it returns keeps a stable identity.
 */
export function useSongEngine({
  layers,
  sampleById,
  masterGain,
  bpm,
  focusedLayerId,
  onMessage,
}: SongEngineOptions) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [bandLevels, setBandLevels] = useState<number[]>(EMPTY_LEVELS);

  const layersRef = useLatest(layers);
  const samplesRef = useLatest(sampleById);
  const bpmRef = useLatest(bpm);
  const notifyRef = useLatest(onMessage);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const masterValueRef = useRef(masterGain);
  const chainsRef = useRef<Map<string, LayerChain>>(new Map());
  const playingRef = useRef(false);
  const playStartRef = useRef(0);
  const reversedCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const lastFiredStepRef = useRef(-1);
  const lastWholeSecondRef = useRef(-1);
  const meterBufRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const notify = useCallback((text: string) => notifyRef.current(text), [notifyRef]);

  /** Lazily builds + caches the fully-reversed buffer for a sample (whole sample, not just the chop). */
  const reversedBufferFor = useCallback((sample: Sample) => {
    let buf = reversedCacheRef.current.get(sample.id);
    if (!buf) {
      buf = reverseBuffer(sample.buffer);
      reversedCacheRef.current.set(sample.id, buf);
    }
    return buf;
  }, []);

  const reversedFor = useCallback(
    (layer: Layer, sample: Sample | null) => (layer.reversed && sample ? reversedBufferFor(sample) : null),
    [reversedBufferFor],
  );

  /** Drops a sample's cached reverse — call when the sample leaves the pool. */
  const forgetSample = useCallback((sampleId: string) => {
    reversedCacheRef.current.delete(sampleId);
  }, []);

  const getCtx = useCallback(async () => {
    if (!ctxRef.current) {
      const Ctor = getAudioCtor();
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = masterValueRef.current;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  /** Reconcile the persistent per-layer filter graph with the current layers. */
  const syncLayerChains = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const chains = chainsRef.current;
    const current = layersRef.current;

    for (const [id, chain] of [...chains]) {
      if (current.some((l) => l.id === id)) continue;
      stopLayerSource(chain);
      disconnectAll(chain.input, chain.output, ...chain.bandFilters, ...chain.bandGains, ...chain.analysers);
      chains.delete(id);
    }

    const soloActive = hasSolo(current);

    for (const layer of current) {
      let chain = chains.get(layer.id);
      if (!chain) {
        const input = ctx.createGain();
        const output = ctx.createGain();
        output.connect(master);
        chain = { input, output, enabled: false, bandCount: 0, bandFilters: [], bandGains: [], analysers: [] };
        chains.set(layer.id, chain);
      }

      const sp = layer.spectral;
      const shapeChanged = chain.enabled !== sp.enabled || chain.bandCount !== sp.bands;

      if (shapeChanged) {
        // Changing the band count means rebuilding the bank; gains alone can just ramp.
        disconnectAll(chain.input, ...chain.bandFilters, ...chain.bandGains, ...chain.analysers);
        const bank = buildFilterbank(ctx, chain.input, chain.output, sp, true);
        chain.bandFilters = bank.filters;
        chain.bandGains = bank.gains;
        chain.analysers = bank.analysers;
        chain.enabled = sp.enabled;
        chain.bandCount = sp.bands;
      } else if (sp.enabled) {
        applyBandGains(ctx, chain.bandGains, sp, RAMP_SLOW);
      }

      chain.output.gain.setTargetAtTime(
        isAudible(layer, soloActive) ? layer.gain : SILENT_GAIN,
        ctx.currentTime,
        RAMP_FAST,
      );
    }
  }, [layersRef]);

  useEffect(() => {
    if (ctxRef.current) syncLayerChains();
  }, [layers, syncLayerChains]);

  useEffect(() => {
    masterValueRef.current = masterGain;
    const ctx = ctxRef.current;
    if (ctx && masterRef.current) {
      masterRef.current.gain.setTargetAtTime(masterGain, ctx.currentTime, RAMP_FAST);
    }
  }, [masterGain]);

  /** Keep the running transport in step with edits: add sources for new layers, live-tweak the rest. */
  const reconcileSources = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !playingRef.current) return;

    for (const layer of layersRef.current) {
      const chain = chainsRef.current.get(layer.id);
      if (!chain) continue;

      if (isStepsMode(layer)) {
        // Beat Grid steps trigger their own one-shots; no continuous source here.
        if (chain.source) stopLayerSource(chain);
        chain.everStarted = true;
        continue;
      }

      const sample = sampleOf(layer, samplesRef.current);
      if (!sample) {
        stopLayerSource(chain);
        continue;
      }

      const reversed = reversedFor(layer, sample);
      if (!chain.everStarted || !chain.source || sourceIsStale(chain, layer)) {
        createLayerSource(ctx, chain, layer, sample, reversed);
        chain.everStarted = true;
        continue;
      }

      retuneLayerSource(ctx, chain, layer, sample, reversed, RAMP_SLOW);
    }
  }, [layersRef, samplesRef, reversedFor]);

  useEffect(() => {
    if (playing) reconcileSources();
  }, [playing, layers, sampleById, reconcileSources]);

  const stop = useCallback(() => {
    playingRef.current = false;
    for (const chain of chainsRef.current.values()) {
      stopLayerSource(chain);
      chain.everStarted = false;
    }
    lastFiredStepRef.current = -1;
    lastWholeSecondRef.current = -1;
    setPlaying(false);
    setElapsed(0);
    setActiveStep(0);
  }, []);

  const start = useCallback(async () => {
    const current = layersRef.current;
    if (!current.some((l) => l.sampleId)) {
      notify("Add a layer and assign a sample first.");
      return;
    }
    try {
      const ctx = await getCtx();
      playingRef.current = true;
      playStartRef.current = ctx.currentTime;
      lastFiredStepRef.current = -1;
      lastWholeSecondRef.current = -1;
      setActiveStep(0);
      syncLayerChains();

      for (const layer of current) {
        const chain = chainsRef.current.get(layer.id);
        if (!chain) continue;
        chain.everStarted = true;
        if (isStepsMode(layer)) continue;
        const sample = sampleOf(layer, samplesRef.current);
        createLayerSource(ctx, chain, layer, sample, reversedFor(layer, sample));
      }

      setPlaying(true);
      notify("Running. Loop layers repeat their slice; Steps layers fire from the Beat Grid pattern.");
    } catch (e) {
      playingRef.current = false;
      notify(e instanceof Error ? e.message : "Could not start audio.");
    }
  }, [getCtx, layersRef, samplesRef, syncLayerChains, reversedFor, notify]);

  const toggleTransport = useCallback(() => {
    if (playingRef.current) stop();
    else void start();
  }, [start, stop]);

  // Transport clock + Beat Grid scheduler. `elapsed` only changes on whole seconds, so
  // this once-per-frame tick does not re-render the studio sixty times a second.
  useAnimationFrame(playing, () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const elapsedSec = Math.max(0, ctx.currentTime - playStartRef.current);

    const whole = Math.floor(elapsedSec);
    if (whole !== lastWholeSecondRef.current) {
      lastWholeSecondRef.current = whole;
      setElapsed(whole);
    }

    const step = stepSeconds(bpmRef.current);
    const stepFloat = elapsedSec / step;
    const stepIndex = Math.floor(stepFloat) % STEP_COUNT;
    if (stepIndex === lastFiredStepRef.current) return;
    lastFiredStepRef.current = stepIndex;
    setActiveStep(stepIndex);

    const boundary = playStartRef.current + Math.floor(stepFloat) * step;
    for (const layer of layersRef.current) {
      if (!isStepsMode(layer) || !layer.steps[stepIndex]) continue;
      const chain = chainsRef.current.get(layer.id);
      const sample = sampleOf(layer, samplesRef.current);
      if (!chain || !sample) continue;
      triggerLayerStep(ctx, chain.input, layer, sample, reversedFor(layer, sample), boundary);
    }
  });

  // Live per-band meters for the open spectral panel.
  useAnimationFrame(Boolean(focusedLayerId), () => {
    const chain = focusedLayerId ? chainsRef.current.get(focusedLayerId) : undefined;
    if (!chain?.analysers.length) {
      setBandLevels((cur) => (cur.length ? EMPTY_LEVELS : cur));
      return;
    }
    const buf = (meterBufRef.current ??= new Float32Array(METER_WINDOW));
    setBandLevels(
      chain.analysers.map((analyser) => {
        analyser.getFloatTimeDomainData(buf);
        return rmsLevel(buf);
      }),
    );
  });

  useEffect(() => {
    if (!focusedLayerId) setBandLevels(EMPTY_LEVELS);
  }, [focusedLayerId]);

  /** Audition one layer's chop through its own filter chain, without starting the transport. */
  const previewLayer = useCallback(
    async (layerId: string) => {
      const layer = layersRef.current.find((l) => l.id === layerId);
      const sample = layer ? sampleOf(layer, samplesRef.current) : null;
      if (!layer || !sample) return;
      try {
        const ctx = await getCtx();
        syncLayerChains();
        const chain = chainsRef.current.get(layer.id);
        const reversed = reversedFor(layer, sample);
        if (chain) {
          previewClip(ctx, chain.input, layer, sample, reversed);
          return;
        }
        // No chain yet (layer added this very tick) — route through a throwaway gain.
        const gain = ctx.createGain();
        gain.gain.value = layer.gain;
        gain.connect(masterRef.current ?? ctx.destination);
        previewClip(ctx, gain, layer, sample, reversed, () => disconnectAll(gain));
      } catch (e) {
        notify(e instanceof Error ? e.message : "Preview failed.");
      }
    },
    [getCtx, layersRef, samplesRef, syncLayerChains, reversedFor, notify],
  );

  /** Offline-render the arrangement and hand the WAV to the browser. */
  const bounce = useCallback(
    async (seconds: number) => {
      if (!playableLayers(layersRef.current, samplesRef.current).length) {
        notify("Add at least one audible layer with a sample before bouncing.");
        return;
      }
      setRendering(true);
      notify("Rendering your song offline — filters and all…");
      try {
        const rendered = await renderMix({
          layers: layersRef.current,
          sampleById: samplesRef.current,
          masterGain: masterValueRef.current,
          seconds,
          bpm: bpmRef.current,
          sampleRate: ctxRef.current?.sampleRate ?? FALLBACK_SAMPLE_RATE,
          reversedBufferFor,
        });
        downloadBlob(encodeWav(rendered), `song-${Math.round(seconds)}s.wav`);
        notify(`Bounced ${formatTime(rendered.duration)} of audio to WAV.`);
      } catch (e) {
        notify(e instanceof Error ? `Export failed: ${e.message}` : "Export failed.");
      } finally {
        setRendering(false);
      }
    },
    [layersRef, samplesRef, bpmRef, reversedBufferFor, notify],
  );

  useEffect(
    () => () => {
      for (const chain of chainsRef.current.values()) stopLayerSource(chain);
      void ctxRef.current?.close();
    },
    [],
  );

  return {
    playing,
    elapsed,
    activeStep,
    bandLevels,
    rendering,
    getCtx,
    start,
    stop,
    toggleTransport,
    previewLayer,
    bounce,
    forgetSample,
  };
}
