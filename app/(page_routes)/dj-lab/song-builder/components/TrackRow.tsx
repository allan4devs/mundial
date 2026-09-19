"use client";

import { Loader2, Mic, Square, VolumeX } from "lucide-react";
import { memo } from "react";

import { MUTED_COLOR, TRACK_META } from "../lib/constants";
import type { RecorderPhase } from "../hooks/useRecorder";
import type { TrackRowProps } from "../props";
import { PatternGrid } from "./PatternGrid";

/**
 * One row, and only three things: the microphone, the sound it plays through,
 * and when it sounds.
 *
 * The fourth thing is the row's own name, which is also its mute: clicking it
 * takes the instrument out of the mix and greys the row, so silencing one costs
 * no space that the label was not already spending. Everything else a mixer would
 * put here — level, solo, audition — is still deliberately absent.
 *
 * The controls sit in a fixed-width column beside the grid so a row stays short
 * enough that several fit at once; the grid takes the width that is left.
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
  muted,
  onRecord,
  onCancel,
  onToggleStep,
  onSound,
  onMute,
}: TrackRowProps) {
  const meta = TRACK_META[kind];
  const active = recording !== null;
  // A silenced row keeps its shape and loses its colour, which is the whole
  // visual difference: the dot, the name and every hit on the grid go grey.
  const tint = muted ? MUTED_COLOR : meta.color;

  return (
    <article
      className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 rounded-lg border border-white/10 bg-black/30 p-2 lg:grid-cols-[minmax(0,232px)_minmax(0,1fr)] lg:grid-rows-1"
      style={active ? { borderColor: meta.color } : undefined}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-col lg:items-stretch lg:justify-center">
        <h2 className="flex min-w-0 flex-1 lg:flex-none">
          <button
            type="button"
            onClick={() => onMute(kind)}
            aria-pressed={muted}
            title={muted ? `Unmute ${meta.label}` : `Silence ${meta.label}`}
            className="flex w-full min-w-0 items-center gap-2 rounded text-left text-sm font-black transition hover:opacity-75"
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tint }} />
            <span className={`truncate ${muted ? "text-slate-500 line-through" : "text-white"}`}>{meta.label}</span>
            {muted ? <VolumeX size={13} className="shrink-0 text-slate-500" /> : null}
          </button>
        </h2>

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
        color={tint}
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
