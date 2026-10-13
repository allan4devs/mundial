import { Check, LayoutPanelTop, X } from "lucide-react";
import { BUSINESS, KIND_META } from "./constants";
import { IVA_RATE, selectionBreakdown, signSubtotal } from "./helpers";
import {
  formatAreaM2,
  PANEL_SIZE_ORDER,
  PANEL_SIZE_SPECS,
  planMeasurementStats,
  rotuloTotalAreaM2,
} from "./measurements";
import type { Lang, PanelSizeKey, Rotulo } from "./types";

type RotulosSummaryTableProps = {
  rotulos: Rotulo[];
  selected: number[];
  lang: Lang;
  price: (crc: number) => string;
  t: (es: string, en: string) => string;
};

/** Tamaños distintos de un rótulo, en orden grande → mediano → pequeño. */
function sizesOf(rotulo: Rotulo) {
  const counts = rotulo.panels.reduce<Partial<Record<PanelSizeKey, number>>>((acc, panel) => {
    acc[panel.size] = (acc[panel.size] ?? 0) + 1;
    return acc;
  }, {});
  return PANEL_SIZE_ORDER.filter((key) => counts[key]).map((key) => ({ key, count: counts[key]! }));
}

/** Etiqueta corta de tamaño: "Grande" o "2 × Mediano" si hay más de una lámina igual. */
function sizeLabel(rotulo: Rotulo, lang: Lang) {
  return sizesOf(rotulo)
    .map(({ key, count }) => {
      const label = PANEL_SIZE_SPECS[key].label[lang];
      return count > 1 ? `${count} × ${label}` : label;
    })
    .join(" · ");
}

/** Medida de trabajo por tamaño: "3 × 2 m" (ancho × alto), sin repetir tamaños iguales. */
function measureLabel(rotulo: Rotulo) {
  return sizesOf(rotulo)
    .map(({ key }) => {
      const spec = PANEL_SIZE_SPECS[key];
      return `${spec.widthM} × ${spec.heightM} m`;
    })
    .join(" + ");
}

