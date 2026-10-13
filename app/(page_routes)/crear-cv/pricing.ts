// Pricing plans + operator contact. Costa Rica: prices in colones, SINPE
// Móvil / bank transfer confirmed over WhatsApp, then the operator sends a
// `CVXPRO-…` activation code. USD shown for reference (PayPal on request).

import type { Lang } from "@/lib/LanguageContext";

export const OPERATOR = {
  name: "CV Express",
  /** WhatsApp number in wa.me format (country code, no +). */
  whatsapp: "50672252296",
  /** SINPE Móvil number as shown to buyers. */
  sinpe: "7225 2296",
  sinpeName: "Allan Rojas",
  email: "allan4devs@gmail.com",
};

export type PlanId = "gratis" | "pro" | "profesional";

export type Plan = {
  id: PlanId;
  name: { es: string; en: string };
  priceCRC: number; // 0 for free
  priceUSD: number;
  cadence: { es: string; en: string };
  tagline: { es: string; en: string };
  features: { es: string; en: string }[];
  cta: { es: string; en: string };
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "gratis",
    name: { es: "Gratis", en: "Free" },
    priceCRC: 0,
    priceUSD: 0,
    cadence: { es: "para siempre", en: "forever" },
    tagline: {
      es: "Armá tu CV completo y descargalo hoy.",
      en: "Build your full CV and download it today.",
    },
    features: [
      { es: "Editor completo con todas las secciones", en: "Full editor, every section" },
      { es: "Vista previa en vivo", en: "Live preview" },
      { es: "2 plantillas (Clásico y Minimal)", en: "2 templates (Classic & Minimal)" },
      { es: "Carta de presentación automática", en: "Automatic cover letter" },
      { es: "Descarga en PDF (con una línea de marca)", en: "PDF download (with one credit line)" },
      { es: "Exportar/importar tus datos", en: "Export / import your data" },
    ],
    cta: { es: "Empezar gratis", en: "Start free" },
  },
  {
    id: "pro",
    name: { es: "Pro", en: "Pro" },
    priceCRC: 4900,
    priceUSD: 9,
    cadence: { es: "pago único", en: "one-time" },
    tagline: {
      es: "Todas las plantillas, sin marca de agua.",
      en: "Every template, no watermark.",
    },
    features: [
      { es: "Todo lo del plan Gratis", en: "Everything in Free" },
      { es: "5 plantillas, incluidas Moderno, Ejecutivo y Compacto", en: "5 templates incl. Modern, Executive, Compact" },
      { es: "Sin marca de agua en el PDF", en: "No watermark on the PDF" },
      { es: "Colores de acento y tamaño de tipografía", en: "Accent colours & font size" },
      { es: "PDF del CV y de la carta", en: "PDF of the CV and the cover letter" },
      { es: "Activación inmediata con código", en: "Instant unlock with a code" },
    ],
    cta: { es: "Comprar Pro", en: "Buy Pro" },
    featured: true,
  },
  {
    id: "profesional",
    name: { es: "Profesional", en: "Professional" },
    priceCRC: 14900,
    priceUSD: 27,
    cadence: { es: "pago único", en: "one-time" },
    tagline: {
      es: "Un experto revisa y ajusta tu CV.",
      en: "An expert reviews and tunes your CV.",
    },
    features: [
      { es: "Todo lo del plan Pro", en: "Everything in Pro" },
      { es: "Revisión humana de tu CV y carta", en: "Human review of your CV and letter" },
      { es: "Optimización de palabras clave para ATS", en: "ATS keyword optimisation" },
      { es: "Ajustes de redacción y formato", en: "Wording & formatting fixes" },
      { es: "Entrega en 48 horas por WhatsApp", en: "48-hour delivery over WhatsApp" },
    ],
    cta: { es: "Solicitar revisión", en: "Request review" },
  },
];

export const formatCRC = (n: number): string =>
  n === 0 ? "₡0" : "₡" + n.toLocaleString("es-CR");

export function checkoutWhatsAppHref(plan: Plan, lang: Lang): string {
  const price = `${formatCRC(plan.priceCRC)} (~$${plan.priceUSD})`;
  const msg =
    lang === "es"
      ? `Hola ${OPERATOR.name} 👋 Quiero el plan ${plan.name.es} (${price}). ¿Me pasan el número de SINPE Móvil para completar el pago y recibir mi código?`
      : `Hi ${OPERATOR.name} 👋 I'd like the ${plan.name.en} plan (${price}). Can you share the SINPE Móvil number so I can pay and get my code?`;
  return `https://wa.me/${OPERATOR.whatsapp}?text=${encodeURIComponent(msg)}`;
}
