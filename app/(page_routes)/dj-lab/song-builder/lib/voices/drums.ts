/**
 * The drum machine.
 *
 * Fourteen pieces, each a table entry, each built the way that piece is actually
 * built rather than by re-tuning one generic hit: a kick is a pitch drop under a
 * beater click, a hat is six square waves through two filters, a clap is four
 * bursts of noise a few milliseconds apart. That is the whole reason a kit here
 * reads as a kit - one oscillator per drum is what a phone ringtone is made of.
 *
 * A `kit` sound names three of these and brightness picks between them, so
 * "Congas" is congas and "Shakers" is shakers, instead of both being a kick, a
 * snare and a hat with the tuning knob turned up.
 */

import type { DrumPiece } from "@/lib/song-builder/types";
import { noiseSource, percussive } from "./env";

export type PieceArgs = {
  ctx: BaseAudioContext;
  out: AudioNode;
  time: number;
  /** Decoded loudness, 0..1. */
  velocity: number;
  /** Pitch multiplier from the sound's config - one kit tuned up is a different kit. */
  tune: number;
};

type Piece = (args: PieceArgs) => void;

/** A gain node with a percussive envelope already drawn on it. */
function hit({ ctx, out, time }: PieceArgs, peak: number, decay: number) {
  const amp = ctx.createGain();
  const end = percussive(amp.gain, time, peak, decay);
  amp.connect(out);
  return { amp, end };
}

function osc(ctx: BaseAudioContext, type: OscillatorType, freq: number, time: number, end: number) {
  const node = ctx.createOscillator();
  node.type = type;
  node.frequency.value = freq;
  node.start(time);
  node.stop(end);
  return node;
}

function filter(ctx: BaseAudioContext, type: BiquadFilterType, freq: number, q = 0.7) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = freq;
  node.Q.value = q;
  return node;
}

/**
 * A kick is three sounds at once: the beater hitting the skin, the skin's own
 * pitch dropping away, and the air in the shell. Leave out the beater and it
 * disappears the moment anything else plays; leave out the drop and it is a beep.
 */
const kick: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.95, 0.4);

  const body = osc(ctx, "sine", 130 * tune, time, end);
  body.frequency.setValueAtTime(130 * tune, time);
  body.frequency.exponentialRampToValueAtTime(44 * tune, time + 0.075);
  body.connect(amp);

  const beater = ctx.createGain();
  percussive(beater.gain, time, velocity * 0.5, 0.014);
  osc(ctx, "triangle", 620 * tune, time, time + 0.02).connect(beater);
  beater.connect(args.out);

  const air = ctx.createGain();
  percussive(air.gain, time, velocity * 0.16, 0.01);
  const top = filter(ctx, "highpass", 2600);
  noiseSource(ctx, time, 0.014).connect(top);
  top.connect(air);
  air.connect(args.out);
};

/** The long one. A sub that holds is a bass line, which is why it gets a glide. */
const sub808: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.9, 0.85);
  const base = 48 * tune;

  const body = osc(ctx, "sine", base, time, end);
  body.frequency.setValueAtTime(base * 1.9, time);
  body.frequency.exponentialRampToValueAtTime(base, time + 0.07);
  body.connect(amp);

  // A sine at 48 Hz is inaudible on a laptop. The second harmonic is what makes
  // an 808 survive a phone speaker, and it is why records put one there.
  const harmonic = ctx.createGain();
  percussive(harmonic.gain, time, velocity * 0.22, 0.3);
  osc(ctx, "triangle", base * 2, time, time + 0.35).connect(harmonic);
  harmonic.connect(args.out);
};

const snare: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.62, 0.2);

  // The wires under the drum.
  const wires = filter(ctx, "highpass", 1400 + velocity * 700);
  noiseSource(ctx, time, 0.2).connect(wires);
  wires.connect(amp);

  // The crack, which is a separate, much shorter sound in the same instant.
  const crack = ctx.createGain();
  percussive(crack.gain, time, velocity * 0.4, 0.055);
  const edge = filter(ctx, "bandpass", 3900, 1);
  noiseSource(ctx, time, 0.06).connect(edge);
  edge.connect(crack);
  crack.connect(args.out);

  const shell = ctx.createGain();
  percussive(shell.gain, time, velocity * 0.4, 0.12);
  const body = osc(ctx, "triangle", 190 * tune, time, end);
  body.frequency.exponentialRampToValueAtTime(148 * tune, time + 0.07);
  body.connect(shell);
  shell.connect(args.out);
};

/** Four hands, not one. The stagger is the entire sound of a clap. */
const clap: Piece = (args) => {
  const { ctx, time, velocity } = args;
  const band = filter(ctx, "bandpass", 1550, 1.2);
  band.connect(args.out);

  [0, 0.011, 0.023, 0.037].forEach((offset, index) => {
    const last = index === 3;
    const amp = ctx.createGain();
    percussive(amp.gain, time + offset, velocity * (last ? 0.55 : 0.7), last ? 0.17 : 0.026);
    noiseSource(ctx, time + offset, last ? 0.18 : 0.03).connect(amp);
    amp.connect(band);
  });
};

