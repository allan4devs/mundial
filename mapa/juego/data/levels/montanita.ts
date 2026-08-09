import type { PlatformData, CollectibleData, EnemyData, PowerUpData, HazardData } from '../../types';

// ─────────────────────────────────────────────────────────────────────────
//  LEVEL 3 – "La Cima de la Montañita"  (Versión Maximizada)
//  Duración aproximada: 7-12 minutos (explorando bien)
//  Concepto: Escalada técnica → Cima épica → Descenso peligroso
// ─────────────────────────────────────────────────────────────────────────

export const platforms: PlatformData[] = [
  // ── SECCIÓN 1: Laderas inferiores (subida gradual) ─────────────────
  { id: 'p1',  position: [2.0,  4.8, 0], size: [6.0, 1.0, 2.4], kind: 'rock'  },
  { id: 'p2',  position: [7.5,  5.7, 0], size: [3.0, 0.85, 2.0], kind: 'rock'  },
  { id: 'p3',  position: [11.5, 6.6, 0], size: [2.8, 0.85, 1.9], kind: 'rock', behavior: 'moveY', moveRange: 1.15, moveSpeed: 1.0 }, // ascensor de roca
  { id: 'p4',  position: [15.0, 7.5, 0], size: [3.0, 0.85, 2.0], kind: 'trail' },
  { id: 'p5',  position: [18.5, 8.3, 0], size: [2.8, 0.85, 1.9], kind: 'rock'  },

  // ── SECCIÓN 2: Ascenso medio (más técnico) ────────────────────────
  { id: 'p6',  position: [22.0, 9.1, 0], size: [2.6, 0.85, 1.8], kind: 'rock'  },
  { id: 'p7',  position: [25.5, 9.9, 0], size: [2.8, 0.85, 1.9], kind: 'trail' },
  { id: 'p8',  position: [29.0, 10.6, 0], size: [2.5, 0.85, 1.8], kind: 'rock', behavior: 'moveX', moveRange: 1.7, moveSpeed: 1.0 }, // plataforma deslizante

  // ── SECCIÓN 3: Acercamiento a la cima ─────────────────────────────
  { id: 'p9',  position: [32.5, 11.2, 0], size: [3.0, 0.9, 2.0], kind: 'rock'  },
  { id: 'p10', position: [36.0, 11.8, 0], size: [2.8, 0.85, 1.9], kind: 'trail' },

  // ── SECCIÓN 4: LA CIMA (punto más alto del nivel) ─────────────────
  { id: 'p11', position: [39.5, 12.4, 0], size: [4.5, 1.0, 2.5], kind: 'trail' }, // CIMA PRINCIPAL

  // ── SECCIÓN 5: Descenso pronunciado (tensión alta) ────────────────
  { id: 'p12', position: [44.5, 10.3, 0], size: [3.0, 0.85, 2.0], kind: 'rock'  },
  { id: 'p13', position: [48.5, 8.4,  0], size: [3.2, 0.85, 2.1], kind: 'bridge', behavior: 'collapse', collapseDelay: 0.5, respawnDelay: 2.6 }, // se derrumba
  { id: 'p14', position: [52.5, 6.3,  0], size: [3.0, 0.85, 2.0], kind: 'trail' },
  { id: 'p15', position: [56.5, 4.1,  0], size: [3.2, 0.85, 2.1], kind: 'rock'  },
  { id: 'p16', position: [60.5, 1.8,  0], size: [3.0, 0.85, 2.0], kind: 'root', behavior: 'moveY', moveRange: 1.25, moveSpeed: 0.9 }, // ascensor de bajada
  { id: 'p17', position: [64.0, -0.5, 0], size: [3.5, 0.9, 2.2], kind: 'rock'  },

  // ── SECCIÓN 6: Fondo del cañón ────────────────────────────────────
  { id: 'p18', position: [68.0, -2.8, 0], size: [4.0, 1.0, 2.3], kind: 'trail' },
  { id: 'p19', position: [72.5, -4.5, 0], size: [3.5, 0.9, 2.2], kind: 'rock'  },

  // ── SECRETO: Cumbre verdadera (arriba y a la izquierda de la cima) ─
  { id: 'sec-a', position: [35.5, 14.0, 0], size: [2.0, 0.55, 1.5], kind: 'rock'  },
  { id: 'sec-b', position: [32.5, 15.1, 0], size: [2.4, 0.55, 1.5], kind: 'rock'  },
  { id: 'sec-c', position: [29.0, 15.1, 0], size: [3.2, 0.55, 1.5], kind: 'trail' },
  { id: 'sec-wall', position: [26.8, 16.0, 0], size: [0.6, 2.3, 1.5], kind: 'rock'  },
  { id: 'sec-lid',  position: [30.5, 16.85,0], size: [7.0, 0.45, 1.5], kind: 'rock'  },
];

