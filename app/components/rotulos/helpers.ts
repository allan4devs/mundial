import { create as createQrMatrix } from "qrcode";
import { CRC_PER_USD, PHOTO_SKEW } from "./constants";
import { IVA_RATE, TIER_BY_KEY } from "./pricing";
import type { Currency, Lang, Rotulo, SelectionTotals } from "./types";

// ── Precios ──────────────────────────────────────────────────────────────────

export function formatCRC(value: number) {
  return new Intl.NumberFormat("es-CR").format(value);
}

export function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** El plan se cotiza en colones; el USD es solo referencia de lectura. */
export function formatPrice(crc: number, currency: Currency) {
  return currency === "crc"
    ? `₡${formatCRC(crc)}`
    : formatUSD(Math.round(crc / CRC_PER_USD));
}

/** Lo que cuesta un rótulo completo: la suma de sus láminas. */
export function signSubtotal(rotulo: Rotulo) {
  return rotulo.panels.reduce((sum, panel) => sum + panel.price, 0);
}

/**
 * Desglose base + IVA de un rótulo: el total ya incluye el 13%, pero en
 * pantalla solo se veía el monto final. Esto permite mostrar de dónde sale
 * cada colón, sumando la tarifa base de cada lámina según su tamaño.
 */
export function signSubtotalBreakdown(rotulo: Rotulo) {
  const base = rotulo.panels.reduce((sum, panel) => sum + TIER_BY_KEY[panel.size].base, 0);
  const total = signSubtotal(rotulo);
  return { base, iva: total - base, total };
}

/** Mismo desglose para un conjunto de rótulos seleccionados. */
export function selectionBreakdown(rotulos: Rotulo[], selected: number[]) {
  const chosen = rotulos.filter((rotulo) => selected.includes(rotulo.id));
  const base = chosen.reduce((sum, rotulo) => sum + signSubtotalBreakdown(rotulo).base, 0);
  const total = chosen.reduce((sum, rotulo) => sum + signSubtotal(rotulo), 0);
  return { base, iva: total - base, total };
}

export { IVA_RATE };

/** Cuántos rótulos, cuántas láminas y cuánto suma lo que está incluido. */
export function selectionTotals(rotulos: Rotulo[], selected: number[]): SelectionTotals {
  const chosen = rotulos.filter((rotulo) => selected.includes(rotulo.id));
  return {
    count: chosen.length,
    panels: chosen.reduce((acc, rotulo) => acc + rotulo.panels.length, 0),
    amount: chosen.reduce((acc, rotulo) => acc + signSubtotal(rotulo), 0),
  };
}

// ── Idioma ───────────────────────────────────────────────────────────────────

/** Atajo para textos sueltos de interfaz: t("español", "english"). */
export function createTranslator(lang: Lang) {
  return (es: string, en: string) => (lang === "es" ? es : en);
}

// ── Recorte diagonal de las fotos ────────────────────────────────────────────

/**
 * Bandas diagonales a sangre: las fotos ocupan la lámina entera y solo se ven
 * cortadas, nunca deformadas. Encima van los módulos de vidrio, así que la
 * imagen se sigue leyendo debajo del texto.
 */
export function diagonalBand(index: number, total: number) {
  const span = 100 / total;
  const topStart = index === 0 ? -2 : span * index;
  const topEnd = index === total - 1 ? 102 : span * (index + 1);
  const bottomStart = index === 0 ? -2 : topStart - PHOTO_SKEW;
  const bottomEnd = index === total - 1 ? 102 : topEnd - PHOTO_SKEW;
  return `polygon(${topStart}% -2%, ${topEnd}% -2%, ${bottomEnd}% 102%, ${bottomStart}% 102%)`;
}

/** Filo blanco entre banda y banda, como el corte del vinil. */
export function diagonalEdge(index: number, total: number) {
  const cut = (100 / total) * (index + 1);
  return `polygon(${cut}% -2%, ${cut + 0.9}% -2%, ${cut + 0.9 - PHOTO_SKEW}% 102%, ${
    cut - PHOTO_SKEW
  }% 102%)`;
}

// ── QR ───────────────────────────────────────────────────────────────────────

/** Calculo puro: mismo resultado en server y cliente. */
export function buildQrPath(target: string) {
  const { modules } = createQrMatrix(target, { errorCorrectionLevel: "M" });
  const { size, data } = modules;
  let path = "";
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (data[y * size + x]) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return { size, path };
}
