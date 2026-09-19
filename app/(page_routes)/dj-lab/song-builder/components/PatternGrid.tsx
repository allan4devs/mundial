"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";

import { STEPS, STEPS_PER_BEAT } from "@/lib/song-builder/types";
import type { PatternGridProps } from "../props";

/**
 * The beat times: the take's loudness behind, the hits in front.
 *
 * The cells stretch to whatever height the row was given, because the studio is
 * sized to one viewport and the rows share what is left of it.
 *
 * Dragging across the grid paints or erases a run of steps, deciding from the
 * first cell which of the two it is — so a pass back over a cell you just filled
 * does not undo it. Touch is left alone as tap-to-toggle, because capturing the
 * drag there would fight the horizontal scroll on a narrow screen.
 */
export const PatternGrid = memo(function PatternGrid({
  hits,
  playStep,
  color,
  envelope,
  hint,
  onToggle,
}: PatternGridProps) {
  const byStep = useMemo(() => new Map(hits.map((hit) => [hit.step, hit])), [hits]);

  /** null when not painting; otherwise whether this drag is erasing. */
  const paintRef = useRef<boolean | null>(null);

  useEffect(() => {
    const end = () => {
      paintRef.current = null;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const start = useCallback(
    (step: number, filled: boolean, pointerType: string) => {
      if (pointerType !== "touch") paintRef.current = filled;
      onToggle(step);
    },
    [onToggle],
  );

  const paint = useCallback(
    (step: number, filled: boolean) => {
      // Only act when the cell is not already in the state this drag is applying.
      if (paintRef.current === null || paintRef.current !== filled) return;
      onToggle(step);
    },
    [onToggle],
  );

  return (
    <div className="relative min-h-0 overflow-x-auto">
      <div
        className="grid h-full min-h-14 gap-[2px] rounded-md border border-white/10 bg-black/40 p-1"
        style={{ gridTemplateColumns: `repeat(${STEPS}, minmax(12px, 1fr))` }}
      >
        {Array.from({ length: STEPS }, (_, step) => {
          const hit = byStep.get(step);
          const filled = Boolean(hit);
          const downbeat = step % STEPS_PER_BEAT === 0;

          return (
            <button
              key={step}
              type="button"
              onPointerDown={(event) => start(step, filled, event.pointerType)}
              onPointerEnter={() => paint(step, filled)}
              aria-label={`Step ${step + 1}`}
              aria-pressed={filled}
              // A line on every fourth cell makes the beat readable at a glance;
              // the background difference alone reads as one wide block.
              className={`relative flex items-end overflow-hidden rounded-sm border-l transition ${
                step === playStep ? "ring-1 ring-white/70" : ""
              } ${
                downbeat ? "border-white/25 bg-white/[0.09]" : "border-transparent bg-white/[0.04]"
              } hover:bg-white/[0.14]`}
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

      {/* The one line of guidance a row carries, in the space an empty row is not using. */}
      {hits.length === 0 ? (
        <p className="pointer-events-none absolute inset-0 grid place-items-center px-3 text-center text-[0.7rem] font-black uppercase tracking-wide text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
