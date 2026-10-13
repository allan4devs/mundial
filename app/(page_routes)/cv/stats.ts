// ─────────────────────────────────────────────────────────────
// CV stats — every résumé variant measured, in one place.
//
// The résumé is a fixed one-page A4 sheet (see design.ts). Each slot — a
// summary paragraph, a highlight, a sidebar skill line, an experience bullet —
// has a practical word/character ceiling: the longest one across all variants
// that still lands on a single page. This module measures every slot in every
// variant so /cv/stats can show those bands ("how many words can I adapt?").
//
// It also reconciles each variant's live experience bullets against the
// deduped bullet pool in cv-definition-jobs.ts and flags any drift.
// ─────────────────────────────────────────────────────────────

import { cvVariants } from "./variants";
import { VARIANT_CV } from "./data/cv-data";
import { JOBS, resolveJobKey } from "./data/cv-definition-jobs";
import type { CvData } from "./types";

// ── primitives ──────────────────────────────────────────────

const WORD_RE = /\S+/g;
export const wordCount = (s: string): number => (s.match(WORD_RE) ?? []).length;
export const charCount = (s: string): number => s.trim().length;

export type Span = { words: number; chars: number };
const span = (s: string): Span => ({ words: wordCount(s), chars: charCount(s) });

/** A summary paragraph is an array of styled segments — the rendered text is
 *  just their `.text` concatenated. */
export const summaryText = (para: readonly { text: string }[]): string =>
  para
    .map((seg) => seg.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();

/** The sidebar renders a skill group as `items.join("  ·  ")` — that joined
 *  string is what has to fit the narrow column. */
export const skillLineText = (items: readonly string[]): string => items.join("  ·  ");

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);

// ── per-slot / per-variant measurement ──────────────────────

export type SlotKind = "summary" | "hl-title" | "hl-detail" | "skill" | "bullet";

export type Slot = {
  /** Cross-variant alignment key — same slot in different variants shares it. */
  align: string;
  kind: SlotKind;
  label: string;
  section: string;
  text: string;
  words: number;
  chars: number;
  /** skill slots only: number of chips on the line. */
  items?: number;
};

export type VariantStat = {
  slug: string;
  /** "base" for the default God CV (its slug is ""). */
  key: string;
  name: string;
  role: string;
  title: string;
  hasHighlights: boolean;
  jobs: number;
  bullets: number;
  slots: Slot[];
  totals: {
    summary: Span;
    bullets: Span;
    skillsChars: number;
    skillsChips: number;
    /** grand total words an ATS / reader scans on the sheet. */
    words: number;
  };
};

