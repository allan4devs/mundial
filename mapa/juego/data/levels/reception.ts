import type { PlatformData, CollectibleData, EnemyData, PowerUpData, HazardData } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
//  LEVEL 1 – "El Sendero Verde"  (Versión Maximizada)
//  Duración aproximada: 6-10 minutos (explorando)
//  Concepto: Recepción → Cafetales → Subida a loma → Gran caída → Cañón zigzag
// ─────────────────────────────────────────────────────────────────────────────

export const platforms: PlatformData[] = [
  // ── SECCIÓN 1: Sendero inicial entre cafetales ────────────────────
  { id: 'p1',  position: [2.0,  5.8, 0], size: [6.5, 1.0, 2.5], kind: 'trail' },
  { id: 'p2',  position: [8.0,  4.6, 0], size: [3.2, 0.85, 2.1], kind: 'mud'   },
  { id: 'p3',  position: [12.0, 3.5, 0], size: [3.0, 0.85, 2.0], kind: 'root'  },
  { id: 'p4',  position: [15.5, 2.6, 0], size: [2.8, 0.85, 1.9], kind: 'mud'   },

  // ── SECCIÓN 2: Subida hacia la loma ───────────────────────────────
  { id: 'p5',  position: [19.0, 3.7, 0], size: [3.0, 0.85, 2.0], kind: 'root'  },
  { id: 'p6',  position: [22.5, 4.9, 0], size: [3.2, 0.85, 2.1], kind: 'mud'   },
  { id: 'p7',  position: [26.0, 6.0, 0], size: [3.5, 0.9, 2.2], kind: 'trail' }, // Loma

  // ── SECCIÓN 3: Cima de la loma (momento de respiro) ───────────────
  { id: 'p8',  position: [30.0, 7.2, 0], size: [4.0, 0.95, 2.4], kind: 'trail' }, // CIMA DE LA LOMA

  // ── SECCIÓN 4: Gran caída hacia el cañón ──────────────────────────
  { id: 'p9',  position: [34.5, 5.0, 0], size: [3.0, 0.85, 2.0], kind: 'root'  },
  { id: 'p10', position: [38.0, 3.2, 0], size: [3.2, 0.85, 2.1], kind: 'mud'   },
  { id: 'p11', position: [41.5, 1.3, 0], size: [3.0, 0.85, 2.0], kind: 'trail' },

  // ── SECCIÓN 5: Zigzag del cañón (más dinámico) ────────────────────
  { id: 'p12', position: [45.0, -0.3, 0], size: [3.2, 0.85, 2.1], kind: 'mud'   },
  { id: 'p13', position: [48.5, -2.0, 0], size: [3.0, 0.85, 2.0], kind: 'bridge', behavior: 'collapse', collapseDelay: 0.55, respawnDelay: 2.6 }, // ¡se cae como en Crash!
  { id: 'p14', position: [52.0, -0.8, 0], size: [3.0, 0.85, 2.0], kind: 'trail' },
  { id: 'p15', position: [55.5, -2.5, 0], size: [3.0, 0.85, 2.0], kind: 'mud'   },
  { id: 'p16', position: [59.0, -1.2, 0], size: [3.2, 0.85, 2.1], kind: 'root'  },
  { id: 'p17', position: [62.5, -3.0, 0], size: [3.5, 0.9, 2.2], kind: 'trail' },

  // ── SECCIÓN 6: Plataforma final antes de la meta ──────────────────
  { id: 'p18', position: [66.5, -4.3, 0], size: [5.0, 1.0, 2.4], kind: 'trail' },

  // ── SECRETO: Bohío escondido arriba de la loma ────────────────────
  { id: 'sec-a',    position: [27.5, 8.8, 0], size: [2.0, 0.6, 1.5], kind: 'root'  },
  { id: 'sec-b',    position: [24.5, 10.1, 0], size: [2.6, 0.6, 1.5], kind: 'mud'   },
  { id: 'sec-c',    position: [21.0, 10.1, 0], size: [3.2, 0.6, 1.5], kind: 'trail' },
  { id: 'sec-wall', position: [18.8, 11.0, 0], size: [0.6, 2.4, 1.5], kind: 'root'  },
  { id: 'sec-lid',  position: [23.0, 11.85,0], size: [7.5, 0.45, 1.5], kind: 'root'  },
];

// ── COLECCIONABLES ───────────────────────────────────────────────────
export const collectibles: CollectibleData[] = [
  // Ruta principal
  { id: 'c1',  position: [3.5,  7.45, 0] },
  { id: 'c2',  position: [10.0, 6.35, 0] },
  { id: 'c3',  position: [14.5, 4.85, 0] },
  { id: 'c4',  position: [17.5, 4.25, 0] },
  { id: 'c5',  position: [24.0, 7.45, 0] },   // loma
  { id: 'c6',  position: [28.5, 8.85, 0] },   // cima
  { id: 'c7',  position: [33.5, 6.65, 0] },
  { id: 'c8',  position: [39.5, 4.85, 0] },
  { id: 'c9',  position: [44.0, 1.95, 0] },
  { id: 'c10', position: [49.5, 0.65, 0] },
  { id: 'c11', position: [54.0, -1.85, 0] },
  { id: 'c12', position: [58.5, -0.55, 0] },
  { id: 'c13', position: [64.5, -2.35, 0] },

  // Esmeraldas escondidas en el bohío
  { id: 'esm-r1a', position: [20.5, 11.4, 0], kind: 'emerald' },
  { id: 'esm-r1b', position: [22.5, 11.4, 0], kind: 'emerald' },
  { id: 'esm-r1c', position: [24.5, 11.4, 0], kind: 'emerald' },
];

// ── ENEMIGOS ─────────────────────────────────────────────────────────
export const enemies: EnemyData[] = [
  { id: 'e1', position: [11.5, 4.2,  0], patrolRange: 1.2, kind: 'crawler' }, // escarabajo de tierra
  { id: 'e2', position: [20.5, 5.45, 0], patrolRange: 1.4 },
  { id: 'e3', position: [26.5, 7.65, 0], patrolRange: 1.6 }, // Guardián de la loma
  { id: 'e4', position: [35.5, 4.9,  0], patrolRange: 1.3, kind: 'crawler' },
  { id: 'e5', position: [43.5, 2.1,  0], patrolRange: 1.6, kind: 'charger' }, // raptor que embiste
  { id: 'e6', position: [51.0, -1.45, 0], patrolRange: 1.3 },
  { id: 'e7', position: [57.5, -2.0, 0], patrolRange: 1.2 },
];

// ── TRAMPAS ──────────────────────────────────────────────────────────
export const hazards: HazardData[] = [
  { id: 'h1', kind: 'spikes', position: [30.0, 7.72, 0], size: [1.5, 0.55, 2.2] }, // saltar en la cima
  { id: 'h2', kind: 'spikes', position: [59.0, -0.77, 0], size: [1.4, 0.5, 2.0] }, // zigzag final
];

// ── POWER-UPS ────────────────────────────────────────────────────────
export const powerUps: PowerUpData[] = [
  { id: 'pu-r1', position: [10.5, 6.15, 0], kind: 'ruby'     }, // zona media-temprana
  { id: 'pu-s1', position: [37.5, 4.85, 0], kind: 'sapphire' }, // antes de la gran caída
  { id: 'pu-r1b', position: [55.5, 0.65, 0], kind: 'ruby'     }, // mitad del zigzag
];