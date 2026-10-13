"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { IVA_RATE } from "../constants";
import { formatCRC } from "../helpers";
import type { Lang } from "../types";
import type { OrderLine, OrderTotals } from "./types";

/** La orden en curso, con el desglose de IVA que lleva un tiquete en CR. */
export default function OrderPanel({
  lang,
  lines,
  totals,
  orderNumber,
  onStep,
  onRemove,
  onClear,
  onCharge,
  t,
}: {
  lang: Lang;
  lines: OrderLine[];
  totals: OrderTotals;
  orderNumber: number;
  onStep: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCharge: () => void;
  t: (es: string, en: string) => string;
}) {
  const empty = lines.length === 0;

  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-white/12 bg-[#211E1A]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#76EBDE]">
            {t("Orden", "Order")} #{orderNumber}
          </p>
          <p className="mt-0.5 text-sm font-black text-white">
            {totals.units} {totals.units === 1 ? t("ítem", "item") : t("ítems", "items")}
          </p>
        </div>
        {!empty ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-black text-white/60 transition hover:border-red-400/50 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {t("Vaciar", "Clear")}
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <ShoppingBag className="h-9 w-9 text-white/20" strokeWidth={1.6} aria-hidden />
            <p className="text-sm font-semibold text-white/35">
              {t("Toque un producto para empezar", "Tap a product to start")}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {lines.map((line) => (
              <li
                key={line.product.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black leading-tight text-white">
                      {line.product.name[lang]}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-white/45">
                      {line.product.variant ? `${line.product.variant[lang]} · ` : ""}
                      {formatCRC(line.product.price)}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-sm font-black text-white">
                    {formatCRC(line.product.price * line.qty)}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStep(line.product.id, -1)}
                    aria-label={t("Quitar uno", "Remove one")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white transition hover:border-[#00C4B0]/60 active:scale-95"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="min-w-8 text-center font-display text-base font-black text-white">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onStep(line.product.id, 1)}
                    aria-label={t("Agregar uno", "Add one")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white transition hover:border-[#00C4B0]/60 active:scale-95"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(line.product.id)}
                    aria-label={t("Quitar renglón", "Remove line")}
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <dl className="space-y-1 text-xs font-bold text-white/50">
          <div className="flex justify-between">
            <dt>{t("Subtotal sin IVA", "Subtotal before VAT")}</dt>
            <dd>{formatCRC(totals.base)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t(`IVA ${IVA_RATE}%`, `${IVA_RATE}% VAT`)}</dt>
            <dd>{formatCRC(totals.iva)}</dd>
          </div>
        </dl>

        <div className="mt-2.5 flex items-baseline justify-between border-t border-white/10 pt-2.5">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
            {t("Total", "Total")}
          </span>
          <span className="font-display text-3xl font-black tracking-tight text-white">
            {formatCRC(totals.total)}
          </span>
        </div>

        <button
          type="button"
          onClick={onCharge}
          disabled={empty}
          className="mt-3 w-full rounded-xl bg-[#00C4B0] py-3.5 font-display text-base font-black uppercase tracking-tight text-[#0E2B27] transition hover:bg-[#39D6C5] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        >
          {t("Cobrar", "Charge")}
        </button>
      </div>
    </aside>
  );
}
