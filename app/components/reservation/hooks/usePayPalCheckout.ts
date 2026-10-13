"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import type { OrderDetails } from "@/lib/types/index";
import { RESERVATION_TRAVELER_DRAFT_KEY } from "@/lib/reservation/constants";
import { getPayPalLocaleForCountry } from "@/app/components/reservation/paypalLocales";
import {
  buildBookingAnalyticsMetadata,
  buildCheckoutKey,
  getBuyerCountryFromPhone,
} from "@/app/components/reservation/checkoutUtils";

declare global {
  interface Window {
    paypal?: { Buttons: (config: unknown) => { render: (container: HTMLDivElement) => Promise<void> | void } };
  }
}

function isLivePayPalMode(mode: string | undefined) {
  const normalizedMode = mode?.trim().toLowerCase();
  return normalizedMode === "live" || normalizedMode === "production" || normalizedMode === "prod";
}

function isConfiguredPayPalClientId(clientId: string | undefined): clientId is string {
  if (!clientId) return false;

  const normalizedClientId = clientId.trim().toLowerCase();
  return Boolean(normalizedClientId) && !normalizedClientId.startsWith("your-");
}

function getCheckoutErrorMessage(payload: { code?: string; message?: string }, fallback: string, lang: string) {
  const isEs = lang === "es";
  if (payload.code === "capacity") {
    return isEs
      ? "Esos cupos se acaban de ocupar. Volvé a la reserva para elegir otra fecha o menos personas."
      : "Those spots were just taken. Return to booking to choose another date or fewer guests.";
  }
  if (payload.code === "total_mismatch") {
    return isEs
      ? "El total cambió antes del pago. Volvé a revisar la reserva."
      : "The total changed before payment. Please review the booking again.";
  }
  if (payload.code === "booking_context_missing" || payload.code === "capture_validation_unavailable") {
    return isEs
      ? "No pudimos verificar la reserva antes de cobrar. Intentá nuevamente en un momento."
      : "We couldn't verify the booking before charging. Please try again in a moment.";
  }
  return payload.message || fallback;
}

