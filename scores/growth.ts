import { createHash, randomBytes } from "node:crypto";
import type { Db } from "mongodb";

import { SCORES_COLLECTIONS } from "./db";

export const SCORES_ACHIEVEMENTS = [
  {
    id: "first-pick",
    name: "Primer pronóstico",
    description: "Guardó su primer pick.",
  },
  {
    id: "first-exact",
    name: "Marcador clavado",
    description: "Acertó un marcador exacto.",
  },
  {
    id: "five-correct",
    name: "Buena racha",
    description: "Acertó el resultado de cinco partidos.",
  },
] as const;

export type ScoresAnalyticsEvent =
  | "account_created"
  | "login"
  | "pick_saved"
  | "private_league_created"
  | "private_league_joined"
  | "achievement_unlocked"
  | "share_pick";

export async function recordScoresAnalyticsEvent(
  db: Db,
  event: ScoresAnalyticsEvent,
  userId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await db.collection(SCORES_COLLECTIONS.ANALYTICS).insertOne({
    event,
    userId,
    metadata,
    happenedAt: new Date(),
  });
}

export function createInviteCode() {
  return randomBytes(9).toString("base64url");
}

export function inviteCodeHash(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function normalizeNotificationEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function normalizeTimezone(value: unknown) {
  const timezone = String(value ?? "").trim();
  if (!timezone || timezone.length > 80) return "America/Costa_Rica";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return "America/Costa_Rica";
  }
}
