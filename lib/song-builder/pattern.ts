/**
 * The `....|....|.|||..|...` codec.
 *
 * A pattern string is one character per grid step, which makes a rhythm readable
 * in a log line, a Mongo shell, a URL or a training set. It is a *view* of a
 * `Hit[]`: hits are canonical (they carry velocity and tone), the string is
 * derived. Only `decodePattern` goes the other way, for hand-typed rhythms.
 */

import type { Hit } from "./types";

export const REST_CHAR = ".";
export const GHOST_CHAR = "-";
export const HIT_CHAR = "|";
export const ACCENT_CHAR = "!";

/** Velocity below this reads as a ghost note, above `ACCENT_AT` as an accent. */
const GHOST_AT = 0.34;
const ACCENT_AT = 0.72;

/** Velocities `decodePattern` gives back for each character. */
const CHAR_VELOCITY: Record<string, number> = {
  [GHOST_CHAR]: 0.3,
  [HIT_CHAR]: 0.65,
  [ACCENT_CHAR]: 0.95,
};

/** Neutral brightness for hits that were typed rather than decoded from a voice. */
const DEFAULT_TONE = 0.5;

function velocityChar(velocity: number) {
  if (velocity >= ACCENT_AT) return ACCENT_CHAR;
  if (velocity < GHOST_AT) return GHOST_CHAR;
  return HIT_CHAR;
}

/** `Hit[]` -> `"....|...!"`. Out-of-range hits are ignored. */
export function encodePattern(hits: readonly Hit[], steps: number) {
  const row = new Array<string>(steps).fill(REST_CHAR);
  for (const hit of hits) {
    if (hit.step >= 0 && hit.step < steps) row[hit.step] = velocityChar(hit.velocity);
  }
  return row.join("");
}

/** `"....|...!"` -> `Hit[]`. Any character outside the alphabet counts as a rest. */
export function decodePattern(pattern: string): Hit[] {
  const hits: Hit[] = [];
  for (let step = 0; step < pattern.length; step += 1) {
    const velocity = CHAR_VELOCITY[pattern[step]];
    if (velocity !== undefined) hits.push({ step, velocity, tone: DEFAULT_TONE });
  }
  return hits;
}

/** Groups a pattern into beats for display: `....|... ....` */
export function groupPattern(pattern: string, stepsPerGroup = 4) {
  const groups: string[] = [];
  for (let i = 0; i < pattern.length; i += stepsPerGroup) {
    groups.push(pattern.slice(i, i + stepsPerGroup));
  }
  return groups.join(" ");
}

/**
 * Sorts hits by step, clamps every field into range, and keeps only the loudest
 * hit per step. Every path that produces hits — the decoder, the grid editor,
 * an API payload — funnels through here so the rest of the app can assume it.
 */
export function normalizeHits(hits: readonly Hit[], steps: number): Hit[] {
  const strongest = new Map<number, Hit>();
  for (const hit of hits) {
    const step = Math.round(Number(hit?.step));
    if (!Number.isFinite(step) || step < 0 || step >= steps) continue;
    const next: Hit = {
      step,
      velocity: clamp01(Number(hit.velocity), 0.65),
      tone: clamp01(Number(hit.tone), DEFAULT_TONE),
    };
    const current = strongest.get(step);
    if (!current || next.velocity > current.velocity) strongest.set(step, next);
  }
  return [...strongest.values()].sort((a, b) => a.step - b.step);
}

/** Adds a hit at `step`, or removes the one already there. */
export function toggleHit(hits: readonly Hit[], step: number, steps: number, velocity = 0.7): Hit[] {
  const existing = hits.find((hit) => hit.step === step);
  const next = existing
    ? hits.filter((hit) => hit.step !== step)
    : [...hits, { step, velocity, tone: DEFAULT_TONE }];
  return normalizeHits(next, steps);
}

/** Drops hits that fell outside the grid after `steps` shrank. */
export function fitHits(hits: readonly Hit[], steps: number) {
  return normalizeHits(hits, steps);
}

function clamp01(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}
