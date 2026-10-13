// Draft persistence for the cover-letter feature. The sidebar panel and the
// standalone /cv/cover-letter editor share one localStorage blob per variant so
// edits in one show up in the other.

import type { Tone } from "./cover-letter-types";

export type ClDraft = {
  /** Pasted company blurb / job posting (overrides the variant metadata). */
  raw: string;
  /** One specific, true, non-portable thing about the company (rule 2 / 15). */
  hook: string;
  /** Verbatim "why this company" paragraph (rule 15 / 17). */
  notes: string;
  /** One human, slightly-unusual detail (rule 39). */
  detail: string;
  tone: Tone;
  /** Hand-edited letter text; null = use the generated draft. */
  edited: string | null;
};

export const emptyDraft = (): ClDraft => ({
  raw: "",
  hook: "",
  notes: "",
  detail: "",
  tone: "startup",
  edited: null,
});

const key = (slug: string) => `cv:cl:v2:${slug || "base"}`;

export function loadDraft(slug: string): ClDraft {
  const base = emptyDraft();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (raw) return { ...base, ...(JSON.parse(raw) as Partial<ClDraft>) };
    // one-time migration from the older sessionStorage keys
    const legacyCompany = window.sessionStorage.getItem(`cv:cl-company:${slug || "base"}`) ?? "";
    const legacyNotes = window.sessionStorage.getItem(`cv:cl-notes:${slug || "base"}`) ?? "";
    return { ...base, raw: legacyCompany, notes: legacyNotes };
  } catch {
    return base;
  }
}

export function saveDraft(slug: string, draft: ClDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(draft));
  } catch {
    /* quota / disabled — ignore */
  }
}
