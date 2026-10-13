import type { KeyboardEvent, RefObject } from "react";
import {
  Clock3,
  Users,
  Minus,
  Plus,
  Sparkles,
  Zap,
  ChevronRight,
} from "lucide-react";
import { formatDepartureLabel } from "@/lib/reservation/constants";
import AddOnsExperience from "@/app/components/reservation/AddOnsExperience";
import PackagePicker from "@/app/components/reservation/PackagePicker";
import type { ReservationAddonDetails, TourTime } from "@/lib/reservation/types";
import type { TourPackageOption } from "@/lib/types/index";

type ReservationTranslations = typeof import("@/lib/translations").translations["es"]["reservation"];

interface ReservationDetailsStep1Props {
  scheduleSectionRef: RefObject<HTMLElement | null>;
  ticketsInputRef: RefObject<HTMLInputElement | null>;
  tourTime: TourTime | null;
  availableTimeSlots: string[];
  isTicketsValid: boolean;
  tickets: number;
  slots: number;
  packages: TourPackageOption[];
  selectedPackageId: string;
  excludedAddonIds: string[];
  selectedAddons: string[];
  addonDetails: ReservationAddonDetails;
  addonsPricePerPerson: number;
  packagePriceUSD: number;
  packageLabel: string;
  reservationDateIso: string;
  estimatedTotal: number;
  continueLabel: string;
  expressReady?: boolean;
  travelerReady?: boolean;
  onPackageSelect: (packageId: string) => void;
  isPackageDisabled?: (pkg: TourPackageOption) => boolean;
  onTourTimeSelect: (slot: TourTime) => void;
  onTicketsChange: (rawValue: string) => void;
  onStep1Enter: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddonToggle: (addonId: string) => void;
  onAddonDetailsChange: (details: ReservationAddonDetails) => void;
  onContinue: () => void;
  canContinue: boolean;
  transportQuote?: import("@/lib/reservation/transport").TransportQuoteResult | null;
  transportLoading?: boolean;
  transportError?: string | null;
  transportPreview?: boolean;
  tr: ReservationTranslations;
  lang: "es" | "en";
}

const GUEST_PRESETS = [1, 2, 3, 4, 6] as const;

