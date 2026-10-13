import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  DEFAULT_USER_PREFERENCES,
  getUserPreferencesByEmail,
  updateUserPreferencesByEmail,
  type UserPreferences,
} from "@/lib/models/user";

function isValidPreferences(input: unknown): input is UserPreferences {
  if (!input || typeof input !== "object") return false;

  const preferences = input as UserPreferences;

  return (
    typeof preferences.notifications?.emailEnabled === "boolean" &&
    typeof preferences.notifications?.bookingReminders === "boolean" &&
    typeof preferences.notifications?.promotions === "boolean" &&
    typeof preferences.notifications?.weeklySummary === "boolean" &&
    typeof preferences.dashboard?.compactView === "boolean" &&
    typeof preferences.dashboard?.showSupportCard === "boolean" &&
    ["upcoming", "past"].includes(preferences.dashboard?.defaultBookingTab)
  );
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await getUserPreferencesByEmail(session.user.email);

  return NextResponse.json({ preferences: preferences ?? DEFAULT_USER_PREFERENCES });
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

  if (!isValidPreferences(body)) {
    return NextResponse.json({ error: "Invalid preferences payload" }, { status: 400 });
  }

  const updated = await updateUserPreferencesByEmail(session.user.email, body);

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ preferences: updated });
}
