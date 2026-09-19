/**
 * The engines, addressed by name.
 *
 * A sound document picks one of these and tunes it with a bag of numbers, which
 * is what lets a whole instrument be retuned without a deploy. A voice builds a
 * throwaway graph for one note at one time and schedules its own stop; nothing
 * here holds state between notes, and nothing here knows about amplifiers,
 * equalisation, panning or sends - that is the row's channel strip.
 *
 * `playHit` is the seam where a decoded mouth-noise becomes music: it is the one
 * place that resolves a hit's brightness against the chord under it. Everything
 * upstream carries a number between nought and one and knows nothing about keys.
 */

import { chordAt, chordVoicing, noteFor } from "@/lib/song-builder/harmony";
import type { DrumPiece, Hit, Sound, StylePack, VoiceId } from "@/lib/song-builder/types";
import { PIECES } from "./drums";
import { num, percussive, type Voice, type VoiceArgs } from "./env";
import { SYNTHS } from "./synths";

/** What a `kit` sound falls back to if its document names no pieces at all. */
const DEFAULT_PIECES: DrumPiece[] = ["kick", "snare", "hat"];

/** Brightness splits the sound's pieces into equal bands: dark first, bright last. */
function pick(pieces: DrumPiece[], tone: number): DrumPiece {
  const choices = pieces.length ? pieces : DEFAULT_PIECES;
  return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(tone * choices.length)))];
}

/**
 * The kit. Brightness picks which of the sound's three pieces fires - a dark
 * "boom" the first, a mid "ka" the second, a bright "tss" the third - and which
 * three they are is a field on the sound rather than a branch in here.
 */
const kit: Voice = ({ ctx, out, time, velocity, tone, pieces }, config) => {
  PIECES[pick(pieces, tone)]({ ctx, out, time, velocity, tune: num(config, "tune", 1) });
};

/**
 * The drum this hit would fire, or `null` if the sound is not a kit.
 *
 * The scheduler asks so it can duck the mix under a kick. It has to be answered
 * here rather than guessed from the row, because a kick is a *piece* - a
 * percussion row with an 808 on its dark band ducks the mix too, and should.
 */
export function pieceFor(sound: Sound, tone: number): DrumPiece | null {
  return sound.voice === "kit" ? pick(sound.pieces, tone) : null;
}

const VOICES: Record<VoiceId, Voice> = { ...SYNTHS, kit };

/**
 * Renders one decoded hit through one sound.
 *
 * Brightness is doing two jobs, and this is the only place that knows it: for
 * the kit it is which drum, and for everything else it is where in the chord the
 * note sits. The chord itself comes from the pack's progression and the step, so
 * ten rows hitting the same step are all inside the same chord - which is the
 * difference between an arrangement and ten people tuning up.
 */
export function playHit(
  sound: Sound,
  hit: Hit,
  pack: StylePack,
  context: Omit<VoiceArgs, "velocity" | "tone" | "note" | "voicing" | "pieces" | "width">,
) {
  const chord = chordAt(pack.progression, hit.step);
  const note = noteFor({
    tone: hit.tone,
    step: hit.step,
    root: pack.root,
    scale: pack.scale,
    chord,
    role: sound.harmony,
    transpose: sound.transpose,
  });

  VOICES[sound.voice](
    {
      ...context,
      velocity: hit.velocity,
      tone: hit.tone,
      note,
      // Voiced around the note the hit chose, so the chord follows the melody's
      // register instead of jumping an octave every time the progression turns.
      voicing: chordVoicing(chord, pack.root + sound.transpose, pack.scale, note),
      pieces: sound.pieces,
      width: sound.mix.width,
    },
    sound.config,
  );
}

/** The count-in metronome. Not an instrument, but it lives on the same clock. */
export function click(ctx: BaseAudioContext, out: AudioNode, time: number, accent: boolean) {
  const amp = ctx.createGain();
  const end = percussive(amp.gain, time, accent ? 0.5 : 0.25, 0.05);

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = accent ? 1600 : 1000;
  osc.connect(amp);
  osc.start(time);
  osc.stop(end);

  amp.connect(out);
}
