import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type { Lang } from "@/lib/LanguageContext";

/** Todo lo que se imprime va en los dos idiomas: español manda, inglés apoya. */
export type Copy = { es: string; en: string };

export type SignId =
  | "menu"
  | "calientes"
  | "frias"
  | "comidas"
  | "sinpe"
  | "proposito"
  | "legal";

/** Alérgenos que hay que declarar de frente en la barra. */
export type Allergen = "gluten" | "lacteos" | "huevo" | "soya" | "mani";

/**
 * Renglón de menú. `price` es el precio único; `prices` es para los productos
 * que se venden en dos tamaños (el estándar de barra de café en Costa Rica).
 * Todos los montos son colones y ya llevan el IVA adentro, como pide la Ley 7472.
 */
export type MenuItem = {
  name: Copy;
  /** Detalle corto: relleno, presentación o tamaño. */
  note?: Copy;
  price?: number;
  prices?: { small: number; large: number };
  allergens?: Allergen[];
  /** Marca comercial mencionada por su nombre, nunca con su logo. */
  brand?: boolean;
};

export type MenuSection = {
  id: string;
  icon: LucideIcon;
  title: Copy;
  /** Lo que se lee de lejos: los tres o cuatro productos, sin precio. */
  teaser: Copy;
  items: MenuItem[];
};

/** Aviso obligatorio o recomendado, con la norma que lo respalda. */
export type LegalNotice = {
  icon: LucideIcon;
  title: Copy;
  body: Copy;
  /** Ley o decreto que lo pide. Vacío si es buena práctica, no obligación. */
  law?: string;
};

export type SignDefinition = {
  id: SignId;
  code: string;
  title: Copy;
  description: Copy;
  placement: Copy;
  /** Lo que todavía hay que confirmar antes de mandar a producir. */
  pending: Copy[];
  Artwork: ComponentType;
};
