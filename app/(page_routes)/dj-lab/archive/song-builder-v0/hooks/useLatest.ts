"use client";

import { useRef } from "react";

/**
 * Keeps a ref pointed at the newest value so long-lived callbacks (rAF loops,
 * audio scheduling) can read fresh state without being re-created every render.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
