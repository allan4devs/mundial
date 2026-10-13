import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const target = new URL("/api/auth/callback/auth0", request.url);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return NextResponse.redirect(target);
}
