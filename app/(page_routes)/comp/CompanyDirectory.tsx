"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Building2, Check, Copy, Heart, Pencil, Plus, ThumbsDown } from "lucide-react";
import type { CompanyCard } from "./company-catalog";
import { validatePreference, type CompanyPreference } from "@/lib/comp/types";
import { companySignals, matchesCompanyFilters, TECHNOLOGIES, ROLE_TYPES, LEVELS, TARGET_COMPANIES } from "./company-catalog";

const PAGE_SIZE = 48;

const COMPANY_PREFERENCES_KEY = "cv-company-preferences-v1";
const CATEGORIES = [
  { key: "companies", label: "Companies", group: "Browse" }, { key: "nearshore", label: "Nearshore", group: "Browse" },
  { key: "java", label: "Java", group: "Technology" }, { key: "react", label: "React", group: "Technology" },
  { key: "python", label: "Python", group: "Technology" }, { key: "node", label: "Node.js", group: "Technology" },
  { key: "javascript", label: "JavaScript", group: "Technology" }, { key: "typescript", label: "TypeScript", group: "Technology" },
  { key: "othertech", label: "Other / unspecified stack", group: "Technology" },
  { key: "fullstack", label: "Full stack", group: "Role" }, { key: "backend", label: "Backend", group: "Role" },
  { key: "frontend", label: "Frontend", group: "Role" }, { key: "otherrole", label: "Other / unspecified role", group: "Role" },
  { key: "midlevel", label: "Mid-level", group: "Level" }, { key: "junior", label: "Junior", group: "Level" },
  { key: "senior", label: "Senior", group: "Level" }, { key: "otherlevel", label: "Level unspecified", group: "Level" },
  { key: "outsourcing", label: "Outsourcing & consulting", group: "Company type" }, { key: "direct", label: "Direct employers", group: "Company type" },
  { key: "othermodel", label: "Model to review", group: "Company type" },
  { key: "latam", label: "LATAM evidence", group: "Location" },
  { key: "likes", label: "Likes", group: "Saved" }, { key: "dislikes", label: "Dislikes", group: "Saved" },
] as const;
const CATEGORY_GROUPS = ["Browse", "Technology", "Role", "Level", "Company type", "Location", "Saved"] as const;
type Category = typeof CATEGORIES[number]["key"];

