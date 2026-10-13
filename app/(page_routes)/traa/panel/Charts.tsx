"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/* ============================================================================
   Primitivas de grafico del panel /traa.

   Todo se dibuja a mano en SVG/HTML sobre la superficie oscura de la marca:
   marcas finas, rejilla capilar, una serie = un color, valores etiquetados en
   la punta y capa de hover con lectura de todas las series. Cada grafico
   ofrece ademas su tabla de datos, para que ningun valor dependa del puntero.
   Paleta validada contra la superficie #100e0c (ver panel.css).
   ========================================================================== */

const SERIES = ["var(--dv-1)", "var(--dv-2)", "var(--dv-3)", "var(--dv-4)", "var(--dv-5)"];
export const SERIES_COLORS = SERIES;

/** Ancho real del contenedor; arranca en un valor fijo para no romper la hidratacion. */
function useWidth(initial: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(initial);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setW(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, w] as const;
}

/** Escala con topes redondos (0 / 250 K / 500 K …). */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { max: 1, steps: [0, 1] };
  const raw = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const steps: number[] = [];
  for (let v = 0; v <= top + 1e-6; v += step) steps.push(v);
  return { max: top, steps };
}

// --- tooltip compartido ------------------------------------------------------

type TipRow = { color?: string; label: string; value: string };
export type TipState = { x: number; y: number; title: string; rows: TipRow[] } | null;

