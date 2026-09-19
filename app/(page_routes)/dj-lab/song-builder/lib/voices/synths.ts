/**
 * The pitched engines.
 *
 * Six of them, and every one is built from a real instrument's mechanism rather
 * than from "an oscillator with an envelope": a plucked string is a delay line
 * fed with noise, a pad is a detuned stack spread across the stereo field and run
 * through a chorus, a bell is frequency modulation, brass is a filter opening
 * under a lip. That is what makes them read as instruments instead of as presets.
 *
 * They also know the chord. `voicing` arrives already worked out by the harmony,
 * so a stab plays the chord that is under it rather than the minor triad someone
 * hard-coded once, and a pad follows the progression without being told about it.
 */

import { midiToFreq } from "@/lib/song-builder/harmony";
import { clamp } from "../format";
import { detuneAt, noiseSource, num, panned, percussive, shaped, spread, type Voice } from "./env";

/**
 * Karplus-Strong, rendered once into a buffer.
 *
 * A plucked string is a burst of noise circulating in a delay line that loses a
 * little of its top end each time round - that is the actual physics, and it is
 * why it sounds like a string when six sawtooths do not. It cannot be built out
 * of live `DelayNode`s, because a delay inside a feedback loop is clamped to a
 * whole render quantum and every note below ~340 Hz would come out flat. So the
 * string is computed straight into an `AudioBuffer` at one reference pitch and
 * played back at a rate - which also makes high notes decay faster than low ones,
 * exactly as real strings do.
 */
const REF_HZ = 196;
const strings = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

function stringBuffer(ctx: BaseAudioContext, decay: number, colour: number) {
  const key = `${decay.toFixed(2)}:${colour.toFixed(2)}`;
  const cache = strings.get(ctx) ?? new Map<string, AudioBuffer>();
  strings.set(ctx, cache);
  const cached = cache.get(key);
  if (cached) return cached;

  const rate = ctx.sampleRate;
  const period = Math.round(rate / REF_HZ);
  const length = Math.ceil(rate * Math.min(4, decay * 1.4));
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);

  // Loss per round trip, solved so the string is 60 dB down after `decay`.
  const loss = 10 ** ((-3 * period) / (rate * decay));

  // The pick: noise, softened by a one-pole filter. A hard pick is bright noise,
  // a thumb is dark noise - it is the same string either way.
  //
  // It fills one sample more than a period, because the loop below averages each
  // sample with the one before it and would otherwise read off the front of the
  // array on its first pass. That read is `undefined`, not zero, so the string
  // fills with NaN and the whole mix goes silent - it is worth the extra sample.
  let state = 0;
  const soften = clamp(colour, 0.05, 1);
  for (let i = 0; i <= period; i += 1) {
    state += soften * (Math.random() * 2 - 1 - state);
    data[i] = state;
  }

  for (let i = period + 1; i < length; i += 1) {
    data[i] = loss * 0.5 * (data[i - period] + data[i - period - 1]);
  }

  // Fade the tail out, or the buffer ends on a discontinuity and clicks.
  const fade = Math.min(2000, Math.floor(length * 0.05));
  for (let i = 0; i < fade; i += 1) data[length - 1 - i] *= i / fade;

  cache.set(key, buffer);
  return buffer;
}

/** A plucked string: guitars, harps, kalimbas, pianos - anything struck once. */
const pluck: Voice = ({ ctx, out, time, velocity, note, width, stepSeconds }, config) => {
  const decay = num(config, "decay", 1.6);
  const cutoff = num(config, "cutoff", 3400);
  const buffer = stringBuffer(ctx, decay, num(config, "colour", 0.5));
  const hold = clamp(stepSeconds * num(config, "hold", 4), 0.12, decay);

  const amp = ctx.createGain();
  const end = shaped(amp.gain, time, velocity * 0.5, 0.004, hold, 0.09);

  // Velocity opens the tone: hit a string harder and you get more of it, which
  // no amount of extra gain can imitate.
  const body = ctx.createBiquadFilter();
  body.type = "lowpass";
  body.Q.value = 0.9;
  body.frequency.setValueAtTime(cutoff * (0.45 + velocity), time);
  body.frequency.exponentialRampToValueAtTime(Math.max(400, cutoff * 0.35), end);
  body.connect(amp);
  amp.connect(out);

  // A doubled part, panned apart, is how a record makes one guitar sound big.
  const copies: number[] = width > 0.02 ? [-1, 1] : [0];
  copies.forEach((side, index) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = (midiToFreq(note) / REF_HZ) * 2 ** ((side * 5) / 1200);
    source.connect(panned(ctx, body, spread(index, copies.length, width)));
    source.start(time);
    source.stop(end);
  });
};

