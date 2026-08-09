// lib/mundial/bans.ts
// Ban management, TOTP generation, and recovery ticket helpers.
import { createHmac, randomBytes } from "crypto";
import type { Db } from "mongodb";

export const BANS_COLLECTION = "mundial_bans";
export const TICKETS_COLLECTION = "mundial_recovery_tickets";

const TICKET_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const MAX_CODE_ATTEMPTS = 3;

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export type BanDoc = {
  _id: string;             // normalizedName (primary key)
  playerName: string;
  normalizedName: string;
  bannedAt: Date;
  bannedBy: string;
  reason: string;
  bannedVisitorIds: string[];
  active: boolean;
  unbannedAt?: Date;
};

export type RecoveryTicketDoc = {
  _id: string;             // ticketId (UUID-like)
  normalizedName: string;
  playerName: string;
  step: number;            // 0=start … 8=complete
  // CAPTCHA
  captchaAnswer: number | null;
  captchasPassed: number;
  // Appeal form
  formData: {
    fullName: string;
    email: string;
    phone: string;
    message: string;
  } | null;
  // Signed-form upload (base64 image, trimmed to 4MB)
  signatureDataUrl: string | null;
  signatureUploaded: boolean;
  // Email verification
  emailCode: string | null;
  emailCodeSentAt: Date | null;
  emailCodeAttempts: number;
  emailVerified: boolean;
  // Phone verification (code sent via email)
  phoneCode: string | null;
  phoneCodeSentAt: Date | null;
  phoneCodeAttempts: number;
  phoneVerified: boolean;
  // TOTP
  totpSecret: string | null;
  totpVerified: boolean;
  // Lifecycle
  invalidated: boolean;
  createdAt: Date;
  expiresAt: Date;
};

// -------------------------------------------------------------------
// Ban helpers
// -------------------------------------------------------------------

export async function isBanned(
  db: Db,
  normalizedName: string | null,
  visitorId: string | null
): Promise<BanDoc | null> {
  const col = db.collection<BanDoc>(BANS_COLLECTION);

  if (normalizedName) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ban = await col.findOne({ _id: normalizedName as any, active: true });
    if (ban) return ban;
  }

  if (visitorId) {
    const ban = await col.findOne({ bannedVisitorIds: visitorId, active: true });
    if (ban) return ban;
  }

  return null;
}

export async function getBan(db: Db, normalizedName: string): Promise<BanDoc | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.collection<BanDoc>(BANS_COLLECTION).findOne({ _id: normalizedName as any });
}

export async function listActiveBans(db: Db): Promise<BanDoc[]> {
  return db.collection<BanDoc>(BANS_COLLECTION)
    .find({ active: true })
    .sort({ bannedAt: -1 })
    .toArray();
}

export async function banPlayer(
  db: Db,
  opts: {
    normalizedName: string;
    playerName: string;
    bannedBy: string;
    reason: string;
    visitorIds?: string[];
  }
): Promise<void> {
  const col = db.collection(BANS_COLLECTION);
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter = { _id: opts.normalizedName as any };

  const result = await col.updateOne(
    filter,
    {
      $set: {
        playerName: opts.playerName,
        normalizedName: opts.normalizedName,
        bannedAt: now,
        bannedBy: opts.bannedBy,
        reason: opts.reason,
        active: true,
        unbannedAt: null,
      },
      // Only set bannedVisitorIds on insert to avoid conflict with $addToSet below
      $setOnInsert: { bannedVisitorIds: opts.visitorIds ?? [] },
    },
    { upsert: true }
  );

  // On update (not new insert), push additional visitorIds
  if (!result.upsertedId && opts.visitorIds?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await col.updateOne(filter, { $addToSet: { bannedVisitorIds: { $each: opts.visitorIds } as any } });
  }
}

export async function unbanPlayer(db: Db, normalizedName: string): Promise<void> {
  await db.collection(BANS_COLLECTION).updateOne(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { _id: normalizedName as any },
    { $set: { active: false, unbannedAt: new Date() } }
  );
}

