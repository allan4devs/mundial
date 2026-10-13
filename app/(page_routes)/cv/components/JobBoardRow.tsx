"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink, FileText, Mail, Star } from "lucide-react";
import {
  STATUS_CLASS,
  STATUS_LABEL,
  STATUS_ORDER,
  type ApplicationState,
  type ApplicationStatus,
} from "../applications";
import { isFilledJob } from "../java-react-jobs-helpers";
import type { JobLead, JobLeadPatch } from "../java-react-jobs-types";
import { FIELD_CLASS, MATCH_CLASS, MATCH_LABEL } from "../java-react-jobs-values";
import { Field } from "./JobBoardField";

export function JobRow({
  job,
  number,
  state,
  open,
  onToggle,
  onJobChange,
  onApplicationChange,
}: {
  job: JobLead;
  number: number;
  state: ApplicationState;
  open: boolean;
  onToggle: () => void;
  onJobChange: (patch: JobLeadPatch) => void;
  onApplicationChange: (patch: Partial<ApplicationState>) => void;
}) {
  const filled = isFilledJob(job);
  return (
    <article className="[content-visibility:auto] rounded-xl border border-zinc-800 bg-zinc-900/70 transition-colors hover:border-zinc-700">
      <div className="grid items-center gap-3 p-3 md:grid-cols-[42px_minmax(230px,1.4fr)_minmax(180px,0.9fr)_150px_auto]">
        <span className="text-center font-mono text-xs font-bold tabular-nums text-zinc-600">
          {String(number).padStart(3, "0")}
        </span>

        <button type="button" onClick={onToggle} className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <p className={`truncate text-sm font-bold ${filled ? "text-white" : "text-zinc-500"}`}>
              {job.company || "Available job slot"}
            </p>
            {filled ? (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${MATCH_CLASS[job.match]}`}>
                {MATCH_LABEL[job.match]}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-400">{job.title || "Add the next verified opportunity"}</p>
          <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-600">{job.track}</p>
        </button>

        <div className="min-w-0">
          <p className="truncate text-xs text-zinc-400">
            {job.location}{job.postedOn ? ` · Last seen ${job.postedOn}` : ""}
          </p>
          {state.stage ? <p className="mt-0.5 truncate text-[11px] text-zinc-500">Next: {state.stage}</p> : null}
        </div>

        <select
          value={state.status}
          onChange={(event) => onApplicationChange({ status: event.target.value as ApplicationStatus })}
          aria-label={`Application status for job ${number}`}
          className={`rounded-lg border px-2 py-1.5 text-xs font-bold uppercase tracking-wide outline-none ${STATUS_CLASS[state.status]}`}
        >
          {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
        </select>

        <div className="flex items-center justify-end gap-1">
          {job.cvPath ? <Link href={job.cvPath} title={`Open suggested CV: ${job.cvLabel ?? "CV"}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-700 px-2 text-[11px] font-semibold text-zinc-300 hover:border-teal-500 hover:text-teal-300"><FileText size={12} /> CV</Link> : null}
          {job.url ? <a href={job.url} target="_blank" rel="noreferrer" title="Open job posting" className="inline-flex h-8 items-center gap-1 rounded-lg border border-teal-700 bg-teal-500/10 px-2 text-[11px] font-semibold text-teal-300 hover:bg-teal-500/20"><ExternalLink size={12} /> Job</a> : null}
          <button type="button" onClick={onToggle} aria-label={open ? `Close job ${number} details` : `Edit job ${number}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-zinc-800 p-4">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <Field label="Company"><input value={job.company} onChange={(event) => onJobChange({ company: event.target.value })} placeholder="Company name" className={FIELD_CLASS} /></Field>
            <Field label="Role"><input value={job.title} onChange={(event) => onJobChange({ title: event.target.value })} placeholder="Senior Software Engineer" className={FIELD_CLASS} /></Field>
            <Field label="Eligibility / location"><input value={job.location} onChange={(event) => onJobChange({ location: event.target.value })} placeholder="Remote · LATAM" className={FIELD_CLASS} /></Field>
            <Field label="Job URL"><input type="url" value={job.url} onChange={(event) => onJobChange({ url: event.target.value })} placeholder="https://…" className={FIELD_CLASS} /></Field>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <SourceFact label="Technical track" value={job.track} />
            <SourceFact label="Stack" value={job.stack || "Not provided"} />
            <SourceFact label="Work / engagement" value={[job.workMode, job.engagement].filter(Boolean).join(" · ") || "Not provided"} />
            <SourceFact label="CV suggestion" value={`${job.cvLabel ?? "No CV"} · ${job.matchReason}`} />
            <SourceFact label="Source priority" value={[job.sourcePriority, job.matchScore !== undefined ? `Score ${job.matchScore}` : ""].filter(Boolean).join(" · ") || "Not ranked"} />
            <SourceFact label="Location fit" value={job.locationFit || "Not classified"} />
            <SourceFact label="Contractor signal" value={job.contractorSignal || "Not classified"} />
            <SourceFact label="Review flag" value={job.preferenceExclusion || "None recorded"} />
          </div>

          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs leading-relaxed text-zinc-400">
            <p><span className="font-semibold text-zinc-300">Source:</span> {job.sources || "Master job search workbook"}</p>
            <p className="mt-1"><span className="font-semibold text-zinc-300">Record quality:</span> {job.recordQuality || "Not classified"}</p>
            {job.sourceNotes ? <p className="mt-1"><span className="font-semibold text-zinc-300">Source notes:</span> {job.sourceNotes}</p> : null}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_170px_150px_170px]">
            <Field label="Next step / stage"><input value={state.stage} onChange={(event) => onApplicationChange({ stage: event.target.value })} placeholder="Recruiter call, technical interview…" className={FIELD_CLASS} /></Field>
            <Field label="Applied on"><input type="date" value={state.appliedOn} onChange={(event) => onApplicationChange({ appliedOn: event.target.value })} className={FIELD_CLASS} /></Field>
            <Field label="Priority">
              <select value={state.priority} onChange={(event) => onApplicationChange({ priority: Number(event.target.value) })} className={FIELD_CLASS}>
                <option value={0}>Not ranked</option>
                {[1, 2, 3, 4, 5].map((priority) => <option key={priority} value={priority}>{priority} / 5</option>)}
              </select>
            </Field>
            <label className="flex items-end">
              <span className="flex h-[38px] w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs font-semibold text-zinc-300">
                <input type="checkbox" checked={state.checkEmail} onChange={(event) => onApplicationChange({ checkEmail: event.target.checked })} className="h-4 w-4 accent-amber-500" />
                <Mail size={13} className="text-amber-400" /> Check email
              </span>
            </label>
          </div>

          <Field label="Notes" className="mt-3"><textarea value={state.notes} onChange={(event) => onApplicationChange({ notes: event.target.value })} rows={2} placeholder="Recruiter, salary range, requirements, follow-up date…" className={`${FIELD_CLASS} resize-y`} /></Field>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1"><Star size={11} /> Priority {state.priority || "not set"}</span>
            <span>Autosaved locally</span>
            {job.cvPath ? <span>Suggested CV: {job.cvLabel}</span> : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function SourceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-600">{label}</p>
      <p className="mt-1 text-[11px] leading-snug text-zinc-300">{value}</p>
    </div>
  );
}