function measure(slug: string, cv: CvData, name: string, role: string): VariantStat {
  const slots: Slot[] = [];

  cv.summary.forEach((para, i) => {
    const t = summaryText(para);
    slots.push({ align: `summary#${i + 1}`, kind: "summary", label: `Summary ¶${i + 1}`, section: "Summary", text: t, ...span(t) });
  });

  (cv.highlights ?? []).forEach((h, i) => {
    slots.push({
      align: `hl#${i + 1}·title`,
      kind: "hl-title",
      label: `Highlight ${i + 1} · title`,
      section: "Highlights",
      text: h.title,
      ...span(h.title),
    });
    slots.push({
      align: `hl#${i + 1}·detail`,
      kind: "hl-detail",
      label: `Highlight ${i + 1} · detail`,
      section: "Highlights",
      text: h.detail,
      ...span(h.detail),
    });
  });

  [...cv.primarySkills, ...cv.secondarySkills].forEach((g) => {
    const t = skillLineText(g.items);
    slots.push({
      align: `skill:${g.label}`,
      kind: "skill",
      label: g.label,
      section: "Skills",
      text: t,
      ...span(t),
      items: g.items.length,
    });
  });

  cv.experience.forEach((job) => {
    const key = resolveJobKey(job.company) ?? job.company;
    job.bullets.forEach((b, i) => {
      slots.push({
        align: `job:${key}#${i + 1}`,
        kind: "bullet",
        label: `${job.company} · bullet ${i + 1}`,
        section: job.company,
        text: b,
        ...span(b),
      });
    });
  });

  const summarySlots = slots.filter((s) => s.kind === "summary");
  const bulletSlots = slots.filter((s) => s.kind === "bullet");
  const skillSlots = slots.filter((s) => s.kind === "skill");
  const hlSlots = slots.filter((s) => s.kind === "hl-title" || s.kind === "hl-detail");

  return {
    slug,
    key: slug === "" ? "base" : slug,
    name,
    role,
    title: cv.personalInfo.title,
    hasHighlights: (cv.highlights?.length ?? 0) > 0,
    jobs: cv.experience.length,
    bullets: bulletSlots.length,
    slots,
    totals: {
      summary: { words: sum(summarySlots.map((s) => s.words)), chars: sum(summarySlots.map((s) => s.chars)) },
      bullets: { words: sum(bulletSlots.map((s) => s.words)), chars: sum(bulletSlots.map((s) => s.chars)) },
      skillsChars: sum(skillSlots.map((s) => s.chars)),
      skillsChips: sum(skillSlots.map((s) => s.items ?? 0)),
      words:
        wordCount(cv.personalInfo.title) +
        sum(summarySlots.map((s) => s.words)) +
        sum(hlSlots.map((s) => s.words)) +
        sum(skillSlots.map((s) => s.words)) +
        sum(bulletSlots.map((s) => s.words)) +
        sum(cv.experience.map((j) => wordCount(j.role) + wordCount(j.company))),
    },
  };
}

export const VARIANT_STATS: VariantStat[] = cvVariants.map((v) => measure(v.slug, VARIANT_CV[v.slug], v.name, v.role));

// ── aggregate bands ─────────────────────────────────────────

export type Band = { min: number; max: number; mean: number; p50: number; n: number };

export function band(values: readonly number[]): Band {
  if (values.length === 0) return { min: 0, max: 0, mean: 0, p50: 0, n: 0 };
  const s = [...values].sort((a, b) => a - b);
  return {
    min: s[0],
    max: s[s.length - 1],
    mean: Math.round((sum(s) / s.length) * 10) / 10,
    p50: s[Math.floor((s.length - 1) / 2)],
    n: s.length,
  };
}

export type KindBudget = { kind: SlotKind; label: string; words: Band; chars: Band; items?: Band };

const KIND_LABEL: Record<SlotKind, string> = {
  summary: "Summary paragraph",
  "hl-title": "Highlight — title",
  "hl-detail": "Highlight — detail",
  skill: "Skill line (sidebar)",
  bullet: "Experience bullet",
};

export const KIND_ORDER: SlotKind[] = ["summary", "hl-title", "hl-detail", "skill", "bullet"];

export const KIND_BUDGETS: KindBudget[] = KIND_ORDER.map((kind) => {
  const all = VARIANT_STATS.flatMap((v) => v.slots.filter((s) => s.kind === kind));
  return {
    kind,
    label: KIND_LABEL[kind],
    words: band(all.map((s) => s.words)),
    chars: band(all.map((s) => s.chars)),
    items: kind === "skill" ? band(all.map((s) => s.items ?? 0)) : undefined,
  };
});

export const kindBudget = (kind: SlotKind): KindBudget => KIND_BUDGETS.find((k) => k.kind === kind)!;

// ── per-job budgets + pool reconciliation ───────────────────

const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

export type JobBudget = {
  key: string;
  company: string;
  shortName: string;
  period: string;
  location: string;
  roleTitleCount: number;
  usedByVariants: number;
  bulletsPerVariant: Band;
  bulletWords: Band;
  bulletChars: Band;
  poolSize: number;
  /** Bullets a live variant uses that are NOT in cv-definition-jobs.ts — drift to fold back in. */
  offMenu: { key: string; text: string }[];
  /** Pool bullets no current variant uses — spare phrasings on the shelf. */
  unusedPool: string[];
};

