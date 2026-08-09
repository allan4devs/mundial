import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { LALALAND } from "../_shared/images";

export const metadata: Metadata = {
  title: "Amaretto's Cafe | Cafe y express en Ciudad Quesada",
  description:
    "Propuesta de sitio web para Amaretto's Cafe, en Ciudad Quesada, San Carlos. Cafe, reposteria, pedidos express y contacto directo.",
};

const config: BusinessConfig = {
  slug: "amarettos-cafe",
  brandIcon: "Coffee",
  name: "Amaretto's Cafe",
  shortName: "Amaretto's",
  category: "Cafe & reposteria",
  tagline: "Cafe que cambia el ritmo del dia",
  city: "Ciudad Quesada, San Carlos",
  address:
    "30 mts sur-este de la Municipalidad de San Carlos, Quesada, Costa Rica",
  phone: "24624343",
  phoneDisplay: "2462 4343",
  whatsapp: "50624624343",
  facebook: "https://www.facebook.com/amarettoscq",
  email: "amarettoscafe@gmail.com",
  mapsQuery:
    "Amaretto's Cafe, 30 mts sur-este de la Municipalidad de San Carlos, Quesada, Costa Rica",
  accent: {
    base: "#9b5c2e",
    ink: "#fff7ed",
    soft: "#f7eadc",
    deep: "#2f1a10",
    page: "#fff8f0",
    pageInk: "#211913",
  },
  heroImage: LALALAND.hero,
  intro:
    "Hay dias que empiezan con cafe y otros que simplemente no empiezan sin el. Amaretto's Cafe es ese punto calido en Ciudad Quesada para darse un momento rico, pedir express o conversar con calma.",
  offeringsTitle: "Cafe, antojos y express en el centro de Quesada.",
  offeringsLead:
    "La propuesta convierte la energia de Facebook en una pagina propia con menu, horario, ubicacion, pedidos y contacto directo en celular.",
  offerings: [
    {
      icon: "Coffee",
      title: "Cafe favorito",
      text: "Bebidas calientes y frias para arrancar el dia, pausar la tarde o acompanarse una buena conversacion.",
      badge: "Diario",
    },
    {
      icon: "CakeSlice",
      title: "Reposteria y dulces",
      text: "Antojos para acompanar el cafe y mostrar en una galeria que venda por los ojos.",
      badge: "Dulce",
    },
    {
      icon: "ShoppingBag",
      title: "Pedidos express",
      text: "Telefono y WhatsApp visibles para que la gente pida rapido sin perderse buscando datos.",
      badge: "Express",
    },
    {
      icon: "HeartHandshake",
      title: "Punto de encuentro",
      text: "Un lugar cerca de la Municipalidad para pasar por cafe, reunirse o resolver el antojo del dia.",
      badge: "Centro",
    },
  ],
  valueTitle: "Que cada antojo encuentre rapido a Amaretto's.",
  valueLead:
    "Una web propia ayuda a que el horario, ubicacion, telefono, express y fotos esten claros fuera de Facebook. Menos vueltas para el cliente, mas contactos para el negocio.",
  sellingPoints: [
    "Pedidos express al 2462 4343",
    "Horario claro de lunes a sabado",
    "Ubicacion exacta cerca de la Municipalidad",
    "Fotos de cafe y reposteria listas para vender",
  ],
  proof: [
    { value: "2462 4343", label: "telefono y express directo" },
    { value: "8:00 a.m.", label: "abre de lunes a sabado" },
    { value: "Centro", label: "30 m sureste de la Municipalidad" },
  ],
  gallery: LALALAND.gallery,
  galleryTitle: "Un sitio que antoja desde la primera foto.",
  galleryLead:
    "Imagenes de referencia para mostrar cafe, reposteria, barismo, mesas calidas y pedidos. Se pueden cambiar por fotos reales de Amaretto's cuando esten listas.",
  testimonials: [
    {
      name: "Cliente de Quesada",
      text: "Un buen cafe cambia el ritmo del dia. Amaretto's es de esos lugares para hacer pausa y seguir con gusto.",
    },
    {
      name: "Pedido express",
      text: "Tener telefono, horario y ubicacion a mano hace facil pedir o pasar por el antojo.",
    },
    {
      name: "Visita del centro",
      text: "Cerca de la Municipalidad, practico para reunirse o comprar algo rico en el dia.",
    },
  ],
  schedule: [
    { day: "Lunes a sabado", hours: "8:00 a.m. - 7:00 p.m." },
    { day: "Domingo", hours: "Consultar disponibilidad" },
  ],
  locationTitle: "30 metros sureste de la Municipalidad de San Carlos.",
  ctaTitle: "Pase por su cafe favorito.",
  ctaText:
    "Llame o escriba por WhatsApp para pedidos express, consultas del menu o para ubicar Amaretto's en Ciudad Quesada.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
