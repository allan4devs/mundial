/**
 * The sound registry, in Mongo.
 *
 * One document per style. Picking "rock" fetches that document and every row's
 * selector is repopulated from it - so adding a sound, retuning an amplifier,
 * moving a row in the stereo field or rewriting the chord progression is a
 * database edit, not a deploy.
 *
 * A style is four things: what it plays (the sounds), what key and chords it
 * plays them over (`root`, `scale`, `progression`), how it sits behind the beat
 * (`swing`), and what room it is in (`space`). All four are data, which is why
 * "make it sound like a record" is a thing you can do to a document.
 *
 * `normalizeStylePack` is deliberately forgiving: these documents are meant to be
 * edited by hand, and a typo should cost one clamped number, not the whole style.
 */

import type { Collection } from "mongodb";

import { COLLECTIONS } from "@/lib/constants/db";
import { getDb } from "@/lib/helpers/mongodb";
import {
  CHORD_TYPES,
  DRUM_PIECES,
  HARMONY_ROLES,
  MAX_BPM,
  MIN_BPM,
  SCALES,
  STYLES,
  TRACK_KINDS,
  VOICE_IDS,
  type Chord,
  type ChordType,
  type DrumPiece,
  type HarmonyRole,
  type Mix,
  type ScaleName,
  type Sound,
  type Space,
  type Style,
  type StylePack,
  type TrackKind,
  type VoiceId,
} from "./types";

/** Bumped when `SEED` changes shape. Older stored documents are replaced. */
const SEED_VERSION = 2;

/**
 * How each row reads the chord under it.
 *
 * The bass gets roots and fifths, the melodic rows walk the scale, and the
 * chordal rows play the chord. Every one of these is a default a sound may
 * override, and almost none of them ever need to.
 */
const ROLE: Record<TrackKind, HarmonyRole> = {
  guitarLead: "lead",
  bass: "root",
  drums: "chord",
  guitarFill: "chord",
  synth: "chord",
  keys: "lead",
  brass: "chord",
  strings: "chord",
  arp: "lead",
  perc: "chord",
};

/**
 * Where each row lives in the mix.
 *
 * This is the seating plan, and it is the reason ten rows do not turn to mud:
 * the bass and the kick hold the centre dry, the guitars sit either side of
 * them, the strings are wide and far back, the arp is furthest right and gets
 * the delay. `duck` is how far each one drops under a kick - a lot for anything
 * sharing the low end, none at all for the drums themselves.
 */
const PLACE: Record<TrackKind, Mix> = {
  guitarLead: { pan: -0.3, width: 0.55, reverb: 0.2, delay: 0.16, duck: 0.18 },
  bass: { pan: 0, width: 0, reverb: 0.02, delay: 0, duck: 0.55 },
  drums: { pan: 0, width: 0.3, reverb: 0.12, delay: 0, duck: 0 },
  guitarFill: { pan: 0.36, width: 0.5, reverb: 0.18, delay: 0.2, duck: 0.24 },
  synth: { pan: 0.18, width: 0.8, reverb: 0.28, delay: 0.12, duck: 0.4 },
  keys: { pan: -0.17, width: 0.4, reverb: 0.18, delay: 0.1, duck: 0.28 },
  brass: { pan: 0.26, width: 0.42, reverb: 0.22, delay: 0.08, duck: 0.24 },
  strings: { pan: -0.32, width: 0.9, reverb: 0.44, delay: 0.04, duck: 0.34 },
  arp: { pan: 0.44, width: 0.7, reverb: 0.28, delay: 0.34, duck: 0.3 },
  perc: { pan: -0.46, width: 0.5, reverb: 0.2, delay: 0.12, duck: 0.12 },
};

type Extra = Partial<Pick<Sound, "harmony" | "pieces">> & { mix?: Partial<Mix> };

/**
 * Compact constructor so each seeded sound reads as one line. The harmony role
 * and the mix position come from the row unless the sound says otherwise, which
 * is what keeps a hundred and twenty entries down to the part that differs.
 */
function sound(
  id: string,
  kind: TrackKind,
  label: string,
  voice: VoiceId,
  transpose: number,
  config: Record<string, number>,
  [drive, level]: [number, number],
  [low, mid, high]: [number, number, number],
  extra: Extra = {},
): Sound {
  return {
    id,
    kind,
    label,
    voice,
    transpose,
    harmony: extra.harmony ?? ROLE[kind],
    pieces: extra.pieces ?? [],
    config,
    amp: { drive, level },
    eq: { low, mid, high },
    mix: { ...PLACE[kind], ...extra.mix },
  };
}

/** A drum sound: the three pieces brightness chooses between, dark to bright. */
const drums = (pieces: DrumPiece[]): Extra => ({ pieces });

