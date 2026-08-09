import type { Db } from "mongodb";
import type { NextRequest } from "next/server";
import { COLLECTIONS } from "@/lib/constants/db";

type MundialAnalyticsEvent = "login" | "pick_saved" | "stat_bet_saved";

type MundialAnalyticsInput = {
  event: MundialAnalyticsEvent;
  playerName: string;
  normalizedName: string;
  happenedAt?: Date;
  metadata?: Record<string, unknown>;
};

let indexPromise: Promise<unknown> | null = null;

function anonymizeIp(rawIp: string | null) {
  if (!rawIp) return null;

  if (rawIp.includes(".")) {
    const parts = rawIp.split(".");
    if (parts.length === 4) {
      parts[3] = "0";
      return parts.join(".");
    }
  }

  if (rawIp.includes(":")) {
    const parts = rawIp.split(":").filter(Boolean);
    return `${parts.slice(0, 3).join(":")}::`;
  }

  return null;
}

function requestMetadata(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const rawIp = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;

  return {
    ipAnonymized: anonymizeIp(rawIp),
    country: req.headers.get("x-vercel-ip-country") || null,
    region: req.headers.get("x-vercel-ip-country-region") || null,
    city: req.headers.get("x-vercel-ip-city") || null,
    userAgent: req.headers.get("user-agent") || "",
  };
}

function sanitizeValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        sanitizeValue(nestedValue),
      ])
    );
  }

  return String(value);
}

function ensureIndexes(db: Db) {
  if (!indexPromise) {
    const collection = db.collection(COLLECTIONS.MUNDIAL_ANALYTICS);
    indexPromise = Promise.all([
      collection.createIndex({ event: 1, happenedAt: -1 }),
      collection.createIndex({ normalizedName: 1, happenedAt: -1 }),
      collection.createIndex({ "metadata.matchId": 1, happenedAt: -1 }),
    ]);
  }

  return indexPromise;
}

export async function recordMundialAnalyticsEvent(
  db: Db,
  req: NextRequest,
  input: MundialAnalyticsInput
) {
  try {
    const happenedAt = input.happenedAt ?? new Date();
    await ensureIndexes(db);
    await db.collection(COLLECTIONS.MUNDIAL_ANALYTICS).insertOne({
      app: "mundial",
      event: input.event,
      playerName: input.playerName,
      normalizedName: input.normalizedName,
      happenedAt,
      metadata: sanitizeValue(input.metadata ?? {}),
      request: requestMetadata(req),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to store mundial analytics event", error);
  }
}
