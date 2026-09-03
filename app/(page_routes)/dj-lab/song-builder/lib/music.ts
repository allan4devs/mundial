/**
 * The bridge from a decoded hit to a pitch.
 *
 * A hit carries `tone` — how bright the vocalisation was, 0..1. Humming higher
 * should sound higher, so `tone` indexes into the song's scale. That mapping is
 * deliberately the dumbest thing that works: it is the first piece a trained
 * pitch model would replace.
 */

import type { ScaleName } from "@/lib/song-builder/types";
import { clamp } from "./format";

/** Semitone offsets from the root, one octave of each scale. */
export const SCALE_STEPS: Record<ScaleName, readonly number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  pentatonic: [0, 3, 5, 7, 10],
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export function midiToFreq(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

/** `45` -> `A2`. */
export function midiToName(note: number) {
  return `${NOTE_NAMES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`;
}

/**
 * Maps brightness onto `span` scale degrees above `root`, wrapping into octaves.
 * `span` of 8 covers a bit over an octave, which is the range a voice hums in.
 */
export function noteFromTone(tone: number, root: number, scale: ScaleName, span = 8) {
  const steps = SCALE_STEPS[scale];
  const degree = Math.round(clamp(tone, 0, 1) * (span - 1));
  return root + steps[degree % steps.length] + 12 * Math.floor(degree / steps.length);
}

