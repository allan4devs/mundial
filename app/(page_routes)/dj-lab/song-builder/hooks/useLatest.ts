import { useEffect, useRef } from "react";

/**
 * Mirrors a value into a ref so callbacks can read the current one without
 * taking it as a dependency — which is what keeps the memoised rows from
 * re-rendering on every edit.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
