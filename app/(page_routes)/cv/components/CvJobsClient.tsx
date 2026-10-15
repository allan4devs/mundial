"use client";

import { useEffect, useMemo, useState } from "react";
import type { CvJob } from "@/lib/cv/jobs";

export function CvJobsClient() {
  const [jobs, setJobs] = useState<CvJob[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/cv/jobs", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load jobs");
        setJobs(body.jobs || []);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return jobs;
    return jobs.filter((job) => terms.every((term) => Object.values(job).some((value) => String(value ?? "").toLowerCase().includes(term))));
  }, [jobs, query]);

  return <main className="min-h-screen bg-[#f5f4f0] px-4 py-8 text-zinc-900 sm:px-6 sm:py-12"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><a href="/cv" className="text-xs font-semibold text-teal-700">← CV workspace</a><h1 className="mt-4 text-3xl font-semibold tracking-tight">CV Jobs</h1><p className="mt-2 max-w-2xl text-sm text-zinc-600">All jobs from the consolidated search base. This job table is separate from the CV archive.</p></div><div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-right"><p className="text-2xl font-semibold tabular-nums">{filtered.length}</p><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">shown / {jobs.length} total</p></div></div>
    <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><label className="block text-xs font-bold uppercase tracking-wider text-zinc-500" htmlFor="job-keywords">Filter by keywords</label><input id="job-keywords" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="React, Java, Costa Rica, contractor..." className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-teal-500" /></div>
    {error && <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading ? <p className="mt-8 text-sm text-zinc-500">Loading CV Jobs and checking MongoDB…</p> : <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm"><table className="min-w-[1100px] w-full text-left text-xs"><thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-500"><tr>{["ID", "Company", "Role", "Track", "Stack", "Eligibility", "Mode", "Priority", "Score", "Status", "Link"].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{filtered.map((job) => <tr key={job.id} className="align-top hover:bg-teal-50/30"><td className="px-3 py-3 font-mono text-zinc-400">{job.id}</td><td className="px-3 py-3 font-semibold text-zinc-800">{job.company}</td><td className="max-w-xs px-3 py-3 text-zinc-700">{job.title}</td><td className="px-3 py-3 text-zinc-600">{job.track}</td><td className="max-w-sm px-3 py-3 text-zinc-500">{job.stack || "—"}</td><td className="px-3 py-3 text-zinc-600">{job.eligibility}</td><td className="px-3 py-3 text-zinc-600">{job.workMode}</td><td className="px-3 py-3 font-semibold text-teal-700">{job.sourcePriority}</td><td className="px-3 py-3 tabular-nums">{job.matchScore || "—"}</td><td className="px-3 py-3 text-zinc-600">{job.sourceStatus}</td><td className="px-3 py-3">{job.url ? <a href={job.url} target="_blank" rel="noreferrer" className="font-semibold text-teal-700 underline">Open</a> : "—"}</td></tr>)}</tbody></table>{!filtered.length && <p className="p-8 text-center text-sm text-zinc-500">No jobs match those keywords.</p>}</div>}
  </div></main>;
}
