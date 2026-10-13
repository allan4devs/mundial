"use client";

import {
  memo,
  type MouseEvent as RMouseEvent,
  type PointerEvent as RPointerEvent,
  type WheelEvent as RWheelEvent,
} from "react";
import {
  ANCHORS,
  anchorUV,
  fmtM,
  machineCorners,
  type Anchor,
  type View,
  worldToScreen,
} from "./geometry";
import { CATALOG_BY_ID, CATEGORY_META, STATUS_META } from "./catalog";
import type { PlanObject, Tool } from "./types";

export const RULER = 20; // px gutter for the rulers

export interface GhostRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  objects: PlanObject[];
  view: View;
  size: { w: number; h: number };
  gridSize: number;
  showGrid: boolean;
  showDims: boolean;
  tool: Tool;
  selectedId: string | null;
  hoverId: string | null;
  draftRect: GhostRect | null;
  ghost: (GhostRect & { color: string }) | null;
  cursorWorld: { x: number; y: number } | null;
  panning: boolean;
  setSvgEl: (el: SVGSVGElement | null) => void;
  onPointerDown: (e: RPointerEvent) => void;
  onPointerMove: (e: RPointerEvent) => void;
  onPointerUp: (e: RPointerEvent) => void;
  onPointerLeave: (e: RPointerEvent) => void;
  onWheel: (e: RWheelEvent) => void;
  onHandleDown: (anchor: Anchor, e: RPointerEvent) => void;
  onRotateDown: (e: RPointerEvent) => void;
  onDoubleClick: (e: RMouseEvent) => void;
}

const HANDLE_CURSOR: Record<Anchor, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
};

