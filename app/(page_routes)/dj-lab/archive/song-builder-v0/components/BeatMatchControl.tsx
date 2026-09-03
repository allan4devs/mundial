"use client";

import { Hand, Magnet } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import { MAX_BPM, MAX_SOURCE_BPM, MAX_SPEED, MIN_BPM, MIN_SOURCE_BPM, MIN_SPEED } from "../lib/constants";
import { clamp, toNumber } from "../lib/format";
import type { BeatMatchControlProps } from "../props";

/** Taps further apart than this start a fresh measurement. */
const TAP_RESET_MS = 2000;
/** Rolling window of taps averaged into a tempo. */
const MAX_TAPS = 6;

/** Tap-tempo + source BPM, so an a cappella can be locked to the project tempo. */
export const BeatMatchControl = memo(function BeatMatchControl({
  sourceBpm,
  speed,
  projectBpm,
  onMatch,
}: BeatMatchControlProps) {
  const [draftBpm, setDraftBpm] = useState(sourceBpm ?? projectBpm);
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    if (sourceBpm) setDraftBpm(sourceBpm);
  }, [sourceBpm]);

  const tap = () => {
    const now = performance.now();
    const taps = tapsRef.current;
    if (taps.length && now - taps[taps.length - 1] > TAP_RESET_MS) taps.length = 0;
    taps.push(now);
    if (taps.length > MAX_TAPS) taps.shift();
    if (taps.length < 2) return;
    const span = taps[taps.length - 1] - taps[0];
    const average = span / (taps.length - 1);
    setDraftBpm(clamp(Math.round(60000 / average), MIN_BPM, MAX_BPM));
  };

  const idealRatio = draftBpm > 0 ? projectBpm / draftBpm : 1;
  const outOfRange = idealRatio < MIN_SPEED || idealRatio > MAX_SPEED;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-sky-300/20 bg-sky-300/5 p-3">
      <Magnet size={14} className="shrink-0 text-sky-200" />
      <span className="text-[0.68rem] font-black uppercase text-slate-500">Beat match</span>
      <label className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-xs font-black text-slate-300">
        <span className="text-slate-500">source</span>
        <input
          type="number"
          min={MIN_SOURCE_BPM}
          max={MAX_SOURCE_BPM}
          step={1}
          value={draftBpm}
          onChange={(e) => setDraftBpm(toNumber(e.target.value, 0))}
          className="w-14 bg-transparent text-right text-slate-100 outline-none"
        />
        <span className="text-slate-500">bpm</span>
      </label>
      <button
        type="button"
        onClick={tap}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.06] px-2.5 text-xs font-black uppercase text-slate-200 transition hover:bg-white/[0.12]"
        title="Tap along with the vocal a few times to estimate its BPM"
      >
        <Hand size={13} /> Tap
      </button>
      <button
        type="button"
        onClick={() => draftBpm > 0 && onMatch(draftBpm)}
        disabled={!draftBpm}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-sky-300/40 bg-sky-300/15 px-2.5 text-xs font-black uppercase text-sky-100 transition hover:bg-sky-300/25 disabled:cursor-not-allowed disabled:opacity-40"
        title="Set this layer's speed so it locks to the project BPM"
      >
        <Magnet size={13} /> Match to {projectBpm}
      </button>
      <span className="text-[11px] text-slate-500">
        speed {speed.toFixed(2)}×{sourceBpm ? ` · locked from ${sourceBpm} bpm` : ""}
      </span>
      {outOfRange && (
        <span className="text-[11px] font-black text-amber-300">
          {draftBpm}→{projectBpm} needs {idealRatio.toFixed(2)}×, clamped to{" "}
          {clamp(idealRatio, MIN_SPEED, MAX_SPEED).toFixed(2)}×
        </span>
      )}
    </div>
  );
});
