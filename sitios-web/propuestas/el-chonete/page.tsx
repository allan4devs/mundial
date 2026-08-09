import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { FOOD } from "../_shared/images";

export const metadata: Metadata = {
  title: "El Chonete | Comida típica costarricense en Ciudad Quesada",
  description:
    "Propuesta de sitio web para El Chonete: comida típica sancarleña reinventada, en Ciudad Quesada frente a la bomba Delta. Menú, fotos y pedidos.",
};

const config: BusinessConfig = {
  slug: "el-chonete",
  brandIcon: "UtensilsCrossed",
  name: "El Chonete",
  shortName: "El Chonete",
  category: "Comida típica",
  tagline: "Sabor tico, servido bonito",
  city: "Ciudad Quesada, San Carlos",
  address: "Frente a la bomba Delta, Ciudad Quesada, San Carlos",
  phone: "24600534",
  phoneDisplay: "2460-0534",
  facebook: "https://www.facebook.com/elchonetecr/",
  instagram: "https://www.instagram.com/elchonetecr/",
  mapsQuery: "El Chonete, Ciudad Quesada, San Carlos",
  accent: {
    base: "#dc2626",
    ink: "#ffffff",
    soft: "#fee2e2",
    deep: "#7f1d1d",
    page: "#fbf6f2",
    pageInk: "#1c1917",
  },
  heroImage: FOOD.hero,
  intro:
    "El Chonete reinventó la forma de presentar lo mejor de la comida costarricense. Ahora ese mismo sabor merece una página que lo muestre y lo venda.",
  offeringsTitle: "Comida de siempre, presentada como nunca.",
  offeringsLead:
    "El sitio agrupa el menú como piensa el cliente y lleva directo a pedir, con fotos que despiertan el antojo.",
  offerings: [
    { icon: "Soup", title: "Casados y típicos", text: "Lo mejor de la cocina tica, bien servido y con sazón de la casa.", badge: "Favorito" },
    { icon: "Coffee", title: "Desayunos", text: "Gallo pinto, café y todo para arrancar el día como se debe.", badge: "Mañanas" },
    { icon: "Utensils", title: "Especiales", text: "Platos de la casa que reinventan lo típico con presentación fresca.", badge: "De la casa" },
    { icon: "ShoppingBag", title: "Para llevar", text: "Pedidos y entrega para disfrutar donde quiera.", badge: "Express" },
  ],
  valueTitle: "De Facebook e Instagram a un sitio que vende solo.",
  valueLead:
    "El Chonete ya tiene una comunidad grande en redes. Una web propia convierte esos seguidores en pedidos, con menú, ubicación y contacto en un solo lugar.",
  sellingPoints: [
    "Menú claro y siempre disponible",
    "Aparecer en Google y Maps",
    "Fotos reales listas para redes",
    "Un enlace único para toda la marca",
  ],
  proof: [
    { value: "9.1 mil", label: "seguidores en Facebook" },
    { value: "4.3★", label: "calificación en reseñas" },
    { value: "Centro", label: "frente a la bomba Delta" },
  ],
  gallery: FOOD.gallery,
  testimonials: [
    { name: "Andrés M.", text: "Comida tica auténtica, buen precio y excelente servicio. Un clásico de Quesada." },
    { name: "Laura P.", text: "La presentación es otro nivel para ser comida típica. Me encanta." },
    { name: "Diego R.", text: "Voy por los desayunos. El gallo pinto y el café no fallan." },
  ],
  schedule: [
    { day: "Lunes a sábado", hours: "7:00 a.m. - 8:00 p.m." },
    { day: "Domingo", hours: "7:00 a.m. - 4:00 p.m." },
  ],
  locationTitle: "En el centro de Ciudad Quesada, fácil de llegar.",
  ctaTitle: "Venga por lo mejor de la comida tica.",
  ctaText: "Llámenos para pedidos y consultas, o síganos en redes para ver el menú del día.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
