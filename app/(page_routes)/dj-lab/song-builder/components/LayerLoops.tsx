"use client";

import { memo } from "react";

import { STEP_COUNT } from "../lib/constants";
import { countHits, isStepsMode, loopSeconds, sampleOf } from "../lib/layer";
import { LoopSweep } from "./ui";
import type { LayerLoopsProps } from "../props";

/** Right-rail glance: one bar per layer showing its cycle, or its Beat Grid density. */
export const LayerLoops = memo(function LayerLoops({ layers, sampleById, playing }: LayerLoopsProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/45 p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between text-xs font-black uppercase text-slate-500">
        <span>Layer loops</span>
        <span>{playing ? "running" : "stopped"}</span>
      </div>
      <div className="space-y-1.5">
        {layers.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Each layer&apos;s loop cycle shows here.</p>
        ) : (
          layers.map((layer) => {
            const sample = sampleOf(layer, sampleById);
            const dur = loopSeconds(layer, sample);
            const stepsMode = isStepsMode(layer);
            return (
              <div key={layer.id} className="relative h-7 overflow-hidden rounded-md bg-white/[0.04]">
                {sample && !stepsMode && (
                  <LoopSweep
                    seconds={dur}
                    loop={layer.loop}
                    playing={playing}
                    background={`${layer.color}55`}
                  />
                )}
                <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-[11px] font-black uppercase text-white/75">
                  <span className="truncate">{layer.name}</span>
                  <span className="shrink-0 pl-2 text-white/50">
                    {!sample
                      ? "no sample"
                      : stepsMode
                        ? `${countHits(layer)}/${STEP_COUNT} steps · Beat Grid`
                        : `${dur.toFixed(2)}s${layer.loop ? "" : " · once"}`}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
