/** The shared context, and the channel strip every row is played through. */

import type { Sound } from "@/lib/song-builder/types";
import {
  EQ_HIGH_HZ,
  EQ_LOW_HZ,
  EQ_MID_HZ,
  DUCK_RELEASE_SECONDS,
  HPF_BASE_HZ,
  HPF_MAX_HZ,
  RAMP_SECONDS,
} from "./constants";
import { driveCurve } from "./dsp";

let context: AudioContext | null = null;

function getAudioCtor(): typeof AudioContext {
  const ctor = window.AudioContext || window.webkitAudioContext;
  if (!ctor) throw new Error("Web Audio is not supported in this browser.");
  return ctor;
}

/**
 * The one `AudioContext` for the studio, resumed on demand. Browsers only let it
 * start inside a gesture, so every entry point (record, play, preview) awaits
 * this. `interactive` asks the browser for the smallest buffer it can manage,
 * which is what keeps an auditioned step feeling like a key press.
 */
export async function getAudioContext(): Promise<AudioContext> {
  context ??= new (getAudioCtor())({ latencyHint: "interactive" });
  if (context.state === "suspended") await context.resume();
  return context;
}

/** What a strip needs to reach: the dry bus and the two shared effect buses. */
export type SendBus = {
  input: AudioNode;
  reverbBus: AudioNode;
  delayBus: AudioNode;
};

/**
 * One row's channel strip - the desk, one channel of it.
 *
 * Signal order is the order a mixing engineer would reach for the controls, and
 * it is not arbitrary: filter the rubbish out first, shape what is left, then set
 * the level, then duck it under the kick, then place it in the stereo field, and
 * only then split off the sends - so a row that is turned down or ducked is
 * quieter in the reverb too, which is what "post-fader" means and why the room
 * does not swell every time the mix gets quiet.
 *
 * The strip is built once per row and only ever retuned, so changing sound
 * mid-loop moves the amplifier and the EQ without interrupting a ringing note.
 */
export type Strip = {
  /** The drive stage - voices connect here. */
  input: WaveShaperNode;
  cut: BiquadFilterNode;
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  high: BiquadFilterNode;
  level: GainNode;
  /** Automated down on every kick. See `duckStrip`. */
  duck: GainNode;
  pan: StereoPannerNode;
  reverbSend: GainNode;
  delaySend: GainNode;
  /** How far this row gets out of the kick's way, 0..1. Read by `duckStrip`. */
  depth: number;
};

export function createStrip(ctx: AudioContext, bus: SendBus): Strip {
  const input = ctx.createWaveShaper();
  input.oversample = "2x";

  const cut = ctx.createBiquadFilter();
  cut.type = "highpass";
  cut.Q.value = 0.7;

  const low = ctx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = EQ_LOW_HZ;

  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = EQ_MID_HZ;
  mid.Q.value = 0.9;

  const high = ctx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = EQ_HIGH_HZ;

  const level = ctx.createGain();
  const duck = ctx.createGain();
  const pan = ctx.createStereoPanner();
  const reverbSend = ctx.createGain();
  const delaySend = ctx.createGain();
  reverbSend.gain.value = 0;
  delaySend.gain.value = 0;

  input.connect(cut);
  cut.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(level);
  level.connect(duck);
  duck.connect(pan);
  pan.connect(bus.input);
  pan.connect(reverbSend);
  pan.connect(delaySend);
  reverbSend.connect(bus.reverbBus);
  delaySend.connect(bus.delayBus);

  return { input, cut, low, mid, high, level, duck, pan, reverbSend, delaySend, depth: 0 };
}

/**
 * Pushes a sound's amplifier, EQ and mix position into a strip already in the graph.
 *
 * A silenced row rides the strip's own fader down rather than getting a gain of
 * its own: because the sends hang off the far end of the strip, that is also what
 * takes it out of the reverb and the delay, which a mute that only skipped the
 * notes would leave ringing.
 */
export function applyStrip(ctx: AudioContext, strip: Strip, sound: Sound, muted: boolean) {
  strip.input.curve = driveCurve(sound.amp.drive);
  strip.depth = sound.mix.duck;

  const now = ctx.currentTime;
  const set = (param: AudioParam, value: number) => param.setTargetAtTime(value, now, RAMP_SECONDS);

  // The higher a row sits, the more of the bottom it can give away. A row's
  // register is already written down as `transpose`, so the filter follows it
  // rather than asking for a knob nobody would know how to set.
  set(strip.cut.frequency, Math.min(HPF_MAX_HZ, HPF_BASE_HZ * 2 ** (sound.transpose / 12)));
  set(strip.low.gain, sound.eq.low);
  set(strip.mid.gain, sound.eq.mid);
  set(strip.high.gain, sound.eq.high);
  set(strip.level.gain, muted ? 0 : sound.amp.level);
  set(strip.pan.pan, sound.mix.pan);
  set(strip.reverbSend.gain, sound.mix.reverb);
  set(strip.delaySend.gain, sound.mix.delay);
}

/**
 * Gets a row out of the kick's way.
 *
 * Web Audio has no sidechain input, and it does not need one: the scheduler
 * knows exactly when every kick lands, so the duck is drawn on the gain curve
 * ahead of time instead of being detected after the fact. That is both cleaner
 * than a real sidechain and the reason the pump is dead in time with the beat.
 */
export function duckStrip(strip: Strip, time: number, seconds: number) {
  if (strip.depth <= 0) return;
  const gain = strip.duck.gain;
  gain.cancelScheduledValues(time);
  gain.setValueAtTime(1, time);
  gain.linearRampToValueAtTime(1 - strip.depth, time + 0.012);
  gain.linearRampToValueAtTime(1, time + Math.min(seconds, DUCK_RELEASE_SECONDS));
}

/** Averages every channel into one array - all analysis works on mono. */
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
