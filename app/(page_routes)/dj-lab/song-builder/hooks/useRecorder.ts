"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeHits } from "@/lib/song-builder/pattern";
import {
  STEPS,
  loopSeconds,
  stepSeconds,
  type Hit,
  type Song,
  type TrackKind,
} from "@/lib/song-builder/types";
import { analyzeVoice, detectOnsets, quantizeHits, sampleEnvelope, type VoiceAnalysis } from "../lib/analyze";
import { decodeBlob } from "../lib/audio";
import { COUNT_IN_BEATS, TAKE_TAIL_SECONDS } from "../lib/constants";
import { captureStream, closeMic, micMessage, openMic, type Capture } from "../lib/mic";
import { scheduleCountIn } from "../lib/scheduler";
import type { AudioEngine } from "./useAudioEngine";
import { useLatest } from "./useLatest";

export type RecorderPhase = "idle" | "countIn" | "recording" | "decoding";

export type RecorderState = {
  phase: RecorderPhase;
  /** The row being recorded, or null when idle. */
  kind: TrackKind | null;
  /** Seconds left in the current phase. */
  remaining: number;
};

const IDLE: RecorderState = { phase: "idle", kind: null, remaining: 0 };

/** The take in flight. `capture` is null until the count-in ends and the mic opens. */
type Live = { stream: MediaStream; capture: Capture | null };

type RecorderDeps = {
  engine: AudioEngine;
  song: Song | null;
  sensitivity: number;
  onHits: (kind: TrackKind, hits: Hit[]) => void;
  onMessage: (message: string) => void;
};

export type Recorder = {
  state: RecorderState;
  /** Counts in, records one loop, and reports the decoded hits. */
  record: (kind: TrackKind) => Promise<void>;
  /** Loudness preview of each row's take, one bar per step, for drawing under the grid. */
  envelopes: Partial<Record<TrackKind, number[]>>;
  cancel: () => void;
};

/**
 * The microphone side of the studio - the voice commander.
 *
 * A take is: four metronome beats, then exactly one loop of recording, then the
 * decoder. Only the *analysis* is kept afterwards - never the audio - which is
 * what lets the Sensitivity slider re-read every take live, with no per-row
 * button to press.
 */
export function useRecorder(deps: RecorderDeps): Recorder {
  const [state, setState] = useState<RecorderState>(IDLE);
  const [envelopes, setEnvelopes] = useState<Partial<Record<TrackKind, number[]>>>({});

  const songRef = useLatest(deps.song);
  const sensitivityRef = useLatest(deps.sensitivity);
  const onHitsRef = useLatest(deps.onHits);
  const onMessageRef = useLatest(deps.onMessage);

  /** The analysis of each row's take, plus how late that take started against the grid. */
  const takesRef = useRef(new Map<TrackKind, { analysis: VoiceAnalysis; offset: number }>());
  const activeRef = useRef<Live | null>(null);

  const decode = useCallback(
    (kind: TrackKind, take: { analysis: VoiceAnalysis; offset: number }) => {
      const song = songRef.current;
      if (!song) return 0;
      const onsets = detectOnsets(take.analysis, sensitivityRef.current);
      const hits = normalizeHits(quantizeHits(onsets, stepSeconds(song.bpm), take.offset));
      onHitsRef.current(kind, hits);
      return hits.length;
    },
    [onHitsRef, sensitivityRef, songRef],
  );

  // One knob, applied everywhere: moving Sensitivity re-reads every take that is
  // still in memory, so there is nothing per-row to press afterwards.
  useEffect(() => {
    for (const [kind, take] of takesRef.current) decode(kind, take);
  }, [decode, deps.sensitivity]);

  const cancel = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    activeRef.current = null;
    active.capture?.abort();
    closeMic(active.stream);
    setState(IDLE);
  }, []);

  const record = useCallback(
    async (kind: TrackKind) => {
      const song = songRef.current;
      if (activeRef.current || !song) return;

      let stream: MediaStream | null = null;
      let active: Live | null = null;
      try {
        const rig = await deps.engine.getRig();
        stream = await openMic("beatbox");
        active = { stream, capture: null };
        activeRef.current = active;

        const live = () => activeRef.current === active;
        const countInEnd = scheduleCountIn({
          ctx: rig.ctx,
          out: rig.master,
          bpm: song.bpm,
          beats: COUNT_IN_BEATS,
        });
        await runPhase(rig.ctx, countInEnd, live, (remaining) =>
          setState({ phase: "countIn", kind, remaining }),
        );
        if (!live()) return;

        // The mic only opens now, on the downbeat - the count-in is heard, never
        // recorded. Whatever the timer overshot it by, the take starts that much
        // late against the grid, and the decoder takes it back out.
        active.capture = captureStream(stream);
        const offset = rig.ctx.currentTime - countInEnd;
        // A tail past the last step, so a hit right on the loop boundary is caught.
        const length = loopSeconds(song.bpm) + TAKE_TAIL_SECONDS;
        await runPhase(rig.ctx, rig.ctx.currentTime + length, live, (remaining) =>
          setState({ phase: "recording", kind, remaining }),
        );
        if (!live()) return;

        setState({ phase: "decoding", kind, remaining: 0 });
        const blob = await active.capture.stop();
        const take = { analysis: analyzeVoice(await decodeBlob(rig.ctx, blob)), offset };
        takesRef.current.set(kind, take);
        setEnvelopes((current) => ({ ...current, [kind]: [...sampleEnvelope(take.analysis, STEPS)] }));

        const found = decode(kind, take);
        onMessageRef.current(
          found > 0
            ? `Decoded ${found} hit${found === 1 ? "" : "s"}. Drag Sensitivity if it heard too few or too many.`
            : "Nothing came through. Get closer to the mic, or raise Sensitivity.",
        );
      } catch (error) {
        onMessageRef.current(micMessage(error));
      } finally {
        closeMic(stream);
        // Guarded, so a take that was cancelled - and replaced - does not reset
        // the state of the one that took its place.
        if (activeRef.current === active) {
          activeRef.current = null;
          setState(IDLE);
        }
      }
    },
    [decode, deps.engine, onMessageRef, songRef],
  );

  return { state, record, envelopes, cancel };
}

/**
 * Waits out one phase on the audio clock.
 *
 * The countdown ticks slowly because it only feeds a label, while the phase ends
 * on its own timeout - a 100 ms display interval would otherwise put up to a
 * tenth of a second of slop between the count-in and the take. Resolves early
 * once `isActive` goes false, so cancelling stops the countdown immediately.
 */
function runPhase(
  ctx: AudioContext,
  endTime: number,
  isActive: () => boolean,
  onTick: (remaining: number) => void,
) {
  return new Promise<void>((resolve) => {
    const left = () => Math.max(0, endTime - ctx.currentTime);
    const settle = () => {
      clearInterval(display);
      clearTimeout(finish);
      resolve();
    };

    const display = setInterval(() => (isActive() ? onTick(left()) : settle()), 100);
    const finish = setTimeout(() => {
      if (isActive()) onTick(0);
      settle();
    }, left() * 1000);

    onTick(left());
  });
}
