import type { PlatformData, CollectibleData, EnemyData, PowerUpData, HazardData } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
//  LEVEL 4 – "Las Gargantas del Cañón"  (Versión Maximizada)
//  Duración aproximada: 7-11 minutos
//  Concepto: Descenso estrecho → Suelo del cañón (reposo) → Zigzag dramático
// ─────────────────────────────────────────────────────────────────────────────

export const platforms: PlatformData[] = [
  // ── SECCIÓN 1: Entrada y descenso inicial ─────────────────────────
  { id: 'p1',  position: [2.0,  5.8, 0], size: [6.5, 1.0, 2.5], kind: 'stair' },
  { id: 'p2',  position: [8.0,  4.5, 0], size: [2.8, 0.85, 2.0], kind: 'rock'  },
  { id: 'cw1', position: [10.8, 3.8, 0], size: [0.6, 4.2, 2.0], kind: 'rock'  }, // pared decorativa
  { id: 'p3',  position: [12.5, 3.2, 0], size: [2.6, 0.85, 2.0], kind: 'rock'  },
  { id: 'p4',  position: [16.0, 1.8, 0], size: [2.6, 0.85, 2.0], kind: 'stair' },
  { id: 'cw2', position: [18.8, 1.2, 0], size: [0.6, 4.0, 2.0], kind: 'rock'  }, // pared decorativa
  { id: 'p5',  position: [20.5, 0.5, 0], size: [2.8, 0.85, 2.0], kind: 'rock'  },

  // ── SECCIÓN 2: Continuación del descenso ──────────────────────────
  { id: 'p6',  position: [24.0, -1.0, 0], size: [2.6, 0.85, 2.0], kind: 'stair' },
  { id: 'p7',  position: [27.5, -2.6, 0], size: [2.8, 0.85, 2.0], kind: 'rock'  },

  // ── SECCIÓN 3: Suelo del cañón (punto medio amplio) ───────────────
  { id: 'pF',  position: [31.0, -4.15, 0], size: [7.5, 1.0, 2.5], kind: 'rock'  }, // SUELO DEL CAÑÓN (ampliado)
  { id: 'brd', position: [28.5, -3.4, 0], size: [2.5, 0.55, 1.8], kind: 'bridge', behavior: 'collapse', collapseDelay: 0.45, respawnDelay: 2.8 }, // puente que se derrumba

  // ── SECCIÓN 4: Zigzag dramático post-suelo ────────────────────────
  { id: 'p8',  position: [35.5, -2.6, 0], size: [2.5, 0.85, 2.0], kind: 'stair', behavior: 'moveY', moveRange: 1.05, moveSpeed: 1.0 }, // ascensor
  { id: 'cw3', position: [33.8, -2.9, 0], size: [0.6, 2.8, 2.0], kind: 'rock'  },
  { id: 'p9',  position: [39.0, -4.0, 0], size: [2.5, 0.85, 2.0], kind: 'rock'  },
  { id: 'p10', position: [42.5, -2.5, 0], size: [2.5, 0.85, 2.0], kind: 'stair' },
  { id: 'cw4', position: [44.8, -2.8, 0], size: [0.6, 2.8, 2.0], kind: 'rock'  },
  { id: 'p11', position: [47.5, -3.9, 0], size: [2.5, 0.85, 2.0], kind: 'rock'  },
  { id: 'p12', position: [51.0, -2.4, 0], size: [2.5, 0.85, 2.0], kind: 'stair', behavior: 'moveX', moveRange: 1.6, moveSpeed: 1.05 }, // deslizante
  { id: 'p13', position: [54.5, -4.0, 0], size: [2.8, 0.85, 2.1], kind: 'rock'  },

  // ── SECCIÓN 5: Plataforma final ───────────────────────────────────
  { id: 'p14', position: [58.0, -2.8, 0], size: [4.5, 1.0, 2.4], kind: 'trail' },

  // ── SECRETO: Cueva tallada en la pared izquierda ──────────────────
  { id: 'sec-a', position: [33.5, -1.0, 0], size: [2.0, 0.6, 1.5], kind: 'stair' },
  { id: 'sec-b', position: [30.5, 0.6,  0], size: [2.2, 0.6, 1.5], kind: 'rock'  },
  { id: 'sec-c', position: [27.5, 1.9,  0], size: [2.8, 0.6, 1.5], kind: 'stair' },
  { id: 'sec-wall', position: [25.5, 2.8, 0], size: [0.6, 2.5, 1.5], kind: 'rock'  },
  { id: 'sec-lid',  position: [29.0, 3.65,0], size: [6.8, 0.45, 1.5], kind: 'rock'  },
];

