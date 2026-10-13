"use client";

import { useCalendarContext } from "@/lib/CalendarContext";
import ReservationDetails from "@/app/components/reservation/ReservationDetails";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useReservationData, DEFAULT_BOOKABLE_TOUR } from "@/lib/hooks/useReservationData";

type OrderPayload = {
  name: string;
  email: string;
  phone: string;
  tickets: number;
  total: number;
  date: string;
  dateIso: string;
  tourTime: string;
  packageId?: string;
  tourPackage: string;
  tourSlug: string;
  tourName: string;
  packagePrice: number;
  specialRequests?: string;
  addons?: string[];
  addonIds?: string[];
  addonsPrice?: number;
  addonsPricePerPerson?: number;
  addonsBreakdown?: Array<{ id: string; pricePerPerson: number }>;
  addonDetails?: import("@/lib/reservation/types").ReservationAddonDetails;
  transportQuote?: import("@/lib/reservation/transport").TransportQuoteResult | null;
};

type Props = {
  className?: string;
  preselectedTourSlug?: string | null;
  preselectedPackageId?: string;
};

const RESERVATION_RETURN_KEY = "reservationReturnPath";

export default function ReservationSection({ className, preselectedTourSlug, preselectedPackageId }: Props) {
  const {
    selectedDay,
    currentMonth,
    currentYear,
    tickets,
    setTickets,
    availability,
  } = useCalendarContext();

  const { lang } = useLanguage();
  const { tours, ivaRatePercent } = useReservationData();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTourSlug = (preselectedTourSlug ?? searchParams.get("tour") ?? "").trim();
  const requestedPackageId = (preselectedPackageId ?? searchParams.get("package") ?? "").trim();
  const initialSelectedTourSlug = requestedTourSlug || DEFAULT_BOOKABLE_TOUR.slug;
  const hasPreselectedTour = requestedTourSlug.length > 0;

  const handleReserve = (data: OrderPayload) => {
    const orderDetails = {
      ...data,
      bookingAttemptId: crypto.randomUUID(),
    };
    sessionStorage.setItem("reservationOrderDetails", JSON.stringify(orderDetails));
    sessionStorage.setItem(RESERVATION_RETURN_KEY, `/reservar?tour=${encodeURIComponent(data.tourSlug)}`);
    router.push("/reservation");
  };

  const monthName = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", {
    month: "long",
  }).format(new Date(currentYear, currentMonth, 1));

  if (!selectedDay) {
    return (
      <div className={className}>
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-teal-500/20" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10">
              <svg className="h-6 w-6 text-teal-500 dark:text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
          </div>
          <div>
            <p className="mb-1 text-base font-semibold text-zinc-800 dark:text-zinc-100">
              {lang === "es" ? "Buscando la próxima fecha libre…" : "Finding the next open date…"}
            </p>
            <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-zinc-500">
              {lang === "es"
                ? "Si este mes no tiene cupos, tocá el mes siguiente o «Próxima disponible»."
                : "If this month is full, try next month or “Next available.”"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="reservation-details-card" className={className}>
      <ReservationDetails
        key={`reservation-${initialSelectedTourSlug}-${requestedPackageId || "no-package"}`}
        selectedDate={selectedDay}
        currentMonth={currentMonth}
        monthName={monthName}
        tickets={tickets}
        setTickets={setTickets}
        onReserve={handleReserve}
        availability={availability}
        currentYear={currentYear}
        tours={tours}
        initialSelectedTourSlug={initialSelectedTourSlug}
        initialSelectedPackageId={requestedPackageId || undefined}
        hasPreselectedTour={hasPreselectedTour}
        ivaRatePercent={ivaRatePercent}
      />
    </div>
  );
}
