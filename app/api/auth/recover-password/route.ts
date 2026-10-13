import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findUserByEmail, setUserResetToken } from "@/lib/models/user";
import { sendUserPasswordResetEmail } from "@/lib/email/user-emails";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await findUserByEmail(normalizedEmail);

    if (user?._id) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 1000 * 60 * 60);

      await setUserResetToken(user._id.toString(), token, expiry);
      await sendUserPasswordResetEmail(normalizedEmail, user.name, token);
    }

    return NextResponse.json({
      message: "If an account exists for that email, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("Recover password endpoint error:", error);
    return NextResponse.json(
      { error: "Unexpected error while requesting password recovery." },
      { status: 500 }
    );
  }
}
