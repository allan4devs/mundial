/** Small pure helpers for numbers, labels and ids. */

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Parses a possibly-empty numeric input, falling back when blank or NaN. */
export function toNumber(raw: string, fallback: number) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && raw.trim() !== "" ? parsed : fallback;
}

/** `0.42` -> `42%`. */
export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

/** `1.85` -> `1.9s`. */
export function seconds(value: number) {
  return `${value.toFixed(1)}s`;
}

/** Collision-resistant enough for client-only ids, and readable in the DOM. */
export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
