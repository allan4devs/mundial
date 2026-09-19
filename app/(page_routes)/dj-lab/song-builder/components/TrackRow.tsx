"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { memo } from "react";

import { TRACK_META } from "../lib/constants";
import type { RecorderPhase } from "../hooks/useRecorder";
import type { TrackRowProps } from "../props";
import { PatternGrid } from "./PatternGrid";

/**
 * One row, and only three things: the microphone, the sound it plays through,
 * and when it sounds.
 *
 * The controls sit in a fixed-width column beside the grid so that all five rows
 * fit one viewport; the grid takes whatever height is left. Everything else a
 * mixer would put here — level, mute, solo, audition — was removed on purpose.
 */
export const TrackRow = memo(function TrackRow({
  kind,
  hits,
  sound,
  options,
  playStep,
  envelope,
  recording,
  beatSeconds,
  takeSeconds,
  busy,
  onRecord,
  onCancel,
  onToggleStep,
  onSound,
}: TrackRowProps) {
  const meta = TRACK_META[kind];
  const active = recording !== null;

  return (
    <article
      className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 rounded-lg border border-white/10 bg-black/30 p-2 lg:grid-cols-[minmax(0,232px)_minmax(0,1fr)] lg:grid-rows-1"
      style={active ? { borderColor: meta.color } : undefined}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-col lg:items-stretch lg:justify-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
          <h2 className="truncate text-sm font-black text-white">{meta.label}</h2>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {active ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={recording.phase === "decoding"}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-rose-300/40 bg-rose-300/10 px-2 text-xs font-black text-rose-100 transition hover:border-rose-200 disabled:opacity-60"
            >
              <RecordingLabel phase={recording.phase} remaining={recording.remaining} beatSeconds={beatSeconds} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRecord(kind)}
              disabled={busy}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-2 text-xs font-black text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/15 disabled:opacity-40"
            >
              <Mic size={14} />
              Record {takeSeconds.toFixed(1)}s
            </button>
          )}

          <select
            className="min-h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/50 px-2 text-xs font-black text-white"
            value={sound.id}
            onChange={(event) => onSound(kind, event.target.value)}
            aria-label={`${meta.label} sound`}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PatternGrid
        hits={hits}
        playStep={playStep}
        color={meta.color}
        envelope={envelope}
        hint={meta.cue}
        onToggle={(step) => onToggleStep(kind, step)}
      />
    </article>
  );
});

/** What the record button says while a take is in flight. */
function RecordingLabel({
  phase,
  remaining,
  beatSeconds,
}: {
  phase: RecorderPhase;
  remaining: number;
  beatSeconds: number;
}) {
  if (phase === "countIn") {
    return (
      <>
        <Square size={14} />
        Ready… {Math.max(1, Math.ceil(remaining / beatSeconds))}
      </>
    );
  }
  if (phase === "recording") {
    return (
      <>
        <Square size={14} />
        Rec {remaining.toFixed(1)}s
      </>
    );
  }
  return (
    <>
      <Loader2 size={14} className="animate-spin" />
      Decoding…
    </>
  );
}
