import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { pauseAgent, resumeAgent } from "@/lib/bots/store";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const agent = body?.resume === true ? await resumeAgent(id) : await pauseAgent(id);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ agent });
  } catch (err) {
    console.error("POST /api/bots/[id]/pause error:", err);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}
