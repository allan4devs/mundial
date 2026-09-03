/** Pure helpers over the `Layer` / `Sample` model — no Web Audio, no React. */

import {
  DEFAULT_CLIP_SECONDS,
  MAX_SPEED,
  MIN_CLIP_SECONDS,
  MIN_SPEED,
  SAMPLE_COLORS,
  STEPS_PER_BEAT,
  STEP_COUNT,
} from "./constants";
import { clamp, uid } from "./format";
import { makeSpectral } from "./spectral";
import type { Layer, Sample, SampleMap } from "../types";

/** An empty one-bar Beat Grid pattern. */
export function makeSteps(): boolean[] {
  return Array.from({ length: STEP_COUNT }, () => false);
}

/** Picks a colour from the palette by index, wrapping around. */
export function paletteColor(index: number) {
  return SAMPLE_COLORS[index % SAMPLE_COLORS.length];
}

/** The default chop for a freshly assigned sample: the head of it, or nothing at all. */
export function defaultClip(sample: Sample | null) {
  return { clipStart: 0, clipEnd: sample ? Math.min(sample.duration, DEFAULT_CLIP_SECONDS) : 0 };
}

export type NewLayerOptions = {
  name?: string;
  color?: string;
  sample?: Sample | null;
  sourceBpm?: number | null;
  /** "head" chops the first couple of seconds; "whole" takes the entire sample. */
  clip?: "head" | "whole";
};

/** A new arrangement row, optionally seeded from an instrument preset and a sample. */
export function createLayer(index: number, options: NewLayerOptions = {}): Layer {
  const sample = options.sample ?? null;
  return {
    id: uid("layer"),
    name: options.name ?? `Layer ${index + 1}`,
    color: options.color ?? paletteColor(index),
    sampleId: sample?.id ?? null,
    ...(options.clip === "whole" && sample
      ? { clipStart: 0, clipEnd: sample.duration }
      : defaultClip(sample)),
    loop: true,
    speed: 1,
    gain: 0.9,
    muted: false,
    soloed: false,
    spectral: makeSpectral(),
    reversed: false,
    sourceBpm: options.sourceBpm ?? null,
    triggerMode: "loop",
    steps: makeSteps(),
  };
}

/** Beat Grid layers fire one-shots; everything else runs the continuous loop engine. */
export const isStepsMode = (layer: Layer) => layer.triggerMode === "steps";

/** Any solo anywhere mutes every layer that is not itself soloed. */
export const hasSolo = (layers: Layer[]) => layers.some((l) => l.soloed);

export const isAudible = (layer: Layer, soloActive: boolean) =>
  !layer.muted && (!soloActive || layer.soloed);

export const clipLength = (layer: Layer) => Math.max(MIN_CLIP_SECONDS, layer.clipEnd - layer.clipStart);

export const layerSpeed = (layer: Layer) => clamp(layer.speed, MIN_SPEED, MAX_SPEED);

/** Length of one loop pass, in real seconds (slice length divided by speed). */
export function loopSeconds(layer: Layer, sample: Sample | null) {
  return sample ? clipLength(layer) / layerSpeed(layer) : 0;
}

export const countHits = (layer: Layer) => layer.steps.reduce((n, on) => n + (on ? 1 : 0), 0);

/** Project clock: seconds per 16th-note step, and per one-bar grid pass. */
export const stepSeconds = (bpm: number) => 60 / bpm / STEPS_PER_BEAT;
export const barSeconds = (bpm: number) => stepSeconds(bpm) * STEP_COUNT;

export const sampleOf = (layer: Layer, sampleById: SampleMap) =>
  (layer.sampleId ? sampleById.get(layer.sampleId) : null) ?? null;

/** Layers that can actually be heard right now: assigned, unmuted, and past the solo filter. */
export function playableLayers(layers: Layer[], sampleById: SampleMap) {
  const soloActive = hasSolo(layers.filter((l) => sampleOf(l, sampleById)));
  return layers.filter((l) => sampleOf(l, sampleById) && isAudible(l, soloActive));
}

/** Moves the chop as a block, keeping its length inside the sample. */
export function moveClip(layer: Layer, sample: Sample, start: number): Partial<Layer> {
  const length = clamp(clipLength(layer), MIN_CLIP_SECONDS, sample.duration);
  const clipStart = clamp(start, 0, sample.duration - length);
  return { clipStart, clipEnd: clipStart + length };
}

/** Sets the in point, keeping the slice length wherever it fits. */
export function setClipStart(layer: Layer, sample: Sample, start: number): Partial<Layer> {
  const clipStart = clamp(start, 0, Math.max(0, sample.duration - MIN_CLIP_SECONDS));
  const length = clamp(clipLength(layer), MIN_CLIP_SECONDS, sample.duration - clipStart);
  return { clipStart, clipEnd: clipStart + length };
}

/** Sets the slice length from the current in point. */
export function setClipLength(layer: Layer, sample: Sample, seconds: number): Partial<Layer> {
  const length = clamp(seconds, MIN_CLIP_SECONDS, sample.duration - layer.clipStart);
  return { clipEnd: layer.clipStart + length };
}

/** The speed that locks `sourceBpm` to the project tempo, clamped to what the engine can play. */
export const matchSpeed = (sourceBpm: number, projectBpm: number) =>
  clamp(projectBpm / sourceBpm, MIN_SPEED, MAX_SPEED);
