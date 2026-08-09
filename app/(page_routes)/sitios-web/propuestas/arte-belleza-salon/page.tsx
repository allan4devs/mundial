import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";

export const metadata: Metadata = {
  title: "Arte & Belleza Salón | Estética y belleza en Ciudad Quesada",
  description:
    "Propuesta de sitio web para Arte & Belleza Salón, en Ciudad Quesada, San Carlos. Corte, peinado, color, uñas y más, con reservas por WhatsApp.",
};

const config: BusinessConfig = {
  slug: "arte-belleza-salon",
  brandIcon: "Scissors",
  name: "Arte & Belleza Salón",
  shortName: "Arte & Belleza",
  category: "Salón de belleza",
  tagline: "Realzamos su mejor versión",
  city: "Ciudad Quesada, San Carlos",
  address: "Ciudad Quesada, San Carlos, Costa Rica",
  mapsQuery: "Arte & Belleza Salón, Ciudad Quesada, San Carlos",
  accent: {
    base: "#db2777",
    ink: "#ffffff",
    soft: "#fce7f3",
    deep: "#831843",
    page: "#fdf5f9",
    pageInk: "#23131c",
  },
  intro:
    "Corte, peinado, color, uñas y tratamientos con manos expertas. Un salón para verse y sentirse bien, ahora con una página que llena la agenda.",
  offeringsTitle: "Servicios para lucir espectacular.",
  offeringsLead:
    "El sitio muestra los servicios, el estilo del salón y la ubicación, y permite reservar por WhatsApp en segundos.",
  offerings: [
    { icon: "Scissors", title: "Corte y peinado", text: "Estilos frescos para damas y caballeros.", badge: "Clásico" },
    { icon: "Brush", title: "Color y mechas", text: "Tintes, balayage y tratamientos que cuidan el cabello.", badge: "Color" },
    { icon: "Sparkles", title: "Uñas", text: "Manicure, pedicure y uñas acrílicas o en gel.", badge: "Nails" },
    { icon: "Heart", title: "Estética", text: "Cejas, pestañas y tratamientos faciales de belleza.", badge: "Spa" },
  ],
  valueTitle: "Que la agenda se llene desde el celular.",
  valueLead:
    "Las clientas buscan salón en Google y reservan por WhatsApp. Una web propia muestra el trabajo, el horario y el contacto, y convierte seguidoras en citas.",
  sellingPoints: [
    "Reservas por WhatsApp en segundos",
    "Aparecer en Google Maps",
    "Galería de trabajos que enamoran",
    "Servicios y horario siempre visibles",
  ],
  proof: [
    { value: "Centro", label: "en Ciudad Quesada" },
    { value: "Cabello + uñas", label: "todo en un solo lugar" },
    { value: "Citas", label: "reserve por WhatsApp" },
  ],
  testimonials: [
    { name: "Daniela V.", text: "Me encantó el color y el trato. Salí feliz y volveré sin duda." },
    { name: "Priscilla S.", text: "Las uñas quedan divinas y duran muchísimo. Súper recomendado." },
    { name: "Melissa A.", text: "Atención personalizada y buen gusto. El salón es muy acogedor." },
  ],
  schedule: [
    { day: "Lunes a viernes", hours: "9:00 a.m. - 7:00 p.m." },
    { day: "Sábado", hours: "8:00 a.m. - 5:00 p.m." },
  ],
  locationTitle: "En Ciudad Quesada, cerca de usted.",
  ctaTitle: "Reserve su cita y luzca espectacular.",
  ctaText: "Escríbanos para agendar corte, color, uñas o tratamientos. La esperamos.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
