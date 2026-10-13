import {
  Accessibility,
  CigaretteOff,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import type { Allergen, Copy, LegalNotice } from "./types";

/** Número ya configurado para SINPE en el checkout del sitio. */
export const SINPE_PHONE = "6233-2535";

/** Titular de la cuenta SINPE. Pendiente de confirmar con contabilidad. */
export const SINPE_HOLDER = "[Titular por confirmar]";

/** IVA general de Costa Rica (Ley 6826 reformada por la Ley 9635). */
export const IVA_RATE = 13;

export const BUSINESS = {
  name: "La Vieja Adventures",
  cafe: { es: "Cafetería", en: "Coffee Shop" } satisfies Copy,
  place: "Sucre de Ciudad Quesada, San Carlos",
  web: "www.laviejaadventures.com",
};

/** Paleta de marca, una sola fuente para artes y CSS. */
export const PALETTE = {
  ink: "#2E2A25",
  inkDeep: "#171512",
  turquoise: "#00C4B0",
  turquoiseDeep: "#006F65",
  turquoiseLight: "#8EF2E6",
  turquoiseMid: "#76EBDE",
  cream: "#F7F0E5",
  amber: "#F3A712",
  amberLight: "#FFD67A",
  navy: "#092333",
};

/** Fotos reales de La Vieja. Todavía no hay fotografía de producto. */
export const PHOTOS = {
  menu: "/image/IMG_4671.jpg",
  purpose: "/image/IMG_4946.JPG",
  food: "/image/IMG_5686.jpg",
};

// ── Estándar costarricense ───────────────────────────────────────────────────

/**
 * Pie de precio obligatorio: la Ley 7472 (art. 34) exige que el precio exhibido
 * sea el precio final, con impuestos incluidos.
 */
export const PRICE_FOOTER: Copy = {
  es: `Precios en colones · IVA ${IVA_RATE}% incluido · Ley 7472`,
  en: `Prices in colones · ${IVA_RATE}% VAT included · Law 7472`,
};

/** Cafetería de barra: no se cobra el 10% del Código de Trabajo art. 168. */
export const SERVICE_NOTICE: Copy = {
  es: "Servicio de barra · No se cobra 10% de servicio",
  en: "Counter service · No 10% service charge",
};

export const ALLERGEN_LABELS: Record<Allergen, Copy> = {
  gluten: { es: "Gluten", en: "Gluten" },
  lacteos: { es: "Lácteos", en: "Dairy" },
  huevo: { es: "Huevo", en: "Egg" },
  soya: { es: "Soya", en: "Soy" },
  mani: { es: "Maní", en: "Peanut" },
};

export const ALLERGEN_NOTICE: Copy = {
  es: "Consulte por alérgenos antes de ordenar.",
  en: "Ask about allergens before ordering.",
};

/**
 * Los avisos que un servicio de alimentación al público debe tener a la vista
 * en Costa Rica. Las citas son de referencia: hay que validarlas con el
 * Ministerio de Salud y con contabilidad antes de imprimir.
 */
export const LEGAL_NOTICES: LegalNotice[] = [
  {
    icon: CigaretteOff,
    title: {
      es: "Ambiente 100% libre de humo",
      en: "100% smoke-free environment",
    },
    body: {
      es: "Prohibido fumar y vapear en todo el establecimiento, incluidas las áreas al aire libre de uso común.",
      en: "Smoking and vaping are prohibited throughout the premises, including shared outdoor areas.",
    },
    law: "Ley 9028 · Ley 10.066",
  },
  {
    icon: Wallet,
    title: {
      es: "Precios finales, IVA incluido",
      en: "Final prices, VAT included",
    },
    body: {
      es: `Todos los precios exhibidos están en colones e incluyen el IVA del ${IVA_RATE}%. No se agregan cargos al pagar.`,
      en: `All displayed prices are in colones and include ${IVA_RATE}% VAT. No charges are added at checkout.`,
    },
    law: "Ley 7472, art. 34",
  },
  {
    icon: ReceiptText,
    title: {
      es: "Exija su factura electrónica",
      en: "Ask for your electronic invoice",
    },
    body: {
      es: "Toda compra genera un tiquete o factura electrónica. Pídalo en la caja o indíquenos su correo.",
      en: "Every purchase issues an electronic receipt or invoice. Request it at the counter or give us your email.",
    },
    law: "Ministerio de Hacienda",
  },
  {
    icon: TriangleAlert,
    title: {
      es: "Información de alérgenos",
      en: "Allergen information",
    },
    body: {
      es: "Nuestros alimentos pueden contener gluten, lácteos, huevo, soya o maní. Pregunte antes de ordenar.",
      en: "Our food may contain gluten, dairy, egg, soy or peanut. Please ask before ordering.",
    },
  },
  {
    icon: ShieldCheck,
    title: {
      es: "Permiso Sanitario de Funcionamiento",
      en: "Health Operating Permit",
    },
    body: {
      es: "N.º [pendiente] · Ministerio de Salud. El permiso original se exhibe en la caja.",
      en: "No. [pending] · Ministry of Health. The original permit is displayed at the counter.",
    },
    law: "Decreto 37308-S",
  },
  {
    icon: Accessibility,
    title: {
      es: "Atención prioritaria",
      en: "Priority assistance",
    },
    body: {
      es: "Personas con discapacidad, adultos mayores y mujeres embarazadas tienen atención preferente. Pida ayuda al personal.",
      en: "People with disabilities, older adults and pregnant women are served first. Ask our staff for help.",
    },
    law: "Ley 7600",
  },
];

/** Línea de denuncias de tabaco del Ministerio de Salud. Verificar vigencia. */
export const TOBACCO_HOTLINE = "1322";
