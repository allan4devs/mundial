/**
 * The synth engines - what a decoded hit actually sounds like.
 *
 * There are five, one per row, and they are addressed by name so a Mongo sound
 * document can pick one and tune it with a bag of numbers. A voice builds a
 * throwaway graph for one note at one time and schedules its own stop; nothing
 * here holds state between notes, and nothing here knows about amplifiers or
 * equalisation - that is the row's channel strip, built in `useAudioEngine`.
 */

import type { Hit, ScaleName, Sound, VoiceId } from "@/lib/song-builder/types";
import { noiseBuffer } from "./audio";
import { clamp } from "./format";
import { midiToFreq, noteFromTone } from "./music";

export type VoiceArgs = {
  ctx: BaseAudioContext;
  /** Where the note lands - the row's channel strip. */
  out: AudioNode;
  /** `ctx.currentTime`-based start, always slightly in the future. */
  time: number;
  /** Decoded loudness, 0..1. */
  velocity: number;
  /** Decoded brightness, 0..1. The kit reads it as a piece; the rest ignore it. */
  tone: number;
  /** MIDI note chosen for this hit. The kit ignores it. */
  note: number;
  /** One sixteenth at the current tempo - voices scale their decay to it. */
  stepSeconds: number;
};

/** `config` is whatever the sound document carried; missing keys fall back. */
export type Voice = (args: VoiceArgs, config: Record<string, number>) => void;

/** Reads one tuning knob out of a sound's config bag. */
function num(config: Record<string, number>, key: string, fallback: number) {
  const value = config[key];
  return Number.isFinite(value) ? value : fallback;
}

/**
 * A percussive amplitude envelope: near-instant attack, exponential decay to
 * silence. `setTargetAtTime` never quite reaches zero, so the explicit
 * `linearRampToValueAtTime` at the end guarantees the node goes quiet.
 */
function pluckEnvelope(param: AudioParam, time: number, peak: number, decay: number) {
  const end = time + decay;
  param.setValueAtTime(0.0001, time);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + 0.006);
  param.setTargetAtTime(0.0001, time + 0.006, decay / 4);
  param.linearRampToValueAtTime(0, end);
  return end;
}

function noiseSource(ctx: BaseAudioContext, time: number, duration: number) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.loop = true;
  source.start(time);
  source.stop(time + duration);
  return source;
}

/** A plucked lead: two detuned saws through a falling filter. */
const pluck: Voice = ({ ctx, out, time, velocity, note }, config) => {
  const decay = num(config, "decay", 0.4);
  const cutoff = num(config, "cutoff", 3200);

  const amp = ctx.createGain();
  const end = pluckEnvelope(amp.gain, time, velocity * 0.5, decay);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 7;
  const open = cutoff * (0.6 + velocity * 0.8);
  filter.frequency.setValueAtTime(open, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(220, open * 0.18), end);

  const detune = num(config, "detune", 6);
  for (const cents of [-detune, detune]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = midiToFreq(note);
    osc.detune.value = cents;
    osc.connect(filter);
    osc.start(time);
    osc.stop(end);
  }

  filter.connect(amp);
  amp.connect(out);
};

/** Sub bass: a sine body with a saw edge, filtered dark and gone quickly. */
const sub: Voice = ({ ctx, out, time, velocity, note }, config) => {
  const amp = ctx.createGain();
  const end = pluckEnvelope(amp.gain, time, velocity * 0.85, num(config, "decay", 0.3));

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = num(config, "cutoff", 300);
  filter.Q.value = 1;

  // An octave below the melodic rows so the bass never fights the lead.
  const freq = midiToFreq(note - 12);

  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.value = freq;
  body.connect(filter);
  body.start(time);
  body.stop(end);

  const edge = ctx.createOscillator();
  edge.type = "sawtooth";
  edge.frequency.value = freq;
  const edgeGain = ctx.createGain();
  edgeGain.gain.value = num(config, "edge", 0.2);
  edge.connect(edgeGain);
  edgeGain.connect(filter);
  edge.start(time);
  edge.stop(end);

  filter.connect(amp);
  amp.connect(out);
};

/**
 * One drum kit driven entirely by brightness: a dark "boom" fires the kick, a
 * mid "ka" the snare, a bright "tss" the hat. Swapping these two thresholds for
 * a classifier is the single highest-value upgrade to the decoder.
 */
