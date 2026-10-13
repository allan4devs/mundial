import { NextRequest, NextResponse } from "next/server";
import { findOperatorByVerificationToken, verifyOperatorEmail } from "@/lib/models/operator";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing verification token." }, { status: 400 });
  }

  const operator = await findOperatorByVerificationToken(token);
  if (!operator) {
    return NextResponse.json(
      { error: "Invalid or expired verification link. Please register again or contact support." },
      { status: 400 }
    );
  }

  await verifyOperatorEmail(operator._id!.toString());

  // Redirect to login with success flag
  return NextResponse.redirect(
    new URL("/b2b/login?verified=1", req.url)
  );
}
