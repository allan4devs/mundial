import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { listApprovals } from "@/lib/bots/store";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const statusParam = req.nextUrl.searchParams.get("status");
    const status = statusParam === "pending" || statusParam === "approve" || statusParam === "reject"
      ? statusParam
      : undefined;
    const approvals = await listApprovals(status);
    return NextResponse.json({ approvals });
  } catch (err) {
    console.error("GET /api/bots/approvals error:", err);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}
