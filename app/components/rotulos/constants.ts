import {
  ArrowLeft,
  ArrowRight,
  Binoculars,
  CornerDownRight,
  Droplets,
  MapPin,
  Mountain,
  ParkingCircle,
  Ruler,
  Signpost,
  Toilet,
  TreePine,
  UtensilsCrossed,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import type {
  ArrowKey,
  Copy,
  PictogramKey,
  RotuloKind,
  Social,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN GENERAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tipo de cambio referencial CRC/USD.
 *
 * Se utiliza únicamente para mostrar equivalencias aproximadas del presupuesto
 * en dólares. No debe interpretarse como un tipo de cambio oficial o bancario.
 */
export const CRC_PER_USD = 505;

// ─────────────────────────────────────────────────────────────────────────────
// INFORMACIÓN DE LA EMPRESA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Información de contacto que puede imprimirse en las distintas láminas.
 *
 * Mantener estos datos centralizados permite actualizar toda la señalización
 * desde un único punto.
 */
export const BUSINESS = {
  name: "La Vieja Adventures",
  place: "Sucre, San Carlos, Alajuela, Costa Rica",
  web: "www.laviejaadventures.com",
  email: "info@laviejaadventures.com",
  whatsapp: "6233-2535",
  phone: "8643-0807",
  handle: "@laviejaadventures",
  link: "https://wa.me/50662332535",
};

/**
 * Destino del código QR.
 *
 * El código QR abre el contacto directo de WhatsApp de La Vieja Adventures.
 */
export const QR_TARGET = BUSINESS.link;

// ─────────────────────────────────────────────────────────────────────────────
// REDES SOCIALES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redes sociales de La Vieja Adventures.
 *
 * Lucide no incluye todos los logotipos de redes sociales, por lo que se
 * utilizan paths SVG personalizados para mantener una presentación visual
 * consistente.
 */
export const SOCIALS: Social[] = [
  {
    label: "Instagram",
    handle: "@laviejaadventures",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    label: "Facebook",
    handle: "/laviejaadventures",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    label: "YouTube",
    handle: "@laviejaadventures",
    path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    label: "TikTok",
    handle: "@la.vieja.adventur",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
  {
    label: "X",
    handle: "@adventuresvieja",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORÍAS DE SEÑALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuración visual y semántica de cada categoría de señal.
 *
 * Cada categoría define:
 * - Ícono identificador.
 * - Nombre en español e inglés.
 * - Estilo cromático de la etiqueta.
 */
export const KIND_META: Record<
  RotuloKind,
  {
    icon: LucideIcon;
    label: Copy;
    tone: string;
  }
> = {
  entrada: {
    icon: Signpost,
    label: {
      es: "Entrada principal",
      en: "Main Entrance",
    },
    tone:
      "border-emerald-300/40 bg-emerald-400/10 text-emerald-200",
  },

  anticipo: {
    icon: Ruler,
    label: {
      es: "Señal preventiva",
      en: "Advance Warning",
    },
    tone:
      "border-sky-300/40 bg-sky-400/10 text-sky-200",
  },

  destino: {
    icon: UtensilsCrossed,
    label: {
      es: "Destino",
      en: "Destination",
    },
    tone:
      "border-amber-300/40 bg-amber-400/10 text-amber-200",
  },

  indicador: {
    icon: ParkingCircle,
    label: {
      es: "Orientación interna",
      en: "Internal Wayfinding",
    },
    tone:
      "border-violet-300/40 bg-violet-400/10 text-violet-200",
  },

  distancia: {
    icon: MapPin,
    label: {
      es: "Señal de aproximación",
      en: "Approach Sign",
    },
    tone:
      "border-rose-300/40 bg-rose-400/10 text-rose-200",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FLECHAS DE DIRECCIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Íconos utilizados para indicar la dirección de desplazamiento.
 */
export const ARROWS: Record<ArrowKey, LucideIcon> = {
  left: ArrowLeft,
  right: ArrowRight,
  "down-right": CornerDownRight,
};

// ─────────────────────────────────────────────────────────────────────────────
// PICTOGRAMAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pictogramas utilizados en la señalización.
 *
 * Permiten identificar rápidamente cada atractivo, servicio o destino antes
 * de que la persona necesite leer el texto.
 */
export const PICTOGRAMS: Record<PictogramKey, LucideIcon> = {
  canon: Mountain,
  cascada: Droplets,
  rio: Waves,
  comida: UtensilsCrossed,
  parqueo: ParkingCircle,
  mirador: Binoculars,
  sendero: TreePine,
  wifi: Wifi,
  banos: Toilet,
};

/**
 * Franja de amenidades: los servicios disponibles en la propiedad, repetidos
 * de forma consistente en todas las láminas para reforzar qué hay en el
 * sitio sin depender de que alguien lea el subtítulo completo.
 */
export const AMENITIES: PictogramKey[] = ["comida", "wifi", "banos", "sendero"];

// ─────────────────────────────────────────────────────────────────────────────
// FOTOGRAFÍAS Y COMPOSICIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inclinación del corte diagonal aplicado a las franjas fotográficas.
 *
 * El valor determina el desplazamiento horizontal entre el borde superior
 * y el borde inferior del recorte.
 */
export const PHOTO_SKEW = 14;

/**
 * Punto de enfoque de cada franja fotográfica, en orden de aparición.
 *
 * Esto permite mantener visible la zona más importante de cada fotografía
 * incluso cuando se utilizan recortes diagonales.
 */
export const PHOTO_FOCUS = [
  "center 40%",
  "center 55%",
  "center 30%",
];

// ─────────────────────────────────────────────────────────────────────────────
// EFECTO DE VIDRIO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Colores translúcidos utilizados en las superficies con efecto de vidrio.
 *
 * Se mantiene una jerarquía cromática intuitiva:
 *
 * - Gris: soporte neutro para información y texto.
 * - Verde: destinos y orientación.
 * - Azul: servicios e información.
 * - Amarillo: advertencias, acciones o elementos de alta atención.
 *
 * La transparencia permite conservar la fotografía de fondo sin comprometer
 * la legibilidad del contenido.
 */
export const GLASS = {
  gray: "rgba(24, 24, 27, 0.42)",
  green: "rgba(15, 122, 61, 0.44)",
  blue: "rgba(11, 78, 162, 0.46)",
  yellow: "rgba(245, 197, 24, 0.80)",
  yellowEdge: "rgba(138, 107, 0, 0.70)",
};

/**
 * Estilo base para superficies con efecto de vidrio.
 *
 * Incluye:
 * - Borde claro translúcido.
 * - Desenfoque del fondo.
 * - Brillo interior superior.
 * - Sombra exterior para separar la información de la fotografía.
 */
export const GLASS_BASE =
  "rounded-xl border border-white/30 backdrop-blur-md " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_30px_-16px_rgba(0,0,0,0.8)]";

/**
 * Sombra aplicada al texto blanco sobre fotografías.
 *
 * Aumenta el contraste y mantiene la lectura en zonas claras, oscuras
 * o visualmente complejas.
 */
export const TEXT_SHADOW =
  "drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]";

// ─────────────────────────────────────────────────────────────────────────────
// PALETA DE SEÑALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paleta funcional para la señalización.
 *
 * Estos colores cumplen una función informativa independiente de la identidad
 * visual de La Vieja Adventures:
 *
 * - Verde: destinos y orientación.
 * - Azul: servicios e información.
 * - Café: atractivos turísticos y naturales.
 * - Amarillo: advertencias y elementos de alta atención.
 * - Madera: elementos decorativos o de integración con el entorno natural.
 *
 * La paleta busca mantener una lectura rápida, alto contraste y coherencia
 * visual en entornos naturales.
 *
 * Nota:
 * Si las señales se instalarán en una vía pública, sus dimensiones, colores,
 * símbolos, ubicación y demás especificaciones deberán validarse según la
 * normativa vial vigente aplicable en Costa Rica.
 */
export const SIGN_COLORS = {
  green: "#0F7A3D",
  blue: "#0B4EA2",
  brown: "#5C3B1E",
  yellow: "#F5C518",
  wood: "#2A1E14",
} as const;
