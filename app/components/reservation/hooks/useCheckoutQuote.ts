"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderDetails } from "@/lib/types/index";
import type { TransportQuoteResult } from "@/lib/reservation/transport";

type CheckoutQuoteState = {
  total: number;
  addonsPricePerPerson: number;
  addonsPrice: number;
  addonsBreakdown: Array<{ id: string; pricePerPerson: number }>;
  transportQuote: TransportQuoteResult | null;
  synced: boolean;
  syncing: boolean;
  error: string | null;
};

export function useCheckoutQuote(orderDetails: OrderDetails, lang: "es" | "en") {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<CheckoutQuoteState>({
    total: orderDetails.total,
    addonsPricePerPerson: orderDetails.addonsPricePerPerson ?? 0,
    addonsPrice: orderDetails.addonsPrice ?? 0,
    addonsBreakdown: orderDetails.addonsBreakdown ?? [],
    transportQuote: orderDetails.transportQuote ?? null,
    synced: false,
    syncing: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function syncQuote() {
      setState((current) => ({ ...current, syncing: true, error: null }));

      try {
        const res = await fetch("/api/reservation/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: orderDetails.name,
            email: orderDetails.email,
            phone: orderDetails.phone,
            tickets: orderDetails.tickets,
            total: orderDetails.total,
            date: orderDetails.dateIso ?? orderDetails.date,
            dateIso: orderDetails.dateIso,
            tourTime: orderDetails.tourTime,
            packageId: orderDetails.packageId,
            tourPackage: orderDetails.tourPackage,
            tourSlug: orderDetails.tourSlug,
            tourName: orderDetails.tourName,
            packagePrice: orderDetails.packagePrice,
            addons: orderDetails.addons,
            addonIds: orderDetails.addonIds,
            addonDetails: orderDetails.addonDetails,
            specialRequests: orderDetails.specialRequests,
            language: lang,
          }),
        });

        const data = await res.json();
        if (!mounted) return;

        if (!res.ok || !data?.success) {
          setState((current) => ({
            ...current,
            syncing: false,
            synced: false,
            error: typeof data?.message === "string"
              ? data.message
              : (lang === "es" ? "No pudimos validar el total." : "We couldn't validate the total."),
          }));
          return;
        }

        const nextTotal = Number(data.totalWithTax);
        const nextAddonsPricePerPerson = Number(data.addonsPricePerPerson ?? 0);
        const nextAddonsPrice = Number(data.addonsPrice ?? 0);
        const nextBreakdown = Array.isArray(data.addonsBreakdown) ? data.addonsBreakdown : [];
        const nextTransportQuote = data.transportQuote ?? null;

        setState({
          total: nextTotal,
          addonsPricePerPerson: nextAddonsPricePerPerson,
          addonsPrice: nextAddonsPrice,
          addonsBreakdown: nextBreakdown,
          transportQuote: nextTransportQuote,
          synced: true,
          syncing: false,
          error: null,
        });

        const stored = {
          ...orderDetails,
          total: nextTotal,
          addonsPricePerPerson: nextAddonsPricePerPerson,
          addonsPrice: nextAddonsPrice,
          addonsBreakdown: nextBreakdown,
          transportQuote: nextTransportQuote,
        };
        sessionStorage.setItem("reservationOrderDetails", JSON.stringify(stored));
      } catch {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          syncing: false,
          synced: false,
          error: lang === "es"
            ? "Error de conexión al validar el total."
            : "Connection error while validating the total.",
        }));
      }
    }

    syncQuote();
    return () => {
      mounted = false;
    };
  }, [
    lang,
    orderDetails.addonDetails,
    orderDetails.addonIds,
    orderDetails.date,
    orderDetails.dateIso,
    orderDetails.email,
    orderDetails.name,
    orderDetails.packageId,
    orderDetails.packagePrice,
    orderDetails.phone,
    orderDetails.tickets,
    orderDetails.tourPackage,
    orderDetails.tourSlug,
    orderDetails.tourTime,
    orderDetails.total,
    requestVersion,
  ]);

  const retry = useCallback(() => setRequestVersion((version) => version + 1), []);
  return useMemo(() => ({ ...state, retry }), [retry, state]);
}
