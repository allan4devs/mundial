/**
 * The clock, and the groove.
 *
 * `setInterval` is far too jittery to fire notes on, so it is used only to wake
 * up often and hand the *audio* clock work a little way into the future - the
 * standard Web Audio look-ahead. Every note is scheduled at an absolute
 * `AudioContext` time and is therefore sample-accurate regardless of how late
 * the timer runs.
 *
 * Three things happen to a note on its way from the grid to the speakers, and
 * together they are the difference between a sequencer and a band:
 *
 * - **swing** — the offbeat sixteenths land late, by a fraction the style sets.
 * - **humanising** — every note is nudged a few milliseconds off its step and its
 *   loudness moved a few percent, from a hash rather than a random number, so one
 *   pass of the loop is internally consistent and the next one is not the same.
 * - **accents** — the four sixteenths of a beat are not equally loud. Applying
 *   that curve costs one multiply and is most of what "groove" means.
 *
 * The song and the pack are read through getters on every tick, so editing a
 * step or switching a sound takes effect on the next step rather than needing
 * the transport to restart.
 */

import { STEPS, stepSeconds, type Song, type StylePack, type TrackKind } from "@/lib/song-builder/types";
import { duckStrip, type Strip } from "./audio";
import { ACCENTS, DUCKING_PIECES, HUMANIZE_SECONDS, SCHEDULER_TICK_MS, SCHEDULE_AHEAD_SECONDS } from "./constants";
import { jitter } from "./dsp";
import { soundFor } from "./session";
import { click, pieceFor, playHit } from "./voices";

export type SchedulerDeps = {
  ctx: AudioContext;
  /** Every row's channel strip - notes go into one, the kick ducks all of them. */
  strips: Map<TrackKind, Strip>;
  /** Where a note goes if its row somehow has no strip. */
  master: AudioNode;
  /** Read fresh each tick so live edits are picked up mid-loop. */
  getSong: () => Song;
  getPack: () => StylePack;
  /** Reports each scheduled step and the audio time it will sound at. */
  onStep: (step: number, time: number) => void;
};

export type Scheduler = {
  /** Starts the loop and returns the audio time the downbeat lands at. */
  start: () => number;
  stop: () => void;
};

/** Small delay before the first step so scheduling never lands in the past. */
const LEAD_SECONDS = 0.06;

export function createScheduler(deps: SchedulerDeps): Scheduler {
  let timer: ReturnType<typeof setInterval> | null = null;
  let nextStepTime = 0;
  let step = 0;
  // Bumped every time the loop comes round, so the humanising differs per pass.
  let pass = 0;

  const tick = () => {
    const song = deps.getSong();
    const pack = deps.getPack();
    const seconds = stepSeconds(song.bpm);
    const swing = step % 2 === 1 ? pack.swing * seconds : 0;

    while (nextStepTime < deps.ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const accent = ACCENTS[step % ACCENTS.length];

      song.tracks.forEach((track, row) => {
        const hit = track.hits.find((candidate) => candidate.step === step);
        if (!hit) return;

        const sound = soundFor(pack, track.kind, track.soundId);
        const seed = pass * 4096 + row * 64 + step;
        const at = Math.max(
          deps.ctx.currentTime + 0.005,
          nextStepTime + swing + jitter(seed) * HUMANIZE_SECONDS,
        );

        // The kick is what everything else gets out of the way of, and the
        // scheduler is the only thing that knows when one is about to land.
        const piece = pieceFor(sound, hit.tone);
        if (piece && DUCKING_PIECES.includes(piece)) {
          for (const strip of deps.strips.values()) duckStrip(strip, at, seconds * 4);
        }

        playHit(
          sound,
          { ...hit, velocity: hit.velocity * accent * (1 + jitter(seed + 7) * 0.06) },
          pack,
          {
            ctx: deps.ctx,
            out: deps.strips.get(track.kind)?.input ?? deps.master,
            time: at,
            stepSeconds: seconds,
          },
        );
      });

      deps.onStep(step, nextStepTime);
      nextStepTime += seconds;
      step = (step + 1) % STEPS;
      if (step === 0) pass += 1;
    }
  };

  return {
    start() {
      if (timer) return nextStepTime;
      step = 0;
      pass = 0;
      // Held before the first tick moves it on: this is the downbeat, and a
      // vocal recorded over a previous pass is started against it.
      const downbeat = deps.ctx.currentTime + LEAD_SECONDS;
      nextStepTime = downbeat;
      tick();
      timer = setInterval(tick, SCHEDULER_TICK_MS);
      return downbeat;
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      // Notes already handed to the audio clock ring out; none lasts past a second.
    },
  };
}

/** Fires a single hit right now - the feedback for clicking a step on the grid. */
export function auditionHit(args: {
  ctx: AudioContext;
  out: AudioNode;
  song: Song;
  pack: StylePack;
  kind: TrackKind;
  step: number;
}) {
  const track = args.song.tracks.find((candidate) => candidate.kind === args.kind);
  const hit = track?.hits.find((candidate) => candidate.step === args.step);
  if (!track || !hit) return;

  playHit(soundFor(args.pack, track.kind, track.soundId), hit, args.pack, {
    ctx: args.ctx,
    out: args.out,
    time: args.ctx.currentTime + 0.01,
    stepSeconds: stepSeconds(args.song.bpm),
  });
}

/**
 * Metronome before a take. Returns the time the last click lands, which is also
 * when the microphone should open so the recording starts on the downbeat.
 */
export function scheduleCountIn(args: {
  ctx: AudioContext;
  out: AudioNode;
  bpm: number;
  beats: number;
}) {
  const beatSeconds = 60 / args.bpm;
  const start = args.ctx.currentTime + LEAD_SECONDS;
  for (let beat = 0; beat < args.beats; beat += 1) {
    click(args.ctx, args.out, start + beat * beatSeconds, beat === 0);
  }
  return start + args.beats * beatSeconds;
}
