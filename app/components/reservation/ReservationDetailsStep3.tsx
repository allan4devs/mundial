import Link from "next/link";
import type { KeyboardEvent, RefObject } from "react";
import { Check, Pencil, ShieldCheck, UserRound } from "lucide-react";
import type { BookingStepId, ReservationAddonDetails, TourTime } from "@/lib/reservation/types";
import { ADDON_OPTIONS, formatDepartureLabel, getTransportLocationLabel } from "@/lib/reservation/constants";
import { getAddonPricePerPerson } from "@/lib/reservation/addons";
import type { ReservationFormState } from "@/lib/reservation/types";

type ReservationTranslations = typeof import("@/lib/translations").translations["es"]["reservation"];

interface ReservationDetailsStep3Props {
  reviewSectionRef: RefObject<HTMLDivElement | null>;
  termsCheckboxRef: RefObject<HTMLInputElement | null>;
  formState: Pick<ReservationFormState, "agreeTerms" | "name" | "email" | "phoneCode" | "phoneNumber" | "specialRequests">;
  selectedTourName: string;
  packageLabel: string;
  basePriceUSD: number;
  tourTime: TourTime | null;
  tickets: number;
  formattedDate: string;
  selectedAddons: string[];
  addonDetails: ReservationAddonDetails;
  transportQuote?: {
    perPerson?: number | null;
    total?: number;
    type?: string;
  } | null;
  transportLoading?: boolean;
  transportError?: string | null;
  subtotal: number;
  taxes: number;
  totalWithTaxes: number;
  ivaRatePercent: number;
  localizedCancellationPolicy: string;
  onTermsChange: (accepted: boolean) => void;
  onTermsEnter: (event: KeyboardEvent<HTMLInputElement>) => void;
  onEditStep?: (step: BookingStepId) => void;
  tr: ReservationTranslations;
  lang: "es" | "en";
}

