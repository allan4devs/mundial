import { HOT_JOB_IDS } from "./data/hot-jobs";
import { HOT_LIMIT, HOT_STORAGE_KEY } from "./java-react-jobs-constants";

/** Browser override of the committed HOT seed; null means "use data/hot-jobs.ts". */
export function loadHotIds(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string").slice(0, HOT_LIMIT);
  } catch {
    return null;
  }
}

export function saveHotIds(ids: string[] | null): void {
  if (typeof window === "undefined") return;
  try {
    if (ids === null) window.localStorage.removeItem(HOT_STORAGE_KEY);
    else window.localStorage.setItem(HOT_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / disabled — ignore */
  }
}

export function seedHotIds(): string[] {
  return HOT_JOB_IDS.slice(0, HOT_LIMIT);
}

/** Paste-ready replacement for data/hot-jobs.ts. */
export function formatHotIds(ids: string[], labels: Map<string, string>): string {
  const body = ids.map((id) => `  ${JSON.stringify(id)},${labels.has(id) ? ` // ${labels.get(id)}` : ""}`).join("\n");
  return `export const HOT_JOB_IDS: readonly string[] = [\n${body}\n];\n`;
}
