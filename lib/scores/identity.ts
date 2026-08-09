import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Db } from "mongodb";
import type { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { SCORES_COLLECTIONS } from "./db";
import { resolveRuntimeSecret } from "../security/runtime-secret";

export const SCORES_SESSION_COOKIE = "scores_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;

export type ScoresIdentityDoc = {
  _id: ObjectId;
  displayName: string;
  normalizedName: string;
  notificationEmail?: string | null;
  normalizedNotificationEmail?: string | null;
  notificationEmailVerifiedAt?: Date | null;
  notificationConsentAt?: Date | null;
  preferences?: {
    pickClosingReminder: boolean;
    resultsDigest: boolean;
    timezone: string;
  };
  pinHash: string;
  pinSalt: string;
  failedAttempts: number;
  lockUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SessionDoc = {
  tokenHash: string;
  userId: string;
  displayName: string;
  createdAt: Date;
  expiresAt: Date;
};

export type ScoresViewer = {
  userId: string;
  displayName: string;
};

export function normalizeDisplayName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
}

export function normalizeNameKey(value: unknown) {
  return normalizeDisplayName(value).toUpperCase();
}

function pepper() {
  return resolveRuntimeSecret(
    "SCORES_PIN_PEPPER",
    process.env.SCORES_PIN_PEPPER,
    process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      "development-only-scores-pin-pepper"
  );
}

export function pinError(pin: string) {
  if (!/^\d{6}$/.test(pin)) return "El PIN debe tener 6 digitos.";
  if (/^(\d)\1{5}$/.test(pin)) return "El PIN no puede ser tan predecible.";
  return "";
}

export function createPinHash(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(`${pin}|${pepper()}`, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPinHash(pin: string, identity: Pick<ScoresIdentityDoc, "pinHash" | "pinSalt">) {
  const actual = scryptSync(`${pin}|${pepper()}`, identity.pinSalt, 64);
  const expected = Buffer.from(identity.pinHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureIdentityIndexes(db: Db) {
  await db.collection(SCORES_COLLECTIONS.IDENTITIES).createIndex({ normalizedName: 1 }, { unique: true });
  await db.collection(SCORES_COLLECTIONS.SESSIONS).createIndex({ tokenHash: 1 }, { unique: true });
  await db.collection(SCORES_COLLECTIONS.SESSIONS).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export async function issueSession(
  db: Db,
  response: NextResponse,
  identity: { userId: string; displayName: string }
) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.collection<SessionDoc>(SCORES_COLLECTIONS.SESSIONS).insertOne({
    tokenHash: tokenHash(token),
    userId: identity.userId,
    displayName: identity.displayName,
    createdAt: now,
    expiresAt,
  });
  response.cookies.set(SCORES_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function readViewer(db: Db, req: NextRequest): Promise<ScoresViewer | null> {
  const token = req.cookies.get(SCORES_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.collection<SessionDoc>(SCORES_COLLECTIONS.SESSIONS).findOne({
    tokenHash: tokenHash(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return { userId: session.userId, displayName: session.displayName };
}

export async function clearSession(db: Db, req: NextRequest, response: NextResponse) {
  const token = req.cookies.get(SCORES_SESSION_COOKIE)?.value;
  if (token) {
    await db.collection(SCORES_COLLECTIONS.SESSIONS).deleteOne({ tokenHash: tokenHash(token) });
  }
  response.cookies.set(SCORES_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function isLocked(identity: Pick<ScoresIdentityDoc, "lockUntil">) {
  return Boolean(identity.lockUntil && identity.lockUntil.getTime() > Date.now());
}

export async function recordFailedPin(db: Db, id: ObjectId) {
  const currentAttempts = { $ifNull: ["$failedAttempts", 0] };
  const nextAttempts = { $add: [currentAttempts, 1] };
  await db.collection(SCORES_COLLECTIONS.IDENTITIES).updateOne(
    { _id: id },
    [{
      $set: {
        failedAttempts: {
          $cond: [{ $gte: [nextAttempts, MAX_FAILED] }, 0, nextAttempts],
        },
        lockUntil: {
          $cond: [
            { $gte: [nextAttempts, MAX_FAILED] },
            { $add: ["$$NOW", LOCK_MS] },
            null,
          ],
        },
        updatedAt: "$$NOW",
      },
    }]
  );
}

export async function clearFailed(db: Db, id: ObjectId) {
  await db.collection(SCORES_COLLECTIONS.IDENTITIES).updateOne(
    { _id: id },
    { $set: { failedAttempts: 0, lockUntil: null, updatedAt: new Date() } }
  );
}
