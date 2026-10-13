/**
 * Tipos del módulo de rótulos. Un solo lugar donde se define la forma de una
 * lámina, de un rótulo y de las propuestas de diseño.
 */

export type Lang = "es" | "en";

/** Texto bilingüe: todo lo que se imprime va en los dos idiomas. */
export type Copy = { es: string; en: string };

/** El plan se cotiza en colones; el dólar es solo referencia de lectura. */
export type Currency = "crc" | "usd";

/** Tamaño físico de trabajo; debe confirmarse con el proveedor antes de fabricar. */
export type PanelSizeKey = "grande" | "mediano" | "pequeno";

/** Las dos versiones del logo que se pueden rotular. */
export type Brand = "lva" | "lva-turquoise";

export type ArrowKey = "left" | "right" | "down-right";

/** Pictogramas de norma: se decodifican antes de leer una sola letra. */
export type PictogramKey =
  | "canon"
  | "cascada"
  | "rio"
  | "comida"
  | "parqueo"
  | "mirador"
  | "sendero"
  | "wifi"
  | "banos";

export type RotuloKind = "entrada" | "anticipo" | "destino" | "indicador" | "distancia";

/** Marca de red social: lucide no trae TikTok ni X, se usan paths propios. */
export type Social = {
  label: string;
  handle: string;
  path: string;
};

export type Panel = {
  /** Identidad estable del lienzo para conservar posiciones aunque cambie el orden. */
  layoutId: string;
  /** Medida de trabajo usada para solicitar cotizaciones. */
  size: PanelSizeKey;
  /** Línea corta arriba del título. */
  kicker?: string;
  /** Título rotulado, en español: es el que se lee desde la calle. */
  title: string;
  /** Mismo título en inglés, impreso chiquito debajo. Bilingüe sin gritar. */
  titleEn: string;
  subtitle?: string;
  /** Frase de acción, la que tiene que pegar desde la calle. */
  cta: Copy;
  /** Distancia o referencia impresa en el rótulo. */
  distance?: string;
  brands: Brand[];
  /** Sustituye el pictograma generico por el logo oficial como elemento principal. */
  brandForward?: boolean;
  arrow?: ArrowKey;
  pictogram: PictogramKey;
  /** Fotografías del destino: una principal y, cuando existe, una secundaria. */
  photos: string[];
  /** Precio de la lámina en colones. */
  price: number;
};

export type Rotulo = {
  id: number;
  code: string;
  name: string;
  kind: RotuloKind;
  placement: Copy;
  purpose: Copy;
  panels: Panel[];
};

/** Totales de la selección que se muestra en la tabla de cierre. */
export type SelectionTotals = {
  count: number;
  panels: number;
  amount: number;
};

// ── Propuestas de diseño ─────────────────────────────────────────────────────

export type Variant =
  | "mopt"
  | "turistico"
  | "servicios"
  | "flecha"
  | "portal"
  | "blades"
  | "elegante";

export type Proposal = {
  id: string;
  variant: Variant;
  name: Copy;
  /** De donde sale el formato: sistemas reales que lo usan. */
  reference: Copy;
  /** Para cuáles puntos del plan sirve. */
  slots: string;
  why: Copy;
  specs: Copy[];
  recommended: boolean;
};

/** Regla de señalización con su cifra al frente. */
export type Rule = { value: string; text: Copy };
