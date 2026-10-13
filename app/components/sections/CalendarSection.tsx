"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCalendarContext } from "@/lib/CalendarContext";
import Calendar from "@/app/components/calendar/Calendar";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/helpers/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";

type Props = {
  className?: string;
};

export default function CalendarSection({ className }: Props) {
  const {
    selectedDate,
    selectedDay,
    getSlotsForDay,
    goToNextAvailableDay,
    availabilityError,
    refreshAvailability,
  } = useCalendarContext();

  const { lang } = useLanguage();
  const tr = translations[lang].calendar;
  const dateLocale = lang === "es" ? es : enUS;
  const previousSelectedDay = useRef(selectedDay);

  const summaryText = selectedDate
    ? `${tr.chosenPrefix} ${format(
        selectedDate,
        lang === "es" ? "EEEE d 'de' MMMM" : "EEEE, MMMM d",
        { locale: dateLocale }
      )}. ${
        getSlotsForDay(selectedDay!) > 1 ? tr.chosenMany : tr.chosenFew
      }`
    : tr.chooseDate;

  const scrollToDetails = useCallback(() => {
    const details = document.getElementById("reservation-details-card");
    if (!details) return;
    details.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const dateChanged = selectedDay !== null && selectedDay !== previousSelectedDay.current;
    previousSelectedDay.current = selectedDay;
    if (!dateChanged || !window.matchMedia("(max-width: 1023px)").matches) return;

    const timer = window.setTimeout(scrollToDetails, 120);
    return () => window.clearTimeout(timer);
  }, [selectedDay, scrollToDetails]);

  return (
    <section className={cn("flex min-w-0 items-start overflow-hidden px-1 sm:px-2", className)}>
      <div className="min-w-0 w-full">
        <div className="space-y-4">
          {availabilityError && (
            <div
              className="mx-2 mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 sm:mx-4"
              role="alert"
            >
              <span className="font-semibold">{availabilityError}</span>
              <button
                type="button"
                onClick={refreshAvailability}
                className="shrink-0 rounded-lg border border-current px-3 py-2 text-xs font-black"
              >
                {lang === "es" ? "Reintentar" : "Retry"}
              </button>
            </div>
          )}
          <div className="w-full">
            <Calendar />
          </div>

          <div className="mx-2 flex flex-col items-start justify-between gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/20 sm:mx-4 sm:flex-row sm:items-center">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              {summaryText}
            </p>

            <div className="flex min-w-0 w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={goToNextAvailableDay}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[11px] font-bold leading-tight text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:flex-none sm:whitespace-nowrap sm:text-xs"
              >
                {tr.nextAvailable}
              </button>
              <button
                type="button"
                onClick={scrollToDetails}
                disabled={!selectedDate}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black text-white transition enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 lg:hidden"
              >
                {tr.continueToDetails}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
