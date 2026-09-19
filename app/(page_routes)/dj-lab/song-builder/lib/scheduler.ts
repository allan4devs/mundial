/**
 * The clock.
 *
 * `setInterval` is far too jittery to fire notes on, so it is used only to wake
 * up often and hand the *audio* clock work a little way into the future - the
 * standard Web Audio look-ahead. Every note is scheduled at an absolute
 * `AudioContext` time and is therefore sample-accurate regardless of how late
 * the timer runs.
 *
 * The song and the pack are read through getters on every tick, so editing a
 * step or switching a sound takes effect on the next step rather than needing
 * the transport to restart.
 */

import { STEPS, stepSeconds, type Song, type StylePack, type TrackKind } from "@/lib/song-builder/types";
import { SCHEDULER_TICK_MS, SCHEDULE_AHEAD_SECONDS } from "./constants";
import { soundFor } from "./session";
import { click, playHit } from "./voices";

export type SchedulerDeps = {
  ctx: AudioContext;
  /** The channel strip for one row. */
  stripFor: (kind: TrackKind) => AudioNode;
  /** Read fresh each tick so live edits are picked up mid-loop. */
  getSong: () => Song;
  getPack: () => StylePack;
  /** Reports each scheduled step and the audio time it will sound at. */
  onStep: (step: number, time: number) => void;
};

export type Scheduler = {
  start: () => void;
  stop: () => void;
};

/** Small delay before the first step so scheduling never lands in the past. */
const LEAD_SECONDS = 0.06;

export function createScheduler(deps: SchedulerDeps): Scheduler {
  let timer: ReturnType<typeof setInterval> | null = null;
  let nextStepTime = 0;
  let step = 0;

  const tick = () => {
    const song = deps.getSong();
    const pack = deps.getPack();
    const seconds = stepSeconds(song.bpm);

    while (nextStepTime < deps.ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      for (const track of song.tracks) {
        const hit = track.hits.find((candidate) => candidate.step === step);
        if (hit) {
          playHit(soundFor(pack, track.kind, track.soundId), hit, pack, {
            ctx: deps.ctx,
            out: deps.stripFor(track.kind),
            time: nextStepTime,
            stepSeconds: seconds,
          });
        }
      }
      deps.onStep(step, nextStepTime);
      nextStepTime += seconds;
      step = (step + 1) % STEPS;
    }
  };

  return {
    start() {
      if (timer) return;
      step = 0;
      nextStepTime = deps.ctx.currentTime + LEAD_SECONDS;
      tick();
      timer = setInterval(tick, SCHEDULER_TICK_MS);
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      // Notes already handed to the audio clock ring out; none last past a second.
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