export default function ReservationDetailsStep3({
  reviewSectionRef,
  termsCheckboxRef,
  formState,
  selectedTourName,
  packageLabel,
  basePriceUSD,
  tourTime,
  tickets,
  formattedDate,
  selectedAddons,
  addonDetails,
  subtotal,
  taxes,
  totalWithTaxes,
  ivaRatePercent,
  localizedCancellationPolicy,
  onTermsChange,
  onTermsEnter,
  onEditStep,
  tr,
  lang,
  transportQuote,
  transportLoading,
  transportError,
}: ReservationDetailsStep3Props) {
  const isEs = lang === "es";

  return (
    <>
      <div ref={reviewSectionRef} className="mb-3 space-y-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {isEs ? "Tu aventura" : "Your adventure"}
              </p>
              <h3 className="truncate text-base font-black text-zinc-900 dark:text-zinc-50">{selectedTourName}</h3>
              <p className="mt-0.5 text-xs font-semibold capitalize text-zinc-500">{formattedDate}</p>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] font-bold text-zinc-600 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                <Pencil className="h-3 w-3" aria-hidden />
                {isEs ? "Editar" : "Edit"}
              </button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <ReviewChip label={isEs ? "Paquete" : "Package"} value={packageLabel} />
            <ReviewChip
              label={tr.tourTimeTitle}
              value={tourTime ? formatDepartureLabel(tourTime) : "—"}
            />
            <ReviewChip label={isEs ? "Personas" : "People"} value={String(tickets)} />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-300">
                <UserRound className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                {isEs ? "Viajero principal" : "Lead traveler"}
              </h3>
            </div>
            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(2)}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-1 text-[11px] font-bold text-zinc-600 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-zinc-600 dark:text-zinc-300"
              >
                <Pencil className="h-3 w-3" aria-hidden />
                {isEs ? "Editar" : "Edit"}
              </button>
            )}
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="font-bold text-zinc-900 dark:text-zinc-50">{formState.name || "—"}</p>
            <p className="text-zinc-600 dark:text-zinc-300">{formState.email || "—"}</p>
            <p className="text-zinc-600 dark:text-zinc-300">
              {formState.phoneNumber
                ? `${formState.phoneCode} ${formState.phoneNumber}`
                : "—"}
            </p>
            {formState.specialRequests?.trim() && (
              <p className="mt-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <span className="font-bold">{isEs ? "Notas: " : "Notes: "}</span>
                {formState.specialRequests.trim()}
              </p>
            )}
          </div>
        </section>

        {selectedAddons.length > 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 sm:p-4">
            <p className="mb-2 text-sm font-black text-zinc-900 dark:text-zinc-50">
              {isEs ? "Servicios extra" : "Extra services"}
            </p>
            {ADDON_OPTIONS.filter((a) => selectedAddons.includes(a.id)).map((addon) => {
              const detailLines = getAddonDetailLines(addon.id, addonDetails, lang);
              const isTransport = addon.id === "transporte";
              const displayPrice = getAddonPricePerPerson(addon.id, addonDetails, {
                transportPricePerPerson: transportQuote?.perPerson ?? null,
              });

              return (
                <div
                  key={addon.id}
                  className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm last:mb-0 dark:border-zinc-700 dark:bg-zinc-950/40"
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-bold text-zinc-800 dark:text-zinc-100">
                      {isEs ? addon.nameEs : addon.nameEn}
                    </span>
                    <span className="shrink-0 font-bold">
                      {addon.priceStatus === "quote"
                        ? (isEs ? "Cotización separada" : "Separate quote")
                        : `+$${displayPrice} / ${tr.perPerson}`}
                    </span>
                  </div>
                  {isTransport && transportLoading && (
                    <p className="mt-2 text-xs text-zinc-500">
                      {isEs ? "Calculando precio de transporte…" : "Calculating transport price…"}
                    </p>
                  )}
                  {isTransport && transportError && (
                    <p className="mt-2 text-xs text-red-600">{transportError}</p>
                  )}
                  {isTransport && transportQuote && transportQuote.type === "private" && (
                    <p className="mt-2 text-xs text-zinc-600">
                      {isEs ? "Total vehículo" : "Vehicle total"}: ${transportQuote.total}
                    </p>
                  )}
                  {detailLines.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {detailLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/20 sm:p-4">
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
            <span className="text-zinc-600 dark:text-zinc-300">{packageLabel}</span>
            <span className="font-semibold">${basePriceUSD} / {tr.perPerson}</span>
          </div>
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
            <span>{tr.subtotalLabel}</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
            <span>{tr.taxes} ({ivaRatePercent}%)</span>
            <span className="font-semibold">${taxes.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-emerald-200/80 pt-2 text-lg font-black dark:border-emerald-800/50">
            <span>{tr.total}</span>
            <span className="text-emerald-700 dark:text-emerald-300">${totalWithTaxes.toFixed(2)}</span>
          </div>
        </section>
      </div>

      <div className="mb-4">
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-zinc-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-zinc-300">
          <strong className="mb-1 block text-sm text-amber-900 dark:text-amber-300">{tr.cancellationLabel}</strong>
          <p className="text-sm leading-relaxed">{localizedCancellationPolicy}</p>
        </div>
        <label
          htmlFor="agreeTerms"
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
            formState.agreeTerms
              ? "border-emerald-500 bg-emerald-50 shadow-sm dark:bg-emerald-950/30"
              : "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white ring-2 ring-emerald-200/60 hover:border-emerald-400 dark:border-emerald-700 dark:from-emerald-950/40 dark:to-zinc-900 dark:ring-emerald-900/40"
          }`}
        >
          <input
            ref={termsCheckboxRef}
            id="agreeTerms"
            type="checkbox"
            checked={formState.agreeTerms}
            onChange={(e) => onTermsChange(e.target.checked)}
            onKeyDown={onTermsEnter}
            className="mt-0.5 h-6 w-6 rounded border-zinc-400 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-700"
          />
          <span className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {isEs ? "Último paso · confirme antes de pagar" : "Last step · confirm before payment"}
            </span>
            {tr.agreeText}
            <Link
              href="/terminos-y-condiciones"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-1 text-teal-600 underline"
            >
              {tr.termsLink}
            </Link>{" "}
            {tr.andThe}{" "}
            <Link
              href="/politica-de-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-1 text-teal-600 underline"
            >
              {tr.privacyLink}
            </Link>
            .
            <span className="mt-2 block text-xs font-semibold text-zinc-500">
              {isEs ? "Después de marcar esta casilla, podrá continuar al pago." : "After checking this box, you can continue to payment."}
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 border-t border-zinc-200 pb-1 pt-4 dark:border-zinc-800">
        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          {isEs ? "Cancelación gratuita hasta 24h antes" : "Free cancellation up to 24h before"}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
          {isEs ? "Confirmación inmediata" : "Instant confirmation"}
        </span>
      </div>
    </>
  );
}

function ReviewChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/40">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}

function getAddonDetailLines(addonId: string, details: ReservationAddonDetails, lang: "es" | "en") {
  if (addonId === "alojamiento") {
    return [
      details.lodgingType ? `${lang === "es" ? "Tipo" : "Type"}: ${formatLodgingType(details.lodgingType, lang)}` : null,
      details.lodgingNights ? `${lang === "es" ? "Noches" : "Nights"}: ${details.lodgingNights}` : null,
      details.lodgingRoom ? `${lang === "es" ? "Cuarto" : "Room"}: ${details.lodgingRoom}` : null,
    ].filter(Boolean) as string[];
  }

  if (addonId === "almuerzo") {
    return [
      details.restaurantMeal ? `${lang === "es" ? "Comida" : "Meal"}: ${details.restaurantMeal}` : null,
      details.restaurantProtein ? `${lang === "es" ? "Proteína" : "Protein"}: ${details.restaurantProtein}` : null,
      details.restaurantNotes ? `${lang === "es" ? "Notas" : "Notes"}: ${details.restaurantNotes}` : null,
    ].filter(Boolean) as string[];
  }

  if (addonId === "transporte") {
    return [
      details.transportType
        ? `${lang === "es" ? "Tipo" : "Type"}: ${
            details.transportType === "private"
              ? lang === "es"
                ? "Privado 4x4"
                : "Private 4x4"
              : lang === "es"
                ? "Compartido"
                : "Shared shuttle"
          }`
        : null,
      details.pickupLocation
        ? `${lang === "es" ? "Pickup" : "Pickup"}: ${getTransportLocationLabel(details.pickupLocation, lang)}`
        : null,
      details.dropoffLocation
        ? `${lang === "es" ? "Drop-off" : "Drop-off"}: ${getTransportLocationLabel(details.dropoffLocation, lang)}`
        : null,
      details.transportNotes ? `${lang === "es" ? "Notas" : "Notes"}: ${details.transportNotes}` : null,
    ].filter(Boolean) as string[];
  }

  return [];
}

function formatLodgingType(type: NonNullable<ReservationAddonDetails["lodgingType"]>, lang: "es" | "en") {
  if (type === "hostel") return lang === "es" ? "Hostal" : "Hostel";
  if (type === "hotel") return "Hotel";
  return lang === "es" ? "Cabina" : "Cabin";
}