export const JOB_BUDGETS: JobBudget[] = JOBS.map((job) => {
  const perVariant: number[] = [];
  const bulletWords: number[] = [];
  const bulletChars: number[] = [];
  const offMenu: { key: string; text: string }[] = [];
  const poolNorm = new Set(job.bulletPool.map((b) => norm(b.text)));
  const usedNorm = new Set<string>();

  for (const v of VARIANT_STATS) {
    const cv = VARIANT_CV[v.slug];
    const entry = cv.experience.find((e) => (resolveJobKey(e.company) ?? "") === job.key);
    if (!entry) continue;
    perVariant.push(entry.bullets.length);
    for (const b of entry.bullets) {
      bulletWords.push(wordCount(b));
      bulletChars.push(charCount(b));
      usedNorm.add(norm(b));
      if (!poolNorm.has(norm(b))) offMenu.push({ key: v.key, text: b });
    }
  }

  return {
    key: job.key,
    company: job.company,
    shortName: job.shortName,
    period: job.period,
    location: job.location,
    roleTitleCount: job.roleTitles.length,
    usedByVariants: perVariant.length,
    bulletsPerVariant: band(perVariant),
    bulletWords: band(bulletWords),
    bulletChars: band(bulletChars),
    poolSize: job.bulletPool.length,
    offMenu,
    unusedPool: job.bulletPool.filter((b) => !usedNorm.has(norm(b.text))).map((b) => b.text),
  };
});

// ── comparison matrix (rows aligned across variants) ─────────

export type MatrixRow = {
  align: string;
  kind: SlotKind;
  label: string;
  section: string;
  /** words per variant, keyed by variant.key; missing = slot absent in that variant. */
  byVariant: Record<string, Slot>;
  band: Band;
};

const SECTION_ORDER = ["Summary", "Highlights", "Skills"];

export const MATRIX_ROWS: MatrixRow[] = (() => {
  const rows = new Map<string, MatrixRow>();

  for (const v of VARIANT_STATS) {
    for (const slot of v.slots) {
      let row = rows.get(slot.align);
      if (!row) {
        row = {
          align: slot.align,
          kind: slot.kind,
          label: slot.label,
          section: slot.section,
          byVariant: {},
          band: { min: 0, max: 0, mean: 0, p50: 0, n: 0 },
        };
        rows.set(slot.align, row);
      }
      row.byVariant[v.key] = slot;
    }
  }

  const jobIndex = new Map(JOBS.map((j, i) => [j.key, i] as const));
  const list = [...rows.values()];
  for (const row of list) row.band = band(Object.values(row.byVariant).map((s) => s.words));

  const rank = (row: MatrixRow): [number, number, number, string] => {
    if (row.section === "Summary") return [0, 0, Number(row.align.split("#")[1] ?? 0), row.align];
    if (row.section === "Highlights") return [1, 0, 0, row.align];
    if (row.section === "Skills") return [2, -Object.keys(row.byVariant).length, 0, row.label.toLowerCase()];
    // experience: group by job order in JOBS, then bullet index
    const [, rest] = row.align.split("job:");
    const [jobKey, idx] = (rest ?? "").split("#");
    return [3 + (jobIndex.get(jobKey) ?? 99), 0, Number(idx ?? 0), row.align];
  };

  return list.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2] || String(ra[3]).localeCompare(String(rb[3]));
  });
})();

/** Section label for a matrix row, resolved to the job's short name for experience rows. */
export function rowSectionLabel(row: MatrixRow): string {
  if (SECTION_ORDER.includes(row.section)) return row.section;
  const jobKey = row.align.split("job:")[1]?.split("#")[0] ?? "";
  return JOBS.find((j) => j.key === jobKey)?.shortName ?? row.section;
}

export const VARIANT_ORDER: { key: string; slug: string; name: string }[] = VARIANT_STATS.map((v) => ({
  key: v.key,
  slug: v.slug,
  name: v.name,
}));