function CanvasSurfaceBase(p: Props) {
  const { view, size, gridSize } = p;
  const { ppm, offset } = view;
  const W2S = (x: number, y: number) => worldToScreen({ x, y }, view);

  // adaptive grid + ruler step
  let labelStep = gridSize || 0.5;
  while (labelStep * ppm < 56 && labelStep < 1000) labelStep *= 2;
  const minorCell = gridSize * ppm;
  const showMinor = p.showGrid && minorCell >= 6;
  const majorCell = labelStep * ppm;

  const selected = p.objects.find((o) => o.id === p.selectedId) ?? null;

  // ── ruler ticks ─────────────────────────────
  const xTicks: { s: number; v: number }[] = [];
  const yTicks: { s: number; v: number }[] = [];
  {
    const w0 = (-offset.x) / ppm;
    const w1 = (size.w - offset.x) / ppm;
    const start = Math.floor(w0 / labelStep) * labelStep;
    for (let v = start; v <= w1; v += labelStep) xTicks.push({ s: v * ppm + offset.x, v });
    const h0 = (-offset.y) / ppm;
    const h1 = (size.h - offset.y) / ppm;
    const startY = Math.floor(h0 / labelStep) * labelStep;
    for (let v = startY; v <= h1; v += labelStep) yTicks.push({ s: v * ppm + offset.y, v });
  }

  const cursorStyle = p.panning
    ? "grabbing"
    : p.tool === "pan"
      ? "grab"
      : p.tool === "rect"
        ? "crosshair"
        : p.tool === "machine"
          ? "copy"
          : "default";

  return (
    <svg
      ref={p.setSvgEl}
      width={size.w || 1}
      height={size.h || 1}
      className="absolute inset-0 h-full w-full touch-none select-none"
      style={{ cursor: cursorStyle }}
      onPointerDown={p.onPointerDown}
      onPointerMove={p.onPointerMove}
      onPointerUp={p.onPointerUp}
      onPointerLeave={p.onPointerLeave}
      onWheel={p.onWheel}
      onDoubleClick={p.onDoubleClick}
    >
      <defs>
        <pattern
          id="plano-minor"
          width={minorCell}
          height={minorCell}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${mod(offset.x, minorCell)} ${mod(offset.y, minorCell)})`}
        >
          <path d={`M ${minorCell} 0 L 0 0 0 ${minorCell}`} fill="none" stroke="#1b2b45" strokeWidth={1} />
        </pattern>
        <pattern
          id="plano-major"
          width={majorCell}
          height={majorCell}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${mod(offset.x, majorCell)} ${mod(offset.y, majorCell)})`}
        >
          <path d={`M ${majorCell} 0 L 0 0 0 ${majorCell}`} fill="none" stroke="#2b4368" strokeWidth={1.25} />
        </pattern>
      </defs>

      <rect x={0} y={0} width={size.w} height={size.h} fill="#0b1220" />
      {showMinor && <rect x={0} y={0} width={size.w} height={size.h} fill="url(#plano-minor)" />}
      {p.showGrid && <rect x={0} y={0} width={size.w} height={size.h} fill="url(#plano-major)" />}

      {/* world origin axes */}
      <line x1={offset.x} y1={0} x2={offset.x} y2={size.h} stroke="#38507a" strokeWidth={1} strokeDasharray="2 4" />
      <line x1={0} y1={offset.y} x2={size.w} y2={offset.y} stroke="#38507a" strokeWidth={1} strokeDasharray="2 4" />

      {/* ── rects ── */}
      {p.objects.map((o) => {
        if (o.kind !== "rect") return null;
        const a = W2S(o.x, o.y);
        const w = o.w * ppm;
        const h = o.h * ppm;
        const isSel = o.id === p.selectedId;
        const isHover = o.id === p.hoverId;
        return (
          <g key={o.id}>
            <rect
              x={a.x}
              y={a.y}
              width={w}
              height={h}
              fill={o.color + "12"}
              stroke={o.color}
              strokeWidth={isSel ? 2.5 : isHover ? 2 : 1.5}
              strokeOpacity={0.9}
            />
            {ppm >= 14 && (
              <text
                x={a.x + 6}
                y={a.y + 5}
                fontSize={11}
                fontWeight={700}
                fill={o.color}
                dominantBaseline="hanging"
                style={{ paintOrder: "stroke" }}
                stroke="#0b1220"
                strokeWidth={3}
              >
                {o.label}
              </text>
            )}
          </g>
        );
      })}

      {/* ── machines ── */}
      {p.objects.map((o) => {
        if (o.kind !== "machine") return null;
        const cat = CATALOG_BY_ID[o.catalogId];
        const color = cat ? CATEGORY_META[cat.category].color : "#94a3b8";
        const stat = STATUS_META[o.status];
        const pts = machineCorners(o).map((c) => W2S(c.x, c.y));
        const poly = pts.map((c) => `${c.x},${c.y}`).join(" ");
        const isSel = o.id === p.selectedId;
        const isHover = o.id === p.hoverId;
        // front marker: local (0,-h/2) -> a bit inward
        const rad = (o.rotation * Math.PI) / 180;
        const fx = Math.sin(rad);
        const fy = -Math.cos(rad);
        const inset = Math.min(0.32, o.h * 0.4);
        const f0 = W2S(o.x + fx * (o.h / 2), o.y + fy * (o.h / 2));
        const f1 = W2S(o.x + fx * (o.h / 2 - inset), o.y + fy * (o.h / 2 - inset));
        const center = W2S(o.x, o.y);
        return (
          <g key={o.id}>
            <polygon
              points={poly}
              fill={color + (o.status === "down" ? "10" : "26")}
              stroke={o.status === "ok" ? color : stat.color}
              strokeWidth={isSel ? 2.5 : isHover ? 2 : 1.5}
              strokeDasharray={o.status === "maintenance" ? "5 3" : undefined}
            />
            <line x1={f0.x} y1={f0.y} x2={f1.x} y2={f1.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
            {o.status !== "ok" && (
              <circle cx={pts[1].x} cy={pts[1].y} r={4} fill={stat.color} stroke="#0b1220" strokeWidth={1} />
            )}
            {ppm >= 20 && (
              <text
                x={center.x}
                y={center.y}
                fontSize={10}
                fill="#e5edff"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ paintOrder: "stroke" }}
                stroke="#0b1220"
                strokeWidth={3}
              >
                {o.assetTag || o.label}
              </text>
            )}
          </g>
        );
      })}

      {/* ── dimensions for the selected object ── */}
      {selected && p.showDims && <Dims o={selected} view={view} />}

      {/* ── selection chrome (stripped on export) ── */}
      <g data-ephemeral="1">
        {selected?.kind === "rect" &&
          (() => {
            const a = W2S(selected.x, selected.y);
            const w = selected.w * ppm;
            const h = selected.h * ppm;
            return (
              <>
                <rect
                  x={a.x}
                  y={a.y}
                  width={w}
                  height={h}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                {ANCHORS.map((anchor) => {
                  const uv = anchorUV(anchor);
                  const hx = a.x + uv.x * w;
                  const hy = a.y + uv.y * h;
                  return (
                    <rect
                      key={anchor}
                      x={hx - 5}
                      y={hy - 5}
                      width={10}
                      height={10}
                      fill="#0b1220"
                      stroke="#22d3ee"
                      strokeWidth={1.5}
                      style={{ cursor: HANDLE_CURSOR[anchor] }}
                      onPointerDown={(e) => p.onHandleDown(anchor, e)}
                    />
                  );
                })}
              </>
            );
          })()}

        {selected?.kind === "machine" &&
          (() => {
            const pts = machineCorners(selected).map((c) => W2S(c.x, c.y));
            const poly = pts.map((c) => `${c.x},${c.y}`).join(" ");
            const topMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
            const rad = (selected.rotation * Math.PI) / 180;
            const nx = Math.sin(rad);
            const ny = -Math.cos(rad);
            const knob = { x: topMid.x + nx * 26, y: topMid.y + ny * 26 };
            return (
              <>
                <polygon points={poly} fill="none" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 3" />
                <line x1={topMid.x} y1={topMid.y} x2={knob.x} y2={knob.y} stroke="#22d3ee" strokeWidth={1.5} />
                <circle
                  cx={knob.x}
                  cy={knob.y}
                  r={6}
                  fill="#0b1220"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  style={{ cursor: "grab" }}
                  onPointerDown={p.onRotateDown}
                />
              </>
            );
          })()}

        {p.draftRect &&
          (() => {
            const a = W2S(p.draftRect.x, p.draftRect.y);
            return (
              <>
                <rect
                  x={a.x}
                  y={a.y}
                  width={p.draftRect.w * ppm}
                  height={p.draftRect.h * ppm}
                  fill="#22d3ee18"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <text
                  x={a.x + (p.draftRect.w * ppm) / 2}
                  y={a.y - 8}
                  fontSize={11}
                  fill="#a5f3fc"
                  textAnchor="middle"
                >
                  {fmtM(p.draftRect.w)} × {fmtM(p.draftRect.h)}
                </text>
              </>
            );
          })()}

        {p.ghost &&
          (() => {
            const a = W2S(p.ghost.x - p.ghost.w / 2, p.ghost.y - p.ghost.h / 2);
            return (
              <rect
                x={a.x}
                y={a.y}
                width={p.ghost.w * ppm}
                height={p.ghost.h * ppm}
                fill={p.ghost.color + "22"}
                stroke={p.ghost.color}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                pointerEvents="none"
              />
            );
          })()}
      </g>

      {/* ── rulers ── */}
      <g data-ephemeral="1">
        <rect x={0} y={0} width={size.w} height={RULER} fill="#0e1a30" />
        <rect x={0} y={0} width={RULER} height={size.h} fill="#0e1a30" />
        <rect x={0} y={0} width={RULER} height={RULER} fill="#132444" />
        {xTicks.map((t) => (
          <g key={`x${t.v}`}>
            <line x1={t.s} y1={RULER - 5} x2={t.s} y2={RULER} stroke="#5b7bb0" strokeWidth={1} />
            <text x={t.s + 3} y={7} fontSize={9} fill="#8fb0e0" dominantBaseline="hanging">
              {trimNum(t.v)}
            </text>
          </g>
        ))}
        {yTicks.map((t) => (
          <g key={`y${t.v}`}>
            <line x1={RULER - 5} y1={t.s} x2={RULER} y2={t.s} stroke="#5b7bb0" strokeWidth={1} />
            <text x={3} y={t.s + 3} fontSize={9} fill="#8fb0e0" dominantBaseline="hanging">
              {trimNum(t.v)}
            </text>
          </g>
        ))}
        {p.cursorWorld && (
          <>
            <line
              x1={W2S(p.cursorWorld.x, 0).x}
              y1={0}
              x2={W2S(p.cursorWorld.x, 0).x}
              y2={RULER}
              stroke="#22d3ee"
              strokeWidth={1}
            />
            <line
              x1={0}
              y1={W2S(0, p.cursorWorld.y).y}
              x2={RULER}
              y2={W2S(0, p.cursorWorld.y).y}
              stroke="#22d3ee"
              strokeWidth={1}
            />
          </>
        )}
      </g>
    </svg>
  );
}

