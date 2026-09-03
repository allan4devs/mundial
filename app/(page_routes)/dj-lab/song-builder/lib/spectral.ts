/** Construction and reshaping of a layer's `Spectral` settings. */

import { DEFAULT_BANDS } from "./constants";
import type { Spectral } from "../types";

export function makeSpectral(bands = DEFAULT_BANDS): Spectral {
  return {
    enabled: false,
    bands,
    tiltDb: 0,
    focusHz: 1000,
    focusAmtDb: 0,
    focusWidthOct: 1,
    bandDb: Array.from({ length: bands }, () => 0),
    bandOn: Array.from({ length: bands }, () => true),
  };
}

/** Stretches the per-band arrays onto a new band count, keeping the shape the user drew. */
export function resizeSpectral(sp: Spectral, bands: number): Spectral {
  const remap = <T,>(src: T[], fallback: T) =>
    Array.from({ length: bands }, (_, i) => {
      const j = Math.round((i / Math.max(1, bands - 1)) * (src.length - 1));
      return src[j] ?? fallback;
    });
  return { ...sp, bands, bandDb: remap(sp.bandDb, 0 as number), bandOn: remap(sp.bandOn, true as boolean) };
}

/** Back to a flat response with every band audible. */
export function flattenSpectral(sp: Spectral): Partial<Spectral> {
  return {
    tiltDb: 0,
    focusAmtDb: 0,
    bandDb: sp.bandDb.map(() => 0),
    bandOn: sp.bandOn.map(() => true),
  };
}

/** Immutable single-index updates for the two per-band arrays. */
export function withBandDb(sp: Spectral, index: number, db: number): Partial<Spectral> {
  const bandDb = sp.bandDb.slice();
  bandDb[index] = db;
  return { bandDb };
}

export function withBandToggled(sp: Spectral, index: number): Partial<Spectral> {
  const bandOn = sp.bandOn.slice();
  bandOn[index] = !bandOn[index];
  return { bandOn };
}
