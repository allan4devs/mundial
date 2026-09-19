"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createLimiter, decodeBlob } from "../lib/audio";
import { captureStream, closeMic, micMessage, openMic, type Capture } from "../lib/mic";
import { encodeWav } from "../lib/wav";
import { useLatest } from "./useLatest";
import type { AudioEngine } from "./useAudioEngine";

/** A finished mix, held only as a link the browser can save. */
export type Take = {
  url: string;
  filename: string;
};

export type VocalTake = {
  recording: boolean;
  /** The last finished take, until the next one replaces it. */
  take: Take | null;
  /** Opens the mic onto the master bus. True once it is running - the caller starts the loop. */
  start: () => Promise<boolean>;
  /** Closes the mic and renders the mix. A no-op when nothing is recording. */
  stop: () => Promise<void>;
};

type VocalTakeDeps = {
  engine: AudioEngine;
  /** Base name for the file, without an extension. */
  name: string;
  onMessage: (message: string) => void;
};

/** The graph a take builds on top of the band, torn down again when it ends. */
type Live = {
  ctx: AudioContext;
  band: AudioNode;
  voice: MediaStreamAudioSourceNode;
  bus: DynamicsCompressorNode;
  stream: MediaStream;
  capture: Capture;
};

/**
 * Singing over the loop.
 *
 * The band and the microphone meet on one destination and go straight to a file,
 * so what downloads is what the room heard. The mic is never routed back to the
 * speakers - that is a feedback loop - which is why the take is mixed off the
 * master bus rather than recorded through the air.
 *
 * This is the one place in the studio that keeps audio. It keeps it as an object
 * URL and nothing more: reload the page and the take is gone, same as the song.
 */
export function useVocalTake(deps: VocalTakeDeps): VocalTake {
  const [recording, setRecording] = useState(false);
  const [take, setTake] = useState<Take | null>(null);

  const nameRef = useLatest(deps.name);
  const takeRef = useLatest(take);
  const onMessageRef = useLatest(deps.onMessage);
  const activeRef = useRef<Live | null>(null);

  const start = useCallback(async () => {
    if (activeRef.current) return false;

    let stream: MediaStream | null = null;
    try {
      const rig = await deps.engine.getRig();
      stream = await openMic("sing");

      const bus = createLimiter(rig.ctx);
      const mix = rig.ctx.createMediaStreamDestination();
      const voice = rig.ctx.createMediaStreamSource(stream);
      voice.connect(bus);
      rig.output.connect(bus);
      bus.connect(mix);

      activeRef.current = {
        ctx: rig.ctx,
        band: rig.output,
        voice,
        bus,
        stream,
        capture: captureStream(mix.stream),
      };
      setRecording(true);
      return true;
    } catch (error) {
      closeMic(stream);
      onMessageRef.current(micMessage(error));
      return false;
    }
  }, [deps.engine, onMessageRef]);

  const stop = useCallback(async () => {
    const active = activeRef.current;
    if (!active) return;
    activeRef.current = null;
    setRecording(false);

    const blob = await active.capture.stop();
    closeMic(active.stream);
    active.voice.disconnect();
    active.band.disconnect(active.bus);
    active.bus.disconnect();

    try {
      const buffer = await decodeBlob(active.ctx, blob);
      const url = URL.createObjectURL(encodeWav(buffer));
      setTake((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url, filename: `${nameRef.current}.wav` };
      });
      onMessageRef.current(
        `Take ready — ${buffer.duration.toFixed(1)}s. Download it now; nothing here survives a reload.`,
      );
    } catch {
      onMessageRef.current("That take came out empty. Check the microphone and sing another one.");
    }
  }, [nameRef, onMessageRef]);

  // Leaving the page mid-take would otherwise hold the microphone open.
  useEffect(
    () => () => {
      const active = activeRef.current;
      activeRef.current = null;
      if (active) {
        active.capture.abort();
        closeMic(active.stream);
      }
      if (takeRef.current) URL.revokeObjectURL(takeRef.current.url);
    },
    [takeRef],
  );

  return { recording, take, start, stop };
}