// ── COLECCIONABLES ───────────────────────────────────────────────────
export const collectibles: CollectibleData[] = [
  // Ruta principal
  { id: 'c1',  position: [3.5,  7.15, 0] },
  { id: 'c2',  position: [9.5,  6.15, 0] },
  { id: 'c3',  position: [14.0, 4.15, 0] },
  { id: 'c4',  position: [18.5, 2.45, 0] },
  { id: 'c5',  position: [23.5, 0.15, 0] },
  { id: 'c6',  position: [26.0, -2.85, 0] },
  { id: 'c7',  position: [29.5, -2.5, 0] },   // suelo del cañón
  { id: 'c8',  position: [34.5, -1.95, 0] },
  { id: 'c9',  position: [38.0, -3.35, 0] },
  { id: 'c10', position: [43.5, -1.85, 0] },
  { id: 'c11', position: [48.5, -3.25, 0] },
  { id: 'c12', position: [53.0, -3.35, 0] },
  { id: 'c13', position: [59.5, -1.15, 0] },

  // Esmeraldas en la cueva secreta
  { id: 'esm-s1a', position: [27.0, 3.2, 0], kind: 'emerald' },
  { id: 'esm-s1b', position: [28.8, 3.2, 0], kind: 'emerald' },
  { id: 'esm-s1c', position: [30.6, 3.2, 0], kind: 'emerald' },
];

// ── ENEMIGOS ─────────────────────────────────────────────────────────
export const enemies: EnemyData[] = [
  { id: 'e1', position: [10.5, 5.05, 0], patrolRange: 1.0 },
  { id: 'e2', position: [16.0, 2.3,  0], patrolRange: 1.0, kind: 'crawler' },
  { id: 'e3', position: [21.0, 0.05, 0], patrolRange: 1.1 },
  { id: 'e4', position: [31.0, -3.25, 0], patrolRange: 2.6, kind: 'charger' }, // ¡RAPTOR guardián del suelo!
  { id: 'e5', position: [39.0, -3.4,  0], patrolRange: 0,   kind: 'spitter' }, // planta en el zigzag
  { id: 'e6', position: [40.0, -3.55, 0], patrolRange: 1.0 },
  { id: 'e7', position: [47.5, -3.1,  0], patrolRange: 1.0, kind: 'crawler' },
  { id: 'e8', position: [51.5, -3.35, 0], patrolRange: 1.0 },
];

// ── TRAMPAS ──────────────────────────────────────────────────────────
export const hazards: HazardData[] = [
  { id: 'h1', kind: 'spikes',  position: [12.5, 3.65, 0], size: [1.3, 0.5, 1.8] },  // descenso inicial
  { id: 'h2', kind: 'log',     position: [22.5, 2.7, 0], range: 2.2, speed: 2.3 },  // tronco sobre el gap
  { id: 'h3', kind: 'fire',    position: [20.5, 0.98, 0], size: [1.0, 1.3, 1.6] },  // llamarada
  { id: 'h4', kind: 'saw',     position: [31.0, -1.95, 0], size: [1.15, 1, 1], range: 2.6, speed: 3.6 }, // sierra que barre el suelo
  { id: 'h5', kind: 'boulder', position: [54.5, -2.95, 0], size: [1.1, 1, 1], range: 1.6, speed: 3.2 }, // roca en el zigzag final
];

// ── POWER-UPS ────────────────────────────────────────────────────────
export const powerUps: PowerUpData[] = [
  { id: 'pu-r4', position: [9.5,  6.05, 0], kind: 'ruby'     }, // temprano
  { id: 'pu-s4', position: [27.5, -2.55, 0], kind: 'sapphire' }, // suelo del cañón (muy útil)
  { id: 'pu-r4b', position: [42.5, -1.85, 0], kind: 'ruby'     }, // mitad del zigzag
];