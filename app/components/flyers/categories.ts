import {
  Bike,
  Binoculars,
  CloudRain,
  Droplets,
  Flame,
  Moon,
  MountainSnow,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import type { FlyerCategory } from "./types";
import { AVISTAMIENTO_AVES_FLYERS } from "./data/avistamiento-aves";
import { CASCADAS_SECRETAS_FLYERS } from "./data/cascadas-secretas";
import { CIUDAD_ESMERALDA_FLYERS } from "./data/ciudad-esmeralda";
import { CUADRA_TOURS_FLYERS } from "./data/cuadra-tours";
import { GASTRONOMICO_FLYERS } from "./data/gastronomico";
import { LLUVIA_NATURALEZA_FLYERS } from "./data/lluvia-naturaleza";
import { RAPEL_CANON_FLYERS } from "./data/rapel-canon";
import { TOUR_NOCTURNO_FLYERS } from "./data/tour-nocturno";
import { VOLCANES_DORMIDOS_FLYERS } from "./data/volcanes-dormidos";

/**
 * Una categoría por tour del catálogo público (ver `lib/tours/public-catalog.ts`).
 * Cada una trae doce publicaciones listas para Instagram — de la bienvenida
 * a la reserva — para que cada experiencia tenga su propia tanda de contenido.
 */
export const FLYER_CATEGORIES: FlyerCategory[] = [
  {
    slug: "ciudad-esmeralda",
    tourSlug: "tour-ciudad-esmeralda",
    icon: Star,
    label: { es: "Ciudad Esmeralda · La de la casa", en: "Ciudad Esmeralda · House Favorite" },
    blurb: {
      es: "El tour insignia: sendero, río y cañón hasta la Cascada El Zafiro.",
      en: "Our flagship tour: trail, river, and canyon to El Zafiro Waterfall.",
    },
    flyers: CIUDAD_ESMERALDA_FLYERS,
  },
  {
    slug: "rapel-canon",
    tourSlug: "rapel-canon-del-rio",
    icon: MountainSnow,
    label: { es: "Rapel en el Cañón", en: "Canyon Rappelling" },
    blurb: {
      es: "Descenso controlado por el cañón, con guías certificados y equipo profesional.",
      en: "Controlled canyon descent with certified guides and professional gear.",
    },
    flyers: RAPEL_CANON_FLYERS,
  },
  {
    slug: "cascadas-secretas",
    tourSlug: "cascadas-secretas-rio-la-vieja",
    icon: Droplets,
    label: { es: "Cascadas Secretas", en: "Secret Waterfalls" },
    blurb: {
      es: "Caminata suave a cascadas escondidas y pozas frescas del Río La Vieja.",
      en: "An easy-paced hike to hidden falls and cool pools of the La Vieja River.",
    },
    flyers: CASCADAS_SECRETAS_FLYERS,
  },
  {
    slug: "cuadra-tours",
    tourSlug: "cuadra-tours-aventura",
    icon: Bike,
    label: { es: "Cuadra-Tours Aventura", en: "ATV Adventure" },
    blurb: {
      es: "Cuadra por senderos privados de bosque y finca — inducción incluida.",
      en: "ATV riding on private forest and farm trails — induction included.",
    },
    flyers: CUADRA_TOURS_FLYERS,
  },
  {
    slug: "gastronomico",
    tourSlug: "tour-gastronomico-local",
    icon: UtensilsCrossed,
    label: { es: "Tour Gastronómico Local", en: "Local Gastronomic Tour" },
    blurb: {
      es: "Comida de la zona, hecha por gente de acá, con historias en cada mesa.",
      en: "Local food, cooked by locals, with a story behind every dish.",
    },
    flyers: GASTRONOMICO_FLYERS,
  },
  {
    slug: "lluvia-naturaleza",
    tourSlug: "lluvia-en-la-naturaleza",
    icon: CloudRain,
    label: { es: "Lluvia en la Naturaleza", en: "Rain in Nature" },
    blurb: {
      es: "Salir al bosque cuando llueve, con equipo para disfrutarlo sin sufrir.",
      en: "Into the forest when it rains, with gear so you don't suffer.",
    },
    flyers: LLUVIA_NATURALEZA_FLYERS,
  },
  {
    slug: "avistamiento-aves",
    tourSlug: "avistamiento-aves",
    icon: Binoculars,
    label: { es: "Avistamiento de Aves", en: "Birdwatching" },
    blurb: {
      es: "Doce especies reales del corredor de Juan Castro Blanco, guía bilingüe incluido.",
      en: "Twelve real species from the Juan Castro Blanco corridor, bilingual guide included.",
    },
    flyers: AVISTAMIENTO_AVES_FLYERS,
  },
  {
    slug: "tour-nocturno",
    tourSlug: "tour-nocturno-la-vieja",
    icon: Moon,
    label: { es: "Tour Nocturno", en: "Night Tour" },
    blurb: {
      es: "Ranas, insectos y el ruido del bosque cuando se apaga el día.",
      en: "Frogs, insects, and forest noise once daylight fades.",
    },
    flyers: TOUR_NOCTURNO_FLYERS,
  },
  {
    slug: "volcanes-dormidos",
    tourSlug: "caminata-volcanes-dormidos",
    icon: Flame,
    label: { es: "Volcanes Dormidos", en: "Dormant Volcanoes" },
    blurb: {
      es: "Cráteres antiguos y miradores únicos del Parque Nacional Juan Castro Blanco.",
      en: "Ancient craters and unique viewpoints in Juan Castro Blanco National Park.",
    },
    flyers: VOLCANES_DORMIDOS_FLYERS,
  },
];
