"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { TRACK_KINDS, type Song, type StylePack, type TrackKind } from "@/lib/song-builder/types";
import { applyStrip, createMasterBus, createStrip, getAudioContext, type Strip } from "../lib/audio";
import { soundFor } from "../lib/session";
import { useLatest } from "./useLatest";

/** Everything the studio needs a live `AudioContext` for, built once on first use. */
export type Rig = {
  ctx: AudioContext;
  /** One channel strip per row, permanently wired into the master bus. */
  strips: Map<TrackKind, Strip>;
  /** Where the count-in metronome goes. */
  master: AudioNode;
  /** The end of the master bus - what a sung take records the band off. */
  output: AudioNode;
};

export type AudioEngine = {
  /**
   * Builds the rig on first call and resumes the context. Every entry point that
   * makes sound awaits this, because browsers only start audio inside a gesture.
   */
  getRig: () => Promise<Rig>;
  /** The rig if it already exists - for callbacks that must not go async. */
  peekRig: () => Rig | null;
};

/**
 * Owns the audio graph.
 *
 * Each row gets a strip once and is only ever retuned, so switching sound or
 * style never interrupts a ringing note - the amplifier and EQ just move.
 */
export function useAudioEngine(song: Song | null, pack: StylePack | null): AudioEngine {
  const rigRef = useRef<Rig | null>(null);
  // The rig is built lazily, long after mount, so it reads the current song off
  // a ref instead of taking it as a dependency and rebuilding itself.
  const songRef = useLatest(song);
  const packRef = useLatest(pack);

  const getRig = useCallback(async () => {
    const ctx = await getAudioContext();
    if (rigRef.current) return rigRef.current;

    const master = createMasterBus(ctx);
    const strips = new Map<TrackKind, Strip>();
    for (const kind of TRACK_KINDS) {
      const strip = createStrip(ctx, master.input);
      const currentPack = packRef.current;
      const track = songRef.current?.tracks.find((candidate) => candidate.kind === kind);
      if (currentPack && track) applyStrip(ctx, strip, soundFor(currentPack, kind, track.soundId));
      strips.set(kind, strip);
    }

    rigRef.current = { ctx, strips, master: master.input, output: master.output };
    return rigRef.current;
  }, [packRef, songRef]);

  const peekRig = useCallback(() => rigRef.current, []);

  // Retune every strip whenever a row changes sound, or the whole pack changes.
  useEffect(() => {
    const rig = rigRef.current;
    if (!rig || !song || !pack) return;
    for (const track of song.tracks) {
      const strip = rig.strips.get(track.kind);
      if (strip) applyStrip(rig.ctx, strip, soundFor(pack, track.kind, track.soundId));
    }
  }, [pack, song]);

  // Held stable: the recorder and the transport take the engine as a dependency,
  // and a fresh object every render would re-create every callback below them.
  return useMemo(() => ({ getRig, peekRig }), [getRig, peekRig]);
}
