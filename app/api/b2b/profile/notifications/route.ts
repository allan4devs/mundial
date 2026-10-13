import { NextRequest, NextResponse } from "next/server";
import { getOperatorFromRequest } from "@/lib/b2b-auth";
import { updateOperator } from "@/lib/models/operator";

const BOOLEAN_KEYS = [
  "bookingCreated",
  "bookingReminder24h",
  "bookingStatusChanges",
  "weeklyPerformanceDigest",
  "partnerNetworkUpdates",
] as const;

export async function PATCH(req: NextRequest) {
  const operator = getOperatorFromRequest(req);
  if (!operator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const invalidKey = BOOLEAN_KEYS.find((key) => typeof body?.[key] !== "boolean");
    if (invalidKey) {
      return NextResponse.json({ error: `Invalid value for ${invalidKey}` }, { status: 400 });
    }

    await updateOperator(operator.id, {
      notificationPreferences: {
        bookingCreated: body.bookingCreated,
        bookingReminder24h: body.bookingReminder24h,
        bookingStatusChanges: body.bookingStatusChanges,
        weeklyPerformanceDigest: body.weeklyPerformanceDigest,
        partnerNetworkUpdates: body.partnerNetworkUpdates,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update notification preferences error:", err);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
