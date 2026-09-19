"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { TRACK_KINDS, type Song, type StylePack, type TrackKind } from "@/lib/song-builder/types";
import { applyStrip, createStrip, getAudioContext, type Strip } from "../lib/audio";
import { applySpace, createMasterBus, type MasterBus } from "../lib/mix";
import { soundFor } from "../lib/session";
import { useLatest } from "./useLatest";

/** Everything the studio needs a live `AudioContext` for, built once on first use. */
export type Rig = {
  ctx: AudioContext;
  /** One channel strip per row, permanently wired into the master bus. */
  strips: Map<TrackKind, Strip>;
  /** The desk: the dry bus, the two effect buses, and the output tap. */
  bus: MasterBus;
  /** Where the count-in metronome goes - straight in, past the sends. */
  master: AudioNode;
  /** The end of the master chain - what a sung take records the band off. */
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
 * Ten strips are built once and only ever retuned, so switching sound or style
 * never interrupts a ringing note - the amplifier, the EQ, the pan and both
 * sends just move. The room moves the same way: `applySpace` retunes the
 * convolver and the delay in place rather than rebuilding the bus, which is what
 * lets a style change be seamless instead of a gap.
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

    const bus = createMasterBus(ctx);
    const strips = new Map<TrackKind, Strip>();
    const currentPack = packRef.current;
    const currentSong = songRef.current;

    for (const kind of TRACK_KINDS) {
      const strip = createStrip(ctx, bus);
      const track = currentSong?.tracks.find((candidate) => candidate.kind === kind);
      if (currentPack && track) applyStrip(ctx, strip, soundFor(currentPack, kind, track.soundId), track.muted);
      strips.set(kind, strip);
    }
    if (currentPack && currentSong) applySpace(ctx, bus, currentPack.space, currentSong.bpm);

    rigRef.current = { ctx, strips, bus, master: bus.input, output: bus.output };
    return rigRef.current;
  }, [packRef, songRef]);

  const peekRig = useCallback(() => rigRef.current, []);

  // Retune every strip whenever a row changes sound, is silenced, or the whole
  // pack changes. Mute lands here rather than in the scheduler so it also catches
  // an auditioned step and the notes already handed to the audio clock.
  useEffect(() => {
    const rig = rigRef.current;
    if (!rig || !song || !pack) return;
    for (const track of song.tracks) {
      const strip = rig.strips.get(track.kind);
      if (strip) applyStrip(rig.ctx, strip, soundFor(pack, track.kind, track.soundId), track.muted);
    }
    // The delay is set in sixteenths, so the tempo is part of the room.
    applySpace(rig.ctx, rig.bus, pack.space, song.bpm);
  }, [pack, song]);

  // Held stable: the recorder and the transport take the engine as a dependency,
  // and a fresh object every render would re-create every callback below them.
  return useMemo(() => ({ getRig, peekRig }), [getRig, peekRig]);
}
