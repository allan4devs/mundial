import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/helpers/mongodb";
import { BCRYPT_SALT_ROUNDS, MIN_PASSWORD_LENGTH } from "@/lib/constants/auth";

const COLLECTION = "poker_accounts";
type PokerAccount = { _id: string; username: string; name: string; email: string | null; passwordHash: string; createdAt: Date; updatedAt: Date };

function normalizeUsername(input: unknown) {
  return typeof input === "string" ? input.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 24) : "";
}

export async function authenticatePokerAccount(usernameInput: unknown, passwordInput: unknown) {
  const username = normalizeUsername(usernameInput);
  const password = typeof passwordInput === "string" ? passwordInput : "";
  if (username.length < 3 || password.length < MIN_PASSWORD_LENGTH) return { ok: false as const, error: "username_password_invalid" };

  const db = await getDb();
  const collection = db.collection<PokerAccount>(COLLECTION);
  await collection.createIndex({ username: 1 }, { unique: true });
  const existing = await collection.findOne({ username });
  if (existing) {
    if (!(await bcrypt.compare(password, existing.passwordHash))) return { ok: false as const, error: "invalid_credentials" };
    return { ok: true as const, account: existing };
  }

  const now = new Date();
  const account: PokerAccount = { _id: randomUUID(), username, name: username, email: null, passwordHash: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS), createdAt: now, updatedAt: now };
  try {
    await collection.insertOne(account);
    return { ok: true as const, account };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return { ok: false as const, error: "username_taken" };
    throw error;
  }
}
