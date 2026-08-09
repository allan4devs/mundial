"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `callback` every `delay` ms without restarting the timer when the
 * callback identity changes. Pass `null` to pause.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || delay <= 0) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export default useInterval;
