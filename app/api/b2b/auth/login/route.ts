import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findOperatorByEmail } from "@/lib/models/operator";
import { signToken, COOKIE_NAME } from "@/lib/b2b-auth";
import { createLoginLog } from "@/lib/models/login-log";
import { COOKIE_MAX_AGE_SECONDS } from "@/lib/constants/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const operator = await findOperatorByEmail(email);
    if (!operator) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, operator.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Block login until email is verified
    // Treat missing emailVerified (legacy accounts) as verified
    if (operator.emailVerified === false) {
      return NextResponse.json(
        { error: "Please verify your email before logging in. Check your inbox for the verification link." },
        { status: 403 }
      );
    }


    const userAgent = req.headers.get("user-agent") || "unknown";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
    await createLoginLog({
      userType: "operator",
      userId: operator._id!.toString(),
      emailOrUsername: operator.email,
      device: userAgent,
      ip,
      createdAt: new Date(),
    });

    const token = signToken({
      id: operator._id!.toString(),
      email: operator.email,
      name: operator.name,
      company: operator.company,
      commissionRate: operator.commissionRate,
      status: operator.status,
    });

    const res = NextResponse.json({
      message: "Login successful.",
      operator: {
        id: operator._id!.toString(),
        name: operator.name,
        company: operator.company,
        email: operator.email,
        status: operator.status,
        commissionRate: operator.commissionRate,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("B2B login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
