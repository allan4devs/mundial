"use client";

import React, { useMemo, useState } from "react";
import { Building2, CalendarDays, Clock3, CreditCard, Mail, MessageCircle, Phone, ShieldCheck, Ticket, UserRound } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";
import type { OrderDetails } from "@/lib/types/index";
import LocalPaymentOptions, { type LocalPaymentMethod } from "@/app/components/reservation/LocalPaymentOptions";
import { useCheckoutQuote } from "@/app/components/reservation/hooks/useCheckoutQuote";
import { ADDON_DATA } from "@/lib/reservation/addons";
import { usePendingBooking } from "@/lib/reservation/use-pending-booking";
import { usePayPalCheckout } from "@/app/components/reservation/hooks/usePayPalCheckout";
import { buildBookingAnalyticsMetadata } from "@/app/components/reservation/checkoutUtils";

const SummaryRow = ({
  icon,
  label,
  value,
  prominent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  prominent?: boolean;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className={`mt-0.5 break-words leading-snug text-zinc-100 ${prominent ? "text-lg font-black" : "text-sm font-semibold"}`}>
        {value}
      </p>
    </div>
  </div>
);

type PaymentMethod = "paypal" | LocalPaymentMethod;

type Props = {
  orderDetails: OrderDetails;
  onSuccess: (orderData: unknown) => void;
};

export default function PaymentCheckoutContent({ orderDetails, onSuccess }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paypal");
  const { lang } = useLanguage();
  const tr = translations[lang].payment;

  const {
    name,
    email,
    phone,
    tickets,
    total: initialTotal,
    date,
    tourTime,
    tourPackage,
    tourName,
    packagePrice,
  } = orderDetails;

  const checkoutQuote = useCheckoutQuote(orderDetails, lang);
  const total = checkoutQuote.total;
  const checkoutOrderDetails = useMemo(
    () => ({
      ...orderDetails,
      total: checkoutQuote.total,
      addonsPrice: checkoutQuote.addonsPrice,
      addonsPricePerPerson: checkoutQuote.addonsPricePerPerson,
      addonsBreakdown: checkoutQuote.addonsBreakdown,
      transportQuote: checkoutQuote.transportQuote,
    }),
    [checkoutQuote, orderDetails],
  );

  const packageName = (tr.packages as Record<string, string>)[tourPackage] ?? tourPackage;
  const formattedTime = tr.timeLabels[tourTime] ?? tourTime;
  const {
    referenceCode,
    reservationId,
    isSaving: isPendingSaving,
    saveError: pendingSaveError,
    savePendingBooking,
  } = usePendingBooking(checkoutOrderDetails, lang);
  const {
    paypalRef,
    paypalLoadError,
    isPaypalLoading: isPayPalSdkLoading,
  } = usePayPalCheckout({
    enabled: paymentMethod === "paypal" && checkoutQuote.synced && !checkoutQuote.syncing && !checkoutQuote.error,
    orderDetails: checkoutOrderDetails,
    lang,
    errorMessage: tr.error,
    onSuccess,
  });
  const isPaypalLoading = checkoutQuote.syncing || isPayPalSdkLoading;
  const localPaymentAnalyticsMetadata = useMemo(
    () => ({
      ...buildBookingAnalyticsMetadata(checkoutOrderDetails, lang),
      addonsBreakdown: checkoutQuote.addonsBreakdown,
    }),
    [checkoutOrderDetails, checkoutQuote.addonsBreakdown, lang],
  );

  const paymentCopy = {
    contactTitle: lang === "es" ? "Datos del viajero" : "Traveler details",
    bookingTitle: lang === "es" ? "Resumen de reserva" : "Booking summary",
    paymentTitle: lang === "es" ? "Elegí cómo pagar" : "Choose how to pay",
    paymentSubtitle: lang === "es"
      ? "PayPal, tarjeta, WhatsApp o SINPE. Elegí la opción que te quede más cómoda para confirmar tu aventura."
      : "PayPal, card, WhatsApp, or SINPE. Pick the option that works best to confirm your adventure.",
    checkoutHint: lang === "es"
      ? "PayPal confirma al instante. WhatsApp y SINPE quedan pendientes hasta que el equipo valide tu pago."
      : "PayPal confirms instantly. WhatsApp and SINPE stay pending until our team validates your payment.",
    dateLabel: lang === "es" ? "Fecha" : "Date",
    guestsLabel: lang === "es" ? "Personas" : "Guests",
    tourLabel: lang === "es" ? "Experiencia" : "Experience",
    packagePriceLabel: lang === "es" ? "Tarifa" : "Rate",
    methods: {
      paypal: lang === "es" ? "PayPal / Tarjeta" : "PayPal / Card",
      whatsapp: "WhatsApp",
      sinpe: "SINPE",
    },
  };

  const addonSummaryLines = useMemo(() => {
    const breakdown = checkoutQuote.addonsBreakdown;
    if (!breakdown.length) return [];

    return breakdown.map((item) => {
      const addon = ADDON_DATA.find((entry) => entry.id === item.id);
      const label = addon ? (lang === "es" ? addon.nameEs : addon.nameEn) : item.id;
      return `${label} (+$${item.pricePerPerson}/${lang === "es" ? "persona" : "person"})`;
    });
  }, [checkoutQuote.addonsBreakdown, lang]);

  const paymentTabs: Array<{ id: PaymentMethod; label: string; icon: React.ReactNode }> = [
    { id: "paypal", label: paymentCopy.methods.paypal, icon: <CreditCard className="h-4 w-4" aria-hidden /> },
    { id: "whatsapp", label: paymentCopy.methods.whatsapp, icon: <MessageCircle className="h-4 w-4" aria-hidden /> },
    { id: "sinpe", label: paymentCopy.methods.sinpe, icon: <Building2 className="h-4 w-4" aria-hidden /> },
  ];


  const methodHints: Record<PaymentMethod, string> = {
    paypal: lang === "es" ? "Confirmación al instante" : "Instant confirmation",
    whatsapp: lang === "es" ? "Reserva con el equipo" : "Book with the team",
    sinpe: lang === "es" ? "Transferencia local CR" : "Local CR transfer",
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)]">
      <aside className="order-2 space-y-4 lg:order-1">
        <section className="rounded-2xl border border-white/10 bg-zinc-950/45 p-4 shadow-inner shadow-black/20">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-teal-300" aria-hidden />
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-300">{paymentCopy.contactTitle}</h2>
          </div>
          <div className="space-y-3">
            <SummaryRow icon={<UserRound className="h-4 w-4" aria-hidden />} label={tr.nameLabel} value={name} />
            <SummaryRow icon={<Mail className="h-4 w-4" aria-hidden />} label={tr.emailLabel} value={email} />
            <SummaryRow icon={<Phone className="h-4 w-4" aria-hidden />} label={tr.phoneLabel} value={phone} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-950/45 p-4 shadow-inner shadow-black/20">
          <div className="mb-3 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-teal-300" aria-hidden />
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-300">{paymentCopy.bookingTitle}</h2>
          </div>
          <div className="space-y-3">
            <SummaryRow icon={<Ticket className="h-4 w-4" aria-hidden />} label={paymentCopy.tourLabel} value={tourName} />
            <SummaryRow icon={<CalendarDays className="h-4 w-4" aria-hidden />} label={paymentCopy.dateLabel} value={date} />
            <SummaryRow icon={<Clock3 className="h-4 w-4" aria-hidden />} label={tr.tourTime} value={formattedTime} />
            <SummaryRow
              icon={<UserRound className="h-4 w-4" aria-hidden />}
              label={paymentCopy.guestsLabel}
              value={`${tickets} ${tickets === 1 ? tr.person : tr.persons}`}
            />
            <SummaryRow
              icon={<CreditCard className="h-4 w-4" aria-hidden />}
              label={paymentCopy.packagePriceLabel}
              value={`${packageName} ($${packagePrice} USD/${tr.pricePerPersonUnit})`}
            />
            {addonSummaryLines.length > 0 && (
              <SummaryRow
                icon={<Ticket className="h-4 w-4" aria-hidden />}
                label={lang === "es" ? "Extras" : "Add-ons"}
                value={(
                  <span className="block space-y-1">
                    {addonSummaryLines.map((line) => (
                      <span key={line} className="block">{line}</span>
                    ))}
                  </span>
                )}
              />
            )}
          </div>
        </section>
      </aside>

      <section className="order-1 rounded-2xl border border-teal-300/20 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_34%),rgba(10,10,12,0.72)] p-4 shadow-2xl shadow-black/30 sm:p-5 lg:order-2">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {paymentCopy.paymentTitle}
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">{paymentCopy.paymentSubtitle}</p>
          </div>
          <div className="rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 py-3 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200">{tr.total}</p>
            <p className="text-3xl font-black leading-none text-white">
              {checkoutQuote.syncing ? "…" : `$${total.toFixed(2)}`}
            </p>
            {checkoutQuote.syncing && (
              <p className="mt-1 text-xs font-medium text-teal-100/80">
                {lang === "es" ? "Validando extras..." : "Validating add-ons..."}
              </p>
            )}
            {checkoutQuote.error && (
              <p className="mt-1 text-xs font-medium text-red-200">{checkoutQuote.error}</p>
            )}
            {!checkoutQuote.syncing && !checkoutQuote.error && Math.abs(initialTotal - total) >= 0.02 && (
              <p className="mt-1 text-xs font-medium text-amber-100">
                {lang === "es" ? "Total actualizado con extras." : "Total updated with add-ons."}
              </p>
            )}
          </div>
        </div>

        <div
          className="mb-4 grid gap-2 sm:grid-cols-3"
          role="tablist"
          aria-label={paymentCopy.paymentTitle}
        >
          {paymentTabs.map((tab) => {
            const isActive = paymentMethod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setPaymentMethod(tab.id)}
                className={[
                  "flex min-h-[4.25rem] flex-col items-start justify-center gap-1 rounded-2xl border px-3 py-2.5 text-left transition",
                  isActive
                    ? "border-teal-300/50 bg-teal-400/15 text-teal-50 shadow-inner shadow-teal-900/20"
                    : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.08em]">
                  {tab.icon}
                  {tab.label}
                </span>
                <span className={`text-[11px] font-medium ${isActive ? "text-teal-100/90" : "text-zinc-500"}`}>
                  {methodHints[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-300">
          {paymentCopy.checkoutHint}
        </div>

        {checkoutQuote.error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-5 text-center text-sm text-red-100" role="alert">
            <p className="font-semibold">{checkoutQuote.error}</p>
            <button
              type="button"
              onClick={checkoutQuote.retry}
              className="mt-3 rounded-full border border-red-200/40 px-4 py-2 text-xs font-black transition hover:bg-red-200/10"
            >
              {lang === "es" ? "Validar de nuevo" : "Validate again"}
            </button>
          </div>
        ) : paymentMethod === "paypal" ? (
          <div className="relative min-h-[160px] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            {isPaypalLoading && (
              <div
                className="absolute inset-3 z-10 flex min-h-[140px] items-center justify-center rounded-xl border border-emerald-100/20 bg-zinc-950/90 px-4 text-center text-sm font-medium text-emerald-100 shadow-sm"
                role="status"
                aria-live="polite"
              >
                <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-emerald-200/30 border-t-emerald-300" aria-hidden="true" />
                {tr.loadingPaymentInfo}
              </div>
            )}
            {paypalLoadError && (
              <div
                className="min-h-[140px] rounded-xl border border-red-400/30 bg-red-950/40 px-4 py-5 text-sm text-red-100 shadow-sm"
                role="alert"
              >
                <p className="font-semibold">{tr.error}</p>
                <p className="mt-2 break-words text-xs opacity-90">{paypalLoadError}</p>
              </div>
            )}
            <div ref={paypalRef} className="min-h-[140px] w-full" />
          </div>
        ) : (
          <LocalPaymentOptions
            method={paymentMethod}
            orderDetails={checkoutOrderDetails}
            lang={lang}
            packageLabel={packageName}
            timeLabel={formattedTime}
            analyticsMetadata={localPaymentAnalyticsMetadata}
            referenceCode={referenceCode}
            reservationId={reservationId}
            isSaving={isPendingSaving}
            saveError={pendingSaveError}
            savePendingBooking={savePendingBooking}
          />
        )}
      </section>
    </div>
  );
}