/** Tabla de cierre: un rótulo por fila, con su tamaño, tipo, elementos, medida y costo previsto. */
export default function RotulosSummaryTable({
  rotulos,
  selected,
  lang,
  price,
  t,
}: RotulosSummaryTableProps) {
  const breakdown = selectionBreakdown(rotulos, selected);
  const stats = planMeasurementStats(rotulos.filter((rotulo) => selected.includes(rotulo.id)));
  const ivaPct = Math.round(IVA_RATE * 100);

  const today = new Intl.DateTimeFormat(lang === "es" ? "es-CR" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <section aria-labelledby="rotulos-tabla-title" className="mt-4 print:break-after-page">
      <h2 id="rotulos-tabla-title" className="sr-only">
        {t("Tabla resumen de rótulos", "Signs summary table")}
      </h2>

      <div className="hidden print:mb-6 print:block">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-black/60">{BUSINESS.name}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-black">
          {t("Solicitud de cotización · Especificaciones de rótulos", "Quote request · Sign specifications")}
        </h1>
        <p className="mt-1 text-xs text-black/70">
          {BUSINESS.place} · {BUSINESS.web} · {BUSINESS.whatsapp} · {today}
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-black/80">
          {t(
            "Por favor cotice cada rótulo según el tamaño, tipo, elementos y medida indicados abajo. Escriba su precio en la columna \"Precio del proveedor\" y el total ofertado al final de la tabla. El costo previsto es solo una referencia interna, no un precio a igualar.",
            "Please quote each sign per the size, type, elements, and measurements below. Write your price in the \"Vendor price\" column and your total quote at the bottom of the table. The projected cost is only an internal reference, not a price to match.",
          )}
        </p>
      </div>

      <div className="space-y-3 sm:hidden print:hidden">
        {rotulos.map((rotulo) => {
          const included = selected.includes(rotulo.id);
          const meta = KIND_META[rotulo.kind];
          const Icon = meta.icon;
          return (
            <article
              key={rotulo.id}
              className={`rounded-2xl border p-4 ${
                included
                  ? "border-[#00C4B0]/30 bg-[#00C4B0]/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#65e2d5]">
                    {rotulo.code}
                  </p>
                  <h3 className="mt-1 font-black text-white">{rotulo.name}</h3>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-black ${included ? "text-[#9ff5eb]" : "text-zinc-500"}`}>
                  {included ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                  {included ? t("Incluido", "Included") : t("Excluido", "Excluded")}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-black uppercase tracking-[0.12em] text-zinc-500">{t("Tamaño", "Size")}</p>
                  <p className="mt-0.5 font-bold text-zinc-200">{sizeLabel(rotulo, lang)}</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.12em] text-zinc-500">{t("Tipo", "Type")}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 font-bold text-zinc-200">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[#00C4B0]" aria-hidden />
                    {meta.label[lang]}
                  </p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.12em] text-zinc-500">{t("Elementos", "Elements")}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 font-bold text-zinc-200">
                    <LayoutPanelTop className="h-3.5 w-3.5 shrink-0 text-[#00C4B0]" aria-hidden />
                    {rotulo.panels.length} {rotulo.panels.length === 1 ? t("lámina", "panel") : t("láminas", "panels")}
                  </p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.12em] text-zinc-500">{t("Medida", "Measure")}</p>
                  <p className="mt-0.5 font-bold text-zinc-200">
                    {measureLabel(rotulo)} · {formatAreaM2(rotuloTotalAreaM2(rotulo), lang)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                  {t("Costo previsto", "Projected cost")}
                </p>
                <p className="font-black text-white">{price(signSubtotal(rotulo))}</p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">
                  {t("Precio del proveedor", "Vendor price")}
                </p>
                <span className="h-5 w-28 border-b border-dashed border-zinc-500" aria-hidden />
              </div>
            </article>
          );
        })}

        <div className="rounded-2xl border border-[#00C4B0]/35 bg-[#00C4B0]/15 p-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9ff5eb]">
              {t("Totales", "Totals")} · {stats.records} {t("rótulos", "signs")} · {stats.panels}{" "}
              {stats.panels === 1 ? t("lámina", "panel") : t("láminas", "panels")} · {formatAreaM2(stats.areaM2, lang)}
            </p>
            <p className="text-xl font-black text-white">{price(breakdown.total)}</p>
          </div>
          <p className="mt-1 text-[11px] font-bold text-[#9ff5eb]/80">
            {price(breakdown.base)} + {ivaPct}% {t("IVA", "tax")} ({price(breakdown.iva)})
          </p>
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-white/10 bg-zinc-900/60 sm:block print:block print:overflow-visible print:rounded-none print:border-black/15 print:bg-white">
        <table className="w-full min-w-[960px] text-left text-sm print:min-w-0 print:text-xs">
          <thead className="bg-white/5 text-[11px] uppercase tracking-[0.14em] text-zinc-400 print:bg-transparent print:text-black">
            <tr>
              <th className="px-4 py-3 font-black">{t("Rótulo", "Sign")}</th>
              <th className="px-4 py-3 font-black">{t("Tamaño", "Size")}</th>
              <th className="px-4 py-3 font-black">{t("Tipo", "Type")}</th>
              <th className="px-4 py-3 font-black">{t("Elementos", "Elements")}</th>
              <th className="px-4 py-3 font-black">{t("Medida", "Measure")}</th>
              <th className="px-4 py-3 text-right font-black">{t("Costo previsto", "Projected cost")}</th>
              <th className="px-4 py-3 text-right font-black">{t("Precio del proveedor", "Vendor price")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 print:divide-black/10">
            {rotulos.map((rotulo) => {
              const included = selected.includes(rotulo.id);
              const meta = KIND_META[rotulo.kind];
              const Icon = meta.icon;
              return (
                <tr
                  key={rotulo.id}
                  className={included ? "text-zinc-200 print:text-black" : "bg-black/10 text-zinc-500 print:bg-transparent print:text-black/50"}
                >
                  <td className="px-4 py-4 font-bold">
                    <span className="text-[#65e2d5] print:text-black">{rotulo.code}</span> {rotulo.name}
                    <span className={`mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] ${included ? "text-[#9ff5eb] print:text-black/60" : "text-zinc-600"}`}>
                      {included ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
                      {included ? t("Incluido", "Included") : t("Excluido", "Excluded")}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold">{sizeLabel(rotulo, lang)}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 font-bold">
                      <Icon className="h-4 w-4 shrink-0 text-[#00C4B0] print:text-black" aria-hidden />
                      {meta.label[lang]}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold">
                    {rotulo.panels.length} {rotulo.panels.length === 1 ? t("lámina", "panel") : t("láminas", "panels")}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold">{measureLabel(rotulo)}</p>
                    <p className="mt-0.5 text-xs text-zinc-400 print:text-black/60">
                      {formatAreaM2(rotuloTotalAreaM2(rotulo), lang)} {t("total", "total")}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right font-black text-white print:text-black">
                    {price(signSubtotal(rotulo))}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="ml-auto block h-5 w-24 border-b border-dashed border-zinc-500 print:border-black/50" aria-hidden />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[#00C4B0]/10 text-[#c7faf5] print:bg-transparent print:text-black">
            <tr>
              <td className="px-4 py-4 font-black uppercase tracking-[0.14em]" colSpan={5}>
                {t("Totales", "Totals")} · {stats.records} {t("rótulos", "signs")} · {stats.panels}{" "}
                {stats.panels === 1 ? t("lámina", "panel") : t("láminas", "panels")} · {formatAreaM2(stats.areaM2, lang)}
                <span className="mt-1 block text-[11px] font-bold normal-case tracking-normal text-[#c7faf5]/80 print:text-black/70">
                  {price(breakdown.base)} + {ivaPct}% {t("IVA", "tax")} ({price(breakdown.iva)})
                </span>
              </td>
              <td className="px-4 py-4 text-right text-xl font-black text-white print:text-black">{price(breakdown.total)}</td>
              <td className="px-4 py-4 text-right align-top">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] normal-case text-[#c7faf5]/80 print:text-black/70">
                  {t("Total ofertado", "Total quoted")}
                </span>
                <span className="ml-auto mt-1 block h-6 w-28 border-b border-dashed border-[#c7faf5]/60 print:border-black/50" aria-hidden />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-3 hidden text-[10px] leading-relaxed text-black/60 print:block">
        {t(
          "Propuesta de alcance y medidas para efectos de cotización; confirme materiales, estructura, instalación y medida final antes de fabricar.",
          "Scope and measurements proposed for quoting purposes; confirm materials, structure, installation, and final size before production.",
        )}
      </p>
    </section>
  );
}
