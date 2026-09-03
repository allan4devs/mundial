"use client";

import Link from "next/link";
import { AudioLines, Disc3, Mic } from "lucide-react";
import { memo } from "react";

/** Title block and the way back into the rest of the lab. */
export const StudioHeader = memo(function StudioHeader({ message }: { message: string }) {
  return (
    <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase tracking-normal text-emerald-200">
          <Mic size={15} /> Song Builder v1 · hum it, hear a band
        </p>
        <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-normal text-white sm:text-5xl">
          Five rows. Five takes. One loop.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Beat-box a rhythm into a row and the studio decodes it into steps — loudness becomes
          how hard the note hits, brightness picks the drum piece or the note. Then it plays the
          same rhythm back as a guitar, a bass or a kit.
        </p>
        <p className="mt-3 max-w-3xl rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-300">
          {message}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dj-lab"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-slate-200 transition hover:border-white/25"
        >
          <Disc3 size={18} />
          DJ Lab
        </Link>
        <Link
          href="/dj-lab/archive/song-builder-v0"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-slate-400 transition hover:border-white/25"
        >
          <AudioLines size={18} />
          v0 archive
        </Link>
      </div>
    </header>
  );
});
