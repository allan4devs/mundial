"use client";

import Link from "next/link";
import { Disc3, Mic } from "lucide-react";
import { memo } from "react";

/**
 * One slim bar: what this is, what to do next, and the way back to the lab.
 *
 * The studio is sized to a single viewport, so the title takes a line rather
 * than a hero block — the five rows are the page.
 */
export const StudioHeader = memo(function StudioHeader({ message }: { message: string }) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-center gap-2">
        <Mic size={18} className="shrink-0 text-emerald-300" />
        <h1 className="truncate text-xl font-black tracking-tight text-white">Song Builder</h1>
        <span className="hidden shrink-0 text-[0.65rem] font-black uppercase tracking-wide text-emerald-300/70 sm:inline">
          Hum it, hear a band
        </span>
      </div>

      <p className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-slate-300">
        {message}
      </p>

      <Link
        href="/dj-lab"
        className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-slate-300 transition hover:border-white/25"
      >
        <Disc3 size={16} />
        DJ Lab
      </Link>
    </header>
  );
});
