"use client";

import { useState } from "react";
import { Archive, BriefcaseBusiness, Copy, Filter, Flame, RotateCcw, Search } from "lucide-react";
import { STATUS_LABEL, STATUS_ORDER, type ApplicationStatus } from "../applications";
import { HOT_LIMIT } from "../java-react-jobs-constants";
import type { SortMode } from "../java-react-jobs-types";
import { JobRow } from "./JobBoardRow";
import { Stat } from "./JobBoardStat";
import { useJobBoard } from "./JavaReactJobsContext";

export function JobBoardScreen() {
  const {
    ready,
    rows,
    hotRows,
    hotIds,
    hotFromSeed,
    toggleHot,
    resetHot,
    hotExport,
    stats,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    trackFilter,
    setTrackFilter,
    minRating,
    setMinRating,
    sortMode,
    setSortMode,
    view,
    setView,
    openId,
    toggleOpen,
    updateJob,
    updateApplication,
  } = useJobBoard();
  const [hotNotice, setHotNotice] = useState("");

  const tracks = [...new Set(rows.map(({ job }) => job.track).filter(Boolean))].sort();

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setTrackFilter("all");
    setMinRating(0);
  }

  function handleToggleHot(id: string) {
    setHotNotice(toggleHot(id) ? "" : `HOT is capped at ${HOT_LIMIT} jobs. Remove one before adding another.`);
  }

  async function copyHotIds() {
    try {
      await navigator.clipboard.writeText(hotExport);
      setHotNotice("HOT ids copied. Paste them into app/(page_routes)/cv/data/hot-jobs.ts to commit the list.");
    } catch {
      setHotNotice("Clipboard unavailable. HOT ids: " + JSON.stringify(hotIds));
    }
  }

  function renderRow({ job, state, index, hot }: (typeof rows)[number]) {
    return <JobRow key={job.id} job={job} number={index + 1} state={state} hot={hot} open={openId === job.id} onToggle={() => toggleOpen(job.id)} onToggleHot={() => handleToggleHot(job.id)} onJobChange={(patch) => updateJob(job.id, patch)} onApplicationChange={(patch) => updateApplication(job.applicationSlug, patch)} />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300"><BriefcaseBusiness size={22} /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">CV workspace</p>
                <h1 className="text-2xl font-bold text-white">Java &amp; React job board</h1>
              </div>
            </div>
            <p className="max-w-md text-right text-xs leading-relaxed text-zinc-500">Verified opportunities, editable application tracking, and browser-local autosave.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Stat label="Visible records" value={stats.filled} tone="teal" />
            <Stat label="CV matches" value={stats.matched} tone="sky" />
            <Stat label="Applied" value={stats.applied} tone="amber" />
            <Stat label="Active" value={stats.active} tone="emerald" />
            <Stat label="Offers" value={stats.offers} tone="amber" />
          </div>
        </header>

        <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3" aria-label="Filter jobs">
          <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Job list views">
            <button type="button" role="tab" aria-selected={view === "active"} onClick={() => setView("active")} className={`rounded-lg px-3 py-2 text-xs font-bold ${view === "active" ? "bg-teal-500 text-zinc-950" : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`}>Active jobs</button>
            <button type="button" role="tab" aria-selected={view === "seen"} onClick={() => setView("seen")} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${view === "seen" ? "bg-zinc-200 text-zinc-950" : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`}><Archive size={13} /> Seen / old / completed</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_190px_190px_150px_150px_auto]">
            <label className="relative">
              <span className="sr-only">Search jobs</span>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, role, skills, notes" className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | "all")} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
                <option value="all">All application statuses</option>
                {STATUS_ORDER.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by track</span>
              <select value={trackFilter} onChange={(event) => setTrackFilter(event.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
                <option value="all">All technical tracks</option>
                {tracks.map((track) => <option key={track} value={track}>{track}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by rating</span>
              <select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
                <option value={0}>Any rating</option>
                {[9, 8, 7, 6, 5].map((rating) => <option key={rating} value={rating}>Rating {rating}+</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort jobs</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
                <option value="rating">Sort: rating</option>
                <option value="board">Sort: board order</option>
              </select>
            </label>
            <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"><RotateCcw size={14} /> Clear</button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500"><Filter size={13} />{ready ? `${rows.length} matching records` : "Loading saved jobs…"}<span className="text-zinc-700">•</span> Changes are saved in this browser.</div>
        </section>

        <section className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-3" aria-label="HOT jobs">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-300"><Flame size={14} /> HOT jobs · {hotIds.length}/{HOT_LIMIT}<span className="font-semibold normal-case tracking-normal text-zinc-500">{hotFromSeed ? "from data/hot-jobs.ts" : "saved in this browser"}</span></p>
            <div className="flex gap-2">
              <button type="button" onClick={copyHotIds} className="inline-flex items-center gap-1 rounded-lg border border-orange-500/40 px-2 py-1.5 text-[11px] font-semibold text-orange-200 hover:bg-orange-500/10"><Copy size={12} /> Copy HOT ids</button>
              {hotFromSeed ? null : <button type="button" onClick={resetHot} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-800"><RotateCcw size={12} /> Reset to seed</button>}
            </div>
          </div>
          {hotNotice ? <p className="mb-2 text-[11px] text-orange-200" role="status">{hotNotice}</p> : null}
          <div className="space-y-2">
            {hotRows.length ? hotRows.map(renderRow) : <p className="rounded-lg border border-dashed border-zinc-700 p-4 text-center text-xs text-zinc-500">No HOT jobs yet. Use the flame button on any job to pin it here.</p>}
          </div>
        </section>

        <section className="mt-4 space-y-2" aria-label="Job records">
          {rows.length ? rows.map(renderRow) : <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center text-sm text-zinc-400">{view === "seen" ? "No jobs have been moved here yet." : "No jobs match these filters."}</div>}
        </section>
      </div>
    </main>
  );
}