/**
 * Bass. A sine for the weight, an octave below it for the phone speakers, and a
 * filtered saw on top for the part you actually hear on a laptop - which is how
 * every bass patch worth using has been built since samplers existed.
 */
const sub: Voice = ({ ctx, out, time, velocity, note, stepSeconds }, config) => {
  const freq = midiToFreq(note);
  const hold = clamp(stepSeconds * num(config, "hold", 2.4), 0.08, 1.2);

  const amp = ctx.createGain();
  const end = shaped(amp.gain, time, velocity * 0.85, 0.008, hold, num(config, "decay", 0.12));
  amp.connect(out);

  const glide = num(config, "glide", 0);
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(freq * (glide > 0 ? 0.6 : 1), time);
  if (glide > 0) body.frequency.exponentialRampToValueAtTime(freq, time + glide);
  body.connect(amp);
  body.start(time);
  body.stop(end);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 3;
  const open = num(config, "cutoff", 600) * (0.5 + velocity);
  filter.frequency.setValueAtTime(open, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, open * 0.3), time + hold);
  const edge = ctx.createGain();
  edge.gain.value = num(config, "edge", 0.3);
  filter.connect(edge);
  edge.connect(amp);

  const growl = ctx.createOscillator();
  growl.type = "sawtooth";
  growl.frequency.value = freq;
  growl.connect(filter);
  growl.start(time);
  growl.stop(end);
};

/** A stack of detuned saws, spread. The building block of stabs, pads and brass. */
function stack(args: {
  ctx: BaseAudioContext;
  into: AudioNode;
  time: number;
  end: number;
  freq: number;
  type: OscillatorType;
  count: number;
  detune: number;
  width: number;
}) {
  for (let i = 0; i < args.count; i += 1) {
    const osc = args.ctx.createOscillator();
    osc.type = args.type;
    osc.frequency.value = args.freq;
    osc.detune.value = detuneAt(i, args.count, args.detune);
    osc.connect(panned(args.ctx, args.into, spread(i, args.count, args.width)));
    osc.start(args.time);
    osc.stop(args.end);
  }
}

/** Chord stabs - the whole chord, strummed, cut short to sit in the gaps. */
const stab: Voice = ({ ctx, out, time, velocity, voicing, width, stepSeconds }, config) => {
  const hold = clamp(stepSeconds * num(config, "hold", 1.2), 0.05, 0.5);
  const amp = ctx.createGain();
  const end = shaped(amp.gain, time, velocity * 0.34, 0.006, hold, num(config, "decay", 0.14));
  amp.connect(out);

  const cutoff = num(config, "cutoff", 2400);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2.5;
  // A filter that opens and shuts inside one note is what a stab is.
  filter.frequency.setValueAtTime(cutoff * 0.5, time);
  filter.frequency.exponentialRampToValueAtTime(cutoff * (0.8 + velocity), time + 0.02);
  filter.frequency.exponentialRampToValueAtTime(Math.max(300, cutoff * 0.4), end);
  filter.connect(amp);

  const strum = num(config, "strum", 0.012);
  voicing.forEach((note, index) => {
    stack({
      ctx,
      into: filter,
      time: time + index * strum,
      end,
      freq: midiToFreq(note),
      type: "sawtooth",
      count: 2,
      detune: num(config, "detune", 11),
      // The chord is spread across the field, low notes left to high notes right.
      width: width * 0.6,
    });
  });
};

/**
 * Pads and strings: the chord, held, with a chorus behind it.
 *
 * Two short modulated delays either side of centre - that is all a chorus is,
 * and it is the difference between a synth chord and a section. Without it a
 * held stack of saws is unmistakably one synthesiser.
 */
const pad: Voice = ({ ctx, out, time, velocity, voicing, width, stepSeconds }, config) => {
  const hold = clamp(stepSeconds * num(config, "hold", 4), 0.15, 1.4);
  const attack = num(config, "attack", 0.06);
  const amp = ctx.createGain();
  const end = shaped(amp.gain, time, velocity * 0.2, attack, hold, num(config, "release", 0.6));
  amp.connect(out);

  const cutoff = num(config, "cutoff", 2000);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1.6;
  filter.frequency.setValueAtTime(cutoff * 0.35, time);
  filter.frequency.linearRampToValueAtTime(cutoff * (0.6 + velocity * 0.6), time + attack + hold * 0.5);
  filter.connect(amp);

  if (width > 0.02) {
    for (const side of [-1, 1]) {
      const delay = ctx.createDelay(0.05);
      delay.delayTime.value = 0.012 + side * 0.004;
      const sweep = ctx.createOscillator();
      sweep.frequency.value = 0.24 + side * 0.07;
      const depth = ctx.createGain();
      depth.gain.value = 0.0035;
      sweep.connect(depth);
      depth.connect(delay.delayTime);
      sweep.start(time);
      sweep.stop(end);
      filter.connect(delay);
      delay.connect(panned(ctx, amp, side * width));
    }
  }

  for (const note of voicing) {
    stack({
      ctx,
      into: filter,
      time,
      end,
      freq: midiToFreq(note),
      type: "sawtooth",
      count: 3,
      detune: num(config, "spread", 12),
      width,
    });
  }
};

