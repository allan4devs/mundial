"use client";

import { memo, useCallback, useRef } from "react";

import { DB_MAX, DB_MIN } from "../lib/constants";
import { freqToUnit, responseDbAt, unitToFreq } from "../lib/dsp";
import { clamp } from "../lib/format";
import { binForFreq } from "../lib/spectrogram";
import { capturePointer, ratioIn, releasePointer } from "../lib/pointer";
import { useCanvas2d } from "../hooks/useCanvas2d";
import type { EqCurveCanvasProps } from "../props";

/** Curve is sampled every N px — smooth enough, and cheap to redraw on drag. */
const CURVE_STEP_PX = 2;
/** Grab radius for the lens line, and how close a band point must be to win the grab. */
const LENS_GRAB_PX = 8;
const BAND_GRAB_PX = 14;
const AUDIBLE_HZ: [number, number] = [20, 20000];

type Drag = { kind: "band"; index: number } | { kind: "lens" };

/** Draggable response curve over the averaged spectrum: band points, plus the lens line. */
export const EqCurveCanvas = memo(function EqCurveCanvas({
  spectral,
  centers,
  spectro,
  onBandDb,
  onFocusHz,
}: EqCurveCanvasProps) {
  const dragRef = useRef<Drag | null>(null);

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const xForFreq = (f: number) => freqToUnit(f) * w;
      const yForDb = (db: number) => (1 - (db - DB_MIN) / (DB_MAX - DB_MIN)) * h;

      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.moveTo(0, yForDb(0));
      ctx.lineTo(w, yForDb(0));
      ctx.stroke();
      for (const f of [100, 1000, 10000]) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(xForFreq(f), 0);
        ctx.lineTo(xForFreq(f), h);
        ctx.stroke();
      }

      // Averaged spectrum of the chop, as a filled backdrop.
      if (spectro) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let px = 0; px <= w; px += CURVE_STEP_PX) {
          const bin = binForFreq(spectro, unitToFreq(px / w));
          ctx.lineTo(px, h - spectro.avg[bin] * h * 0.9);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = "rgba(56,189,248,0.16)";
        ctx.fill();
      }

      ctx.beginPath();
      for (let px = 0; px <= w; px += CURVE_STEP_PX) {
        const y = yForDb(responseDbAt(spectral, centers, unitToFreq(px / w)));
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.strokeStyle = "rgba(52,211,153,0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();

      centers.forEach((fc, i) => {
        ctx.beginPath();
        ctx.arc(xForFreq(fc), yForDb(spectral.bandDb[i] ?? 0), 4.5, 0, Math.PI * 2);
        ctx.fillStyle = spectral.bandOn[i] ? "#e2e8f0" : "rgba(148,163,184,0.4)";
        ctx.fill();
      });

      ctx.strokeStyle = "rgba(52,211,153,0.55)";
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xForFreq(spectral.focusHz), 0);
      ctx.lineTo(xForFreq(spectral.focusHz), h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(226,232,240,0.45)";
      ctx.font = "700 9px system-ui, sans-serif";
      ctx.fillText(`+${DB_MAX}`, 3, 10);
      ctx.fillText(`${DB_MIN}`, 3, h - 3);
    },
    [centers, spectral, spectro],
  );

  const { wrapRef, canvasRef } = useCanvas2d(paint);

  const dbAt = (clientY: number) => DB_MIN + (1 - ratioIn(wrapRef.current, 0, clientY).y) * (DB_MAX - DB_MIN);
  const freqAtX = (clientX: number) =>
    clamp(Math.round(unitToFreq(ratioIn(wrapRef.current, clientX, 0).x)), ...AUDIBLE_HZ);

  /** Decides whether a press grabs the lens line or the nearest band point. */
  const grab = (clientX: number, clientY: number) => {
    const { x: ratio, width } = ratioIn(wrapRef.current, clientX, clientY);
    const x = ratio * width;
    const lensX = freqToUnit(spectral.focusHz) * width;

    let nearest = 0;
    let nearestPx = Infinity;
    centers.forEach((fc, i) => {
      const d = Math.abs(freqToUnit(fc) * width - x);
      if (d < nearestPx) {
        nearestPx = d;
        nearest = i;
      }
    });

    if (Math.abs(lensX - x) < LENS_GRAB_PX && nearestPx > BAND_GRAB_PX) {
      dragRef.current = { kind: "lens" };
      onFocusHz(freqAtX(clientX));
    } else {
      dragRef.current = { kind: "band", index: nearest };
      onBandDb(nearest, dbAt(clientY));
    }
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={(e) => {
        capturePointer(e);
        grab(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current;
        if (!drag) return;
        if (drag.kind === "band") onBandDb(drag.index, dbAt(e.clientY));
        else onFocusHz(freqAtX(e.clientX));
      }}
      onPointerUp={(e) => {
        dragRef.current = null;
        releasePointer(e);
      }}
      onPointerCancel={(e) => {
        dragRef.current = null;
        releasePointer(e);
      }}
      title="Drag a band point up / down · drag the dashed line to move the lens"
      className="relative h-36 w-full cursor-pointer touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/50"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
});
