// ─────────────────────────────────────────────────────────────
// /cv/stats — every résumé variant measured side by side.
//
// Purpose: know the word/character ceiling for each slot (summary paragraph,
// highlight, sidebar skill line, experience bullet) so tailoring a new variant
// stays inside what fits on one A4 page. All numbers come from ./stats; all
// shared facts from the flat cv-definition-* modules.
// ─────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import Link from "next/link";
import { cvVariants } from "../variants";
import { VARIANT_CV } from "../data/cv-data";
import {
  ENGLISH_LEVEL,
  LOCATION_LINE,
  certifications,
  complianceExposure,
  education,
  graduationProject,
  JOBS,
} from "../data/cv-definitions";
import {
  JOB_BUDGETS,
  KIND_BUDGETS,
  MATRIX_ROWS,
  VARIANT_ORDER,
  VARIANT_STATS,
  rowSectionLabel,
  type Band,
  type MatrixRow,
} from "../stats";

const SHORT: Record<string, string> = {
  base: "Master",
  "agentic-ai": "AI",
  "python-react-lead": "Lead",
  "python-react-aws": "Py/AWS",
  "python-dotnet": "Py/.NET",
  java: "Java",
  elasticsearch: "ES",
  "electric-air": "Django",
  designli: "R/Nest",
};
const short = (key: string) => SHORT[key] ?? key;

const bandText = (b: Band) => `${b.min}–${b.max}`;
const tealBg = (ratio: number) => {
  const a = Math.max(0, Math.min(1, ratio));
  return `rgba(13,148,136,${(0.05 + a * 0.4).toFixed(3)})`;
};

// ── shared-definition usage (which variant picks which wording) ──
const identityUsage = cvVariants.map((v) => {
  const cv = VARIANT_CV[v.slug];
  return {
    key: v.slug === "" ? "base" : v.slug,
    loc: cv.contactInfo[0]?.text ?? "",
    eng: cv.languages.find((l) => l.language === "English")?.level ?? "",
  };
});
const usageFor = (value: string, field: "loc" | "eng") =>
  identityUsage.filter((u) => u[field] === value).map((u) => short(u.key));

