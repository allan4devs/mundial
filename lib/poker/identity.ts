import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const POKER_SESSION_COOKIE = "poker_session";

function secret() {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for Poker sessions");
  return new TextEncoder().encode(value);
}

export async function requirePokerIdentity() {
  const token = (await cookies()).get(POKER_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.name !== "string") return null;
    return { userId: payload.sub, name: payload.name.slice(0, 30), username: typeof payload.username === "string" ? payload.username : payload.name };
  } catch {
    return null;
  }
}
