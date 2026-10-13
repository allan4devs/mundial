"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronRight, Info, X } from "lucide-react";
import { MANUAL_RULES } from "./cover-letter-lint";
import { LINT_GROUP_ORDER, type LintReport, type Severity } from "./cover-letter-types";

const SEV_DOT: Record<Severity, string> = {
  fail: "bg-rose-500",
  warn: "bg-amber-500",
  info: "bg-zinc-300",
};
const SEV_ICON: Record<Severity, typeof X> = { fail: X, warn: AlertTriangle, info: Info };

function scoreText(score: number): string {
  if (score >= 85) return "text-teal-700";
  if (score >= 65) return "text-amber-600";
  return "text-rose-600";
}
function scoreBar(score: number): string {
  if (score >= 85) return "bg-teal-500";
  if (score >= 65) return "bg-amber-500";
  return "bg-rose-500";
}

export function LetterLint({
  report,
  storageKey,
  dense = false,
}: {
  report: LintReport;
  /** localStorage key for the manual-checklist ticks, e.g. "cv:cl:manual:base". */
  storageKey: string;
  dense?: boolean;
}) {
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [showInfo, setShowInfo] = useState(false);
  const [showManual, setShowManual] = useState(!dense);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setChecks(raw ? (JSON.parse(raw) as Record<number, boolean>) : {});
    } catch {
      setChecks({});
    }
  }, [storageKey]);

  const toggle = (rule: number) => {
    setChecks((prev) => {
      const next = { ...prev, [rule]: !prev[rule] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const auto = report.findings.filter((f) => f.rule > 0);
  const shown = auto.filter((f) => f.severity !== "info" || showInfo);
  const infoCount = auto.filter((f) => f.severity === "info").length;
  const manualDone = MANUAL_RULES.filter((m) => checks[m.rule]).length;

  const groups = useMemo(
    () =>
      LINT_GROUP_ORDER.map((g) => ({
        group: g,
        items: shown.filter((f) => f.group === g),
      })).filter((x) => x.items.length > 0),
    [shown],
  );

  return (
    <div>
      {/* score */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[22px] font-bold tabular-nums ${scoreText(report.score)}`}>{report.score}</span>
          <span className="text-[11px] font-semibold text-zinc-400">/ 100 checklist score</span>
        </div>
        <span className="text-[10.5px] tabular-nums text-zinc-500">
          {report.wordCount}w · {report.paragraphs}¶ · {report.sentences} sent.
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full rounded-full ${scoreBar(report.score)}`} style={{ width: `${report.score}%` }} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide">
        <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-rose-700">
          {report.counts.fail} fail
        </span>
        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-700">
          {report.counts.warn} warn
        </span>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-zinc-500">
          {report.passed.length}/{report.autoTotal} auto rules clean
        </span>
      </div>

      {/* findings */}
      {groups.length === 0 ? (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-2 text-[11px] font-medium text-teal-800">
          <Check size={13} /> Every automated check passes. Still do the human read below.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <h4 className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">{group}</h4>
              <ul className="mt-1 space-y-1.5">
                {items.map((f, i) => {
                  const Icon = SEV_ICON[f.severity];
                  return (
                    <li key={`${f.rule}-${i}`} className="flex gap-2">
                      <span
                        className={`mt-1 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${SEV_DOT[f.severity]}`}
                      >
                        <Icon size={9} className="text-white" strokeWidth={3} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold leading-snug text-zinc-800">
                          <span className="tabular-nums text-zinc-400">#{f.rule}</span> {f.title}
                        </p>
                        {f.detail && <p className="text-[10.5px] leading-snug text-zinc-500">{f.detail}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {infoCount > 0 && (
        <button
          type="button"
          onClick={() => setShowInfo((s) => !s)}
          className="mt-2 text-[10.5px] font-bold uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-800"
        >
          {showInfo ? "▾" : "▸"} {infoCount} advisory note{infoCount === 1 ? "" : "s"}
        </button>
      )}

      {/* manual checklist */}
      <div className="mt-3 border-t border-zinc-100 pt-2.5">
        <button
          type="button"
          onClick={() => setShowManual((s) => !s)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            Human read — {manualDone}/{MANUAL_RULES.length}
          </span>
          {showManual ? (
            <ChevronDown size={13} className="text-zinc-400" />
          ) : (
            <ChevronRight size={13} className="text-zinc-400" />
          )}
        </button>
        {showManual && (
          <ul className="mt-2 space-y-1.5">
            {MANUAL_RULES.map((m) => (
              <li key={m.rule}>
                <label className="flex cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(checks[m.rule])}
                    onChange={() => toggle(m.rule)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-teal-600"
                  />
                  <span
                    className={`text-[11px] leading-snug ${checks[m.rule] ? "text-zinc-400 line-through" : "text-zinc-600"}`}
                  >
                    <span className="tabular-nums text-zinc-400">#{m.rule}</span> {m.text}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