export async function addVisitorIdToBan(
  db: Db,
  normalizedName: string,
  visitorId: string
): Promise<void> {
  await db.collection(BANS_COLLECTION).updateOne(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { _id: normalizedName as any },
    { $addToSet: { bannedVisitorIds: visitorId } }
  );
}

// -------------------------------------------------------------------
// Recovery tickets
// -------------------------------------------------------------------

function newTicketId(): string {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function newCode(digits = 6): string {
  const n = parseInt(randomBytes(3).toString("hex"), 16) % Math.pow(10, digits);
  return n.toString().padStart(digits, "0");
}

export async function createRecoveryTicket(
  db: Db,
  normalizedName: string,
  playerName: string
): Promise<{ ticketId: string }> {
  // Invalidate any prior open tickets for this player
  await db.collection(TICKETS_COLLECTION).updateMany(
    { normalizedName, invalidated: false },
    { $set: { invalidated: true } }
  );

  const now = new Date();
  const doc: RecoveryTicketDoc = {
    _id: newTicketId(),
    normalizedName,
    playerName,
    step: 0,
    captchaAnswer: null,
    captchasPassed: 0,
    formData: null,
    signatureDataUrl: null,
    signatureUploaded: false,
    emailCode: null,
    emailCodeSentAt: null,
    emailCodeAttempts: 0,
    emailVerified: false,
    phoneCode: null,
    phoneCodeSentAt: null,
    phoneCodeAttempts: 0,
    phoneVerified: false,
    totpSecret: null,
    totpVerified: false,
    invalidated: false,
    createdAt: now,
    expiresAt: new Date(now.getTime() + TICKET_TTL_MS),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.collection(TICKETS_COLLECTION).insertOne(doc as any);
  return { ticketId: doc._id };
}

export async function getTicket(db: Db, ticketId: string): Promise<RecoveryTicketDoc | null> {
  return db.collection<RecoveryTicketDoc>(TICKETS_COLLECTION)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .findOne({ _id: ticketId as any, invalidated: false });
}

export async function updateTicket(
  db: Db,
  ticketId: string,
  patch: Partial<RecoveryTicketDoc>
): Promise<void> {
  await db.collection(TICKETS_COLLECTION).updateOne(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { _id: ticketId as any },
    { $set: patch }
  );
}

export async function invalidateTicket(db: Db, ticketId: string): Promise<void> {
  await db.collection(TICKETS_COLLECTION).updateOne(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { _id: ticketId as any },
    { $set: { invalidated: true } }
  );
}

export function isTicketExpired(ticket: RecoveryTicketDoc): boolean {
  return ticket.expiresAt <= new Date();
}

// Generate a random math CAPTCHA question
export function generateCaptcha(): { question: string; answer: number } {
  const ops = [
    (a: number, b: number) => ({ q: `${a} + ${b}`, r: a + b }),
    (a: number, b: number) => ({ q: `${a} × ${b}`, r: a * b }),
    (a: number, b: number) => ({ q: `${a + b} − ${b}`, r: a }),
  ];
  const a = Math.floor(Math.random() * 12) + 2;
  const b = Math.floor(Math.random() * 12) + 2;
  const op = ops[Math.floor(Math.random() * ops.length)];
  const { q, r } = op(a, b);
  return { question: `¿Cuánto es ${q}?`, answer: r };
}

// Generate email/phone codes
export function generateVerificationCode(): string {
  return newCode(6);
}

// -------------------------------------------------------------------
// TOTP (RFC 6238) — native Node.js crypto, no external libraries
// -------------------------------------------------------------------

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(str: string): Buffer {
  const clean = str.replace(/=/g, "").toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const idx = BASE32.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function computeTotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(counter, 4);
  const hmac = createHmac("sha1", key);
  hmac.update(buf);
  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const code =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1_000_000;
  return code.toString().padStart(6, "0");
}

export function verifyTotpCode(secret: string, code: string, window = 1): boolean {
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    if (computeTotp(secret, counter + i) === code) return true;
  }
  return false;
}

export function getTotpUri(secret: string, playerName: string): string {
  const label = encodeURIComponent(`Mundial:${playerName}`);
  const issuer = encodeURIComponent("LaViejaAdventures");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export { MAX_CODE_ATTEMPTS, newCode };