function Dims({ o, view }: { o: PlanObject; view: View }) {
  const { ppm } = view;
  if (o.kind === "rect") {
    const a = worldToScreen({ x: o.x, y: o.y }, view);
    const w = o.w * ppm;
    const h = o.h * ppm;
    return (
      <g pointerEvents="none">
        <text x={a.x + w / 2} y={a.y - 6} fontSize={10} fill="#a5f3fc" textAnchor="middle">
          {fmtM(o.w)}
        </text>
        <text
          x={a.x - 6}
          y={a.y + h / 2}
          fontSize={10}
          fill="#a5f3fc"
          textAnchor="middle"
          transform={`rotate(-90 ${a.x - 6} ${a.y + h / 2})`}
        >
          {fmtM(o.h)}
        </text>
      </g>
    );
  }
  const pts = machineCorners(o).map((c) => worldToScreen(c, view));
  const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
  const maxY = Math.max(...pts.map((c) => c.y));
  return (
    <g pointerEvents="none">
      <text x={cx} y={maxY + 14} fontSize={10} fill="#a5f3fc" textAnchor="middle">
        {fmtM(o.w)} × {fmtM(o.h)}
        {o.rotation ? ` · ${Math.round(o.rotation)}°` : ""}
      </text>
    </g>
  );
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const trimNum = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, "");
};

export const CanvasSurface = memo(CanvasSurfaceBase);
