"use client";

import { Eraser, Grid3x3 } from "lucide-react";
import { memo, useEffect } from "react";

import { STEPS_PER_BEAT, STEP_COUNT } from "../lib/constants";
import { isStepsMode, sampleOf } from "../lib/layer";
import type { BeatGridPanelProps, BeatGridRowProps, StepCellProps } from "../props";

/**
 * Drag-to-paint state, shared by every cell on the grid: pointerdown decides whether
 * the stroke is switching steps on or off, and pointerenter applies that value.
 */
const paintValue = { current: null as boolean | null };

const StepCell = memo(function StepCell({ layerId, index, on, color, disabled, onToggle }: StepCellProps) {
  // Every fourth cell starts a new beat — alternate the shading so the bar is readable.
  const onBeat = Math.floor(index / STEPS_PER_BEAT) % 2 === 0;
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        paintValue.current = !on;
        onToggle(layerId, index, !on);
      }}
      onPointerEnter={() => {
        if (paintValue.current !== null) onToggle(layerId, index, paintValue.current);
      }}
      className={`relative h-8 border-r border-white/10 transition last:border-r-0 disabled:cursor-not-allowed ${
        disabled
          ? "opacity-30"
          : onBeat
            ? "bg-white/[0.05] hover:bg-white/[0.1]"
            : "bg-white/[0.02] hover:bg-white/[0.08]"
      }`}
      style={on ? { background: color } : undefined}
      title={`Step ${index + 1}`}
    />
  );
});

const BeatGridRow = memo(function BeatGridRow({
  layer,
  sample,
  playing,
  activeStep,
  onToggleStep,
  onSetMode,
  onClearSteps,
}: BeatGridRowProps) {
  const stepsMode = isStepsMode(layer);
  const locked = !stepsMode || !sample;

  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ background: layer.color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-white">{layer.name}</p>
          <p className="truncate text-[10px] text-slate-500">{sample ? sample.name : "no sample"}</p>
        </div>
        <button
          type="button"
          onClick={() => onSetMode(layer.id, stepsMode ? "loop" : "steps")}
          disabled={!sample}
          className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${
            stepsMode ? "bg-emerald-300 text-black" : "bg-white/[0.08] text-slate-300 hover:bg-white/[0.16]"
          }`}
          title={stepsMode ? "Switch back to continuous Loop" : "Switch to Steps to program hits"}
        >
          {stepsMode ? "Steps" : "Loop"}
        </button>
        <button
          type="button"
          onClick={() => onClearSteps(layer.id)}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-500 transition hover:text-red-200"
          title="Clear this row's pattern"
        >
          <Eraser size={12} />
        </button>
      </div>

      <div
        className="relative grid overflow-hidden rounded-md border border-white/10"
        style={{ gridTemplateColumns: `repeat(${STEP_COUNT}, minmax(0,1fr))` }}
      >
        {playing && (
          <div
            className="pointer-events-none absolute inset-y-0 bg-white/15"
            style={{ left: `${(activeStep / STEP_COUNT) * 100}%`, width: `${100 / STEP_COUNT}%` }}
          />
        )}
        {layer.steps.map((on, i) => (
          <StepCell
            key={i}
            layerId={layer.id}
            index={i}
            on={on}
            color={layer.color}
            disabled={locked}
            onToggle={onToggleStep}
          />
        ))}
      </div>
    </div>
  );
});

/** One 16th-note bar with every layer as a row — the step sequencer. */
export const BeatGridPanel = memo(function BeatGridPanel({
  layers,
  sampleById,
  playing,
  activeStep,
  onToggleStep,
  onSetMode,
  onClearSteps,
}: BeatGridPanelProps) {
  useEffect(() => {
    const endPaint = () => {
      paintValue.current = null;
    };
    window.addEventListener("pointerup", endPaint);
    window.addEventListener("pointercancel", endPaint);
    return () => {
      window.removeEventListener("pointerup", endPaint);
      window.removeEventListener("pointercancel", endPaint);
    };
  }, []);

  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">All layers, one grid</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
            <Grid3x3 className="text-emerald-200" size={22} /> Beat Grid
          </h2>
        </div>
        <p className="max-w-md text-xs leading-5 text-slate-400">
          Flip a layer to <span className="font-black text-slate-200">Steps</span> to program hits here instead of
          looping continuously — the playhead sweeps in sync with Project BPM. Click a cell to toggle it, or drag with
          the mouse to paint a run.
        </p>
      </div>

      {layers.length === 0 ? (
        <p className="rounded-md border border-white/10 bg-black/30 p-6 text-center text-sm text-slate-500">
          Add a layer below, then switch it to Steps to program a pattern here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] gap-2">
            {layers.map((layer) => (
              <BeatGridRow
                key={layer.id}
                layer={layer}
                sample={sampleOf(layer, sampleById)}
                playing={playing}
                activeStep={activeStep}
                onToggleStep={onToggleStep}
                onSetMode={onSetMode}
                onClearSteps={onClearSteps}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
