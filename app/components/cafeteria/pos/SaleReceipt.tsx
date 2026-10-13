"use client";

import { Check } from "lucide-react";
import { IVA_RATE } from "../constants";
import { formatCRC } from "../helpers";
import { PAYMENT_METHODS } from "./constants";
import type { Lang } from "../types";
import type { CompletedSale } from "./types";

/**
 * Cierre de la venta. Lo que la caja necesita ver de un vistazo es el vuelto,
 * así que va grande y primero; el detalle queda debajo para revisar.
 */
export default function SaleReceipt({
  lang,
  sale,
  onNew,
  t,
}: {
  lang: Lang;
  sale: CompletedSale;
  onNew: () => void;
  t: (es: string, en: string) => string;
}) {
  const method = PAYMENT_METHODS.find((option) => option.id === sale.method);

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-[#00C4B0]/35 bg-[#211E1A]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00C4B0] text-[#0E2B27]">
          <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#76EBDE]">
            {t("Venta cerrada", "Sale closed")} · #{sale.number}
          </p>
          <p className="text-sm font-black text-white">
            {method ? method.label[lang] : sale.method} · {formatCRC(sale.totals.total)}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {sale.change !== undefined ? (
          <div className="rounded-xl border border-[#00C4B0]/35 bg-[#00C4B0]/10 p-4 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">
              {t("Vuelto", "Change")}
            </p>
            <p className="mt-1 font-display text-5xl font-black tracking-tight text-[#8EF2E6]">
              {formatCRC(sale.change)}
            </p>
            <p className="mt-1.5 text-[11px] font-bold text-white/40">
              {t("Recibido", "Received")} {formatCRC(sale.received ?? 0)}
            </p>
          </div>
        ) : null}

        <ul className="mt-4 space-y-1.5">
          {sale.lines.map((line) => (
            <li key={line.product.id} className="flex justify-between gap-3 text-xs">
              <span className="min-w-0 font-bold text-white/70">
                {line.qty}× {line.product.name[lang]}
                {line.product.variant ? (
                  <span className="text-white/35"> · {line.product.variant[lang]}</span>
                ) : null}
              </span>
              <span className="shrink-0 font-black text-white/80">
                {formatCRC(line.product.price * line.qty)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs font-bold text-white/45">
          <div className="flex justify-between">
            <dt>{t("Subtotal sin IVA", "Subtotal before VAT")}</dt>
            <dd>{formatCRC(sale.totals.base)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t(`IVA ${IVA_RATE}%`, `${IVA_RATE}% VAT`)}</dt>
            <dd>{formatCRC(sale.totals.iva)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-sm text-white">
            <dt>{t("Total", "Total")}</dt>
            <dd>{formatCRC(sale.totals.total)}</dd>
          </div>
        </dl>

        {/* En Costa Rica toda venta genera tiquete electrónico; esto no lo emite. */}
        <p className="mt-3 rounded-lg border border-[#F3A712]/25 bg-[#F3A712]/[0.07] px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-50/60">
          {t(
            "Esta caja no emite factura electrónica ni guarda la venta en ningún lado. Registre el tiquete en el sistema de facturación.",
            "This register does not issue an electronic invoice or store the sale anywhere. Record the receipt in your invoicing system.",
          )}
        </p>
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-xl bg-[#00C4B0] py-3.5 font-display text-base font-black uppercase tracking-tight text-[#0E2B27] transition hover:bg-[#39D6C5]"
        >
          {t("Nueva orden", "New order")}
        </button>
      </div>
    </div>
  );
}
