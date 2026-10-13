import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAgentDoc, decreaseQuota, logActivity, setStatus, QuotaExceededError } from "@/lib/bots/store";
import { callModel } from "@/lib/bots/model-router";

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
    const { message } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const agent = await getAgentDoc(id);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    if (agent.status === "paused") {
      return NextResponse.json({ error: "Agent is paused" }, { status: 409 });
    }

    await setStatus(id, "thinking");

    let result;
    try {
      result = await callModel(agent.preferredModel, agent.systemPrompt, message.slice(0, 4000), `agent:${id}`);
    } catch (err) {
      await setStatus(id, "error");
      await logActivity({
        agentId: id,
        agentName: agent.name,
        type: "error",
        content: err instanceof Error ? err.message : "Model call failed",
      });
      throw err;
    }

    const quotaType = agent.preferredModel === "claude" ? "claudeTokens" : "chatgptTokens";
    const updated = await decreaseQuota(id, quotaType, result.tokensUsed);

    await logActivity({
      agentId: id,
      agentName: agent.name,
      type: "chat",
      content: result.content.slice(0, 240),
      model: agent.preferredModel,
      tokens: result.tokensUsed,
    });

    if (updated.status !== "paused") {
      await setStatus(id, "active");
    }

    return NextResponse.json({ reply: result.content, tokensUsed: result.tokensUsed, agent: updated });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    console.error("POST /api/bots/[id]/chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach the model" },
      { status: 502 }
    );
  }
}
