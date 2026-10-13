import { FLYER_CATEGORIES } from "./categories";
import type { Flyer } from "./types";

export { FLYER_CATEGORIES } from "./categories";
export type { FlyerCategory } from "./types";

/** Las 108 publicaciones de todas las categorías, en un solo arreglo plano. */
export const FLYERS: Flyer[] = FLYER_CATEGORIES.flatMap((category) => category.flyers);
