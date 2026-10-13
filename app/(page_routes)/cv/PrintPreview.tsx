"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, FileText, Mail, Maximize2, Minimize2, Pencil } from "lucide-react";
import { CvDocument } from "./cv/CvDocument";
import { CoverLetterDocument } from "./cover/CoverLetterDocument";
import { A4, preview } from "./design";
import type { CvData } from "./types";

// WYSIWYG print preview: the exact A4 pages that will come out of the printer —
// résumé and/or cover letter — scaled to fit on screen, with a one-page overflow
// guard. Print chrome (toolbar, tags, banners) carries `cv-print-hide`; the
// sheets themselves are what `window.print()` emits.

export type PreviewDoc = "resume" | "letter" | "both";

const FIT_KEY = "cv:preview-fit";
type Fit = "fit" | "actual";

export function PrintPreview({
  cv,
  letter = null,
  company,
  docMode = "resume",
  onDocMode,
  lockDoc,
  editing = false,
  onToggleEdit,
  actions,
}: {
  cv: CvData;
  letter?: string | null;
  company?: string;
  docMode?: PreviewDoc;
  onDocMode?: (d: PreviewDoc) => void;
  /** Pin the preview to one document and hide the résumé/letter/both switch. */
  lockDoc?: PreviewDoc;
  /** Content-editor toggle — omitted (with onToggleEdit) hides the Edit button. */
  editing?: boolean;
  onToggleEdit?: () => void;
  /** Extra controls rendered at the end of the toolbar — the workspace's nav. */
  actions?: ReactNode;
}) {
  const [fit, setFit] = useState<Fit>("fit");

  useEffect(() => {
    try {
      const v = localStorage.getItem(FIT_KEY);
      if (v === "fit" || v === "actual") setFit(v);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(FIT_KEY, fit);
    } catch {
      /* ignore */
    }
  }, [fit]);

  const effective = lockDoc ?? docMode;
  const showResume = effective === "resume" || effective === "both";
  const showLetter = effective === "letter" || effective === "both";

  return (
    <div className={preview.surface}>
      <div className={preview.toolbar}>
        {lockDoc ? (
          <span className={`${preview.hint} inline-flex items-center gap-1`}>
            {lockDoc === "letter" ? <Mail size={12} /> : <FileText size={12} />}
            {lockDoc === "letter" ? "Cover letter" : lockDoc === "resume" ? "Résumé" : "Résumé + letter"}
          </span>
        ) : (
          <div className={preview.segment}>
            <SegBtn icon={<FileText size={12} />} label="Résumé" on={docMode === "resume"} onClick={() => onDocMode?.("resume")} />
            <SegBtn icon={<Mail size={12} />} label="Cover letter" on={docMode === "letter"} onClick={() => onDocMode?.("letter")} />
            <SegBtn label="Both" on={docMode === "both"} onClick={() => onDocMode?.("both")} />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className={preview.hint}>A4 · print preview</span>
          {onToggleEdit && !lockDoc && (
            <button
              type="button"
              onClick={onToggleEdit}
              title={editing ? "Close the content editor" : "Edit résumé content"}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-semibold transition-colors ${
                editing
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              <Pencil size={11} />
              {editing ? "Editing" : "Edit"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFit((f) => (f === "fit" ? "actual" : "fit"))}
            title={fit === "fit" ? "Show at 100%" : "Fit to width"}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            {fit === "fit" ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
            {fit === "fit" ? "Actual size" : "Fit width"}
          </button>
          {actions && (
            <>
              <span className="mx-0.5 h-4 w-px bg-zinc-200" aria-hidden />
              {actions}
            </>
          )}
        </div>
      </div>

      <div className={preview.stack}>
        {showResume && (
          <SheetFrame fit={fit} label="Résumé · A4" measureKey={resumeKey(cv)}>
            {(ref) => <CvDocument cv={cv} sheetRef={ref} />}
          </SheetFrame>
        )}
        {showLetter && (
          <SheetFrame fit={fit} label="Cover letter · A4" measureKey={`L:${(letter ?? "").length}`}>
            {(ref) => <CoverLetterDocument letter={letter} company={company} sheetRef={ref} />}
          </SheetFrame>
        )}
      </div>
    </div>
  );
}

// Signature over everything that affects vertical fill, so the one-page overflow
// check re-runs on any content edit (name, summary, skills, bullets, …).
function resumeKey(cv: CvData): string {
  let bulletCount = 0;
  let bulletChars = 0;
  for (const j of cv.experience) {
    bulletCount += j.bullets.length;
    for (const b of j.bullets) bulletChars += b.length;
  }
  let skillChars = 0;
  for (const g of [...cv.primarySkills, ...cv.secondarySkills]) {
    skillChars += g.label.length;
    for (const it of g.items) skillChars += it.length + 1;
  }
  let summaryChars = 0;
  for (const para of cv.summary) for (const seg of para) summaryChars += seg.text.length;
  return [
    "R",
    cv.density ?? "standard",
    cv.personalInfo.name.length,
    cv.personalInfo.title,
    cv.contactInfo.length,
    cv.experience.length,
    bulletCount,
    bulletChars,
    cv.highlights?.length ?? 0,
    skillChars,
    summaryChars,
    cv.languages.length,
  ].join(":");
}

function SegBtn({ icon, label, on, onClick }: { icon?: ReactNode; label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${preview.segBtn} ${on ? preview.segOn : preview.segOff} inline-flex items-center gap-1`}
    >
      {icon}
      {label}
    </button>
  );
}

function SheetFrame({
  fit,
  label,
  measureKey,
  children,
}: {
  fit: Fit;
  label: string;
  measureKey: string;
  children: (ref: (el: HTMLElement | null) => void) => ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetElRef = useRef<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);
  const [overflow, setOverflow] = useState(false);

  // scale-to-fit: measure the column, never upscale past 1:1
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const apply = () => {
      const avail = wrap.clientWidth;
      setScale(fit === "actual" ? 1 : Math.min(1, avail / A4.wPx));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fit]);

  // one-page guard: the sheet clips at 297mm, so scrollHeight > clientHeight
  // means content ran past the page edge.
  const checkOverflow = useCallback(() => {
    const el = sheetElRef.current;
    if (!el) return;
    setOverflow(el.scrollHeight - el.clientHeight > 2);
  }, []);

  useEffect(() => {
    checkOverflow();
    const t = window.setTimeout(checkOverflow, 250);
    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready?.then(() => {
      if (!cancelled) checkOverflow();
    });
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [checkOverflow, measureKey]);

  const setSheet = useCallback(
    (el: HTMLElement | null) => {
      sheetElRef.current = el;
      checkOverflow();
    },
    [checkOverflow],
  );

  return (
    <div ref={wrapRef} className="w-full">
      <div className={preview.capRow}>
        <span className={preview.capLabel}>{label}</span>
        <span className={`${preview.pill} ${overflow ? preview.pillOver : preview.pillOk}`}>
          {overflow ? <AlertTriangle size={10} /> : <Check size={10} />}
          {overflow ? "Over one page" : "Fits one page"}
        </span>
      </div>

      <div
        className={`cv-scale-box relative mx-auto ${fit === "actual" ? "overflow-x-auto" : ""}`}
        style={{ width: A4.wPx * scale, height: A4.hPx * scale, maxWidth: "100%" }}
      >
        <div
          className="cv-scale-layer origin-top-left"
          style={{ width: A4.wPx, height: A4.hPx, transform: `scale(${scale})` }}
        >
          {children(setSheet)}
        </div>
      </div>

      {overflow && (
        <p className={preview.overNote}>
          This variant’s content runs past a single A4 sheet. Trim a few bullet lines or shorten the summary so it prints
          on one page.
        </p>
      )}
    </div>
  );
}
