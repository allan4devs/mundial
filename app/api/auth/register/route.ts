import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createCredentialsUser, findUserByEmail } from "@/lib/models/user";
import { sendUserWelcomeEmail } from "@/lib/email/user-emails";
import { BCRYPT_SALT_ROUNDS, MIN_PASSWORD_LENGTH } from "@/lib/constants/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await createCredentialsUser({
      name,
      email,
      passwordHash,
    });

    if (!user) {
      return NextResponse.json({ error: "Unexpected error creating account." }, { status: 500 });
    }

    sendUserWelcomeEmail(user.email, user.name).catch((emailError) => {
      console.error("Welcome email error:", emailError);
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: user._id?.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register endpoint error:", error);
    return NextResponse.json({ error: "Unexpected error creating account." }, { status: 500 });
  }
}
