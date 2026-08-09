import type { MapLabel, MapLayer, MapPoint, Point2D, TourGroup } from '../types';

export const SVG_VIEWBOX = { width: 1280, height: 720 };
export const VIEWBOX = { width: 2560, height: 1440 };

export const DEFAULT_LAYERS: Record<MapLayer, boolean> = {
  trail: true,
  river: true,
  platforms: true,
  service: true,
  safe: true,
};

export const MAIN_TOUR_PATH =
  'M334 88 C316 116 302 134 318 158 C338 188 364 185 365 225 C410 258 490 252 566 218 C650 184 730 204 870 220 C990 215 1045 240 1088 292 C1130 350 1060 474 930 492 C795 510 785 636 642 610 C512 585 430 562 330 548 C255 538 214 495 245 485';

export const MAP_POINTS: MapPoint[] = [
  {
    id: 'recepcion',
    name: 'Recepción',
    type: 'service',
    x: 668,
    y: 176,
    minutes: 0,
    difficulty: 'Suave',
    description: 'Inicio del recorrido, check-in y punto de encuentro.',
    align: 'left',
    levelIndex: 0,
  },
  {
    id: 'sendero-cafetales-inicio',
    name: 'Sendero Cafetales',
    type: 'trail',
    x: 600,
    y: 284,
    minutes: 7,
    difficulty: 'Suave',
    description: 'Entrada al sendero corto entre recepción y Montañita.',
    align: 'left',
    levelIndex: 1,
  },
  {
    id: 'montanita',
    name: 'Montañita',
    type: 'lookout',
    x: 730,
    y: 450,
    minutes: 12,
    difficulty: 'Media',
    description: 'Mirador natural sobre cafetales y bosque secundario.',
    align: 'left',
    levelIndex: 2,
  },
  {
    id: 'descenso',
    name: 'Descenso al Cañón',
    type: 'trail',
    x: 1170,
    y: 730,
    minutes: 15,
    difficulty: 'Alta',
    description: 'Tramo de transición hacia el borde del Río La Vieja.',
    align: 'right',
    levelIndex: 3,
  },
  {
    id: 'plataforma-1',
    name: 'Plataforma del Río',
    type: 'platform',
    x: 490,
    y: 970,
    minutes: 13,
    difficulty: 'Media',
    description: 'Primer punto aéreo sobre la quebrada Tramontito Seco.',
    align: 'left',
    levelIndex: 4,
  },
  {
    id: 'plataforma-2',
    name: 'Plataforma 2',
    type: 'platform',
    x: 770,
    y: 1110,
    minutes: 12,
    difficulty: 'Media',
    description: 'Vista abierta hacia el valle y el sendero Mapache.',
    align: 'left',
  },
  {
    id: 'plataforma-3',
    name: 'Plataforma 3',
    type: 'platform',
    x: 1470,
    y: 1150,
    minutes: 14,
    difficulty: 'Media',
    description: 'Cruce panorámico al lado bajo del cañón.',
    align: 'right',
  },
  {
    id: 'plataforma-4',
    name: 'Plataforma 4',
    type: 'platform',
    x: 1760,
    y: 1240,
    minutes: 15,
    difficulty: 'Alta',
    description: 'Última plataforma antes del retorno junto al río.',
    align: 'right',
  },
];

export const TOUR_GROUPS: TourGroup[] = [
  { id: 'g1', name: 'Grupo 8:00', color: '#0ea5e9', people: 12, startTime: '08:00', progress: 18 },
  { id: 'g2', name: 'Grupo 9:00', color: '#f97316', people: 9, startTime: '09:00', progress: 46 },
  { id: 'g3', name: 'Grupo 10:00', color: '#16a34a', people: 15, startTime: '10:00', progress: 73 },
];

export const FOREST_PATCHES = [
  'M492 315 C545 260 646 274 692 333 C752 308 814 334 833 392 C776 420 711 430 641 416 C578 439 509 407 492 315Z',
  'M725 198 C790 158 882 174 923 229 C1005 215 1082 260 1091 334 C1014 360 934 351 864 321 C802 342 742 313 725 198Z',
  'M156 263 C225 205 320 220 360 289 C326 344 209 354 158 312 C143 299 143 279 156 263Z',
];

export const TREE_POSITIONS: Point2D[] = [
  { x: 214, y: 138 }, { x: 246, y: 120 }, { x: 272, y: 164 }, { x: 302, y: 145 },
  { x: 338, y: 168 }, { x: 420, y: 205 }, { x: 455, y: 182 }, { x: 520, y: 145 },
  { x: 556, y: 154 }, { x: 592, y: 132 }, { x: 638, y: 162 },
  { x: 575, y: 165 }, { x: 638, y: 137 }, { x: 682, y: 158 }, { x: 724, y: 185 },
  { x: 790, y: 165 }, { x: 842, y: 178 }, { x: 925, y: 222 }, { x: 964, y: 198 },
  { x: 1010, y: 242 }, { x: 1048, y: 277 }, { x: 1120, y: 320 }, { x: 1084, y: 368 },
  { x: 970, y: 378 }, { x: 908, y: 352 }, { x: 790, y: 352 }, { x: 710, y: 398 },
  { x: 620, y: 405 }, { x: 542, y: 392 }, { x: 486, y: 436 }, { x: 420, y: 467 },
  { x: 350, y: 425 }, { x: 282, y: 386 }, { x: 208, y: 346 }, { x: 160, y: 390 },
  { x: 190, y: 470 }, { x: 315, y: 545 }, { x: 452, y: 548 }, { x: 522, y: 518 },
  { x: 612, y: 545 }, { x: 812, y: 515 }, { x: 910, y: 565 },
];

export const MAP_LABELS: MapLabel[] = [
  { text: 'Carretera San José', x: 520, y: 78, rotate: 2 },
  { text: 'Sendero Cafetales', x: 190, y: 240, rotate: -5 },
  { text: 'Sendero Cafetales', x: 775, y: 194, rotate: -5 },
  { text: 'Sendero Mapache', x: 345, y: 360, rotate: 3 },
  { text: 'Río Esmeralda', x: 635, y: 592, rotate: 12 },
  { text: 'Quebrada Tramontito Seco', x: 1110, y: 312, rotate: 61 },
  { text: 'Peñón del Cañón', x: 845, y: 438, rotate: 0 },
  { text: 'Guayabal', x: 540, y: 265, rotate: 0 },
  { text: 'Casa Colibrí', x: 374, y: 306, rotate: 0 },
  { text: 'Cañón del Río La Vieja', x: 715, y: 664, rotate: 0 },
];