function Tip({ state, width }: { state: TipState; width: number }) {
  if (!state) return null;
  const x = Math.min(Math.max(state.x, 74), Math.max(width - 74, 74));
  return (
    <div className="tr-dash-tip" style={{ left: x, top: state.y }} aria-hidden="true">
      <div className="tr-dash-tip-t">{state.title}</div>
      {state.rows.map((r) => (
        <div className="tr-dash-tip-r" key={r.label}>
          {r.color && <i style={{ background: r.color }} />}
          <b>{r.value}</b>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

// --- tarjeta contenedora -----------------------------------------------------

export function Card({
  title,
  sub,
  children,
  span,
  action,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  span?: 2;
  action?: ReactNode;
}) {
  return (
    <section className={`tr-dash-card${span === 2 ? " is-wide" : ""}`}>
      <header className="tr-dash-card-h">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Tabla plegable: la via sin puntero a los mismos valores del grafico. */
export function DataTable({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="tr-dash-data">
      <summary>Ver datos</summary>
      <div className="tr-dash-data-scroll">
        <table>
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// --- tarjeta de indicador ----------------------------------------------------

export function StatTile({
  label,
  value,
  delta,
  deltaLabel,
  hero,
  spark,
  tone,
  foot,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  hero?: boolean;
  spark?: number[];
  tone?: "critical" | "warning";
  foot?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={`tr-dash-tile${hero ? " is-hero" : ""}${tone ? ` is-${tone}` : ""}`}>
      <span className="tr-dash-tile-l">{label}</span>
      <strong className="tr-dash-tile-v">{value}</strong>
      {delta !== undefined && (
        <span className={`tr-dash-delta${up ? " is-up" : " is-down"}`}>
          {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {up ? "+" : "−"}
          {Math.abs(delta).toString().replace(".", ",")}
          {deltaLabel}
        </span>
      )}
      {foot && <span className="tr-dash-tile-f">{foot}</span>}
      {spark && <Sparkline values={spark} />}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 132;
  const h = 30;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - 4) + 2;
    const y = h - 3 - ((v - min) / span) * (h - 8);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className="tr-dash-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--dv-dim)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="var(--dv-1)" stroke="var(--dv-surface)" strokeWidth="2" />
    </svg>
  );
}

// --- grafico de lineas (2 series, con cruz de mira) --------------------------

export type LineSeries = { key: string; label: string; color: string; values: number[] };

export function LineChart({
  labels,
  series,
  format,
  formatAxis,
  height = 250,
}: {
  labels: string[];
  series: LineSeries[];
  format: (n: number) => string;
  formatAxis: (n: number) => string;
  height?: number;
}) {
  const [ref, w] = useWidth(760);
  const [tip, setTip] = useState<TipState>(null);
  const [idx, setIdx] = useState<number | null>(null);

  const padL = 58;
  const padR = 74;
  const padT = 16;
  const padB = 30;
  const plotW = Math.max(w - padL - padR, 60);
  const plotH = height - padT - padB;

  const max = Math.max(...series.flatMap((s) => s.values));
  const scale = niceScale(max);
  const n = labels.length;
  const x = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH * (1 - v / scale.max);

  function move(clientX: number, rect: DOMRect) {
    const px = clientX - rect.left;
    const i = Math.round(((px - padL) / plotW) * (n - 1));
    select(Math.min(Math.max(i, 0), n - 1));
  }

  function select(i: number) {
    setIdx(i);
    setTip({
      x: x(i),
      y: Math.min(...series.map((s) => y(s.values[i]))) - 12,
      title: labels[i],
      rows: series.map((s) => ({ color: s.color, label: s.label, value: format(s.values[i]) })),
    });
  }

  function clear() {
    setIdx(null);
    setTip(null);
  }

  // etiquetas de fin: si los dos extremos casi se tocan, una sube y la otra baja
  const ends = series.map((s) => ({ s, y: y(s.values[n - 1]) }));
  const collide = ends.length > 1 && Math.abs(ends[0].y - ends[1].y) < 16;
  const sorted = [...ends].sort((a, b) => a.y - b.y);

  const tickEvery = Math.max(1, Math.ceil(n / 7));

  return (
    <div className="tr-dash-plot" ref={ref}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        role="img"
        aria-label="Ventas por día"
        tabIndex={0}
        onPointerMove={(e) => move(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={clear}
        onBlur={clear}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") select(Math.min((idx ?? -1) + 1, n - 1));
          else if (e.key === "ArrowLeft") select(Math.max((idx ?? n) - 1, 0));
          else return;
          e.preventDefault();
        }}
      >
        {/* rejilla capilar + eje Y */}
        {scale.steps.map((v) => (
          <g key={v}>
            <line x1={padL} x2={padL + plotW} y1={y(v)} y2={y(v)} stroke="var(--dv-grid)" strokeWidth="1" />
            <text x={padL - 10} y={y(v) + 4} textAnchor="end" className="tr-dash-axis">
              {formatAxis(v)}
            </text>
          </g>
        ))}

        {/* areas + lineas */}
        {series.map((s) => {
          const line = s.values
            .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
            .join(" ");
          return (
            <g key={s.key}>
              <path
                d={`${line} L${x(n - 1).toFixed(1)} ${y(0).toFixed(1)} L${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`}
                fill={s.color}
                opacity="0.1"
              />
              <path d={line} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}

        {/* cruz de mira */}
        {idx !== null && (
          <g>
            <line x1={x(idx)} x2={x(idx)} y1={padT} y2={padT + plotH} stroke="var(--dv-cross)" strokeWidth="1" />
            {series.map((s) => (
              <circle
                key={s.key}
                cx={x(idx)}
                cy={y(s.values[idx])}
                r="4.5"
                fill={s.color}
                stroke="var(--dv-surface)"
                strokeWidth="2"
              />
            ))}
          </g>
        )}

        {/* punta de cada serie + etiqueta directa */}
        {ends.map(({ s, y: ey }) => {
          const rank = sorted.findIndex((e) => e.s.key === s.key);
          const dy = collide ? (rank === 0 ? -9 : 13) : 4;
          return (
            <g key={`end-${s.key}`}>
              <circle cx={x(n - 1)} cy={ey} r="4.5" fill={s.color} stroke="var(--dv-surface)" strokeWidth="2" />
              <text x={x(n - 1) + 10} y={ey + dy} className="tr-dash-endlabel">
                {formatAxis(s.values[n - 1])}
              </text>
            </g>
          );
        })}

        {/* eje X */}
        {labels.map((l, i) =>
          i % tickEvery === 0 || i === n - 1 ? (
            <text key={l + i} x={x(i)} y={height - 9} textAnchor="middle" className="tr-dash-axis">
              {l}
            </text>
          ) : null,
        )}
      </svg>
      <Tip state={tip} width={w} />
    </div>
  );
}

// --- columnas (una serie) ----------------------------------------------------

export function Columns({
  labels,
  values,
  format,
  color = "var(--dv-1)",
  height = 190,
  unit,
}: {
  labels: string[];
  values: number[];
  format: (n: number) => string;
  color?: string;
  height?: number;
  unit?: string;
}) {
  const [ref, w] = useWidth(560);
  const [tip, setTip] = useState<TipState>(null);
  const [hover, setHover] = useState<number | null>(null);

  const padT = 14;
  const padB = 26;
  const padL = 4;
  const plotH = height - padT - padB;
  const plotW = Math.max(w - padL * 2, 40);
  const scale = niceScale(Math.max(...values), 3);
  const n = values.length;
  const band = plotW / n;
  const bw = Math.min(band - 6, 24);
  const maxIdx = values.indexOf(Math.max(...values));

  return (
    <div className="tr-dash-plot" ref={ref}>
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label="Despachos por día">
        <line x1={padL} x2={padL + plotW} y1={padT + plotH} y2={padT + plotH} stroke="var(--dv-axis)" strokeWidth="1" />
        {values.map((v, i) => {
          const h = (v / scale.max) * plotH;
          const cx = padL + band * i + band / 2;
          const on = hover === i;
          return (
            <g
              key={i}
              onPointerEnter={() => {
                setHover(i);
                setTip({
                  x: cx,
                  y: padT + plotH - h - 10,
                  title: labels[i],
                  rows: [{ color, label: unit ?? "", value: format(v) }],
                });
              }}
              onPointerLeave={() => {
                setHover(null);
                setTip(null);
              }}
            >
              {/* blanco de impacto mayor que la marca */}
              <rect x={cx - band / 2} y={padT} width={band} height={plotH} fill="transparent" />
              <rect
                x={cx - bw / 2}
                y={padT + plotH - h}
                width={bw}
                height={Math.max(h, 2)}
                rx="4"
                fill={color}
                opacity={on ? 1 : 0.82}
              />
              <rect x={cx - bw / 2} y={padT + plotH - Math.min(h, 5)} width={bw} height={Math.min(h, 5)} fill={color} opacity={on ? 1 : 0.82} />
              {i === maxIdx && (
                <text x={cx} y={padT + plotH - h - 7} textAnchor="middle" className="tr-dash-endlabel">
                  {format(v)}
                </text>
              )}
            </g>
          );
        })}
        {labels.map((l, i) =>
          i % 2 === 0 ? (
            <text key={l + i} x={padL + band * i + band / 2} y={height - 8} textAnchor="middle" className="tr-dash-axis">
              {l}
            </text>
          ) : null,
        )}
      </svg>
      <Tip state={tip} width={w} />
    </div>
  );
}

// --- barras horizontales (una serie) ----------------------------------------

export function BarList({
  rows,
  format,
  color = "var(--dv-1)",
  hintLabel,
}: {
  rows: { label: string; value: number; hint?: string }[];
  format: (n: number) => string;
  color?: string;
  hintLabel?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value));
  const [tip, setTip] = useState<TipState>(null);
  const [ref, w] = useWidth(420);

  return (
    <div className="tr-dash-plot tr-dash-bars" ref={ref}>
      {rows.map((r) => (
        <div
          className="tr-dash-bar"
          key={r.label}
          onPointerEnter={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            const host = e.currentTarget.parentElement!.getBoundingClientRect();
            setTip({
              x: box.left - host.left + box.width / 2,
              y: box.top - host.top - 6,
              title: r.label,
              rows: [
                { color, label: "", value: format(r.value) },
                ...(r.hint ? [{ label: hintLabel ?? "", value: r.hint }] : []),
              ],
            });
          }}
          onPointerLeave={() => setTip(null)}
        >
          <span className="tr-dash-bar-l">{r.label}</span>
          <span className="tr-dash-bar-track">
            <span className="tr-dash-bar-fill" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </span>
          <b className="tr-dash-bar-v">{format(r.value)}</b>
        </div>
      ))}
      <Tip state={tip} width={w} />
    </div>
  );
}

// --- barra de composicion (100 %) -------------------------------------------

export function ShareBar({
  parts,
  format,
}: {
  parts: { label: string; value: number }[];
  format: (n: number) => string;
}) {
  const [ref, w] = useWidth(420);
  const total = parts.reduce((s, p) => s + p.value, 0);
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="tr-dash-share" ref={ref}>
      <div className="tr-dash-share-bar">
        {parts.map((p, i) => {
          const share = (p.value / total) * 100;
          const px = (share / 100) * w;
          return (
            <span
              key={p.label}
              className={`tr-dash-share-seg${hover === p.label ? " is-on" : ""}`}
              style={{ width: `${share}%`, background: SERIES[i % SERIES.length] }}
              onPointerEnter={() => setHover(p.label)}
              onPointerLeave={() => setHover(null)}
              title={`${p.label}: ${format(p.value)}`}
            >
              {px > 64 && <em>{format(p.value)}</em>}
            </span>
          );
        })}
      </div>
      <ul className="tr-dash-legend">
        {parts.map((p, i) => (
          <li key={p.label}>
            <i style={{ background: SERIES[i % SERIES.length] }} />
            <span>{p.label}</span>
            <b>{format(p.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Leyenda para graficos de dos o mas series. */
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="tr-dash-legend is-inline">
      {items.map((it) => (
        <li key={it.label}>
          <i className="is-line" style={{ background: it.color }} />
          <span>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
