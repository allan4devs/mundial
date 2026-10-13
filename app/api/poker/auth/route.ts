import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { authenticatePokerAccount } from "@/lib/poker/auth";
import { POKER_SESSION_COOKIE } from "@/lib/poker/identity";

function secret() {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for Poker sessions");
  return new TextEncoder().encode(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authenticatePokerAccount(body.username, body.password);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 401 });

    const token = await new SignJWT({ name: result.account.name, username: result.account.username })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(result.account._id)
      .setIssuedAt()
      .setExpirationTime("365d")
      .sign(secret());

    const response = NextResponse.json({ ok: true, profile: { name: result.account.name, username: result.account.username } });
    response.cookies.set(POKER_SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  } catch (error) {
    console.error("Poker auth error", error);
    return NextResponse.json({ ok: false, error: "auth_unavailable" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(POKER_SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
