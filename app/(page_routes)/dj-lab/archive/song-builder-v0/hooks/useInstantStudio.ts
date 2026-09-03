"use client";

import { useCallback, useState } from "react";

import { buildPeaks } from "../lib/dsp";
import { uid } from "../lib/format";
import { createLayer } from "../lib/layer";
import { GENRES, generateSong, type GenreId } from "../lib/songForge";
import { useLatest } from "./useLatest";
import type { Layer, Sample } from "../types";

export type InstantStudioOptions = {
  /** Project tempo, shared with the transport — generating snaps it to the genre. */
  bpm: number;
  setBpm: (bpm: number) => void;
  getCtx: () => Promise<AudioContext>;
  /** Hands the freshly forged pool + arrangement back to the studio. */
  onTrack: (samples: Sample[], layers: Layer[]) => void;
  onMessage: (text: string) => void;
};

type GenerateOverrides = {
  seed?: number;
  genre?: GenreId;
  rootPc?: number;
  bpm?: number;
};

const randomSeed = () => Math.floor(Math.random() * 1e9);

/**
 * The one-tap magic: synthesise a full locked track (drums / bass / chords / melody)
 * and drop it in as layers. No uploads involved.
 */
export function useInstantStudio({ bpm, setBpm, getCtx, onTrack, onMessage }: InstantStudioOptions) {
  const [genre, setGenre] = useState<GenreId>("lofi");
  const [rootPc, setRootPc] = useState(9); // A
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const settingsRef = useLatest({ genre, rootPc, bpm });
  const handlersRef = useLatest({ onTrack, onMessage, setBpm });

  /** Pick a genre and snap the BPM to its signature tempo. */
  const pickGenre = useCallback(
    (id: GenreId) => {
      setGenre(id);
      const def = GENRES.find((g) => g.id === id);
      if (def) handlersRef.current.setBpm(def.bpm);
    },
    [handlersRef],
  );

  const generate = useCallback(
    async (overrides: GenerateOverrides = {}) => {
      const { onTrack: applyTrack, onMessage: notify } = handlersRef.current;
      const current = settingsRef.current;
      const useGenre = overrides.genre ?? current.genre;
      const useRoot = overrides.rootPc ?? current.rootPc;
      const useBpm = overrides.bpm ?? current.bpm;

      setGenerating(true);
      notify("Forging your track — drums, bass, chords and melody, all locked to the grid…");
      try {
        const ctx = await getCtx();
        const result = await generateSong({
          sampleRate: ctx.sampleRate,
          genre: useGenre,
          rootPc: useRoot,
          bpm: useBpm,
          seed: overrides.seed,
        });

        const samples: Sample[] = result.loops.map((loop) => ({
          id: uid(`gen-${loop.role}`),
          name: loop.name,
          buffer: loop.buffer,
          peaks: buildPeaks(loop.buffer),
          color: loop.color,
          duration: loop.buffer.duration,
          generated: true,
        }));
        // Generated loops are whole bars, so each layer takes its sample end to end.
        const layers: Layer[] = samples.map((sample, i) =>
          createLayer(i, {
            name: sample.name,
            color: sample.color,
            sample,
            sourceBpm: useBpm,
            clip: "whole",
          }),
        );

        applyTrack(samples, layers);
        setHasGenerated(true);
        const label = GENRES.find((g) => g.id === useGenre)?.name ?? "Track";
        notify(`${label} in ${result.keyLabel} · ${result.bpm} BPM. Tweak any layer, or bounce it to a WAV.`);
      } catch (e) {
        notify(e instanceof Error ? `Generation failed: ${e.message}` : "Generation failed.");
      } finally {
        setGenerating(false);
      }
    },
    [getCtx, handlersRef, settingsRef],
  );

  /** Random genre, key and variation. */
  const surprise = useCallback(() => {
    const def = GENRES[Math.floor(Math.random() * GENRES.length)];
    const root = Math.floor(Math.random() * 12);
    setGenre(def.id);
    setRootPc(root);
    handlersRef.current.setBpm(def.bpm);
    void generate({ genre: def.id, rootPc: root, bpm: def.bpm, seed: randomSeed() });
  }, [generate, handlersRef]);

  /** Same vibe, fresh chords and melody. */
  const remix = useCallback(() => {
    void generate({ seed: randomSeed() });
  }, [generate]);

  return {
    genre,
    rootPc,
    setRootPc,
    generating,
    hasGenerated,
    pickGenre,
    generate,
    surprise,
    remix,
  };
}
