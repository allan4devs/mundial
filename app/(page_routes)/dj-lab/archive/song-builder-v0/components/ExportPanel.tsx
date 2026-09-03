"use client";

import { Download } from "lucide-react";
import { memo } from "react";

import { PanelTitle } from "./ui";
import type { ExportPanelProps } from "../props";

/** Bounce length + the offline render trigger. */
export const ExportPanel = memo(function ExportPanel({
  seconds,
  rendering,
  canExport,
  onSeconds,
  onExport,
}: ExportPanelProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
      <PanelTitle eyebrow="Bounce" title="Export song" icon={<Download className="text-emerald-200" size={24} />} />
      <label className="rounded-md border border-white/10 bg-white/[0.04] p-3">
        <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
          <span>Length</span>
          <span className="text-slate-300">{seconds}s</span>
        </span>
        <input
          className="w-full accent-emerald-300"
          type="range"
          min={4}
          max={60}
          step={1}
          value={seconds}
          onChange={(e) => onSeconds(Number(e.target.value))}
        />
      </label>
      <button
        type="button"
        onClick={onExport}
        disabled={rendering || !canExport}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-300/15 px-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-300/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Download size={18} />
        {rendering ? "Rendering…" : `Export WAV (${seconds}s)`}
      </button>
    </div>
  );
});
