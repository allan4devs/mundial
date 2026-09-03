"use client";

import { useCallback, useRef, useState } from "react";

import { normalizeHits } from "@/lib/song-builder/pattern";
import { loopSeconds, stepSeconds, type Hit, type Song, type TrackKind } from "@/lib/song-builder/types";
import { analyzeVoice, detectOnsets, quantizeHits, sampleEnvelope, type VoiceAnalysis } from "../lib/analyze";
import { decodeBlob } from "../lib/audio";
import { COUNT_IN_BEATS, TAKE_TAIL_SECONDS } from "../lib/constants";
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

export type RecorderDeps = {
  engine: AudioEngine;
  song: Song;
  sensitivity: number;
  onHits: (kind: TrackKind, hits: Hit[]) => void;
  onMessage: (message: string) => void;
};

export type Recorder = {
  state: RecorderState;
  /** Counts in, records one loop, and reports the decoded hits. */
  record: (kind: TrackKind) => Promise<void>;
  /** Re-runs peak picking over the take already in memory, at the current sensitivity. */
  redecode: (kind: TrackKind) => void;
  /** Loudness preview of each row's take, one bar per step, for drawing under the grid. */
  envelopes: Partial<Record<TrackKind, number[]>>;
  hasTake: (kind: TrackKind) => boolean;
  cancel: () => void;
};

/**
 * The microphone side of the studio.
 *
 * A take is: four metronome beats, then exactly one loop of recording, then the
 * decoder. Only the *analysis* is kept afterwards - never the audio - so
 * re-decoding at a new sensitivity is instant and nothing large is held per row.
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
  const activeRef = useRef<{ recorder: MediaRecorder; stream: MediaStream } | null>(null);

  const decode = useCallback(
    (kind: TrackKind, take: { analysis: VoiceAnalysis; offset: number }) => {
      const song = songRef.current;
      const onsets = detectOnsets(take.analysis, sensitivityRef.current);
      const hits = normalizeHits(
        quantizeHits(onsets, song.steps, stepSeconds(song.bpm), take.offset),
        song.steps,
      );
      setEnvelopes((current) => ({
        ...current,
        [kind]: [...sampleEnvelope(take.analysis, song.steps)],
      }));
      onHitsRef.current(kind, hits);
      return hits.length;
    },
    [onHitsRef, sensitivityRef, songRef],
  );

  const cancel = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    activeRef.current = null;
    active.recorder.onstop = null;
    if (active.recorder.state !== "inactive") active.recorder.stop();
    for (const track of active.stream.getTracks()) track.stop();
    setState(IDLE);
  }, []);

  const record = useCallback(
    async (kind: TrackKind) => {
      if (activeRef.current) return;

      let stream: MediaStream | null = null;
      try {
        const rig = await deps.engine.getRig();
        // The browser's voice processing smears transients, which is exactly what
        // the onset detector is looking for - so ask for the raw signal.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });

        const recorder = new MediaRecorder(stream, pickRecorderOptions());
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        activeRef.current = { recorder, stream };

        const live = () => activeRef.current?.recorder === recorder;
        const song = songRef.current;
        const countInEnd = scheduleCountIn({
          ctx: rig.ctx,
          out: rig.master.input,
          bpm: song.bpm,
          beats: COUNT_IN_BEATS,
        });
        await runPhase(rig.ctx, countInEnd, live, (remaining) =>
          setState({ phase: "countIn", kind, remaining }),
        );
        if (!live()) return;

        // A tail past the last step, so a hit right on the loop boundary is caught.
        recorder.start();
        // Whatever the timer overshot the count-in by, the take starts that much
        // late against the grid — the decoder takes it back out.
        const offset = rig.ctx.currentTime - countInEnd;
        const length = loopSeconds(song.bpm, song.steps) + TAKE_TAIL_SECONDS;
        await runPhase(rig.ctx, rig.ctx.currentTime + length, live, (remaining) =>
          setState({ phase: "recording", kind, remaining }),
        );
        if (!live()) return;

        setState({ phase: "decoding", kind, remaining: 0 });
        const blob = await stopRecorder(recorder, chunks);
        const take = { analysis: analyzeVoice(await decodeBlob(rig.ctx, blob)), offset };
        takesRef.current.set(kind, take);

        const found = decode(kind, take);
        onMessageRef.current(
          found > 0
            ? `Decoded ${found} hit${found === 1 ? "" : "s"}. Drag Sensitivity if it heard too few or too many.`
            : "Nothing came through. Get closer to the mic, or raise Sensitivity and re-decode.",
        );
      } catch (error) {
        onMessageRef.current(microphoneMessage(error));
      } finally {
        for (const track of stream?.getTracks() ?? []) track.stop();
        activeRef.current = null;
        setState(IDLE);
      }
    },
    [decode, deps.engine, onMessageRef, songRef],
  );

  const redecode = useCallback(
    (kind: TrackKind) => {
      const take = takesRef.current.get(kind);
      if (!take) return;
      const found = decode(kind, take);
      onMessageRef.current(`Re-decoded that take into ${found} hit${found === 1 ? "" : "s"}.`);
    },
    [decode, onMessageRef],
  );

  const hasTake = useCallback((kind: TrackKind) => takesRef.current.has(kind), []);

  return { state, record, redecode, envelopes, hasTake, cancel };
}

/**
 * Waits out one phase on the audio clock.
 *
 * The countdown ticks slowly because it only feeds a label, while the phase ends
 * on its own timeout — a 100 ms display interval would otherwise put up to a
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

function stopRecorder(recorder: MediaRecorder, chunks: Blob[]) {
  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
    recorder.stop();
  });
}

/** Chrome and Firefox prefer Opus; Safari ignores the hint and records MP4. */
function pickRecorderOptions(): MediaRecorderOptions | undefined {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("This browser cannot record audio. Try Chrome, Edge or Firefox.");
  }
  return MediaRecorder.isTypeSupported("audio/webm") ? { mimeType: "audio/webm" } : undefined;
}

function microphoneMessage(error: unknown) {
  if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError")) {
    return "The microphone is blocked. Allow it in the address bar and try again.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone found. Plug one in and try again.";
  }
  return error instanceof Error ? error.message : "The take could not be recorded.";
}
