"use client";

import { useState } from "react";
import { ArrowLeft, Check, Delete } from "lucide-react";
import { SINPE_PHONE } from "../constants";
import { formatCRC } from "../helpers";
import { PAYMENT_METHODS, QUICK_CASH } from "./constants";
import type { Lang } from "../types";
import type { OrderTotals, PaymentMethod } from "./types";

/**
 * El cobro. En efectivo los billetes se van sumando con cada toque, igual que
 * se cuentan en la mano, y el vuelto sale solo.
 */
export default function PaymentPanel({
  lang,
  totals,
  onBack,
  onConfirm,
  t,
}: {
  lang: Lang;
  totals: OrderTotals;
  onBack: () => void;
  onConfirm: (method: PaymentMethod, received?: number) => void;
  t: (es: string, en: string) => string;
}) {
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [received, setReceived] = useState(0);

  const isCash = method === "efectivo";
  const change = received - totals.total;
  const canConfirm = !isCash || received >= totals.total;

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-white/12 bg-[#211E1A]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white transition hover:border-[#00C4B0]/60"
          aria-label={t("Volver a la orden", "Back to the order")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#76EBDE]">
            {t("A cobrar", "Amount due")}
          </p>
          <p className="font-display text-2xl font-black tracking-tight text-white">
            {formatCRC(totals.total)}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {PAYMENT_METHODS.map((option) => {
            const Icon = option.icon;
            const active = option.id === method;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setMethod(option.id);
                  setReceived(0);
                }}
                aria-pressed={active}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-[#00C4B0] bg-[#00C4B0]/12"
                    : "border-white/12 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-[#00C4B0]" : "text-white/45"}`}
                  aria-hidden
                />
                <p className="mt-2 text-sm font-black text-white">{option.label[lang]}</p>
                <p className="mt-0.5 text-[11px] font-semibold leading-tight text-white/40">
                  {option.note[lang]}
                </p>
              </button>
            );
          })}
        </div>

        {isCash ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                {t("Recibido", "Received")}
              </p>
              <p className="font-display text-2xl font-black tracking-tight text-white">
                {formatCRC(received)}
              </p>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {QUICK_CASH.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setReceived((r) => r + amount)}
                  className="rounded-xl border border-white/12 bg-white/[0.04] py-3 font-display text-base font-black text-white transition hover:border-[#00C4B0]/60 active:scale-[0.97]"
                >
                  +{formatCRC(amount)}
                </button>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReceived(totals.total)}
                className="rounded-xl border border-[#F3A712]/45 bg-[#F3A712]/10 py-3 text-sm font-black text-[#FFD67A] transition hover:bg-[#F3A712]/20"
              >
                {t("Exacto", "Exact")}
              </button>
              <button
                type="button"
                onClick={() => setReceived(0)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 py-3 text-sm font-black text-white/55 transition hover:border-white/30 hover:text-white"
              >
                <Delete className="h-4 w-4" aria-hidden />
                {t("Borrar", "Clear")}
              </button>
            </div>

            <div
              className={`mt-3 rounded-xl border p-3.5 ${
                change >= 0
                  ? "border-[#00C4B0]/35 bg-[#00C4B0]/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                {change >= 0 ? t("Vuelto", "Change") : t("Falta", "Still owed")}
              </p>
              <p
                className={`mt-1 font-display text-3xl font-black tracking-tight ${
                  change >= 0 ? "text-[#8EF2E6]" : "text-white/35"
                }`}
              >
                {formatCRC(Math.abs(change))}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-white/12 bg-white/[0.03] p-4">
            {method === "sinpe" ? (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/50">
                  {t("SINPE Móvil a", "SINPE Móvil to")}
                </p>
                <p className="mt-1 font-display text-3xl font-black tracking-tight text-white">
                  {SINPE_PHONE}
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-white/45">
                  {t(
                    "Confirme el comprobante en el teléfono antes de cerrar la venta.",
                    "Check the confirmation on the phone before closing the sale.",
                  )}
                </p>
              </>
            ) : (
              <p className="text-xs font-semibold leading-relaxed text-white/45">
                {t(
                  "Cobre en el datáfono y cierre la venta cuando la transacción sea aprobada.",
                  "Charge on the card terminal and close the sale once it is approved.",
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => onConfirm(method, isCash ? received : undefined)}
          disabled={!canConfirm}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00C4B0] py-3.5 font-display text-base font-black uppercase tracking-tight text-[#0E2B27] transition hover:bg-[#39D6C5] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        >
          <Check className="h-5 w-5" aria-hidden />
          {t("Cerrar venta", "Close sale")}
        </button>
      </div>
    </div>
  );
}
