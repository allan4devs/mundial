import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserProfileByEmail, updateUserProfileByEmail } from "@/lib/models/user";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfileByEmail(session.user.email);

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, phone } = (body ?? {}) as { name?: unknown; phone?: unknown };

  if (typeof name !== "string" || typeof phone !== "string") {
    return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });
  }

  if (!name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await updateUserProfileByEmail(session.user.email, {
    name,
    phone,
  });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: updated });
}
