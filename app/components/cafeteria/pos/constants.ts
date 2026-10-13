import { Banknote, CreditCard, Smartphone, type LucideIcon } from "lucide-react";
import type { Copy } from "../types";
import type { PaymentMethod } from "./types";

/** Consecutivo de orden del día. Vive en el navegador de la caja. */
export const ORDER_COUNTER_KEY = "lva-cafeteria-pos-next-order";

/**
 * Denominaciones con las que de verdad paga la gente en Costa Rica. Se tocan
 * como se cuentan los billetes: cada toque suma, no reemplaza.
 */
export const QUICK_CASH = [500, 1000, 2000, 5000, 10000, 20000];

export const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  icon: LucideIcon;
  label: Copy;
  note: Copy;
}> = [
  {
    id: "efectivo",
    icon: Banknote,
    label: { es: "Efectivo", en: "Cash" },
    note: { es: "Calcula el vuelto", en: "Works out the change" },
  },
  {
    id: "sinpe",
    icon: Smartphone,
    label: { es: "SINPE Móvil", en: "SINPE Móvil" },
    note: { es: "Verifique el comprobante", en: "Check the confirmation" },
  },
  {
    id: "tarjeta",
    icon: CreditCard,
    label: { es: "Tarjeta", en: "Card" },
    note: { es: "Débito o crédito", en: "Debit or credit" },
  },
];
