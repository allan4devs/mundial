"use client";

import { useMemo, useState } from "react";
import { ChevronsDown, ChevronsUp, Eye } from "lucide-react";
import RotuloCard from "./RotuloCard";
import type { Lang, Rotulo } from "./types";

type RotulosDisclosureListProps = {
  rotulos: Rotulo[];
  selected: number[];
  lang: Lang;
  onToggleSelected: (id: number) => void;
  price: (crc: number) => string;
  t: (es: string, en: string) => string;
};

export default function RotulosDisclosureList({
  rotulos,
  selected,
  lang,
  onToggleSelected,
  price,
  t,
}: RotulosDisclosureListProps) {
  const [expandedIds, setExpandedIds] = useState<number[]>(() => rotulos.map((rotulo) => rotulo.id));
  const allIds = useMemo(() => rotulos.map((rotulo) => rotulo.id), [rotulos]);
  const allExpanded = expandedIds.length === allIds.length;

  const toggleExpanded = (id: number) => {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].sort((a, b) => a - b),
    );
  };

  return (
    <section id="catalogo-rotulos" aria-labelledby="catalogo-rotulos-title" className="mt-12 scroll-mt-24 xl:mt-24 print:mt-0">
      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-zinc-900/45 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between xl:rounded-[2.5rem] xl:p-10 2xl:p-12 print:hidden">
        <div className="max-w-4xl">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#65e2d5]">
            {t("Plan vial actualizado", "Updated road-sign plan")}
          </p>
          <h1
            id="catalogo-rotulos-title"
            className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl xl:text-5xl"
          >
            {t("Doce rótulos, tres tamaños, de la carretera al mirador", "Twelve signs, three sizes, from the road to the viewpoint")}
          </h1>
          <p className="mt-3 text-sm font-bold leading-relaxed text-zinc-300 sm:text-base">
            {t(
              "1 principal · 3 × 2 m · 2 alertas cercanas · 2 × 1 m · 4 señales de aproximación · 1 × 1 m · 1 parqueo · 2 × 1 m · 4 señales internas · 1 × 1 m",
              "1 main sign · 3 × 2 m · 2 near-entry alerts · 2 × 1 m · 4 approach signs · 1 × 1 m · 1 parking sign · 2 × 1 m · 4 internal wayfinding signs · 1 × 1 m",
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExpandedIds(allIds)}
            disabled={allExpanded}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#00C4B0]/45 bg-[#00C4B0]/10 px-4 text-sm font-black text-[#9ff5eb] transition hover:bg-[#00C4B0]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronsDown className="h-4 w-4" aria-hidden />
            {t("Ver todos", "View all")}
          </button>
          <button
            type="button"
            onClick={() => setExpandedIds([])}
            disabled={expandedIds.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-black text-zinc-200 transition hover:border-[#00C4B0]/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronsUp className="h-4 w-4" aria-hidden />
            {t("Cerrar todos", "Close all")}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1 text-xs font-bold text-zinc-400 xl:mt-8 xl:text-sm print:hidden" aria-live="polite">
        <span className="inline-flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#00C4B0]" aria-hidden />
          {expandedIds.length} {t("abiertos de", "open of")} {rotulos.length}
        </span>
        <span>
          {selected.length} {t("fichas incluidas en el cálculo", "records included in calculation")}
        </span>
      </div>

      <div className="mt-10 grid gap-16 xl:mt-16 xl:gap-24 2xl:gap-32 print:mt-0 print:block">
        {rotulos.map((rotulo) => {
          const expanded = expandedIds.includes(rotulo.id);
          return (
            <RotuloCard
              key={rotulo.id}
              rotulo={rotulo}
              lang={lang}
              active={selected.includes(rotulo.id)}
              onToggle={onToggleSelected}
              expanded={expanded}
              onToggleExpanded={toggleExpanded}
              price={price}
              t={t}
              eager={expanded}
            />
          );
        })}
      </div>
    </section>
  );
}
