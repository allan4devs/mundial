import type { Lang } from "../types";

export type { Lang };

/** Texto que puede resolverse con el idioma activo del editor. */
export type LocalizedText = string | { es: string; en: string };

/**
 * Cambie la revision cuando la estructura visual de una lamina deje de ser
 * compatible con las posiciones previamente guardadas.
 */
export type PanelLayoutRevision = string | number;

/** Centro del elemento relativo al lienzo, siempre entre 0 y 1. */
export type NormalizedCenterAnchor = {
  x: number;
  y: number;
};

export type PixelTranslation = {
  x: number;
  y: number;
};

/** Tipografías disponibles para el texto agregado: las dos fuentes que ya carga el sitio, más una monoespaciada del sistema. */
export type TextFontFamily = "display" | "sans" | "mono";

/**
 * Formato de un campo de texto ya incluido en el rótulo (kicker, título,
 * subtítulo, llamado a la acción). `content` reemplaza la palabra original
 * del plan; sin definir, conserva el texto de `data.ts`.
 */
export type StoredTextFormat = {
  content?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontFamily?: TextFontFamily;
};

export type StoredGroupLayout = {
  anchor: NormalizedCenterAnchor;
  scale: number;
  hidden?: boolean;
  /** Solo presente en grupos que envuelven un campo de texto propio del rótulo. */
  text?: StoredTextFormat;
};

export type AddedTextStyle = "title" | "subtitle" | "label" | "cta";

export const INSERTABLE_ICON_KEYS = [
  "canon",
  "cascada",
  "rio",
  "comida",
  "parqueo",
  "mirador",
  "sendero",
  "wifi",
  "banos",
  "arrow-left",
  "arrow-right",
  "arrow-down-right",
] as const;

export type InsertableIconKey = (typeof INSERTABLE_ICON_KEYS)[number];

export type AddedTextElement = {
  id: string;
  kind: "text";
  text: string;
  style: AddedTextStyle;
  /** Sin definir se trata como `true`: así se ve igual el texto ya guardado antes de este campo existir. */
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** Sin definir usa la fuente por defecto del estilo (ver `resolveTextFontFamily`). */
  fontFamily?: TextFontFamily;
};

export type AddedIconElement = {
  id: string;
  kind: "icon";
  icon: InsertableIconKey;
};

export type AddedImageElement = {
  id: string;
  kind: "image";
  /** Imagen ya procesada del lado del cliente: siempre un data URL (ver imageUpload.ts). */
  src: string;
  /** Ancho/alto de la imagen procesada; evita que el recuadro salte mientras carga. */
  aspectRatio: number;
};

/**
 * Contenido creado por el usuario. Su geometria vive en `groups` bajo la
 * llave `custom:${id}`, igual que la de los grupos incluidos en el rotulo.
 */
export type AddedCanvasElement = AddedTextElement | AddedIconElement | AddedImageElement;

export function addedElementGroupId(elementId: string): string {
  return `custom:${elementId}`;
}

export type StoredPanelLayout = {
  revision: PanelLayoutRevision;
  groups: Record<string, StoredGroupLayout>;
  elements: AddedCanvasElement[];
};

export type StoredSignLayout = {
  version: 2;
  signId: string;
  panels: Record<string, StoredPanelLayout>;
};

export function localize(text: LocalizedText, lang: Lang): string {
  return typeof text === "string" ? text : text[lang];
}
