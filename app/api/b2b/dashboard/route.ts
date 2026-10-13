import { NextRequest, NextResponse } from "next/server";
import { getOperatorFromRequest } from "@/lib/b2b-auth";
import { getBookingStats, findBookingsByOperator } from "@/lib/models/booking";

export async function GET(req: NextRequest) {
  const operator = getOperatorFromRequest(req);
  if (!operator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [stats, allBookings] = await Promise.all([
    getBookingStats(operator.id),
    findBookingsByOperator(operator.id),
  ]);

  const recentBookings = allBookings.slice(0, 5);

  return NextResponse.json({ stats, recentBookings });
}
