import { ALLERGEN_LABELS } from "./constants";
import type { Allergen, Lang, MenuItem } from "./types";

/**
 * Colones con separador de miles en punto, como se escribe en Costa Rica:
 * ₡1.200. Se arma a mano porque Intl con la configuración es-CR devuelve un
 * espacio duro como separador, y en un rótulo eso se lee como dos números.
 */
export function formatCRC(value: number) {
  return `₡${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

/** El precio más barato de un renglón: sirve para los "desde ₡X" del menú. */
function itemFrom(item: MenuItem) {
  return item.prices ? item.prices.small : (item.price ?? 0);
}

/** El "desde ₡X" de una sección completa. */
export function sectionFrom(items: MenuItem[]) {
  return Math.min(...items.map(itemFrom));
}

/**
 * Alérgenos de un renglón en los dos idiomas, sin repetir los que se escriben
 * igual: "Gluten · Lácteos / Dairy", no "Gluten · Lácteos / Gluten · Dairy".
 */
export function allergenLabel(allergens: Allergen[] | undefined) {
  if (!allergens?.length) return null;
  return allergens
    .map((key) => {
      const { es, en } = ALLERGEN_LABELS[key];
      return es === en ? es : `${es}/${en}`;
    })
    .join(" · ");
}

/** Atajo para textos sueltos de interfaz: t("español", "english"). */
export function createTranslator(lang: Lang) {
  return (es: string, en: string) => (lang === "es" ? es : en);
}