// ── COLECCIONABLES ───────────────────────────────────────────────────
export const collectibles: CollectibleData[] = [
  // Ruta principal
  { id: 'c1',  position: [4.0,  6.45, 0] },
  { id: 'c2',  position: [9.5,  7.35, 0] },
  { id: 'c3',  position: [13.5, 8.25, 0] },
  { id: 'c4',  position: [17.5, 9.15, 0] },
  { id: 'c5',  position: [23.5, 10.55, 0] },
  { id: 'c6',  position: [28.0, 11.45, 0] },
  { id: 'c7',  position: [34.5, 12.95, 0] }, // cerca de la cima
  { id: 'c8',  position: [41.5, 14.0,  0] }, // cima (flotando alto)
  { id: 'c9',  position: [47.0, 11.0,  0] },
  { id: 'c10', position: [53.5, 7.95,  0] },
  { id: 'c11', position: [58.5, 5.75,  0] },
  { id: 'c12', position: [63.0, 2.45,  0] },
  { id: 'c13', position: [69.5, -1.15, 0] },
  { id: 'c14', position: [74.0, -3.85, 0] },

  // Secretos en la cumbre verdadera (3 esmeraldas)
  { id: 'esm-m1a', position: [28.5, 16.55, 0], kind: 'emerald' },
  { id: 'esm-m1b', position: [30.5, 16.55, 0], kind: 'emerald' },
  { id: 'esm-m1c', position: [32.5, 16.55, 0], kind: 'emerald' },
];

// ── ENEMIGOS ─────────────────────────────────────────────────────────
export const enemies: EnemyData[] = [
  { id: 'e1', position: [9.5,  7.25, 0], patrolRange: 1.1 },
  { id: 'e2', position: [15.0, 8.35, 0], patrolRange: 1.0, kind: 'crawler' }, // escarabajo en la subida
  { id: 'e3', position: [20.5, 10.45, 0], patrolRange: 1.3 },
  { id: 'e4', position: [26.5, 11.25, 0], patrolRange: 1.4 }, // antes de la cima
  { id: 'e5', position: [39.5, 13.05, 0], patrolRange: 1.8, kind: 'charger' }, // ¡RAPTOR guardián de la cima!
  { id: 'e6', position: [46.5, 9.95,  0], patrolRange: 1.4 },
  { id: 'e7', position: [52.5, 6.9,   0], patrolRange: 0,   kind: 'spitter' }, // planta en el descenso
  { id: 'e8', position: [61.5, 2.45,  0], patrolRange: 1.3 },
  { id: 'e9', position: [64.0, 0.4,   0], patrolRange: 1.0, kind: 'crawler' },
];

// ── TRAMPAS ──────────────────────────────────────────────────────────
export const hazards: HazardData[] = [
  { id: 'h1', kind: 'spikes',  position: [25.5, 10.35, 0], size: [1.4, 0.5, 1.7] }, // saltar en la subida
  { id: 'h2', kind: 'spikes',  position: [56.5, 4.55, 0], size: [1.4, 0.5, 2.0] },  // en el descenso
  { id: 'h3', kind: 'boulder', position: [68.0, -1.7, 0], size: [1.1, 1, 1], range: 1.8, speed: 3.0 }, // roca rodante
  { id: 'h4', kind: 'log',     position: [62.3, 3.6, 0], range: 2.5, speed: 2.2 }, // tronco sobre la bajada
];

// ── POWER-UPS ────────────────────────────────────────────────────────
export const powerUps: PowerUpData[] = [
  { id: 'pu-r3', position: [13.5, 8.15, 0], kind: 'ruby'     }, // mitad de la subida
  { id: 'pu-s3', position: [48.5, 9.95, 0], kind: 'sapphire' }, // inicio del descenso
  { id: 'pu-r4', position: [58.5, 5.75, 0], kind: 'ruby'     }, // mitad del descenso
];