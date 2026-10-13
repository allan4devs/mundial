import { LayoutPanelTop, MapPinned, Ruler, ScanLine } from "lucide-react";
import {
  formatAreaM2,
  PANEL_SIZE_ORDER,
  PANEL_SIZE_SPECS,
  planMeasurementStats,
  sizeMeasurementLabel,
} from "./measurements";
import type { Lang, Rotulo } from "./types";

type RotulosPlanOverviewProps = {
  rotulos: Rotulo[];
  lang: Lang;
  t: (es: string, en: string) => string;
};

export default function RotulosPlanOverview({ rotulos, lang, t }: RotulosPlanOverviewProps) {
  const stats = planMeasurementStats(rotulos);

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">
      <div className="grid gap-4 border-b border-white/10 p-5 sm:grid-cols-3 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00C4B0]/15 text-[#65e2d5]">
            <MapPinned className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-3xl font-black text-white">{stats.records}</p>
            <p className="text-sm font-bold text-zinc-400">{t("fichas R-01 a R-07", "records R-01 to R-07")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00C4B0]/15 text-[#65e2d5]">
            <LayoutPanelTop className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-3xl font-black text-white">{stats.panels}</p>
            <p className="text-sm font-bold text-zinc-400">{t("láminas físicas", "physical panels")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00C4B0]/15 text-[#65e2d5]">
            <ScanLine className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-3xl font-black text-white">{formatAreaM2(stats.areaM2, lang)}</p>
            <p className="text-sm font-bold text-zinc-400">{t("área de trabajo", "working area")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-[#00C4B0]" aria-hidden />
          <div>
            <h2 className="text-xl font-black text-white sm:text-2xl">
              {t("Tamaños y medidas del plan", "Plan sizes and dimensions")}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">
              {t(
                "Se muestran primero el ancho y después el alto. Son medidas de trabajo para pedir las tres cotizaciones; el proveedor debe confirmarlas antes de fabricar.",
                "Width is shown first, then height. These are working dimensions for requesting three quotes; the supplier must confirm them before production.",
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {PANEL_SIZE_ORDER.map((key) => {
            const spec = PANEL_SIZE_SPECS[key];
            const count = stats.bySize[key];
            return (
              <article
                key={key}
                className={`rounded-2xl border p-4 ${
                  count > 0
                    ? "border-[#00C4B0]/30 bg-[#00C4B0]/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#65e2d5]">
                      {spec.label[lang]}
                    </p>
                    <p className="mt-2 text-lg font-black leading-tight text-white sm:text-xl">
                      {sizeMeasurementLabel(key, lang)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-black text-white">
                    {count > 0
                      ? t(`${count} en el plan`, `${count} in plan`)
                      : t("Opcional · 0 asignados", "Optional · 0 assigned")}
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold text-zinc-400">
                  {Math.round(spec.widthM * 100)} × {Math.round(spec.heightM * 100)} cm
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
