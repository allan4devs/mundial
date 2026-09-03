"use client";

import { memo } from "react";

import type { FaderProps, PanelTitleProps, StatProps } from "../props";

/** Labelled range input — the studio's one and only slider. */
export const Fader = memo(function Fader({
  label,
  value,
  min,
  max,
  step,
  display,
  accent = "emerald",
  onChange,
}: FaderProps) {
  return (
    <label className="rounded-md border border-white/10 bg-black/30 p-3">
      <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
        <span>{label}</span>
        <span className="text-slate-300">{display}</span>
      </span>
      <input
        className={`w-full ${accent === "sky" ? "accent-sky-300" : "accent-emerald-300"}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
});

export const Stat = memo(function Stat({ label, value }: StatProps) {
  return (
    <div className="min-w-0 rounded-md bg-white/[0.06] p-3">
      <p className="text-[0.68rem] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
});

/** Small heading used at the top of each studio panel. */
export const PanelTitle = memo(function PanelTitle({ eyebrow, title, icon }: PanelTitleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
      </div>
      {icon}
    </div>
  );
});
