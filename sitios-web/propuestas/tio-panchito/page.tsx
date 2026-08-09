import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { COFFEE } from "../_shared/images";

export const metadata: Metadata = {
  title: "Panadería y Cafetería Tío Panchito | Ciudad Quesada, San Carlos",
  description:
    "Propuesta de sitio web para Panadería y Cafetería Tío Panchito, en Ciudad Quesada, San Carlos. Pan fresco, café y repostería desde temprano.",
};

const config: BusinessConfig = {
  slug: "tio-panchito",
  brandIcon: "Croissant",
  name: "Panadería y Cafetería Tío Panchito",
  shortName: "Tío Panchito",
  category: "Panadería & Café",
  tagline: "Pan y café desde temprano",
  city: "Ciudad Quesada, San Carlos",
  address: "Ciudad Quesada, San Carlos, Costa Rica",
  mapsQuery: "Panadería y Cafetería Tío Panchito, Ciudad Quesada",
  accent: {
    base: "#ea580c",
    ink: "#ffffff",
    soft: "#ffedd5",
    deep: "#7c2d12",
    page: "#fbf6f1",
    pageInk: "#1c1917",
  },
  heroImage: COFFEE.hero,
  intro:
    "Panadería y cafetería con el horno encendido desde temprano. Pan fresco, café y repostería para empezar bien el día, ahora con una página que invita a pasar.",
  offeringsTitle: "Pan, café y algo dulce para el camino.",
  offeringsLead:
    "El sitio muestra la oferta, el horario amplio y la ubicación, y facilita el pedido para llevar.",
  offerings: [
    { icon: "Croissant", title: "Pan fresco", text: "Del horno a la vitrina, salado y dulce todo el día.", badge: "Diario" },
    { icon: "Coffee", title: "Café de la casa", text: "Para acompañar el pan o llevar en el camino.", badge: "Siempre" },
    { icon: "CakeSlice", title: "Repostería", text: "Queques, rebanadas y dulces para todos los gustos.", badge: "Dulce" },
    { icon: "ShoppingBag", title: "Para llevar", text: "Desayunos y meriendas listas al momento.", badge: "Express" },
  ],
  valueTitle: "Horario amplio, presencia amplia.",
  valueLead:
    "Con horario extendido, Tío Panchito atiende a muchos. Una web propia lo pone en Google Maps con horario y contacto siempre visibles.",
  sellingPoints: [
    "Aparecer en Google Maps",
    "Horario amplio siempre visible",
    "Pedidos por WhatsApp",
    "Fotos de pan y café que venden",
  ],
  proof: [
    { value: "5 a.m.", label: "horno encendido desde temprano" },
    { value: "Centro", label: "en Ciudad Quesada" },
    { value: "Pan + Café", label: "todo en un solo lugar" },
  ],
  gallery: COFFEE.gallery,
  schedule: [
    { day: "Lunes a viernes", hours: "5:00 a.m. - 7:00 p.m." },
    { day: "Sábado", hours: "5:00 a.m. - 6:00 p.m." },
    { day: "Domingo", hours: "6:00 a.m. - 11:00 a.m." },
  ],
  locationTitle: "En Ciudad Quesada, abierto desde temprano.",
  ctaTitle: "Pase por el pan y el cafecito.",
  ctaText: "Consulte la oferta del día y pida para llevar. Lo esperamos desde temprano.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
