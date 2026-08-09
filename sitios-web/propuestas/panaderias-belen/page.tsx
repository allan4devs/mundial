import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { BREAD } from "../_shared/images";

export const metadata: Metadata = {
  title: "Panaderías Belén | Pan fresco en Ciudad Quesada, San Carlos",
  description:
    "Propuesta de sitio web para Panaderías Belén San Carlos: pan y repostería fresca en Barrio San Roque, Ciudad Quesada. Pedidos y encargos por teléfono y WhatsApp.",
};

const config: BusinessConfig = {
  slug: "panaderias-belen",
  brandIcon: "Croissant",
  name: "Panaderías Belén San Carlos",
  shortName: "Panaderías Belén",
  category: "Panadería",
  tagline: "Pan fresco todos los días",
  city: "Ciudad Quesada, San Carlos",
  address: "Barrio San Roque, costado sur de McDonald's, Ciudad Quesada, San Carlos",
  phone: "24611538",
  phoneDisplay: "2461-1538",
  whatsapp: "50683753208",
  facebook: "https://www.facebook.com/panaderiabelensancarlos/",
  mapsQuery: "Panaderías Belén San Carlos, Ciudad Quesada",
  accent: {
    base: "#d97706",
    ink: "#ffffff",
    soft: "#fef3c7",
    deep: "#7c2d12",
    page: "#fbf7ef",
    pageInk: "#1c1917",
  },
  heroImage: BREAD.hero,
  intro:
    "La mejor experiencia en panadería y repostería en Barrio San Roque. Pan calientito, dulces caseros y queques por encargo, ahora con una página lista para vender.",
  offeringsTitle: "Lo que sale del horno cada mañana.",
  offeringsLead:
    "Una web ordena la oferta, muestra el producto y facilita el pedido: llamar, escribir o encargar en un toque.",
  offerings: [
    { icon: "Croissant", title: "Pan del día", text: "Pan casero, dulce y salado, recién horneado desde temprano.", badge: "Diario" },
    { icon: "CakeSlice", title: "Queques por encargo", text: "Cumpleaños y celebraciones con sabor de panadería de verdad.", badge: "A pedido" },
    { icon: "Cookie", title: "Repostería", text: "Galletas, rebanadas y dulces para llevar al momento.", badge: "Para compartir" },
    { icon: "Coffee", title: "Para acompañar", text: "Café y bebidas para ese antojo de media tarde.", badge: "Clásico" },
  ],
  valueTitle: "Que la gente encuentre Belén antes de salir de casa.",
  valueLead:
    "Hoy Belén vive en Facebook. Un sitio propio suma Google, ubicación clara, horarios y botones de contacto directo, sin depender solo de las redes.",
  sellingPoints: [
    "Aparecer en Google Maps y búsquedas",
    "Encargos por WhatsApp en un toque",
    "Horario y ubicación siempre visibles",
    "Fotos del producto que abren el apetito",
  ],
  proof: [
    { value: "San Roque", label: "costado sur de McDonald's" },
    { value: "5 a.m.", label: "horno encendido desde temprano" },
    { value: "100%", label: "pan y repostería fresca del día" },
  ],
  gallery: BREAD.gallery,
  testimonials: [
    { name: "Marielos C.", text: "El pan casero es parada obligatoria. Siempre fresco y con buena atención." },
    { name: "José A.", text: "Encargué un queque y quedó precioso. Lo resolvieron con mucho cariño." },
    { name: "Karla V.", text: "Quedan cerca y el olor lo llama a uno. Dulces de toda la vida." },
  ],
  schedule: [
    { day: "Lunes a sábado", hours: "5:00 a.m. - 7:00 p.m." },
    { day: "Domingo", hours: "6:00 a.m. - 12:00 m.d." },
  ],
  locationTitle: "En Barrio San Roque, a la mano de todo San Carlos.",
  ctaTitle: "Pase hoy por el pan o encargue su queque.",
  ctaText: "Llame o escriba por WhatsApp para encargos, disponibilidad y pedidos especiales.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