const SEED: StylePack[] = [
  {
    style: "groovy",
    label: "Groovy",
    version: SEED_VERSION,
    root: 45,
    scale: "minor",
    bpm: 100,
    // Am7 - D7 - Am7 - Em7. The dominant on the fourth degree is the whole
    // reason funk sounds like funk rather than like a minor key.
    progression: [
      { degree: 0, type: "min7" },
      { degree: 3, type: "dom7" },
      { degree: 0, type: "min7" },
      { degree: 4, type: "min7" },
    ],
    swing: 0.17,
    space: { size: 1.1, damp: 0.55, wet: 0.3, delaySteps: 3, feedback: 0.3 },
    sounds: [
      sound("wah-lead", "guitarLead", "Wah lead", "pluck", 24, { decay: 1.3, cutoff: 3000, colour: 0.75, hold: 3 }, [0.35, 0.72], [-3, 7, 2]),
      sound("clean-funk", "guitarLead", "Clean funk", "pluck", 24, { decay: 0.7, cutoff: 4400, colour: 0.9, hold: 1.5 }, [0.05, 0.78], [-4, 0, 5]),
      sound("octave-lead", "guitarLead", "Octave lead", "pluck", 24, { decay: 2.2, cutoff: 5200, colour: 0.6, hold: 5 }, [0.2, 0.7], [-5, 2, 6]),
      sound("phaser-lead", "guitarLead", "Phaser lead", "pluck", 24, { decay: 1.8, cutoff: 2400, colour: 0.4, hold: 4 }, [0.45, 0.66], [-2, 5, 1]),
      sound("finger-bass", "bass", "Finger bass", "sub", 0, { hold: 2.4, decay: 0.14, cutoff: 520, edge: 0.28, glide: 0 }, [0.1, 0.92], [4, -1, -6]),
      sound("envelope-bass", "bass", "Envelope bass", "sub", 0, { hold: 1.8, decay: 0.1, cutoff: 1100, edge: 0.55, glide: 0 }, [0.3, 0.88], [2, 3, -2]),
      sound("slap-bass", "bass", "Slap bass", "sub", 0, { hold: 1.2, decay: 0.08, cutoff: 1600, edge: 0.7, glide: 0 }, [0.5, 0.84], [1, 6, -1]),
      sound("round-sub", "bass", "Round sub", "sub", 0, { hold: 3.4, decay: 0.2, cutoff: 260, edge: 0.06, glide: 0.05 }, [0.05, 0.95], [6, -3, -9]),
      sound("tight-kit", "drums", "Tight kit", "kit", 0, { tune: 1.1 }, [0.15, 0.9], [1, 0, 4], drums(["kick", "snare", "hat"])),
      sound("room-kit", "drums", "Room kit", "kit", 0, { tune: 0.95 }, [0.25, 0.85], [4, -2, 1], drums(["kick", "snare", "openHat"])),
      sound("brush-kit", "drums", "Brush kit", "kit", 0, { tune: 1.05 }, [0.08, 0.82], [0, 1, 5], drums(["kick", "rim", "shaker"])),
      sound("disco-kit", "drums", "Disco kit", "kit", 0, { tune: 1.2 }, [0.2, 0.88], [3, -1, 5], drums(["kick", "clap", "openHat"])),
      sound("chank-stabs", "guitarFill", "Chank stabs", "stab", 12, { hold: 0.7, decay: 0.09, cutoff: 2100, detune: 9, strum: 0.008 }, [0.2, 0.62], [-6, 4, 3]),
      sound("muted-chops", "guitarFill", "Muted chops", "stab", 12, { hold: 0.45, decay: 0.06, cutoff: 1500, detune: 6, strum: 0.005 }, [0.35, 0.6], [-8, 5, 0]),
      sound("wah-chops", "guitarFill", "Wah chops", "stab", 12, { hold: 0.8, decay: 0.1, cutoff: 1800, detune: 14, strum: 0.01 }, [0.3, 0.6], [-7, 6, 2]),
      sound("octave-chank", "guitarFill", "Octave chank", "stab", 12, { hold: 1.1, decay: 0.14, cutoff: 2600, detune: 11, strum: 0.013 }, [0.15, 0.62], [-5, 3, 4]),
      sound("clav-pad", "synth", "Clav pad", "pad", 12, { hold: 2, attack: 0.02, release: 0.3, cutoff: 2600, spread: 8 }, [0.2, 0.66], [-4, 3, 2]),
      sound("rhodes-pad", "synth", "Rhodes pad", "pad", 12, { hold: 4, attack: 0.05, release: 0.8, cutoff: 1700, spread: 14 }, [0.05, 0.7], [2, 0, -2]),
      sound("bell-pad", "synth", "Bell pad", "pad", 12, { hold: 3, attack: 0.03, release: 0.6, cutoff: 3600, spread: 9 }, [0.05, 0.58], [-3, 1, 5]),
      sound("warm-poly", "synth", "Warm poly", "pad", 12, { hold: 5, attack: 0.12, release: 1, cutoff: 1400, spread: 18 }, [0.1, 0.58], [0, -2, 3]),
      sound("wurli", "keys", "Wurli", "pluck", 12, { decay: 1.6, cutoff: 2400, colour: 0.5, hold: 4 }, [0.12, 0.64], [-2, 4, 1]),
      sound("clav-keys", "keys", "Clav keys", "pluck", 12, { decay: 0.5, cutoff: 3400, colour: 0.95, hold: 1.2 }, [0.22, 0.6], [-4, 6, 2]),
      sound("grand-piano", "keys", "Grand piano", "pluck", 12, { decay: 2.6, cutoff: 4000, colour: 0.6, hold: 6 }, [0.05, 0.66], [0, 2, 3]),
      sound("toy-piano", "keys", "Toy piano", "bell", 12, { decay: 0.6, ratio: 3.4, index: 1.2 }, [0.08, 0.56], [-6, 3, 6]),
      sound("horn-section", "brass", "Horn section", "brass", 19, { hold: 2.4, attack: 0.05, release: 0.2, cutoff: 2600, detune: 11, vibrato: 6 }, [0.3, 0.6], [-6, 6, 2]),
      sound("muted-trumpet", "brass", "Muted trumpet", "brass", 19, { hold: 1.4, attack: 0.03, release: 0.12, cutoff: 3400, detune: 5, vibrato: 8 }, [0.2, 0.56], [-8, 5, 4]),
      sound("sax-stab", "brass", "Sax stab", "brass", 19, { hold: 3, attack: 0.06, release: 0.24, cutoff: 2000, detune: 8, vibrato: 10 }, [0.4, 0.58], [-4, 7, 0]),
      sound("big-band", "brass", "Big band", "brass", 19, { hold: 3.6, attack: 0.08, release: 0.3, cutoff: 2900, detune: 16, vibrato: 5 }, [0.35, 0.56], [-5, 6, 3]),
      sound("silk-strings", "strings", "Silk strings", "pad", 12, { hold: 6, attack: 0.22, release: 1.3, cutoff: 1600, spread: 22 }, [0.05, 0.54], [-2, -2, 3]),
      sound("staccato-strings", "strings", "Staccato strings", "pad", 12, { hold: 1, attack: 0.02, release: 0.16, cutoff: 2200, spread: 12 }, [0.1, 0.58], [-3, 0, 4]),
      sound("cello-swell", "strings", "Cello swell", "pad", 12, { hold: 6, attack: 0.35, release: 1.5, cutoff: 900, spread: 7 }, [0.05, 0.6], [3, -3, -2]),
      sound("tremolo-strings", "strings", "Tremolo strings", "pad", 12, { hold: 5, attack: 0.06, release: 0.9, cutoff: 2000, spread: 28 }, [0.08, 0.5], [-4, -1, 5]),
      sound("glass-arp", "arp", "Glass arp", "bell", 36, { decay: 0.45, ratio: 2.01, index: 0.8 }, [0.05, 0.5], [-10, -2, 7]),
      sound("music-box", "arp", "Music box", "bell", 36, { decay: 1.1, ratio: 3.51, index: 1.4 }, [0.05, 0.44], [-12, -3, 9]),
      sound("pluck-arp", "arp", "Pluck arp", "pluck", 36, { decay: 0.5, cutoff: 4800, colour: 0.9, hold: 1 }, [0.1, 0.5], [-9, 0, 6]),
      sound("harp-run", "arp", "Harp run", "pluck", 36, { decay: 1.8, cutoff: 5400, colour: 0.55, hold: 3 }, [0.05, 0.46], [-11, -2, 8]),
      sound("conga-set", "perc", "Congas", "kit", 0, { tune: 1.15 }, [0.1, 0.6], [-10, 2, 4], drums(["tom", "conga", "rim"])),
      sound("shaker-set", "perc", "Shakers", "kit", 0, { tune: 1.1 }, [0.05, 0.54], [-14, -2, 8], drums(["conga", "shaker", "tamb"])),
      sound("tambourine", "perc", "Tambourine", "kit", 0, { tune: 1 }, [0.08, 0.55], [-12, 0, 7], drums(["rim", "tamb", "triangle"])),
      sound("wood-blocks", "perc", "Wood blocks", "kit", 0, { tune: 1.25 }, [0.12, 0.58], [-13, 3, 5], drums(["tom", "block", "triangle"])),
    ],
  },
  {
    style: "rock",
    label: "Rock",
    version: SEED_VERSION,
    root: 40,
    scale: "minor",
    bpm: 128,
    // Em - G - C - D. Straight, and it has never stopped working.
    progression: [
      { degree: 0, type: "min" },
      { degree: 2, type: "maj" },
      { degree: 5, type: "maj" },
      { degree: 6, type: "maj" },
    ],
    swing: 0.02,
    space: { size: 1.9, damp: 0.4, wet: 0.32, delaySteps: 4, feedback: 0.22 },
    sounds: [
      sound("crunch-stack", "guitarLead", "Crunch stack", "pluck", 24, { decay: 2.4, cutoff: 2600, colour: 0.5, hold: 6 }, [0.7, 0.68], [4, -4, 4]),
      sound("fuzz-lead", "guitarLead", "Fuzz lead", "pluck", 24, { decay: 3, cutoff: 1900, colour: 0.35, hold: 7 }, [0.95, 0.6], [2, 2, 1]),
      sound("wail-lead", "guitarLead", "Wail lead", "pluck", 24, { decay: 3.4, cutoff: 3400, colour: 0.6, hold: 8 }, [0.8, 0.64], [0, 3, 5]),
      sound("clean-tele", "guitarLead", "Clean tele", "pluck", 24, { decay: 1.2, cutoff: 4600, colour: 0.95, hold: 3 }, [0.15, 0.74], [-3, 0, 6]),
      sound("pick-bass", "bass", "Pick bass", "sub", 0, { hold: 2, decay: 0.12, cutoff: 1300, edge: 0.6, glide: 0 }, [0.4, 0.88], [3, 2, 0]),
      sound("growl-bass", "bass", "Growl bass", "sub", 0, { hold: 2.6, decay: 0.16, cutoff: 820, edge: 0.72, glide: 0 }, [0.65, 0.84], [5, 1, -3]),
      sound("fuzz-bass", "bass", "Fuzz bass", "sub", 0, { hold: 1.6, decay: 0.1, cutoff: 1800, edge: 0.9, glide: 0 }, [0.85, 0.8], [2, 5, -1]),
      sound("deep-root", "bass", "Deep root", "sub", 0, { hold: 3.6, decay: 0.22, cutoff: 300, edge: 0.12, glide: 0.06 }, [0.1, 0.95], [7, -3, -10]),
      sound("big-kit", "drums", "Big kit", "kit", 0, { tune: 0.85 }, [0.3, 0.94], [5, -1, 2], drums(["kick", "snare", "hat"])),
      sound("punch-kit", "drums", "Punch kit", "kit", 0, { tune: 1 }, [0.45, 0.9], [2, 3, 3], drums(["kick", "snare", "openHat"])),
      sound("stadium-kit", "drums", "Stadium kit", "kit", 0, { tune: 0.8 }, [0.25, 0.9], [7, -3, 4], drums(["kick", "clap", "openHat"]), ),
      sound("garage-kit", "drums", "Garage kit", "kit", 0, { tune: 1.1 }, [0.55, 0.85], [1, 4, 2], drums(["kick", "rim", "hat"])),
      sound("power-chords", "guitarFill", "Power chords", "stab", 12, { hold: 2.4, decay: 0.2, cutoff: 2400, detune: 14, strum: 0.014 }, [0.75, 0.56], [3, -3, 2]),
      sound("dry-stabs", "guitarFill", "Dry stabs", "stab", 12, { hold: 0.6, decay: 0.08, cutoff: 1800, detune: 8, strum: 0.006 }, [0.5, 0.6], [-2, 2, 1]),
      sound("palm-mutes", "guitarFill", "Palm mutes", "stab", 12, { hold: 0.35, decay: 0.05, cutoff: 1200, detune: 5, strum: 0.004 }, [0.65, 0.58], [0, 4, -2]),
      sound("open-jangle", "guitarFill", "Open jangle", "stab", 12, { hold: 2, decay: 0.24, cutoff: 3400, detune: 12, strum: 0.02 }, [0.25, 0.58], [-6, 0, 6]),
      sound("organ-pad", "synth", "Organ pad", "pad", 12, { hold: 4, attack: 0.01, release: 0.12, cutoff: 2000, spread: 4 }, [0.35, 0.58], [3, 2, -1]),
      sound("string-pad", "synth", "String pad", "pad", 12, { hold: 5, attack: 0.14, release: 1.1, cutoff: 1500, spread: 24 }, [0.05, 0.54], [0, -2, 2]),
      sound("mellotron", "synth", "Mellotron", "pad", 12, { hold: 5, attack: 0.09, release: 1.3, cutoff: 1200, spread: 16 }, [0.15, 0.54], [2, -1, -3]),
      sound("saw-swell", "synth", "Saw swell", "pad", 12, { hold: 3, attack: 0.2, release: 0.6, cutoff: 2800, spread: 10 }, [0.3, 0.5], [-2, 3, 4]),
      sound("honky-tonk", "keys", "Honky tonk", "pluck", 12, { decay: 1.5, cutoff: 3600, colour: 0.85, hold: 4 }, [0.2, 0.62], [-1, 5, 3]),
      sound("rhodes-keys", "keys", "Rhodes keys", "pluck", 12, { decay: 2.2, cutoff: 2200, colour: 0.45, hold: 5 }, [0.1, 0.64], [0, 2, 0]),
      sound("upright", "keys", "Upright", "pluck", 12, { decay: 2.8, cutoff: 3000, colour: 0.6, hold: 6 }, [0.15, 0.66], [2, 1, 1]),
      sound("dirty-wurli", "keys", "Dirty wurli", "pluck", 12, { decay: 1.4, cutoff: 1900, colour: 0.5, hold: 4 }, [0.5, 0.56], [1, 6, -1]),
      sound("stax-horns", "brass", "Stax horns", "brass", 19, { hold: 2.2, attack: 0.04, release: 0.18, cutoff: 2400, detune: 12, vibrato: 5 }, [0.4, 0.58], [-5, 7, 1]),
      sound("trombone-hit", "brass", "Trombone hit", "brass", 19, { hold: 3, attack: 0.06, release: 0.22, cutoff: 1600, detune: 7, vibrato: 4 }, [0.45, 0.6], [-1, 6, -3]),
      sound("trumpet-line", "brass", "Trumpet line", "brass", 19, { hold: 1.6, attack: 0.03, release: 0.14, cutoff: 3400, detune: 4, vibrato: 9 }, [0.25, 0.54], [-8, 4, 5]),
      sound("horn-swell", "brass", "Horn swell", "brass", 19, { hold: 4, attack: 0.12, release: 0.3, cutoff: 2200, detune: 14, vibrato: 6 }, [0.35, 0.56], [-4, 6, 2]),
      sound("epic-strings", "strings", "Epic strings", "pad", 12, { hold: 6, attack: 0.18, release: 1.4, cutoff: 1800, spread: 26 }, [0.08, 0.54], [-1, -2, 4]),
      sound("viola-bed", "strings", "Viola bed", "pad", 12, { hold: 5, attack: 0.16, release: 1, cutoff: 1300, spread: 10 }, [0.05, 0.56], [1, -2, 0]),
      sound("stab-strings", "strings", "Stab strings", "pad", 12, { hold: 0.9, attack: 0.015, release: 0.14, cutoff: 2400, spread: 14 }, [0.15, 0.56], [-4, 1, 4]),
      sound("low-cellos", "strings", "Low cellos", "pad", 12, { hold: 6, attack: 0.3, release: 1.5, cutoff: 800, spread: 5 }, [0.1, 0.6], [4, -4, -4]),
      sound("bright-arp", "arp", "Bright arp", "bell", 36, { decay: 0.4, ratio: 2.01, index: 1 }, [0.1, 0.5], [-10, -1, 7]),
      sound("bell-arp", "arp", "Bell arp", "bell", 36, { decay: 1, ratio: 2.76, index: 1.6 }, [0.05, 0.44], [-12, -3, 8]),
      sound("gritty-arp", "arp", "Gritty arp", "pluck", 36, { decay: 0.6, cutoff: 4200, colour: 0.95, hold: 1 }, [0.35, 0.48], [-8, 2, 5]),
      sound("chime-run", "arp", "Chime run", "bell", 36, { decay: 1.6, ratio: 4.02, index: 0.9 }, [0.05, 0.42], [-11, -2, 9]),
      sound("cowbell-set", "perc", "Cowbells", "kit", 0, { tune: 1.05 }, [0.15, 0.58], [-11, 4, 3], drums(["tom", "cowbell", "tamb"])),
      sound("tambourine-rock", "perc", "Tambourine", "kit", 0, { tune: 1 }, [0.1, 0.55], [-12, 0, 7], drums(["rim", "tamb", "triangle"])),
      sound("floor-toms", "perc", "Floor toms", "kit", 0, { tune: 0.7 }, [0.2, 0.62], [4, -2, -2], drums(["kick", "tom", "rim"])),
      sound("hand-claps", "perc", "Hand claps", "kit", 0, { tune: 1.1 }, [0.12, 0.6], [-9, 3, 5], drums(["tom", "clap", "tamb"])),
    ],
  },
  {
    style: "pop",
    label: "Pop",
    version: SEED_VERSION,
    root: 48,
    scale: "major",
    bpm: 112,
    // C - G - Am - F. The four chords, and there is no shame in them.
    progression: [
      { degree: 0, type: "maj" },
      { degree: 4, type: "maj" },
      { degree: 5, type: "min" },
      { degree: 3, type: "maj" },
    ],
    swing: 0.06,
    space: { size: 1.3, damp: 0.5, wet: 0.28, delaySteps: 3, feedback: 0.26 },
    sounds: [
      sound("clean-sparkle", "guitarLead", "Clean sparkle", "pluck", 24, { decay: 1.2, cutoff: 5200, colour: 0.95, hold: 3 }, [0.05, 0.74], [-5, -1, 8]),
      sound("chorus-lead", "guitarLead", "Chorus lead", "pluck", 24, { decay: 2, cutoff: 3800, colour: 0.7, hold: 5 }, [0.15, 0.7], [-2, 1, 5]),
      sound("nylon-lead", "guitarLead", "Nylon lead", "pluck", 24, { decay: 2.2, cutoff: 3000, colour: 0.45, hold: 5 }, [0.05, 0.72], [-1, 2, 2]),
      sound("funk-lead", "guitarLead", "Funk lead", "pluck", 24, { decay: 0.6, cutoff: 4600, colour: 0.9, hold: 1.4 }, [0.2, 0.7], [-6, 4, 6]),
      sound("round-bass", "bass", "Round bass", "sub", 0, { hold: 2.6, decay: 0.15, cutoff: 420, edge: 0.14, glide: 0 }, [0.05, 0.94], [5, -2, -8]),
      sound("pluck-bass", "bass", "Pluck bass", "sub", 0, { hold: 1.1, decay: 0.07, cutoff: 800, edge: 0.36, glide: 0 }, [0.2, 0.88], [3, 1, -4]),
      sound("synth-bass", "bass", "Synth bass", "sub", 0, { hold: 1.8, decay: 0.1, cutoff: 1400, edge: 0.62, glide: 0.03 }, [0.4, 0.85], [2, 4, -2]),
      sound("soft-sub", "bass", "Soft sub", "sub", 0, { hold: 3.8, decay: 0.24, cutoff: 240, edge: 0.05, glide: 0.07 }, [0.05, 0.95], [7, -4, -11]),
      sound("pop-kit", "drums", "Pop kit", "kit", 0, { tune: 1.05 }, [0.1, 0.9], [3, 0, 6], drums(["kick", "snare", "hat"])),
      sound("clap-kit", "drums", "Clap kit", "kit", 0, { tune: 1.15 }, [0.2, 0.86], [0, 4, 5], drums(["kick", "clap", "hat"])),
      sound("linn-kit", "drums", "Linn kit", "kit", 0, { tune: 1.2 }, [0.15, 0.88], [2, 1, 7], drums(["kick", "snare", "openHat"])),
      sound("soft-kit", "drums", "Soft kit", "kit", 0, { tune: 1 }, [0.05, 0.84], [4, -2, 3], drums(["sub808", "rim", "shaker"])),
      sound("bright-stabs", "guitarFill", "Bright stabs", "stab", 12, { hold: 1, decay: 0.12, cutoff: 3600, detune: 8, strum: 0.01 }, [0.05, 0.58], [-8, 0, 6]),
      sound("soft-chops", "guitarFill", "Soft chops", "stab", 12, { hold: 0.6, decay: 0.08, cutoff: 2200, detune: 6, strum: 0.007 }, [0.1, 0.54], [-5, 1, 3]),
      sound("nylon-chops", "guitarFill", "Nylon chops", "stab", 12, { hold: 0.9, decay: 0.11, cutoff: 1800, detune: 5, strum: 0.009 }, [0.05, 0.56], [-3, 2, 1]),
      sound("disco-chank", "guitarFill", "Disco chank", "stab", 12, { hold: 0.4, decay: 0.06, cutoff: 4200, detune: 10, strum: 0.006 }, [0.15, 0.54], [-9, 3, 7]),
      sound("wide-pad", "synth", "Wide pad", "pad", 12, { hold: 4, attack: 0.1, release: 0.9, cutoff: 2400, spread: 20 }, [0.05, 0.66], [1, -2, 4]),
      sound("pluck-synth", "synth", "Pluck synth", "pad", 12, { hold: 1, attack: 0.008, release: 0.2, cutoff: 4400, spread: 6 }, [0.1, 0.66], [-4, 0, 7]),
      sound("air-pad", "synth", "Air pad", "pad", 12, { hold: 6, attack: 0.25, release: 1.3, cutoff: 3200, spread: 28 }, [0.05, 0.56], [-6, -3, 8]),
      sound("house-chord", "synth", "House chord", "pad", 12, { hold: 1.6, attack: 0.012, release: 0.32, cutoff: 2000, spread: 11 }, [0.2, 0.62], [-2, 3, 3]),
      sound("bright-grand", "keys", "Bright grand", "pluck", 12, { decay: 2.6, cutoff: 4600, colour: 0.7, hold: 6 }, [0.05, 0.66], [-1, 1, 5]),
      sound("electric-keys", "keys", "Electric keys", "pluck", 12, { decay: 1.9, cutoff: 2600, colour: 0.5, hold: 5 }, [0.08, 0.64], [0, 3, 2]),
      sound("mallet-keys", "keys", "Mallet keys", "bell", 12, { decay: 0.8, ratio: 2.01, index: 0.7 }, [0.05, 0.58], [-5, 2, 7]),
      sound("house-piano", "keys", "House piano", "pluck", 12, { decay: 0.8, cutoff: 3200, colour: 0.9, hold: 2 }, [0.12, 0.62], [-3, 5, 3]),
      sound("pop-horns", "brass", "Pop horns", "brass", 19, { hold: 2, attack: 0.04, release: 0.16, cutoff: 3000, detune: 10, vibrato: 5 }, [0.2, 0.58], [-7, 5, 4]),
      sound("synth-brass", "brass", "Synth brass", "brass", 19, { hold: 3, attack: 0.06, release: 0.24, cutoff: 2400, detune: 16, vibrato: 3 }, [0.35, 0.56], [-5, 6, 2]),
      sound("flugel-line", "brass", "Flugel line", "brass", 19, { hold: 3.4, attack: 0.08, release: 0.26, cutoff: 2000, detune: 6, vibrato: 8 }, [0.15, 0.58], [-3, 4, 0]),
      sound("stab-section", "brass", "Stab section", "brass", 19, { hold: 1.2, attack: 0.025, release: 0.12, cutoff: 3600, detune: 12, vibrato: 4 }, [0.25, 0.54], [-9, 4, 6]),
      sound("lush-strings", "strings", "Lush strings", "pad", 12, { hold: 6, attack: 0.2, release: 1.2, cutoff: 2000, spread: 24 }, [0.05, 0.54], [-2, -2, 5]),
      sound("pizzicato", "strings", "Pizzicato", "pad", 12, { hold: 0.5, attack: 0.006, release: 0.12, cutoff: 2800, spread: 8 }, [0.08, 0.58], [-6, 1, 5]),
      sound("warm-section", "strings", "Warm section", "pad", 12, { hold: 6, attack: 0.26, release: 1.4, cutoff: 1400, spread: 16 }, [0.05, 0.56], [2, -3, 0]),
      sound("high-violins", "strings", "High violins", "pad", 12, { hold: 5, attack: 0.14, release: 0.9, cutoff: 3000, spread: 30 }, [0.05, 0.48], [-8, -2, 7]),
      sound("sparkle-arp", "arp", "Sparkle arp", "bell", 36, { decay: 0.42, ratio: 2.01, index: 0.9 }, [0.05, 0.5], [-11, -2, 8]),
      sound("bell-run", "arp", "Bell run", "bell", 36, { decay: 1.2, ratio: 3.01, index: 1.3 }, [0.05, 0.44], [-12, -3, 9]),
      sound("soft-arp", "arp", "Soft arp", "pluck", 36, { decay: 0.7, cutoff: 4800, colour: 0.6, hold: 1.4 }, [0.05, 0.5], [-9, -1, 6]),
      sound("kalimba", "arp", "Kalimba", "pluck", 36, { decay: 1.4, cutoff: 5000, colour: 0.4, hold: 3 }, [0.08, 0.46], [-10, 0, 7]),
      sound("shaker-pop", "perc", "Shakers", "kit", 0, { tune: 1.1 }, [0.05, 0.52], [-14, -2, 8], drums(["conga", "shaker", "tamb"])),
      sound("finger-snaps", "perc", "Finger snaps", "kit", 0, { tune: 1.2 }, [0.08, 0.56], [-11, 2, 6], drums(["rim", "clap", "triangle"])),
      sound("bongo-set", "perc", "Bongos", "kit", 0, { tune: 1.35 }, [0.1, 0.58], [-9, 3, 4], drums(["tom", "conga", "block"])),
      sound("triangle-set", "perc", "Triangle", "kit", 0, { tune: 1 }, [0.05, 0.48], [-15, -4, 9], drums(["block", "tamb", "triangle"])),
    ],
  },
];

