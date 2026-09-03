"use client";

import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { memo } from "react";

import { Stat } from "./ui";
import type { StudioHeaderProps } from "../props";

/** Hero: what this tool is, plus the three numbers worth glancing at. */
export const StudioHeader = memo(function StudioHeader({
  layerCount,
  sampleCount,
  masterGain,
}: StudioHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <Link
          href="/dj-lab"
          className="inline-flex items-center gap-1 text-xs font-black uppercase text-emerald-200 underline-offset-4 hover:underline"
        >
          <ChevronLeft size={14} /> Back to DJ Lab
        </Link>
        <p className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase text-emerald-100">
          <Sparkles size={15} /> Song Builder
        </p>
        <h1 className="mt-3 text-4xl font-black leading-[0.92] text-white sm:text-6xl">Generate, chop, loop</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Tap a genre and the studio builds a full, locked track from scratch — drums, bass, chords and melody, no
          uploads. Bring your own MP3s too if you like: slice any part, stack a layer per instrument, split it into a
          real filterbank, then bounce the mix to a WAV.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
        <Stat label="Layers" value={`${layerCount}`} />
        <Stat label="Samples" value={`${sampleCount}`} />
        <Stat label="Master" value={`${Math.round(masterGain * 100)}%`} />
      </div>
    </header>
  );
});
