"use client";

import type { KeyboardEvent, RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock3, Minus, Plus, Sparkles, Users } from "lucide-react";
import AddOnsExperience from "./AddOnsExperience";
import PackagePicker from "./PackagePicker";
import { formatDepartureLabel } from "@/lib/reservation/constants";
import type { ReservationAddonDetails, TourTime } from "@/lib/reservation/types";
import type { TourPackageOption } from "@/lib/types/index";

type ReservationTranslations = typeof import("@/lib/translations").translations["es"]["reservation"];
export type ChoiceStep = 1 | 2 | 3 | 4;

interface Props {
  choiceStep: ChoiceStep;
  onChoiceStepChange: (step: ChoiceStep) => void;
  scheduleSectionRef: RefObject<HTMLElement | null>;
  ticketsInputRef: RefObject<HTMLInputElement | null>;
  tourTime: TourTime | null;
  availableTimeSlots: string[];
  isTicketsValid: boolean;
  hasConfirmedPackage: boolean;
  hasConfirmedTime: boolean;
  hasConfirmedTickets: boolean;
  tickets: number;
  slots: number;
  packages: TourPackageOption[];
  selectedPackageId: string;
  excludedAddonIds: string[];
  selectedAddons: string[];
  addonDetails: ReservationAddonDetails;
  addonsPricePerPerson: number;
  packageLabel: string;
  reservationDateIso: string;
  estimatedTotal: number;
  continueLabel: string;
  onPackageSelect: (packageId: string) => void;
  isPackageDisabled?: (pkg: TourPackageOption) => boolean;
  onTourTimeSelect: (slot: TourTime) => void;
  onTicketsChange: (value: string) => void;
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

export default function ReservationDetailsStep1Guided(props: Props) {
  const {
    choiceStep, onChoiceStepChange, scheduleSectionRef, ticketsInputRef, tourTime,
    availableTimeSlots, isTicketsValid, hasConfirmedPackage, hasConfirmedTime,
    hasConfirmedTickets, tickets, slots, packages, selectedPackageId,
    excludedAddonIds, selectedAddons, addonDetails, addonsPricePerPerson, packageLabel,
    reservationDateIso, estimatedTotal, continueLabel, onPackageSelect, isPackageDisabled,
    onTourTimeSelect, onTicketsChange, onStep1Enter, onAddonToggle, onAddonDetailsChange,
    onContinue, canContinue, transportQuote = null, transportLoading = false,
    transportError = null, transportPreview = false, tr, lang,
  } = props;
  const isEs = lang === "es";
  const reduceMotion = useReducedMotion();
  const guestPresets = GUEST_PRESETS.filter((count) => count <= Math.max(1, slots));
  const titles = isEs
    ? ["Elegí su paquete", "Elegí el horario", "¿Cuántas personas van?", "Personalizá su aventura"]
    : ["Choose your package", "Choose a departure", "How many guests?", "Make it your adventure"];
  const descriptions = isEs
    ? [
        "Compare con calma. El precio es por persona y puede cambiarlo después.",
        "Seleccione una hora disponible para la fecha elegida.",
        "Indique el tamaño de su grupo para calcular disponibilidad y total.",
        "Los extras son opcionales. Puede continuar sin agregar ninguno.",
      ]
    : [
        "Take your time comparing. Pricing is per guest and can be changed later.",
        "Select an available departure for your chosen date.",
        "Tell us your group size so we can calculate availability and total.",
        "Extras are optional. You can continue without adding any.",
      ];

  const goNext = () => {
    if (choiceStep < 4) onChoiceStepChange((choiceStep + 1) as ChoiceStep);
    else onContinue();
  };

  return (
    <div className="mb-4">
      <div className="mb-7 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/85">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            {isEs ? `Configuración ${choiceStep} de 4` : `Setup ${choiceStep} of 4`}
          </p>
          <p className="truncate text-sm font-black text-zinc-900 dark:text-white">{packageLabel}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{isEs ? "Estimado" : "Estimate"}</p>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">${estimatedTotal.toFixed(0)}</p>
        </div>
      </div>

      <div className="mb-8 flex gap-2" aria-label={isEs ? "Progreso de selección" : "Selection progress"}>
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step <= choiceStep ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-700"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={choiceStep}
          initial={reduceMotion ? false : { opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[430px]">
          <div className="mb-7 max-w-2xl">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#00C4B0]/15 text-[#087d72] dark:text-[#66ddcf]">
              {choiceStep === 1 ? <Sparkles className="h-6 w-6" /> : choiceStep === 2 ? <Clock3 className="h-6 w-6" /> : choiceStep === 3 ? <Users className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </span>
            <h3 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">{titles[choiceStep - 1]}</h3>
            <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-300">{descriptions[choiceStep - 1]}</p>
          </div>

          {choiceStep === 1 && (
            <PackagePicker packages={packages} selectedPackageId={selectedPackageId}
              hasConfirmedSelection={hasConfirmedPackage}
              onSelect={onPackageSelect} lang={lang} dateIso={reservationDateIso}
              isPackageDisabled={isPackageDisabled} />
          )}

          {choiceStep === 2 && (
            <section ref={scheduleSectionRef}>
              <div>
                <p className="mb-4 text-sm font-black text-zinc-900 dark:text-white">{tr.tourTimeTitle}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableTimeSlots.map((slot) => {
                    const selected = tourTime === slot;
                    return (
                      <button key={slot} type="button" onClick={() => onTourTimeSelect(slot as TourTime)}
                        className={`min-h-24 rounded-3xl border-2 px-4 text-xl font-black transition ${selected ? "border-[#00C4B0] bg-[#00C4B0] text-[#16312e] shadow-lg shadow-[#00C4B0]/20" : "border-zinc-200 bg-white text-zinc-800 hover:border-[#00C4B0] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"}`}>
                        {formatDepartureLabel(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>

            </section>
          )}

          {choiceStep === 3 && (
            <section>
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-950/30 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-black text-zinc-900 dark:text-white"><Users className="h-4 w-4 text-emerald-600" />{tr.numPeople}</p>
                  <span className="rounded-full bg-[#00C4B0]/10 px-3 py-1 text-xs font-bold text-[#087d72] dark:text-[#66ddcf]">{tr.availablePrefix} {slots}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {guestPresets.map((count) => (
                    <button key={count} type="button" onClick={() => onTicketsChange(String(count))}
                      className={`h-16 min-w-16 rounded-2xl border-2 px-5 text-lg font-black transition ${tickets === count && hasConfirmedTickets ? "border-[#00C4B0] bg-[#00C4B0] text-[#16312e]" : "border-zinc-300 bg-white text-zinc-700 hover:border-[#00C4B0] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"}`}>
                      {count}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => onTicketsChange(String(tickets - 1))} disabled={tickets <= 1} className="grid h-14 w-14 place-items-center rounded-2xl border border-zinc-300 disabled:opacity-40 dark:border-zinc-700" aria-label={isEs ? "Reducir personas" : "Decrease guests"}><Minus className="h-5 w-5" /></button>
                    <input ref={ticketsInputRef} id="tickets" type="number" min={1} max={Math.max(1, slots)} value={tickets} onChange={(e) => onTicketsChange(e.target.value)} onKeyDown={onStep1Enter} className="h-14 w-20 rounded-2xl border border-zinc-300 bg-white text-center text-xl font-black dark:border-zinc-700 dark:bg-zinc-900" />
                    <button type="button" onClick={() => onTicketsChange(String(tickets + 1))} disabled={tickets >= slots} className="grid h-14 w-14 place-items-center rounded-2xl border border-zinc-300 disabled:opacity-40 dark:border-zinc-700" aria-label={isEs ? "Aumentar personas" : "Increase guests"}><Plus className="h-5 w-5" /></button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {choiceStep === 4 && (
            <div>
              <AddOnsExperience lang={lang} selectedAddons={selectedAddons} addonDetails={addonDetails}
                onAddonToggle={onAddonToggle} onAddonDetailsChange={onAddonDetailsChange}
                excludedAddonIds={excludedAddonIds} transportQuote={transportQuote}
                transportLoading={transportLoading} transportError={transportError}
                transportPreview={transportPreview} />
              {selectedAddons.length > 0 && (
                <p className="mt-4 text-right text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {isEs ? "Extras por persona" : "Add-ons per guest"}: +${addonsPricePerPerson}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 hidden items-center gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-700 md:flex">
        {choiceStep > 1 && (
          <button type="button" onClick={() => onChoiceStepChange((choiceStep - 1) as ChoiceStep)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-zinc-300 px-6 font-bold dark:border-zinc-600">
            <ArrowLeft className="h-4 w-4" /> {isEs ? "Atrás" : "Back"}
          </button>
        )}
        <button type="button" onClick={goNext} disabled={
          (choiceStep === 1 && !hasConfirmedPackage) ||
          (choiceStep === 2 && (!tourTime || !hasConfirmedTime)) ||
          (choiceStep === 3 && (!isTicketsValid || !hasConfirmedTickets)) ||
          (choiceStep === 4 && !canContinue)
        }
          className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-600 px-8 font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">
          {choiceStep === 4 ? continueLabel : isEs ? "Continuar" : "Continue"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
