import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getQuotaSummary } from "@/lib/bots/store";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const quotas = await getQuotaSummary();
    return NextResponse.json({ quotas });
  } catch (err) {
    console.error("GET /api/bots/quotas error:", err);
    return NextResponse.json({ error: "Failed to fetch quotas" }, { status: 500 });
  }
}
