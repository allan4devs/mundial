"use client";

import { useEffect, useState } from "react";
import {
  isTransportConfigComplete,
  resolveTransportEndpoints,
  type TransportQuoteResult,
} from "@/lib/reservation/transport";
import type { ReservationAddonDetails } from "@/lib/reservation/types";

export function useTransportQuote({
  enabled,
  addonDetails,
  tickets,
}: {
  enabled: boolean;
  addonDetails: ReservationAddonDetails;
  tickets: number;
}) {
  const [transportQuote, setTransportQuote] = useState<TransportQuoteResult | null>(null);
  const [transportLoading, setTransportLoading] = useState(false);
  const [transportError, setTransportError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchQuote() {
      if (!enabled || !isTransportConfigComplete(addonDetails)) {
        setTransportQuote(null);
        setTransportError(null);
        setTransportLoading(false);
        return;
      }

      const { pickup, dropoff } = resolveTransportEndpoints(addonDetails);

      setTransportLoading(true);
      setTransportError(null);

      try {
        const res = await fetch("/api/transport/calc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup,
            dropoff,
            transportType: addonDetails.transportType ?? "private",
            pax: tickets,
          }),
        });

        const data = await res.json();
        if (!mounted) return;
        if (!res.ok || !data?.ok) {
          setTransportQuote(null);
          setTransportError(data?.error ?? "Failed to fetch transport quote");
        } else {
          setTransportQuote(data.result ?? null);
          setTransportError(null);
        }
      } catch {
        if (!mounted) return;
        setTransportQuote(null);
        setTransportError("Error contacting transport API");
      } finally {
        if (mounted) setTransportLoading(false);
      }
    }

    fetchQuote();
    return () => {
      mounted = false;
    };
  }, [
    enabled,
    addonDetails.pickupLocation,
    addonDetails.dropoffLocation,
    addonDetails.transportType,
    tickets,
  ]);

  return { transportQuote, transportLoading, transportError };
}