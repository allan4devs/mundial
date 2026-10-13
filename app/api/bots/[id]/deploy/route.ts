import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAgentDoc, createApproval, setStatus } from "@/lib/bots/store";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

/**
 * Requests a production deploy. This only queues an approval — the actual
 * Vercel deploy hook fires when an admin approves it via
 * PATCH /api/bots/approvals/[id].
 */
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
    const summary = typeof body.summary === "string" && body.summary.trim()
      ? body.summary.trim().slice(0, 300)
      : "Production deployment requested";

    const agent = await getAgentDoc(id);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    if (agent.status === "paused") {
      return NextResponse.json({ error: "Agent is paused" }, { status: 409 });
    }

    const approval = await createApproval({ agentId: id, agentName: agent.name, action: "deploy", summary });
    await setStatus(id, "deploying");

    return NextResponse.json({ approval }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bots/[id]/deploy error:", err);
    return NextResponse.json({ error: "Failed to request deploy" }, { status: 500 });
  }
}
