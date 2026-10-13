"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { CvProfile } from "@/lib/cv/types";

type JobLabel = { id: string; role: string; company: string; period: string };
const field = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10";
const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

export function CvProfileEditor() {
  const [profile, setProfile] = useState<CvProfile | null>(null);
  const [jobs, setJobs] = useState<JobLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const loadProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/cv/profile", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your experience could not be loaded.");
      setProfile(data.profile); setJobs(data.jobs);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your experience could not be loaded."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadProfile(); }, [loadProfile]);
  const edit = (next: CvProfile) => { setProfile(next); setSaved(false); };
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!profile) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const cleanProfile = { ...profile, summary: profile.summary.map((paragraph) => paragraph.trim()).filter(Boolean), skillGroups: profile.skillGroups.map((group) => ({ ...group, items: lines(group.items.join("\n")) })).filter((group) => group.label.trim() && group.items.length), experience: profile.experience.map((job) => ({ ...job, bullets: lines(job.bullets.join("\n")) })) };
      const response = await fetch("/api/cv/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cleanProfile) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your changes could not be saved.");
      setProfile(cleanProfile); setSaved(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your changes could not be saved. They remain on this page."); }
    finally { setSaving(false); }
  }
  return <main className="min-h-screen bg-[#f5f4f0] px-5 py-10 text-zinc-900"><div className="mx-auto max-w-4xl">
    <Link href="/cv" className="text-sm text-zinc-500">← CV generator</Link>
    <h1 className="mt-7 text-3xl font-semibold tracking-tight">The experience behind your CV</h1>
    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">Add what you know, correct older wording, and remove anything that no longer belongs. Once saved, this becomes the source for every new CV. Your archived versions stay preserved.</p>
    {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{!profile && <button type="button" onClick={() => void loadProfile()} className="ml-2 underline">Retry</button>}</p>}
    {loading && <p role="status" className="mt-8 text-sm text-zinc-500">Loading your experience…</p>}
    {profile && <form onSubmit={save} className="mt-8 space-y-8">
      <fieldset disabled={saving} className="space-y-8 disabled:opacity-70">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <label htmlFor="source-summary" className="font-semibold">Professional profile</label>
          <p className="mb-3 mt-2 text-xs text-zinc-500">Separate paragraphs with a blank line. Keep each paragraph between 5 and 85 words.</p>
          <textarea id="source-summary" rows={8} value={profile.summary.join("\n\n")} onChange={(event) => edit({ ...profile, summary: event.target.value.split(/\n\s*\n/) })} className={field} />
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Skills you can actually use</h2><p className="mb-5 mt-2 text-xs text-zinc-500">One skill per line. Add tools here when you have the experience to support them.</p>
          <div className="space-y-3">{profile.skillGroups.map((group, index) => <details key={index} open={index < 3} className="rounded-lg border border-zinc-200 p-3">
            <summary className="cursor-pointer text-sm font-medium">{group.label || "New skill group"} · {group.items.length} skills</summary>
            <label className="mt-3 block text-xs">Group name<input aria-label={`Skill group ${index + 1} name`} value={group.label} onChange={(event) => edit({ ...profile, skillGroups: profile.skillGroups.map((item, i) => i === index ? { ...item, label: event.target.value } : item) })} className={`${field} mt-1`} /></label>
            <label className="mt-3 block text-xs">Skills<textarea aria-label={`Skills for ${group.label}`} rows={Math.min(8, Math.max(3, group.items.length))} value={group.items.join("\n")} onChange={(event) => edit({ ...profile, skillGroups: profile.skillGroups.map((item, i) => i === index ? { ...item, items: event.target.value.split("\n") } : item) })} className={`${field} mt-1`} /></label>
            <button type="button" onClick={() => edit({ ...profile, skillGroups: profile.skillGroups.filter((_, i) => i !== index) })} className="mt-3 text-xs text-red-700">Remove this group</button>
          </details>)}</div>
          <button type="button" onClick={() => edit({ ...profile, skillGroups: [...profile.skillGroups, { label: "", items: [] }] })} className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm">Add skill group</button>
        </section>
        <section><h2 className="mb-2 font-semibold">Experience evidence</h2><p className="mb-5 text-xs text-zinc-500">One accomplishment per line, up to 40 words. Keep facts with the employer where they happened.</p>
          <div className="space-y-4">{profile.experience.map((entry, index) => {
            const job = jobs.find((item) => item.id === entry.jobId);
            return <div key={entry.jobId} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-semibold">{job?.company}</h3><p className="mb-4 mt-1 text-xs text-zinc-500">{job?.role} · {job?.period}</p>
              <label htmlFor={`source-job-${index}`} className="sr-only">Experience at {job?.company}</label>
              <textarea id={`source-job-${index}`} rows={Math.min(12, Math.max(5, entry.bullets.length + 1))} value={entry.bullets.join("\n")} onChange={(event) => edit({ ...profile, experience: profile.experience.map((item, i) => i === index ? { ...item, bullets: event.target.value.split("\n") } : item) })} className={field} />
            </div>;
          })}</div>
        </section>
      </fieldset>
      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
        <button disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save my experience"}</button>
        {saved && <p role="status" className="text-sm text-teal-700">Saved. New CVs will use these facts.</p>}
        {saved && <Link href="/cv" className="text-sm underline">Generate a CV →</Link>}
      </div>
    </form>}
  </div></main>;
}
