/**
 * Curated index of everything published under app/(page_routes).
 * Add an entry here and it shows up on the portfolio home automatically.
 */

export type ProjectStatus = "live" | "beta" | "wip";

export type ProjectCategory = "deportes" | "juegos" | "herramientas" | "clientes";

export type Project = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  /** null when the project has no entry route of its own. */
  href: string | null;
  stack: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  featured?: boolean;
};

export const CATEGORIES: { id: ProjectCategory; label: string; blurb: string }[] = [
  {
    id: "deportes",
    label: "Quinielas y deportes",
    blurb: "Predicciones, marcadores en vivo y tablas de posiciones.",
  },
  {
    id: "juegos",
    label: "Juegos y mapas",
    blurb: "3D en el navegador, multijugador y mapas interactivos.",
  },
  {
    id: "herramientas",
    label: "Herramientas",
    blurb: "Utilidades que uso a diario y experimentos con audio y datos.",
  },
  {
    id: "clientes",
    label: "Trabajo para clientes",
    blurb: "Propuestas de sitios web para negocios reales.",
  },
];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: "En línea",
  beta: "Beta",
  wip: "En progreso",
};

export const PROJECTS: Project[] = [
  {
    id: "mundial",
    title: "Mundial 2026",
    tagline: "Quiniela del Mundial",
    description:
      "Partidos y llaves con predicciones guardadas por PIN, chat en vivo por partido, penales en 3D, apuestas de estadísticas y un modo premium con pagos por PayPal.",
    href: "/mundial",
    stack: ["Next.js", "MongoDB", "React Three Fiber", "PayPal", "Resend"],
    category: "deportes",
    status: "live",
    featured: true,
  },
  {
    id: "scores",
    title: "Scores",
    tagline: "Quiniela multi-liga",
    description:
      "Premier League, Serie A, NBA, FCL y NBL en un solo marcador: sincronización automática de partidos, leaderboard, ligas privadas, logros y predicciones del modelo.",
    href: "/scores",
    stack: ["Next.js", "MongoDB", "Cron sync"],
    category: "deportes",
    status: "live",
    featured: true,
  },
  {
    id: "ufc",
    title: "UFC Picks",
    tagline: "Predicciones de peleas",
    description:
      "Carteleras completas con picks pelea por pelea protegidos con PIN, vista de los demás jugadores y panel de administración.",
    href: "/ufc",
    stack: ["Next.js", "MongoDB"],
    category: "deportes",
    status: "live",
  },
  {
    id: "juego",
    title: "La Vieja Adventures",
    tagline: "Plataformas en 3D",
    description:
      "Juego de plataformas con niveles, enemigos, power-ups, minimapa del sendero y música chiptune generada en el navegador.",
    href: "/mapa/juego",
    stack: ["React Three Fiber", "three.js", "Web Audio"],
    category: "juegos",
    status: "live",
    featured: true,
  },
  {
    id: "juego-online",
    title: "Carrera multijugador",
    tagline: "Salas en tiempo real",
    description:
      "Modo competitivo del juego: salas con código de 4 letras, lobby con estado de listo y progreso de cada jugador en vivo por WebSocket.",
    href: "/mapa/juego/online",
    stack: ["WebSocket", "MongoDB", "React"],
    category: "juegos",
    status: "beta",
  },
  {
    id: "mapa",
    title: "Mapa La Vieja",
    tagline: "Mapa interactivo",
    description:
      "Mapa vectorial construido por capas —terreno, río, senderos, árboles y edificios— con marcadores agrupados, leyenda y control de zoom.",
    href: "/mapa",
    stack: ["React", "SVG"],
    category: "juegos",
    status: "live",
  },
  {
    id: "game",
    title: "Tablero compartido",
    tagline: "Prototipo multijugador",
    description:
      "Prueba de estado compartido por segmentos: varios visitantes avanzan sobre el mismo tablero y ven el movimiento de los demás. Se entra con el enlace de una partida creada.",
    href: null,
    stack: ["Next.js", "MongoDB"],
    category: "juegos",
    status: "wip",
  },
  {
    id: "dj-lab",
    title: "DJ Sound Science Lab",
    tagline: "Laboratorio de mezcla",
    description:
      "Mesa de mezcla en el navegador con decks, efectos y análisis de espectro, construida sobre la Web Audio API.",
    href: "/dj-lab",
    stack: ["Web Audio API", "React", "Canvas"],
    category: "herramientas",
    status: "live",
  },
  {
    id: "voice-decoder",
    title: "Voice Decoder",
    tagline: "Efectos de voz",
    description:
      "Subí un archivo de audio, visualizá la forma de onda y probá efectos de voz procesados en tiempo real sin salir del navegador.",
    href: "/dj-lab/voice-decoder",
    stack: ["Web Audio API", "Canvas"],
    category: "herramientas",
    status: "live",
  },
  {
    id: "maps-scrapper",
    title: "Maps Scrapper",
    tagline: "Leads sin sitio web",
    description:
      "Explora negocios cercanos en el mapa, detecta cuáles no tienen sitio web o lo tienen desactualizado, y genera y envía un pitch por correo.",
    href: "/maps-scrapper",
    stack: ["Google Maps", "Cheerio", "Resend", "MongoDB"],
    category: "herramientas",
    status: "live",
  },
  {
    id: "weight",
    title: "Peso y comidas",
    tagline: "Seguimiento personal",
    description:
      "Registro de peso con metas de subir o bajar, control de comidas y alacena, y gráficas de progreso en el tiempo.",
    href: "/weight",
    stack: ["Next.js", "MongoDB", "Recharts"],
    category: "herramientas",
    status: "live",
  },
  {
    id: "wifi",
    title: "Wifi compartido",
    tagline: "Contraseñas con QR",
    description:
      "Guarda las claves de wifi de la casa o el negocio y las comparte con un código QR que cualquiera puede escanear.",
    href: "/wifi",
    stack: ["Next.js", "MongoDB", "QRCode"],
    category: "herramientas",
    status: "live",
  },
  {
    id: "sitios-web",
    title: "Sitios web para negocios",
    tagline: "19 propuestas de diseño",
    description:
      "Landing de servicios más un catálogo de propuestas completas para cafeterías, gimnasios, panaderías, sodas, salones y veterinarias, cada una con su propia identidad visual.",
    href: "/sitios-web",
    stack: ["Next.js", "Tailwind CSS", "PayPal"],
    category: "clientes",
    status: "live",
    featured: true,
  },
];

export const FEATURED = PROJECTS.filter((p) => p.featured);

export function projectsByCategory(category: ProjectCategory) {
  return PROJECTS.filter((p) => p.category === category);
}
