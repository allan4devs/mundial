import { HOT_JOB_IDS } from "./data/hot-jobs";
import { HOT_DISMISSED_STORAGE_KEY, HOT_LIMIT, HOT_STORAGE_KEY } from "./java-react-jobs-constants";
import { isArchivedRow, jobPostingKey } from "./java-react-jobs-helpers";
import type { JobRowModel } from "./java-react-jobs-types";

export function isHotCandidate(row: Pick<JobRowModel, "job" | "state">): boolean {
  return !isArchivedRow(row) && row.state.status !== "rejected" && row.job.listingStatus !== "closed" && Boolean(jobPostingKey(row.job.url));
}

function lastSeenTime(row: JobRowModel): number {
  return Date.parse(row.job.lastSeen || row.job.firstSeen || "") || 0;
}

/** Prefer new applications, then fit; use verified status, priority, and freshness to break ties. */
export function compareHotCandidates(a: JobRowModel, b: JobRowModel): number {
  return Number(a.state.status !== "draft") - Number(b.state.status !== "draft")
    || b.job.rating10 - a.job.rating10
    || Number(b.job.listingStatus === "open") - Number(a.job.listingStatus === "open")
    || b.state.priority - a.state.priority
    || lastSeenTime(b) - lastSeenTime(a)
    || a.index - b.index
    || a.job.id.localeCompare(b.job.id);
}

/** Manual picks first; fill five unique active postings, recycling skipped jobs only as a fallback. */
export function selectHotIds(rows: JobRowModel[], preferredIds: string[], dismissedIds: string[]): string[] {
  const dismissedOrder = new Map(dismissedIds.map((id, index) => [id, index]));
  const blockedPostings = new Set(rows
    .filter((row) => !isHotCandidate(row))
    .map((row) => jobPostingKey(row.job.url)));
  const skippedPostings = new Map<string, number>();
  for (const { job } of rows) {
    const key = jobPostingKey(job.url);
    const skippedAt = dismissedOrder.get(job.id);
    if (key && skippedAt !== undefined) skippedPostings.set(key, Math.max(skippedPostings.get(key) ?? -1, skippedAt));
  }
  const byId = new Map(rows.map((row) => [row.job.id, row]));
  const eligible = rows.filter((row) => isHotCandidate(row) && !blockedPostings.has(jobPostingKey(row.job.url)));
  const fresh = eligible.filter((row) => !skippedPostings.has(jobPostingKey(row.job.url)!));
  const skipped = eligible.filter((row) => skippedPostings.has(jobPostingKey(row.job.url)!));
  skipped.sort((a, b) => skippedPostings.get(jobPostingKey(a.job.url)!)! - skippedPostings.get(jobPostingKey(b.job.url)!)!
    || compareHotCandidates(a, b));
  const candidates = [
    ...preferredIds.flatMap((id) => {
      const row = byId.get(id);
      return row && !skippedPostings.has(jobPostingKey(row.job.url)!) ? [row] : [];
    }),
    ...fresh.sort(compareHotCandidates),
    ...skipped,
  ];
  const selected: string[] = [];
  const selectedPostings = new Set<string>();
  for (const row of candidates) {
    const key = jobPostingKey(row.job.url);
    if (!key || !isHotCandidate(row) || blockedPostings.has(key) || selectedPostings.has(key)) continue;
    selected.push(row.job.id);
    selectedPostings.add(key);
    if (selected.length === HOT_LIMIT) break;
  }
  return selected;
}

/** Browser override of the committed HOT seed; null means "use data/hot-jobs.ts". */
export function loadHotIds(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return [...new Set(parsed.filter((id): id is string => typeof id === "string"))].slice(0, HOT_LIMIT);
  } catch {
    return null;
  }
}

export function saveHotIds(ids: string[] | null): void {
  if (typeof window === "undefined") return;
  try {
    if (ids === null) window.localStorage.removeItem(HOT_STORAGE_KEY);
    else {
      const safeIds = [...new Set(ids)].slice(0, HOT_LIMIT);
      window.localStorage.setItem(HOT_STORAGE_KEY, JSON.stringify(safeIds));
    }
  } catch {
    /* quota / disabled — ignore */
  }
}

export function seedHotIds(): string[] {
  return [...new Set(HOT_JOB_IDS)].slice(0, HOT_LIMIT);
}

export function loadDismissedHotIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(HOT_DISMISSED_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === "string"))] : [];
  } catch {
    return [];
  }
}

export function saveDismissedHotIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOT_DISMISSED_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* localStorage unavailable or full */
  }
}

/** Paste-ready replacement for data/hot-jobs.ts. */
export function formatHotIds(ids: string[], labels: Map<string, string>): string {
  const body = ids.map((id) => `  ${JSON.stringify(id)},${labels.has(id) ? ` // ${labels.get(id)}` : ""}`).join("\n");
  return `export const HOT_JOB_IDS: readonly string[] = [\n${body}\n];\n`;
}
