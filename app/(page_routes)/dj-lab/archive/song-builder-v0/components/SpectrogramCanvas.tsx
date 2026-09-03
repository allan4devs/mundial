"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";

import { FB_MAX_HZ, FB_MIN_HZ } from "../lib/constants";
import { freqToUnit, unitToFreq } from "../lib/dsp";
import { clamp, fmtHz } from "../lib/format";
import { binForFreq, spectrogramToCanvas } from "../lib/spectrogram";
import { capturePointer, ratioIn, releasePointer } from "../lib/pointer";
import { useCanvas2d } from "../hooks/useCanvas2d";
import type { SpectrogramCanvasProps } from "../props";

/** Gridlines drawn over the spectrum. */
const GUIDE_HZ = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
/** Vertical resampling resolution — the log axis is redrawn row by row. */
const MAX_ROWS = 200;
const AUDIBLE_HZ: [number, number] = [20, 20000];

/** Time/frequency heat map of the focused chop, with the focus lens overlaid. */
export const SpectrogramCanvas = memo(function SpectrogramCanvas({
  spectro,
  spectral,
  onFocusHz,
}: SpectrogramCanvasProps) {
  const draggingRef = useRef(false);

  // Painting the FFT into an offscreen canvas once lets each repaint be a few drawImage calls.
  const offscreen = useMemo(() => (spectro ? spectrogramToCanvas(spectro) : null), [spectro]);

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, w, h);

      if (offscreen && spectro) {
        ctx.imageSmoothingEnabled = true;
        const rows = Math.min(h, MAX_ROWS);
        const rowH = h / rows;
        for (let r = 0; r < rows; r += 1) {
          const freq = unitToFreq(1 - r / rows);
          const srcY = spectro.bins - 1 - binForFreq(spectro, freq);
          ctx.drawImage(offscreen, 0, srcY, spectro.frames, 1, 0, r * rowH, w, rowH + 1);
        }
      } else {
        ctx.fillStyle = "rgba(148,163,184,0.45)";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.fillText(spectro === null ? "Assign a sample to read its spectrum" : "…", 12, h / 2);
      }

      ctx.font = "700 9px system-ui, sans-serif";
      for (const f of GUIDE_HZ) {
        if (f <= FB_MIN_HZ || f >= FB_MAX_HZ) continue;
        const y = (1 - freqToUnit(f)) * h;
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(226,232,240,0.5)";
        ctx.fillText(fmtHz(f), 4, y - 2);
      }

      // Focus lens: a band one width either side of the centre frequency.
      const yc = (1 - freqToUnit(spectral.focusHz)) * h;
      const yLo = (1 - freqToUnit(spectral.focusHz * 2 ** spectral.focusWidthOct)) * h;
      const yHi = (1 - freqToUnit(spectral.focusHz * 2 ** -spectral.focusWidthOct)) * h;
      ctx.fillStyle = "rgba(52,211,153,0.14)";
      ctx.fillRect(0, Math.min(yLo, yHi), w, Math.abs(yHi - yLo));
      ctx.strokeStyle = "rgba(52,211,153,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, yc);
      ctx.lineTo(w, yc);
      ctx.stroke();
      ctx.fillStyle = "rgba(52,211,153,0.95)";
      ctx.fillText(`lens ${fmtHz(spectral.focusHz)}Hz`, w - 78, yc - 4);
    },
    [offscreen, spectro, spectral.focusHz, spectral.focusWidthOct],
  );

  const { wrapRef, canvasRef } = useCanvas2d(paint);

  useEffect(() => {
    const endDrag = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", endDrag);
    return () => window.removeEventListener("pointerup", endDrag);
  }, []);

  const freqAt = (clientY: number) => {
    const { y } = ratioIn(wrapRef.current, 0, clientY);
    return clamp(Math.round(unitToFreq(1 - y)), ...AUDIBLE_HZ);
  };

  return (
    <div
      ref={wrapRef}
      onPointerDown={(e) => {
        draggingRef.current = true;
        capturePointer(e);
        onFocusHz(freqAt(e.clientY));
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) onFocusHz(freqAt(e.clientY));
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        releasePointer(e);
      }}
      title="Drag vertically to slide the focus lens through the spectrum"
      className="relative h-44 w-full cursor-ns-resize touch-none select-none overflow-hidden rounded-md border border-white/10 bg-black/50"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
});
