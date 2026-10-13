"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCopy, FileText, Printer, RefreshCw } from "lucide-react";
import type { CoverLetterData, CvLang, ResumeData } from "./types";
import { buildCoverLetter } from "./coverLetter";
import type { UiStrings } from "./i18n";

export function CoverLetterPanel({
  data,
  cover,
  cvLang,
  ui,
  onCover,
  onPrint,
}: {
  data: ResumeData;
  cover: CoverLetterData;
  cvLang: CvLang;
  ui: UiStrings;
  onCover: (patch: Partial<CoverLetterData>) => void;
  onPrint: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const auto = useMemo(
    () => buildCoverLetter(data, { ...cover, override: null }, cvLang),
    [data, cover, cvLang],
  );
  const text = cover.override ?? auto;
  const ready = cover.company.trim().length > 0;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500";
  const labelCls = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400";

  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{ui.clCompany}</span>
          <input value={cover.company} onChange={(e) => onCover({ company: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>{ui.clRole}</span>
          <input value={cover.role} onChange={(e) => onCover({ role: e.target.value })} className={inputCls} placeholder={data.headline} />
        </label>
        <label className="block">
          <span className={labelCls}>{`${ui.clRecipient} (${ui.optional})`}</span>
          <input value={cover.recipient} onChange={(e) => onCover({ recipient: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>{`${ui.clChannel} (${ui.optional})`}</span>
          <input value={cover.channel} onChange={(e) => onCover({ channel: e.target.value })} className={inputCls} placeholder="correo / LinkedIn" />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>{ui.clHook}</span>
        <textarea
          value={cover.hook}
          onChange={(e) => onCover({ hook: e.target.value })}
          rows={2}
          spellCheck={false}
          className={`${inputCls} resize-y leading-relaxed`}
        />
      </label>

      {!ready ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
          <FileText size={13} />
          {ui.clNeedCompany}
        </p>
      ) : (
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {ui.coverLetter}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onCover({ override: buildCoverLetter(data, { ...cover, override: null }, cvLang) })}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
              >
                <RefreshCw size={12} />
                {ui.clRegenerate}
              </button>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
              >
                {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
                {copied ? ui.copied : ui.copy}
              </button>
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
              >
                <Printer size={12} />
                {ui.printLetter}
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => onCover({ override: e.target.value })}
            rows={18}
            spellCheck={false}
            className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-zinc-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[10.5px] leading-snug text-zinc-400">{ui.clEditNote}</p>
            {cover.override != null && (
              <button
                type="button"
                onClick={() => onCover({ override: null })}
                className="shrink-0 text-[10.5px] font-semibold text-teal-600 hover:text-teal-800"
              >
                ↺ auto
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Plain-text letter rendered as a clean sheet for printing. */
export function PrintableLetter({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  const [head, ...body] = blocks;
  const headLines = head.split("\n");
  return (
    <article className="mx-auto w-[816px] bg-white px-[72px] py-[72px] text-zinc-800">
      <header className="mb-8 border-b border-zinc-200 pb-4">
        <p className="font-[family-name:var(--font-bricolage)] text-xl font-bold tracking-tight text-zinc-900">
          {headLines[0]}
        </p>
        {headLines.slice(1).map((l, i) => (
          <p key={i} className="mt-0.5 text-[12px] text-zinc-500">
            {l}
          </p>
        ))}
      </header>
      {body.map((b, i) => (
        <p key={i} className={`whitespace-pre-line text-[13px] leading-relaxed ${i === 0 ? "" : "mt-4"}`}>
          {b}
        </p>
      ))}
    </article>
  );
}
