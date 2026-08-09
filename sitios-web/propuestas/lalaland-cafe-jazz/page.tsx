import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";
import { LALALAND } from "../_shared/images";

export const metadata: Metadata = {
  title: "Lalaland Cafe Jazz | Cafe de especialidad en Ciudad Quesada",
  description:
    "Propuesta de sitio web para Lalaland Cafe Jazz, cafeteria de especialidad en Plaza El Encuentro, Ciudad Quesada, San Carlos.",
};

const config: BusinessConfig = {
  slug: "lalaland-cafe-jazz",
  brandIcon: "Coffee",
  name: "Lalaland Cafe Jazz",
  shortName: "Lalaland",
  category: "Cafe de especialidad",
  tagline: "Cafe, jazz y buen encuentro",
  city: "Ciudad Quesada, San Carlos",
  address: "Plaza El Encuentro, 800 m sur del parque de Ciudad Quesada",
  phone: "24600259",
  phoneDisplay: "2460 0259",
  facebook: "https://www.facebook.com/p/Lalaland-CAF%C3%89-100086291880077/",
  instagram: "https://www.instagram.com/lalaland_elencuentro/",
  mapsQuery: "Lalaland Coffee Jazz, Plaza El Encuentro, Ciudad Quesada, San Carlos",
  accent: {
    base: "#d69a2d",
    ink: "#16110a",
    soft: "#fbf0d2",
    deep: "#24140b",
    page: "#fff9ee",
    pageInk: "#1f1a14",
  },
  heroImage: LALALAND.hero,
  intro:
    "Cafe de especialidad en Plaza El Encuentro, con mesas calidas, postres, comida y una vibra jazz para conversar, trabajar suavecito o darse un gustico bien hecho.",
  offeringsTitle: "Una cafeteria que se vive con todos los sentidos.",
  offeringsLead:
    "La propuesta ordena el menu, los metodos de infusion, la ubicacion y el contacto en una pagina clara, elegante y facil de compartir.",
  offerings: [
    {
      icon: "Coffee",
      title: "Cafe de especialidad",
      text: "Espresso, bebidas calientes y frias, cafe en bolsa y metodos de infusion para quienes disfrutan cada detalle.",
      badge: "Origen",
    },
    {
      icon: "CakeSlice",
      title: "Postres y antojos",
      text: "Reposteria y opciones dulces para acompanar el cafe sin correr. Aqui el rato se disfruta.",
      badge: "Dulce",
    },
    {
      icon: "Utensils",
      title: "Desayuno, almuerzo y cena",
      text: "Una carta flexible para desayunar, almorzar ejecutivo o pasar por algo rico al final del dia.",
      badge: "Diario",
    },
    {
      icon: "Music",
      title: "Jazz y encuentros",
      text: "Una marca con personalidad: cafe, musica, eventos y ratos especiales en un mismo punto.",
      badge: "Jazz",
    },
  ],
  valueTitle: "Que el mejor cafe de San Carlos tambien se encuentre en Google.",
  valueLead:
    "Lalaland ya tiene una identidad sabrosa en redes. Un sitio propio convierte esa energia en una vitrina estable: horario, ubicacion, menu, eventos, fotos y contacto directo en un solo enlace.",
  sellingPoints: [
    "Menu y metodos de infusion siempre visibles",
    "Contacto directo para eventos y consultas",
    "Ubicacion clara en Plaza El Encuentro",
    "Presencia profesional fuera de redes sociales",
  ],
  proof: [
    { value: "Especialidad", label: "cafe preparado con intencion y tecnica" },
    { value: "El Encuentro", label: "ubicacion reconocible en Ciudad Quesada" },
    { value: "Pet friendly", label: "ambiente familiar con parqueo y WiFi" },
  ],
  gallery: LALALAND.gallery,
  galleryTitle: "Cafe, musica y mesas que invitan a quedarse.",
  galleryLead:
    "Imagenes de referencia pensadas para vender el ambiente de Lalaland: cafe de especialidad, barismo, postres, jazz y encuentros en Plaza El Encuentro.",
  testimonials: [
    {
      name: "Cliente local",
      text: "Un lugar tranquilo para tomar buen cafe y conversar sin prisa. El ambiente invita a quedarse.",
    },
    {
      name: "Amante del cafe",
      text: "Se nota el cuidado en las bebidas y en los metodos de preparacion. Muy buen punto en Quesada.",
    },
    {
      name: "Visita de paso",
      text: "Facil de ubicar, con parqueo y opciones ricas para acompanar el cafe. Recomendado.",
    },
  ],
  schedule: [
    { day: "Lunes a viernes", hours: "6:30 a.m. - 8:30 p.m." },
    { day: "Sabado", hours: "6:00 a.m. - 6:00 p.m." },
    { day: "Domingo", hours: "7:00 a.m. - 7:00 p.m." },
  ],
  locationTitle: "En Plaza El Encuentro, cerquita del movimiento de Ciudad Quesada.",
  ctaTitle: "Un cafecito, buena musica y listo.",
  ctaText:
    "Sigan a Lalaland en redes o llamen para consultar menu, eventos y disponibilidad. La pagina deja todo a un toque.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
