import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/b2b-auth";

function withClearedSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function POST() {
  const res = NextResponse.json({ message: "Logged out successfully." });
  return withClearedSessionCookie(res);
}

export async function GET(request: Request) {
  const loginUrl = new URL("/b2b/login", request.url);
  const res = NextResponse.redirect(loginUrl);

  return withClearedSessionCookie(res);
}
