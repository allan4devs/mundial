import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { listAgents, hireAgent } from "@/lib/bots/store";
import { colorForRole } from "@/lib/bots/seed-catalog";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const agents = await listAgents();
    return NextResponse.json({ agents });
  } catch (err) {
    console.error("GET /api/bots error:", err);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : `${role} Bot`;
    if (!role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }
    const preferredModel = body.preferredModel === "claude" ? "claude" : "chatgpt";
    const systemPrompt = typeof body.systemPrompt === "string" && body.systemPrompt.trim()
      ? body.systemPrompt.trim()
      : `You are a world-class ${role} operating inside Grok Army Command. Be decisive, concise, and always state concrete next actions.`;
    const firstTask = typeof body.firstTask === "string" ? body.firstTask.trim() : "";

    const agent = await hireAgent({
      role,
      name,
      color: typeof body.color === "string" && body.color ? body.color : colorForRole(role),
      preferredModel,
      systemPrompt,
      firstTask,
      hiredBy: admin.username,
    });
    return NextResponse.json({ agent }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bots error:", err);
    return NextResponse.json({ error: "Failed to hire agent" }, { status: 500 });
  }
}
