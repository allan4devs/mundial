import type { Sport } from "./types";

export function maxScoreForSport(sport: Sport): number {
  if (sport === "football") return 30;
  if (sport === "basketball") return 200;
  return 200;
}

export function parseScore(value: unknown, sport: Sport): number | null {
  const n = typeof value === "number" ? value : Number(value);
  const max = maxScoreForSport(sport);
  if (!Number.isInteger(n) || n < 0 || n > max) return null;
  return n;
}

export function cleanText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export function parseIsoDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toIso(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
