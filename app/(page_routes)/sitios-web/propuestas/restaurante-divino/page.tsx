import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { FOOD } from "../_shared/images";

export const metadata: Metadata = {
  title: "Restaurante Divino | Comida y sabor en Ciudad Quesada",
  description:
    "Propuesta de sitio web para Restaurante Divino, en el centro de Ciudad Quesada, San Carlos, 125 m oeste del Hospital Cooperativo.",
};

const config: BusinessConfig = {
  slug: "restaurante-divino",
  brandIcon: "UtensilsCrossed",
  name: "Restaurante Divino",
  shortName: "Divino",
  category: "Restaurante",
  tagline: "Sabor que se disfruta",
  city: "Ciudad Quesada, San Carlos",
  address: "125 m oeste del Hospital Cooperativo, Ciudad Quesada, San Carlos",
  instagram: "https://www.instagram.com/",
  mapsQuery: "Restaurante Divino, Ciudad Quesada, San Carlos",
  accent: {
    base: "#7c3aed",
    ink: "#ffffff",
    soft: "#ede9fe",
    deep: "#3b0764",
    page: "#f8f6fd",
    pageInk: "#1a1626",
  },
  heroImage: FOOD.hero,
  intro:
    "Comida rica y ambiente agradable en el centro de Ciudad Quesada. Un restaurante para disfrutar, ahora con una página que muestra todo su sabor.",
  offeringsTitle: "Platos para todos los antojos.",
  offeringsLead:
    "El sitio presenta la carta, el ambiente y la ubicación, y hace fácil reservar o pedir para llevar.",
  offerings: [
    { icon: "Utensils", title: "Platos fuertes", text: "Comida bien servida, con sabor y buena presentación.", badge: "Favorito" },
    { icon: "Soup", title: "Almuerzos", text: "Opciones del día para comer rico sin complicarse.", badge: "Diario" },
    { icon: "Coffee", title: "Bebidas y postres", text: "El cierre perfecto para cualquier comida.", badge: "Dulce" },
    { icon: "ShoppingBag", title: "Para llevar", text: "Pida y disfrute donde quiera, listo al momento.", badge: "Express" },
  ],
  valueTitle: "De Instagram a un sitio que reserva y vende.",
  valueLead:
    "Divino ya muestra su menú en historias de Instagram. Una web propia reúne carta, ubicación y contacto en un enlace, y aparece en Google cuando buscan dónde comer.",
  sellingPoints: [
    "Aparecer en Google Maps",
    "Carta siempre disponible",
    "Reservas y pedidos por WhatsApp",
    "Un enlace único para toda la marca",
  ],
  proof: [
    { value: "Centro", label: "125 m oeste del Hospital Cooperativo" },
    { value: "Ambiente", label: "para disfrutar en familia" },
    { value: "Sabor", label: "platos para todos los gustos" },
  ],
  gallery: FOOD.gallery,
  testimonials: [
    { name: "Fernando C.", text: "Buena comida y ambiente agradable. Bien ubicado en el centro." },
    { name: "Sofía R.", text: "Los platos son sabrosos y la atención muy amable. Volveré." },
    { name: "Álvaro M.", text: "Ideal para almorzar en Quesada. Porciones buenas y precio justo." },
  ],
  schedule: [
    { day: "Lunes a sábado", hours: "11:00 a.m. - 9:00 p.m." },
    { day: "Domingo", hours: "11:00 a.m. - 5:00 p.m." },
  ],
  locationTitle: "En el centro, 125 m oeste del Hospital Cooperativo.",
  ctaTitle: "Venga a disfrutar de Divino.",
  ctaText: "Síganos en redes para ver el menú del día y escríbanos para reservas o pedidos.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
