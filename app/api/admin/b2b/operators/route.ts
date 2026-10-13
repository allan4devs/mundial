import { NextRequest, NextResponse } from "next/server";
import { listOperators } from "@/lib/models/operator";
import { getAdminFromRequest } from "@/lib/admin-auth";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const operators = await listOperators();
    return NextResponse.json({ operators });
  } catch (err) {
    console.error("Admin list operators error:", err);
    return NextResponse.json({ error: "Failed to fetch operators." }, { status: 500 });
  }
}
