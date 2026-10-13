// lib/constants/riverTours.ts
// Perfil de sensibilidad al clima de los tours que dependen del Río La Vieja.
//
// La estación Montaña Sagrada solo mide lluvia (mm). De esa lluvia derivamos si
// el río puede ir cargado. Cada tour reacciona distinto al mismo dato: un cañón
// completo con cruces de río se cierra mucho antes que una caminata a cascadas
// por la orilla. Estos umbrales (mm de lluvia móvil) mueven el veredicto de
// cada tour y están pensados para que Allan / Verónica los ajusten con la
// experiencia real de operación.

export type RiverTourExposure = "canyon-full" | "canyon-technical" | "river-adjacent";

export type RiverTourProfile = {
  slug: string;
  name: string;
  difficulty: string;
  exposure: RiverTourExposure;
  /** Lluvia en las últimas 3 h (mm) a partir de la cual conviene vigilar de cerca */
  watch3hMm: number;
  /** Lluvia en las últimas 3 h (mm) a partir de la cual el tour se vuelve poco favorable */
  avoid3hMm: number;
  /** Acumulado 24 h (mm) que deja el río cargado aunque ahora no llueva */
  loaded24hMm: number;
  /** Qué es el tour, en una línea */
  blurb: string;
  /** Qué se complica específicamente cuando llueve */
  wetNote: string;
};

export const RIVER_TOUR_PROFILES: RiverTourProfile[] = [
  {
    slug: "tour-ciudad-esmeralda",
    name: "Tour Ciudad Esmeralda",
    difficulty: "Moderado",
    exposure: "canyon-full",
    watch3hMm: 3,
    avoid3hMm: 8,
    loaded24hMm: 30,
    blurb: "Sendero, río y cañón hasta la Cascada El Zafiro y las pozas turquesa.",
    wetNote:
      "El recorrido va dentro del cañón con cruces de río; una crecida repentina no da tiempo de salir.",
  },
  {
    slug: "rapel-canon-del-rio",
    name: "Rapel en Cañón del Río",
    difficulty: "Intermedio a avanzado",
    exposure: "canyon-technical",
    watch3hMm: 2,
    avoid3hMm: 6,
    loaded24hMm: 25,
    blurb: "Descenso controlado por las paredes del cañón con cuerda y equipo técnico.",
    wetNote:
      "El trabajo con cuerda sobre agua en movimiento y las rocas lisas se vuelven peligrosos con poco caudal extra.",
  },
  {
    slug: "cascadas-secretas-rio-la-vieja",
    name: "Cascadas Secretas del Río La Vieja",
    difficulty: "Moderado",
    exposure: "river-adjacent",
    watch3hMm: 5,
    avoid3hMm: 12,
    loaded24hMm: 45,
    blurb: "Caminata suave a cascadas escondidas y pozas frescas, casi todo por la orilla.",
    wetNote:
      "Se moja el sendero y baja la visibilidad; el riesgo de río es menor porque hay pocos cruces.",
  },
];
