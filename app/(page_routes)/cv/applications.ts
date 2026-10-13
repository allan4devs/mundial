// ─────────────────────────────────────────────────────────────
// Per-application pipeline state for the /cv workspace.
//
// Every résumé variant in variants.ts doubles as one job application. The
// STATIC side (company, contact email, posting link, "why us" note) lives on
// the CvVariant. This file owns the MUTABLE side — where that application is in
// the pipeline — persisted to localStorage so it survives reloads. It is a
// personal tracker: nothing here is committed.
// ─────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | "draft"
  | "applied"
  | "screening"
  | "interviewing"
  | "assessment"
  | "offer"
  | "rejected"
  | "archived";

/** Kind of the current / next round — the "type (english assessment)" axis. */
export type SessionType =
  | "none"
  | "recruiter-screen"
  | "technical"
  | "system-design"
  | "english-assessment"
  | "take-home"
  | "behavioral"
  | "final";

export type ApplicationState = {
  status: ApplicationStatus;
  sessionType: SessionType;
  /** Free text for the current step when the enum doesn't fit. */
  stage: string;
  /** Interview round progress, e.g. 2 of 5. 0 = not started. */
  sessionCurrent: number;
  sessionTotal: number;
  /** Manual 1–5 relevance / interest — drives the "Relevant" sort. */
  priority: number;
  /** Waiting on a reply — surfaced as a flag + filter in the sidebar. */
  checkEmail: boolean;
  /** yyyy-mm-dd the application was submitted. */
  appliedOn: string;
  /** ISO timestamp of the last edit — drives the "Recent" sort. */
  updatedOn: string;
  notes: string;
};

export function defaultApplicationState(): ApplicationState {
  return {
    status: "draft",
    sessionType: "none",
    stage: "",
    sessionCurrent: 0,
    sessionTotal: 0,
    priority: 0,
    checkEmail: false,
    appliedOn: "",
    updatedOn: "",
    notes: "",
  };
}

/** Merge a stored (possibly partial / older) payload over the defaults. */
export function resolveState(stored: Partial<ApplicationState> | undefined): ApplicationState {
  return { ...defaultApplicationState(), ...(stored ?? {}) };
}

export const STATUS_ORDER: ApplicationStatus[] = [
  "draft",
  "applied",
  "screening",
  "interviewing",
  "assessment",
  "offer",
  "rejected",
  "archived",
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  assessment: "Assessment",
  offer: "Offer",
  rejected: "Rejected",
  archived: "Archived",
};

/** Tailwind border/bg/text classes for the status pill. */
export const STATUS_CLASS: Record<ApplicationStatus, string> = {
  draft: "border-zinc-300 bg-zinc-50 text-zinc-600",
  applied: "border-sky-300 bg-sky-50 text-sky-700",
  screening: "border-violet-300 bg-violet-50 text-violet-700",
  interviewing: "border-amber-300 bg-amber-50 text-amber-800",
  assessment: "border-orange-300 bg-orange-50 text-orange-800",
  offer: "border-teal-400 bg-teal-50 text-teal-700",
  rejected: "border-rose-300 bg-rose-50 text-rose-700",
  archived: "border-zinc-200 bg-zinc-100 text-zinc-400",
};

export const SESSION_TYPE_ORDER: SessionType[] = [
  "none",
  "recruiter-screen",
  "technical",
  "system-design",
  "english-assessment",
  "take-home",
  "behavioral",
  "final",
];

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  none: "—",
  "recruiter-screen": "Recruiter screen",
  technical: "Technical",
  "system-design": "System design",
  "english-assessment": "English assessment",
  "take-home": "Take-home",
  behavioral: "Behavioral",
  final: "Final round",
};

// ── sidebar view (filter + sort) ────────────────────────────

export type SortMode = "recent" | "relevant" | "match" | "az";

export const SORT_ORDER: SortMode[] = ["recent", "relevant", "match", "az"];

export const SORT_LABEL: Record<SortMode, string> = {
  recent: "Recent",
  relevant: "Relevant",
  match: "Match",
  az: "A–Z",
};

export type ViewState = {
  sort: SortMode;
  status: ApplicationStatus | "all";
  emailOnly: boolean;
  /** Archived variants are hidden from the list unless this is on. */
  showArchived: boolean;
  query: string;
};

export function defaultView(): ViewState {
  return { sort: "recent", status: "all", emailOnly: false, showArchived: false, query: "" };
}

export function resolveView(raw: unknown): ViewState {
  const v = (raw ?? {}) as Partial<ViewState>;
  return {
    sort: SORT_ORDER.includes(v.sort as SortMode) ? (v.sort as SortMode) : "recent",
    status:
      v.status === "all" || STATUS_ORDER.includes(v.status as ApplicationStatus)
        ? (v.status as ViewState["status"])
        : "all",
    emailOnly: Boolean(v.emailOnly),
    showArchived: Boolean(v.showArchived),
    query: typeof v.query === "string" ? v.query : "",
  };
}

// ── storage ─────────────────────────────────────────────────

export const APPS_STORAGE_KEY = "cv:apps:v1";
export const APPS_VIEW_KEY = "cv:apps:view";

export type AppsMap = Record<string, ApplicationState>;

export function loadApps(): AppsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(APPS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: AppsMap = {};
    for (const [slug, state] of Object.entries(parsed as Record<string, unknown>)) {
      out[slug] = resolveState(state as Partial<ApplicationState>);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveApps(map: AppsMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / disabled — ignore */
  }
}
