"use client";

import { Play, Square } from "lucide-react";
import { memo } from "react";

import { MAX_BPM, MIN_BPM } from "../lib/constants";
import { clamp, formatTime, toNumber } from "../lib/format";
import type { TransportBarProps } from "../props";

/** Play / stop, the clock, and the two project-wide values: tempo and master gain. */
export const TransportBar = memo(function TransportBar({
  playing,
  canPlay,
  elapsed,
  bpm,
  masterGain,
  onToggle,
  onBpm,
  onMasterGain,
}: TransportBarProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl lg:grid-cols-[auto_1fr_auto]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={!canPlay}
          className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-md border px-6 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
            playing
              ? "border-red-300 bg-red-400 text-black hover:bg-red-300"
              : "border-emerald-300/45 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/25"
          }`}
        >
          {playing ? <Square size={18} /> : <Play size={18} />}
          {playing ? "Stop" : "Play"}
        </button>

        <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="block text-[0.68rem] font-black uppercase text-slate-500">Elapsed</span>
          <span className="text-lg font-black text-white">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="flex min-w-0 items-center rounded-md border border-white/10 bg-white/[0.04] px-4 py-2 text-xs leading-5 text-slate-400">
        Loop layers repeat their own slice. Steps layers fire from the Beat Grid, locked to Project BPM — use it to
        beat-match a vocal too.
      </div>

      <div className="flex items-center gap-3">
        <label className="w-28 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="mb-1 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
            <span>Proj. BPM</span>
          </span>
          <input
            className="w-full rounded bg-transparent text-lg font-black text-white outline-none"
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            value={bpm}
            onChange={(e) => onBpm(clamp(toNumber(e.target.value, bpm), MIN_BPM, MAX_BPM))}
          />
        </label>
        <label className="w-40 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="mb-1 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
            <span>Master</span>
            <span className="text-slate-300">{Math.round(masterGain * 100)}%</span>
          </span>
          <input
            className="w-full accent-sky-300"
            type="range"
            min={0}
            max={1.4}
            step={0.01}
            value={masterGain}
            onChange={(e) => onMasterGain(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
});
