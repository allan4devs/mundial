"use client";

import { Loader2, Mic, Play, RefreshCw, Square, Trash2, Volume2, VolumeX } from "lucide-react";
import { memo } from "react";

import { INSTRUMENTS } from "../lib/instruments";
import { TRACK_META } from "../lib/constants";
import { percent } from "../lib/format";
import type { TrackRowProps } from "../props";
import { PatternGrid } from "./PatternGrid";

/**
 * One instrument row: record a take into it, then edit what the decoder heard.
 *
 * The row never touches audio itself — every control reports up to the shell,
 * which owns the song and the engine.
 */
export const TrackRow = memo(function TrackRow({
  track,
  steps,
  playStep,
  envelope,
  recording,
  beatSeconds,
  takeSeconds,
  hasTake,
  busy,
  onRecord,
  onCancel,
  onRedecode,
  onToggleStep,
  onPatch,
  onAudition,
  onClear,
}: TrackRowProps) {
  const meta = TRACK_META[track.kind];
  const options = INSTRUMENTS[track.kind];
  const instrument = options.find((option) => option.id === track.instrumentId) ?? options[0];
  const active = recording !== null;

  return (
    <article
      className="grid gap-4 rounded-lg border border-white/10 bg-black/30 p-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]"
      style={active ? { borderColor: meta.color } : undefined}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
          <h3 className="truncate text-lg font-black text-white">{meta.label}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">{meta.role}</p>
        <p className="mt-2 text-[0.7rem] font-black uppercase tracking-wide text-slate-500">{meta.cue}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {active ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={recording.phase === "decoding"}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-rose-300/40 bg-rose-300/10 px-3 text-sm font-black text-rose-100 transition hover:border-rose-200 disabled:opacity-60"
            >
              <RecordingLabel phase={recording.phase} remaining={recording.remaining} beatSeconds={beatSeconds} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRecord(track.kind)}
              disabled={busy}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-3 text-sm font-black text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/15 disabled:opacity-40"
            >
              <Mic size={16} />
              Record {takeSeconds.toFixed(1)}s
            </button>
          )}

          <button
            type="button"
            onClick={() => onRedecode(track.kind)}
            disabled={!hasTake || busy}
            title="Decode the same take again at the current sensitivity"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-slate-300 transition hover:border-white/25 disabled:opacity-30"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <label className="mt-3 block">
          <span className="text-[0.68rem] font-black uppercase text-slate-500">Sound</span>
          <select
            className="mt-1 w-full rounded-md border border-white/10 bg-black/50 px-2 py-2 text-sm font-black text-white"
            value={instrument.id}
            onChange={(event) => onPatch(track.kind, { instrumentId: event.target.value })}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-1 text-[0.7rem] text-slate-500">{instrument.hint}</p>
      </div>

      <div className="min-w-0">
        <PatternGrid
          hits={track.hits}
          steps={steps}
          playStep={playStep}
          color={meta.color}
          envelope={envelope}
          onToggle={(step) => onToggleStep(track.kind, step)}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAudition(track.kind)}
            title={track.muted ? "Unmute the row to hear it" : "Play this row once"}
            disabled={track.hits.length === 0 || track.muted}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-black uppercase text-slate-300 transition hover:border-white/25 disabled:opacity-30"
          >
            <Play size={14} />
            Hear row
          </button>

          <button
            type="button"
            onClick={() => onPatch(track.kind, { muted: !track.muted })}
            aria-pressed={track.muted}
            className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black uppercase transition ${
              track.muted
                ? "border-rose-300/40 bg-rose-300/10 text-rose-100"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25"
            }`}
          >
            {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {track.muted ? "Muted" : "Live"}
          </button>

          <label className="flex min-w-[150px] flex-1 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-[0.68rem] font-black uppercase text-slate-500">Level</span>
            <input
              className="min-w-0 flex-1 accent-emerald-300"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={track.gain}
              onChange={(event) => onPatch(track.kind, { gain: Number(event.target.value) })}
            />
            <span className="w-10 text-right text-xs font-black text-slate-300">{percent(track.gain)}</span>
          </label>

          <button
            type="button"
            onClick={() => onClear(track.kind)}
            disabled={track.hits.length === 0}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-black uppercase text-slate-300 transition hover:border-rose-300/40 hover:text-rose-100 disabled:opacity-30"
          >
            <Trash2 size={14} />
            Clear
          </button>

          <span className="text-xs font-black uppercase text-slate-500">
            {track.hits.length} hit{track.hits.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </article>
  );
});

/** What the record button says while a take is in flight. */
function RecordingLabel({
  phase,
  remaining,
  beatSeconds,
}: {
  phase: string;
  remaining: number;
  beatSeconds: number;
}) {
  if (phase === "countIn") {
    return (
      <>
        <Square size={16} />
        Get ready… {Math.max(1, Math.ceil(remaining / beatSeconds))}
      </>
    );
  }
  if (phase === "recording") {
    return (
      <>
        <Square size={16} />
        Recording {remaining.toFixed(1)}s
      </>
    );
  }
  return (
    <>
      <Loader2 size={16} className="animate-spin" />
      Decoding…
    </>
  );
}
