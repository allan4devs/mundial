import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { clearUserResetToken, findUserByResetToken, updateUserPassword } from "@/lib/models/user";
import { BCRYPT_SALT_ROUNDS, MIN_PASSWORD_LENGTH } from "@/lib/constants/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const user = await findUserByResetToken(token);
    if (!user?._id) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await updateUserPassword(user._id.toString(), hashed);
    await clearUserResetToken(user._id.toString());

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password endpoint error:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
