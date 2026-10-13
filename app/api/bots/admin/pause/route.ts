import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { pauseAllAgents, resumeAllAgents } from "@/lib/bots/store";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

/** Global emergency stop / resume for the whole army. */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const count = body?.resume === true ? await resumeAllAgents() : await pauseAllAgents();
    return NextResponse.json({ success: true, affected: count });
  } catch (err) {
    console.error("POST /api/bots/admin/pause error:", err);
    return NextResponse.json({ error: "Failed to update agents" }, { status: 500 });
  }
}
