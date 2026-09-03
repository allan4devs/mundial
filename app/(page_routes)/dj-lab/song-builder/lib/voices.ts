/**
 * The instrument voices - what a decoded hit actually sounds like.
 *
 * Every voice is a factory: it takes a small config and returns a `Voice`, a
 * function that builds a throwaway Web Audio graph for one note at one time and
 * schedules it to stop. Nothing here holds state between notes, so the same voice
 * can be driven by the live scheduler or by an offline render.
 *
 * v1 synthesises everything, which keeps the studio asset-free. A sample-backed
 * voice is the same signature - decode the file once, then start a
 * `BufferSource` here - so adding one is a new entry in `instruments.ts`, not a
 * change to any caller.
 */

import { noiseBuffer } from "./audio";
import { clamp } from "./format";
import { midiToFreq } from "./music";

export type VoiceArgs = {
  ctx: BaseAudioContext;
  /** Where the note lands - the track's gain node. */
  out: AudioNode;
  /** `ctx.currentTime`-based start, always slightly in the future. */
  time: number;
  /** Decoded loudness, 0..1. */
  velocity: number;
  /** Decoded brightness, 0..1. Drums read it as a kit piece, pitched voices ignore it. */
  tone: number;
  /** MIDI note chosen for this hit. Drums ignore it. */
  note: number;
  /** One sixteenth at the current tempo - voices scale their decay to it. */
  stepSeconds: number;
};

export type Voice = (args: VoiceArgs) => void;

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

/** Soft asymmetric clipping - the grit that makes a saw read as a guitar. */
function driveCurve(amount: number) {
  const samples = 1024;
  const curve = new Float32Array(samples);
  const k = amount * 40;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

function noiseSource(ctx: BaseAudioContext, time: number, duration: number) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.loop = true;
  source.start(time);
  source.stop(time + duration);
  return source;
}

/** A plucked lead: two detuned saws through a falling filter, lightly overdriven. */
export function pluckedLead(config: { detune: number; cutoff: number; drive: number; decay: number }): Voice {
  return ({ ctx, out, time, velocity, note }) => {
    const amp = ctx.createGain();
    const end = pluckEnvelope(amp.gain, time, velocity * 0.5, config.decay);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 7;
    const open = config.cutoff * (0.6 + velocity * 0.8);
    filter.frequency.setValueAtTime(open, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(220, open * 0.18), end);

    const shaper = ctx.createWaveShaper();
    shaper.curve = driveCurve(config.drive);

    for (const detune of [-config.detune, config.detune]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = midiToFreq(note);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(time);
      osc.stop(end);
    }

    filter.connect(shaper);
    shaper.connect(amp);
    amp.connect(out);
  };
}

/** Sub bass: a sine body with a saw edge, filtered dark and gone quickly. */
export function subBass(config: { edge: number; cutoff: number; decay: number }): Voice {
  return ({ ctx, out, time, velocity, note }) => {
    const amp = ctx.createGain();
    const end = pluckEnvelope(amp.gain, time, velocity * 0.85, config.decay);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = config.cutoff;
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
    edgeGain.gain.value = config.edge;
    edge.connect(edgeGain);
    edgeGain.connect(filter);
    edge.start(time);
    edge.stop(end);

    filter.connect(amp);
    amp.connect(out);
  };
}

/**
 * One drum kit driven entirely by brightness: a dark "boom" fires the kick, a
 * mid "ka" the snare, a bright "tss" the hat. Swapping this threshold pair for a
 * classifier is the single highest-value upgrade to the decoder.
 */
export function drumKit(config: { snareAt: number; hatAt: number; tune: number }): Voice {
  return (args) => {
    if (args.tone < config.snareAt) return kick(args, config.tune);
    if (args.tone < config.hatAt) return snare(args, config.tune);
    return hat(args);
  };
}

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
export function chordStab(config: { cutoff: number; decay: number; strum: number }): Voice {
  return ({ ctx, out, time, velocity, note }) => {
    const amp = ctx.createGain();
    const end = pluckEnvelope(amp.gain, time, velocity * 0.3, config.decay);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = config.cutoff;
    filter.Q.value = 2;
    filter.connect(amp);

    // Root, third and fifth of a minor triad, each a hair later than the last.
    [0, 3, 7].forEach((interval, index) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = midiToFreq(note + interval);
      osc.connect(filter);
      osc.start(time + index * config.strum);
      osc.stop(end);
    });

    amp.connect(out);
  };
}

/** A pad: three detuned saws with a slow filter sweep and a tail into the next step. */
export function padSynth(config: { spread: number; cutoff: number; release: number }): Voice {
  return ({ ctx, out, time, velocity, note, stepSeconds }) => {
    const hold = clamp(stepSeconds * 2, 0.12, 0.6);
    const end = time + hold + config.release;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(velocity * 0.22, time + 0.05);
    amp.gain.setValueAtTime(velocity * 0.22, time + hold);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 3;
    filter.frequency.setValueAtTime(config.cutoff * 0.4, time);
    filter.frequency.linearRampToValueAtTime(config.cutoff, time + hold);
    filter.connect(amp);

    for (const detune of [-config.spread, 0, config.spread]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = midiToFreq(note);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(time);
      osc.stop(end);
    }

    amp.connect(out);
  };
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
