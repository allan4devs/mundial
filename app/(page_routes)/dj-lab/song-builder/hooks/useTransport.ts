"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { Song, StylePack } from "@/lib/song-builder/types";
import { createScheduler, type Scheduler } from "../lib/scheduler";
import type { AudioEngine } from "./useAudioEngine";
import { useLatest } from "./useLatest";

/**
 * A sung take, kept so Play can put it back over the loop.
 *
 * `offset` is how far into the buffer the loop's downbeat fell - the microphone
 * opens a fraction before the scheduler starts, and playing from sample zero
 * would drag the whole vocal that far behind the beat.
 */
export type VoiceTake = {
  buffer: AudioBuffer;
  offset: number;
};

export type Transport = {
  playing: boolean;
  /** Step the speakers are on right now, or -1 when stopped. */
  step: number;
  /** Starts or stops. Returns the audio time of the downbeat when it starts, else null. */
  toggle: () => Promise<number | null>;
  stop: () => void;
};

/**
 * Play/stop, the playhead, and the sung voice on top of it.
 *
 * Once a take exists, Play is "the song with my voice": the scheduler plays the
 * rows and one `AudioBufferSourceNode` plays the recorded vocal, both handed the
 * same downbeat so they line up. The voice runs once and stops - it is however
 * many bars the singer felt like, not a loop, so repeating it would drift.
 *
 * The scheduler runs up to 120 ms ahead of the speakers, so its step callbacks
 * are queued with the audio time they will sound at and drained on animation
 * frames. Without that the highlight visibly leads the beat.
 */
export function useTransport(
  engine: AudioEngine,
  song: Song | null,
  pack: StylePack | null,
  /** The last sung take, or null. A ref so a new take can clear it mid-gesture. */
  voice: RefObject<VoiceTake | null>,
  onError: (message: string) => void,
): Transport {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);

  const songRef = useLatest(song);
  const packRef = useLatest(pack);
  const errorRef = useLatest(onError);
  const schedulerRef = useRef<Scheduler | null>(null);
  const queueRef = useRef<{ step: number; time: number }[]>([]);
  const voiceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const stop = useCallback(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;
    // Stops a vocal already sounding, and cancels one still waiting on the lead-in.
    voiceNodeRef.current?.stop();
    voiceNodeRef.current = null;
    queueRef.current = [];
    setPlaying(false);
    setStep(-1);
  }, []);

  const toggle = useCallback(async () => {
    if (schedulerRef.current) {
      stop();
      return null;
    }
    if (!songRef.current || !packRef.current) return null;

    try {
      const rig = await engine.getRig();
      const scheduler = createScheduler({
        ctx: rig.ctx,
        strips: rig.strips,
        master: rig.master,
        // Non-null by the guard above, and neither can become null afterwards.
        getSong: () => songRef.current!,
        getPack: () => packRef.current!,
        onStep: (at, time) => queueRef.current.push({ step: at, time }),
      });
      schedulerRef.current = scheduler;
      const downbeat = scheduler.start();

      const take = voice.current;
      if (take) {
        const node = rig.ctx.createBufferSource();
        node.buffer = take.buffer;
        node.connect(rig.master);
        node.start(downbeat, Math.max(0, take.offset));
        voiceNodeRef.current = node;
      }

      setPlaying(true);
      return downbeat;
    } catch (error) {
      errorRef.current(error instanceof Error ? error.message : "Playback could not start.");
      return null;
    }
  }, [engine, errorRef, packRef, songRef, stop, voice]);

  // Drains the queue in sync with the audio clock while the transport runs.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const ctx = engine.peekRig()?.ctx;
      if (!ctx) return;

      const queue = queueRef.current;
      let due = -1;
      while (queue.length && queue[0].time <= ctx.currentTime) due = queue.shift()!.step;
      if (due >= 0) setStep(due);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [engine, playing]);

  // A page navigation mid-loop would otherwise leave the interval running.
  useEffect(() => stop, [stop]);

  return { playing, step, toggle, stop };
}
