"use client";

import { memo } from "react";

import { ACCENT_CHAR, GHOST_CHAR, HIT_CHAR, REST_CHAR } from "@/lib/song-builder/pattern";
import { HOW_IT_WORKS } from "../lib/constants";
import { PanelTitle } from "./ui";

/** How the studio works, and what the saved pattern string means. */
export const StudioNotes = memo(function StudioNotes() {
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4">
      <PanelTitle eyebrow="Reference" title="How it works" />

      <ol className="mt-4 grid gap-2">
        {HOW_IT_WORKS.map(([step, blurb], index) => (
          <li key={step} className="flex gap-3 rounded-md bg-white/[0.04] p-3">
            <span className="text-sm font-black text-emerald-200">{index + 1}</span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-white">{step}</span>
              <span className="block text-xs text-slate-400">{blurb}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-[0.68rem] font-black uppercase text-slate-500">Pattern alphabet</p>
      <ul className="mt-2 grid gap-1 text-xs text-slate-400">
        {[
          [REST_CHAR, "silence"],
          [GHOST_CHAR, "ghost note — barely voiced"],
          [HIT_CHAR, "a normal hit"],
          [ACCENT_CHAR, "an accent — the loudest hits"],
        ].map(([char, meaning]) => (
          <li key={meaning} className="flex items-center gap-3">
            <span className="w-5 text-center font-mono text-sm text-emerald-200">{char}</span>
            {meaning}
          </li>
        ))}
      </ul>
    </section>
  );
});
