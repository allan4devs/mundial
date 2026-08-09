import type { Metadata } from "next";
import ProposalSite from "../_shared/ProposalSite";
import type { BusinessConfig } from "../_shared/types";

export const metadata: Metadata = {
  title: "Realm Fitness CR | Ciudad Quesada, San Carlos",
  description:
    "Propuesta de sitio web para Realm Fitness CR en Ciudad Quesada, San Carlos. Pesas semi personalizado, funcionales y contacto directo por WhatsApp.",
};

const config: BusinessConfig = {
  slug: "realm-fitness-ciudad-quesada",
  brandIcon: "Dumbbell",
  name: "Realm Fitness CR",
  shortName: "Realm Fitness",
  category: "Gimnasio",
  tagline: "Entrene fuerte, con guia y buen ambiente",
  city: "Ciudad Quesada, San Carlos",
  address: "Sector Hogar de Ancianos, Ciudad Quesada, San Carlos",
  phone: "72026311",
  phoneDisplay: "7202-6311",
  whatsapp: "50672026311",
  facebook: "https://www.facebook.com/realmfitnesss/?locale=es_LA",
  instagram: "https://www.instagram.com/realmfitcr/",
  mapsQuery: "Realm Fitness, Hogar de Ancianos, Ciudad Quesada, San Carlos",
  accent: {
    base: "#84cc16",
    ink: "#111827",
    soft: "#ecfccb",
    deep: "#18181b",
    page: "#f7f8f3",
    pageInk: "#171717",
  },
  heroImage:
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=85",
  intro:
    "Pesas semi personalizado y funcionales en Ciudad Quesada. Un sitio moderno para que la gente vea el ambiente, consulte por WhatsApp y llegue al gym sin vueltas.",
  offeringsTitle: "Un gym que se entiende en segundos.",
  offeringsLead:
    "La propuesta ordena lo que Realm ya comunica en redes: entrenamiento con seguimiento, funcionales, ubicacion clara y contacto directo para inscripciones o promociones vigentes.",
  offerings: [
    {
      icon: "Dumbbell",
      title: "Pesas semi personalizado",
      text: "Rutinas y acompanamiento para entrenar con mejor tecnica y avanzar con constancia.",
      badge: "Fuerza",
    },
    {
      icon: "Activity",
      title: "Funcionales",
      text: "Sesiones dinamicas para condicion fisica, resistencia y energia de verdad.",
      badge: "Movimiento",
    },
    {
      icon: "Users",
      title: "Comunidad Realm",
      text: "Un ambiente activo, cercano y motivador para principiantes y gente con experiencia.",
      badge: "Ambiente",
    },
    {
      icon: "Zap",
      title: "Promos al dia",
      text: "Bloques listos para publicar mensualidades, matriculas y ofertas sin depender solo de posts.",
      badge: "Ventas",
    },
  ],
  valueTitle: "Que el cliente llegue decidido, no perdido.",
  valueLead:
    "Un sitio web propio ayuda a convertir busquedas de Google e Instagram en mensajes reales. La persona ve servicios, ubicacion, fotos, redes y boton de WhatsApp antes de escribir.",
  sellingPoints: [
    "WhatsApp visible para inscripciones",
    "Ubicacion enlazada a Google Maps",
    "Servicios explicados sin ruido",
    "Espacio para promociones vigentes",
    "Galeria conectada al estilo del gym",
    "Redes sociales en un solo lugar",
  ],
  proof: [
    { value: "3.3K+", label: "seguidores aproximados en Instagram" },
    { value: "7202-6311", label: "WhatsApp publico para consultas" },
    { value: "CQ", label: "Hogar de Ancianos, Ciudad Quesada" },
  ],
  galleryTitle: "Energia visual para vender entrenamiento.",
  galleryLead:
    "Fotos de referencia para presentar fuerza, funcionales y comunidad; se reemplazan por fotos reales de Realm cuando esten listas.",
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80",
      alt: "Zona de entrenamiento funcional",
      label: "Funcionales",
      wide: true,
    },
    {
      src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
      alt: "Pesas y fuerza",
      label: "Pesas",
    },
    {
      src: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80",
      alt: "Equipo de gimnasio",
      label: "Equipo",
    },
    {
      src: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80",
      alt: "Entrenamiento guiado",
      label: "Guia",
    },
    {
      src: "https://images.unsplash.com/photo-1550345332-09e3ac987658?auto=format&fit=crop&w=800&q=80",
      alt: "Entrenamiento de alta intensidad",
      label: "Intensidad",
    },
  ],
  testimonials: [
    {
      name: "Nuevo miembro",
      text: "La pagina deja claro que puedo escribir, preguntar por promos y llegar directo al gym.",
    },
    {
      name: "Persona principiante",
      text: "Me da confianza ver que hay guia y entrenamiento semi personalizado antes de ir.",
    },
    {
      name: "Cliente activo",
      text: "Todo queda a mano: ubicacion, redes, WhatsApp y lo que se entrena en Realm.",
    },
  ],
  schedule: [
    { day: "Horarios", hours: "Confirmar por WhatsApp" },
    { day: "Promociones", hours: "Consultar vigencia" },
  ],
  locationTitle: "En el sector del Hogar de Ancianos, Ciudad Quesada.",
  ctaTitle: "Listo para entrenar en Realm?",
  ctaText:
    "Escriba por WhatsApp para confirmar horarios, mensualidades y promociones activas. La respuesta rapida es parte del entrenamiento.",
};

export default function Page() {
  return <ProposalSite config={config} />;
}
