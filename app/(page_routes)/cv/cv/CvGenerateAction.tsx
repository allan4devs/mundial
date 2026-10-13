"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { GenerationSummary } from "@/lib/cv/types";

export function CvGenerateAction({ jd }: { jd: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationSummary[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/cv/generations", { cache: "no-store", signal: controller.signal }).then(async (response) => { if (response.ok) setHistory((await response.json()).generations); }).catch(() => {});
    return () => controller.abort();
  }, []);
  async function generate() {
    setBusy(true); setError(null); setAttempt(null);
    try {
      const response = await fetch("/api/cv/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobDescription: jd }) });
      const data = await response.json();
      if (response.status === 401) setNeedsLogin(true);
      if (!response.ok) { setAttempt(data.id ?? null); throw new Error(data.error || "Your CV could not be saved."); }
      router.push(data.url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The server could not be reached. Your pasted JD is still here."); }
    finally { setBusy(false); }
  }
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign-in failed.");
      setNeedsLogin(false); await generate();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }
  return <section className="mt-5 rounded-2xl border border-teal-200 bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-5">
      <div><h2 className="font-semibold">Create the CV for this role</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">Clean the JD, prioritize your relevant skills and accomplishments, and save a new printable CV. Runs on this server without external AI.</p></div>
      <button type="button" onClick={() => void generate()} disabled={busy || jd.trim().length < 100} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-40">{busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}{busy ? "Generating…" : "Generate my CV"}</button>
    </div>
    <p className="mt-4 text-xs text-zinc-500">Use at least 100 characters for generation. <Link href="/cv/profile" className="text-teal-700 underline">Edit my experience</Link> to add or correct the facts used.</p>
    {busy && <p role="status" className="mt-3 text-sm text-zinc-500">Selecting relevant evidence and saving your CV…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}{attempt && <Link href={`/cv/generated/${attempt}`} className="ml-2 underline">Open saved attempt</Link>}</p>}
    {needsLogin && <form onSubmit={signIn} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="text-xs">Admin username<input name="username" required autoComplete="username" className="mt-1 w-full rounded-lg border border-zinc-300 p-3 text-sm" /></label>
      <label className="text-xs">Password<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border border-zinc-300 p-3 text-sm" /></label>
      <button disabled={busy} className="self-end rounded-lg bg-zinc-900 p-3 text-sm text-white disabled:opacity-40">Sign in and generate</button>
    </form>}
    {history.length > 0 && <details className="mt-6"><summary className="cursor-pointer text-sm font-medium">Saved CVs</summary><div className="mt-3 divide-y divide-zinc-100">{history.map((item) => <Link key={item.id} href={`/cv/generated/${item.id}`} className="flex justify-between gap-3 py-3 text-sm"><span>{item.title}{item.company ? ` · ${item.company}` : ""}</span><span className="text-xs text-zinc-500">{item.status === "complete" ? "Open CV →" : "View attempt"}</span></Link>)}</div></details>}
  </section>;
}
