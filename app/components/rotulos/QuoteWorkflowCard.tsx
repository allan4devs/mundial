"use client";

import Link from "next/link";
import { ArrowRight, Building2, Calculator, FileCheck2 } from "lucide-react";
import type { Lang } from "./types";

type QuoteWorkflowCardProps = {
  lang: Lang;
  t: (es: string, en: string) => string;
  href?: string;
};

/** Acceso corto al expediente de compra, separado de la galería de diseños. */
export default function QuoteWorkflowCard({
  lang,
  t,
  href = "/rotulos/cotizacion",
}: QuoteWorkflowCardProps) {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-[#00C4B0]/35 bg-[#00C4B0]/10 shadow-xl shadow-black/20">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#00C4B0]/45 bg-[#00C4B0]/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9ff5eb]">
              {t("Cotización para aprobación", "Quote for approval")}
            </span>
            <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-[11px] font-black text-amber-100">
              {t("Faltan 3 cotizaciones comparables", "3 comparable quotes required")}
            </span>
          </div>

          <h2 className="mt-4 max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl">
            {t(
              "Calcule cuántos rótulos caben en ₡300.000 y compare tres empresas",
              "Calculate how many signs fit within ₡300,000 and compare three companies",
            )}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            {t(
              "Las estimaciones de esta página sirven solo para planificar. En el comparador, el presupuesto, las cantidades y el alcance se definen una vez; después cada empresa se evalúa con su cotización real, sin extrapolar precios ni declarar una ganadora antes de tener las tres ofertas.",
              "This page's estimates are for planning only. In the comparator, the budget, quantities and scope are set once; each company is then evaluated using its actual quote, without extrapolating prices or naming a winner before all three offers are available.",
            )}
          </p>

          <div className="mt-5 grid gap-3 text-sm text-zinc-200 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/15 p-3">
              <Calculator className="h-5 w-5 shrink-0 text-[#00C4B0]" aria-hidden />
              <span>{t("Presupuesto X editable", "Editable budget")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/15 p-3">
              <Building2 className="h-5 w-5 shrink-0 text-[#00C4B0]" aria-hidden />
              <span>{t("3 empresas distintas", "3 different companies")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/15 p-3">
              <FileCheck2 className="h-5 w-5 shrink-0 text-[#00C4B0]" aria-hidden />
              <span>{t("Resumen para imprimir", "Printable decision summary")}</span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-400">
            {lang === "es"
              ? "La referencia cargada de FC Rótulos todavía es preliminar: faltan documento, alcance y precios finales por tamaño para que cuente como cotización comparable."
              : "The FC Rótulos reference currently loaded is preliminary: its document, scope and final prices by size are still required before it counts as a comparable quote."}
          </p>
        </div>

        <Link
          href={href}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00C4B0] px-6 py-3 text-sm font-black text-[#2E2A25] transition hover:bg-[#35d7c6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00C4B0]"
        >
          {t("Abrir comparador", "Open comparator")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