let ready: Promise<void> | null = null;

async function packs(): Promise<Collection<StylePack>> {
  const db = await getDb();
  const collection = db.collection<StylePack>(COLLECTIONS.SONG_BUILDER_STYLES);
  ready ??= seed(collection).catch((error) => {
    ready = null;
    throw error;
  });
  await ready;
  return collection;
}

/**
 * Brings the collection up to date on first read.
 *
 * A missing document is inserted. A document from an older `SEED_VERSION` is
 * replaced outright, because a pack written before a field existed would fall
 * back for every sound in it - all four kits would become the same three pieces,
 * and every row would land in the centre of the mix. Otherwise the document is
 * only topped up with sounds it does not have, so hand-retuning survives.
 */
async function seed(collection: Collection<StylePack>) {
  await collection.createIndex({ style: 1 }, { unique: true, name: "style_unique" });

  for (const pack of SEED) {
    const existing = await collection.findOne({ style: pack.style });
    if (!existing || (existing.version ?? 0) < SEED_VERSION) {
      await collection.replaceOne({ style: pack.style }, { ...pack }, { upsert: true });
      continue;
    }

    const have = new Set((existing.sounds ?? []).map((entry) => entry?.id));
    const missing = pack.sounds.filter((entry) => !have.has(entry.id));
    if (missing.length) {
      await collection.updateOne({ style: pack.style }, { $push: { sounds: { $each: missing } } });
    }
  }
}