export function CompanyDirectory() {
  const [companies, setCompanies] = useState<CompanyCard[]>([]);
  const [tab, setTab] = useState<Category>("companies");
  const [preferences, setPreferences] = useState<Record<string, CompanyPreference>>({});
  const [ready, setReady] = useState(false);
  const [canSync, setCanSync] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [careersDraft, setCareersDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [reaction, setReaction] = useState<{ key: string; type: "like" | "dislike"; leaving: boolean } | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function copyButton(company: CompanyCard, field: string, text: string) {
    const id = `${company.key}-${field}`;
    const label = `Copy ${field} for ${company.name}`;
    return <button type="button" aria-label={label} title={copied === id ? "Copied!" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(id);
        } catch { setNotice("Could not copy. Check clipboard permissions and try again."); }
      }}
      className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-teal-300 focus-visible:outline-2 focus-visible:outline-teal-300">
      {copied === id ? <Check aria-hidden="true" size={14} className="text-teal-300" /> : <Copy aria-hidden="true" size={14} />}
    </button>;
  }
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setReady(false);
      setNotice("");
      setLoadError(false);
      try {
        const response = await fetch("/api/comp", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!active) return;
        setCompanies(data.companies);
        setPreferences(data.preferences);
        setCanSync(!!data.canEdit);
        if (data.canEdit) {
          try {
            const stored = localStorage.getItem(COMPANY_PREFERENCES_KEY);
            if (stored && stored !== "{}") {
              const migrated = await fetch("/api/comp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: JSON.parse(stored), importOnly: true }) });
              const result = await migrated.json();
              if (!migrated.ok) throw new Error(result.error);
              if (active) setPreferences(result.preferences);
              localStorage.removeItem(COMPANY_PREFERENCES_KEY);
            }
          } catch { if (active) setNotice("Browser preferences could not be imported. They are preserved; reload to retry."); }
        } else {
          try {
            const stored = JSON.parse(localStorage.getItem(COMPANY_PREFERENCES_KEY) || "{}");
            if (!stored || typeof stored !== "object" || Array.isArray(stored)) throw new Error("Invalid preferences");
            const localPreferences = Object.fromEntries(Object.entries(stored).map(([key, value]) => [key, validatePreference(value)]));
            const normalized = Object.fromEntries((data.companies as CompanyCard[]).flatMap(company => {
              const preference = localPreferences[company.key] || company.legacyKeys?.map(key => localPreferences[key]).find(Boolean);
              return preference ? [[company.key, preference]] : [];
            }));
            setPreferences(normalized);
            setNotice("Preferences are saved in this browser. Sign in as admin to sync across devices.");
          } catch {
            setNotice("Browser preferences could not be loaded. Check browser storage settings before saving changes.");
          }
        }
        if (active) setReady(true);
      } catch (error) {
        if (active) { setLoadError(true); setNotice(error instanceof Error ? error.message : "Companies could not be loaded."); }
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [reload]);

  function safeCareersUrl(value?: string): string | undefined {
    if (!value) return undefined;
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : undefined;
    } catch { return undefined; }
  }

  async function updatePreference(key: string, change: CompanyPreference, reactionType?: "like" | "dislike") {
    if (!ready) return false;
    setReady(false);
    if (reactionType) setReaction({ key, type: reactionType, leaving: false });
    async function applyPreferences(next: Record<string, CompanyPreference>) {
      if (reactionType && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // Keep the existing card mounted until button feedback and its exit finish.
        await new Promise(resolve => setTimeout(resolve, 240));
        const company = companies.find(company => company.key === key);
        if (company && !matchesCategory(company, tab, next[key])) {
          setReaction({ key, type: reactionType, leaving: true });
          await new Promise(resolve => setTimeout(resolve, 280));
        }
      }
      setPreferences(next);
    }
    try {
      if (!canSync) {
        const next = { ...preferences, [key]: { ...preferences[key], ...change } };
        localStorage.setItem(COMPANY_PREFERENCES_KEY, JSON.stringify(next));
        await applyPreferences(next);
        setNotice("Saved in this browser. Sign in as admin to sync across devices.");
        return true;
      }
      const response = await fetch("/api/comp", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: { [key]: change } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await applyPreferences(data.preferences);
      setNotice("");
      return true;
    } catch (error) { setNotice(error instanceof Error ? error.message : "Changes could not be saved. Please retry."); return false; }
    finally { setReaction(null); setReady(true); }
  }

  async function saveCareers(company: CompanyCard) {
    const url = safeCareersUrl(careersDraft.trim());
    if (!url) { setNotice("Enter a valid careers URL starting with https:// or http://."); return; }
    if (await updatePreference(company.key, { careersUrl: url })) setEditingCompany(null);
  }
  const [researchOnly, setResearchOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [technology, setTechnology] = useState("all");
  const [role, setRole] = useState("all");
  const [level, setLevel] = useState("all");
  const [region, setRegion] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const researched = companies.filter(company => company.research);
  const nearshoreCount = companies.filter(company => company.nearshore).length;
  function matchesCategory(company: CompanyCard, category: Category, preference = preferences[company.key]) {
    if (category === "dislikes") return !!preference?.disliked;
    if (preference?.disliked) return false;
    if (category === "likes") return !!preference?.liked;
    if (category === "companies") return !preference?.liked;
    if (category === "nearshore") return !!company.nearshore;
    if (category === "outsourcing" || category === "direct") return company.model === category;
    if (category === "latam") return !!company.research;
    const signals = companySignals(company);
    const technologyCategories: Partial<Record<Category, string>> = { java: "Java", react: "React", python: "Python", node: "Node.js", javascript: "JavaScript", typescript: "TypeScript" };
    const roleCategories: Partial<Record<Category, string>> = { fullstack: "Full stack", backend: "Backend", frontend: "Frontend" };
    const levelCategories: Partial<Record<Category, string>> = { midlevel: "Mid-level", junior: "Junior", senior: "Senior" };
    if (technologyCategories[category]) return signals.technologies.includes(technologyCategories[category]!);
    if (roleCategories[category]) return signals.roles.includes(roleCategories[category]!);
    if (levelCategories[category]) return signals.levels.includes(levelCategories[category]!);
    if (category === "othertech") return !TECHNOLOGIES.some(value => signals.technologies.includes(value));
    if (category === "otherrole") return !signals.roles.length;
    if (category === "otherlevel") return !signals.levels.length;
    if (category === "othermodel") return !["direct", "outsourcing"].includes(company.model);
    return false;
  }
  const visibleCompanies = (researchOnly && tab !== "nearshore" ? researched : companies).filter(company =>
    matchesCategory(company, tab) && matchesCompanyFilters(company, { query, technology, role, level, region }));
  const displayedCompanies = visibleCompanies.slice(0, limit);
  const matchingMidLevel = companies.filter(company => companySignals(company).levels.includes("Mid-level")).length;
  const groups = [
    { key: "outsourcing", title: "Outsourcing & consulting", description: "Development agencies, staff augmentation, recruiters, and consulting firms hiring for client teams." },
    { key: "unknown", title: "More engineering employers", description: "Additional software companies and technology teams. Review the company source for its business model." },
    { key: "direct", title: "Direct employers", description: "Companies hiring for their own products, platforms, or internal operations." },
  ] as const;
  const linked = companies.filter(company => company.website).length;

  function cardContent(company: CompanyCard) {
    const signals = companySignals(company);
    const tags = signals.technologies.length ? signals.technologies : company.tracks;
    const roleNote = [company.research?.notes, company.jobs[0]?.sourceNotes, company.jobs[0]?.matchReason].find(note => note && !/\bcv\b|tailored/i.test(note));
    const details = [company.name, company.website,
      preferences[company.key]?.careersUrl || company.careersUrl || company.nearshore?.careersUrl,
      tags.join(", "), company.research?.region || company.locations.join(" · "),
      company.research?.workMode || company.discovery?.remotePolicy,
      company.research?.role || company.jobs.map(job => job.title).filter(Boolean).join(" · "),
      roleNote,
    ].filter(Boolean).join("\n");
    const note = (tab === "nearshore" ? company.nearshore?.notes : undefined) || roleNote || (!company.discovery ? company.nearshore?.notes : undefined);
    return <>
      <div className="flex items-start justify-between gap-4">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/10 text-xl font-bold text-teal-200">{company.name.slice(0, 2).toUpperCase()}</span>
        <div className="flex items-center gap-2">{copyButton(company, "details", details)}{company.website ? <ArrowUpRight aria-hidden="true" size={24} className="text-zinc-500 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-teal-300" /> : <Building2 aria-hidden="true" size={22} className="text-zinc-600" />}</div>
      </div>
      <div className="mt-6 flex items-center gap-2"><h3 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-white">{company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" aria-label={`${company.name} company homepage (opens in a new tab)`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-teal-300">{company.name}</a> : company.name}</h3>{copyButton(company, "name", company.name)}</div>
      <div className="mt-2 flex items-center gap-2"><p className="min-w-0 break-all text-sm text-zinc-400">{company.website ? new URL(company.website).hostname.replace(/^www\./, "") : "Company website needed"}</p>{company.website ? copyButton(company, "website", company.website) : null}</div>
      <div className="mt-5 flex flex-wrap gap-2">{tags.slice(0, 4).map(value => <span key={value} className="rounded-md border border-zinc-700/70 px-2 py-1 text-xs text-zinc-400">{value}</span>)}{tags.length > 4 ? <span className="py-1 text-xs text-zinc-500">+{tags.length - 4}</span> : null}</div>
      <div className="flex flex-wrap gap-2 text-xs">{signals.roles.map(value => <span key={value} className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">{value}</span>)}{signals.levels.includes("Mid-level") ? <span className="rounded bg-amber-400/10 px-2 py-1 text-amber-200">Mid-level signal</span> : null}</div>
      <div className="space-y-2 text-xs leading-5">
        {!company.discovery ? <>
          <p className="text-teal-200">{company.research?.region || company.locations.join(" · ") || "Location not saved"}</p>
          <p className="text-teal-200">{company.research?.workMode || [...new Set(company.jobs.map(job => job.workMode).filter(Boolean))].join(" · ") || "Work mode not saved"}</p>
        </> : null}
        {note ? <p className="line-clamp-3 text-zinc-400">{note}</p> : null}
        <p className="line-clamp-2 text-zinc-300">{company.research?.role || [...new Set(company.jobs.map(job => job.title).filter(Boolean))].join(" · ")}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-800 pt-5 text-xs"><span className="text-zinc-500">{company.records ? `${company.jobs.length} role ${company.jobs.length === 1 ? "link" : "links"}` : "Researched employer"}</span><span className={company.website ? "font-semibold text-teal-300" : "text-zinc-500"}>{company.website ? "Visit company" : "Homepage not identified"}</span></div>
    </>;
  }

  return <main className="min-h-screen bg-zinc-950 text-zinc-100">
    <style jsx>{`
      @keyframes reaction-pop {
        0%, 100% { transform: scale(1); }
        45% { transform: scale(1.14); }
        75% { transform: scale(0.97); }
      }
      @keyframes card-vanish {
        to { opacity: 0; transform: translateY(16px) scale(0.94); }
      }
      .reaction-pop { animation: reaction-pop 240ms ease-out; }
      .card-vanish { animation: card-vanish 280ms ease-in forwards; pointer-events: none; }
      @media (prefers-reduced-motion: reduce) {
        .reaction-pop, .card-vanish { animation: none; }
      }
    `}</style>
    <nav aria-label="Company navigation" className="border-b border-zinc-800 px-4 py-4 sm:px-8"><span className="text-sm font-bold tracking-widest text-teal-300">COMP / Company workspace</span></nav>
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Explore the companies</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Company directory</h1><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">Your independent company workspace. Explore {companies.length.toLocaleString()} companies for full-stack, backend, and frontend work. Focus on Java, React, Python, and Node.js, with mid-level signals where available.</p></div><p className="text-sm text-zinc-500">{companies.length} companies <span aria-hidden="true">/</span> {linked} homepages</p></header>
      <div className="mb-6 grid gap-4 rounded-2xl border border-teal-900 bg-teal-950/20 p-5 sm:grid-cols-3">
        <div><p className="text-sm font-semibold text-teal-200">{companies.length.toLocaleString()} / {TARGET_COMPANIES.toLocaleString()} companies</p><progress aria-label="Company collection goal" value={companies.length} max={TARGET_COMPANIES} className="mt-3 h-2 w-full accent-teal-400" /></div>
        <div><p className="text-sm text-teal-200">{matchingMidLevel} companies with mid-level signals</p><p className="mt-2 text-xs text-zinc-400">Match titles and source evidence, then check the current opening.</p></div>
        <div><p className="text-sm text-teal-200">{nearshoreCount} nearshore companies</p><p className="mt-2 text-xs text-zinc-400">Your saved likes, dislikes, and careers links stay with each company.</p></div>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-zinc-400 sm:col-span-2 lg:col-span-3">Search companies or roles<input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE); }} placeholder="Company, technology, job title, or location" className="mt-2 block w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white" /></label>
        {[{ label: "Technology", value: technology, values: TECHNOLOGIES, change: setTechnology }, { label: "Role type", value: role, values: ROLE_TYPES, change: setRole }, { label: "Seniority signal", value: level, values: LEVELS, change: setLevel }].map(filter => <label key={filter.label} className="text-xs text-zinc-400">{filter.label}<select value={filter.value} onChange={event => { filter.change(event.target.value); setLimit(PAGE_SIZE); }} className="mt-2 block w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"><option value="all">All</option>{filter.values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}
        <label className="text-xs text-zinc-400">Reported hiring region<select value={region} onChange={event => { setRegion(event.target.value); setLimit(PAGE_SIZE); }} className="mt-2 block w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-white"><option value="all">All regions</option><option value="global">Worldwide / global</option><option value="americas">Americas / LATAM</option></select></label>
        <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" disabled={tab === "nearshore"} checked={researchOnly && tab !== "nearshore"} onChange={event => { setResearchOnly(event.target.checked); setLimit(PAGE_SIZE); }} /> LATAM hiring evidence only ({researched.length})</label>
        <button type="button" onClick={() => { setQuery(""); setTechnology("all"); setRole("all"); setLevel("all"); setRegion("all"); setResearchOnly(false); setLimit(PAGE_SIZE); }} className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900">Clear filters</button>
      </div>
      <div className="mb-6 space-y-3 rounded-2xl border border-zinc-800 p-4">
        <p className="text-xs leading-5 text-zinc-400">All {companies.length.toLocaleString()} companies are grouped below. Companies can match several filters; unspecified groups keep companies with missing evidence included. Counts show the full category before search and dropdown filters.</p>
        {CATEGORY_GROUPS.map(group => <div key={group} className="flex flex-col gap-2 sm:flex-row sm:items-start"><p className="w-28 shrink-0 pt-2 text-xs font-semibold text-zinc-500">{group}</p><div role="tablist" aria-label={`${group} company filters`} className="flex flex-wrap gap-2">{CATEGORIES.filter(category => category.group === group).map(({ key, label }) => <button key={key} type="button" role="tab" id={`${key}-tab`} aria-selected={tab === key} aria-controls="company-panel" onClick={() => { setTab(key); setLimit(PAGE_SIZE); setTechnology("all"); setRole("all"); setLevel("all"); setRegion("all"); setResearchOnly(false); }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === key ? "bg-teal-400 text-zinc-950" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}>{label} ({companies.filter(company => matchesCategory(company, key)).length})</button>)}</div></div>)}
      </div>
      {tab === "nearshore" ? <p className="mb-5 text-sm text-zinc-400">{nearshoreCount} nearshore companies serving US teams from Latin America. Company sources checked October 29, 2026. Openings and eligible countries vary by role. Like a company to also find it in Likes.</p> : null}
      <p className="mb-3 text-sm text-zinc-400" aria-live="polite">Showing {Math.min(limit, visibleCompanies.length)} of {visibleCompanies.length} matching companies</p>
      <p className="mb-5 text-xs leading-5 text-zinc-500">Likes, dislikes, and careers links are saved {canSync ? "to your account" : "in this browser"}. Company sources and role boards were checked October 29, 2026. A company listing or seniority signal does not guarantee a current vacancy or country eligibility.</p>
      <p role="status" className="mb-4 text-sm text-amber-300">{notice}</p>
      <span role="status" className="sr-only">{copied ? "Copied to clipboard." : ""}</span>
      {loading ? <p role="status" className="mb-5 text-zinc-400">Loading companies…</p> : null}
      {loadError ? <button type="button" onClick={() => setReload(value => value + 1)} className="mb-5 rounded-lg bg-teal-400 px-4 py-2 text-zinc-950">Retry loading</button> : null}
      <div role="tabpanel" id="company-panel" aria-labelledby={`${tab}-tab`}>
      {tab !== "likes" && tab !== "dislikes" && !loading && !loadError && !visibleCompanies.length ? <p className="mb-8 text-sm text-zinc-400">No companies match your search.</p> : null}
      {tab === "likes" && !loading && !loadError && !visibleCompanies.length ? <p className="mb-8 text-sm text-zinc-400">No liked companies match this view. Like a company in the Companies tab to save it here.</p> : null}
      {tab === "dislikes" && !loading && !loadError && !visibleCompanies.length ? <p className="mb-8 text-sm text-zinc-400">No disliked companies match this view. Dislike a company to save it here; undo a dislike to return it to browsing.</p> : null}
      {groups.map(group => {
        const members = displayedCompanies.filter(company => company.model === group.key);
        const totalMembers = visibleCompanies.filter(company => company.model === group.key).length;
        if (!members.length) return null;
        return <section key={group.key} aria-labelledby={group.key + "-heading"} className="mb-12">
          <div className="mb-5 border-b border-zinc-800 pb-5"><h2 id={group.key + "-heading"} className="text-2xl font-semibold">{group.title} <span className="ml-2 text-base text-teal-300">{members.length} / {totalMembers}</span></h2><p className="mt-2 text-sm text-zinc-400">{group.description}</p></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{members.map(company => <div key={company.key} className={`flex flex-col ${reaction?.key === company.key && reaction.leaving ? "card-vanish" : ""}`}><article className={`group relative flex flex-1 min-h-[340px] flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition ${company.website ? "hover:-translate-y-1 hover:border-teal-400/60 hover:bg-zinc-900 hover:shadow-xl hover:shadow-teal-950/20" : "border-dashed"}`}>{cardContent(company)}</article>
          <div className="mt-2 flex flex-wrap gap-2">
            {(preferences[company.key]?.careersUrl || company.careersUrl || company.nearshore?.careersUrl) ? <><a href={preferences[company.key]?.careersUrl || company.careersUrl || company.nearshore?.careersUrl || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-teal-900 px-3 py-2 text-xs font-semibold text-teal-300">View careers <ArrowUpRight size={14} /><span className="sr-only"> for {company.name} (opens in a new tab)</span></a><button type="button" disabled={!ready} aria-label={`Edit careers link for ${company.name}`} onClick={() => { setEditingCompany(company.key); setCareersDraft((preferences[company.key]?.careersUrl || company.careersUrl || company.nearshore?.careersUrl) || ""); setNotice(""); }} className="rounded-lg border border-zinc-800 px-3 py-2 text-zinc-400 hover:text-white"><Pencil size={14} /></button></> : <button type="button" disabled={!ready} onClick={() => { setEditingCompany(company.key); setCareersDraft(""); setNotice(""); }} className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-teal-300"><Plus size={14} /> Add careers link<span className="sr-only"> for {company.name}</span></button>}
            <button type="button" disabled={!ready} aria-pressed={!!preferences[company.key]?.liked} aria-label={`${preferences[company.key]?.liked ? "Unlike" : "Like"} ${company.name}`} onClick={() => updatePreference(company.key, { liked: !preferences[company.key]?.liked, disliked: false }, "like")} className={`inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-pink-300 hover:bg-pink-950/40 ${reaction?.key === company.key && reaction.type === "like" ? "reaction-pop bg-pink-950/60 ring-1 ring-pink-400/50" : ""}`}><Heart size={14} fill={preferences[company.key]?.liked ? "currentColor" : "none"} />{preferences[company.key]?.liked ? "Liked" : "Like"}</button>
            <button type="button" disabled={!ready} aria-pressed={!!preferences[company.key]?.disliked} aria-label={`${preferences[company.key]?.disliked ? "Undo dislike for" : "Dislike"} ${company.name}`} onClick={() => updatePreference(company.key, { disliked: !preferences[company.key]?.disliked, liked: false }, "dislike")} className={`inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-orange-300 hover:bg-orange-950/40 ${reaction?.key === company.key && reaction.type === "dislike" ? "reaction-pop bg-orange-950/60 ring-1 ring-orange-400/50" : ""}`}><ThumbsDown size={14} fill={preferences[company.key]?.disliked ? "currentColor" : "none"} />{preferences[company.key]?.disliked ? "Undo dislike" : "Dislike"}</button>
          </div>
          {editingCompany === company.key ? <form onSubmit={event => { event.preventDefault(); saveCareers(company); }} className="mt-2 rounded-xl border border-zinc-800 p-3">
            <label className="text-xs text-zinc-300" htmlFor={`careers-${company.key}`}>Careers page for {company.name}</label>
            <input autoFocus required type="url" id={`careers-${company.key}`} value={careersDraft} onChange={event => setCareersDraft(event.target.value)} placeholder="https://company.com/careers" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm" />
            <div className="mt-2 flex gap-3 text-xs"><button type="submit" className="rounded-lg bg-teal-400 px-3 py-2 font-semibold text-zinc-950">Save link</button><button type="button" onClick={() => { setEditingCompany(null); setNotice(""); }} className="px-3 py-2 text-zinc-400">Cancel</button></div>
          </form> : null}
          {company.roleEvidence ? <a href={company.roleEvidence.source} target="_blank" rel="noopener noreferrer" className="mt-2 px-3 py-2 text-xs text-teal-300 underline underline-offset-4">Employer role feed · Checked {company.roleEvidence.checkedOn}<span className="sr-only"> (opens in a new tab)</span></a> : null}
          {company.nearshore ? <a href={company.nearshore.source} target="_blank" rel="noopener noreferrer" className="mt-2 rounded-lg px-3 py-2 text-xs text-teal-300 underline underline-offset-4 hover:text-teal-100">Nearshore company source <span className="text-zinc-500">(checked {company.nearshore.checkedOn})</span><span className="sr-only"> for {company.name} (opens in a new tab)</span></a> : null}
          {company.jobs.length ? <details className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/40 text-xs">
            <summary className="cursor-pointer rounded-xl px-4 py-3 font-medium text-teal-300 focus-visible:outline-2 focus-visible:outline-teal-300">Preview {company.jobs.length === 1 ? "role link" : `${company.jobs.length} role links`}</summary>
            <ul className="divide-y divide-zinc-800 px-4">{company.jobs.map(job => <li key={job.id} className="space-y-2 py-4">
              <p className="text-sm font-semibold text-zinc-100">{job.title || "Untitled role"}</p>
              <p className="text-teal-200">{[job.location, job.workMode].filter(Boolean).join(" · ") || "Location and work mode not saved"}</p>
              {job.stack ? <p className="text-zinc-300">{job.stack}</p> : null}
              {job.matchReason || job.sourceNotes ? <p className="leading-5 text-zinc-400">{job.matchReason || job.sourceNotes}</p> : null}
              {job.eligibility ? <p className="leading-5 text-zinc-400">{job.eligibility}</p> : null}
              <p className="text-zinc-500">Listing: {job.listingStatus}{job.postedOn ? ` · Posted ${job.postedOn}` : ""}{job.checkedOn ? ` · Checked ${job.checkedOn}` : ""}</p>
              {/^https?:\/\//i.test(job.url) ? <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-300 underline underline-offset-4">View job posting <ArrowUpRight size={12} /><span className="sr-only"> (opens in a new tab)</span></a> : <p className="text-zinc-500">Posting link not saved</p>}
            </li>)}</ul>
          </details> : null}{company.research ? <a href={company.research.source} target="_blank" rel="noopener noreferrer" className="mt-2 rounded-lg px-3 py-2 text-xs text-teal-300 underline underline-offset-4 hover:text-teal-100">Hiring evidence: {company.research.role} <span className="text-zinc-500">(checked {company.research.checkedOn})</span><span className="sr-only"> (opens in a new tab)</span></a> : null}</div>)}</div>
          {!members.length ? <p className="py-8 text-sm text-zinc-500">No companies in this group yet.</p> : null}
        </section>;
      })}
      </div>
      {visibleCompanies.length > limit ? <div className="mb-10 text-center"><button type="button" onClick={() => setLimit(value => value + PAGE_SIZE)} className="rounded-xl bg-teal-400 px-6 py-3 text-sm font-semibold text-zinc-950">Show {Math.min(PAGE_SIZE, visibleCompanies.length - limit)} more companies</button></div> : null}
      <footer className="border-t border-zinc-800 py-5 text-xs text-zinc-500">Additional company profiles: <a href="https://remoteintech.company/" target="_blank" rel="noopener noreferrer" className="text-teal-300 underline">Remote In Tech</a>. Profile information is attributed on each card; employer feeds provide role evidence.</footer>
      {!loading && !loadError && !companies.length ? <div className="rounded-2xl border border-zinc-800 py-20 text-center"><h2 className="text-xl font-semibold">No companies saved yet</h2><p className="mt-2 text-sm text-zinc-400">Your companies will appear here.</p></div> : null}
    </div>
  </main>;
}
