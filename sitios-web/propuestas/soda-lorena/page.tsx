import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { FOOD } from "../_shared/images";

export const metadata: Metadata = {
  title: "Soda Lorena | Comida casera tica en Ciudad Quesada desde 1985",
  description:
    "Propuesta de sitio web para Soda Lorena, comida casera costarricense en Ciudad Quesada, San Carlos, con tradición desde 1985.",
};

const config: BusinessConfig = {
  slug: "soda-lorena",
  brandIcon: "Soup",
  name: "Soda Lorena",
  shortName: "Soda Lorena",
  category: "Soda",
  tagline: "Comida casera desde 1985",
  city: "Ciudad Quesada, San Carlos",
  address: "Ciudad Quesada, San Carlos, Costa Rica",
  facebook: "https://www.facebook.com/Sodalorena/",
  mapsQuery: "Soda Lorena, Ciudad Quesada, San Carlos",
  accent: {
    base: "#16a34a",
    ink: "#ffffff",
    soft: "#dcfce7",
    deep: "#14532d",
    page: "#f5faf6",
    pageInk: "#14210f",
  },
  heroImage: FOOD.hero,
  intro:
    "Comida casera tica con sazón de toda la vida. Desde 1985 alimentando a San Carlos, ahora con una página a la altura de su tradición.",
  offeringsTitle: "El casado de siempre, con cariño de siempre.",
  offeringsLead:
    "Una web muestra el menú del día, la ubicación y el horario, y facilita el pedido para llevar.",
  offerings: [
    { icon: "Soup", title: "Casados del día", text: "Arroz, frijoles, carne y ensalada como en casa.", badge: "Diario" },
    { icon: "Utensils", title: "Desayunos ticos", text: "Gallo pinto, huevos y café para arrancar con energía.", badge: "Mañanas" },
    { icon: "Salad", title: "Platos caseros", text: "Ollas de carne, sopas y especiales según el día.", badge: "Casero" },
    { icon: "ShoppingBag", title: "Para llevar", text: "Almuerzos listos para trabajar o llevar a casa.", badge: "Express" },
  ],
  valueTitle: "Casi 40 años de tradición merecen estar en Google.",
  valueLead:
    "Soda Lorena es un clásico sancarleño. Una web propia le da presencia en Google Maps, horarios visibles y contacto directo, más allá de Facebook.",
  sellingPoints: [
    "Aparecer en Google Maps",
    "Menú del día siempre visible",
    "Horario y ubicación claros",
    "Pedidos para llevar por WhatsApp",
  ],
  proof: [
    { value: "1985", label: "sirviendo comida casera" },
    { value: "Centro", label: "en Ciudad Quesada" },
    { value: "Tico", label: "sazón casero de toda la vida" },
  ],
  gallery: FOOD.gallery,
  testimonials: [
    { name: "Rodrigo S.", text: "El casado es de los mejores de Quesada. Comida de verdad, como en casa." },
    { name: "Ana L.", text: "Precio justo, porciones generosas y buena atención. Un clásico." },
    { name: "Mauricio J.", text: "Voy desde hace años. Nunca decepciona el sabor casero." },
  ],
  schedule: [
    { day: "Lunes a sábado", hours: "6:00 a.m. - 6:00 p.m." },
    { day: "Domingo", hours: "Cerrado" },
  ],
  locationTitle: "En Ciudad Quesada, un clásico que no falla.",
  ctaTitle: "Venga por el casado de siempre.",
  ctaText: "Escríbanos por Facebook para el menú del día o pedidos para llevar.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
