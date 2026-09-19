/**
 * The harmony the whole band obeys.
 *
 * This is the file that decides whether ten rows are a song or ten people in a
 * room. Every pitched hit used to map its own brightness onto its own scale
 * degree, independently, which is a guaranteed way to have the bass, the keys
 * and the strings land a semitone apart. Here a style pack carries a chord
 * progression instead, the loop is divided evenly between its chords, and a hit
 * is placed inside the chord that is sounding underneath it.
 *
 * Brightness still decides the contour - hum higher and you get a higher note -
 * but what it indexes is a ladder built from the chord, so the contour cannot
 * leave the key. Pure and dependency-free: this is the model, not the studio.
 */

import { STEPS, type Chord, type HarmonyRole, type ScaleName } from "./types";

/** Semitone offsets from the tonic, one octave of each scale. */
const SCALE_STEPS: Record<ScaleName, readonly number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  pentatonic: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};

/** Semitones above a chord's own root. Extensions are listed in playing order. */
const CHORD_INTERVALS: Record<string, readonly number[]> = {
  min: [0, 3, 7],
  maj: [0, 4, 7],
  min7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dom7: [0, 4, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  min9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
};

export function midiToFreq(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

/** The nth degree of `scale` above `root`, wrapping into higher octaves. */
export function scaleNote(root: number, scale: ScaleName, degree: number) {
  const steps = SCALE_STEPS[scale];
  const octave = Math.floor(degree / steps.length);
  const index = ((degree % steps.length) + steps.length) % steps.length;
  return root + octave * 12 + steps[index];
}

/**
 * Which chord is sounding at a step. The loop is split evenly, so a two-chord
 * progression changes at the halfway bar and a four-chord one every bar.
 */
export function chordAt(progression: Chord[], step: number): Chord {
  if (!progression.length) return { degree: 0, type: "min" };
  const slice = STEPS / progression.length;
  return progression[Math.min(progression.length - 1, Math.floor(step / slice))];
}

/** The MIDI notes of one chord, in root position, from the pack's root. */
export function chordTones(chord: Chord, root: number, scale: ScaleName): number[] {
  const base = scaleNote(root, scale, chord.degree);
  return (CHORD_INTERVALS[chord.type] ?? CHORD_INTERVALS.min).map((interval) => base + interval);
}

/**
 * What a stab or a pad actually plays: the chord, voiced so the top note sits
 * near `around` rather than wherever the root position happened to leave it.
 * Voice leading in one line - it is why a progression stops jumping octaves
 * between chords.
 */
export function chordVoicing(chord: Chord, root: number, scale: ScaleName, around: number): number[] {
  const tones = chordTones(chord, root, scale);
  const shift = Math.round((around - tones[0]) / 12) * 12;
  return tones.map((note) => note + shift);
}

/** Turns brightness into a rung of a ladder. `span` rungs, evenly spaced. */
function rung(tone: number, span: number) {
  return Math.max(0, Math.min(span - 1, Math.round(tone * (span - 1))));
}

/** Repeats a set of intervals up the octaves until the ladder is `span` long. */
function ladder(base: number, intervals: readonly number[], span: number): number[] {
  return Array.from(
    { length: span },
    (_, i) => base + intervals[i % intervals.length] + 12 * Math.floor(i / intervals.length),
  );
}

/** Pulls a note onto the nearest member of the chord, searching outwards. */
function snapToChord(note: number, tones: number[]): number {
  const classes = new Set(tones.map((tone) => ((tone % 12) + 12) % 12));
  for (const offset of [0, -1, 1, -2, 2]) {
    if (classes.has((((note + offset) % 12) + 12) % 12)) return note + offset;
  }
  return note;
}

/**
 * The note one hit plays.
 *
 * Three rules, one per role, and the role is a field on the sound - so which
 * rule applies is a database edit, not a branch someone has to remember:
 *
 * - **root** — the bass. Root, fifth, octave. Nothing else belongs down there,
 *   and a bass wandering onto a third is the single fastest way to sound amateur.
 * - **chord** — keys, pads, brass, strings. Any tone of the chord, in the
 *   register the sound's `transpose` puts it in. Always consonant by construction.
 * - **lead** — the melodic rows. Free to walk the scale, but pulled onto a chord
 *   tone on the downbeats, which is the rule that makes a hummed line sound
 *   composed rather than sampled.
 */
export function noteFor(args: {
  tone: number;
  step: number;
  root: number;
  scale: ScaleName;
  chord: Chord;
  role: HarmonyRole;
  /** Semitones the sound sits above the pack's root. */
  transpose: number;
}): number {
  const { tone, step, scale, chord, role, transpose } = args;
  const root = args.root + transpose;
  const tones = chordTones(chord, root, scale);

  if (role === "root") {
    // Root - fifth - octave, which is what a bass line is made of.
    return tones[0] + [0, 0, 7, 12][rung(tone, 4)];
  }

  if (role === "chord") {
    const intervals = tones.map((note) => note - tones[0]);
    return ladder(tones[0], intervals, 8)[rung(tone, 8)];
  }

  const walked = scaleNote(root, scale, rung(tone, 10));
  // Chord tones on the beat, passing tones between them.
  return step % 4 === 0 ? snapToChord(walked, tones) : walked;
}
