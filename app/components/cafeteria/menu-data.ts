import { Coffee, CupSoda, UtensilsCrossed } from "lucide-react";
import type { MenuSection } from "./types";

/**
 * PRECIOS DE EJEMPLO. Son montos de referencia de una cafetería rural de zona
 * turística en Costa Rica (2026) para que el arte se pueda ver terminado; hay
 * que reemplazarlos por los reales antes de imprimir. Todos van en colones y
 * ya incluyen el IVA, como exige la Ley 7472.
 */
export const HOT_DRINKS: MenuSection = {
  id: "calientes",
  icon: Coffee,
  title: { es: "Bebidas calientes", en: "Hot drinks" },
  teaser: { es: "Café · Chocolate · Agua dulce", en: "Coffee · Chocolate · Cane drink" },
  items: [
    {
      name: { es: "Café negro", en: "Black coffee" },
      note: { es: "Grano de la zona", en: "Locally grown beans" },
      prices: { small: 1100, large: 1500 },
    },
    {
      name: { es: "Café con leche", en: "Coffee with milk" },
      prices: { small: 1400, large: 1800 },
      allergens: ["lacteos"],
    },
    {
      name: { es: "Capuchino", en: "Cappuccino" },
      prices: { small: 1900, large: 2400 },
      allergens: ["lacteos"],
    },
    {
      name: { es: "Chocolate caliente", en: "Hot chocolate" },
      prices: { small: 1600, large: 2000 },
      allergens: ["lacteos"],
    },
    {
      name: { es: "Agua dulce", en: "Cane sugar drink" },
      note: { es: "Tapa de dulce de la zona", en: "Local cane sugar" },
      prices: { small: 1000, large: 1300 },
    },
  ],
};

export const COLD_DRINKS: MenuSection = {
  id: "frias",
  icon: CupSoda,
  title: { es: "Bebidas frías", en: "Cold drinks" },
  teaser: { es: "Gaseosas · Powerade · Monster", en: "Sodas · Powerade · Monster" },
  items: [
    {
      name: { es: "Fresco natural del día", en: "Fresh fruit drink of the day" },
      note: { es: "Pregunte el sabor", en: "Ask for today's flavor" },
      price: 1500,
    },
    {
      name: { es: "Agua embotellada", en: "Bottled water" },
      note: { es: "600 ml", en: "600 ml" },
      price: 900,
    },
    {
      name: { es: "Gaseosa", en: "Soda" },
      note: { es: "Lata 355 ml", en: "355 ml can" },
      price: 1200,
    },
    {
      name: { es: "Gaseosa", en: "Soda" },
      note: { es: "Botella 600 ml", en: "600 ml bottle" },
      price: 1600,
    },
    {
      name: { es: "Powerade", en: "Powerade" },
      note: { es: "500 ml", en: "500 ml" },
      price: 1700,
      brand: true,
    },
    {
      name: { es: "Monster", en: "Monster" },
      note: { es: "473 ml", en: "473 ml" },
      price: 2600,
      brand: true,
    },
  ],
};

export const FOOD: MenuSection = {
  id: "comidas",
  icon: UtensilsCrossed,
  title: { es: "Algo para comer", en: "Something to eat" },
  teaser: { es: "Empanadas · Sándwiches · Tortillas", en: "Empanadas · Sandwiches · Tortillas" },
  items: [
    {
      name: { es: "Empanada de queso", en: "Cheese empanada" },
      price: 1200,
      allergens: ["gluten", "lacteos"],
    },
    {
      name: { es: "Empanada de frijol", en: "Bean empanada" },
      price: 1200,
      allergens: ["gluten"],
    },
    {
      name: { es: "Empanada de carne", en: "Beef empanada" },
      price: 1500,
      allergens: ["gluten"],
    },
    {
      name: { es: "Tortilla aliñada", en: "Seasoned corn tortilla" },
      note: { es: "Con natilla", en: "With sour cream" },
      price: 1400,
      allergens: ["lacteos"],
    },
    {
      name: { es: "Sándwich de jamón y queso", en: "Ham & cheese sandwich" },
      price: 2800,
      allergens: ["gluten", "lacteos"],
    },
    {
      name: { es: "Sándwich de pollo", en: "Chicken sandwich" },
      price: 3200,
      allergens: ["gluten", "huevo"],
    },
    {
      name: { es: "Gallo pinto con huevo", en: "Gallo pinto with egg" },
      note: { es: "Solo hasta las 11 a. m.", en: "Until 11 a.m. only" },
      price: 3500,
      allergens: ["huevo", "soya"],
    },
  ],
};

/** Las tres familias en el orden en que se leen en el menú general. */
export const MENU_SECTIONS: MenuSection[] = [HOT_DRINKS, COLD_DRINKS, FOOD];