const rim: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.5, 0.055);
  const body = osc(ctx, "triangle", 1700 * tune, time, end);
  body.frequency.exponentialRampToValueAtTime(760 * tune, time + 0.03);
  body.connect(amp);
};

const tom: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.72, 0.38);
  const body = osc(ctx, "sine", 220 * tune, time, end);
  body.frequency.exponentialRampToValueAtTime(118 * tune, time + 0.2);
  body.connect(amp);

  const stick = ctx.createGain();
  percussive(stick.gain, time, velocity * 0.18, 0.012);
  const top = filter(ctx, "highpass", 1800);
  noiseSource(ctx, time, 0.015).connect(top);
  top.connect(stick);
  stick.connect(args.out);
};

/** A hand drum: high, tight, and mostly slap. */
const conga: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.6, 0.24);
  const body = osc(ctx, "sine", 400 * tune, time, end);
  body.frequency.exponentialRampToValueAtTime(330 * tune, time + 0.05);
  body.connect(amp);

  const slap = ctx.createGain();
  percussive(slap.gain, time, velocity * 0.25, 0.02);
  const band = filter(ctx, "bandpass", 2200, 1.4);
  noiseSource(ctx, time, 0.025).connect(band);
  band.connect(slap);
  slap.connect(args.out);
};

/**
 * Six square waves at inharmonic ratios through a pair of filters - the 808's
 * hat, and still the reason a synthesised hat sounds like metal instead of like
 * a hiss. Filtered white noise is the version everyone tries first and it is
 * always wrong: noise has no partials, so it has no ring.
 */
const RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21];

function metal(args: PieceArgs, decay: number, peak: number) {
  const { ctx, time, tune } = args;
  const { amp, end } = hit(args, peak, decay);

  const bright = filter(ctx, "bandpass", 10000, 0.8);
  const cut = filter(ctx, "highpass", 7000 + args.velocity * 1200);
  bright.connect(cut);
  cut.connect(amp);

  for (const ratio of RATIOS) osc(ctx, "square", 40 * ratio * tune, time, end).connect(bright);
}

const hat: Piece = (args) => metal(args, 0.05, args.velocity * 0.32);
const openHat: Piece = (args) => metal(args, 0.34, args.velocity * 0.26);

/**
 * A shaker is the one percussion instrument with no transient - it is beads
 * accelerating, so the envelope goes up before it comes down. Give it an instant
 * attack and it turns into a hat.
 */
const shaker: Piece = (args) => {
  const { ctx, time, velocity } = args;
  const amp = ctx.createGain();
  const end = time + 0.1;
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.linearRampToValueAtTime(velocity * 0.34, time + 0.014);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  amp.gain.setValueAtTime(0, end);

  const band = filter(ctx, "bandpass", 7200, 1.6);
  noiseSource(ctx, time, 0.11).connect(band);
  band.connect(amp);
  amp.connect(args.out);
};

const tamb: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.34, 0.16);
  const top = filter(ctx, "highpass", 5600);
  noiseSource(ctx, time, 0.17).connect(top);
  top.connect(amp);

  // The jingles keep ringing after the shell has stopped.
  const ring = ctx.createGain();
  percussive(ring.gain, time, velocity * 0.1, 0.22);
  const band = filter(ctx, "bandpass", 8200 * tune, 4);
  for (const ratio of [1, 1.41, 1.87]) osc(ctx, "square", 5200 * ratio * tune, time, time + 0.24).connect(band);
  band.connect(ring);
  ring.connect(args.out);
};

const cowbell: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.4, 0.3);
  const band = filter(ctx, "bandpass", 2400, 1.1);
  band.connect(amp);
  // Two squares a not-quite-consonant interval apart. That clash is the cowbell.
  osc(ctx, "square", 540 * tune, time, end).connect(band);
  osc(ctx, "square", 800 * tune, time, end).connect(band);
};

const block: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.45, 0.05);
  const band = filter(ctx, "bandpass", 1400 * tune, 6);
  osc(ctx, "triangle", 1050 * tune, time, end).connect(band);
  osc(ctx, "square", 2100 * tune, time, time + 0.012).connect(band);
  band.connect(amp);
};

const triangle: Piece = (args) => {
  const { ctx, time, velocity, tune } = args;
  const { amp, end } = hit(args, velocity * 0.18, 1.3);
  for (const freq of [5300, 7350, 9100]) osc(ctx, "sine", freq * tune, time, end).connect(amp);
};

export const PIECES: Record<DrumPiece, Piece> = {
  kick,
  sub808,
  snare,
  clap,
  rim,
  tom,
  conga,
  hat,
  openHat,
  shaker,
  tamb,
  cowbell,
  block,
  triangle,
};
