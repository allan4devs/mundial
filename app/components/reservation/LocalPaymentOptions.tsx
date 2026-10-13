"use client";

import { useMemo, useState } from "react";
import { Building2, CheckCircle2, Copy, MessageCircle, Smartphone } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import {
  buildReservationWhatsAppHref,
  type LocalPaymentMethod,
} from "@/lib/reservation/checkout-messages";
import type { OrderDetails } from "@/lib/types/index";

export type { LocalPaymentMethod };

type PendingBookingResult = {
  referenceCode: string;
  reservationId: string | null;
};

type Props = {
  method: LocalPaymentMethod;
  orderDetails: OrderDetails;
  lang: "es" | "en";
  packageLabel: string;
  timeLabel: string;
  analyticsMetadata: Record<string, unknown>;
  referenceCode: string | null;
  reservationId: string | null;
  isSaving: boolean;
  saveError: string | null;
  savePendingBooking: (paymentMethod: LocalPaymentMethod) => Promise<PendingBookingResult | null>;
};

const SINPE_PHONE_DISPLAY = "6233-2535";

export default function LocalPaymentOptions({
  method,
  orderDetails,
  lang,
  packageLabel,
  timeLabel,
  analyticsMetadata,
  referenceCode,
  reservationId,
  isSaving,
  saveError,
  savePendingBooking,
}: Props) {
  const isEs = lang === "es";
  const [copied, setCopied] = useState(false);

  const whatsappHref = useMemo(
    () =>
      buildReservationWhatsAppHref(orderDetails, lang, {
        packageLabel,
        timeLabel,
        referenceCode: referenceCode ?? undefined,
      }),
    [lang, orderDetails, packageLabel, referenceCode, timeLabel],
  );

  const handleWhatsAppClick = async () => {
    const saved = await savePendingBooking("whatsapp");
    if (!saved) return;

    trackAnalyticsEvent("whatsapp_checkout_click", {
      metadata: {
        ...analyticsMetadata,
        referenceCode: saved.referenceCode,
        reservationId: saved.reservationId,
      },
    });

    if (typeof window !== "undefined") {
      window.open(
        buildReservationWhatsAppHref(orderDetails, lang, {
          packageLabel,
          timeLabel,
          referenceCode: saved.referenceCode,
        }),
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const handleCopyReference = async () => {
    if (!referenceCode || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSinpeStart = async () => {
    trackAnalyticsEvent("sinpe_checkout_selected", { metadata: analyticsMetadata });
    await savePendingBooking("sinpe");
  };

  if (method === "whatsapp") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-relaxed text-emerald-50">
          {isEs
            ? "Confirmá tu reserva por WhatsApp con Allan o Verónica. Guardamos tu solicitud y te respondemos con disponibilidad y pago local si lo preferís."
            : "Confirm your booking on WhatsApp with our team. We save your request and reply with availability and local payment options if you prefer."}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            {isEs ? "Mensaje listo para enviar" : "Ready-to-send message"}
          </p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-zinc-200">
            {decodeURIComponent(whatsappHref.split("text=")[1] ?? "")}
          </pre>
        </div>

        {saveError && (
          <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100" role="alert">
            {saveError}
          </p>
        )}

        {referenceCode && (
          <div className="flex items-center gap-2 rounded-xl border border-teal-300/20 bg-teal-400/10 px-4 py-3 text-sm text-teal-100">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {isEs ? "Referencia guardada:" : "Reference saved:"}{" "}
              <strong>{referenceCode}</strong>
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleWhatsAppClick()}
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {isSaving
            ? isEs
              ? "Guardando solicitud..."
              : "Saving request..."
            : isEs
              ? "Confirmar por WhatsApp"
              : "Confirm via WhatsApp"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-50">
        {isEs
          ? "Pagá con SINPE Móvil o transferencia bancaria. Usá la referencia en el detalle del pago y envianos el comprobante por WhatsApp para confirmar."
          : "Pay with SINPE Móvil or bank transfer. Use the reference in the payment detail and send us the receipt on WhatsApp to confirm."}
      </div>

      {!referenceCode && (
        <button
          type="button"
          onClick={() => void handleSinpeStart()}
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? isEs ? "Generando referencia…" : "Generating reference…"
            : isEs ? "Generar referencia de pago" : "Generate payment reference"}
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2 text-teal-200">
            <Smartphone className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-[0.16em]">SINPE Móvil</p>
          </div>
          <p className="text-lg font-black text-white">{SINPE_PHONE_DISPLAY}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isEs ? "Al mismo número de WhatsApp de reservas." : "Same number as booking WhatsApp."}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2 text-teal-200">
            <Building2 className="h-4 w-4" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              {isEs ? "Transferencia" : "Bank transfer"}
            </p>
          </div>
          <p className="text-sm font-semibold text-zinc-100">
            {isEs
              ? "Coordinamos los datos bancarios por WhatsApp al enviar tu referencia."
              : "We share bank details on WhatsApp once you send your reference."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-teal-300/20 bg-teal-400/10 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200">
          {isEs ? "Monto a transferir" : "Amount to transfer"}
        </p>
        <p className="mt-1 text-3xl font-black text-white">${orderDetails.total.toFixed(2)} USD</p>
        <p className="mt-1 text-xs text-teal-100/80">
          {isEs
            ? "Si pagás en colones, usá el tipo de cambio del día y mencioná la referencia."
            : "If paying in colones, use the day's exchange rate and include the reference."}
        </p>
      </div>

      {isSaving && (
        <p className="text-sm text-zinc-400" role="status">
          {isEs ? "Generando referencia de pago..." : "Generating payment reference..."}
        </p>
      )}

      {saveError && (
        <p className="rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-100" role="alert">
          {saveError}
        </p>
      )}

      {referenceCode && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            {isEs ? "Referencia obligatoria" : "Required reference"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-2xl font-black tracking-wider text-white">{referenceCode}</span>
            <button
              type="button"
              onClick={() => void handleCopyReference()}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-teal-300 hover:text-teal-200"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {copied ? (isEs ? "Copiado" : "Copied") : isEs ? "Copiar" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {isEs
              ? "Incluí esta referencia en el detalle del SINPE o transferencia."
              : "Include this reference in your SINPE or transfer detail."}
          </p>
        </div>
      )}

      <a
        href={referenceCode ? whatsappHref : "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          if (!referenceCode) {
            event.preventDefault();
            return;
          }
          trackAnalyticsEvent("whatsapp_checkout_click", {
            metadata: {
              ...analyticsMetadata,
              referenceCode,
              reservationId,
              surface: "sinpe_receipt",
            },
          });
        }}
        aria-disabled={!referenceCode}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/15 px-5 py-3 text-sm font-bold text-[#9ef0b8] transition hover:bg-[#25D366]/25 ${!referenceCode ? "cursor-not-allowed opacity-45" : ""}`}
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
        {isEs ? "Enviar comprobante por WhatsApp" : "Send receipt on WhatsApp"}
      </a>
    </div>
  );
}
