import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { BREAD } from "../_shared/images";

export const metadata: Metadata = {
  title: "Panadería Santa Clara | Pan y repostería en Ciudad Quesada",
  description:
    "Propuesta de sitio web para Panadería Santa Clara, en Ciudad Quesada, San Carlos. Pan fresco, repostería y queques por encargo.",
};

const config: BusinessConfig = {
  slug: "panaderia-santa-clara",
  brandIcon: "Wheat",
  name: "Panadería Santa Clara",
  shortName: "Santa Clara",
  category: "Panadería",
  tagline: "Del horno a su mesa",
  city: "Ciudad Quesada, San Carlos",
  address: "Ciudad Quesada, San Carlos, Costa Rica",
  mapsQuery: "Panadería Santa Clara, Ciudad Quesada, San Carlos",
  accent: {
    base: "#e11d48",
    ink: "#ffffff",
    soft: "#ffe4e6",
    deep: "#881337",
    page: "#fdf6f7",
    pageInk: "#1f1418",
  },
  heroImage: BREAD.hero,
  intro:
    "Pan fresco, repostería y queques por encargo en Ciudad Quesada. Tradición de barrio con una página moderna que abre el apetito.",
  offeringsTitle: "Pan calientito todos los días.",
  offeringsLead:
    "Una web muestra la vitrina, ordena la oferta y hace fácil encargar queques y pedidos especiales.",
  offerings: [
    { icon: "Wheat", title: "Pan del día", text: "Pan casero, salado y dulce recién salido del horno.", badge: "Diario" },
    { icon: "CakeSlice", title: "Queques por encargo", text: "Para cumpleaños y celebraciones, hechos a pedido.", badge: "A pedido" },
    { icon: "Cookie", title: "Repostería", text: "Galletas, empanadas y dulces para llevar.", badge: "Dulce" },
    { icon: "Coffee", title: "Café para llevar", text: "El acompañante perfecto para el pan de la tarde.", badge: "Clásico" },
  ],
  valueTitle: "Que el barrio la encuentre y la recomiende.",
  valueLead:
    "Una página con fotos, horario y ubicación posiciona a Santa Clara en Google y facilita los encargos, sin depender de que pasen por el frente.",
  sellingPoints: [
    "Presencia en Google Maps",
    "Encargos por WhatsApp",
    "Horario y ubicación visibles",
    "Fotos que abren el apetito",
  ],
  proof: [
    { value: "Centro", label: "en Ciudad Quesada" },
    { value: "Fresco", label: "pan del día, todos los días" },
    { value: "Encargos", label: "queques a pedido" },
  ],
  gallery: BREAD.gallery,
  schedule: [
    { day: "Lunes a sábado", hours: "6:00 a.m. - 7:00 p.m." },
    { day: "Domingo", hours: "6:00 a.m. - 6:00 p.m." },
  ],
  locationTitle: "En Ciudad Quesada, cerca de su casa.",
  ctaTitle: "Pase por el pan o encargue su queque.",
  ctaText: "Escríbanos para encargos, disponibilidad y pedidos especiales.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
