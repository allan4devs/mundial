// ─────────────────────────────────────────────────────────────
// CV design system — the ONE place visual language is defined.
//
// Separation of concerns across the /cv folder:
//   design.ts            → all styling: page geometry, type scale, colour,
//                          spacing rhythm, and the print stylesheet.
//   types.ts             → the data shape every variant must satisfy.
//   cv-data-*.ts         → content only (words, dates, skill lists). No classes.
//   CvDocument.tsx        → résumé structure/markup — consumes tokens, no magic numbers.
//   cover-letter-*.ts(x) → self-contained cover-letter feature (generator,
//                          lint, printable letter, and editor route) reusing
//                          these tokens and the same A4 sheet.
//   PrintPreview.tsx      → the on-screen A4 preview + print orchestration.
//   CvWorkspace.tsx       → app chrome (variant nav, JD audit, letter panel).
//
// Rule of thumb: if you are tweaking how the résumé *looks*, you edit this file
// and nothing else. If a component needs a raw px/mm value for layout, it comes
// from here.
// ─────────────────────────────────────────────────────────────

/** ISO A4 at 96dpi. `*Px` values are for JS layout math (preview scaling,
 *  one-page overflow detection); components lay out in physical `mm`. */
export const A4 = {
  wMm: 210,
  hMm: 297,
  wPx: 794, // 210mm @ 96dpi
  hPx: 1123, // 297mm @ 96dpi
} as const;

/** Page margins, in mm — generous enough to breathe, tight enough that a dense
 *  variant (7 roles, ~15 bullets) still lands on a single sheet. */
export const margin = {
  /** résumé: sidebar + main share the top inset; sides/bottom differ per column */
  cvTop: 13,
  cvBottom: 12,
  cvSideNarrow: 7, // sidebar left/right
  cvSideWide: 11, // main column left/right
  cvSidebarW: 58, // fixed sidebar width
  /** cover letter: a classic business-letter block */
  letterX: 24,
  letterY: 22,
} as const;

// ── colour ──────────────────────────────────────────────────
// Fragments, not whole class strings — compose where needed. The résumé is a
// light document regardless of the app's dark shell, so every colour is explicit.

export const color = {
  accent: "text-teal-700",
  accentBg: "bg-teal-600",
  accentRule: "bg-teal-600/50",
  ink: "text-zinc-900",
  body: "text-zinc-700",
  muted: "text-zinc-500",
  faint: "text-zinc-400",
  hairline: "border-zinc-200",
  hairlineBg: "bg-zinc-200",
  sheet: "bg-white",
  sidebar: "bg-zinc-50",
} as const;

// ── type scale ──────────────────────────────────────────────
// One scale for screen AND print — the preview renders a real A4 sheet, so what
// you see is what prints. Letter-spacing is tuned per role: tight on the display
// name, open on every uppercase label, a hair positive on running text.

export const text = {
  // résumé · sidebar
  name: "font-[family-name:var(--font-display)] text-[20px] font-bold leading-[1.08] tracking-[-0.012em] text-zinc-900",
  monogram:
    "font-[family-name:var(--font-display)] text-[15px] font-bold tracking-[0.08em] text-teal-700",
  title:
    "text-[9px] font-bold uppercase leading-[1.35] tracking-[0.22em] text-teal-700",
  contact: "text-[9px] font-medium leading-[1.55] tracking-[0.01em] text-zinc-600",
  sidebarHeading:
    "font-[family-name:var(--font-display)] text-[9.5px] font-bold uppercase tracking-[0.2em] text-zinc-900",
  skillLabel: "text-[8px] font-bold uppercase tracking-[0.16em] text-teal-700",
  skillLabelMuted: "text-[8px] font-bold uppercase tracking-[0.16em] text-zinc-400",
  skillItems: "text-[9px] leading-[1.55] tracking-[0.012em] text-zinc-600",
  skillItemsMuted: "text-[8.5px] leading-[1.5] tracking-[0.012em] text-zinc-500",
  sidebarBody: "text-[9px] leading-[1.6] tracking-[0.01em] text-zinc-600",
  sidebarStrong: "font-semibold text-zinc-900",

  // résumé · "What I Bring" strengths band (base CV only)
  hlTitle: "text-[9px] font-bold leading-[1.25] tracking-[0.004em] text-zinc-900",
  hlDetail: "text-[8px] leading-[1.4] tracking-[0.006em] text-zinc-600",

  // résumé · main column
  sectionHeading:
    "font-[family-name:var(--font-display)] text-[10.5px] font-bold uppercase tracking-[0.2em] text-zinc-900",
  lead: "text-[10.5px] leading-[1.6] tracking-[0.008em] text-zinc-700",
  role: "text-[12px] font-bold leading-[1.2] tracking-[0.002em] text-zinc-900",
  company: "text-[8.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500",
  current: "font-bold uppercase tracking-[0.1em] text-teal-700",
  bullet: "text-[10px] leading-[1.5] tracking-[0.006em] text-zinc-700",
  period: "text-[8px] font-semibold uppercase tracking-[0.08em] tabular-nums text-zinc-500",
  location: "text-[7.5px] uppercase tracking-[0.08em] text-zinc-400",
  footer: "text-[7px] font-semibold uppercase tracking-[0.24em] text-zinc-400",

  // cover letter
  letterName:
    "font-[family-name:var(--font-display)] text-[19px] font-bold leading-[1.1] tracking-[-0.012em] text-zinc-900",
  letterContact: "text-[9px] font-medium leading-[1.6] tracking-[0.02em] text-zinc-500",
  letterMeta: "text-[9.5px] tracking-[0.02em] text-zinc-500",
  letterGreeting: "text-[10.5px] font-semibold leading-[1.6] tracking-[0.008em] text-zinc-900",
  letterBody: "text-[10.5px] leading-[1.72] tracking-[0.012em] text-zinc-800",
  letterSignName:
    "font-[family-name:var(--font-display)] text-[13px] font-bold tracking-[-0.006em] text-zinc-900",
} as const;

