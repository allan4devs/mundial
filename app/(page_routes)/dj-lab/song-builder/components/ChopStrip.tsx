"use client";

import { Rewind } from "lucide-react";
import React, { memo, useCallback, useRef } from "react";

import { MIN_CLIP_SECONDS } from "../lib/constants";
import { clamp } from "../lib/format";
import { moveClip } from "../lib/layer";
import { capturePointer, ratioIn, releasePointer } from "../lib/pointer";
import { useCanvas2d } from "../hooks/useCanvas2d";
import type { ChopStripProps } from "../props";

/** Grab radius, in px, for the two trim handles. */
const EDGE_PX = 10;
/** Below this selection width the drag-the-middle grip is not worth drawing. */
const GRIP_MIN_PX = 26;

type Drag = { mode: "start" } | { mode: "end" } | { mode: "move"; grabOffset: number };

/** Waveform with a draggable chop region: edges trim, the middle slides the whole slice. */
export const ChopStrip = memo(function ChopStrip({ sample, layer, onChange }: ChopStripProps) {
  const dragRef = useRef<Drag | null>(null);

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, w, h);

      const { peaks } = sample;
      const bw = w / peaks.length;
      const s0 = clamp(layer.clipStart / sample.duration, 0, 1);
      const s1 = clamp(layer.clipEnd / sample.duration, 0, 1);

      peaks.forEach((peak, i) => {
        const frac = i / peaks.length;
        const inSelection = frac >= s0 && frac <= s1;
        const bh = Math.max(2, peak * (h - 10));
        ctx.fillStyle = inSelection ? sample.color : "rgba(148,163,184,0.22)";
        ctx.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 0.5), bh);
      });

      ctx.fillStyle = "rgba(52,211,153,0.10)";
      ctx.fillRect(s0 * w, 0, (s1 - s0) * w, h);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(s0 * w - 1, 0, 2, h);
      ctx.fillRect(s1 * w - 1, 0, 2, h);

      if ((s1 - s0) * w > GRIP_MIN_PX) {
        const midX = ((s0 + s1) / 2) * w;
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (let d = -1; d <= 1; d += 1) ctx.fillRect(midX + d * 4 - 1, h / 2 - 7, 2, 14);
      }
    },
    [layer.clipEnd, layer.clipStart, sample],
  );

  const { wrapRef, canvasRef } = useCanvas2d(paint);

  const timeAt = (clientX: number) => ratioIn(wrapRef.current, clientX, 0).x * sample.duration;

  const applyDrag = (clientX: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const t = timeAt(clientX);
    if (drag.mode === "start") {
      onChange({ clipStart: clamp(t, 0, layer.clipEnd - MIN_CLIP_SECONDS) });
    } else if (drag.mode === "end") {
      onChange({ clipEnd: clamp(t, layer.clipStart + MIN_CLIP_SECONDS, sample.duration) });
    } else {
      onChange(moveClip(layer, sample, t - drag.grabOffset));
    }
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x: ratio, width } = ratioIn(wrapRef.current, e.clientX, e.clientY);
    const x = ratio * width;
    const t = ratio * sample.duration;
    const startPx = (layer.clipStart / sample.duration) * width;
    const endPx = (layer.clipEnd / sample.duration) * width;

    if (Math.abs(x - startPx) <= EDGE_PX) {
      dragRef.current = { mode: "start" };
    } else if (Math.abs(x - endPx) <= EDGE_PX) {
      dragRef.current = { mode: "end" };
    } else if (x > startPx && x < endPx) {
      dragRef.current = { mode: "move", grabOffset: t - layer.clipStart };
    } else {
      // Outside the slice: pull whichever edge is nearer.
      dragRef.current =
        Math.abs(t - layer.clipStart) <= Math.abs(t - layer.clipEnd) ? { mode: "start" } : { mode: "end" };
    }

    capturePointer(e);
    applyDrag(e.clientX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    releasePointer(e);
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={onDown}
      onPointerMove={(e) => {
        if (dragRef.current) applyDrag(e.clientX);
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      title="Drag an edge to trim · drag the middle to move the slice as a block"
      className="relative h-20 w-full cursor-grab touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/40 active:cursor-grabbing"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {layer.reversed && (
        <span className="pointer-events-none absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-fuchsia-300/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-fuchsia-100">
          <Rewind size={10} /> reversed
        </span>
      )}
    </div>
  );
});