export default function CvStatsPage() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-800">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            <Link href="/cv" className="hover:text-teal-700">
              ← /cv
            </Link>
            <span>·</span>
            <span className="text-zinc-500">word budgets</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">CV word budgets</h1>
          <p className="max-w-3xl text-[13px] leading-relaxed text-zinc-600">
            Every variant is a fixed one-page sheet. Below is the observed word / character band for each slot across all{" "}
            <strong>{VARIANT_STATS.length}</strong> variants — the <em>max</em> column is the practical ceiling that still
            fits on one page, so it&rsquo;s how much room you have when adapting a bullet, skill line, or summary.
          </p>
        </header>

        {/* ── budgets ──────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">Slot budgets</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KIND_BUDGETS.map((k) => (
              <div key={k.kind} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-[12px] font-bold text-zinc-900">{k.label}</p>
                <p className="mt-0.5 text-[10.5px] uppercase tracking-wide text-zinc-400">{k.words.n} slots measured</p>
                <dl className="mt-3 space-y-1.5 text-[12px] tabular-nums">
                  <Row label="Words" a={`${bandText(k.words)}`} b={`avg ${k.words.mean} · p50 ${k.words.p50}`} />
                  <Row label="Chars" a={`${bandText(k.chars)}`} b={`avg ${k.chars.mean} · p50 ${k.chars.p50}`} />
                  {k.items && <Row label="Chips" a={`${bandText(k.items)}`} b={`avg ${k.items.mean}`} />}
                </dl>
                <p className="mt-3 rounded-md bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800">
                  ceiling: {k.words.max} words · {k.chars.max} chars
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── per-variant totals ───────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">Per-variant totals</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[10.5px] uppercase tracking-wide text-zinc-400">
                  <th className="px-3 py-2 font-semibold">Variant</th>
                  <th className="px-3 py-2 font-semibold">Title</th>
                  <th className="px-3 py-2 text-right font-semibold">Jobs</th>
                  <th className="px-3 py-2 text-right font-semibold">Bullets</th>
                  <th className="px-3 py-2 text-right font-semibold">Summary w</th>
                  <th className="px-3 py-2 text-right font-semibold">Bullet w</th>
                  <th className="px-3 py-2 text-right font-semibold">Skill chars</th>
                  <th className="px-3 py-2 text-right font-semibold">Chips</th>
                  <th className="px-3 py-2 text-right font-semibold">Total w</th>
                  <th className="px-3 py-2 text-center font-semibold">Band</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {VARIANT_STATS.map((v) => (
                  <tr key={v.key} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2 font-semibold text-zinc-900">
                      <Link href={v.slug ? `/cv/${v.slug}` : "/cv"} className="hover:text-teal-700">
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-zinc-500">{v.title}</td>
                    <td className="px-3 py-2 text-right">{v.jobs}</td>
                    <td className="px-3 py-2 text-right">{v.bullets}</td>
                    <td className="px-3 py-2 text-right">{v.totals.summary.words}</td>
                    <td className="px-3 py-2 text-right">{v.totals.bullets.words}</td>
                    <td className="px-3 py-2 text-right">{v.totals.skillsChars}</td>
                    <td className="px-3 py-2 text-right">{v.totals.skillsChips}</td>
                    <td className="px-3 py-2 text-right font-semibold text-zinc-900">{v.totals.words}</td>
                    <td className="px-3 py-2 text-center">{v.hasHighlights ? "★ band" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── comparison matrix ────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            Slot × variant — words
          </h2>
          <p className="text-[11.5px] text-zinc-500">
            Each cell is the word count of that slot in that variant. Darker = longer; a <strong>bold</strong> cell is the
            longest version of that slot anywhere (its ceiling). Hover a cell for characters + full text.
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-[720px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-zinc-200 text-[10px] uppercase tracking-wide text-zinc-400">
                  <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-semibold">Slot</th>
                  {VARIANT_ORDER.map((v) => (
                    <th key={v.key} className="px-2 py-2 text-center font-semibold" title={v.name}>
                      {short(v.key)}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-semibold">Band</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {renderMatrix()}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── per-job budgets ──────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">Per-job bullet budgets</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[10.5px] uppercase tracking-wide text-zinc-400">
                  <th className="px-3 py-2 font-semibold">Job</th>
                  <th className="px-3 py-2 font-semibold">Period</th>
                  <th className="px-3 py-2 text-right font-semibold">In variants</th>
                  <th className="px-3 py-2 text-right font-semibold">Bullets / variant</th>
                  <th className="px-3 py-2 text-right font-semibold">Bullet words</th>
                  <th className="px-3 py-2 text-right font-semibold">Bullet chars</th>
                  <th className="px-3 py-2 text-right font-semibold">Pool</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {JOB_BUDGETS.map((j) => (
                  <tr key={j.key} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2 font-semibold text-zinc-900">{j.company}</td>
                    <td className="px-3 py-2 text-zinc-500">{j.period}</td>
                    <td className="px-3 py-2 text-right">{j.usedByVariants}</td>
                    <td className="px-3 py-2 text-right">
                      {bandText(j.bulletsPerVariant)} <span className="text-zinc-400">(avg {j.bulletsPerVariant.mean})</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {bandText(j.bulletWords)} <span className="text-zinc-400">(avg {j.bulletWords.mean})</span>
                    </td>
                    <td className="px-3 py-2 text-right">{bandText(j.bulletChars)}</td>
                    <td className="px-3 py-2 text-right">{j.poolSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {JOB_BUDGETS.some((j) => j.offMenu.length > 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[11.5px] text-amber-900">
              <p className="font-bold">Drift — live bullets not in the pool (fold back into cv-definition-jobs.ts):</p>
              <ul className="mt-1.5 space-y-1">
                {JOB_BUDGETS.flatMap((j) =>
                  j.offMenu.map((o, i) => (
                    <li key={`${j.key}-${i}`}>
                      <span className="font-semibold">{j.shortName}</span> · <span className="text-amber-700">{o.key}</span>{" "}
                      — {o.text}
                    </li>
                  )),
                )}
              </ul>
            </div>
          )}
        </section>

        {/* ── shared definitions ───────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.16em] text-zinc-500">Shared definitions</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-[12px] shadow-sm">
              <p className="text-[12px] font-bold text-zinc-900">Identity — location line</p>
              <ul className="mt-2 space-y-1.5">
                {Object.entries(LOCATION_LINE).map(([key, val]) => (
                  <li key={key} className="flex flex-wrap items-baseline gap-x-2">
                    <code className="rounded bg-zinc-100 px-1 text-[11px] text-zinc-600">{key}</code>
                    <span className="text-zinc-500">{val}</span>
                    <span className="text-[11px] text-teal-700">{usageFor(val, "loc").join(", ") || "unused"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] font-bold text-zinc-900">Identity — English level</p>
              <ul className="mt-2 space-y-1.5">
                {Object.entries(ENGLISH_LEVEL).map(([key, val]) => (
                  <li key={key} className="flex flex-wrap items-baseline gap-x-2">
                    <code className="rounded bg-zinc-100 px-1 text-[11px] text-zinc-600">{key}</code>
                    <span className="text-zinc-500">{val}</span>
                    <span className="text-[11px] text-teal-700">{usageFor(val, "eng").join(", ") || "unused"}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-[12px] shadow-sm">
              <p className="text-[12px] font-bold text-zinc-900">Education — identical across all variants</p>
              <p className="mt-2 text-zinc-600">
                {education.degree} · {education.school} · {education.period}
                <br />
                {education.internshipLabel} {education.internship}
              </p>
              <p className="mt-3 text-[12px] font-bold text-zinc-900">Certifications</p>
              <p className="mt-1 text-zinc-600">
                {certifications.length === 0 ? "None held yet." : `${certifications.length} on file.`}
              </p>
              <p className="mt-2 text-[11.5px] font-semibold text-zinc-500">Compliance exposure</p>
              <ul className="mt-1 space-y-0.5 text-zinc-600">
                {complianceExposure.map((c) => (
                  <li key={c.framework}>
                    {c.framework} — {c.context} ({c.years})
                  </li>
                ))}
                <li>
                  {graduationProject.title}: {graduationProject.host} ({graduationProject.year})
                </li>
              </ul>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[10.5px] uppercase tracking-wide text-zinc-400">
                  <th className="px-3 py-2 font-semibold">Job</th>
                  <th className="px-3 py-2 font-semibold">Canonical company</th>
                  <th className="px-3 py-2 font-semibold">Period</th>
                  <th className="px-3 py-2 font-semibold">Location</th>
                  <th className="px-3 py-2 text-right font-semibold">Role titles</th>
                  <th className="px-3 py-2 text-right font-semibold">Pool</th>
                </tr>
              </thead>
              <tbody>
                {JOBS.map((j) => (
                  <tr key={j.key} className="border-b border-zinc-100 last:border-0">
                    <td className="px-3 py-2 font-semibold text-zinc-900">{j.shortName}</td>
                    <td className="px-3 py-2 text-zinc-600">
                      {j.company}
                      {j.companyVariants.length > 0 && (
                        <span className="text-amber-700"> · also: {j.companyVariants.join(" / ")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">{j.period}</td>
                    <td className="px-3 py-2 text-zinc-500">{j.location}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{j.roleTitles.length}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{j.bulletPool.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

// ── helpers ─────────────────────────────────────────────────

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="text-right">
        <span className="font-semibold text-zinc-900">{a}</span> <span className="text-zinc-400">{b}</span>
      </dd>
    </div>
  );
}

function renderMatrix() {
  const out: ReactNode[] = [];
  let lastSection = "";

  for (const row of MATRIX_ROWS) {
    const section = rowSectionLabel(row);
    if (section !== lastSection) {
      lastSection = section;
      out.push(
        <tr key={`sec-${section}`} className="bg-zinc-50">
          <td
            colSpan={VARIANT_ORDER.length + 2}
            className="sticky left-0 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500"
          >
            {section}
          </td>
        </tr>,
      );
    }
    out.push(<MatrixRowTr key={row.align} row={row} />);
  }
  return out;
}

function MatrixRowTr({ row }: { row: MatrixRow }) {
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-medium text-zinc-600"
        title={row.align}
      >
        {row.label}
      </th>
      {VARIANT_ORDER.map((v) => {
        const slot = row.byVariant[v.key];
        if (!slot) {
          return (
            <td key={v.key} className="px-2 py-1.5 text-center text-zinc-300">
              ·
            </td>
          );
        }
        const isMax = slot.words === row.band.max && row.band.max > 0;
        return (
          <td
            key={v.key}
            className={`px-2 py-1.5 text-center ${isMax ? "font-bold text-zinc-900" : "text-zinc-600"}`}
            style={{ backgroundColor: tealBg(row.band.max ? slot.words / row.band.max : 0) }}
            title={`${slot.words} words · ${slot.chars} chars\n${slot.text}`}
          >
            {slot.words}
          </td>
        );
      })}
      <td className="px-2 py-1.5 text-center text-[10px] text-zinc-400">{bandText(row.band)}</td>
    </tr>
  );
}
