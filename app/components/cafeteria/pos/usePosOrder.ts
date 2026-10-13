"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ORDER_COUNTER_KEY } from "./constants";
import { orderTotals } from "./helpers";
import type { CompletedSale, OrderLine, PaymentMethod, PosProduct } from "./types";

/**
 * Estado de la caja: la orden que se está armando, el consecutivo y la última
 * venta cerrada. Todo vive en el navegador; no hay backend detrás.
 */
export function usePosOrder() {
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [sale, setSale] = useState<CompletedSale | null>(null);
  const [nextNumber, setNextNumber] = useState(1);

  /** Se lee después del montaje para que servidor y cliente rendericen igual. */
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(ORDER_COUNTER_KEY));
      if (Number.isInteger(stored) && stored > 0) setNextNumber(stored);
    } catch {
      // localStorage bloqueado: se arranca en 1 y ya.
    }
  }, []);

  const add = useCallback((product: PosProduct) => {
    setLines((prev) => {
      const found = prev.find((line) => line.product.id === product.id);
      if (!found) return [...prev, { product, qty: 1 }];
      return prev.map((line) =>
        line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line,
      );
    });
  }, []);

  /** Bajar de 1 quita el renglón: es lo que espera quien está en la caja. */
  const step = useCallback((productId: string, delta: number) => {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.product.id !== productId) return [line];
        const qty = line.qty + delta;
        return qty <= 0 ? [] : [{ ...line, qty }];
      }),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.product.id !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totals = useMemo(() => orderTotals(lines), [lines]);

  const complete = useCallback(
    (method: PaymentMethod, received?: number) => {
      const closed: CompletedSale = {
        number: nextNumber,
        lines,
        totals,
        method,
        received,
        change: received === undefined ? undefined : received - totals.total,
      };

      setSale(closed);
      setLines([]);
      setNextNumber((n) => {
        const next = n + 1;
        try {
          localStorage.setItem(ORDER_COUNTER_KEY, String(next));
        } catch {
          // Sin persistencia el consecutivo se reinicia al recargar.
        }
        return next;
      });

      return closed;
    },
    [lines, totals, nextNumber],
  );

  const dismissSale = useCallback(() => setSale(null), []);

  return { lines, totals, sale, nextNumber, add, step, remove, clear, complete, dismissSale };
}
