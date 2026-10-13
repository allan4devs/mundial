// ─────────────────────────────────────────────────────────────
// Cover-letter feature — shared types.
//
// The feature is split across flat cover-letter-*.ts(x) modules:
//   parse.ts     → pull company / role / manager out of a pasted posting
//   build.ts     → deterministic generator, written to pass the 50-point checklist
//   lint.ts      → the 50-point checklist as automated checks + a manual list
//   Document.tsx → the printable A4 letter (shared sheet + tokens from ../design)
//   LetterLint.tsx      → renders a LintReport
//   CoverLetterPanel.tsx → the compact panel embedded in the /cv sidebar
//   workspace.tsx + page.tsx → the standalone /cv/cover-letter editor
// ─────────────────────────────────────────────────────────────

export type CompanyInfo = {
  company: string;
  role: string;
  location: string;
  hiringManager: string;
};

/** Nudges the close, the sign-off and how freely contractions are used. */
export type Tone = "startup" | "enterprise" | "agency";

export const TONE_ORDER: Tone[] = ["startup", "enterprise", "agency"];

export const TONE_LABEL: Record<Tone, string> = {
  startup: "Startup",
  enterprise: "Enterprise",
  agency: "Agency / consultancy",
};

// ── lint ────────────────────────────────────────────────────

export type Severity = "fail" | "warn" | "info";

export type LintGroup =
  | "Opening & hook"
  | "Structure & content"
  | "Language & tone"
  | "Sounds-like-AI tells"
  | "Formatting & mechanics"
  | "Before sending";

export const LINT_GROUP_ORDER: LintGroup[] = [
  "Opening & hook",
  "Structure & content",
  "Language & tone",
  "Sounds-like-AI tells",
  "Formatting & mechanics",
  "Before sending",
];

export type LintFinding = {
  /** 1–50, indexing the checklist. */
  rule: number;
  group: LintGroup;
  severity: Severity;
  /** The rule, in brief. */
  title: string;
  /** What was found, ideally quoting the offending text. */
  detail: string;
};

/** Everything the checks need that can't be read off the letter text itself. */
export type LintContext = {
  company: string;
  role: string;
  focus: readonly string[];
  /** A specific, true, non-portable detail about the company was supplied. */
  hasCompanyHook: boolean;
  /** A verbatim "why this company" paragraph was supplied. */
  hasWhyNote: boolean;
  /** One human, slightly-unusual detail was supplied (rule 39). */
  hasHumanDetail: boolean;
};

export type LintReport = {
  findings: LintFinding[];
  /** Rule numbers whose automated check ran and found nothing. */
  passed: number[];
  /** Automated rules evaluated for this letter. */
  autoTotal: number;
  /** 0–100, weighted: a fail costs twice a warn, info is free. */
  score: number;
  wordCount: number;
  paragraphs: number;
  sentences: number;
  counts: { fail: number; warn: number; info: number };
};

/** A checklist item that needs a human read — no automated check. */
export type ManualRule = { rule: number; group: LintGroup; text: string };
