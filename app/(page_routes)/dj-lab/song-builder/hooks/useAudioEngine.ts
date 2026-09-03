"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { TRACK_KINDS, type Song, type TrackKind } from "@/lib/song-builder/types";
import { createMasterBus, getAudioContext, type MasterBus } from "../lib/audio";
import { RAMP_SECONDS } from "../lib/constants";
import { useLatest } from "./useLatest";

/** Everything the studio needs a live `AudioContext` for, built once on first use. */
export type Rig = {
  ctx: AudioContext;
  master: MasterBus;
  /** One gain node per row, permanently wired into the master bus. */
  buses: Map<TrackKind, GainNode>;
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
 * Owns the audio graph. Row gains and the master level are pushed into the graph
 * by effects rather than rebuilt, so a fader move never interrupts a ringing note.
 */
export function useAudioEngine(song: Song, masterLevel: number): AudioEngine {
  const rigRef = useRef<Rig | null>(null);
  // The rig is built lazily, long after mount, so it reads levels off refs
  // instead of taking them as dependencies and rebuilding itself.
  const songRef = useLatest(song);
  const masterRef = useLatest(masterLevel);

  const getRig = useCallback(async () => {
    const ctx = await getAudioContext();
    if (rigRef.current) return rigRef.current;

    const master = createMasterBus(ctx, masterRef.current);
    const buses = new Map<TrackKind, GainNode>();
    for (const kind of TRACK_KINDS) {
      const track = songRef.current.tracks.find((candidate) => candidate.kind === kind);
      const bus = ctx.createGain();
      bus.gain.value = !track || track.muted ? 0 : track.gain;
      bus.connect(master.input);
      buses.set(kind, bus);
    }

    rigRef.current = { ctx, master, buses };
    return rigRef.current;
  }, [masterRef, songRef]);

  const peekRig = useCallback(() => rigRef.current, []);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;
    rig.master.gain.gain.setTargetAtTime(masterLevel, rig.ctx.currentTime, RAMP_SECONDS);
  }, [masterLevel]);

  useEffect(() => {
    const rig = rigRef.current;
    if (!rig) return;
    for (const track of song.tracks) {
      const bus = rig.buses.get(track.kind);
      bus?.gain.setTargetAtTime(track.muted ? 0 : track.gain, rig.ctx.currentTime, RAMP_SECONDS);
    }
  }, [song.tracks]);

  // Held stable: the recorder and the transport take the engine as a dependency,
  // and a fresh object every render would re-create every callback below them.
  return useMemo(() => ({ getRig, peekRig }), [getRig, peekRig]);
}
