import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getAgentDoc, decreaseQuota, logActivity, setStatus, createApproval, QuotaExceededError } from "@/lib/bots/store";
import { commitFile, openPullRequest } from "@/lib/bots/integrations";

function isAuthorized(req: NextRequest): boolean {
  return Boolean(getAdminFromRequest(req));
}

/**
 * Commits a file to a feature branch and opens a PR. This never touches
 * `main` directly — merging is a separate, admin-gated approval step
 * (see /api/bots/approvals), matching the "high-risk actions gated by
 * default" design principle.
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
    const body = await req.json();
    const { repo, branch, base = "main", path, content, message } = body;
    if (!repo || !branch || !path || typeof content !== "string" || !message) {
      return NextResponse.json(
        { error: "repo, branch, path, content, and message are required" },
        { status: 400 }
      );
    }

    const agent = await getAgentDoc(id);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    if (agent.status === "paused") {
      return NextResponse.json({ error: "Agent is paused" }, { status: 409 });
    }

    await setStatus(id, "coding");
    const updated = await decreaseQuota(id, "githubActions", 1);

    const commitResult = await commitFile({ repo, branch, base, path, content, message });
    if (!commitResult.ok) {
      await setStatus(id, commitResult.skipped ? "idle" : "error");
      await logActivity({
        agentId: id,
        agentName: agent.name,
        type: "error",
        content: `Commit ${commitResult.skipped ? "skipped" : "failed"}: ${commitResult.reason}`,
      });
      return NextResponse.json(
        { error: commitResult.reason, skipped: commitResult.skipped },
        { status: commitResult.skipped ? 501 : 502 }
      );
    }

    await logActivity({
      agentId: id,
      agentName: agent.name,
      type: "commit",
      content: `${message} → ${repo}@${branch}`,
    });

    const prResult = await openPullRequest({
      repo,
      head: branch,
      base,
      title: message,
      body: `Opened by ${agent.name} via Grok Army Command.`,
    });

    let approval = null;
    if (prResult.ok) {
      await logActivity({
        agentId: id,
        agentName: agent.name,
        type: "pull_request",
        content: `PR opened: ${prResult.data.prUrl}`,
      });
      approval = await createApproval({
        agentId: id,
        agentName: agent.name,
        action: "merge",
        summary: `Merge PR #${prResult.data.prNumber} (${branch} → ${base}): ${message}`,
      });
    }

    await setStatus(id, "reviewing");

    return NextResponse.json({
      agent: { ...updated, status: "reviewing" },
      commit: commitResult.data,
      pullRequest: prResult.ok ? prResult.data : { skipped: true, reason: prResult.reason },
      approval,
    });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    console.error("POST /api/bots/[id]/commit error:", err);
    return NextResponse.json({ error: "Failed to commit" }, { status: 500 });
  }
}
