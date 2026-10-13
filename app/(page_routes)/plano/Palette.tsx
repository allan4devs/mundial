"use client";

import { memo, useMemo, useState } from "react";
import {
  Bike,
  Dumbbell,
  HeartPulse,
  MousePointer2,
  Hand,
  Search,
  Square,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/helpers/utils";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  MACHINE_CATALOG,
  ZONE_PRESETS,
} from "./catalog";
import type { Category, Tool } from "./types";

const CAT_ICON: Record<Category, typeof Dumbbell> = {
  cardio: HeartPulse,
  strength: Dumbbell,
  freeweights: Dumbbell,
  functional: Sparkles,
  amenities: LayoutGrid,
};

interface Props {
  tool: Tool;
  pendingCatalogId: string | null;
  rectZoneId: string;
  onTool: (t: Tool) => void;
  onPickMachine: (catalogId: string) => void;
  onPickZone: (zoneId: string) => void;
}

function PaletteBase(p: Props) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: MACHINE_CATALOG.filter(
        (m) =>
          m.category === cat &&
          (!query ||
            m.label.toLowerCase().includes(query) ||
            m.code.toLowerCase().includes(query)),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* tools */}
      <div className="flex gap-1 border-b border-white/10 p-2">
        <ToolBtn active={p.tool === "select"} label="Seleccionar" hint="V" onClick={() => p.onTool("select")}>
          <MousePointer2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={p.tool === "pan"} label="Mano / paneo" hint="H · espacio" onClick={() => p.onTool("pan")}>
          <Hand className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={p.tool === "rect"} label="Dibujar cuadro" hint="B" onClick={() => p.onTool("rect")}>
          <Square className="h-4 w-4" />
        </ToolBtn>
      </div>

      {/* zone presets (only meaningful with the rect tool) */}
      <div className={cn("border-b border-white/10 p-2 transition", p.tool === "rect" ? "opacity-100" : "opacity-45")}>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Cuadro · tipo de zona
        </p>
        <div className="flex flex-wrap gap-1">
          {ZONE_PRESETS.map((z) => (
            <button
              key={z.id}
              onClick={() => p.onPickZone(z.id)}
              className={cn(
                "flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10.5px] transition",
                p.rectZoneId === z.id
                  ? "border-cyan-400/70 bg-cyan-400/10 text-white"
                  : "border-white/10 text-slate-300 hover:border-white/30",
              )}
            >
              <span className="h-2 w-2 rounded-[3px]" style={{ background: z.color }} />
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* machine catalog */}
      <div className="flex items-center gap-2 border-b border-white/10 px-2 py-1.5">
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar máquina…"
          className="w-full bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {groups.length === 0 && (
          <p className="px-1 py-6 text-center text-[12px] text-slate-500">Sin resultados.</p>
        )}
        {groups.map((g) => {
          const meta = CATEGORY_META[g.cat];
          const Icon = CAT_ICON[g.cat];
          return (
            <div key={g.cat} className="mb-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {meta.label}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {g.items.map((m) => {
                  const active = p.tool === "machine" && p.pendingCatalogId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => p.onPickMachine(m.id)}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition",
                        active
                          ? "border-cyan-400/70 bg-cyan-400/10"
                          : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]",
                      )}
                    >
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
                        style={{ background: meta.color + "1f", color: meta.color }}
                      >
                        <Bike className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] text-slate-200">{m.label}</span>
                        <span className="block text-[10px] tabular-nums text-slate-500">
                          {m.w} × {m.h} m · {m.code}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToolBtn({
  active,
  label,
  hint,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  hint: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} · ${hint}`}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-1.5 transition",
        active
          ? "border-cyan-400/70 bg-cyan-400/10 text-white"
          : "border-white/10 text-slate-300 hover:border-white/30 hover:text-white",
      )}
    >
      {children}
      <span className="text-[9px] uppercase tracking-wide text-slate-500">{hint.split(" ")[0]}</span>
    </button>
  );
}

export const Palette = memo(PaletteBase);
