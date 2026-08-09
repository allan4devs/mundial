import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Db } from "mongodb";
import type { NextRequest, NextResponse } from "next/server";

export const MUNDIAL_IDENTITIES_COLLECTION = "mundial_identities";
export const MUNDIAL_SESSIONS_COLLECTION = "mundial_identity_sessions";
export const MUNDIAL_SESSION_COOKIE = "mundial_identity_session";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export type MundialIdentityDoc = {
  cedulaKey: string;
  playerName: string;
  normalizedName: string;
  email: string;
  normalizedEmail: string;
  pinHash: string;
  pinSalt: string;
  pinVersion: 2;
  failedAttempts: number;
  lockUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type SessionDoc = {
  tokenHash: string;
  cedulaKey: string;
  normalizedName: string;
  createdAt: Date;
  expiresAt: Date;
};

export function normalizeIdentityName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeIdentityNameKey(value: unknown) {
  return normalizeIdentityName(value).toUpperCase();
}

export function normalizeCedula(value: unknown) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function normalizeIdentityEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function validCedula(cedulaKey: string) {
  return /^[A-Z0-9]{9,20}$/.test(cedulaKey);
}

export function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function pinValidationError(pin: string, cedulaKey: string) {
  if (!/^\d{6}$/.test(pin)) return "El PIN debe tener 6 dígitos.";
  if (/^(\d)\1{5}$/.test(pin)) return "El PIN no puede repetir el mismo dígito.";
  if (["012345", "123456", "234567", "345678", "456789", "987654", "876543", "765432", "654321", "543210"].includes(pin)) {
    return "Elegí un PIN menos predecible.";
  }
  if (cedulaKey.endsWith(pin)) return "El PIN no puede ser parte de tu cédula.";
  return "";
}

function pinPepper() {
  return process.env.MUNDIAL_PIN_PEPPER ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "quiniela-mundial-2026";
}

export function createPinHash(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(`${pin}|${pinPepper()}`, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPinHash(pin: string, identity: Pick<MundialIdentityDoc, "pinHash" | "pinSalt">) {
  const actual = scryptSync(`${pin}|${pinPepper()}`, identity.pinSalt, 64);
  const expected = Buffer.from(identity.pinHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function verifyLegacyPin(pin: string, normalizedName: string, storedHash: string) {
  const legacyPepper = "quiniela-mundial-2026";
  const actual = createHash("sha256").update(`${normalizedName}|${pin}|${legacyPepper}`).digest();
  const expected = Buffer.from(storedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function ensureIdentityIndexes(db: Db) {
  await Promise.all([
    db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION).createIndex({ cedulaKey: 1 }, { unique: true }),
    db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION).createIndex({ normalizedName: 1 }, { unique: true }),
    db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION).createIndex({ normalizedEmail: 1 }),
    db.collection<SessionDoc>(MUNDIAL_SESSIONS_COLLECTION).createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection<SessionDoc>(MUNDIAL_SESSIONS_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

function sessionTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueIdentitySession(
  db: Db,
  response: NextResponse,
  identity: Pick<MundialIdentityDoc, "cedulaKey" | "normalizedName">,
) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.collection<SessionDoc>(MUNDIAL_SESSIONS_COLLECTION).insertOne({
    tokenHash: sessionTokenHash(token),
    cedulaKey: identity.cedulaKey,
    normalizedName: identity.normalizedName,
    createdAt: now,
    expiresAt,
  });
  response.cookies.set(MUNDIAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function readIdentitySession(db: Db, req: NextRequest) {
  const token = req.cookies.get(MUNDIAL_SESSION_COOKIE)?.value;
  if (!token) return null;
  return db.collection<SessionDoc>(MUNDIAL_SESSIONS_COLLECTION).findOne({
    tokenHash: sessionTokenHash(token),
    expiresAt: { $gt: new Date() },
  });
}

export async function identitySessionMatches(db: Db, req: NextRequest, playerName: string) {
  const session = await readIdentitySession(db, req);
  return Boolean(session && session.normalizedName === normalizeIdentityNameKey(playerName));
}

export function identityLocked(identity: Pick<MundialIdentityDoc, "lockUntil">) {
  return Boolean(identity.lockUntil && identity.lockUntil.getTime() > Date.now());
}

export async function recordFailedPin(db: Db, identity: MundialIdentityDoc) {
  const attempts = (identity.failedAttempts ?? 0) + 1;
  await db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION).updateOne(
    { cedulaKey: identity.cedulaKey },
    {
      $set: {
        failedAttempts: attempts >= MAX_FAILED_ATTEMPTS ? 0 : attempts,
        lockUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null,
        updatedAt: new Date(),
      },
    },
  );
}

export async function clearFailedPins(db: Db, cedulaKey: string) {
  await db.collection<MundialIdentityDoc>(MUNDIAL_IDENTITIES_COLLECTION).updateOne(
    { cedulaKey },
    { $set: { failedAttempts: 0, lockUntil: null, updatedAt: new Date() } },
  );
}
