"use client";

import { useState } from "react";
import { formatCRC } from "../helpers";
import { MENU_SECTIONS } from "../menu-data";
import { buildCatalog } from "./helpers";
import type { Lang } from "../types";
import type { PosProduct } from "./types";

/** El catálogo no depende de nada: se arma una sola vez al cargar el módulo. */
const CATALOG = buildCatalog();

/**
 * Los productos, agrupados por la misma familia que usa el menú de pared.
 * Botones grandes: esto se toca con el dedo y con prisa.
 */
export default function ProductGrid({
  lang,
  onAdd,
}: {
  lang: Lang;
  onAdd: (product: PosProduct) => void;
}) {
  const [sectionId, setSectionId] = useState(MENU_SECTIONS[0].id);

  const shown = CATALOG.filter((product) => product.sectionId === sectionId);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex gap-2 overflow-x-auto pb-3">
        {MENU_SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = section.id === sectionId;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setSectionId(section.id)}
              aria-pressed={active}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black transition ${
                active
                  ? "border-[#00C4B0] bg-[#00C4B0] text-[#0E2B27]"
                  : "border-white/15 bg-white/5 text-white/70 hover:border-[#00C4B0]/50 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {section.title[lang]}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
        {shown.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onAdd(product)}
            className="flex min-h-[6.5rem] flex-col justify-between rounded-2xl border border-white/12 bg-[#2E2A25]/70 p-3.5 text-left transition hover:border-[#00C4B0]/60 hover:bg-[#2E2A25] active:scale-[0.98]"
          >
            <div className="min-w-0">
              <p className="font-display text-sm font-black uppercase leading-[1.1] tracking-tight text-white">
                {product.name[lang]}
              </p>
              {product.variant ? (
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#76EBDE]">
                  {product.variant[lang]}
                </p>
              ) : null}
            </div>
            <p className="mt-3 font-display text-lg font-black tracking-tight text-[#F3A712]">
              {formatCRC(product.price)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
