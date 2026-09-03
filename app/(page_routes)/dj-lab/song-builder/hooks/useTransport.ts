"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Song } from "@/lib/song-builder/types";
import { createScheduler, type Scheduler } from "../lib/scheduler";
import type { AudioEngine } from "./useAudioEngine";
import { useLatest } from "./useLatest";

export type Transport = {
  playing: boolean;
  /** Step the speakers are on right now, or -1 when stopped. */
  step: number;
  toggle: () => Promise<void>;
  stop: () => void;
};

/**
 * Play/stop and the playhead.
 *
 * The scheduler runs up to 120 ms ahead of the speakers, so its step callbacks
 * are queued with the audio time they will sound at and drained on animation
 * frames. Without that the highlight visibly leads the beat.
 */
export function useTransport(engine: AudioEngine, song: Song, onError: (message: string) => void): Transport {
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);

  const songRef = useLatest(song);
  const errorRef = useLatest(onError);
  const schedulerRef = useRef<Scheduler | null>(null);
  const queueRef = useRef<{ step: number; time: number }[]>([]);

  const stop = useCallback(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;
    queueRef.current = [];
    setPlaying(false);
    setStep(-1);
  }, []);

  const toggle = useCallback(async () => {
    if (schedulerRef.current) {
      stop();
      return;
    }
    try {
      const rig = await engine.getRig();
      const scheduler = createScheduler({
        ctx: rig.ctx,
        busFor: (kind) => rig.buses.get(kind) ?? rig.master.input,
        getSong: () => songRef.current,
        onStep: (at, time) => queueRef.current.push({ step: at, time }),
      });
      schedulerRef.current = scheduler;
      scheduler.start();
      setPlaying(true);
    } catch (error) {
      errorRef.current(error instanceof Error ? error.message : "Playback could not start.");
    }
  }, [engine, errorRef, songRef, stop]);

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
