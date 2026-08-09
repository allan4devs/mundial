import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { COFFEE } from "../_shared/images";

export const metadata: Metadata = {
  title: "La Cafetería | Café y comida en Ciudad Quesada, San Carlos",
  description:
    "Propuesta de sitio web para Restaurante La Cafetería, en Calle San Luis, Ciudad Quesada. Café, desayunos y comida con contacto directo.",
};

const config: BusinessConfig = {
  slug: "la-cafeteria",
  brandIcon: "Coffee",
  name: "Restaurante La Cafetería",
  shortName: "La Cafetería",
  category: "Café & Restaurante",
  tagline: "Cafecito y buena mesa",
  city: "Ciudad Quesada, San Carlos",
  address: "Calle San Luis, Ciudad Quesada, San Carlos",
  facebook: "https://www.facebook.com/lacafeteria.cr/",
  mapsQuery: "Restaurante La Cafetería, Calle San Luis, Ciudad Quesada",
  accent: {
    base: "#92400e",
    ink: "#ffffff",
    soft: "#f5ede1",
    deep: "#451a03",
    page: "#faf6f0",
    pageInk: "#1c1917",
  },
  heroImage: COFFEE.hero,
  intro:
    "Un lugar para el cafecito, el desayuno y la buena conversación en Calle San Luis. Ahora con una página que invita a llegar.",
  offeringsTitle: "El punto de encuentro de Ciudad Quesada.",
  offeringsLead:
    "El sitio muestra el ambiente, la carta y la ubicación, y hace fácil escribir para reservar o consultar.",
  offerings: [
    { icon: "Coffee", title: "Café de la casa", text: "Espresso, capuchino y café pasado para cualquier momento del día.", badge: "Siempre" },
    { icon: "CakeSlice", title: "Repostería", text: "Postres y dulces frescos para acompañar el café.", badge: "Dulce" },
    { icon: "Utensils", title: "Desayunos y almuerzos", text: "Comida casera para arrancar o recargar el día.", badge: "Diario" },
    { icon: "HeartHandshake", title: "Ambiente ameno", text: "El lugar ideal para reunirse, trabajar o conversar.", badge: "Acogedor" },
  ],
  valueTitle: "Que la gente lo encuentre y quiera venir.",
  valueLead:
    "Una página con fotos del ambiente, ubicación clara y contacto directo posiciona a La Cafetería más allá de Facebook, en Google y en el celular de cada cliente.",
  sellingPoints: [
    "Presencia en Google Maps",
    "Carta y ambiente a la vista",
    "Contacto directo por redes",
    "Ubicación clara en Calle San Luis",
  ],
  proof: [
    { value: "Calle San Luis", label: "en pleno Ciudad Quesada" },
    { value: "Café", label: "y comida casera todos los días" },
    { value: "Local", label: "punto de encuentro sancarleño" },
  ],
  gallery: COFFEE.gallery,
  schedule: [
    { day: "Lunes a viernes", hours: "7:00 a.m. - 7:00 p.m." },
    { day: "Sábado", hours: "7:00 a.m. - 5:00 p.m." },
  ],
  locationTitle: "En Calle San Luis, el corazón de Ciudad Quesada.",
  ctaTitle: "Pase por un cafecito.",
  ctaText: "Escríbanos por Facebook para consultas, eventos o reservas. Lo esperamos.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
