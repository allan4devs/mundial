/** Source lifecycle: reversing, resolving the audible clip, and firing buffer sources. */

import { MIN_CLIP_SECONDS, START_LEAD_SECONDS } from "./constants";
import { clamp } from "./format";
import { layerSpeed } from "./layer";
import { disconnectAll } from "./audio";
import type { ClipRange, Layer, LayerChain, Sample } from "../types";

/** Reverses every channel of a whole sample once, so chop edits after that are just a coordinate flip. */
export function reverseBuffer(buffer: AudioBuffer): AudioBuffer {
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
export function resolvePlayback(
  layer: Layer,
  sample: Sample,
  reversedBuffer: AudioBuffer | null,
): ClipRange {
  if (!layer.reversed || !reversedBuffer) {
    return { buffer: sample.buffer, start: layer.clipStart, end: layer.clipEnd };
  }
  return {
    buffer: reversedBuffer,
    start: sample.duration - layer.clipEnd,
    end: sample.duration - layer.clipStart,
  };
}

/** {@link resolvePlayback} with the in/out points clamped to something the engine can play. */
export function clipRange(layer: Layer, sample: Sample, reversedBuffer: AudioBuffer | null): ClipRange {
  const { buffer, start, end } = resolvePlayback(layer, sample, reversedBuffer);
  const a = clamp(start, 0, Math.max(0, buffer.duration - MIN_CLIP_SECONDS));
  const b = clamp(end, a + MIN_CLIP_SECONDS, buffer.duration);
  return { buffer, start: a, end: b };
}

/** How long one pass of a clip takes at a given rate, plus a hair of release. */
const passSeconds = (range: ClipRange, speed: number) => (range.end - range.start) / speed + 0.02;

/** Creates a source wired to `dest`, already trimmed to the layer's clip. */
export function createClipSource(
  ctx: BaseAudioContext,
  dest: AudioNode,
  layer: Layer,
  range: ClipRange,
) {
  const src = ctx.createBufferSource();
  src.buffer = range.buffer;
  src.playbackRate.value = layerSpeed(layer);
  src.connect(dest);
  return src;
}

export function stopLayerSource(chain: LayerChain) {
  const src = chain.source;
  if (!src) return;
  src.onended = null;
  try {
    src.stop();
  } catch {
    // already stopped
  }
  disconnectAll(src);
  clearSourceState(chain);
}

function clearSourceState(chain: LayerChain) {
  chain.source = undefined;
  chain.sourceBufferId = undefined;
  chain.sourceLoop = undefined;
  chain.sourceReversed = undefined;
}

/** (Re)start one layer's playing source — seamless loop, or a single pass for one-shots. */
export function createLayerSource(
  ctx: AudioContext,
  chain: LayerChain,
  layer: Layer,
  sample: Sample | null,
  reversedBuffer: AudioBuffer | null,
) {
  stopLayerSource(chain);
  if (!sample) return;
  const range = clipRange(layer, sample, reversedBuffer);
  const src = createClipSource(ctx, chain.input, layer, range);
  src.loop = layer.loop;
  src.loopStart = range.start;
  src.loopEnd = range.end;

  const startAt = ctx.currentTime + START_LEAD_SECONDS;
  src.start(startAt, range.start);
  if (!layer.loop) src.stop(startAt + passSeconds(range, layerSpeed(layer)));

  src.onended = () => {
    if (chain.source === src) clearSourceState(chain);
  };
  chain.source = src;
  chain.sourceBufferId = layer.sampleId ?? "";
  chain.sourceLoop = layer.loop;
  chain.sourceReversed = layer.reversed;
}

/** True when the running source no longer matches the layer and must be rebuilt. */
export function sourceIsStale(chain: LayerChain, layer: Layer) {
  return (
    chain.sourceBufferId !== (layer.sampleId ?? "") ||
    chain.sourceLoop !== layer.loop ||
    chain.sourceReversed !== layer.reversed
  );
}

/** Live-tweaks a running loop: rate and loop points, without restarting the source. */
export function retuneLayerSource(
  ctx: AudioContext,
  chain: LayerChain,
  layer: Layer,
  sample: Sample,
  reversedBuffer: AudioBuffer | null,
  ramp: number,
) {
  const src = chain.source;
  if (!src) return;
  src.playbackRate.setTargetAtTime(layerSpeed(layer), ctx.currentTime, ramp);
  const range = clipRange(layer, sample, reversedBuffer);
  try {
    src.loopStart = range.start;
    src.loopEnd = range.end;
  } catch {
    // some engines reject loop edits mid-flight; the next restart picks them up
  }
}

/** One-shot trigger for a Beat Grid step hit — plays the chop once into an existing chain. */
export function triggerLayerStep(
  ctx: BaseAudioContext,
  input: AudioNode,
  layer: Layer,
  sample: Sample,
  reversedBuffer: AudioBuffer | null,
  when: number,
  stopBefore = Infinity,
) {
  const range = clipRange(layer, sample, reversedBuffer);
  const src = createClipSource(ctx, input, layer, range);
  src.start(when, range.start);
  src.stop(Math.min(stopBefore, when + passSeconds(range, layerSpeed(layer))));
}

/** Fire-and-forget audition of a chop, disconnecting itself when it finishes. */
export function previewClip(
  ctx: AudioContext,
  dest: AudioNode,
  layer: Layer,
  sample: Sample,
  reversedBuffer: AudioBuffer | null,
  onEnded?: () => void,
) {
  const range = clipRange(layer, sample, reversedBuffer);
  const src = createClipSource(ctx, dest, layer, range);
  src.start(0, range.start, range.end - range.start);
  src.onended = () => {
    disconnectAll(src);
    onEnded?.();
  };
  return src;
}
