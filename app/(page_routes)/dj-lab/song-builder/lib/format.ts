/** Small pure helpers for numbers and labels. */

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** `0.42` -> `42%`. */
export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
