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
    id: "song-builder",
    title: "Song Builder",
    tagline: "Cantá el ritmo, suena la banda",
    description:
      "Cinco filas: guitarra, bajo, batería, relleno y sinte. Grabás con la boca en cada una, el estudio decodifica los golpes en tiempos y te los devuelve tocados por un instrumento de verdad. Elegís groovy, rock o pop y cada fila se llena con los sonidos de ese estilo, con su amplificador y ecualización, cargados desde MongoDB.",
    href: "/dj-lab/song-builder",
    stack: ["Web Audio API", "MediaRecorder", "Onset detection", "MongoDB"],
    category: "herramientas",
    status: "beta",
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
    id: "ai",
    title: "Asistente IA",
    tagline: "Ayuda para explorar el proyecto",
    description:
      "Asistente conversacional integrado al portafolio para responder preguntas y orientar la navegación.",
    href: "/ai",
    stack: ["Next.js", "OpenAI", "MongoDB"],
    category: "herramientas",
    status: "beta",
  },
  {
    id: "bots",
    title: "Bots de trabajo",
    tagline: "Automatizaciones configurables",
    description:
      "Espacio para crear y administrar bots que ejecutan tareas repetitivas con seguimiento de cuotas y estado.",
    href: "/bots",
    stack: ["Next.js", "MongoDB", "APIs"],
    category: "herramientas",
    status: "beta",
  },
  {
    id: "cafeteria",
    title: "Cafetería",
    tagline: "Menú y punto de venta",
    description:
      "Catálogo visual de productos y operación de caja para una cafetería, con recibos y pagos locales.",
    href: "/cafeteria",
    stack: ["Next.js", "React", "POS"],
    category: "clientes",
    status: "beta",
  },
  {
    id: "crear-cv",
    title: "Crear CV",
    tagline: "Constructor de currículum",
    description:
      "Editor de currículum con plantillas, vista previa y herramientas para preparar un documento profesional.",
    href: "/crear-cv",
    stack: ["Next.js", "React", "PDF"],
    category: "herramientas",
    status: "beta",
  },
  {
    id: "cv",
    title: "CV y búsqueda laboral",
    tagline: "Workspace profesional",
    description:
      "Variantes de CV, cartas de presentación, seguimiento de postulaciones y utilidades para investigar oportunidades.",
    href: "/cv",
    stack: ["Next.js", "TypeScript", "Local storage"],
    category: "herramientas",
    status: "live",
  },
  {
    id: "flyers",
    title: "Flyers de tours",
    tagline: "Promoción de experiencias",
    description:
      "Galería de piezas promocionales para tours y experiencias de aventura de La Vieja Adventures.",
    href: "/flyers",
    stack: ["Next.js", "React", "Diseño visual"],
    category: "clientes",
    status: "live",
  },
  {
    id: "plano",
    title: "Editor de plano",
    tagline: "Diseño visual de espacios",
    description:
      "Editor interactivo para organizar elementos sobre un plano, ajustar posiciones y guardar la composición.",
    href: "/plano",
    stack: ["React", "Canvas", "Local storage"],
    category: "herramientas",
    status: "beta",
  },
  {
    id: "poker",
    title: "Poker",
    tagline: "Mesa de poker en el navegador",
    description:
      "Juego de poker con mesa continua, fichas, blinds fijos y soporte para entrar directamente a jugar.",
    href: "/poker",
    stack: ["JavaScript", "Web Audio", "PWA"],
    category: "juegos",
    status: "beta",
  },
  {
    id: "selva",
    title: "Selva inmersiva",
    tagline: "Experiencia de naturaleza",
    description:
      "Landing inmersiva para presentar la selva, sus sonidos y las experiencias de aventura disponibles.",
    href: "/selva",
    stack: ["Next.js", "React", "Motion"],
    category: "clientes",
    status: "live",
  },
  {
    id: "traa",
    title: "TRAA",
    tagline: "Pedidos y operación",
    description:
      "Aplicación de pedidos con flujo de compra, panel operativo y seguimiento del despacho.",
    href: "/traa",
    stack: ["Next.js", "MongoDB", "React"],
    category: "clientes",
    status: "beta",
  },
  {
    id: "video-generator",
    title: "Video Generator",
    tagline: "Editor de video local",
    description:
      "Editor para organizar clips, previsualizar una secuencia y preparar reels con recursos locales.",
    href: "/video-generator",
    stack: ["Next.js", "Canvas", "FFmpeg"],
    category: "herramientas",
    status: "beta",
  },
  {
    id: "wildo",
    title: "Wildo",
    tagline: "Experimento web",
    description:
      "Aplicación experimental independiente dentro del laboratorio de proyectos web.",
    href: "/wildo",
    stack: ["Next.js", "React"],
    category: "juegos",
    status: "wip",
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
