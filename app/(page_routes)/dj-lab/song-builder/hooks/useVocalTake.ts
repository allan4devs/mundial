"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { decodeBlob } from "../lib/audio";
import { TAKE_TAIL_SECONDS } from "../lib/constants";
import { captureStream, closeMic, micMessage, openMic, type Capture } from "../lib/mic";
import { createTakeChain, type TakeChain } from "../lib/mix";
import { encodeWav } from "../lib/wav";
import { useLatest } from "./useLatest";
import type { AudioEngine } from "./useAudioEngine";
import type { Transport, VoiceTake } from "./useTransport";

/** A finished mix, held only as a link the browser can save. */
export type Take = {
  url: string;
  filename: string;
};

export type VocalTake = {
  recording: boolean;
  /** The last finished take, until the next one replaces it. */
  take: Take | null;
  /** Sings over the loop, or finishes the take that is already running. */
  toggle: () => Promise<void>;
  /** Finishes a take in flight. A no-op otherwise, so anything that stops the loop can call it. */
  finish: () => Promise<void>;
};

type VocalTakeDeps = {
  engine: AudioEngine;
  /** The loop the take is sung over - this hook runs it, so the two can never drift apart. */
  transport: Transport;
  /** Where the finished vocal is left for the transport to play back over the loop. */
  voice: RefObject<VoiceTake | null>;
  /** Base name for the file, without an extension. */
  name: string;
  onMessage: (message: string) => void;
};

/** The graph a take builds on top of the band, torn down again when it ends. */
type Live = {
  ctx: AudioContext;
  /** Rumble filter, de-esser, compressor, presence and a plate - see `lib/mix.ts`. */
  chain: TakeChain;
  stream: MediaStream;
  /** Band and voice together - the thing that downloads. */
  mix: Capture;
  /** The voice on its own, so Play can put it back over a loop that is already sounding. */
  solo: Capture;
  /** Audio time the mics opened at, until the downbeat is known and it becomes the offset. */
  openedAt: number;
  offset: number;
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
 *
 * Starting the loop is part of the take rather than something the caller has to
 * remember, which is what keeps "Sing" one button instead of a sequence.
 *
 * Two recorders run at once, and they are not redundant. The mix is band plus
 * voice and becomes the file. The solo is the voice alone, which is the only
 * thing that can be played back *over* a live loop without doubling the band.
 */
export function useVocalTake(deps: VocalTakeDeps): VocalTake {
  const [recording, setRecording] = useState(false);
  const [take, setTake] = useState<Take | null>(null);

  const nameRef = useLatest(deps.name);
  const transportRef = useLatest(deps.transport);
  const takeRef = useLatest(take);
  const onMessageRef = useLatest(deps.onMessage);
  const activeRef = useRef<Live | null>(null);

  const begin = useCallback(async () => {
    if (activeRef.current) return;

    let stream: MediaStream | null = null;
    try {
      const rig = await deps.engine.getRig();
      stream = await openMic("sing");

      const chain = createTakeChain(rig.ctx, rig.output, rig.ctx.createMediaStreamSource(stream));

      // A previous vocal must not bleed into this one: clearing it before the
      // transport starts is what makes re-singing a take replace it, not layer.
      deps.voice.current = null;

      const active: Live = {
        ctx: rig.ctx,
        chain,
        stream,
        mix: captureStream(chain.stream),
        solo: captureStream(chain.voiceStream),
        openedAt: rig.ctx.currentTime,
        offset: 0,
      };
      activeRef.current = active;
      setRecording(true);
      onMessageRef.current("Mic is open over the loop. Headphones keep the band out of your voice.");

      // From the top, so the take opens on the downbeat of a fresh loop. The gap
      // between the mic opening and that downbeat is what playback trims off.
      transportRef.current.stop();
      const downbeat = await transportRef.current.toggle();
      active.offset = downbeat === null ? 0 : downbeat - active.openedAt;
    } catch (error) {
      // Half a take is worse than none: drop the graph rather than leave a
      // capture running with no way to press Finish.
      activeRef.current?.mix.abort();
      activeRef.current?.solo.abort();
      activeRef.current = null;
      setRecording(false);
      closeMic(stream);
      onMessageRef.current(micMessage(error));
    }
  }, [deps.engine, deps.voice, onMessageRef, transportRef]);

  const finish = useCallback(async () => {
    const active = activeRef.current;
    if (!active) return;
    activeRef.current = null;
    setRecording(false);
    transportRef.current.stop();

    // The scheduler's last notes are already on the audio clock. Hold the file
    // open for their decay, or every take ends on a chopped-off chord.
    await new Promise((resolve) => setTimeout(resolve, TAKE_TAIL_SECONDS * 1000));
    const [mixBlob, soloBlob] = await Promise.all([active.mix.stop(), active.solo.stop()]);
    closeMic(active.stream);
    active.chain.dispose();

    try {
      const [mixed, solo] = await Promise.all([
        decodeBlob(active.ctx, mixBlob),
        decodeBlob(active.ctx, soloBlob),
      ]);
      deps.voice.current = { buffer: solo, offset: active.offset };

      const url = URL.createObjectURL(encodeWav(mixed));
      setTake((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url, filename: `${nameRef.current}.wav` };
      });
      onMessageRef.current(
        `Take ready — ${mixed.duration.toFixed(1)}s. Press Play to hear the song with your voice, ` +
          `or Download to keep it. Nothing here survives a reload.`,
      );
    } catch {
      onMessageRef.current("That take came out empty. Check the microphone and sing another one.");
    }
  }, [deps.voice, nameRef, onMessageRef, transportRef]);

  const toggle = useCallback(
    async () => (activeRef.current ? finish() : begin()),
    [begin, finish],
  );

  // Leaving the page mid-take would otherwise hold the microphone open.
  useEffect(
    () => () => {
      const active = activeRef.current;
      activeRef.current = null;
      if (active) {
        active.mix.abort();
        active.solo.abort();
        closeMic(active.stream);
      }
      if (takeRef.current) URL.revokeObjectURL(takeRef.current.url);
    },
    [takeRef],
  );

  return { recording, take, toggle, finish };
}
