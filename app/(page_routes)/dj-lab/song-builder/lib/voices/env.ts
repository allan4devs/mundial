/**
 * The plumbing every voice shares: envelopes, noise, and a place to stand in the
 * stereo field.
 *
 * A voice builds a throwaway graph for one note and schedules its own stop.
 * Nothing here holds state between notes, and nothing here knows about
 * amplifiers, equalisation or sends - that is the row's channel strip.
 */

import type { DrumPiece } from "@/lib/song-builder/types";
import { noiseBuffer } from "../dsp";

/** Everything one note needs, already resolved against the song's harmony. */
export type VoiceArgs = {
  ctx: BaseAudioContext;
  /** Where the note lands - the row's channel strip. */
  out: AudioNode;
  /** `ctx.currentTime`-based start, always slightly in the future. */
  time: number;
  /** Decoded loudness, 0..1. */
  velocity: number;
  /** Decoded brightness, 0..1. The kit reads it as a piece; the rest as contour. */
  tone: number;
  /** The MIDI note the harmony chose for this hit. The kit ignores it. */
  note: number;
  /** The chord sounding under this step, voiced around `note`. Chordal voices play it whole. */
  voicing: number[];
  /** Which pieces the kit may fire, dark to bright. */
  pieces: DrumPiece[];
  /** How far this row's unison copies spread across the stereo field, 0..1. */
  width: number;
  /** One sixteenth at the current tempo - voices scale their decay to it. */
  stepSeconds: number;
};

/** `config` is whatever the sound document carried; missing keys fall back. */
export type Voice = (args: VoiceArgs, config: Record<string, number>) => void;

/** Reads one tuning knob out of a sound's config bag. */
export function num(config: Record<string, number>, key: string, fallback: number) {
  const value = config[key];
  return Number.isFinite(value) ? value : fallback;
}

/**
 * A percussive envelope: a real attack, then exponential decay to silence.
 *
 * The attack is four milliseconds rather than zero on purpose. A gain step from
 * nothing to full is a click, and a mix full of clicks is the single loudest
 * tell that a track was made in a browser.
 */
export function percussive(param: AudioParam, time: number, peak: number, decay: number) {
  const end = time + decay;
  const top = Math.max(0.0002, peak);
  param.setValueAtTime(0.0001, time);
  param.exponentialRampToValueAtTime(top, time + 0.004);
  param.exponentialRampToValueAtTime(0.0001, end);
  param.setValueAtTime(0, end);
  return end;
}

/** A held envelope: attack, sustain, release. What pads and brass are made of. */
export function shaped(
  param: AudioParam,
  time: number,
  peak: number,
  attack: number,
  hold: number,
  release: number,
) {
  const end = time + attack + hold + release;
  const top = Math.max(0.0002, peak);
  param.setValueAtTime(0.0001, time);
  param.exponentialRampToValueAtTime(top, time + attack);
  param.setValueAtTime(top, time + attack + hold);
  param.exponentialRampToValueAtTime(0.0001, end);
  param.setValueAtTime(0, end);
  return end;
}

/** A slice of the shared noise buffer, started at a random offset so hits differ. */
export function noiseSource(ctx: BaseAudioContext, time: number, duration: number) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.loop = true;
  // Every snare firing the same 256 samples of noise is a flam you can hear.
  source.loopStart = Math.random() * 1.5;
  source.loopEnd = source.loopStart + 0.4;
  source.start(time, source.loopStart);
  source.stop(time + duration + 0.02);
  return source;
}

/** A node that lands at one point in the stereo field. */
export function panned(ctx: BaseAudioContext, out: AudioNode, pan: number) {
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  panner.connect(out);
  return panner;
}

/**
 * Where the nth of `count` unison voices stands.
 *
 * Detuned copies stacked in the centre are just a thicker mono sound. Spread
 * across the field they become the width that separates a synth patch from a
 * synth sound - and an odd count keeps one voice dead centre, so the note still
 * has a middle.
 */
export function spread(index: number, count: number, width: number) {
  return count < 2 ? 0 : ((index / (count - 1)) * 2 - 1) * width;
}

/** Detune in cents for the nth of `count` unison voices, centred on zero. */
export function detuneAt(index: number, count: number, cents: number) {
  return count < 2 ? 0 : (index - (count - 1) / 2) * cents;
}
