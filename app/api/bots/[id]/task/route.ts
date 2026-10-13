import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { assignTask } from "@/lib/bots/store";

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
    const { task } = await req.json();
    if (typeof task !== "string" || !task.trim()) {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }
    const agent = await assignTask(id, task.trim().slice(0, 500));
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    return NextResponse.json({ agent });
  } catch (err) {
    console.error("POST /api/bots/[id]/task error:", err);
    return NextResponse.json({ error: "Failed to assign task" }, { status: 500 });
  }
}
