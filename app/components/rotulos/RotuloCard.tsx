"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  LayoutPanelTop,
  MapPin,
  Ruler,
  SquareDashed,
  X,
} from "lucide-react";
import EntranceSignPanel from "./EntranceSignPanel";
import SignLayoutEditor from "./layout-editor/SignLayoutEditor";
import SignPanel from "./SignPanel";
import { KIND_META } from "./constants";
import { IVA_RATE, signSubtotal, signSubtotalBreakdown } from "./helpers";
import {
  formatAreaM2,
  panelMeasurementCentimeters,
  panelMeasurementLabel,
  PANEL_SIZE_SPECS,
  rotuloMeasurementSummary,
  rotuloTotalAreaM2,
} from "./measurements";
import type { Lang, Rotulo } from "./types";

type RotuloCardProps = {
  rotulo: Rotulo;
  lang: Lang;
  /** Si está incluido en el cálculo; no controla si el diseño está abierto. */
  active: boolean;
  onToggle: (id: number) => void;
  expanded: boolean;
  onToggleExpanded: (id: number) => void;
  price: (crc: number) => string;
  t: (es: string, en: string) => string;
  eager?: boolean;
};

/** Resumen compacto + maqueta desplegable de un punto de señalización. */
export default function RotuloCard({
  rotulo,
  lang,
  active,
  onToggle,
  expanded,
  onToggleExpanded,
  price,
  t,
  eager,
}: RotuloCardProps) {
  const meta = KIND_META[rotulo.kind];
  const Icon = meta.icon;
  const subtotal = signSubtotal(rotulo);
  const breakdown = signSubtotalBreakdown(rotulo);
  const ivaPct = Math.round(IVA_RATE * 100);
  const areaM2 = rotuloTotalAreaM2(rotulo);
  const headingId = `rotulo-${rotulo.code.toLowerCase()}-heading`;
  const regionId = `rotulo-${rotulo.code.toLowerCase()}-details`;

  return (
    <article
      data-rotulo-card
      className={`overflow-hidden rounded-3xl border shadow-xl shadow-black/30 transition-colors xl:rounded-[2.75rem] print:mb-0 print:break-after-page print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none ${
        active
          ? "border-[#00C4B0]/35 bg-zinc-900/70"
          : "border-white/10 bg-zinc-900/35"
      }`}
    >
      <div className="p-4 sm:p-5 xl:p-8 2xl:p-10 print:hidden">
        <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#65e2d5]">
                {rotulo.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.tone}`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {meta.label[lang]}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${
                  active
                    ? "border-[#00C4B0]/35 bg-[#00C4B0]/10 text-[#9ff5eb]"
                    : "border-zinc-500/50 bg-white/5 text-zinc-300"
                }`}
              >
                {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                {active ? t("Incluido", "Included") : t("Excluido", "Excluded")}
              </span>
            </div>

            <h3
              id={headingId}
              className="mt-3 text-2xl font-black tracking-[-0.035em] text-white sm:text-3xl xl:text-4xl"
            >
              {rotulo.name}
            </h3>
            <p className="mt-3 flex items-start gap-2 text-sm text-zinc-300 sm:text-base xl:text-lg">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00C4B0]" aria-hidden />
              {rotulo.placement[lang]}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto] xl:items-center 2xl:mt-6 2xl:gap-4">
              <div className="rounded-2xl border border-[#00C4B0]/25 bg-[#00C4B0]/10 p-3 xl:p-4">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#65e2d5]">
                  <Ruler className="h-4 w-4" aria-hidden />
                  {t("Medida de trabajo · ancho × alto", "Working size · width × height")}
                </p>
                <p className="mt-1 text-base font-black leading-snug text-white sm:text-lg">
                  {rotuloMeasurementSummary(rotulo, lang)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 xl:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                  {t("Cantidad", "Quantity")}
                </p>
                <p className="mt-1 flex items-center gap-2 font-black text-white">
                  <LayoutPanelTop className="h-4 w-4 text-[#00C4B0]" aria-hidden />
                  {rotulo.panels.length} {rotulo.panels.length === 1 ? t("lámina", "panel") : t("láminas", "panels")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 xl:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                  {t("Área total", "Total area")}
                </p>
                <p className="mt-1 font-black text-white">{formatAreaM2(areaM2, lang)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 xl:p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                  {t("Estimación interna", "Internal estimate")}
                </p>
                <p className="mt-1 font-black text-white">{price(subtotal)}</p>
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  {price(breakdown.base)} + {ivaPct}% {t("IVA", "tax")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row 2xl:flex-col">
            <button
              type="button"
              onClick={() => onToggle(rotulo.id)}
              aria-pressed={active}
              aria-label={
                active
                  ? t(`Excluir ${rotulo.code} del cálculo`, `Exclude ${rotulo.code} from calculation`)
                  : t(`Incluir ${rotulo.code} en el cálculo`, `Include ${rotulo.code} in calculation`)
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-black text-zinc-200 transition hover:border-[#00C4B0]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0]"
            >
              {active ? <Check className="h-4 w-4" aria-hidden /> : <SquareDashed className="h-4 w-4" aria-hidden />}
              {active ? t("Quitar del cálculo", "Remove from calculation") : t("Incluir en cálculo", "Include in calculation")}
            </button>
            <button
              type="button"
              onClick={() => onToggleExpanded(rotulo.id)}
              aria-expanded={expanded}
              aria-controls={regionId}
              aria-label={
                expanded
                  ? t(`Ocultar ${rotulo.code}: ${rotulo.name}`, `Hide ${rotulo.code}: ${rotulo.name}`)
                  : t(`Ver ${rotulo.code}: ${rotulo.name}`, `View ${rotulo.code}: ${rotulo.name}`)
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#00C4B0] px-5 text-sm font-black text-[#2E2A25] transition hover:bg-[#35d7c6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00C4B0]"
            >
              {expanded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
              {expanded ? t("Ocultar rótulo", "Hide sign") : t("Ver rótulo", "View sign")}
            </button>
          </div>
        </div>
      </div>

      <div
        id={regionId}
        role="region"
        aria-labelledby={headingId}
        aria-hidden={!expanded}
        className={`${expanded ? "block" : "hidden"} border-t border-white/10 print:block print:border-0`}
      >
        <div className="grid gap-8 p-3 sm:p-6 lg:p-8 xl:gap-12 xl:p-12 2xl:p-16 print:block print:p-0">
          <SignLayoutEditor signId={rotulo.code} signLabel={rotulo.name} lang={lang} className="min-w-0">
            <div
              className={`mx-auto w-full max-w-[1680px] min-w-0 rounded-[2rem] border border-white/[0.06] bg-zinc-950/55 p-2 sm:p-4 xl:rounded-[2.5rem] xl:p-8 2xl:p-12 print:max-w-none print:border-0 print:bg-transparent print:p-0 ${
                rotulo.panels.length > 1
                  ? "grid gap-8 2xl:grid-cols-2 2xl:gap-12 print:grid print:grid-cols-2"
                  : "flex flex-col"
              }`}
            >
              {rotulo.panels.map((panel, index) =>
                rotulo.kind === "entrada" ? (
                  <EntranceSignPanel key={`${rotulo.id}-${index}`} panel={panel} eager={eager} />
                ) : (
                  <SignPanel
                    key={`${rotulo.id}-${index}`}
                    panel={panel}
                    kind={rotulo.kind}
                    large={panel.size === "grande"}
                    eager={eager}
                  />
                ),
              )}
            </div>
          </SignLayoutEditor>

          <div className="hidden pt-3 text-center print:block">
            <p className="text-[9pt] font-black leading-snug text-[#2E2A25]">
              {rotulo.code} · {rotulo.name} ·{" "}
              {rotulo.panels
                .map((panel, index) => {
                  const spec = PANEL_SIZE_SPECS[panel.size];
                  const prefix =
                    rotulo.panels.length > 1
                      ? `${panel.kicker || `${t("Lámina", "Panel")} ${index + 1}`} `
                      : "";
                  return `${prefix}${spec.widthM} × ${spec.heightM} m (${panelMeasurementCentimeters(panel)})`;
                })
                .join(" · ")}
            </p>
            <p className="mt-0.5 text-[8pt] font-bold leading-snug text-[#2E2A25]/70">
              {t("Propuesta visual; confirme medidas y originales antes de fabricar.", "Visual proposal; confirm dimensions and source files before production.")}
            </p>
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-6 print:hidden">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 xl:rounded-3xl xl:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#65e2d5]">
                {t("Función del rótulo", "Purpose of the sign")}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300 xl:text-base">{rotulo.purpose[lang]}</p>
            </div>

            <div className="rounded-2xl border border-[#00C4B0]/30 bg-[#00C4B0]/10 p-5 xl:rounded-3xl xl:p-6">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-[#9ff5eb]">
                <Ruler className="h-4 w-4" aria-hidden />
                {t("Ficha de medidas", "Measurement sheet")}
              </p>
              <ul className="mt-4 space-y-3">
                {rotulo.panels.map((panel, index) => {
                  const spec = PANEL_SIZE_SPECS[panel.size];
                  return (
                    <li key={`${rotulo.id}-measure-${index}`} className="border-t border-white/10 pt-3 first:border-0 first:pt-0">
                      <p className="text-sm font-black text-white">
                        {panel.kicker || `${t("Lámina", "Panel")} ${index + 1}`} · {spec.label[lang]}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-relaxed text-[#c7faf5]">
                        {panelMeasurementLabel(panel, lang)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">{panelMeasurementCentimeters(panel)}</p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed text-zinc-400">
                {t(
                  "Medida propuesta para cotizar. Confirme material, estructura, sitio y medida final antes de producir.",
                  "Proposed quoting size. Confirm material, structure, site and final size before production.",
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 xl:rounded-3xl xl:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#65e2d5]">
                {t("Frase de calle", "Street hook")}
              </p>
              <ul className="mt-3 space-y-3 text-sm text-zinc-200 xl:text-base">
                {rotulo.panels.map((panel, index) => (
                  <li key={`${rotulo.id}-cta-${index}`} className="flex gap-2">
                    <span className="text-[#00C4B0]">→</span>
                    <span>
                      {panel.cta.es}
                      <span className="block text-xs italic text-zinc-400">{panel.cta.en}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 xl:rounded-3xl xl:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                {t("Estimación interna por área", "Internal area estimate")}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                {rotulo.panels.length > 1
                  ? rotulo.panels.map((panel) => price(panel.price)).join(" + ")
                  : t("Cálculo de planificación; no es una cotización final", "Planning calculation; not a final quote")}
              </p>
              <p className="mt-2 text-xs font-bold text-[#9ff5eb]">
                {price(breakdown.base)} + {ivaPct}% {t("IVA", "tax")} ({price(breakdown.iva)})
              </p>
              <p className="mt-auto pt-6 text-3xl font-black tracking-tight text-white xl:text-4xl">{price(subtotal)}</p>
            </div>
          </div>

          <p className="text-center text-[11px] leading-relaxed text-zinc-500 xl:text-xs print:hidden">
            {t(
              "En escritorio extra ancho e impresión, la maqueta adopta la proporción de trabajo. Confirme medidas y archivos originales de alta resolución antes de fabricar.",
              "On extra-wide displays and in print, the mockup uses the working proportion. Confirm dimensions and high-resolution source files before production.",
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
