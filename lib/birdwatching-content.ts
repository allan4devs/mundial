// Rich editorial layer for the dedicated birdwatching tour experience.
// Used only on /tour/avistamiento-aves* — does not affect booking data.

export type BirdSpecies = {
  commonName: string;
  scientificName: string;
  description: string;
  habitat: string;
  likelihood: "muy-frecuente" | "frecuente" | "posible";
  image: string;
};

export type BirdVideo = {
  youtubeId: string;
  title: string;
  caption: string;
};

export type BirdHabitat = {
  title: string;
  description: string;
  icon: "forest" | "river" | "cloud" | "farm";
};

export type BirdTestimonial = {
  quote: string;
  author: string;
  origin: string;
};

const LICENSED_BIRD_IMAGES: Record<string, string> = {
  "1550853024-fae8cd4be47f": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Keel-billed_toucan_%28Ramphastos_sulfuratus_sulfuratus%29_on_foxtail_palm_%28Wodyetia_bifurcata%29_Cayo.jpg/1920px-Keel-billed_toucan_%28Ramphastos_sulfuratus_sulfuratus%29_on_foxtail_palm_%28Wodyetia_bifurcata%29_Cayo.jpg",
  "1516467508483-a7213fe4af05": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Pteroglossus_torquatus_Costa_Rica.jpg/1920px-Pteroglossus_torquatus_Costa_Rica.jpg",
  "1444464666168-49d633b86797": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Amazonian_Motmot_%28Momotus_momota%29_%2838484878185%29.jpg/1920px-Amazonian_Motmot_%28Momotus_momota%29_%2838484878185%29.jpg",
  "1550994439-a879aabe0386": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Montezuma_oropendola_%28Psarocolius_montezuma%29_on_wild_papaya_Orange_Walk.jpg/1920px-Montezuma_oropendola_%28Psarocolius_montezuma%29_on_wild_papaya_Orange_Walk.jpg",
  "1682788820676-2d68c93d3346": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Rufous-tailed_Hummingbird_%2854567044907%29.jpg/1920px-Rufous-tailed_Hummingbird_%2854567044907%29.jpg",
  "1604584494301-cdf0b1e2e8b1": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Clay-coloured_thrush_%28Turdus_grayi_megas%29_Palopo.jpg/1920px-Clay-coloured_thrush_%28Turdus_grayi_megas%29_Palopo.jpg",
  "1598304843779-6d0f0c8e2f1a": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Ramphocelus_passerinii_%28male%29.jpg/1920px-Ramphocelus_passerinii_%28male%29.jpg",
  "1507003211169-0a1dd7228f2d": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Blue-gray_tanager_%2803108%292.jpg/1920px-Blue-gray_tanager_%2803108%292.jpg",
  "1518791841217-8f162f1e9881": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Great_kiskadee_%2870240%29.jpg/1920px-Great_kiskadee_%2870240%29.jpg",
  "1548199973-03cce0bbc87b": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/White-collared_swift_%28Streptoprocne_zonaris_altissima%29_in_flight_Caldas.jpg/1920px-White-collared_swift_%28Streptoprocne_zonaris_altissima%29_in_flight_Caldas.jpg",
  "1552728080-b9123d1349a7": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Chamaepetes_unicolor_San_Gerardo_01.jpg/1920px-Chamaepetes_unicolor_San_Gerardo_01.jpg",
  "1558618666-fcd25c85cd64": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Hoffmann%27s_Woodpecker.jpg/1920px-Hoffmann%27s_Woodpecker.jpg",
};

function img(id: string) {
  return LICENSED_BIRD_IMAGES[id] ?? `https://images.unsplash.com/photo-${id}?q=80&w=1200&auto=format&fit=crop`;
}

export const BIRDWATCHING_VIDEOS: BirdVideo[] = [
  {
    youtubeId: "Oy2Hm2g6PJQ",
    title: "Amanecer en el corredor biológico",
    caption: "Así se vive una mañana de avistamiento con nuestros guías locales.",
  },
  {
    youtubeId: "kqw7n0BQb-Y",
    title: "Senderos y dosel del Juan Castro Blanco",
    caption: "Caminata suave entre bosque húmedo, quebradas y miradores naturales.",
  },
  {
    youtubeId: "8GKq7rw6ZcQ",
    title: "La Vieja Adventures en acción",
    caption: "Experiencias reales grabadas en la Zona Norte de Costa Rica.",
  },
  {
    youtubeId: "Fuuquz1FsjI",
    title: "Naturaleza y aventura local",
    caption: "El entorno donde conviven más de 400 especies de aves registradas.",
  },
];

