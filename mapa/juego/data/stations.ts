import type { TrailStation } from '../types';

// Coordenadas en espacio 0–100 que reflejan la geografía real del sendero:
// Recepción (arriba-centro) → Cafetales (izquierda) → Montañita (centro) →
// Descenso (derecha-baja) → Río (abajo-centro)
export const TRAIL_STATIONS: TrailStation[] = [
  {
    id: 'recepcion',
    name: 'Recepcion',
    shortName: 'Inicio',
    x: 44,
    y: 12,
    description: 'Punto alto de salida antes de bajar hacia Ciudad Esmeralda.',
  },
  {
    id: 'sendero-cafetales',
    name: 'Sendero Cafetales',
    shortName: 'Cafetales',
    x: 18,
    y: 36,
    description: 'Primeras gradas naturales entre cafetales, barro bonito y bosque joven.',
  },
  {
    id: 'montanita',
    name: 'Montanita',
    shortName: 'Montañita',
    x: 54,
    y: 44,
    description: 'Mirador natural antes de entrar al descenso fuerte.',
  },
  {
    id: 'descenso-canon',
    name: 'Descenso al Canon',
    shortName: 'Cañón',
    x: 78,
    y: 64,
    description: 'Escaleras y plataformas angostas pegadas a la pared del canon.',
  },
  {
    id: 'plataforma-rio',
    name: 'Plataforma del Rio',
    shortName: 'Río',
    x: 46,
    y: 84,
    description: 'Ultimo punto antes de cerrar la travesia esmeralda.',
  },
];

export const TRAIL_CONNECTIONS: Array<{ from: string; to: string; kind: 'main' | 'alt' }> = [
  { from: 'recepcion', to: 'sendero-cafetales', kind: 'main' },
  { from: 'sendero-cafetales', to: 'montanita', kind: 'main' },
  { from: 'montanita', to: 'descenso-canon', kind: 'main' },
  { from: 'descenso-canon', to: 'plataforma-rio', kind: 'main' },
];