/** The pack for one style, or `null` if the database has no document for it. */
export async function getStylePack(style: Style): Promise<StylePack | null> {
  const doc = await (await packs()).findOne({ style });
  return doc ? normalizeStylePack(doc, style) : null;
}

export function isStyle(value: unknown): value is Style {
  return typeof value === "string" && STYLES.includes(value as Style);
}

/**
 * Coerces a hand-edited document into something the studio can play. Every row
 * is guaranteed at least one sound, so a selector is never empty, and the
 * progression is guaranteed at least one chord, so the harmony always resolves.
 */
function normalizeStylePack(doc: Record<string, unknown>, style: Style): StylePack {
  const fallback = SEED.find((pack) => pack.style === style)!;
  const sounds = Array.isArray(doc.sounds)
    ? doc.sounds.map((entry) => normalizeSound(entry)).filter((entry): entry is Sound => entry !== null)
    : [];
  const progression = Array.isArray(doc.progression)
    ? doc.progression.map(normalizeChord).filter((entry): entry is Chord => entry !== null)
    : [];

  return {
    style,
    label: text(doc.label, fallback.label),
    version: int(doc.version, 0, 0, 999),
    root: int(doc.root, fallback.root, 24, 72),
    scale: SCALES.includes(doc.scale as ScaleName) ? (doc.scale as ScaleName) : fallback.scale,
    bpm: int(doc.bpm, fallback.bpm, MIN_BPM, MAX_BPM),
    progression: progression.length ? progression : fallback.progression,
    swing: num(doc.swing, fallback.swing, 0, 0.35),
    space: normalizeSpace(doc.space, fallback.space),
    // A row whose sounds were all dropped falls back to the seeded ones for that row.
    sounds: TRACK_KINDS.flatMap((kind) => {
      const forKind = sounds.filter((entry) => entry.kind === kind);
      return forKind.length ? forKind : fallback.sounds.filter((entry) => entry.kind === kind);
    }),
  };
}

