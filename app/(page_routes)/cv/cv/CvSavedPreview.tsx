"use client";

import Link from "next/link";
import { useState } from "react";
import { Printer, Download } from "lucide-react";
import { materialize } from "../editableCv";
import { PrintPreview } from "../PrintPreview";
import { PRINT_CSS } from "../design";
import type { SavedCv, CvResult } from "@/lib/cv/types";

function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function cvText(cv: SavedCv): string {
  return [cv.personalInfo.name, cv.personalInfo.title, ...cv.contactInfo.map((item) => item.text), "", "PROFILE", ...cv.summary, "", "SKILLS",
    ...[...cv.primarySkills, ...cv.secondarySkills].map((group) => `${group.label}: ${group.items.join(", ")}`), "", "EXPERIENCE",
    ...cv.experience.flatMap((job) => [`${job.role} | ${job.company}`, `${job.period} | ${job.location}`, ...job.bullets.map((bullet) => `• ${bullet}`), ""]),
    "EDUCATION", `${cv.education.degree} | ${cv.education.school} | ${cv.education.period}`, `${cv.education.internshipLabel} ${cv.education.internship}`, "", "LANGUAGES",
    ...cv.languages.map((item) => `${item.language}: ${item.level}`)].join("\n");
}

export function CvSavedPreview({ savedCv, result, archive = false }: { savedCv: SavedCv; result?: CvResult; archive?: boolean }) {
  const [copyError, setCopyError] = useState<string | null>(null);
  const cv = { ...materialize(savedCv), density: savedCv.density };
  const filename = `${savedCv.personalInfo.name}-${savedCv.personalInfo.title}`.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 110);
  return <main className="min-h-screen bg-[#f5f4f0] px-4 py-8 text-zinc-900 print:min-h-0 print:bg-white print:p-0">
    <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
    <div className="mx-auto max-w-6xl print:max-w-none">
      <header className="cv-print-hide mb-8">
        <Link href={archive ? "/cv/cv-archive" : "/cv"} className="text-sm text-zinc-500">← {archive ? "CV archive" : "New CV"}</Link>
        <h1 className="mt-5 text-2xl font-semibold">{archive ? "Archived CV" : result?.jd.title ?? "Your CV"}</h1>
        {result?.jd.company && <p className="mt-1 text-sm text-zinc-500">{result.jd.company}</p>}
        {result?.method === "local" && <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">Generated from your saved experience. <Link href="/cv/profile" className="underline">Add or improve your facts</Link> for future CVs.</p>}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-white"><Printer size={15} /> Print / Save PDF</button>
          <button onClick={() => download(cvText(savedCv), "text/plain;charset=utf-8", `${filename}.txt`)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2"><Download size={15} /> Download text</button>
          <button onClick={async () => { try { await navigator.clipboard.writeText(cvText(savedCv)); setCopyError("CV text copied."); } catch { setCopyError("Copy failed. Use Download text instead."); } }} className="rounded-lg border border-zinc-300 px-4 py-2">Copy CV</button>
          <button onClick={() => download(JSON.stringify(result ?? savedCv, null, 2), "application/json", `${filename}.json`)} className="rounded-lg border border-zinc-300 px-4 py-2">Download source</button>
        </div>
        {copyError && <p role="status" className="mt-3 text-sm text-zinc-500">{copyError}</p>}
      </header>
      <div className={`grid gap-8 print:block ${result ? "lg:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
        <div className="min-w-0"><PrintPreview cv={cv} lockDoc="resume" /></div>
        {result && <aside className="cv-print-hide space-y-6 text-sm">
          <section><h2 className="font-semibold">Supported keywords</h2><div className="mt-3 flex flex-wrap gap-2">{result.draft.keywordMatches.map((match) => <span key={match.term} className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs text-teal-800">{match.term}</span>)}</div>{!result.draft.keywordMatches.length && <p className="mt-2 text-zinc-500">No direct keyword matches found.</p>}</section>
          <section><h2 className="font-semibold">Requirements to review</h2><p className="mt-2 text-xs leading-relaxed text-zinc-500">These terms have no matching evidence in your archived CVs and were left out of your claims.</p><div className="mt-3 flex flex-wrap gap-2">{result.gaps.map((gap) => <span key={gap} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">{gap}</span>)}</div>{!result.gaps.length && <p className="mt-2 text-xs text-zinc-500">All extracted keywords have supporting evidence. Review the full requirements before applying.</p>}</section>
          <details><summary className="cursor-pointer font-semibold">Cleaned job description</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">{result.jd.cleanedText}</p></details>
          {Boolean(result.omittedKeywords?.length) && <details><summary className="cursor-pointer font-semibold">Supported, but not included here</summary><p className="mt-2 text-xs leading-relaxed text-zinc-500">Your source CVs support these terms. They were omitted from this CV to keep it concise: {result.omittedKeywords?.join(", ")}.</p></details>}
          <details><summary className="cursor-pointer font-semibold">Keywords and source quotes</summary><ul className="mt-3 space-y-3">{result.jd.keywords.map((keyword) => <li key={keyword.term}><p className="text-xs font-semibold">{keyword.term} · {keyword.priority}</p><p className="mt-1 text-xs leading-relaxed text-zinc-500">“{keyword.quote}”</p></li>)}</ul></details>
          <details><summary className="cursor-pointer font-semibold">Original CV evidence</summary><ul className="mt-3 space-y-4">{result.evidence.map((proof) => <li key={proof.id}><p className="text-xs leading-relaxed text-zinc-600">{proof.text}</p><Link href={proof.archives[0] === "profile" ? "/cv/profile" : `/cv/cv-archive/${proof.archives[0] || "master"}`} className="mt-1 inline-block text-xs text-teal-700 underline">{proof.archives[0] === "profile" ? "Open saved experience" : "Open archived source"}</Link></li>)}</ul></details>
          <p className="text-xs leading-relaxed text-zinc-500">{result.method === "local" ? "Requirements are matched by their wording in your saved evidence. Years, exact versions, and certifications still need your review. " : ""}Review the wording and page fit before sending.</p>
        </aside>}
      </div>
    </div>
  </main>;
}
