"use client";

import { Repeat, Scissors } from "lucide-react";
import { memo } from "react";

import { MIN_CLIP_SECONDS, SNAP_OPTIONS } from "../lib/constants";
import { toNumber } from "../lib/format";
import { clipLength, loopSeconds, setClipLength, setClipStart } from "../lib/layer";
import type { ChopFieldsProps } from "../props";

const fieldClass =
  "inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 font-black text-slate-300";
const chipClass =
  "rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 font-black text-slate-200 transition hover:bg-white/[0.12]";

/** Numeric in / length fields plus the quick-length shortcuts. */
export const ChopFields = memo(function ChopFields({ sample, layer, onChange }: ChopFieldsProps) {
  const loopDur = loopSeconds(layer, sample);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Scissors size={13} className="text-slate-400" />

      <label className={fieldClass}>
        <span className="text-slate-500">in</span>
        <input
          type="number"
          min={0}
          max={Math.max(0, sample.duration - MIN_CLIP_SECONDS)}
          step={0.05}
          value={Number(layer.clipStart.toFixed(2))}
          onChange={(e) => onChange(setClipStart(layer, sample, toNumber(e.target.value, 0)))}
          className="w-12 bg-transparent text-right text-slate-100 outline-none"
        />
        <span className="text-slate-500">s</span>
      </label>

      <label className={fieldClass}>
        <span className="text-slate-500">len</span>
        <input
          type="number"
          min={MIN_CLIP_SECONDS}
          max={sample.duration}
          step={0.05}
          value={Number(clipLength(layer).toFixed(2))}
          onChange={(e) => onChange(setClipLength(layer, sample, toNumber(e.target.value, MIN_CLIP_SECONDS)))}
          className="w-12 bg-transparent text-right text-slate-100 outline-none"
        />
        <span className="text-slate-500">s</span>
      </label>

      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-300/10 px-2 py-1 font-black text-emerald-100">
        <Repeat size={12} /> {loopDur > 0 ? `${loopDur.toFixed(2)}s / loop` : "—"}
      </span>

      {SNAP_OPTIONS.map((sec) => (
        <button
          key={sec}
          type="button"
          onClick={() => onChange({ clipEnd: Math.min(sample.duration, layer.clipStart + sec) })}
          className={chipClass}
        >
          {sec}s
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange({ clipStart: 0, clipEnd: sample.duration })}
        className={chipClass}
      >
        Whole
      </button>
    </div>
  );
});
