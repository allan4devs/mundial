import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { PIZZA } from "../_shared/images";

export const metadata: Metadata = {
  title: "Latina Pizza | Pizza artesanal en 9 sucursales de Costa Rica",
  description:
    "Propuesta de sitio web para Latina Pizza: pizza recién hecha con sucursales en Ciudad Quesada, Guápiles, Cariari, San Ramón, Naranjo, La Fortuna, Aguas Zarcas y más.",
};

const config: BusinessConfig = {
  slug: "latina-pizza",
  brandIcon: "Pizza",
  name: "Latina Pizza",
  shortName: "Latina Pizza",
  category: "Pizzería",
  tagline: "Recién hecha, como debe ser",
  city: "9 sucursales en Costa Rica",
  address:
    "Ciudad Quesada, Guápiles, Cariari, San Ramón, Naranjo, La Fortuna, Aguas Zarcas y Barrio Jardín",
  facebook: "https://www.facebook.com/LatinaPizzaCostaRica",
  instagram: "https://www.instagram.com/latina_pizzacr",
  mapsQuery: "Latina Pizza Costa Rica",
  accent: {
    base: "#d62828",
    ink: "#ffffff",
    soft: "#ffe4e0",
    deep: "#4c0d0d",
    page: "#fdf7f4",
    pageInk: "#211613",
  },
  heroImage: PIZZA.hero,
  intro:
    "Pizza artesanal con el sabor de siempre, ahora en sucursales por todo el país. Desde Ciudad Quesada hasta La Fortuna, Guápiles, Cariari y más.",
  offeringsTitle: "Pizza recién hecha para cada antojo.",
  offeringsLead:
    "El sitio reúne el menú, las promociones y todas las sucursales en un solo lugar, y hace fácil pedir a domicilio o para llevar.",
  offerings: [
    { icon: "Flame", title: "Pizzas al horno", text: "Masa fresca, ingredientes generosos y ese sabor que ya es tradición.", badge: "La favorita" },
    { icon: "Utensils", title: "Combos familiares", text: "Pizzas grandes y promos pensadas para compartir en familia.", badge: "Para compartir" },
    { icon: "Salad", title: "Entradas y extras", text: "Acompañamientos, bebidas y postres para completar el pedido.", badge: "Antojos" },
    { icon: "ShoppingBag", title: "A domicilio y para llevar", text: "Pida por WhatsApp o redes y disfrute donde quiera.", badge: "Express" },
  ],
  valueTitle: "De un Linktree a un sitio que vende en las 9 sucursales.",
  valueLead:
    "Hoy Latina Pizza reparte el enlace de cada sucursal en un Linktree. Una web propia reúne menú, promociones y ubicaciones en un dominio propio, aparece en Google cuando buscan «pizza cerca» y dirige cada pedido a la sucursal correcta.",
  sellingPoints: [
    "Todas las sucursales en un solo enlace",
    "Aparecer en Google Maps",
    "Menú y promociones siempre a la vista",
    "Pedidos por WhatsApp y redes",
  ],
  proof: [
    { value: "9+", label: "sucursales en la Zona Norte, Caribe y Occidente del país" },
    { value: "A domicilio", label: "pedidos por WhatsApp y redes sociales" },
    { value: "Al horno", label: "pizza recién hecha en cada pedido" },
  ],
  gallery: PIZZA.gallery,
  testimonials: [
    { name: "Marlon V.", text: "La mejor pizza de la zona. Siempre pido para la familia los viernes." },
    { name: "Katherine S.", text: "Buen precio, buena porción y llega rapidísimo a domicilio." },
    { name: "Diego A.", text: "El sabor es igual de bueno en todas las sucursales. Ya es tradición." },
  ],
  schedule: [
    { day: "Lunes a jueves", hours: "12:00 m.d. - 10:00 p.m." },
    { day: "Viernes y sábado", hours: "12:00 m.d. - 11:00 p.m." },
    { day: "Domingo", hours: "12:00 m.d. - 10:00 p.m." },
  ],
  locationTitle: "9 sucursales para pedir tu pizza favorita.",
  ctaTitle: "Pida su Latina Pizza hoy.",
  ctaText:
    "Síganos en redes para ver el menú y las promos de cada sucursal, y escríbanos para hacer su pedido.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
