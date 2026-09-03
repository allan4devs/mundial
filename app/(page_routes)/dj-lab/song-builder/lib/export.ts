/** Offline bounce: rebuilds the whole arrangement in an OfflineAudioContext. */

import { EXPORT_TAIL_SECONDS, MAX_EXPORT_SECONDS, MIN_EXPORT_SECONDS } from "./constants";
import { buildFilterbank, getOfflineCtor } from "./audio";
import { clamp } from "./format";
import { barSeconds, isStepsMode, layerSpeed, playableLayers, sampleOf, stepSeconds } from "./layer";
import { clipRange, createClipSource, triggerLayerStep } from "./playback";
import type { Layer, Sample, SampleMap } from "../types";

export type RenderRequest = {
  layers: Layer[];
  sampleById: SampleMap;
  masterGain: number;
  /** Bounce length in seconds, clamped to the export range. */
  seconds: number;
  bpm: number;
  sampleRate: number;
  /** Supplies (and caches) the reversed copy of a sample. */
  reversedBufferFor: (sample: Sample) => AudioBuffer;
};

/** Renders the audible layers to a stereo buffer — filterbanks, Beat Grid hits and all. */
export async function renderMix(req: RenderRequest): Promise<AudioBuffer> {
  const audible = playableLayers(req.layers, req.sampleById);
  if (!audible.length) throw new Error("Add at least one audible layer with a sample before bouncing.");

  const length = clamp(req.seconds, MIN_EXPORT_SECONDS, MAX_EXPORT_SECONDS);
  const Ctor = getOfflineCtor();
  const offline = new Ctor(2, Math.max(1, Math.ceil(req.sampleRate * (length + EXPORT_TAIL_SECONDS))), req.sampleRate);

  const master = offline.createGain();
  master.gain.value = req.masterGain;
  master.connect(offline.destination);

  const step = stepSeconds(req.bpm);
  const bar = barSeconds(req.bpm);

  for (const layer of audible) {
    const sample = sampleOf(layer, req.sampleById);
    if (!sample) continue;

    const layerOut = offline.createGain();
    layerOut.gain.value = layer.gain;
    layerOut.connect(master);

    const input = offline.createGain();
    buildFilterbank(offline, input, layerOut, layer.spectral);

    const reversedBuffer = layer.reversed ? req.reversedBufferFor(sample) : null;

    if (isStepsMode(layer)) {
      for (let barStart = 0; barStart < length; barStart += bar) {
        layer.steps.forEach((on, stepIndex) => {
          const when = barStart + stepIndex * step;
          if (!on || when >= length) return;
          triggerLayerStep(offline, input, layer, sample, reversedBuffer, when, length + 0.3);
        });
      }
      continue;
    }

    const range = clipRange(layer, sample, reversedBuffer);
    const src = createClipSource(offline, input, layer, range);
    src.loop = layer.loop;
    src.loopStart = range.start;
    src.loopEnd = range.end;
    src.start(0, range.start);
    src.stop(
      layer.loop ? length : Math.min(length, (range.end - range.start) / layerSpeed(layer) + 0.02),
    );
  }

  return offline.startRendering();
}
