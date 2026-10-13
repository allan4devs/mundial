import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { decideApproval, decreaseQuota, logActivity, setStatus } from "@/lib/bots/store";
import { triggerVercelDeploy } from "@/lib/bots/integrations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const { decision } = await req.json();
    if (decision !== "approve" && decision !== "reject") {
      return NextResponse.json({ error: "decision must be 'approve' or 'reject'" }, { status: 400 });
    }

    const approval = await decideApproval(id, decision, admin.username);
    if (!approval) {
      return NextResponse.json({ error: "Approval not found or already decided" }, { status: 404 });
    }

    let deploy: { triggered: boolean; reason?: string } | undefined;

    if (decision === "approve" && approval.action === "deploy") {
      const result = await triggerVercelDeploy();
      if (result.ok) {
        await decreaseQuota(approval.agentId, "vercelDeploys", 1);
        await logActivity({
          agentId: approval.agentId,
          agentName: approval.agentName,
          type: "deploy",
          content: "Vercel deploy hook triggered",
        });
        deploy = { triggered: true };
      } else {
        deploy = { triggered: false, reason: result.reason };
        await logActivity({
          agentId: approval.agentId,
          agentName: approval.agentName,
          type: "error",
          content: `Deploy not triggered: ${result.reason}`,
        });
      }
    }

    await setStatus(approval.agentId, decision === "approve" ? "active" : "idle");

    return NextResponse.json({ approval, deploy });
  } catch (err) {
    console.error("PATCH /api/bots/approvals/[id] error:", err);
    return NextResponse.json({ error: "Failed to decide approval" }, { status: 500 });
  }
}