export const BIRDWATCHING_GALLERY: string[] = [
  img("1550853024-fae8cd4be47f"),
  img("1516467508483-a7213fe4af05"),
  img("1444464666168-49d633b86797"),
  img("1550994439-a879aabe0386"),
  img("1682788820676-2d68c93d3346"),
  img("1604584494301-cdf0b1e2e8b1"),
  img("1598304843779-6d0f0c8e2f1a"),
  img("1507003211169-0a1dd7228f2d"),
  img("1518791841217-8f162f1e9881"),
  img("1548199973-03cce0bbc87b"),
  img("1552728080-b9123d1349a7"),
  img("1558618666-fcd25c85cd64"),
];

export const BIRDWATCHING_IMAGE_CREDITS = [
  { author: "Charles J. Sharp", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Keel-billed_toucan_(Ramphastos_sulfuratus_sulfuratus)_on_foxtail_palm_(Wodyetia_bifurcata)_Cayo.jpg" },
  { author: "LG Nyqvist", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Pteroglossus_torquatus_Costa_Rica.jpg" },
  { author: "Bernard Dupont", license: "CC BY-SA 2.0", source: "https://commons.wikimedia.org/wiki/File:Amazonian_Motmot_(Momotus_momota)_(38484878185).jpg" },
  { author: "Charles J. Sharp", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Montezuma_oropendola_(Psarocolius_montezuma)_on_wild_papaya_Orange_Walk.jpg" },
  { author: "Andy Morffew", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Rufous-tailed_Hummingbird_(54567044907).jpg" },
  { author: "Charles J. Sharp", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Clay-coloured_thrush_(Turdus_grayi_megas)_Palopo.jpg" },
  { author: "Hans Hillewaert", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Ramphocelus_passerinii_(male).jpg" },
  { author: "Rhododendrites", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Blue-gray_tanager_(03108)2.jpg" },
  { author: "Rhododendrites", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Great_kiskadee_(70240).jpg" },
  { author: "Charles J. Sharp", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:White-collared_swift_(Streptoprocne_zonaris_altissima)_in_flight_Caldas.jpg" },
  { author: "Cephas", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Chamaepetes_unicolor_San_Gerardo_01.jpg" },
  { author: "Johnathan Nightingale", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Hoffmann%27s_Woodpecker.jpg" },
] as const;

export const BIRDWATCHING_SPECIES: BirdSpecies[] = [
  {
    commonName: "Tucán pico arcoíris",
    scientificName: "Ramphastos sulfuratus",
    description:
      "El ícono del bosque tropical. Su canto grave y resonante suele escucharse antes de verlo entre las ramas altas. Es una de las estrellas del recorrido.",
    habitat: "Dosel y bordes de bosque",
    likelihood: "muy-frecuente",
    image: img("1550853024-fae8cd4be47f"),
  },
  {
    commonName: "Aracari collarejo",
    scientificName: "Pteroglossus torquatus",
    description:
      "Más pequeño que el tucán, pero igual de llamativo. Se mueve en parejas o grupos familiares y es excelente para practicar identificación por silueta.",
    habitat: "Bosque secundario y zonas abiertas",
    likelihood: "muy-frecuente",
    image: img("1516467508483-a7213fe4af05"),
  },
  {
    commonName: "Momoto corona azul",
    scientificName: "Momotus momota",
    description:
      "De cola larga y penacho azul. Suele posarse quieto en ramas bajas, lo que lo convierte en una joya para fotógrafos principiantes.",
    habitat: "Sotobosque y claros",
    likelihood: "frecuente",
    image: img("1444464666168-49d633b86797"),
  },
  {
    commonName: "Oropéndola de Montezuma",
    scientificName: "Psarocolius montezuma",
    description:
      "Colonias ruidosas en árboles altos. Su llamada distintiva y vuelo en bandada marcan el inicio de muchas mañanas de observación.",
    habitat: "Bordes de bosque y pastos",
    likelihood: "muy-frecuente",
    image: img("1550994439-a879aabe0386"),
  },
  {
    commonName: "Colibrí cola rufa",
    scientificName: "Amazilia tzacatl",
    description:
      "Uno de los colibríes más comunes del corredor. Zumba cerca de flores y quebradas; ideal para aprender a seguir movimiento rápido con binoculares.",
    habitat: "Jardines, quebradas y claros floridos",
    likelihood: "muy-frecuente",
    image: img("1682788820676-2d68c93d3346"),
  },
  {
    commonName: "Yigüirro",
    scientificName: "Turdus grayi",
    description:
      "Ave nacional de Costa Rica. Canto melodioso al amanecer; el guía lo usa para enseñar identificación por sonido antes de que salga el sol del todo.",
    habitat: "Jardines, caminos y zonas abiertas",
    likelihood: "muy-frecuente",
    image: img("1604584494301-cdf0b1e2e8b1"),
  },
  {
    commonName: "Tangara de Passerini",
    scientificName: "Ramphocelus passerinii",
    description:
      "Negro intenso con mancha escarlata en el pecho del macho. Se ve en bandadas mixtas con otras tangaras — un ejercicio clásico de pajareo en grupo.",
    habitat: "Bordes de bosque y cultivos",
    likelihood: "frecuente",
    image: img("1598304843779-6d0f0c8e2f1a"),
  },
  {
    commonName: "Tangara azul grisácea",
    scientificName: "Thraupis episcopus",
    description:
      "Azul suave y comportamiento tranquilo. Aparece en casi cada salida y es perfecta para quienes empiezan a armar su lista de especies.",
    habitat: "Dosel medio y zonas abiertas",
    likelihood: "muy-frecuente",
    image: img("1507003211169-0a1dd7228f2d"),
  },
  {
    commonName: "Pecho amarillo grande",
    scientificName: "Pitangus sulphuratus",
    description:
      "Vocal y confiado. Su llamada «kis-ka-dee» resuena en todo el corredor y sirve de referencia sonora para orientarse en el bosque.",
    habitat: "Abiertos, caminos y riberas",
    likelihood: "muy-frecuente",
    image: img("1518791841217-8f162f1e9881"),
  },
  {
    commonName: "Vencejo de collar blanco",
    scientificName: "Streptoprocne zonaris",
    description:
      "Bandadas aéreas al amanecer. Aprender a distinguir vencejos de vuelo rápido es parte del reto — y la recompensa — del tour.",
    habitat: "Cielo abierto sobre valles y ríos",
    likelihood: "frecuente",
    image: img("1548199973-03cce0bbc87b"),
  },
  {
    commonName: "Pava negra",
    scientificName: "Chamaepetes unicolor",
    description:
      "Ave grande del sotobosque, más tímida. Con paciencia y buen oído del guía, a veces aparece cruzando el sendero al interior del bosque.",
    habitat: "Bosque nuboso interior",
    likelihood: "posible",
    image: img("1552728080-b9123d1349a7"),
  },
  {
    commonName: "Carpintero de Hoffmann",
    scientificName: "Melanerpes hoffmannii",
    description:
      "Endémico de Costa Rica y Panamá. Golpeteo rítmico en troncos; el guía lo localiza por sonido antes de que lo veas trepando.",
    habitat: "Bosque húmedo y árboles maduros",
    likelihood: "frecuente",
    image: img("1558618666-fcd25c85cd64"),
  },
];

export const BIRDWATCHING_HABITATS: BirdHabitat[] = [
  {
    title: "Bosque premontano húmedo",
    description:
      "El corazón del recorrido: dosel denso, epífitas, musgos y sotobosque donde habitan tucanes, momotos y carpinteros. La humedad matutina activa el canto.",
    icon: "forest",
  },
  {
    title: "Quebradas y riberas",
    description:
      "Las aves acuden al agua al amanecer. Miradores junto al Río La Vieja y afluentes ofrecen avistamientos de martín pescador, garzas y colibríes.",
    icon: "river",
  },
  {
    title: "Bosque nuboso de altura",
    description:
      "En el Parque Nacional del Agua Juan Castro Blanco, la niebla matutina concentra especies de mayor altitud y endemismos de la Zona Norte.",
    icon: "cloud",
  },
  {
    title: "Bordes y fincas regeneradas",
    description:
      "Zonas abiertas entre bosque y pasto son hotspots para tangaras, oropéndolas y aves de campo — excelentes para principiantes.",
    icon: "farm",
  },
];

export const BIRDWATCHING_STATS = [
  { value: "400+", label: "Especies registradas en el corredor" },
  { value: "5:30", label: "Hora ideal de salida al amanecer" },
  { value: "2 h", label: "Duración del recorrido guiado" },
  { value: "4.9★", label: "Valoración de visitantes" },
];

export const BIRDWATCHING_LEARNING = [
  "Identificar aves por canto antes de verlas",
  "Usar binoculares con enfoque rápido y seguimiento",
  "Leer el hábitat: dosel, sotobosque, ribera y abiertos",
  "Registrar especies en lista de campo compartida",
  "Fotografiar aves sin alterar su comportamiento",
  "Entender el papel del corredor biológico en conservación",
];

export const BIRDWATCHING_TESTIMONIALS: BirdTestimonial[] = [
  {
    quote: "Escuchamos tucanes antes de verlos. El guía nos enseñó a seguir el canto y en 20 minutos ya teníamos 15 especies en la lista.",
    author: "María F.",
    origin: "San José, CR",
  },
  {
    quote: "Nunca había pajareado y salí con ganas de volver. Los binoculares, el ritmo tranquilo y las explicaciones hicieron toda la diferencia.",
    author: "James R.",
    origin: "Colorado, USA",
  },
  {
    quote: "La luz del amanecer en el bosque es otro mundo. Vimos momotos, colibríes y una bandada entera de tangaras. Pura vida.",
    author: "Ana L.",
    origin: "Heredia, CR",
  },
];

export const LIKELIHOOD_LABELS: Record<BirdSpecies["likelihood"], string> = {
  "muy-frecuente": "Muy frecuente",
  frecuente: "Frecuente",
  posible: "Posible con suerte",
};
