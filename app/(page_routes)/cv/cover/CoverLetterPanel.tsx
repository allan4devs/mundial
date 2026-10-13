"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ClipboardCopy, FileText, Mail, Printer, X } from "lucide-react";
import type { CvData } from "../types";
import type { CvVariant } from "../variants";
import { buildCoverLetter } from "./cover-letter-build";
import { parseCompanyInfo } from "./cover-letter-parse";
import { lintLetter } from "./cover-letter-lint";
import { loadDraft, saveDraft, type ClDraft } from "./cover-letter-store";
import type { CompanyInfo, LintContext } from "./cover-letter-types";

/** Compact cover-letter panel for the /cv sidebar. Shares its draft with the
 *  standalone /cv/cover-letter editor via store.ts; the full set of inputs
 *  (hook, human detail, tone, in-place editing, the full 50-point review) lives
 *  on that route. */
export function CoverLetterPanel({
  variant,
  cv,
  onLetter,
  onPrint,
}: {
  variant: CvVariant;
  cv: CvData;
  onLetter: (letter: string | null, company?: string) => void;
  onPrint: () => void;
}) {
  const slug = variant.slug || "base";

  const [draft, setDraft] = useState<ClDraft | null>(null);
  const [copied, setCopied] = useState(false);
  const draftSlug = useRef<string | null>(null);

  // Persist first: on a variant switch this flush is skipped (draftSlug still
  // points at the old variant), so the previous draft is never written under the
  // new key. The loader below then swaps in the new variant's draft.
  useEffect(() => {
    if (draft && draftSlug.current === slug) saveDraft(slug, draft);
  }, [slug, draft]);
  useEffect(() => {
    draftSlug.current = slug;
    setDraft(loadDraft(slug));
  }, [slug]);

  const raw = draft?.raw ?? "";
  const notes = draft?.notes ?? "";
  const patch = (p: Partial<ClDraft>) => setDraft((d) => ({ ...(d ?? loadDraft(slug)), ...p }));

  const pasted = useMemo(() => parseCompanyInfo(raw), [raw]);
  const usingPaste = raw.trim().length > 0 && pasted.company.trim().length > 0;
  const hasRegistry = Boolean(variant.company);

  const info: CompanyInfo = useMemo(
    () =>
      usingPaste
        ? pasted
        : {
            company: variant.company ?? "",
            role: variant.postingTitle || variant.role,
            location: variant.location ?? "",
            hiringManager: variant.hiringManager ?? "",
          },
    [usingPaste, pasted, variant],
  );
  const ready = info.company.trim().length > 0;

  const letter = useMemo(
    () =>
      ready
        ? buildCoverLetter({
            info,
            variant,
            cv,
            hook: draft?.hook ?? "",
            notes,
            detail: draft?.detail ?? "",
            tone: draft?.tone ?? "startup",
          })
        : "",
    [ready, info, variant, cv, draft?.hook, draft?.detail, draft?.tone, notes],
  );

  useEffect(() => {
    onLetter(ready ? letter : null, info.company);
  }, [ready, letter, info.company, onLetter]);

  const report = useMemo(() => {
    if (!ready || !letter.trim()) return null;
    const ctx: LintContext = {
      company: info.company,
      role: info.role || variant.role,
      focus: variant.focus,
      hasCompanyHook: Boolean(draft?.hook?.trim() || variant.coverLetterHook),
      hasWhyNote: Boolean(notes.trim() || variant.coverLetterNotes),
      hasHumanDetail: Boolean(draft?.detail?.trim() || variant.coverLetterDetail),
    };
    return lintLetter(letter, ctx);
  }, [ready, letter, info.company, info.role, variant, notes, draft?.hook, draft?.detail]);

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  const scoreCls =
    report == null
      ? ""
      : report.score >= 85
        ? "border-teal-200 bg-teal-50 text-teal-700"
        : report.score >= 65
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <Mail size={13} className="text-teal-600" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">Cover letter</h2>
        </div>
        {ready && (
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              usingPaste ? "border-zinc-200 bg-zinc-50 text-zinc-500" : "border-teal-200 bg-teal-50 text-teal-700"
            }`}
          >
            {usingPaste ? "From pasted text" : "Auto · variants.ts"}
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-zinc-400">
        {hasRegistry ? (
          <>
            Auto-drafted for <span className="font-semibold text-zinc-500">{variant.company}</span> from the{" "}
            <span className="font-semibold text-zinc-500">{variant.name}</span> variant. Paste below to override.
          </>
        ) : (
          <>
            Paste the company blurb or job posting for a draft from the{" "}
            <span className="font-semibold text-zinc-500">{variant.name}</span> variant.
          </>
        )}
      </p>

      <div className="relative mt-2.5">
        <textarea
          value={raw}
          onChange={(e) => patch({ raw: e.target.value })}
          rows={4}
          spellCheck={false}
          placeholder={
            hasRegistry
              ? "Override — paste company info / job posting…"
              : 'Paste company info / job posting…\nLines like "Company: Acme" or "Hiring Manager: Dana" are picked up.'
          }
          className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11.5px] leading-relaxed text-zinc-700 outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
        />
        {raw && (
          <button
            type="button"
            onClick={() => patch({ raw: "" })}
            title="Clear override"
            className="absolute right-1.5 top-1.5 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {ready && (
        <div className="mt-2 flex flex-wrap gap-1">
          <DerivedChip label="Company" value={info.company} />
          <DerivedChip label="Role" value={info.role || variant.role} muted={!info.role} />
          {info.hiringManager && <DerivedChip label="Manager" value={info.hiringManager} />}
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => patch({ notes: e.target.value })}
        rows={2}
        spellCheck={false}
        placeholder="Why this company — used verbatim as one paragraph (rule 15)…"
        className="mt-2 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-[11.5px] leading-relaxed text-zinc-700 outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
      />

      {!ready && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <FileText size={12} />
          {raw.trim().length === 0
            ? "Waiting for company info…"
            : 'Add a company name (or a "Company:" line) to generate.'}
        </p>
      )}

      {ready && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[10.5px] font-bold uppercase tracking-wide text-teal-700">Draft letter</h3>
              {report && (
                <span
                  className={`rounded border px-1 py-0.5 text-[9px] font-bold tabular-nums ${scoreCls}`}
                  title={`Checklist score · ${report.counts.fail} fail · ${report.counts.warn} warn`}
                >
                  {report.score} · {report.counts.fail}✗ {report.counts.warn}!
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
              >
                <Printer size={11} />
                Print
              </button>
              <button
                type="button"
                onClick={copyLetter}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
              >
                {copied ? <Check size={11} /> : <ClipboardCopy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <pre className="mt-1.5 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11px] leading-relaxed text-zinc-700">
            {letter}
          </pre>
          <Link
            href={`/cv/cover-letter?v=${encodeURIComponent(variant.slug)}`}
            className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-teal-700 transition-colors hover:text-teal-900"
          >
            Open full editor — hook, human detail, in-place edits, 50-point review
            <ArrowUpRight size={12} />
          </Link>
        </div>
      )}
    </section>
  );
}

function DerivedChip({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-500">
      <span className="font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      <span className={muted ? "italic text-zinc-400" : "text-zinc-700"}>{value}</span>
    </span>
  );
}
