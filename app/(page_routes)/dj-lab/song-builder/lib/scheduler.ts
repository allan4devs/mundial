/**
 * The clock.
 *
 * `setInterval` is far too jittery to fire notes on, so it is used only to wake
 * up often and hand the *audio* clock work a little way into the future - the
 * standard Web Audio look-ahead. Every note is scheduled at an absolute
 * `AudioContext` time and is therefore sample-accurate regardless of how late
 * the timer runs.
 *
 * The song is read through a getter on every tick, so editing a step, swapping an
 * instrument or moving a fader takes effect on the next step rather than needing
 * the transport to restart.
 */

import { stepSeconds, type Song, type Track, type TrackKind } from "@/lib/song-builder/types";
import { SCHEDULER_TICK_MS, SCHEDULE_AHEAD_SECONDS } from "./constants";
import { instrumentFor, playHit } from "./instruments";
import { click } from "./voices";

export type SchedulerDeps = {
  ctx: AudioContext;
  /** The output node for one row - the studio keeps a gain per row. */
  busFor: (kind: TrackKind) => AudioNode;
  /** Read fresh each tick so live edits are picked up mid-loop. */
  getSong: () => Song;
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
    const seconds = stepSeconds(song.bpm);

    while (nextStepTime < deps.ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      for (const track of song.tracks) {
        const hit = track.muted ? undefined : track.hits.find((candidate) => candidate.step === step);
        if (hit) {
          playHit(instrumentFor(track.kind, track.instrumentId), hit, song, {
            ctx: deps.ctx,
            out: deps.busFor(track.kind),
            time: nextStepTime,
            stepSeconds: seconds,
          });
        }
      }
      deps.onStep(step, nextStepTime);
      nextStepTime += seconds;
      step = (step + 1) % song.steps;
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

/**
 * Schedules one pass of a single row, for auditioning it on its own.
 * Returns when the pass ends, so a caller can flip a button back.
 */
export function auditionTrack(args: {
  ctx: AudioContext;
  out: AudioNode;
  song: Song;
  track: Track;
  at?: number;
}) {
  const seconds = stepSeconds(args.song.bpm);
  const start = args.at ?? args.ctx.currentTime + LEAD_SECONDS;
  const instrument = instrumentFor(args.track.kind, args.track.instrumentId);

  for (const hit of args.track.hits) {
    playHit(instrument, hit, args.song, {
      ctx: args.ctx,
      out: args.out,
      time: start + hit.step * seconds,
      stepSeconds: seconds,
    });
  }
  return start + args.song.steps * seconds;
}

/** Fires a single hit right now - used when a step is clicked on the grid. */
export function auditionHit(args: {
  ctx: AudioContext;
  out: AudioNode;
  song: Song;
  track: Track;
  step: number;
}) {
  const hit = args.track.hits.find((candidate) => candidate.step === args.step);
  if (!hit) return;
  playHit(instrumentFor(args.track.kind, args.track.instrumentId), hit, args.song, {
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
