"use client";

import { useCallback, useEffect, useState } from "react";

import type { Style, StylePack } from "@/lib/song-builder/types";
import { useLatest } from "./useLatest";

export type StyleLoader = {
  style: Style;
  /** The pack in play. Stays on the old one while a new style loads. */
  pack: StylePack | null;
  loading: boolean;
  select: (style: Style) => void;
};

/**
 * Fetches a style pack from Mongo - its tuning and every sound each row can be
 * played through. The old pack stays in place while a new one loads, so
 * switching style never leaves the studio silent.
 */
export function useStylePack(initial: Style, onMessage: (message: string) => void): StyleLoader {
  const [style, setStyle] = useState<Style>(initial);
  const [pack, setPack] = useState<StylePack | null>(null);
  const [loading, setLoading] = useState(true);

  const onMessageRef = useLatest(onMessage);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const response = await fetch(`/api/dj-lab/sounds?style=${style}`);
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error ?? `The sound library replied ${response.status}.`);
        if (!cancelled) setPack(body.pack as StylePack);
      } catch (error) {
        if (!cancelled) {
          onMessageRef.current(
            error instanceof Error ? error.message : "The sound library is unavailable.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onMessageRef, style]);

  return { style, pack, loading, select: useCallback((next: Style) => setStyle(next), []) };
}
