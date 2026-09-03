"use client";

import { memo, useMemo } from "react";

import { encodePattern, groupPattern } from "@/lib/song-builder/pattern";
import { STEPS_PER_BEAT } from "@/lib/song-builder/types";
import type { PatternGridProps } from "../props";

/**
 * The rhythm, three ways at once: the decoded take's loudness behind, the hits on
 * the grid, and the `....|..|` string underneath. The string is the thing the
 * studio actually stores, so it is worth seeing it move as you edit.
 *
 * Every cell is a button — clicking adds or removes a hit, which is how a take
 * gets tidied up without re-recording it.
 */
export const PatternGrid = memo(function PatternGrid({
  hits,
  steps,
  playStep,
  color,
  envelope,
  onToggle,
}: PatternGridProps) {
  const byStep = useMemo(() => new Map(hits.map((hit) => [hit.step, hit])), [hits]);
  const pattern = useMemo(() => encodePattern(hits, steps), [hits, steps]);

  return (
    <div className="min-w-0">
      <div
        className="grid gap-[2px] rounded-md border border-white/10 bg-black/40 p-1"
        style={{ gridTemplateColumns: `repeat(${steps}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: steps }, (_, step) => {
          const hit = byStep.get(step);
          const downbeat = step % STEPS_PER_BEAT === 0;
          const live = step === playStep;

          return (
            <button
              key={step}
              type="button"
              onClick={() => onToggle(step)}
              aria-label={`Step ${step + 1}${hit ? " — remove hit" : " — add hit"}`}
              aria-pressed={Boolean(hit)}
              className={`relative flex h-14 items-end overflow-hidden rounded-sm transition ${
                live ? "ring-1 ring-white/70" : ""
              } ${downbeat ? "bg-white/[0.09]" : "bg-white/[0.04]"} hover:bg-white/[0.14]`}
            >
              {/* What the microphone heard, so a missed hit is visible before you fix it. */}
              {envelope?.[step] ? (
                <span
                  className="absolute inset-x-0 bottom-0 bg-white/10"
                  style={{ height: `${Math.round(envelope[step] * 100)}%` }}
                />
              ) : null}
              {hit ? (
                <span
                  className="relative w-full rounded-sm"
                  style={{
                    height: `${Math.round(28 + hit.velocity * 72)}%`,
                    backgroundColor: color,
                    // Brightness picks the drum piece and the scale degree, so it
                    // is worth showing: darker hits sit lower, brighter ones glow.
                    opacity: 0.45 + hit.tone * 0.55,
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-2 overflow-x-auto whitespace-nowrap font-mono text-[0.7rem] tracking-widest text-slate-500">
        {groupPattern(pattern)}
      </p>
    </div>
  );
});
