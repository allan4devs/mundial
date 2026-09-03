"use client";

import { Disc3, Gauge, Waves } from "lucide-react";
import { memo } from "react";

import { HOW_IT_WORKS } from "../lib/constants";
import { InfoTile } from "./ui";
import type { StudioNotesProps } from "../props";

/** Studio log, the short manual, and the two engine badges. */
export const StudioNotes = memo(function StudioNotes({ message }: StudioNotesProps) {
  return (
    <>
      <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3">
        <p className="flex items-center gap-2 text-xs font-black uppercase text-emerald-100">
          <Waves size={15} /> Studio log
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
      </div>

      <div className="grid gap-2 rounded-lg border border-white/10 bg-black/40 p-4">
        <p className="text-xs font-black uppercase text-slate-500">How it works</p>
        {HOW_IT_WORKS.map(([term, copy]) => (
          <div key={term} className="flex gap-3 rounded-md bg-white/[0.04] px-3 py-2">
            <span className="w-14 shrink-0 text-xs font-black uppercase text-emerald-200">{term}</span>
            <span className="text-sm text-slate-300">{copy}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoTile icon={<Gauge size={18} />} label="Engine" value="Web Audio" />
        <InfoTile icon={<Disc3 size={18} />} label="Filters" value="LR4 bank" />
      </div>
    </>
  );
});
