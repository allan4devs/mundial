import type { TourTime } from "@/lib/reservation/types";
import { formatDepartureLabel } from "@/lib/reservation/constants";

type ReservationTranslations = typeof import("@/lib/translations").translations["es"]["reservation"];

interface ReservationDetailsSummaryCardProps {
  basePriceUSD: number;
  selectedTourName: string;
  tourTime: TourTime | null;
  addonsPricePerPerson: number;
  subtotal: number;
  taxes: number;
  totalWithTaxes: number;
  pricePerPerson: number;
  tickets: number;
  ivaRatePercent?: number;
  tr: ReservationTranslations;
  lang: "es" | "en";
  isStep1Valid: boolean;
  onContinue: () => void;
}

export default function ReservationDetailsSummaryCard({
  basePriceUSD,
  selectedTourName,
  tourTime,
  addonsPricePerPerson,
  subtotal,
  taxes,
  totalWithTaxes,
  pricePerPerson,
  tickets,
  ivaRatePercent = 13,
  tr,
  lang,
  isStep1Valid,
  onContinue,
}: ReservationDetailsSummaryCardProps) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-black/5 dark:border-emerald-900/60 dark:bg-zinc-900">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-50/80">
            {lang === "es" ? "Total estimado" : "Estimated total"}
          </p>
          <p className="mt-2 text-4xl font-black tracking-tight">${totalWithTaxes.toFixed(2)}</p>
          <p className="mt-1 text-sm font-semibold text-emerald-50/85">
            {tickets} {lang === "es" ? "persona(s)" : "guest(s)"} | ${pricePerPerson} {tr.perPerson}
          </p>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{lang === "es" ? "Tour" : "Tour"}</span>
            <span className="text-right font-bold text-zinc-900 dark:text-zinc-50">{selectedTourName}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{lang === "es" ? "Hora" : "Time"}</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-50">{tourTime ? formatDepartureLabel(tourTime) : "—"}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{lang === "es" ? "Base" : "Base"}</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-50">${basePriceUSD} / {tr.perPerson}</span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">{lang === "es" ? "Extras" : "Add-ons"}</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-50">+${addonsPricePerPerson} / {tr.perPerson}</span>
          </div>
          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">{tr.subtotalLabel}</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">${subtotal.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">{tr.taxes} ({ivaRatePercent}%)</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">${taxes.toFixed(2)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            aria-disabled={!isStep1Valid}
            className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 font-black text-white transition ${
              !isStep1Valid
                ? "cursor-not-allowed bg-zinc-400 opacity-70"
                : "bg-zinc-950 hover:-translate-y-0.5 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            }`}
          >
            {lang === "es" ? "Continuar a mis datos" : "Continue to details"}
          </button>
        </div>
      </div>
    </aside>
  );
}
