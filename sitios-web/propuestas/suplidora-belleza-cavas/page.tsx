import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";

export const metadata: Metadata = {
  title: "Suplidora de Belleza Cavas | Productos de belleza en San Carlos",
  description:
    "Propuesta de sitio web para Suplidora de Belleza Cavas. Productos para cabello, uñas, estética y cuidado personal, con pedidos por WhatsApp.",
};

const config: BusinessConfig = {
  slug: "suplidora-belleza-cavas",
  brandIcon: "ShoppingBag",
  brandLogo: "/propuestas/suplidora-belleza-cavas/logo.svg",
  name: "Suplidora de Belleza Cavas",
  shortName: "Cavas",
  category: "Suplidora de belleza",
  tagline: "Belleza profesional a su alcance",
  city: "San Carlos, Costa Rica",
  address: "Consulte ubicación y entregas por WhatsApp",
  phone: "84555464",
  phoneDisplay: "8455-5464",
  whatsapp: "50684555464",
  mapsQuery: "San Carlos, Alajuela, Costa Rica",
  accent: {
    base: "#d8ad54",
    ink: "#120d05",
    soft: "#f7ecd3",
    deep: "#080705",
    page: "#fbf8f1",
    pageInk: "#211b12",
  },
  intro:
    "Productos de belleza para profesionales y para quienes aman cuidarse. Consulte el catálogo y haga su pedido directo por WhatsApp.",
  offeringsTitle: "Todo para crear, cuidar y brillar.",
  offeringsLead:
    "Una vitrina clara para encontrar cada categoría y consultar marcas, tonos, presentaciones y disponibilidad sin perder tiempo.",
  offerings: [
    { icon: "Brush", title: "Cabello", text: "Coloración, tratamientos, herramientas y cuidado capilar.", badge: "Hair" },
    { icon: "Sparkles", title: "Uñas", text: "Esmaltes, geles, acrílicos, decoración y accesorios.", badge: "Nails" },
    { icon: "Heart", title: "Estética", text: "Productos para rostro, pestañas, cejas y cuidado personal.", badge: "Beauty" },
    { icon: "ShoppingBag", title: "Pedidos", text: "Atención directa para consultar productos y disponibilidad.", badge: "WhatsApp" },
  ],
  valueTitle: "Su catálogo, siempre a un toque de distancia.",
  valueLead:
    "La página convierte consultas en pedidos: organiza el inventario por categorías, da confianza a nuevos clientes y lleva cada producto directo a WhatsApp.",
  sellingPoints: [
    "Catálogo organizado por categorías",
    "Consultas directas por WhatsApp",
    "Diseño premium alineado con la marca",
    "Información clara desde cualquier celular",
  ],
  proof: [
    { value: "4 categorías", label: "para encontrar lo que busca más rápido" },
    { value: "WhatsApp", label: "consultas y pedidos en un solo toque" },
    { value: "Móvil", label: "una experiencia pensada para el celular" },
  ],
  locationTitle: "Pregunte por ubicación, entregas y disponibilidad.",
  ctaTitle: "¿Busca un producto de belleza?",
  ctaText:
    "Escríbanos al 8455-5464 y cuéntenos qué necesita. Le ayudamos a encontrar la opción indicada.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
