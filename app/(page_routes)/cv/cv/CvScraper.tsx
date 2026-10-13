"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import type { ScrapeErrorResponse, ScrapeResult } from "@/lib/cv/scraper/types";
import { CvScrapeResults } from "./CvScrapeResults";

const inputClass = "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

export function CvScraper() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const busy = loading || signingIn;

  useEffect(() => () => {
    const controller = activeRequest.current;
    activeRequest.current = null;
    controller?.abort();
  }, []);

  function cancel() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setSigningIn(false);
    setNotice("Scan cancelled. You can try another URL or paste the job text in the generator.");
  }

  async function scan() {
    const target = url.trim();
    if (!target || activeRequest.current) return;
    try {
      const parsed = new URL(target);
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setError("Enter a complete http:// or https:// job or application URL.");
      return;
    }
    const controller = new AbortController();
    activeRequest.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 30_000);
    setLoading(true);
    setError(null);
    setNotice(null);
    setResult(null);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await response.json() as ScrapeResult | ScrapeErrorResponse;
      if (activeRequest.current !== controller) return;
      if (response.status === 401) setNeedsLogin(true);
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "The website could not be scanned. Try again.");
      }
      setNeedsLogin(false);
      setResult(data);
    } catch (cause) {
      if (activeRequest.current !== controller) return;
      setError(timedOut ? "The scan took too long. Try a direct job URL or paste the job text in the generator." : cause instanceof Error ? cause.message : "Could not reach the scanner. Try again.");
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current) return;
    const form = new FormData(event.currentTarget);
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    setSigningIn(true);
    setError(null);
    setNotice(null);
    let signedIn = false;
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
        signal: controller.signal,
      });
      const data = await response.json() as { error?: string };
      if (activeRequest.current !== controller) return;
      if (!response.ok) throw new Error(data.error || "Sign-in failed.");
      setNeedsLogin(false);
      signedIn = true;
    } catch (cause) {
      if (activeRequest.current === controller) setError(controller.signal.aborted ? "Sign-in timed out. Try again." : cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setSigningIn(false);
      }
    }
    if (signedIn) await scan();
  }

  return <main className="min-h-screen bg-[#f5f4f0] px-5 py-10 text-zinc-900 sm:px-8 sm:py-16">
    <div className="mx-auto max-w-5xl">
      <nav className="mb-10 flex flex-wrap items-center justify-between gap-4 text-sm">
        <Link href="/cv" className="inline-flex items-center gap-2 font-semibold"><FileText size={18} /> CV Studio</Link>
        <Link href="/cv" className="text-zinc-600 hover:text-zinc-900">← CV generator</Link>
      </nav>
      <header className="mb-8 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">From the job page to your CV</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Job & form scanner</h1>
        <p className="mt-5 text-base leading-relaxed text-zinc-600">Paste a public job or application URL. Review the job text, inspect the application fields, and bring the description into your CV generator.</p>
      </header>
      <form onSubmit={(event) => { event.preventDefault(); void scan(); }} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <label htmlFor="scraper-url" className="mb-3 block text-sm font-semibold">Job or application URL</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="scraper-url" type="url" inputMode="url" autoComplete="url" required maxLength={2048} value={url} disabled={busy} onChange={(event) => setUrl(event.target.value)} placeholder="https://company.com/careers/software-engineer" aria-describedby="scraper-help" className={`${inputClass} min-w-0 flex-1 disabled:opacity-60`} />
          <button type="submit" disabled={busy || !url.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40">
            {loading ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}{loading ? "Scanning…" : "Scan URL"}
          </button>
        </div>
        <p id="scraper-help" className="mt-4 text-xs leading-relaxed text-zinc-500">Reads public page content. Some sites load their jobs or forms after the page opens; for those, copy the description and <Link href="/cv" className="text-teal-700 underline">paste it in the generator</Link>. Scanning uses your admin account.</p>
      </form>
      {busy && <div className="mt-4 flex items-center gap-4 text-sm text-zinc-600"><p role="status">{signingIn ? "Signing in…" : "Reading the page and its application fields…"}</p><button type="button" onClick={cancel} className="font-medium underline">Cancel</button></div>}
      {notice && <p role="status" className="mt-4 text-sm text-zinc-600">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {needsLogin && <form onSubmit={(event) => void signIn(event)} className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Sign in to scan</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs">Admin username<input name="username" required disabled={busy} autoComplete="username" className={`${inputClass} mt-1`} /></label>
          <label className="text-xs">Password<input name="password" type="password" required disabled={busy} autoComplete="current-password" className={`${inputClass} mt-1`} /></label>
          <button type="submit" disabled={busy} className="self-end rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Sign in and scan</button>
        </div>
      </form>}
      {result && <CvScrapeResults key={result.scannedAt} result={result} />}
    </div>
  </main>;
}
