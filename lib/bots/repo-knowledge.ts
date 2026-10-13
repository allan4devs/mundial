import { promises as fs } from "fs";
import path from "path";

/**
 * Read-only, sandboxed access to this repo's own first-party source so
 * bot agents can ground discussions in real code instead of hallucinating
 * file names. Scoped to app/ and lib/ only — never node_modules, .git, or
 * anything that looks like a secret.
 *
 * Note for production (Vercel): a serverless function only ships the files
 * its build-time import graph can see, so arbitrary runtime fs reads like
 * this need next.config's `outputFileTracingIncludes` to force these files
 * into the /api/bots/investigate function's bundle (see next.config.ts).
 */

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "lib"];

const IGNORED_DIR_NAMES = new Set(["node_modules", ".git", ".next", ".vercel", "out", "dist", "coverage", ".turbo"]);

const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mdx", ".css"]);

const SECRET_LIKE = [/^\.env/i, /\.pem$/i, /\.key$/i, /^\.git/i, /credentials/i, /secret/i];

function isSecretLike(relPath: string): boolean {
  const base = path.basename(relPath);
  return SECRET_LIKE.some((re) => re.test(base));
}

export interface RepoFile {
  path: string; // posix-style, relative to repo root
  size: number;
}

async function walk(dir: string, results: RepoFile[], maxFiles: number): Promise<void> {
  if (results.length >= maxFiles) return;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (results.length >= maxFiles) return;
    if (entry.name.startsWith(".")) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) continue;
      await walk(full, results, maxFiles);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;
    const rel = path.relative(ROOT, full).split(path.sep).join("/");
    if (isSecretLike(rel)) continue;

    try {
      const stat = await fs.stat(full);
      results.push({ path: rel, size: stat.size });
    } catch {
      continue;
    }
  }
}

export async function listRepoFiles(maxFiles = 4000): Promise<RepoFile[]> {
  const results: RepoFile[] = [];
  for (const dir of SCAN_DIRS) {
    if (results.length >= maxFiles) break;
    await walk(path.join(ROOT, dir), results, maxFiles);
  }
  return results;
}

export async function readRepoFile(
  relPath: string,
  maxBytes = 20_000
): Promise<{ content: string; truncated: boolean } | null> {
  const cleanRel = relPath.replace(/^\/+/, "");
  const resolved = path.resolve(ROOT, cleanRel);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null; // path traversal guard
  if (isSecretLike(cleanRel)) return null;
  if (!ALLOWED_EXTENSIONS.has(path.extname(resolved))) return null;

  try {
    const buf = await fs.readFile(resolved);
    return { content: buf.subarray(0, maxBytes).toString("utf-8"), truncated: buf.byteLength > maxBytes };
  } catch {
    return null;
  }
}

export interface RepoMatch {
  path: string;
  snippet: string;
}

export async function searchRepo(keywords: string[], maxMatches = 6, maxFilesScanned = 700): Promise<RepoMatch[]> {
  if (!keywords.length) return [];
  const files = await listRepoFiles(maxFilesScanned);
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const matches: RepoMatch[] = [];

  for (const file of files) {
    if (matches.length >= maxMatches) break;
    if (file.size > 200_000) continue;

    const read = await readRepoFile(file.path, 20_000);
    if (!read) continue;
    const lower = read.content.toLowerCase();
    const hit = lowerKeywords.find((k) => lower.includes(k));
    if (!hit) continue;

    const idx = lower.indexOf(hit);
    const start = Math.max(0, idx - 200);
    const end = Math.min(read.content.length, idx + 300);
    matches.push({ path: file.path, snippet: read.content.slice(start, end).trim() });
  }

  return matches;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "is", "are",
  "this", "that", "with", "how", "what", "why", "find", "fix", "review", "improve",
  "investigate", "repo", "repository", "code", "bug", "bugs", "issue", "issues",
]);

function extractKeywords(topic: string): string[] {
  return Array.from(
    new Set(
      topic
        .toLowerCase()
        .split(/[^a-z0-9_]+/)
        .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    )
  ).slice(0, 8);
}

/** Builds a bounded (~8KB) grounding bundle: a file-tree sample plus excerpts matching the topic. */
export async function buildRepoContext(topic: string): Promise<string> {
  const files = await listRepoFiles(4000);
  const keywords = extractKeywords(topic);
  const matches = await searchRepo(keywords, 6);

  const treeSample = files.slice(0, 250).map((f) => f.path).join("\n");
  const matchBlocks = matches.map((m) => `### ${m.path}\n\`\`\`\n${m.snippet}\n\`\`\``).join("\n\n");

  const parts = [
    `Repository: La Vieja Adventures (Next.js tour-booking app). ${files.length} first-party source files indexed under app/ and lib/.`,
    `File tree sample:\n${treeSample}`,
    matches.length
      ? `Excerpts matching the topic:\n\n${matchBlocks}`
      : `No files matched keywords from the topic — reason from the file tree and general Next.js App Router conventions instead.`,
  ];

  return parts.join("\n\n").slice(0, 8000);
}
