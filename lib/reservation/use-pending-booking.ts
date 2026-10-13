"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderDetails } from "@/lib/types/index";
import type { LocalPaymentMethod } from "@/lib/reservation/checkout-messages";

type PendingBookingResult = {
  referenceCode: string;
  reservationId: string | null;
};

export function usePendingBooking(orderDetails: OrderDetails, lang: "es" | "en") {
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveInFlightRef = useRef(false);
  const isEs = lang === "es";
  const bookingIdentity = [
    orderDetails.name,
    orderDetails.email,
    orderDetails.phone,
    orderDetails.tickets,
    orderDetails.total,
    orderDetails.dateIso ?? orderDetails.date,
    orderDetails.tourTime,
    orderDetails.packageId,
    orderDetails.tourPackage,
    orderDetails.tourSlug,
  ].join("|");

  useEffect(() => {
    setReferenceCode(null);
    setReservationId(null);
    setSaveError(null);
    setIsSaving(false);
    saveInFlightRef.current = false;
  }, [bookingIdentity]);

  const savePendingBooking = useCallback(
    async (paymentMethod: LocalPaymentMethod): Promise<PendingBookingResult | null> => {
      if (referenceCode) {
        return { referenceCode, reservationId };
      }
      if (saveInFlightRef.current) return null;

      saveInFlightRef.current = true;
      setIsSaving(true);
      setSaveError(null);

      try {
        const res = await fetch("/api/bookings/pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...orderDetails,
            date: orderDetails.dateIso ?? orderDetails.date,
            paymentMethod,
            language: lang,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data?.referenceCode) {
          const reason =
            typeof data?.message === "string"
              ? data.message
              : isEs
                ? "No pudimos guardar la reserva pendiente."
                : "We couldn't save the pending booking.";
          setSaveError(reason);
          return null;
        }

        const nextReference = data.referenceCode as string;
        const nextReservationId =
          typeof data.reservationId === "string" ? data.reservationId : null;

        setReferenceCode(nextReference);
        setReservationId(nextReservationId);
        return {
          referenceCode: nextReference,
          reservationId: nextReservationId,
        };
      } catch {
        setSaveError(
          isEs
            ? "Error de conexión. Intentá de nuevo o escribinos por WhatsApp."
            : "Connection error. Try again or message us on WhatsApp.",
        );
        return null;
      } finally {
        saveInFlightRef.current = false;
        setIsSaving(false);
      }
    },
    [isEs, lang, orderDetails, referenceCode, reservationId],
  );

  return {
    referenceCode,
    reservationId,
    isSaving,
    saveError,
    savePendingBooking,
  };
}
