import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findOperatorByEmail, setResetToken } from "@/lib/models/operator";
import { sendPasswordResetEmail } from "@/lib/email/b2b-emails";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Always return the same message to prevent email enumeration
    const operator = await findOperatorByEmail(email);
    if (operator) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await setResetToken(operator._id!.toString(), token, expiry);
      sendPasswordResetEmail(operator.email, operator.name, token).catch(console.error);
    }

    return NextResponse.json({
      message: "If an account exists for that email, you will receive a password reset link shortly.",
    });
  } catch (err) {
    console.error("B2B forgot-password error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
