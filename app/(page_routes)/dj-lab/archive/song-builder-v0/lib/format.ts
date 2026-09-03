/** Small pure helpers for numbers, labels and ids. */

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Parses a possibly-empty numeric input, falling back when the field is blank or NaN. */
export function toNumber(raw: string, fallback: number) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && raw.trim() !== "" ? parsed : fallback;
}

/** `m:ss`, floored — used for the transport clock and sample durations. */
export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/** Drops the extension and tidies separators so a filename reads like a track name. */
export function shortName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || fileName;
}

/** Compact frequency label: 640, 2.5k, 18k. */
export function fmtHz(hz: number) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz < 10000 ? 1 : 0)}k`;
  return `${Math.round(hz)}`;
}

/** Signed dB label, e.g. `+3.5` / `-6.0`. */
export function signedDb(db: number, digits = 1) {
  return `${db > 0 ? "+" : ""}${db.toFixed(digits)}`;
}

/** Collision-resistant enough for client-only ids, and readable in the DOM. */
export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
