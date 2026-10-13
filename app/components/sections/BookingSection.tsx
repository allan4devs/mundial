"use client";

import { Suspense } from "react";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useCalendarContext } from "@/lib/CalendarContext";
import CalendarSection from "@/app/components/sections/CalendarSection";
import ReservationSection from "@/app/components/sections/ReservationSection";

type Props = {
  selectedTourSlug: string | null;
  initialPackageId?: string;
};

export default function BookingSection({ selectedTourSlug, initialPackageId }: Props) {
  const { lang } = useLanguage();
  const { selectedDay, selectDay } = useCalendarContext();

  return (
    <section
      id="booking"
      className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[#f4f1ea] dark:bg-[#0b0a09]"
    >
      <div className="container relative z-10 mx-auto px-3 py-6 md:px-8 md:py-12">
        {selectedTourSlug ? (
          <>
            {!selectedDay && (
              <div className="mx-auto mb-5 max-w-xl text-center md:mb-7">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  {lang === "es" ? "Paso 1 de 3 · Disponibilidad" : "Step 1 of 3 · Availability"}
                </p>
                <h1 className="mt-2 text-2xl font-black text-stone-950 dark:text-white sm:text-3xl">
                  {lang === "es" ? "Elegí una fecha" : "Choose a date"}
                </h1>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                  {lang === "es"
                    ? "Los días disponibles están marcados. Tocá uno para continuar."
                    : "Available days are marked. Tap one to continue."}
                </p>
              </div>
            )}

            <div
              className={`mx-auto grid items-start gap-3 lg:gap-5 xl:gap-6 ${
                selectedDay
                  ? "max-w-6xl"
                  : "max-w-2xl"
              }`}
            >
              {!selectedDay && (
                <div className="rounded-2xl border border-stone-200 bg-white pb-3 shadow-sm dark:border-white/10 dark:bg-stone-900 lg:pb-4">
                  <CalendarSection />
                </div>
              )}

              {selectedDay && (
                <div className="min-w-0">
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => selectDay(null)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 text-xs font-black text-stone-700 transition hover:border-[#00C4B0] hover:text-[#087d72] dark:border-white/15 dark:bg-stone-900 dark:text-stone-200"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      {lang === "es" ? "Cambiar fecha" : "Change date"}
                    </button>
                  </div>
                  <div className="rounded-[2rem] border border-stone-200 bg-white p-3 shadow-xl shadow-stone-900/5 dark:border-white/10 dark:bg-stone-900 sm:p-6">
                    <Suspense fallback={<ReservationFallback />}>
                      <ReservationSection
                        preselectedTourSlug={selectedTourSlug}
                        preselectedPackageId={initialPackageId}
                      />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center dark:border-emerald-800/50 dark:bg-emerald-950/30">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {lang === "es"
                ? "No pudimos cargar el tour. Volvé al inicio e intentá nuevamente."
                : "We could not load the tour. Return home and try again."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ReservationFallback() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center dark:border-white/10 dark:bg-stone-900/60">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        <p className="text-sm font-bold text-stone-600 dark:text-stone-300">
          Preparando la reserva...
        </p>
      </div>
    </div>
  );
}
