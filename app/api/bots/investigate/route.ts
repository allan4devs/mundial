import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { listDiscussions, runInvestigation } from "@/lib/bots/discussions";

// Multi-agent discussions run synchronously across several model calls —
// give the function room beyond the default limit.
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const discussions = await listDiscussions(20);
    return NextResponse.json({ discussions });
  } catch (err) {
    console.error("GET /api/bots/investigate error:", err);
    return NextResponse.json({ error: "Failed to fetch investigations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const agentIds = Array.isArray(body.agentIds) ? body.agentIds.filter((id: unknown) => typeof id === "string") : [];
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 300) : "";
    const rounds = Math.min(6, Math.max(1, Number.isFinite(body.rounds) ? Math.floor(body.rounds) : 4));

    if (agentIds.length === 0) {
      return NextResponse.json({ error: "Select at least one agent." }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const discussion = await runInvestigation({ agentIds, topic, rounds, requestedBy: admin.username });
    return NextResponse.json({ discussion }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bots/investigate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start investigation" },
      { status: 500 }
    );
  }
}
