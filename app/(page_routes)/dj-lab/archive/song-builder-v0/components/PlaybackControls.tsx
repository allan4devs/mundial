"use client";

import { Repeat, Rewind } from "lucide-react";
import { memo } from "react";

import { MAX_SPEED, MIN_SPEED } from "../lib/constants";
import { isStepsMode } from "../lib/layer";
import { Fader } from "./ui";
import type { PlaybackControlsProps } from "../props";

const toggleClass =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-black uppercase transition";

/** Loop / one-shot, reverse, and the two per-layer faders. */
export const PlaybackControls = memo(function PlaybackControls({ layer, onChange }: PlaybackControlsProps) {
  const stepsMode = isStepsMode(layer);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/30 p-3">
        <span className="col-span-2 block text-[0.68rem] font-black uppercase text-slate-500">Playback</span>
        <button
          type="button"
          onClick={() => onChange({ loop: !layer.loop })}
          disabled={stepsMode}
          title={stepsMode ? "Ignored while this layer is in Steps mode" : undefined}
          className={`${toggleClass} disabled:cursor-not-allowed disabled:opacity-40 ${
            layer.loop
              ? "border-emerald-300 bg-emerald-300/15 text-emerald-100"
              : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
          }`}
        >
          <Repeat size={14} /> {layer.loop ? "Loop" : "One-shot"}
        </button>
        <button
          type="button"
          onClick={() => onChange({ reversed: !layer.reversed })}
          title="Reverse playback — the classic backwards-sample swell"
          className={`${toggleClass} ${
            layer.reversed
              ? "border-fuchsia-300 bg-fuchsia-300/15 text-fuchsia-100"
              : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
          }`}
        >
          <Rewind size={14} /> {layer.reversed ? "Reversed" : "Reverse"}
        </button>
      </div>

      <Fader
        label="Speed"
        value={layer.speed}
        min={MIN_SPEED}
        max={MAX_SPEED}
        step={0.05}
        display={`${layer.speed.toFixed(2)}×`}
        onChange={(speed) => onChange({ speed })}
      />
      <Fader
        label="Gain"
        value={layer.gain}
        min={0}
        max={1.5}
        step={0.01}
        accent="sky"
        display={`${Math.round(layer.gain * 100)}%`}
        onChange={(gain) => onChange({ gain })}
      />
    </div>
  );
});
