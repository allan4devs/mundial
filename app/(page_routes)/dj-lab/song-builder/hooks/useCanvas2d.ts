"use client";

import { useEffect, useRef } from "react";

export type Painter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

/**
 * Wires a canvas that fills its wrapper: handles devicePixelRatio sizing, repaints
 * on the next frame whenever `paint` changes, and redraws on resize.
 *
 * `paint` should be a `useCallback` listing whatever the drawing reads.
 */
export function useCanvas2d(paint: Painter) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !wrap || !ctx) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 2) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(ctx, rect.width, rect.height);
    };

    const raf = window.requestAnimationFrame(render);
    window.addEventListener("resize", render);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", render);
    };
  }, [paint]);

  return { wrapRef, canvasRef };
}