// ── vertical rhythm (mm) ────────────────────────────────────
// Section-to-section spacing in the main column, kept in one object so the whole
// document can be loosened or tightened by one edit.

export const gap = {
  afterSummary: 6,
  beforeSection: 7,
  afterHeading: 3,
  betweenJobs: 3.4,
  jobHeadToBullets: 1.4,
  betweenBullets: 0.6,
  afterHighlights: 5,
} as const;

// ── sheet chrome ────────────────────────────────────────────
// The physical A4 page. Fixed height + clipped overflow = it can never spill to a
// second page; PrintPreview flags when content runs past the edge.

export const sheet = {
  frame:
    "cv-sheet relative isolate overflow-hidden bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_18px_50px_-16px_rgba(0,0,0,0.28)] ring-1 ring-black/5 print:shadow-none print:ring-0",
  style: { width: `${A4.wMm}mm`, height: `${A4.hMm}mm` } as const,
  /** the teal hairline pinned to the top edge of every sheet */
  topRule: "absolute inset-x-0 top-0 z-10 h-[3px] bg-teal-600",
} as const;

// ── print stylesheet ────────────────────────────────────────
// Injected once by CvWorkspace. Everything not part of a sheet is hidden; each
// sheet prints as exactly one A4 page with zero page margin (the margin lives
// inside the sheet, so preview === print).

export const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 0; }
  html, body { background: #ffffff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }

  .cv-print-hide { display: none !important; }

  /* neutralise the on-screen preview scaling so the sheet prints at 1:1 */
  .cv-scale-layer { transform: none !important; width: ${A4.wPx}px !important; height: auto !important; }
  .cv-scale-box   { width: auto !important; height: auto !important; max-width: none !important; }
  .cv-preview-scroll { overflow: visible !important; }

  .cv-sheet {
    width: ${A4.wMm}mm !important;
    height: ${A4.hMm}mm !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    outline: 0 !important;
    overflow: hidden !important;
    break-inside: avoid;
    page-break-after: always;
    break-after: page;
  }
  .cv-sheet:last-of-type { page-break-after: auto; break-after: auto; }

  /* the "Both" preview stack: drop flex + gap so each sheet owns its page */
  .cv-sheet-stack { display: block !important; gap: 0 !important; }
}
`;

// ── on-screen preview chrome ────────────────────────────────
// The WYSIWYG print preview lives in PrintPreview.tsx; its surface styling is
// defined here so every visual decision for /cv stays in this file.

export const preview = {
  surface: "cv-preview-scroll w-full",
  toolbar:
    "cv-print-hide sticky top-0 z-20 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur",
  segment: "flex overflow-hidden rounded-lg border border-zinc-200",
  segBtn: "px-2.5 py-1 text-[11px] font-semibold transition-colors",
  segOn: "bg-teal-600 text-white",
  segOff: "bg-white text-zinc-500 hover:bg-zinc-50",
  hint: "text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400",
  /** per-sheet caption row above each page (screen only) */
  capRow: "cv-print-hide mb-2 flex w-full items-center justify-between gap-2",
  capLabel: "text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400",
  pill: "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
  pillOk: "border-teal-200 bg-teal-50 text-teal-700",
  pillOver: "border-amber-300 bg-amber-50 text-amber-800",
  overNote: "cv-print-hide mt-2 text-[10.5px] font-medium leading-snug text-amber-700",
  stack: "cv-sheet-stack flex flex-col items-center gap-10",
} as const;
