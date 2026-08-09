import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { FOOD } from "../_shared/images";

export const metadata: Metadata = {
  title: "Soda Víquez | Comida tica rápida en Ciudad Quesada, San Carlos",
  description:
    "Propuesta de sitio web para Soda Víquez, comida casera y rápida en Ciudad Quesada, San Carlos. Menú, ubicación y contacto directo.",
};

const config: BusinessConfig = {
  slug: "soda-viquez",
  brandIcon: "Utensils",
  name: "Soda Víquez",
  shortName: "Soda Víquez",
  category: "Soda",
  tagline: "Rápido, rico y casero",
  city: "Ciudad Quesada, San Carlos",
  address: "Ciudad Quesada, San Carlos, Costa Rica",
  mapsQuery: "Soda Víquez, Ciudad Quesada, San Carlos",
  accent: {
    base: "#0d9488",
    ink: "#ffffff",
    soft: "#ccfbf1",
    deep: "#134e4a",
    page: "#f2fbfa",
    pageInk: "#12211f",
  },
  heroImage: FOOD.hero,
  intro:
    "Comida casera y rápida en el centro de Ciudad Quesada. Del casado al gallo, con el sabor de la cocina tica y una página lista para vender.",
  offeringsTitle: "Lo rico, lo rápido y lo de siempre.",
  offeringsLead:
    "El sitio ordena el menú, muestra la ubicación y facilita el pedido para llevar en el día a día.",
  offerings: [
    { icon: "Soup", title: "Casados", text: "El almuerzo completo, bien servido y a buen precio.", badge: "Diario" },
    { icon: "Utensils", title: "Gallos y bocas", text: "Para el antojo rápido a cualquier hora del día.", badge: "Rápido" },
    { icon: "Coffee", title: "Desayunos", text: "Gallo pinto y café para empezar bien la mañana.", badge: "Mañanas" },
    { icon: "ShoppingBag", title: "Para llevar", text: "Comida lista para el trabajo o la casa.", badge: "Express" },
  ],
  valueTitle: "Que lo encuentren cuando buscan dónde almorzar.",
  valueLead:
    "Muchos clientes buscan en Google dónde comer cerca. Una web propia pone a Soda Víquez en el mapa, con horario, menú y contacto directo.",
  sellingPoints: [
    "Aparecer en Google Maps",
    "Menú del día a la vista",
    "Ubicación y horario claros",
    "Pedidos para llevar sencillos",
  ],
  proof: [
    { value: "Centro", label: "en Ciudad Quesada" },
    { value: "Casero", label: "sabor de cocina tica" },
    { value: "Rápido", label: "listo para llevar" },
  ],
  gallery: FOOD.gallery,
  schedule: [
    { day: "Lunes a sábado", hours: "6:30 a.m. - 6:00 p.m." },
    { day: "Domingo", hours: "Horario especial" },
  ],
  locationTitle: "En el centro de Ciudad Quesada, a la mano de todos.",
  ctaTitle: "Venga a almorzar rico.",
  ctaText: "Consulte el menú del día y pida para llevar. Comida casera lista en minutos.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
