"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `callback` once per frame while `active`. The callback is read from a ref,
 * so changing it does not tear down and restart the loop.
 */
export function useAnimationFrame(active: boolean, callback: () => void) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      cbRef.current();
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [active]);
}
