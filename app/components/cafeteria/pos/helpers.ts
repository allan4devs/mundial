import { IVA_RATE } from "../constants";
import { MENU_SECTIONS } from "../menu-data";
import type { OrderLine, OrderTotals, PosProduct } from "./types";

/**
 * Aplana el menú en productos vendibles. Los renglones con dos tamaños se
 * parten en dos: en caja se cobra un café de 8 oz, no "café" a secas.
 */
export function buildCatalog(): PosProduct[] {
  const products: PosProduct[] = [];

  for (const section of MENU_SECTIONS) {
    section.items.forEach((item, index) => {
      const base = `${section.id}-${index}`;

      if (item.prices) {
        products.push({
          id: `${base}-8`,
          sectionId: section.id,
          name: item.name,
          variant: { es: "8 oz", en: "8 oz" },
          price: item.prices.small,
        });
        products.push({
          id: `${base}-12`,
          sectionId: section.id,
          name: item.name,
          variant: { es: "12 oz", en: "12 oz" },
          price: item.prices.large,
        });
        return;
      }

      products.push({
        id: base,
        sectionId: section.id,
        name: item.name,
        variant: item.note,
        price: item.price ?? 0,
      });
    });
  }

  return products;
}

/**
 * El precio ya trae el IVA adentro, así que el desglose se despeja hacia atrás.
 * Se redondea la base a colones enteros y el IVA se saca por resta, para que
 * base + IVA dé exactamente el total y el tiquete cuadre.
 */
export function orderTotals(lines: OrderLine[]): OrderTotals {
  const total = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const units = lines.reduce((sum, line) => sum + line.qty, 0);
  const base = Math.round(total / (1 + IVA_RATE / 100));

  return { base, iva: total - base, total, units };
}
