/** Pointer-drag plumbing shared by the canvas editors. */

import type React from "react";
import { clamp } from "./format";

export function capturePointer(e: React.PointerEvent<HTMLElement>) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // capture is best-effort; dragging still works without it
  }
}

export function releasePointer(e: React.PointerEvent<HTMLElement>) {
  try {
    e.currentTarget.releasePointerCapture(e.pointerId);
  } catch {
    // pointer may not be captured
  }
}

/** Where a pointer sits inside an element, as 0..1 on each axis. */
export function ratioIn(el: HTMLElement | null, clientX: number, clientY: number) {
  if (!el) return { x: 0, y: 0, width: 0, height: 0 };
  const rect = el.getBoundingClientRect();
  return {
    x: clamp((clientX - rect.left) / rect.width, 0, 1),
    y: clamp((clientY - rect.top) / rect.height, 0, 1),
    width: rect.width,
    height: rect.height,
  };
}
