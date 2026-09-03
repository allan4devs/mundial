"use client";

import { RefreshCw, Shuffle, Sparkles, Zap } from "lucide-react";
import { memo } from "react";

import { MAX_BPM, MIN_BPM } from "../lib/constants";
import { GENRES, KEYS } from "../lib/songForge";
import type { InstantStudioPanelProps } from "../props";

/** One-tap procedural song generator — zero uploads, zero licences. */
export const InstantStudioPanel = memo(function InstantStudioPanel({
  genre,
  rootPc,
  bpm,
  generating,
  hasGenerated,
  onPickGenre,
  onPickRoot,
  onBpm,
  onGenerate,
  onSurprise,
  onRemix,
}: InstantStudioPanelProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-fuchsia-300/25 bg-[radial-gradient(circle_at_12%_0%,rgba(232,121,249,0.18),transparent_42%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.16),transparent_40%),linear-gradient(180deg,rgba(17,20,26,0.9),rgba(8,10,13,0.9))] p-4 shadow-2xl sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-md border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1.5 text-xs font-black uppercase text-fuchsia-100">
            <Zap size={15} /> Instant Studio
          </p>
          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">Make a track in one tap</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
            Pick a vibe and a key — the studio synthesises tight, locked drums, bass, chords and melody. No uploads,
            no samples, no licences. Then chop, filter or bounce it like any other layer.
          </p>
        </div>
        <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[0.68rem] font-black uppercase text-emerald-100">
          100% in-browser
        </span>
      </div>

      {/* Genre chips */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {GENRES.map((g) => {
          const active = genre === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onPickGenre(g.id)}
              className={`group flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition ${
                active
                  ? "border-fuchsia-300/70 bg-fuchsia-300/15 shadow-[0_0_0_1px_rgba(232,121,249,0.4)]"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/[0.09]"
              }`}
            >
              <span className="text-lg leading-none">{g.emoji}</span>
              <span className={`text-sm font-black ${active ? "text-white" : "text-slate-100"}`}>{g.name}</span>
              <span className="text-[0.66rem] leading-tight text-slate-400">{g.blurb}</span>
            </button>
          );
        })}
      </div>

      {/* Key + tempo */}
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
        <label className="rounded-lg border border-white/10 bg-black/30 p-3">
          <span className="mb-2 block text-[0.68rem] font-black uppercase text-slate-500">Key</span>
          <div className="flex flex-wrap gap-1">
            {KEYS.map((k, i) => (
              <button
                key={k}
                type="button"
                onClick={() => onPickRoot(i)}
                className={`h-8 min-w-8 rounded-md border px-1.5 text-xs font-black transition ${
                  rootPc === i
                    ? "border-sky-300 bg-sky-300/20 text-sky-100"
                    : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </label>
        <label className="rounded-lg border border-white/10 bg-black/30 p-3">
          <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
            <span>Tempo</span>
            <span className="text-slate-300">{bpm} BPM</span>
          </span>
          <input
            className="w-full accent-fuchsia-300"
            type="range"
            min={60}
            max={180}
            step={1}
            value={bpm}
            onChange={(e) => onBpm(Number(e.target.value))}
          />
          <span className="mt-1 block text-[0.66rem] text-slate-500">
            Snapped to the genre&apos;s signature tempo — nudge it to taste ({MIN_BPM}–{MAX_BPM} on the transport).
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr_1fr]">
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-fuchsia-300/50 bg-gradient-to-r from-fuchsia-400/30 to-sky-400/25 px-5 text-base font-black text-white transition hover:from-fuchsia-400/45 hover:to-sky-400/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles size={20} />
          {generating ? "Forging…" : hasGenerated ? "Generate again" : "Generate song"}
        </button>
        <button
          type="button"
          onClick={onSurprise}
          disabled={generating}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-4 text-sm font-black text-slate-100 transition hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-50"
          title="Random genre, key and variation"
        >
          <Shuffle size={18} /> Surprise me
        </button>
        <button
          type="button"
          onClick={onRemix}
          disabled={generating || !hasGenerated}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-4 text-sm font-black text-slate-100 transition hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-40"
          title="Same vibe, fresh chords and melody"
        >
          <RefreshCw size={18} /> Remix
        </button>
      </div>
    </div>
  );
});
