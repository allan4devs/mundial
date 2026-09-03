/**
 * The instrument registry - the "saved sounds" a decoded rhythm can be played with.
 *
 * One list per row. A preset pairs a voice from `voices.ts` with the tuning that
 * makes it a distinct choice, plus the octave the row should sit in. Adding a
 * sound is one entry here; nothing else in the studio needs to know about it.
 *
 * `instrumentFor` never fails: an id from an older save, or one this build has
 * dropped, falls back to the row's first preset.
 */

import type { Hit, ScaleName, TrackKind } from "@/lib/song-builder/types";
import { noteFromTone } from "./music";
import {
  chordStab,
  drumKit,
  padSynth,
  pluckedLead,
  subBass,
  type Voice,
  type VoiceArgs,
} from "./voices";

export type Instrument = {
  id: string;
  label: string;
  /** One line of what it sounds like, shown under the picker. */
  hint: string;
  /** Semitones from the song root, so each row sits in its own register. */
  transpose: number;
  play: Voice;
};

export const INSTRUMENTS: Record<TrackKind, readonly Instrument[]> = {
  guitarLead: [
    {
      id: "clean-lead",
      label: "Clean lead",
      hint: "Bright single-coil pluck",
      transpose: 24,
      play: pluckedLead({ detune: 6, cutoff: 3600, drive: 0.15, decay: 0.42 }),
    },
    {
      id: "crunch-lead",
      label: "Crunch lead",
      hint: "Overdriven, sustains longer",
      transpose: 24,
      play: pluckedLead({ detune: 11, cutoff: 2600, drive: 0.55, decay: 0.6 }),
    },
    {
      id: "muted-lead",
      label: "Muted lead",
      hint: "Palm-muted, tight and dry",
      transpose: 24,
      play: pluckedLead({ detune: 4, cutoff: 1700, drive: 0.3, decay: 0.16 }),
    },
  ],
  bass: [
    {
      id: "round-bass",
      label: "Round bass",
      hint: "Fingered, mostly sub",
      transpose: 0,
      play: subBass({ edge: 0.12, cutoff: 240, decay: 0.34 }),
    },
    {
      id: "growl-bass",
      label: "Growl bass",
      hint: "Saw edge on top of the sub",
      transpose: 0,
      play: subBass({ edge: 0.45, cutoff: 620, decay: 0.3 }),
    },
    {
      id: "pluck-bass",
      label: "Pluck bass",
      hint: "Short, staccato notes",
      transpose: 0,
      play: subBass({ edge: 0.25, cutoff: 420, decay: 0.14 }),
    },
  ],
  drums: [
    {
      id: "studio-kit",
      label: "Studio kit",
      hint: "Balanced kick, snare and hat",
      transpose: 0,
      play: drumKit({ snareAt: 0.34, hatAt: 0.66, tune: 1 }),
    },
    {
      id: "deep-kit",
      label: "Deep kit",
      hint: "Lower tuning, leans on the kick",
      transpose: 0,
      play: drumKit({ snareAt: 0.45, hatAt: 0.75, tune: 0.82 }),
    },
    {
      id: "tight-kit",
      label: "Tight kit",
      hint: "Higher tuning, more hats",
      transpose: 0,
      play: drumKit({ snareAt: 0.25, hatAt: 0.5, tune: 1.2 }),
    },
  ],
  guitarFill: [
    {
      id: "stab-chords",
      label: "Stab chords",
      hint: "Short strummed triads",
      transpose: 12,
      play: chordStab({ cutoff: 2400, decay: 0.18, strum: 0.012 }),
    },
    {
      id: "ring-chords",
      label: "Ring chords",
      hint: "Let the triad ring out",
      transpose: 12,
      play: chordStab({ cutoff: 3200, decay: 0.5, strum: 0.02 }),
    },
    {
      id: "scratch-chords",
      label: "Scratch chords",
      hint: "Percussive, almost muted",
      transpose: 12,
      play: chordStab({ cutoff: 1500, decay: 0.08, strum: 0.006 }),
    },
  ],
  synth: [
    {
      id: "warm-pad",
      label: "Warm pad",
      hint: "Slow sweep, long tail",
      transpose: 12,
      play: padSynth({ spread: 9, cutoff: 2200, release: 0.5 }),
    },
    {
      id: "wide-pad",
      label: "Wide pad",
      hint: "Heavier detune, dreamier",
      transpose: 12,
      play: padSynth({ spread: 22, cutoff: 1600, release: 0.9 }),
    },
    {
      id: "bright-pad",
      label: "Bright pad",
      hint: "Open filter, cuts through",
      transpose: 24,
      play: padSynth({ spread: 5, cutoff: 5200, release: 0.3 }),
    },
  ],
};

export function instrumentFor(kind: TrackKind, id: string): Instrument {
  const options = INSTRUMENTS[kind];
  return options.find((instrument) => instrument.id === id) ?? options[0];
}

/** The id a fresh row starts on. */
export function defaultInstrumentId(kind: TrackKind) {
  return INSTRUMENTS[kind][0].id;
}

export type SongTuning = { root: number; scale: ScaleName };

/**
 * Renders one decoded hit through one instrument. This is the only place that
 * knows a hit's `tone` means both "which drum" and "which note" - everything
 * upstream just carries the number.
 */
export function playHit(
  instrument: Instrument,
  hit: Hit,
  tuning: SongTuning,
  context: Omit<VoiceArgs, "velocity" | "tone" | "note">,
) {
  instrument.play({
    ...context,
    velocity: hit.velocity,
    tone: hit.tone,
    note: noteFromTone(hit.tone, tuning.root + instrument.transpose, tuning.scale),
  });
}
