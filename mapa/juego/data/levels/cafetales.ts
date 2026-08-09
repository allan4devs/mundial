import type { PlatformData, CollectibleData, EnemyData, PowerUpData, HazardData } from '../../types';

// ─────────────────────────────────────────────────────────────────────────
//  LEVEL 2 – "Laberinto del Cafetal"  (Versión Extendida)
//  Duración estimada: 8-14 minutos en primera partida (explorando)
//  Filosofía: Exploración > Velocidad. Muchos secretos y rutas alternativas.
// ─────────────────────────────────────────────────────────────────────────

export const platforms: PlatformData[] = [
  // ── SECCIÓN 1: Entrada al Cafetal (curvas entre matas de café) ─────
  { id: 'p1',  position: [1.5,  6.2, 0], size: [5.5, 0.9, 2.4], kind: 'mud'   },
  { id: 'p2',  position: [7.0,  5.1, 0], size: [3.8, 0.85, 2.2], kind: 'root'  },
  { id: 'p3',  position: [11.2, 4.0, 0], size: [3.2, 0.85, 2.1], kind: 'mud'   },
  { id: 'p4',  position: [15.0, 2.9, 0], size: [3.5, 0.85, 2.2], kind: 'root'  },
  { id: 'p5',  position: [19.0, 1.7, 0], size: [3.0, 0.85, 2.0], kind: 'trail' },

  // ── SECCIÓN 2: Primer descenso hacia el valle ─────────────────────
  { id: 'p6',  position: [22.5, 0.4, 0], size: [3.2, 0.85, 2.1], kind: 'mud'   },
  { id: 'p7',  position: [26.0, -0.9, 0], size: [3.0, 0.85, 2.0], kind: 'root'  },
  { id: 'p8',  position: [29.5, -2.1, 0], size: [3.5, 0.9, 2.3], kind: 'trail' }, // fondo del valle

  // ── SECCIÓN 3: Subida hacia la primera loma (con alternativa) ─────
  { id: 'p9',  position: [33.5, -0.6, 0], size: [3.0, 0.85, 2.0], kind: 'mud'   },
  { id: 'p10', position: [37.0, 1.1,  0], size: [3.2, 0.85, 2.1], kind: 'root'  },
  { id: 'p11', position: [40.5, 2.9,  0], size: [3.0, 0.85, 2.0], kind: 'trail' },
  { id: 'p12', position: [44.0, 4.6,  0], size: [3.8, 0.9, 2.3], kind: 'mud'   }, // Loma 1

  // ── SECCIÓN 4: Cruce elevado + primer riesgo ──────────────────────
  { id: 'p13', position: [48.5, 3.2, 0], size: [3.2, 0.85, 2.1], kind: 'root', behavior: 'moveY', moveRange: 1.35, moveSpeed: 0.95 }, // ascensor
  { id: 'p14', position: [52.5, 1.6, 0], size: [3.2, 0.85, 2.0], kind: 'trail' },

  // ── SECCIÓN 5: Ridge principal (punto alto con vista) ─────────────
  { id: 'p15', position: [56.5, 3.8, 0], size: [4.5, 1.0, 2.4], kind: 'mud'   }, // RIDGE ALTO
  { id: 'p16', position: [61.5, 2.4, 0], size: [3.5, 0.85, 2.2], kind: 'root'  },

  // ── SECCIÓN 6: Gran descenso al cañón (tensión) ───────────────────
  { id: 'p17', position: [65.0, 0.6, 0], size: [3.0, 0.85, 2.0], kind: 'trail' },
  { id: 'p18', position: [68.5, -1.2, 0], size: [3.2, 0.85, 2.1], kind: 'bridge', behavior: 'collapse', collapseDelay: 0.5, respawnDelay: 2.6 }, // puente que se derrumba
  { id: 'p19', position: [72.0, -2.9, 0], size: [3.0, 0.85, 2.0], kind: 'root'  },
  { id: 'p20', position: [75.5, -4.5, 0], size: [3.5, 0.9, 2.2], kind: 'trail' },

  // ── SECCIÓN 7: Zigzag del cañón (más largo y técnico) ─────────────
  { id: 'p21', position: [79.5, -3.1, 0], size: [3.0, 0.85, 2.0], kind: 'mud'   },
  { id: 'p22', position: [83.0, -1.4, 0], size: [2.8, 0.85, 2.1], kind: 'root', behavior: 'moveX', moveRange: 2.1, moveSpeed: 1.05 }, // plataforma deslizante

  { id: 'p23', position: [86.5, -3.0, 0], size: [3.0, 0.85, 2.0], kind: 'trail' },
  { id: 'p24', position: [90.0, -4.8, 0], size: [3.5, 0.9, 2.2], kind: 'mud'   },
  { id: 'p25', position: [94.0, -3.2, 0], size: [3.8, 0.85, 2.3], kind: 'trail' }, // última plataforma antes del goal

  // ── SECRETO 1: Bosquecillo escondido (izquierda del ridge) ────────
  { id: 'sec1-a', position: [53.5, 6.8, 0], size: [2.2, 0.6, 1.6], kind: 'root'  },
  { id: 'sec1-b', position: [50.5, 7.9, 0], size: [2.8, 0.6, 1.6], kind: 'mud'   },
  { id: 'sec1-c', position: [47.0, 7.9, 0], size: [3.2, 0.6, 1.6], kind: 'trail' },
  { id: 'sec1-wall', position: [44.8, 8.7, 0], size: [0.6, 2.2, 1.5], kind: 'root' },

  // ── SECRETO 2: Plataforma alta detrás de la loma (requiere backtrack)
  { id: 'sec2-a', position: [39.5, 6.4, 0], size: [2.0, 0.6, 1.5], kind: 'root'  },
  { id: 'sec2-b', position: [36.5, 7.6, 0], size: [2.6, 0.6, 1.5], kind: 'mud'   },
];

