"use client";

import { Download, Eraser, Loader2, Mic, Pause, Play, Sparkles, Square } from "lucide-react";
import { memo } from "react";

import { MAX_BPM, MIN_BPM, STYLES } from "@/lib/song-builder/types";
import { percent } from "../lib/format";
import type { TransportBarProps } from "../props";
import { Fader } from "./ui";

/**
 * Play, sing, style, tempo, and the one decoder knob — on a single line so the
 * five rows get the rest of the viewport.
 *
 * Style is the important control: it is a document in Mongo, and picking one
 * repopulates every row's sound list with that style's amplifiers and EQ. Tempo
 * also decides how long a take is, since the microphone stays open for exactly
 * one loop — the record buttons already show that length, so it is not repeated
 * here.
 *
 * Sing runs the loop with the microphone open and hands back a wav. Download
 * only exists once a take does, so there is never a dead control to explain.
 */
export const TransportBar = memo(function TransportBar({
  pack,
  bpm,
  playing,
  loading,
  sensitivity,
  singing,
  take,
  onToggle,
  onSing,
  onStyle,
  onBpm,
  onSensitivity,
  onDemo,
  onClear,
}: TransportBarProps) {
  return (
    <section className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 p-2">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-4 text-sm font-black text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/15"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
        {playing ? "Stop" : "Play"}
      </button>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSing}
          title="Play the loop with the microphone open, then download the mix"
          className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-4 text-sm font-black transition ${
            singing
              ? "border-rose-300 bg-rose-400/20 text-rose-50"
              : "border-rose-300/35 bg-rose-300/10 text-rose-100 hover:border-rose-200 hover:bg-rose-300/15"
          }`}
        >
          {singing ? <Square size={16} /> : <Mic size={18} />}
          {singing ? "Finish" : "Sing"}
        </button>

        {take ? (
          <a
            href={take.url}
            download={take.filename}
            title="Save the mix — the band and your voice"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-sky-300/35 bg-sky-300/10 px-4 text-sm font-black text-sky-100 transition hover:border-sky-200 hover:bg-sky-300/15"
          >
            <Download size={18} />
            Download
          </a>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        {STYLES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onStyle(option)}
            className={`min-h-10 rounded-md border px-3 text-sm font-black capitalize transition ${
              pack.style === option
                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/25"
            }`}
          >
            {option}
          </button>
        ))}
        {loading ? <Loader2 size={14} className="ml-1 animate-spin text-slate-500" /> : null}
      </div>

      <div className="flex min-w-[280px] flex-1 items-center gap-2">
        <Fader
          label="Tempo"
          value={bpm}
          min={MIN_BPM}
          max={MAX_BPM}
          step={1}
          display={`${bpm} bpm`}
          onChange={onBpm}
        />
        <Fader
          label="Mic"
          value={sensitivity}
          min={0}
          max={1}
          step={0.01}
          display={percent(sensitivity)}
          accent="sky"
          onChange={onSensitivity}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDemo}
          title="Load a hand-written groove — no microphone needed"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-slate-200 transition hover:border-white/25"
        >
          <Sparkles size={15} />
          Demo
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Empty every row"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-black text-slate-200 transition hover:border-rose-300/40 hover:text-rose-100"
        >
          <Eraser size={15} />
          Clear
        </button>
      </div>
    </section>
  );
});
