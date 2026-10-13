"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Copy, Download, ExternalLink } from "lucide-react";
import { CV_JD_DRAFT_KEY, CV_JD_MAX_LENGTH } from "@/lib/cv/draft";
import type { ScrapedField, ScrapedJobPosting, ScrapeResult } from "@/lib/cv/scraper/types";

const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40";

function jobText(job: ScrapedJobPosting): string {
  return [job.title, job.company, job.location, job.employmentType, job.description].filter(Boolean).join("\n\n");
}

function downloadFile(name: string, content: string, type: string) {
  const blobUrl = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

function publicLink(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function CvScrapeResults({ result }: { result: ScrapeResult }) {
  const router = useRouter();
  const initialJob = result.jobPostings.findIndex((job) => job.description.trim().length > 0);
  const [selection, setSelection] = useState(initialJob >= 0 ? `job:${initialJob}` : "page");
  const [text, setText] = useState(initialJob >= 0 ? jobText(result.jobPostings[initialJob]) : result.pageText);
  const [filter, setFilter] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fields = [...result.forms.flatMap((form) => form.fields), ...result.looseFields];
  const query = filter.trim().toLowerCase();
  const matches = (item: ScrapedField) => (showHidden || item.type !== "hidden") &&
    (!query || [item.label, item.name, item.id, item.type, item.placeholder].some((value) => value?.toLowerCase().includes(query)));
  const visibleCount = fields.filter(matches).length;
  const textLength = text.trim().length;
  const canImport = textLength >= 100 && text.length <= CV_JD_MAX_LENGTH;
  const selectedJob = selection.startsWith("job:") ? result.jobPostings[Number(selection.slice(4))] : undefined;

  function changeSelection(value: string) {
    setSelection(value);
    setText(value === "page" ? result.pageText : jobText(result.jobPostings[Number(value.slice(4))]));
    setNotice(null);
    setError(null);
  }

  async function copyText() {
    setError(null);
    setNotice(null);
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Job text copied.");
    } catch { setError("Copy is unavailable here. Select the text below or download it instead."); }
  }

  function useInGenerator() {
    setError(null);
    if (!canImport) return;
    try {
      sessionStorage.setItem(CV_JD_DRAFT_KEY, text.trim());
      router.push("/cv");
    } catch { setError("Browser storage is unavailable. Copy or download the text, then paste it into the CV generator."); }
  }

  return <section aria-label="Scan results" className="mt-8 space-y-6">
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p role="status" className="text-xs font-semibold uppercase tracking-wide text-teal-700">Scan complete</p>
          <h2 className="mt-2 break-words text-2xl font-semibold">{result.title || "Scanned website"}</h2>
          <a href={publicLink(result.url)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex max-w-full items-center gap-2 break-all text-sm text-teal-700 underline">{result.url}<ExternalLink size={14} className="shrink-0" aria-hidden="true" /></a>
          {result.description && <p className="mt-3 text-sm leading-relaxed text-zinc-600">{result.description}</p>}
        </div>
        <button type="button" onClick={() => downloadFile("cv-website-scan.json", JSON.stringify(result, null, 2), "application/json;charset=utf-8")} className={secondaryButton}><Download size={16} aria-hidden="true" /> Export scan JSON</button>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4 sm:grid-cols-4">
        <Stat label="Forms detected" value={result.formCount} />
        <Stat label="Fields extracted" value={fields.length} />
        <Stat label="Required fields" value={fields.filter((item) => item.required).length} />
        <Stat label="Job postings" value={result.jobPostings.length} />
      </dl>
    </div>
    {result.warnings.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <h2 className="font-semibold">Scan notes</h2><ul className="mt-2 list-disc space-y-2 pl-5">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
    </div>}
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold">Review the job text</h2>
      <p id="scrape-text-help" className="mt-2 text-sm leading-relaxed text-zinc-600">Keep the role, responsibilities, and requirements. Remove page noise before using this text for your CV.</p>
      {result.jobPostings.length > 0 && <div className="mt-5">
        <label htmlFor="scrape-text-source" className="mb-2 block text-sm font-medium">Text source</label>
        <select id="scrape-text-source" value={selection} onChange={(event) => changeSelection(event.target.value)} className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm">
          {result.jobPostings.map((job, index) => <option key={index} value={`job:${index}`}>{job.title || `Job ${index + 1}`}{job.company ? ` · ${job.company}` : ""}</option>)}
          <option value="page">Full page text</option>
        </select>
      </div>}
      {selectedJob && <dl className="mt-4 grid gap-x-5 gap-y-2 text-xs text-zinc-600 sm:grid-cols-2">
        {selectedJob.location && <div><dt className="inline font-semibold">Location: </dt><dd className="inline">{selectedJob.location}</dd></div>}
        {selectedJob.employmentType && <div><dt className="inline font-semibold">Employment: </dt><dd className="inline">{selectedJob.employmentType}</dd></div>}
        {selectedJob.salary && <div><dt className="inline font-semibold">Published salary: </dt><dd className="inline">{selectedJob.salary}</dd></div>}
        {selectedJob.datePosted && <div><dt className="inline font-semibold">Posted: </dt><dd className="inline">{selectedJob.datePosted}</dd></div>}
        {selectedJob.validThrough && <div><dt className="inline font-semibold">Listed expiry: </dt><dd className="inline">{selectedJob.validThrough}</dd></div>}
        {publicLink(selectedJob.url) && <div><a href={publicLink(selectedJob.url)} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">Open job posting ↗</a></div>}
      </dl>}
      <label htmlFor="scraped-job-text" className="mb-2 mt-5 block text-sm font-medium">Editable description</label>
      <textarea id="scraped-job-text" value={text} onChange={(event) => { setText(event.target.value); setNotice(null); setError(null); }} rows={14} maxLength={CV_JD_MAX_LENGTH} aria-describedby="scrape-text-help scrape-text-length" placeholder="No readable job description found. Paste the role and requirements here." className="w-full resize-y rounded-xl border border-zinc-300 p-4 text-sm leading-relaxed outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
      <p id="scrape-text-length" className="mt-2 text-xs text-zinc-500">{text.length.toLocaleString()} / {CV_JD_MAX_LENGTH.toLocaleString()} characters. Use at least 100 characters for CV generation.</p>
      {text.length > CV_JD_MAX_LENGTH && <p role="alert" className="mt-2 text-sm text-amber-800">Shorten the extracted text to 40,000 characters before importing it.</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={useInGenerator} disabled={!canImport} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"><ArrowRight size={16} aria-hidden="true" /> Use in CV generator</button>
        <button type="button" onClick={() => void copyText()} disabled={!textLength} className={secondaryButton}><Copy size={16} aria-hidden="true" /> Copy text</button>
        <button type="button" onClick={() => downloadFile("job-description.txt", text, "text/plain;charset=utf-8")} disabled={!textLength} className={secondaryButton}><Download size={16} aria-hidden="true" /> Download text</button>
      </div>
      {notice && <p role="status" className="mt-4 text-sm text-teal-700">{notice}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold">Application fields</h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium">Filter fields<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Label, name, type, or placeholder" className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm font-normal" /></label>
        <label className="flex items-center gap-2 pb-3 text-sm text-zinc-600"><input type="checkbox" checked={showHidden} onChange={(event) => setShowHidden(event.target.checked)} /> Show hidden fields</label>
      </div>
      <p className="mt-3 text-xs text-zinc-500">{visibleCount} of {fields.length} extracted fields shown. Passwords and hidden values are omitted.</p>
      <div className="mt-5 space-y-4">
        {result.forms.map((form) => {
          const visible = form.fields.filter(matches);
          if (!visible.length && (query || form.fields.length)) return null;
          return <details key={form.index} open className="rounded-xl border border-zinc-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold">Form {form.index}{form.name || form.id ? ` · ${form.name || form.id}` : ""} · {form.method} · {visible.length} fields</summary>
            <p className="mt-3 break-all text-xs text-zinc-500">Action: {form.action || "Not specified"}{form.enctype ? ` · ${form.enctype}` : ""}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{visible.map((item, index) => <FieldCard key={index} field={item} />)}</div>
            {!form.fields.length && <p className="mt-3 text-sm text-zinc-500">No fields found in this form.</p>}
          </details>;
        })}
        {result.looseFields.some(matches) && <details open className="rounded-xl border border-zinc-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Fields outside forms</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{result.looseFields.filter(matches).map((item, index) => <FieldCard key={index} field={item} />)}</div></details>}
        {!visibleCount && <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">{fields.length ? "No fields match the current filters." : "No application fields were found in the downloaded page."}</p>}
      </div>
    </section>
    {result.links.length > 0 && <details className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7"><summary className="cursor-pointer font-semibold">Page links ({result.links.length})</summary><ul className="mt-4 space-y-3 text-sm">{result.links.map((link, index) => <li key={index}><a href={publicLink(link.url)} target="_blank" rel="noopener noreferrer" className="break-all text-teal-700 underline">{link.text || link.url}</a></li>)}</ul></details>}
  </section>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd></div>;
}

function FieldCard({ field }: { field: ScrapedField }) {
  const flags = [field.disabled && "Disabled", field.readOnly && "Read only", field.multiple && "Multiple", field.checked && "Checked"].filter(Boolean);
  const properties = [["Name", field.name], ["ID", field.id], ["Placeholder", field.placeholder], ["Value", field.value], ["Autocomplete", field.autocomplete], ["Accepted files", field.accept]].filter(([, value]) => value !== null && value !== "");
  return <article className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="break-words text-sm font-semibold">{field.label || field.name || field.id || "Unnamed field"}</h3><span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${field.required ? "bg-amber-100 text-amber-800" : "bg-zinc-200 text-zinc-600"}`}>{field.required ? "Required" : "Optional"}</span></div>
    <p className="mt-2 text-xs text-zinc-600">Type: <code>{field.type}</code>{flags.length ? ` · ${flags.join(" · ")}` : ""}</p>
    <dl className="mt-2 space-y-1 text-xs text-zinc-600">{properties.map(([label, value]) => <div key={label} className="break-words"><dt className="inline font-medium">{label}: </dt><dd className="inline whitespace-pre-wrap">{value}</dd></div>)}</dl>
    {field.options && field.options.length > 0 && <details className="mt-3"><summary className="cursor-pointer text-xs font-medium">Options ({field.options.length})</summary><ul className="mt-2 space-y-1 text-xs text-zinc-600">{field.options.map((option, index) => <li key={index} className="break-words">{option.text || "Empty option"}{option.value ? ` (${option.value})` : ""}{option.selected ? " · selected" : ""}{option.disabled ? " · disabled" : ""}</li>)}</ul></details>}
  </article>;
}
