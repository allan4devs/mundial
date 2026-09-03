"use client";

import { useEffect, useState } from "react";

import { computeSpectrogram } from "../lib/spectrogram";
import { useLatest } from "./useLatest";
import type { Layer, Sample, Spectrogram } from "../types";

/** Debounce before analysing, so dragging a chop handle does not run an FFT per frame. */
const ANALYSE_DELAY_MS = 45;

/**
 * Recomputes the focused layer's spectrogram whenever its clip window changes,
 * off the drag path and cancellable.
 */
export function useSpectrogram(layer: Layer | null, sample: Sample | null) {
  const [spectro, setSpectro] = useState<Spectrogram | null>(null);
  const [busy, setBusy] = useState(false);

  const sampleRef = useLatest(sample);
  const windowRef = useLatest({ start: layer?.clipStart ?? 0, end: layer?.clipEnd ?? 0 });
  const key = sample && layer ? `${sample.id}:${layer.clipStart}:${layer.clipEnd}` : "";

  useEffect(() => {
    const source = sampleRef.current;
    if (!key || !source) {
      setSpectro(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const { start, end } = windowRef.current;
        const result = computeSpectrogram(source.buffer, start, end);
        if (!cancelled) setSpectro(result);
      } catch {
        if (!cancelled) setSpectro(null);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, ANALYSE_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, sampleRef, windowRef]);

  return { spectro, spectroBusy: busy };
}
