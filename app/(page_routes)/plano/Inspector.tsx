"use client";

import { memo, useMemo, useState } from "react";
import {
  Copy,
  Crosshair,
  Download,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/helpers/utils";
import {
  CATALOG_BY_ID,
  CATEGORY_META,
  STATUS_META,
  STATUS_ORDER,
  ZONE_PRESETS,
} from "./catalog";
import { fmtArea, fmtM, zoneOfMachine } from "./geometry";
import type {
  Category,
  MachineStatus,
  PlanMachine,
  PlanObject,
  PlanRect,
} from "./types";

type Patch = Partial<PlanRect> & Partial<PlanMachine>;

interface Props {
  objects: PlanObject[];
  selected: PlanObject | null;
  tab: "props" | "inv";
  gridSize: number;
  onTab: (t: "props" | "inv") => void;
  onUpdate: (id: string, patch: Patch) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onFocus: (id: string) => void;
  onExportCSV: () => void;
}

function InspectorBase(p: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 border-b border-white/10">
        <Tab active={p.tab === "props"} onClick={() => p.onTab("props")}>
          Propiedades
        </Tab>
        <Tab active={p.tab === "inv"} onClick={() => p.onTab("inv")}>
          Inventario
        </Tab>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {p.tab === "props" ? (
          <PropsTab {...p} />
        ) : (
          <InventoryTab
            objects={p.objects}
            selectedId={p.selected?.id ?? null}
            onFocus={p.onFocus}
            onUpdate={p.onUpdate}
            onExportCSV={p.onExportCSV}
          />
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Properties
// ───────────────────────────────────────────────
function PropsTab({ selected, objects, gridSize, onUpdate, onDelete, onDuplicate, onFocus }: Props) {
  if (!selected) {
    const machines = objects.filter((o) => o.kind === "machine").length;
    const rects = objects.filter((o) => o.kind === "rect").length;
    return (
      <div className="p-4 text-[12.5px] leading-relaxed text-slate-400">
        <p className="text-slate-300">Nada seleccionado.</p>
        <ul className="mt-3 space-y-1.5">
          <li>· Herramienta <b className="text-slate-200">Cuadro</b> (B): arrastrá para dibujar el piso o una zona.</li>
          <li>· Elegí una <b className="text-slate-200">máquina</b> del panel izquierdo y hacé clic para colocarla.</li>
          <li>· <b className="text-slate-200">Seleccionar</b> (V): mover, rotar, redimensionar y editar.</li>
          <li>· Rueda = zoom · arrastrar vacío = paneo.</li>
        </ul>
        <p className="mt-4 text-slate-500">
          {rects} cuadro{rects === 1 ? "" : "s"} · {machines} máquina{machines === 1 ? "" : "s"} en el plano.
        </p>
      </div>
    );
  }

  const step = gridSize;

  return (
    <div className="space-y-4 p-3">
      {selected.kind === "rect" ? (
        <RectProps rect={selected} step={step} onUpdate={onUpdate} />
      ) : (
        <MachineProps machine={selected} objects={objects} step={step} onUpdate={onUpdate} onFocus={onFocus} />
      )}

      <div className="flex gap-2 border-t border-white/10 pt-3">
        <button
          onClick={() => onDuplicate(selected.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 py-1.5 text-[12px] text-slate-200 transition hover:border-white/35"
        >
          <Copy className="h-3.5 w-3.5" /> Duplicar
        </button>
        <button
          onClick={() => onDelete(selected.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 py-1.5 text-[12px] text-rose-300 transition hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Borrar
        </button>
      </div>
    </div>
  );
}

function RectProps({
  rect,
  step,
  onUpdate,
}: {
  rect: PlanRect;
  step: number;
  onUpdate: (id: string, patch: Patch) => void;
}) {
  const set = (patch: Patch) => onUpdate(rect.id, patch);
  return (
    <>
      <Field label="Nombre">
        <input
          value={rect.label}
          onChange={(e) => set({ label: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="Tipo de zona">
        <select
          value={rect.zone}
          onChange={(e) => {
            const z = ZONE_PRESETS.find((x) => x.id === e.target.value);
            set(z ? { zone: z.id, color: z.color } : { zone: e.target.value });
          }}
          className={inputCls}
        >
          {ZONE_PRESETS.map((z) => (
            <option key={z.id} value={z.id}>
              {z.label}
            </option>
          ))}
          {!ZONE_PRESETS.some((z) => z.id === rect.zone) && (
            <option value={rect.zone}>{rect.zone}</option>
          )}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <NumField label="X (m)" value={rect.x} step={step} onChange={(v) => set({ x: v })} />
        <NumField label="Y (m)" value={rect.y} step={step} onChange={(v) => set({ y: v })} />
        <NumField label="Ancho (m)" value={rect.w} step={step} min={0.1} onChange={(v) => set({ w: v })} />
        <NumField label="Alto (m)" value={rect.h} step={step} min={0.1} onChange={(v) => set({ h: v })} />
      </div>

      <Field label="Color">
        <div className="flex flex-wrap items-center gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => set({ color: c })}
              className={cn(
                "h-6 w-6 rounded-md border-2",
                rect.color.toLowerCase() === c ? "border-white" : "border-transparent",
              )}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={rect.color}
            onChange={(e) => set({ color: e.target.value })}
            className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent"
          />
        </div>
      </Field>

      <p className="text-[11px] text-slate-500">Área: {fmtArea(rect.w * rect.h)}</p>

      <Field label="Notas">
        <textarea
          value={rect.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
          rows={2}
          className={cn(inputCls, "resize-y")}
        />
      </Field>
    </>
  );
}

function MachineProps({
  machine,
  objects,
  step,
  onUpdate,
  onFocus,
}: {
  machine: PlanMachine;
  objects: PlanObject[];
  step: number;
  onUpdate: (id: string, patch: Patch) => void;
  onFocus: (id: string) => void;
}) {
  const set = (patch: Patch) => onUpdate(machine.id, patch);
  const cat = CATALOG_BY_ID[machine.catalogId];
  const catMeta = cat ? CATEGORY_META[cat.category] : null;
  const zone = zoneOfMachine(machine, objects);

  return (
    <>
      <div className="flex items-center gap-2">
        {catMeta && (
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: catMeta.color + "22", color: catMeta.color }}
          >
            {catMeta.label}
          </span>
        )}
        <button
          onClick={() => onFocus(machine.id)}
          className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-cyan-300"
        >
          <Crosshair className="h-3.5 w-3.5" /> Centrar
        </button>
      </div>

      <Field label="Nombre">
        <input value={machine.label} onChange={(e) => set({ label: e.target.value })} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Activo / ID">
          <input
            value={machine.assetTag}
            onChange={(e) => set({ assetTag: e.target.value })}
            className={cn(inputCls, "font-mono")}
          />
        </Field>
        <Field label="Marca">
          <input value={machine.brand ?? ""} onChange={(e) => set({ brand: e.target.value })} className={inputCls} />
        </Field>
      </div>

      <Field label="Estado">
        <div className="flex gap-1">
          {STATUS_ORDER.map((s) => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => set({ status: s })}
                className={cn(
                  "flex-1 rounded-md border py-1 text-[11px] font-medium transition",
                  machine.status === s ? "text-white" : "border-white/10 text-slate-400 hover:border-white/30",
                )}
                style={
                  machine.status === s
                    ? { borderColor: m.color, background: m.color + "22", color: m.color }
                    : undefined
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <NumField label="X centro (m)" value={machine.x} step={step} onChange={(v) => set({ x: v })} />
        <NumField label="Y centro (m)" value={machine.y} step={step} onChange={(v) => set({ y: v })} />
        <NumField label="Ancho (m)" value={machine.w} step={0.1} min={0.1} onChange={(v) => set({ w: v })} />
        <NumField label="Fondo (m)" value={machine.h} step={0.1} min={0.1} onChange={(v) => set({ h: v })} />
      </div>

      <Field label="Rotación">
        <div className="flex items-center gap-2">
          <button
            onClick={() => set({ rotation: norm(machine.rotation - 90) })}
            className="grid h-8 w-8 place-items-center rounded-md border border-white/15 text-slate-300 hover:border-white/35"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={Math.round(machine.rotation)}
            step={15}
            onChange={(e) => set({ rotation: norm(Number(e.target.value) || 0) })}
            className={cn(inputCls, "w-20 text-center")}
          />
          <span className="text-[12px] text-slate-500">°</span>
          <button
            onClick={() => set({ rotation: norm(machine.rotation + 90) })}
            className="grid h-8 w-8 place-items-center rounded-md border border-white/15 text-slate-300 hover:border-white/35"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Último servicio">
          <input
            type="date"
            value={machine.lastService ?? ""}
            onChange={(e) => set({ lastService: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Zona (auto)">
          <div className="flex h-[30px] items-center rounded-md border border-white/10 px-2 text-[12px] text-slate-400">
            {zone ?? "—"}
          </div>
        </Field>
      </div>

      <Field label="Notas">
        <textarea
          value={machine.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
          rows={2}
          className={cn(inputCls, "resize-y")}
        />
      </Field>
    </>
  );
}

// ───────────────────────────────────────────────
// Inventory
// ───────────────────────────────────────────────
function InventoryTab({
  objects,
  selectedId,
  onFocus,
  onUpdate,
  onExportCSV,
}: {
  objects: PlanObject[];
  selectedId: string | null;
  onFocus: (id: string) => void;
  onUpdate: (id: string, patch: Patch) => void;
  onExportCSV: () => void;
}) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Set<Category>>(new Set());
  const [stats, setStats] = useState<Set<MachineStatus>>(new Set());

  const machines = useMemo(
    () => objects.filter((o): o is PlanMachine => o.kind === "machine"),
    [objects],
  );

  const summary = useMemo(() => {
    const by = { ok: 0, maintenance: 0, down: 0 } as Record<MachineStatus, number>;
    for (const m of machines) by[m.status]++;
    const perim = objects
      .filter((o): o is PlanRect => o.kind === "rect")
      .sort((a, b) => b.w * b.h - a.w * a.h)[0];
    const area = perim ? perim.w * perim.h : 0;
    return { total: machines.length, by, area, density: machines.length ? area / machines.length : 0 };
  }, [machines, objects]);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return machines
      .map((m) => {
        const cat = CATALOG_BY_ID[m.catalogId];
        return { m, category: cat?.category as Category | undefined, zone: zoneOfMachine(m, objects) };
      })
      .filter(({ m, category }) => {
        if (cats.size && (!category || !cats.has(category))) return false;
        if (stats.size && !stats.has(m.status)) return false;
        if (
          query &&
          !`${m.assetTag} ${m.label} ${m.brand ?? ""}`.toLowerCase().includes(query)
        )
          return false;
        return true;
      })
      .sort((a, b) => a.m.assetTag.localeCompare(b.m.assetTag, "es", { numeric: true }));
  }, [machines, objects, q, cats, stats]);

  const toggle = <T,>(set: React.Dispatch<React.SetStateAction<Set<T>>>, v: T) =>
    set((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-2 gap-2 p-3">
        <Stat label="Máquinas" value={summary.total} />
        <Stat label="m² / máquina" value={summary.density ? summary.density.toFixed(1) : "—"} />
        {STATUS_ORDER.map((s) => (
          <Stat
            key={s}
            label={STATUS_META[s].label}
            value={summary.by[s]}
            color={STATUS_META[s].color}
          />
        ))}
        <Stat label="Área (piso)" value={summary.area ? fmtArea(summary.area) : "—"} />
      </div>

      <div className="space-y-2 border-y border-white/10 px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por activo, nombre o marca…"
          className={inputCls}
        />
        <div className="flex flex-wrap gap-1">
          {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
            <FilterChip
              key={c}
              active={cats.has(c)}
              color={CATEGORY_META[c].color}
              onClick={() => toggle(setCats, c)}
            >
              {CATEGORY_META[c].label}
            </FilterChip>
          ))}
          {STATUS_ORDER.map((s) => (
            <FilterChip
              key={s}
              active={stats.has(s)}
              color={STATUS_META[s].color}
              onClick={() => toggle(setStats, s)}
            >
              {STATUS_META[s].label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-[12px] text-slate-500">
            {machines.length === 0 ? "Todavía no hay máquinas en el plano." : "Ningún resultado con esos filtros."}
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {rows.map(({ m, category, zone }) => {
              const meta = category ? CATEGORY_META[category] : null;
              const st = STATUS_META[m.status];
              return (
                <li
                  key={m.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-3 py-2 transition hover:bg-white/[0.04]",
                    selectedId === m.id && "bg-cyan-400/10",
                  )}
                  onClick={() => onFocus(m.id)}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: meta?.color ?? "#94a3b8" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-slate-400">{m.assetTag || "—"}</span>
                      <span className="truncate text-[12px] text-slate-200">{m.label}</span>
                    </span>
                    <span className="block truncate text-[10.5px] text-slate-500">
                      {fmtM(m.w)} × {fmtM(m.h)}
                      {zone ? ` · ${zone}` : ""}
                    </span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const order = STATUS_ORDER;
                      const next = order[(order.indexOf(m.status) + 1) % order.length];
                      onUpdate(m.id, { status: next });
                    }}
                    title="Cambiar estado"
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: st.color + "22", color: st.color }}
                  >
                    {st.short}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 p-2">
        <button
          onClick={onExportCSV}
          disabled={machines.length === 0}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 py-1.5 text-[12px] text-slate-200 transition hover:border-white/35 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Exportar inventario (CSV)
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// bits
// ───────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-white/12 bg-white/[0.03] px-2 py-1.5 text-[12px] text-slate-200 focus:border-cyan-400/60 focus:outline-none";

const SWATCHES = [
  "#94a3b8",
  "#38bdf8",
  "#a78bfa",
  "#fb923c",
  "#34d399",
  "#2dd4bf",
  "#c084fc",
  "#f472b6",
  "#facc15",
  "#fca5a5",
];

const norm = (d: number) => ((Math.round(d) % 360) + 360) % 360;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 0.5,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={draft ?? round(value)}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n) && (min == null || n >= min)) onChange(n);
        }}
        onBlur={() => setDraft(null)}
        className={inputCls}
      />
    </Field>
  );
}

const round = (v: number) => Math.round(v * 100) / 100;

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 border-b-2 px-3 py-2 text-[12px] font-semibold transition",
        active
          ? "border-cyan-400 text-white"
          : "border-transparent text-slate-400 hover:text-slate-200",
      )}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
      <div
        className="font-[family-name:var(--font-bricolage)] text-lg font-extrabold tabular-nums"
        style={{ color: color ?? "#e5edff" }}
      >
        {value}
      </div>
      <div className="text-[9.5px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-1.5 py-0.5 text-[10px] transition",
        active ? "text-white" : "border-white/10 text-slate-400 hover:border-white/30",
      )}
      style={active ? { borderColor: color, background: color + "22", color } : undefined}
    >
      {children}
    </button>
  );
}

export const Inspector = memo(InspectorBase);