export default function ReservationDetailsStep1({
  scheduleSectionRef,
  ticketsInputRef,
  tourTime,
  availableTimeSlots,
  isTicketsValid,
  tickets,
  slots,
  packages,
  selectedPackageId,
  excludedAddonIds,
  selectedAddons,
  addonDetails,
  addonsPricePerPerson,
  packagePriceUSD,
  packageLabel,
  reservationDateIso,
  estimatedTotal,
  continueLabel,
  expressReady = false,
  travelerReady = false,
  onPackageSelect,
  isPackageDisabled,
  onTourTimeSelect,
  onTicketsChange,
  onStep1Enter,
  onAddonToggle,
  onAddonDetailsChange,
  onContinue,
  canContinue,
  transportQuote = null,
  transportLoading = false,
  transportError = null,
  transportPreview = false,
  tr,
  lang,
}: ReservationDetailsStep1Props) {
  const isEs = lang === "es";
  const singleTimeSlot = availableTimeSlots.length === 1 ? availableTimeSlots[0] : null;
  const guestPresets = GUEST_PRESETS.filter((count) => count <= Math.max(1, slots));
  const ready = canContinue;

  return (
    <div className="mb-3 space-y-3">
      {/* Magic status hero — the whole booking story in one glance */}
      <section
        className={`relative overflow-hidden rounded-2xl border p-3.5 shadow-sm sm:p-4 ${
          ready
            ? "border-emerald-300/80 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white"
            : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/70"
        }`}
      >
        {ready && (
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        )}
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${
                ready ? "text-white/85" : "text-emerald-700 dark:text-emerald-300"
              }`}
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {isEs ? "Reserva mágica" : "Magic booking"}
            </p>
            <h3
              className={`mt-1 text-lg font-black leading-tight sm:text-xl ${
                ready ? "text-white" : "text-zinc-900 dark:text-zinc-50"
              }`}
            >
              {ready
                ? isEs
                  ? "Ya está casi listo."
                  : "Almost done."
                : isEs
                  ? "Lo armamos por vos."
                  : "We set it up for you."}
            </h3>
            <p className={`mt-1 text-xs font-medium sm:text-sm ${ready ? "text-white/90" : "text-zinc-500"}`}>
              {ready
                ? travelerReady
                  ? isEs
                    ? "Fecha, hora, paquete y tus datos — solo confirmá."
                    : "Date, time, package and your details — just confirm."
                  : isEs
                    ? "Fecha, hora y paquete listos. Falta un toque de tus datos."
                    : "Date, time and package ready. Just add your details."
                : isEs
                  ? "Fecha y hora se eligen solas. Tocá paquete o personas solo si querés."
                  : "Date and time auto-pick. Only change package or guests if you want."}
            </p>
          </div>
          <div className={`shrink-0 text-right ${ready ? "text-white" : ""}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wide ${ready ? "text-white/75" : "text-zinc-500"}`}>
              {isEs ? "Total" : "Total"}
            </p>
            <p className="text-2xl font-black leading-none">${estimatedTotal.toFixed(0)}</p>
            <p className={`mt-0.5 text-[10px] font-semibold ${ready ? "text-white/75" : "text-zinc-500"}`}>
              {tickets} pax · IVA
            </p>
          </div>
        </div>

        <div className={`relative mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4`}>
          <MagicChip
            label={isEs ? "Paquete" : "Package"}
            value={packageLabel}
            active={ready}
          />
          <MagicChip
            label={isEs ? "Hora" : "Time"}
            value={tourTime ? formatDepartureLabel(tourTime) : "—"}
            active={ready}
          />
          <MagicChip
            label={isEs ? "Personas" : "Guests"}
            value={String(tickets)}
            active={ready}
          />
          <MagicChip
            label={isEs ? "Tarifa" : "Rate"}
            value={`$${packagePriceUSD}`}
            active={ready}
          />
        </div>

        {expressReady && (
          <button
            type="button"
            onClick={onContinue}
            className="relative mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-emerald-800 shadow-lg shadow-black/10 transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {isEs ? "Confirmar en 1 toque" : "Confirm in 1 tap"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </section>

      {/* Package — visual pick, defaults already set */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70 sm:p-4">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
            {isEs ? "Paquete" : "Package"}
          </h3>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            ${packagePriceUSD} / {tr.perPerson}
          </span>
        </div>
        <PackagePicker
          packages={packages}
          selectedPackageId={selectedPackageId}
          onSelect={onPackageSelect}
          lang={lang}
          dateIso={reservationDateIso}
          isPackageDisabled={isPackageDisabled}
        />
      </section>

      {/* Time + guests in one dense card */}
      <section
        ref={scheduleSectionRef}
        className={`rounded-2xl border bg-white p-3 shadow-sm transition-all dark:bg-zinc-900/70 sm:p-4 ${
          !tourTime || !isTicketsValid
            ? "border-amber-300 ring-2 ring-amber-300/35 dark:border-amber-600"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50">{tr.tourTimeTitle}</h3>
        </div>

        {singleTimeSlot ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800/50 dark:bg-emerald-950/25">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {isEs ? "Auto-elegida" : "Auto-picked"}
              </p>
              <p className="text-base font-black text-zinc-900 dark:text-zinc-50">
                {formatDepartureLabel(singleTimeSlot)}
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-300" aria-hidden />
          </div>
        ) : (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {availableTimeSlots.map((slot) => {
              const isSelected = tourTime === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onTourTimeSelect(slot)}
                  className={`min-h-11 rounded-xl border-2 px-2 py-2 text-center text-sm font-black transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-900/15"
                      : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200"
                  }`}
                >
                  {formatDepartureLabel(slot)}
                </button>
              );
            })}
          </div>
        )}

        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600 dark:text-teal-300" aria-hidden />
              <label htmlFor="tickets" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {tr.numPeople}
              </label>
            </div>
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 dark:text-teal-300">
              {tr.availablePrefix} {slots}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {guestPresets.map((count) => {
              const selected = tickets === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => onTicketsChange(String(count))}
                  disabled={slots === 0 || count > slots}
                  className={`min-h-10 min-w-10 rounded-xl border px-3 text-sm font-black transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {count}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onTicketsChange(String(tickets - 1))}
                disabled={slots === 0 || tickets <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                aria-label={isEs ? "Reducir personas" : "Decrease guests"}
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <input
                ref={ticketsInputRef}
                id="tickets"
                type="number"
                min={1}
                max={Math.max(1, slots)}
                value={tickets}
                onChange={(e) => onTicketsChange(e.target.value)}
                onKeyDown={onStep1Enter}
                className="h-10 w-14 rounded-xl border border-zinc-300 bg-white text-center text-base font-black text-zinc-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                disabled={slots === 0}
              />
              <button
                type="button"
                onClick={() => onTicketsChange(String(tickets + 1))}
                disabled={slots === 0 || tickets >= slots}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                aria-label={isEs ? "Aumentar personas" : "Increase guests"}
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </section>

      <AddOnsExperience
        lang={lang}
        selectedAddons={selectedAddons}
        addonDetails={addonDetails}
        onAddonToggle={onAddonToggle}
        onAddonDetailsChange={onAddonDetailsChange}
        excludedAddonIds={excludedAddonIds}
        defaultCollapsed
        transportQuote={transportQuote}
        transportLoading={transportLoading}
        transportError={transportError}
        transportPreview={transportPreview}
      />

      {selectedAddons.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-800/50 dark:bg-emerald-950/20">
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            {isEs ? "Extras por persona" : "Add-ons per person"}
          </span>
          <span className="font-black text-emerald-800 dark:text-emerald-300">+${addonsPricePerPerson}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex"
      >
        {continueLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function MagicChip({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-2.5 py-2 ${
        active ? "bg-white/15 backdrop-blur-sm" : "border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/40"
      }`}
    >
      <p className={`text-[9px] font-bold uppercase tracking-wide ${active ? "text-white/75" : "text-zinc-500"}`}>
        {label}
      </p>
      <p className={`truncate text-xs font-black sm:text-sm ${active ? "text-white" : "text-zinc-900 dark:text-zinc-50"}`}>
        {value}
      </p>
    </div>
  );
}
