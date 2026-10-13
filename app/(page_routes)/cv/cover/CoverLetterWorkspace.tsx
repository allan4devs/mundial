"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, ClipboardCopy, FileText, Printer, RotateCcw, Sparkles } from "lucide-react";
import { PRINT_CSS } from "../design";
import { PrintPreview } from "../PrintPreview";
import { cvVariantBySlug, cvVariants } from "../variants";
import { VARIANT_CV } from "../data/cv-data";
import { buildCoverLetter } from "./cover-letter-build";
import { parseCompanyInfo } from "./cover-letter-parse";
import { lintLetter } from "./cover-letter-lint";
import { LetterLint } from "./CoverLetterLint";
import { emptyDraft, loadDraft, saveDraft, type ClDraft } from "./cover-letter-store";
import { TONE_LABEL, TONE_ORDER, type CompanyInfo, type LintContext, type Tone } from "./cover-letter-types";

const knownSlug = (s: string | null): string =>
  s && cvVariants.some((v) => v.slug === s) ? s : "";

export function CoverLetterWorkspace() {
  // Start empty so SSR and first client render agree; adopt ?v= after mount.
  const [slug, setSlug] = useState<string>("");
  const [draft, setDraft] = useState<ClDraft>(emptyDraft);
  const [copied, setCopied] = useState(false);
  const [printSignal, setPrintSignal] = useState(0);
  const draftSlug = useRef<string | null>(null);

  const variant = useMemo(() => cvVariantBySlug(slug) ?? cvVariants[0], [slug]);
  const cv = useMemo(() => VARIANT_CV[slug] ?? VARIANT_CV[""], [slug]);
  const manualKey = `cv:cl:manual:${slug || "base"}`;

  useEffect(() => {
    const fromUrl = knownSlug(new URLSearchParams(window.location.search).get("v"));
    if (fromUrl) setSlug(fromUrl);
  }, []);

  // Persist first: on a variant switch this flush is skipped (draftSlug still
  // points at the old variant), so the previous draft is never written under the
  // new key. The loader below then swaps in the new variant's draft.
  useEffect(() => {
    if (draftSlug.current === slug) saveDraft(slug, draft);
  }, [slug, draft]);
  useEffect(() => {
    draftSlug.current = slug;
    setDraft(loadDraft(slug));
  }, [slug]);

  // print: point the preview at the letter, let it paint, then open the dialog
  useEffect(() => {
    if (printSignal === 0) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => window.print());
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [printSignal]);

  const patch = useCallback((p: Partial<ClDraft>) => setDraft((d) => ({ ...d, ...p })), []);
  const onSlug = (next: string) => {
    setSlug(next);
    if (typeof window !== "undefined") {
      const url = next ? `?v=${encodeURIComponent(next)}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    }
  };

  const parsed = useMemo(() => parseCompanyInfo(draft.raw), [draft.raw]);
  const usingPaste = draft.raw.trim().length > 0 && parsed.company.trim().length > 0;
  const info: CompanyInfo = useMemo(
    () =>
      usingPaste
        ? parsed
        : {
            company: variant.company ?? "",
            role: variant.postingTitle || variant.role,
            location: variant.location ?? "",
            hiringManager: variant.hiringManager ?? "",
          },
    [usingPaste, parsed, variant],
  );
  const ready = info.company.trim().length > 0;

  const generated = useMemo(
    () =>
      ready
        ? buildCoverLetter({
            info,
            variant,
            cv,
            hook: draft.hook,
            notes: draft.notes,
            detail: draft.detail,
            tone: draft.tone,
          })
        : "",
    [ready, info, variant, cv, draft.hook, draft.notes, draft.detail, draft.tone],
  );
  const letter = draft.edited ?? generated;

  const ctx = useMemo<LintContext>(
    () => ({
      company: info.company,
      role: info.role || variant.role,
      focus: variant.focus,
      hasCompanyHook: Boolean(draft.hook.trim() || variant.coverLetterHook),
      hasWhyNote: Boolean(draft.notes.trim() || variant.coverLetterNotes),
      hasHumanDetail: Boolean(draft.detail.trim() || variant.coverLetterDetail),
    }),
    [info.company, info.role, variant, draft.hook, draft.notes, draft.detail],
  );
  const report = useMemo(() => (letter.trim() ? lintLetter(letter, ctx) : null), [letter, ctx]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };
  const regenerate = () => {
    if (draft.edited != null && draft.edited.trim() !== generated.trim()) {
      if (!window.confirm("Discard your hand edits and rebuild from the fields?")) return;
    }
    patch({ edited: null });
  };
  const resetInputs = () => {
    if (!window.confirm("Clear every field for this variant?")) return;
    setDraft(emptyDraft());
  };

  const fieldCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[12px] text-zinc-700 outline-none transition-colors focus:border-teal-500 focus:bg-white";

  return (
    <main className="min-h-screen bg-zinc-100 print:bg-white">
      <style>{PRINT_CSS}</style>

      <div className="mx-auto max-w-6xl px-4 py-8 print:max-w-none print:p-0">
        <header className="space-y-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            <Link href="/cv" className="inline-flex items-center gap-1 hover:text-teal-700">
              <ArrowLeft size={13} /> /cv
            </Link>
            <span>·</span>
            <span className="text-zinc-500">cover letter</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Cover letter editor</h1>
          <p className="max-w-3xl text-[13px] leading-relaxed text-zinc-600">
            Builds a checklist-safe draft from a résumé variant, then grades it against the 50-point cover-letter
            checklist as you edit. The generator can&rsquo;t invent a real reason for the company or a human detail —
            those are the <span className="font-semibold">Specifics</span> fields, and the review flags whatever is still
            missing.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start print:block">
          <aside className="w-full shrink-0 lg:w-[360px] print:hidden">
            <div className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1">
              {/* target */}
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">Target</h2>

                <label className="mt-2 block">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">Résumé variant</span>
                  <select value={slug} onChange={(e) => onSlug(e.target.value)} className={fieldCls}>
                    {cvVariants.map((v) => (
                      <option key={v.slug} value={v.slug}>
                        {v.name}
                        {v.company ? ` — ${v.company}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-3 block">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                    Company / job posting
                  </span>
                  <textarea
                    value={draft.raw}
                    onChange={(e) => patch({ raw: e.target.value })}
                    rows={4}
                    spellCheck={false}
                    placeholder={
                      variant.company
                        ? `Optional override — paste a posting to replace the ${variant.company} defaults.`
                        : 'Paste the posting. Lines like "Company: Acme" or "Hiring Manager: Dana" are picked up.'
                    }
                    className={`${fieldCls} resize-y font-mono text-[11.5px] leading-relaxed`}
                  />
                </label>

                {ready && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Chip label="Company" value={info.company} />
                    <Chip label="Role" value={info.role || variant.role} muted={!info.role} />
                    {info.hiringManager && <Chip label="Manager" value={info.hiringManager} />}
                    <Chip label="Source" value={usingPaste ? "pasted" : "variants.ts"} muted />
                  </div>
                )}

                <div className="mt-3">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">Tone</span>
                  <div className="mt-1 flex overflow-hidden rounded-lg border border-zinc-200">
                    {TONE_ORDER.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => patch({ tone: t as Tone })}
                        className={`flex-1 px-2 py-1.5 text-[10.5px] font-semibold transition-colors ${
                          draft.tone === t ? "bg-teal-600 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"
                        }`}
                      >
                        {TONE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* specifics */}
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">Specifics</h2>
                <p className="mt-1 text-[10.5px] leading-snug text-zinc-400">
                  The parts a template can&rsquo;t fake. Leave one blank and the review will say so.
                </p>

                <label className="mt-2.5 block">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                    Company hook <span className="text-zinc-300">· rule 2</span>
                  </span>
                  <textarea
                    value={draft.hook}
                    onChange={(e) => patch({ hook: e.target.value })}
                    rows={2}
                    spellCheck={false}
                    placeholder="One true, specific thing: a product decision, a blog post, a talk, an architecture choice."
                    className={`${fieldCls} resize-y`}
                  />
                </label>

                <label className="mt-2.5 block">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                    Why this company <span className="text-zinc-300">· rule 15 / 17</span>
                  </span>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    rows={3}
                    spellCheck={false}
                    placeholder="Used verbatim as the third paragraph. Something you couldn't paste into a competitor's letter."
                    className={`${fieldCls} resize-y`}
                  />
                </label>

                <label className="mt-2.5 block">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                    Human detail <span className="text-zinc-300">· rule 39</span>
                  </span>
                  <textarea
                    value={draft.detail}
                    onChange={(e) => patch({ detail: e.target.value })}
                    rows={2}
                    spellCheck={false}
                    placeholder="A tool you reach for, a decision you'd redo, a specific moment. One sentence."
                    className={`${fieldCls} resize-y`}
                  />
                </label>
              </section>

              {/* actions */}
              <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={copy}
                    disabled={!letter.trim()}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-300 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-zinc-700 shadow-sm transition-colors hover:border-transparent hover:bg-teal-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-700"
                  >
                    {copied ? <ClipboardCheck size={12} /> : <ClipboardCopy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintSignal((n) => n + 1)}
                    disabled={!letter.trim()}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-300 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-zinc-700 shadow-sm transition-colors hover:border-transparent hover:bg-teal-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-700"
                  >
                    <Printer size={12} />
                    Print
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={draft.edited == null}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-40"
                  >
                    <Sparkles size={12} />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={resetInputs}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:text-zinc-700"
                  >
                    <RotateCcw size={12} />
                    Clear fields
                  </button>
                </div>
              </section>
            </div>
          </aside>

          <div className="min-w-0 flex-1 print:block">
            {ready ? (
              <>
                <PrintPreview
                  cv={cv}
                  letter={letter || null}
                  company={info.company}
                  docMode="letter"
                  onDocMode={() => {}}
                  lockDoc="letter"
                />

                <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm print:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">Draft — edit in place</h2>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        draft.edited == null
                          ? "border-teal-200 bg-teal-50 text-teal-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {draft.edited == null ? "Generated" : "Hand-edited"}
                    </span>
                  </div>
                  <textarea
                    value={letter}
                    onChange={(e) => patch({ edited: e.target.value })}
                    rows={16}
                    spellCheck={false}
                    className="mt-2 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11.5px] leading-relaxed text-zinc-700 outline-none transition-colors focus:border-teal-500 focus:bg-white"
                  />
                  <p className="mt-1 text-[10px] leading-snug text-zinc-400">
                    {draft.edited == null
                      ? "This is the generated scaffold. Type to take over; the review updates live."
                      : "Editing by hand — the fields on the left no longer drive this. Regenerate to rebuild."}
                  </p>
                </section>

                {report && (
                  <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm print:hidden">
                    <div className="flex items-center gap-1.5">
                      <FileText size={13} className="text-teal-600" />
                      <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">
                        50-point checklist review
                      </h2>
                    </div>
                    <div className="mt-3">
                      <LetterLint report={report} storageKey={manualKey} />
                    </div>
                  </section>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center print:hidden">
                <p className="text-[13px] font-semibold text-zinc-700">No company yet</p>
                <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-zinc-500">
                  Pick a variant that was tailored for a company, or paste a job posting with a{" "}
                  <code className="rounded bg-zinc-100 px-1 text-zinc-600">Company:</code> line, and the draft plus its
                  review appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Chip({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-500">
      <span className="font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      <span className={muted ? "italic text-zinc-400" : "text-zinc-700"}>{value}</span>
    </span>
  );
}