export function usePayPalCheckout({
  enabled,
  orderDetails,
  lang,
  errorMessage,
  onSuccess,
}: {
  enabled: boolean;
  orderDetails: OrderDetails;
  lang: string;
  errorMessage: string;
  onSuccess: (orderData: unknown) => void;
}) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loadedPaypalKey, setLoadedPaypalKey] = useState<string | null>(null);
  const [paypalLoadFailure, setPaypalLoadFailure] = useState<{ checkoutKey: string; message: string } | null>(null);
  const router = useRouter();

  const checkoutKey = useMemo(() => buildCheckoutKey(orderDetails, lang), [orderDetails, lang]);
  const bookingAnalyticsMetadata = useMemo(
    () => buildBookingAnalyticsMetadata(orderDetails, lang),
    [orderDetails, lang],
  );
  const paypalLoadError = paypalLoadFailure?.checkoutKey === checkoutKey ? paypalLoadFailure.message : null;
  const isPaypalLoading = enabled && !paypalLoadError && loadedPaypalKey !== checkoutKey;

  useEffect(() => {
    if (!enabled) return;

    const paypalContainer = paypalRef.current;
    let isMounted = true;
    let scriptForCleanup: HTMLScriptElement | null = null;
    let loadFallbackAttempted = false;

    trackAnalyticsEvent("booking_checkout_started", {
      metadata: bookingAnalyticsMetadata,
    });

    const finishLoading = () => {
      if (isMounted) setLoadedPaypalKey(checkoutKey);
    };

    const failPayPalLoad = (stage: string, reason: string, error?: unknown) => {
      if (isMounted) {
        setPaypalLoadFailure({ checkoutKey, message: reason });
        setLoadedPaypalKey(checkoutKey);
      }

      trackAnalyticsEvent("payment_error", {
        metadata: {
          ...bookingAnalyticsMetadata,
          stage,
          reason,
        },
      });

      const sdkError = error instanceof Error ? error : new Error(reason);
      console.error(`PAYPAL SDK ERROR (${stage}):`, sdkError);
    };

    const initializeButtons = () => {
      if (!paypalContainer) {
        failPayPalLoad("paypal_container", "PayPal button container was not found.");
        return;
      }

      if (!window.paypal) {
        failPayPalLoad("paypal_sdk_load", "PayPal SDK loaded, but window.paypal is unavailable.");
        return;
      }

      paypalContainer.innerHTML = "";

      const buttons = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "pill",
          label: "paypal",
        },
        createOrder: async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingAttemptId: orderDetails.bookingAttemptId,
              name: orderDetails.name,
              email: orderDetails.email,
              phone: orderDetails.phone,
              tickets: orderDetails.tickets,
              date: orderDetails.dateIso ?? orderDetails.date,
              total: orderDetails.total,
              tourTime: orderDetails.tourTime,
              packageId: orderDetails.packageId,
              tourPackage: orderDetails.tourPackage,
              packagePrice: orderDetails.packagePrice,
              tourSlug: orderDetails.tourSlug,
              tourName: orderDetails.tourName,
              addons: orderDetails.addons,
              addonIds: orderDetails.addonIds,
              addonDetails: orderDetails.addonDetails,
              specialRequests: orderDetails.specialRequests,
              language: lang,
              countryCode: getBuyerCountryFromPhone(orderDetails.phone),
            }),
          });

          const data = await res.json();

          if (!res.ok || !data?.orderID) {
            const reason = getCheckoutErrorMessage(
              data ?? {},
              "PayPal create order response did not include orderID.",
              lang,
            );
            const minDate = typeof data?.minBookableDate === "string" ? data.minBookableDate : null;
            alert(minDate ? `${reason} Earliest available date: ${minDate}.` : reason);
            throw new Error(reason);
          }

          trackAnalyticsEvent("payment_order_created", {
            metadata: {
              ...bookingAnalyticsMetadata,
              orderId: data.orderID,
            },
          });

          return data.orderID as string;
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          });

          const output = await res.json();

          if (!res.ok || !output?.captureID || output?.status !== "COMPLETED") {
            console.error("PAYPAL CAPTURE FAILED:", output);
            trackAnalyticsEvent("payment_error", {
              metadata: {
                ...bookingAnalyticsMetadata,
                orderId: data.orderID,
                stage: "capture",
                status: output?.status ?? null,
                reason: output?.message ?? "capture_failed",
              },
            });
            alert(getCheckoutErrorMessage(output ?? {}, errorMessage, lang));
            return;
          }

          trackAnalyticsEvent("payment_approved", {
            metadata: {
              ...bookingAnalyticsMetadata,
              orderId: data.orderID,
              captureId: output.captureID,
              status: output.status,
            },
          });

          sessionStorage.removeItem("reservationOrderDetails");
          sessionStorage.removeItem(RESERVATION_TRAVELER_DRAFT_KEY);
          onSuccess(output);
          router.push(`/success?orderId=${output.id}`);
        },
        onError: (err: unknown) => {
          alert(errorMessage);
          trackAnalyticsEvent("payment_error", {
            metadata: {
              ...bookingAnalyticsMetadata,
              stage: "paypal_buttons",
              reason: err instanceof Error ? err.message : "paypal_error",
            },
          });
          console.error("PAYPAL ERROR:", err);
        },
      });

      Promise.resolve(buttons.render(paypalContainer))
        .then(finishLoading)
        .catch((err: unknown) => {
          failPayPalLoad("paypal_render", err instanceof Error ? err.message : "paypal_render_error", err);
        });
    };

    const mode = process.env.NEXT_PUBLIC_PAYPAL_MODE;
    const isLiveMode = isLivePayPalMode(mode);
    const clientId = (isLiveMode
      ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID)?.trim();

    if (!isConfiguredPayPalClientId(clientId)) {
      failPayPalLoad(
        "paypal_config",
        `Missing or placeholder PayPal ${isLiveMode ? "live" : "sandbox"} client ID for mode "${mode || "sandbox"}".`,
      );
      return;
    }

    const buildSdkSrc = (locale?: string) => {
      const sdkParams = new URLSearchParams({
        "client-id": clientId,
        components: "buttons",
        currency: "USD",
        intent: "capture",
      });

      if (locale) sdkParams.set("locale", locale);
      return `https://www.paypal.com/sdk/js?${sdkParams.toString()}`;
    };

    const buyerCountryCode = getBuyerCountryFromPhone(orderDetails.phone);
    const requestedLocale = getPayPalLocaleForCountry(buyerCountryCode, lang);
    const sdkSrc = buildSdkSrc(requestedLocale);
    const fallbackSdkSrc = buildSdkSrc();

    const handleScriptError = (failedSrc: string) => {
      document.querySelector<HTMLScriptElement>("#paypal-sdk")?.remove();

      if (failedSrc !== fallbackSdkSrc && !loadFallbackAttempted) {
        loadFallbackAttempted = true;
        trackAnalyticsEvent("payment_error", {
          metadata: {
            ...bookingAnalyticsMetadata,
            stage: "paypal_sdk_locale_fallback",
            reason: "paypal_sdk_locale_load_error",
            requestedLocale,
            buyerCountryCode,
          },
        });
        loadSdkScript(fallbackSdkSrc);
        return;
      }

      failPayPalLoad("paypal_sdk_load", "paypal_sdk_load_error");
      alert(errorMessage);
    };

    const loadSdkScript = (src: string) => {
      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = src;
      script.async = true;
      scriptForCleanup = script;

      script.onload = () => {
        if (isMounted) initializeButtons();
      };
      script.onerror = () => handleScriptError(src);

      document.body.appendChild(script);
    };

    const existing = document.querySelector<HTMLScriptElement>("#paypal-sdk");
    if (existing && existing.src !== sdkSrc) {
      existing.remove();
    }

    const activeScript = document.querySelector<HTMLScriptElement>("#paypal-sdk");

    if (!activeScript) {
      loadSdkScript(sdkSrc);
    } else if (window.paypal) {
      initializeButtons();
    } else {
      activeScript.addEventListener("load", initializeButtons, { once: true });
      activeScript.addEventListener("error", () => handleScriptError(activeScript.src), { once: true });
    }

    return () => {
      isMounted = false;
      activeScript?.removeEventListener("load", initializeButtons);
      if (scriptForCleanup) {
        scriptForCleanup.onload = null;
        scriptForCleanup.onerror = null;
      }
      if (paypalContainer) {
        paypalContainer.innerHTML = "";
      }
    };
  }, [bookingAnalyticsMetadata, checkoutKey, enabled, errorMessage, lang, onSuccess, orderDetails, router]);

  return {
    paypalRef,
    paypalLoadError,
    isPaypalLoading,
  };
}