// ── COLECCIONABLES ───────────────────────────────────────────────────
export const collectibles: CollectibleData[] = [
  // Ruta principal
  { id: 'c1',  position: [3.5,  7.85, 0] },
  { id: 'c2',  position: [9.0,  6.75, 0] },
  { id: 'c3',  position: [13.5, 5.65, 0] },
  { id: 'c4',  position: [17.5, 4.55, 0] },
  { id: 'c5',  position: [23.5, 1.95, 0] },
  { id: 'c6',  position: [27.5, 0.65, 0] },
  { id: 'c7',  position: [31.5, -1.45, 0] }, // fondo del valle
  { id: 'c8',  position: [35.5, 0.95, 0] },
  { id: 'c9',  position: [42.0, 6.15, 0] },   // cima de la loma
  { id: 'c10', position: [49.5, 4.85, 0] },
  { id: 'c11', position: [58.5, 5.35, 0] },   // ridge alto
  { id: 'c12', position: [66.5, 2.15, 0] },
  { id: 'c13', position: [73.5, -2.25, 0] },
  { id: 'c14', position: [81.5, -2.45, 0] },
  { id: 'c15', position: [88.5, -3.55, 0] },
  { id: 'c16', position: [95.0, -2.55, 0] },

  // Secretos (más difíciles de encontrar)
  { id: 'esm-s1a', position: [51.5, 8.45, 0], kind: 'emerald' },
  { id: 'esm-s1b', position: [49.0, 8.45, 0], kind: 'emerald' },
  { id: 'esm-s2a', position: [38.0, 8.2,  0], kind: 'emerald' },
];

// ── ENEMIGOS ─────────────────────────────────────────────────────────
export const enemies: EnemyData[] = [
  { id: 'e1',  position: [9.5,  6.65, 0], patrolRange: 1.3 },
  { id: 'e2',  position: [15.5, 4.5,  0], patrolRange: 1.4, kind: 'crawler' },
  { id: 'e3',  position: [30.0, -1.6, 0], patrolRange: 1.6, kind: 'crawler' }, // valle
  { id: 'e4',  position: [31.0, -1.55, 0], patrolRange: 1.2 },
  { id: 'e5',  position: [36.5, 2.45, 0], patrolRange: 1.5 },
  { id: 'e6',  position: [43.5, 6.2,  0], patrolRange: 1.9, kind: 'charger' }, // raptor en la loma
  { id: 'e7',  position: [51.0, 3.0,  0], patrolRange: 1.3 },
  { id: 'e8',  position: [57.0, 4.45, 0], patrolRange: 1.6, kind: 'spitter' }, // planta en el ridge
  { id: 'e9',  position: [67.5, 0.15, 0], patrolRange: 1.4 },
  { id: 'e10', position: [76.5, -3.9, 0], patrolRange: 1.5, kind: 'crawler' },
  { id: 'e11', position: [84.5, -2.45, 0], patrolRange: 1.3 },
];

// ── TRAMPAS ──────────────────────────────────────────────────────────
export const hazards: HazardData[] = [
  { id: 'h1', kind: 'spikes', position: [29.5, -1.63, 0], size: [1.7, 0.5, 2.2] }, // fondo del valle
  { id: 'h2', kind: 'log',    position: [66.7, 3.6, 0], range: 2.7, speed: 2.1 }, // tronco sobre el descenso
];

// ── POWER-UPS ────────────────────────────────────────────────────────
export const powerUps: PowerUpData[] = [
  { id: 'pu-r2', position: [11.5, 5.55, 0], kind: 'ruby'     }, // zona media
  { id: 'pu-s2', position: [26.5, -1.35, 0], kind: 'sapphire' }, // fondo del valle (ayuda)
  { id: 'pu-r3', position: [55.0, 5.35, 0], kind: 'ruby'     }, // antes del ridge
  { id: 'pu-s3', position: [71.5, -2.35, 0], kind: 'sapphire' }, // cañón profundo
];