function normalizeChord(raw: unknown): Chord | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  if (!CHORD_TYPES.includes(entry.type as ChordType)) return null;
  return { degree: int(entry.degree, 0, 0, 6), type: entry.type as ChordType };
}

function normalizeSpace(raw: unknown, fallback: Space): Space {
  const entry = (raw ?? {}) as Record<string, unknown>;
  return {
    size: num(entry.size, fallback.size, 0.3, 4),
    damp: num(entry.damp, fallback.damp, 0, 1),
    wet: num(entry.wet, fallback.wet, 0, 1),
    delaySteps: num(entry.delaySteps, fallback.delaySteps, 0.5, 8),
    feedback: num(entry.feedback, fallback.feedback, 0, 0.85),
  };
}

function normalizeSound(raw: unknown): Sound | null {
  if (!raw || typeof raw !== "object") return null;
  const entry = raw as Record<string, unknown>;
  const kind = entry.kind;
  const voice = entry.voice;
  if (!TRACK_KINDS.includes(kind as TrackKind) || !VOICE_IDS.includes(voice as VoiceId)) return null;
  if (typeof entry.id !== "string" || !entry.id) return null;

  const amp = (entry.amp ?? {}) as Record<string, unknown>;
  const eq = (entry.eq ?? {}) as Record<string, unknown>;
  const mix = (entry.mix ?? {}) as Record<string, unknown>;
  const place = PLACE[kind as TrackKind];

  return {
    id: entry.id.slice(0, 40),
    kind: kind as TrackKind,
    label: text(entry.label, entry.id),
    voice: voice as VoiceId,
    transpose: int(entry.transpose, 0, -24, 36),
    harmony: HARMONY_ROLES.includes(entry.harmony as HarmonyRole)
      ? (entry.harmony as HarmonyRole)
      : ROLE[kind as TrackKind],
    pieces: Array.isArray(entry.pieces)
      ? entry.pieces.filter((piece): piece is DrumPiece => DRUM_PIECES.includes(piece as DrumPiece))
      : [],
    config: numbers(entry.config),
    amp: { drive: num(amp.drive, 0.2, 0, 1), level: num(amp.level, 0.8, 0, 1) },
    eq: {
      low: num(eq.low, 0, -18, 18),
      mid: num(eq.mid, 0, -18, 18),
      high: num(eq.high, 0, -18, 18),
    },
    mix: {
      pan: num(mix.pan, place.pan, -1, 1),
      width: num(mix.width, place.width, 0, 1),
      reverb: num(mix.reverb, place.reverb, 0, 1),
      delay: num(mix.delay, place.delay, 0, 1),
      duck: num(mix.duck, place.duck, 0, 1),
    },
  };
}

function numbers(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) out[key] = parsed;
  }
  return out;
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 60) : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function int(value: unknown, fallback: number, min: number, max: number) {
  return Math.round(num(value, fallback, min, max));
}
