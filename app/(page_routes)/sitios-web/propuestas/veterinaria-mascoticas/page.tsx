import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";

export const metadata: Metadata = {
  title: "Clínica Veterinaria Mascoticas | Ciudad Quesada, San Carlos",
  description:
    "Propuesta de sitio web para Clínica Veterinaria Mascoticas, en Ciudad Quesada, San Carlos. Consulta, vacunación y cuidado para su mascota.",
};

const config: BusinessConfig = {
  slug: "veterinaria-mascoticas",
  brandIcon: "PawPrint",
  name: "Clínica Veterinaria Mascoticas",
  shortName: "Mascoticas",
  category: "Veterinaria",
  tagline: "Cuidamos a quien más quiere",
  city: "Ciudad Quesada, San Carlos",
  address: "25 m sur de Green Forest School, Ciudad Quesada, San Carlos",
  phone: "72124832",
  phoneDisplay: "7212-4832",
  whatsapp: "50672124832",
  instagram: "https://www.instagram.com/vetemascoticas/",
  mapsQuery: "Clínica Veterinaria Mascoticas, Ciudad Quesada, San Carlos",
  accent: {
    base: "#0891b2",
    ink: "#ffffff",
    soft: "#cffafe",
    deep: "#164e63",
    page: "#f2fafc",
    pageInk: "#12212a",
  },
  intro:
    "Consulta, vacunación y cuidado con cariño para perros, gatos y más. La salud de su mascota merece una clínica de confianza y una página que la haga fácil de encontrar.",
  offeringsTitle: "Todo para la salud de su mascota.",
  offeringsLead:
    "El sitio muestra los servicios, la ubicación y el horario, y permite agendar o consultar por WhatsApp al instante.",
  offerings: [
    { icon: "Stethoscope", title: "Consulta general", text: "Chequeos y diagnóstico con atención cercana y profesional.", badge: "Salud" },
    { icon: "Syringe", title: "Vacunación", text: "Esquemas de vacunas y desparasitación al día.", badge: "Prevención" },
    { icon: "Heart", title: "Cirugía y castración", text: "Procedimientos con seguimiento y cuidado responsable.", badge: "Cuidado" },
    { icon: "Bone", title: "Tienda y alimentos", text: "Concentrados, accesorios y productos para su mascota.", badge: "Pet shop" },
  ],
  valueTitle: "Que los dueños la encuentren en la emergencia.",
  valueLead:
    "Cuando una mascota se enferma, el dueño busca en Google. Una web propia pone a Mascoticas en el mapa, con teléfono, horario y WhatsApp directo para agendar.",
  sellingPoints: [
    "Aparecer en Google Maps",
    "Agendar por WhatsApp al instante",
    "Servicios y horario claros",
    "Teléfono de emergencia visible",
  ],
  proof: [
    { value: "Green Forest", label: "25 m sur de la escuela" },
    { value: "Perros y gatos", label: "y más mascotas de la familia" },
    { value: "WhatsApp", label: "consultas y citas directas" },
  ],
  testimonials: [
    { name: "Gabriela M.", text: "Trato excelente con mi perrita. Se nota el cariño y la vocación." },
    { name: "Esteban R.", text: "Atención rápida y precios justos. Recomiendo Mascoticas al 100%." },
    { name: "Natalia F.", text: "Me explicaron todo con paciencia. Mi gato quedó en buenas manos." },
  ],
  schedule: [
    { day: "Lunes a viernes", hours: "8:00 a.m. - 6:00 p.m." },
    { day: "Sábado", hours: "8:00 a.m. - 1:00 p.m." },
  ],
  locationTitle: "A 25 metros sur de Green Forest School.",
  ctaTitle: "Agende la cita de su mascota.",
  ctaText: "Llame o escriba por WhatsApp para consultas, citas y emergencias. Estamos para ayudar.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
