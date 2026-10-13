const GITHUB_API = "https://api.github.com";

function githubHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "x-github-api-version": "2022-11-28",
  };
}

export type IntegrationResult<T = Record<string, unknown>> =
  | { ok: true; skipped: false; data: T }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; reason: string };

/**
 * Commits a single file to a branch (creating the branch from `base` if it
 * doesn't exist yet) via the GitHub REST API. No octokit dependency — this
 * repo's other integrations use plain fetch, so this follows suit.
 */
export async function commitFile(input: {
  repo: string; // "owner/name"
  branch: string;
  base: string;
  path: string;
  content: string;
  message: string;
}): Promise<IntegrationResult<{ commitUrl: string }>> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return { ok: false, skipped: true, reason: "GITHUB_TOKEN is not configured." };
  }

  const [owner, repoName] = input.repo.split("/");
  if (!owner || !repoName) {
    return { ok: false, skipped: false, reason: `Invalid repo "${input.repo}", expected "owner/name".` };
  }

  try {
    const baseRef = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/ref/heads/${input.base}`, {
      headers: githubHeaders(token),
    });
    if (!baseRef.ok) throw new Error(`base branch lookup failed (${baseRef.status})`);
    const baseData = await baseRef.json();

    const branchRef = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/ref/heads/${input.branch}`, {
      headers: githubHeaders(token),
    });
    if (branchRef.status === 404) {
      const created = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/refs`, {
        method: "POST",
        headers: githubHeaders(token),
        body: JSON.stringify({ ref: `refs/heads/${input.branch}`, sha: baseData.object.sha }),
      });
      if (!created.ok) throw new Error(`branch creation failed (${created.status})`);
    } else if (!branchRef.ok) {
      throw new Error(`branch lookup failed (${branchRef.status})`);
    }

    let sha: string | undefined;
    const existing = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/contents/${input.path}?ref=${input.branch}`,
      { headers: githubHeaders(token) }
    );
    if (existing.ok) {
      const existingData = await existing.json();
      sha = existingData.sha;
    }

    const commit = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/contents/${input.path}`, {
      method: "PUT",
      headers: githubHeaders(token),
      body: JSON.stringify({
        message: input.message,
        content: Buffer.from(input.content, "utf-8").toString("base64"),
        branch: input.branch,
        sha,
      }),
    });
    if (!commit.ok) {
      const detail = await commit.text().catch(() => "");
      throw new Error(`commit failed (${commit.status}): ${detail.slice(0, 300)}`);
    }
    const commitData = await commit.json();
    return { ok: true, skipped: false, data: { commitUrl: commitData.commit?.html_url ?? "" } };
  } catch (err) {
    return { ok: false, skipped: false, reason: err instanceof Error ? err.message : "Unknown GitHub error" };
  }
}

export async function openPullRequest(input: {
  repo: string;
  head: string;
  base: string;
  title: string;
  body: string;
}): Promise<IntegrationResult<{ prUrl: string; prNumber: number }>> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return { ok: false, skipped: true, reason: "GITHUB_TOKEN is not configured." };
  }
  const [owner, repoName] = input.repo.split("/");
  if (!owner || !repoName) {
    return { ok: false, skipped: false, reason: `Invalid repo "${input.repo}", expected "owner/name".` };
  }

  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/pulls`, {
      method: "POST",
      headers: githubHeaders(token),
      body: JSON.stringify({ title: input.title, head: input.head, base: input.base, body: input.body }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`PR creation failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const data = await res.json();
    return { ok: true, skipped: false, data: { prUrl: data.html_url, prNumber: data.number } };
  } catch (err) {
    return { ok: false, skipped: false, reason: err instanceof Error ? err.message : "Unknown GitHub error" };
  }
}

/**
 * Fires a Vercel Deploy Hook (a project/branch-scoped URL configured in the
 * Vercel dashboard) rather than requiring a broad account-wide API token.
 */
export async function triggerVercelDeploy(): Promise<IntegrationResult<{ status: number }>> {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  if (!hookUrl) {
    return { ok: false, skipped: true, reason: "VERCEL_DEPLOY_HOOK_URL is not configured." };
  }
  try {
    const res = await fetch(hookUrl, { method: "POST" });
    if (!res.ok) throw new Error(`deploy hook returned ${res.status}`);
    return { ok: true, skipped: false, data: { status: res.status } };
  } catch (err) {
    return { ok: false, skipped: false, reason: err instanceof Error ? err.message : "Unknown Vercel error" };
  }
}
