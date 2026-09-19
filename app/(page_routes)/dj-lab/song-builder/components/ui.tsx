"use client";

import { memo } from "react";

import type { FaderProps } from "../props";

/**
 * The studio's one and only slider, on a single line: label, track, value.
 *
 * It is inline rather than stacked because the transport has to fit on one row —
 * the whole studio is sized to a single viewport with no scrolling.
 */
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
    <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
      <span className="shrink-0 text-[0.6rem] font-black uppercase text-slate-500">{label}</span>
      <input
        className={`min-w-0 flex-1 ${accent === "sky" ? "accent-sky-300" : "accent-emerald-300"}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="w-14 shrink-0 text-right text-xs font-black text-slate-300">{display}</span>
    </label>
  );
});
