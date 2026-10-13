import type { Copy } from "../types";

/**
 * Un producto vendible. No es lo mismo que un renglón del menú: el café que se
 * vende en 8 y 12 oz son dos productos distintos en caja, con su propio precio.
 */
export type PosProduct = {
  id: string;
  sectionId: string;
  name: Copy;
  /** Tamaño o presentación: lo que separa dos variantes del mismo producto. */
  variant?: Copy;
  /** Precio en colones, con el IVA ya adentro. */
  price: number;
};

export type OrderLine = {
  product: PosProduct;
  qty: number;
};

export type PaymentMethod = "sinpe" | "efectivo" | "tarjeta";

export type OrderTotals = {
  /** Base imponible: el total sin el IVA que el precio ya trae adentro. */
  base: number;
  iva: number;
  total: number;
  /** Unidades, no renglones: dos cafés iguales cuentan dos. */
  units: number;
};

export type CompletedSale = {
  number: number;
  lines: OrderLine[];
  totals: OrderTotals;
  method: PaymentMethod;
  /** Solo en efectivo. */
  received?: number;
  change?: number;
};

/** En qué parte del cobro está la caja. */
export type PosStep = "order" | "pay" | "done";
