import type { PlanMachine, PlanObject, PlanRect, Vec2 } from "./types";

// ───────────────────────────────────────────────
// View transform:  screen = world * ppm + offset
// ───────────────────────────────────────────────
export interface View {
  /** effective pixels per meter (pxPerM * zoom) */
  ppm: number;
  /** pixel offset of world origin inside the svg */
  offset: Vec2;
}

export const worldToScreen = (w: Vec2, v: View): Vec2 => ({
  x: w.x * v.ppm + v.offset.x,
  y: w.y * v.ppm + v.offset.y,
});

export const screenToWorld = (s: Vec2, v: View): Vec2 => ({
  x: (s.x - v.offset.x) / v.ppm,
  y: (s.y - v.offset.y) / v.ppm,
});

/** Pointer position relative to an element's top-left, in CSS pixels. */
export function localPoint(el: Element, clientX: number, clientY: number): Vec2 {
  const r = el.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top };
}

export const snap = (v: number, step: number): number =>
  step > 0 ? Math.round(v / step) * step : v;

export const snapVec = (p: Vec2, step: number): Vec2 => ({
  x: snap(p.x, step),
  y: snap(p.y, step),
});

/** round to avoid 0.30000000000000004 noise in the UI + storage */
export const clean = (v: number): number => Math.round(v * 1000) / 1000;

// ───────────────────────────────────────────────
// Bounds (axis-aligned, meters). Machines are rotated → use the
// rotated footprint's AABB.
// ───────────────────────────────────────────────
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function rectBounds(r: PlanRect): Bounds {
  return { minX: r.x, minY: r.y, maxX: r.x + r.w, maxY: r.y + r.h };
}

export function machineCorners(m: PlanMachine): Vec2[] {
  const rad = (m.rotation * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const hw = m.w / 2;
  const hh = m.h / 2;
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((p) => ({ x: m.x + p.x * c - p.y * s, y: m.y + p.x * s + p.y * c }));
}

export function machineBounds(m: PlanMachine): Bounds {
  const pts = machineCorners(m);
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

export function objBounds(o: PlanObject): Bounds {
  return o.kind === "rect" ? rectBounds(o) : machineBounds(o);
}

export function unionBounds(objs: PlanObject[]): Bounds | null {
  if (objs.length === 0) return null;
  const b = objs.map(objBounds);
  return {
    minX: Math.min(...b.map((x) => x.minX)),
    minY: Math.min(...b.map((x) => x.minY)),
    maxX: Math.max(...b.map((x) => x.maxX)),
    maxY: Math.max(...b.map((x) => x.maxY)),
  };
}

// ───────────────────────────────────────────────
// Hit testing (world-space point)
// ───────────────────────────────────────────────
export function pointInRect(p: Vec2, r: PlanRect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function pointInMachine(p: Vec2, m: PlanMachine): boolean {
  const rad = (-m.rotation * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const dx = p.x - m.x;
  const dy = p.y - m.y;
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return Math.abs(lx) <= m.w / 2 && Math.abs(ly) <= m.h / 2;
}

export function hitObject(p: Vec2, m: PlanObject): boolean {
  return m.kind === "rect" ? pointInRect(p, m) : pointInMachine(p, m);
}

/**
 * Topmost object under the point. Machines sit above rects; within a
 * kind, later array entries win; among rects the smallest one wins so a
 * zone nested in the perimeter is still reachable.
 */
export function pickAt(objects: PlanObject[], p: Vec2): PlanObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    if (o.kind === "machine" && pointInMachine(p, o)) return o;
  }
  const rects = objects.filter(
    (o): o is PlanRect => o.kind === "rect" && pointInRect(p, o),
  );
  if (rects.length === 0) return null;
  rects.sort((a, b) => a.w * a.h - b.w * b.h);
  return rects[0];
}

/** label of the smallest rect whose area contains the machine's center */
export function zoneOfMachine(m: PlanMachine, objects: PlanObject[]): string | null {
  const rects = objects.filter(
    (o): o is PlanRect => o.kind === "rect" && pointInRect({ x: m.x, y: m.y }, o),
  );
  if (rects.length === 0) return null;
  rects.sort((a, b) => a.w * a.h - b.w * b.h);
  return rects[0].label;
}

// ───────────────────────────────────────────────
// Resize math for axis-aligned rects
// ───────────────────────────────────────────────
export type Anchor = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const ANCHORS: Anchor[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

/** unit position of a handle within the rect, 0..1 on each axis */
export function anchorUV(a: Anchor): Vec2 {
  const x = a.includes("w") ? 0 : a.includes("e") ? 1 : 0.5;
  const y = a.includes("n") ? 0 : a.includes("s") ? 1 : 0.5;
  return { x, y };
}

export function resizeRect(
  start: PlanRect,
  a: Anchor,
  world: Vec2,
  step: number,
  minSize = 0.2,
): { x: number; y: number; w: number; h: number } {
  let { x, y, w, h } = start;
  const right = x + w;
  const bottom = y + h;
  const p = snapVec(world, step);

  if (a.includes("w")) {
    x = Math.min(p.x, right - minSize);
    w = right - x;
  }
  if (a.includes("e")) {
    w = Math.max(minSize, p.x - x);
  }
  if (a.includes("n")) {
    y = Math.min(p.y, bottom - minSize);
    h = bottom - y;
  }
  if (a.includes("s")) {
    h = Math.max(minSize, p.y - y);
  }
  return { x: clean(x), y: clean(y), w: clean(w), h: clean(h) };
}

export const fmtM = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  return (Number.isInteger(r) ? r.toString() : r.toFixed(2)) + " m";
};

export const fmtArea = (v: number): string => `${(Math.round(v * 10) / 10).toFixed(1)} m²`;
