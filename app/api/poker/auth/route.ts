import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createPokerGuest } from "@/lib/poker/auth";
import { POKER_SESSION_COOKIE } from "@/lib/poker/identity";

function secret() {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for Poker sessions");
  return new TextEncoder().encode(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createPokerGuest(body.username);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 401 });

    const existing = (await cookies()).get(POKER_SESSION_COOKIE)?.value;
    if (existing) {
      try {
        const { payload } = await jwtVerify(existing, secret(), { algorithms: ["HS256"] });
        if (payload.sub && payload.name && payload.username === result.account.username) {
          return NextResponse.json({ ok: true, profile: { name: payload.name, username: payload.username } });
        }
      } catch {
        // Expired or invalid cookie: issue a fresh guest session below.
      }
    }

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

export async function PATCH(request: NextRequest) {
  try {
    const identity = await import("@/lib/poker/identity").then(({ requirePokerIdentity }) => requirePokerIdentity());
    if (!identity) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const name = typeof body.username === "string" ? body.username.trim().replace(/\s+/g, " ").slice(0, 24) : "";
    if (name.length < 2) return NextResponse.json({ ok: false, error: "name_invalid" }, { status: 400 });

    const token = await new SignJWT({ name, username: name.toLowerCase() })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(identity.userId)
      .setIssuedAt()
      .setExpirationTime("365d")
      .sign(secret());
    const response = NextResponse.json({ ok: true, profile: { name, username: name.toLowerCase() } });
    response.cookies.set(POKER_SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  } catch (error) {
    console.error("Poker profile update error", error);
    return NextResponse.json({ ok: false, error: "profile_update_failed" }, { status: 500 });
  }
}