/**
 * A bell, by frequency modulation - two sines, one bending the other, with the
 * amount of bend falling away faster than the note does. Every metallic sound
 * that is not noise is this, and it is four nodes.
 */
const bell: Voice = ({ ctx, out, time, velocity, note, width, stepSeconds }, config) => {
  const freq = midiToFreq(note);
  const decay = num(config, "decay", 0.9);
  const amp = ctx.createGain();
  const end = shaped(amp.gain, time, velocity * 0.3, 0.003, clamp(stepSeconds, 0.05, 0.2), decay);
  amp.connect(panned(ctx, out, 0));

  const carrier = ctx.createOscillator();
  carrier.type = "sine";
  carrier.frequency.value = freq;
  carrier.connect(amp);
  carrier.start(time);
  carrier.stop(end);

  const modulator = ctx.createOscillator();
  modulator.type = "sine";
  // A non-integer ratio is what makes it a bell rather than an organ.
  modulator.frequency.value = freq * num(config, "ratio", 2.76);
  const index = ctx.createGain();
  percussive(index.gain, time, freq * num(config, "index", 1.6) * velocity, decay * 0.35);
  modulator.connect(index);
  index.connect(carrier.frequency);
  modulator.start(time);
  modulator.stop(end);

  // A quiet octave above, panned off centre, is the shimmer on a real mallet.
  if (width > 0.02) {
    const shimmer = ctx.createGain();
    percussive(shimmer.gain, time, velocity * 0.08, decay * 0.5);
    const high = ctx.createOscillator();
    high.type = "sine";
    high.frequency.value = freq * 2.01;
    high.connect(shimmer);
    shimmer.connect(panned(ctx, out, width * 0.5));
    high.start(time);
    high.stop(end);
  }
};

/**
 * Brass. A section is not a waveform, it is a behaviour: the filter opens as the
 * player leans in, the pitch settles from slightly under, and the vibrato only
 * arrives once the note has been held. All three are envelopes, not oscillators.
 */
const brass: Voice = ({ ctx, out, time, velocity, note, width, stepSeconds }, config) => {
  const freq = midiToFreq(note);
  const hold = clamp(stepSeconds * num(config, "hold", 3), 0.12, 0.9);
  const attack = num(config, "attack", 0.045);

  const amp = ctx.createGain();
  const end = shaped(amp.gain, time, velocity * 0.26, attack, hold, num(config, "release", 0.18));
  amp.connect(out);

  const cutoff = num(config, "cutoff", 2600);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(cutoff * 0.3, time);
  filter.frequency.exponentialRampToValueAtTime(cutoff * (0.7 + velocity * 0.7), time + attack * 1.6);
  filter.frequency.exponentialRampToValueAtTime(Math.max(500, cutoff * 0.5), end);

  // The formant that makes a saw stack read as a horn rather than as a string.
  const horn = ctx.createBiquadFilter();
  horn.type = "peaking";
  horn.frequency.value = 1150;
  horn.Q.value = 1.4;
  horn.gain.value = 6;
  filter.connect(horn);
  horn.connect(amp);

  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 5.2;
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, time);
  depth.gain.setValueAtTime(0, time + attack + hold * 0.35);
  depth.gain.linearRampToValueAtTime(num(config, "vibrato", 5), end);
  vibrato.connect(depth);
  vibrato.start(time);
  vibrato.stop(end);

  const air = ctx.createGain();
  percussive(air.gain, time, velocity * 0.05, attack * 1.4);
  noiseSource(ctx, time, attack * 1.5).connect(air);
  air.connect(filter);

  const count = 3;
  for (let i = 0; i < count; i += 1) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 0.994, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + attack * 0.8);
    osc.detune.value = detuneAt(i, count, num(config, "detune", 9));
    depth.connect(osc.detune);
    osc.connect(panned(ctx, filter, spread(i, count, width)));
    osc.start(time);
    osc.stop(end);
  }
};

export const SYNTHS = { pluck, sub, stab, pad, bell, brass };