const kit: Voice = (args, config) => {
  const tune = num(config, "tune", 1);
  if (args.tone < num(config, "snareAt", 0.34)) return kick(args, tune);
  if (args.tone < num(config, "hatAt", 0.66)) return snare(args, tune);
  return hat(args);
};

function kick({ ctx, out, time, velocity }: VoiceArgs, tune: number) {
  const amp = ctx.createGain();
  const end = pluckEnvelope(amp.gain, time, velocity * 0.95, 0.32);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  // The pitch drop is what makes a sine read as a kick rather than a beep.
  osc.frequency.setValueAtTime(125 * tune, time);
  osc.frequency.exponentialRampToValueAtTime(42 * tune, time + 0.09);
  osc.connect(amp);
  osc.start(time);
  osc.stop(end);

  amp.connect(out);
}

function snare({ ctx, out, time, velocity }: VoiceArgs, tune: number) {
  const amp = ctx.createGain();
  const end = pluckEnvelope(amp.gain, time, velocity * 0.6, 0.18);

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1900;
  band.Q.value = 0.8;
  noiseSource(ctx, time, 0.18).connect(band);
  band.connect(amp);

  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.value = 185 * tune;
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.35;
  body.connect(bodyGain);
  bodyGain.connect(amp);
  body.start(time);
  body.stop(end);

  amp.connect(out);
}

function hat({ ctx, out, time, velocity }: VoiceArgs) {
  const amp = ctx.createGain();
  pluckEnvelope(amp.gain, time, velocity * 0.32, 0.055);

  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 7200;
  noiseSource(ctx, time, 0.06).connect(high);
  high.connect(amp);

  amp.connect(out);
}

/** Chord stabs: a strummed triad of squares, clipped short to sit in the gaps. */
const stab: Voice = ({ ctx, out, time, velocity, note }, config) => {
  const amp = ctx.createGain();
  const end = pluckEnvelope(amp.gain, time, velocity * 0.3, num(config, "decay", 0.18));

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = num(config, "cutoff", 2400);
  filter.Q.value = 2;
  filter.connect(amp);

  // Root, third and fifth of a minor triad, each a hair later than the last.
  const strum = num(config, "strum", 0.012);
  [0, 3, 7].forEach((interval, index) => {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = midiToFreq(note + interval);
    osc.connect(filter);
    osc.start(time + index * strum);
    osc.stop(end);
  });

  amp.connect(out);
};

/** A pad: three detuned saws with a slow filter sweep and a tail into the next step. */
const pad: Voice = ({ ctx, out, time, velocity, note, stepSeconds }, config) => {
  const cutoff = num(config, "cutoff", 2200);
  const hold = clamp(stepSeconds * 2, 0.12, 0.6);
  const end = time + hold + num(config, "release", 0.5);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.linearRampToValueAtTime(velocity * 0.22, time + 0.05);
  amp.gain.setValueAtTime(velocity * 0.22, time + hold);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 3;
  filter.frequency.setValueAtTime(cutoff * 0.4, time);
  filter.frequency.linearRampToValueAtTime(cutoff, time + hold);
  filter.connect(amp);

  const spread = num(config, "spread", 9);
  for (const cents of [-spread, 0, spread]) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = midiToFreq(note);
    osc.detune.value = cents;
    osc.connect(filter);
    osc.start(time);
    osc.stop(end);
  }

  amp.connect(out);
};

const VOICES: Record<VoiceId, Voice> = { pluck, sub, kit, stab, pad };

/**
 * Renders one decoded hit through one sound. This is the only place that knows a
 * hit's `tone` means both "which drum" and "which note" - everything upstream
 * just carries the number.
 */
export function playHit(
  sound: Sound,
  hit: Hit,
  tuning: { root: number; scale: ScaleName },
  context: Omit<VoiceArgs, "velocity" | "tone" | "note">,
) {
  VOICES[sound.voice](
    {
      ...context,
      velocity: hit.velocity,
      tone: hit.tone,
      note: noteFromTone(hit.tone, tuning.root + sound.transpose, tuning.scale),
    },
    sound.config,
  );
}

/** The count-in metronome. Not an instrument, but it lives on the same clock. */
export function click(ctx: BaseAudioContext, out: AudioNode, time: number, accent: boolean) {
  const amp = ctx.createGain();
  const end = pluckEnvelope(amp.gain, time, accent ? 0.5 : 0.25, 0.05);

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = accent ? 1600 : 1000;
  osc.connect(amp);
  osc.start(time);
  osc.stop(end);

  amp.connect(out);
}
