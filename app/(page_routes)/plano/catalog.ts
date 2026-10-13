import type { CatalogItem, Category, MachineStatus } from "./types";

// ───────────────────────────────────────────────
// Category metadata (colors + labels, ES)
// ───────────────────────────────────────────────
export const CATEGORY_META: Record<
  Category,
  { label: string; color: string }
> = {
  cardio: { label: "Cardio", color: "#38bdf8" },
  strength: { label: "Fuerza (máquinas)", color: "#a78bfa" },
  freeweights: { label: "Peso libre", color: "#fb923c" },
  functional: { label: "Funcional", color: "#34d399" },
  amenities: { label: "Áreas / servicios", color: "#f472b6" },
};

export const CATEGORY_ORDER: Category[] = [
  "cardio",
  "strength",
  "freeweights",
  "functional",
  "amenities",
];

// ───────────────────────────────────────────────
// Machine status metadata (ES)
// ───────────────────────────────────────────────
export const STATUS_META: Record<
  MachineStatus,
  { label: string; color: string; short: string }
> = {
  ok: { label: "Operativa", color: "#22c55e", short: "OK" },
  maintenance: { label: "En mantenimiento", color: "#f59e0b", short: "MNT" },
  down: { label: "Fuera de servicio", color: "#ef4444", short: "OFF" },
};

export const STATUS_ORDER: MachineStatus[] = ["ok", "maintenance", "down"];

// ───────────────────────────────────────────────
// Equipment catalog — footprints in meters (width × depth),
// generous enough to leave walk-around clearance out of the box.
// ───────────────────────────────────────────────
export const MACHINE_CATALOG: CatalogItem[] = [
  // Cardio
  { id: "treadmill", label: "Caminadora", category: "cardio", code: "CAM", w: 2.0, h: 0.95 },
  { id: "elliptical", label: "Elíptica", category: "cardio", code: "ELP", w: 1.8, h: 0.75 },
  { id: "upright-bike", label: "Bici vertical", category: "cardio", code: "BIV", w: 1.2, h: 0.6 },
  { id: "recumbent-bike", label: "Bici reclinada", category: "cardio", code: "BIR", w: 1.6, h: 0.7 },
  { id: "spin-bike", label: "Bici spinning", category: "cardio", code: "SPN", w: 1.1, h: 0.55 },
  { id: "rower", label: "Remo", category: "cardio", code: "REM", w: 2.4, h: 0.55 },
  { id: "stair", label: "Escaladora", category: "cardio", code: "ESC", w: 1.4, h: 0.9 },
  { id: "ski-erg", label: "SkiErg", category: "cardio", code: "SKI", w: 0.7, h: 0.6 },
  { id: "air-bike", label: "Air bike", category: "cardio", code: "AIR", w: 1.3, h: 0.6 },

  // Strength machines
  { id: "leg-press", label: "Prensa de piernas", category: "strength", code: "PRP", w: 2.3, h: 1.2 },
  { id: "hack-squat", label: "Hack squat", category: "strength", code: "HKS", w: 2.0, h: 1.3 },
  { id: "lat-pulldown", label: "Jalón al pecho", category: "strength", code: "JAL", w: 1.4, h: 1.2 },
  { id: "seated-row", label: "Remo sentado", category: "strength", code: "RMS", w: 1.7, h: 1.1 },
  { id: "chest-press", label: "Press de pecho", category: "strength", code: "PPE", w: 1.5, h: 1.2 },
  { id: "shoulder-press", label: "Press de hombro", category: "strength", code: "PHO", w: 1.4, h: 1.2 },
  { id: "pec-deck", label: "Pec deck", category: "strength", code: "PEC", w: 1.4, h: 1.2 },
  { id: "leg-extension", label: "Extensión de cuádriceps", category: "strength", code: "EXT", w: 1.5, h: 1.1 },
  { id: "leg-curl", label: "Curl femoral", category: "strength", code: "FEM", w: 1.6, h: 1.1 },
  { id: "abductor", label: "Abductor / Aductor", category: "strength", code: "ABD", w: 1.4, h: 1.1 },
  { id: "cable-crossover", label: "Cruce de poleas", category: "strength", code: "CRP", w: 3.6, h: 1.3 },
  { id: "smith", label: "Máquina Smith", category: "strength", code: "SMT", w: 2.1, h: 2.0 },
  { id: "assisted-pullup", label: "Dominadas asistidas", category: "strength", code: "DOM", w: 1.5, h: 1.4 },
  { id: "glute-machine", label: "Máquina de glúteo", category: "strength", code: "GLU", w: 1.6, h: 1.3 },
  { id: "calf-raise", label: "Elevación de gemelos", category: "strength", code: "GEM", w: 1.3, h: 1.2 },

  // Free weights
  { id: "power-rack", label: "Rack de potencia", category: "freeweights", code: "RCK", w: 1.7, h: 1.7 },
  { id: "squat-stand", label: "Soporte de sentadilla", category: "freeweights", code: "SQT", w: 1.3, h: 1.3 },
  { id: "flat-bench", label: "Banco plano", category: "freeweights", code: "BPL", w: 1.4, h: 0.6 },
  { id: "adjustable-bench", label: "Banco ajustable", category: "freeweights", code: "BAJ", w: 1.4, h: 0.6 },
  { id: "decline-bench", label: "Banco declinado", category: "freeweights", code: "BDC", w: 1.6, h: 0.6 },
  { id: "preacher", label: "Banco Scott", category: "freeweights", code: "SCT", w: 1.2, h: 1.0 },
  { id: "dumbbell-rack", label: "Rack de mancuernas", category: "freeweights", code: "MNC", w: 2.6, h: 0.7 },
  { id: "plate-tree", label: "Árbol de discos", category: "freeweights", code: "DSC", w: 0.7, h: 0.7 },
  { id: "barbell-rack", label: "Rack de barras", category: "freeweights", code: "BAR", w: 0.8, h: 0.8 },
  { id: "olympic-platform", label: "Plataforma olímpica", category: "freeweights", code: "PLT", w: 2.5, h: 2.5 },
  { id: "deadlift-platform", label: "Plataforma de peso muerto", category: "freeweights", code: "PDM", w: 2.4, h: 1.5 },
  { id: "hyperextension", label: "Banco de hiperextensiones", category: "freeweights", code: "HYP", w: 1.4, h: 0.9 },
  { id: "ab-bench", label: "Banco abdominal", category: "freeweights", code: "ABB", w: 1.5, h: 0.6 },

  // Functional
  { id: "functional-trainer", label: "Entrenador funcional", category: "functional", code: "FUN", w: 1.6, h: 1.2 },
  { id: "cable-tower", label: "Torre de poleas simple", category: "functional", code: "TOR", w: 1.2, h: 1.0 },
  { id: "kettlebell-rack", label: "Rack de kettlebells", category: "functional", code: "KTB", w: 1.2, h: 0.5 },
  { id: "plyo-boxes", label: "Cajones pliométricos", category: "functional", code: "PLY", w: 1.0, h: 1.0 },
  { id: "turf-sled", label: "Pista de trineo", category: "functional", code: "TRN", w: 12.0, h: 1.8 },
  { id: "battle-rope", label: "Cuerdas de batalla", category: "functional", code: "CBT", w: 1.0, h: 3.0 },
  { id: "rig", label: "Rig / jaula funcional", category: "functional", code: "RIG", w: 3.6, h: 1.4 },
  { id: "ghd", label: "GHD", category: "functional", code: "GHD", w: 1.6, h: 0.8 },
  { id: "stretch-mat", label: "Zona de colchonetas", category: "functional", code: "MAT", w: 2.0, h: 2.0 },
  { id: "assault-runner", label: "Curved runner", category: "functional", code: "CRV", w: 1.9, h: 0.85 },

  // Amenities / areas
  { id: "reception", label: "Recepción", category: "amenities", code: "REC", w: 2.4, h: 0.8 },
  { id: "lockers", label: "Casilleros", category: "amenities", code: "LCK", w: 1.8, h: 0.5 },
  { id: "bench-seat", label: "Banca de vestidor", category: "amenities", code: "BNC", w: 1.6, h: 0.4 },
  { id: "water-station", label: "Estación de agua", category: "amenities", code: "AGU", w: 0.6, h: 0.6 },
  { id: "mirror-panel", label: "Panel de espejos", category: "amenities", code: "ESP", w: 2.4, h: 0.15 },
  { id: "column", label: "Columna estructural", category: "amenities", code: "COL", w: 0.5, h: 0.5 },
  { id: "storage-shelf", label: "Estante de bodega", category: "amenities", code: "EST", w: 1.8, h: 0.6 },
  { id: "fan", label: "Ventilador de piso", category: "amenities", code: "VNT", w: 0.7, h: 0.7 },
];

export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(
  MACHINE_CATALOG.map((m) => [m.id, m]),
);

// ───────────────────────────────────────────────
// Zone presets for the "cuadro" tool
// ───────────────────────────────────────────────
export interface ZonePreset {
  id: string;
  label: string;
  color: string;
}

export const ZONE_PRESETS: ZonePreset[] = [
  { id: "perimetro", label: "Perímetro / piso", color: "#94a3b8" },
  { id: "cardio", label: "Zona de cardio", color: "#38bdf8" },
  { id: "fuerza", label: "Zona de fuerza", color: "#a78bfa" },
  { id: "peso-libre", label: "Zona de peso libre", color: "#fb923c" },
  { id: "funcional", label: "Zona funcional / turf", color: "#34d399" },
  { id: "estiramiento", label: "Estiramiento / movilidad", color: "#2dd4bf" },
  { id: "clases", label: "Salón de clases", color: "#c084fc" },
  { id: "vestidores", label: "Vestidores", color: "#f472b6" },
  { id: "recepcion", label: "Recepción / lobby", color: "#facc15" },
  { id: "oficina", label: "Oficina", color: "#fca5a5" },
  { id: "bodega", label: "Bodega", color: "#a3a3a3" },
  { id: "libre", label: "Cuadro libre", color: "#64748b" },
];

export const ZONE_BY_ID: Record<string, ZonePreset> = Object.fromEntries(
  ZONE_PRESETS.map((z) => [z.id, z]),
);

// ───────────────────────────────────────────────
// Sample layout — a small 18 × 12 m studio, so the tool
// opens with something to look at. Fully deletable.
// ───────────────────────────────────────────────
export function buildSampleObjects(): import("./types").PlanObject[] {
  let n = 0;
  const id = () => `s${Date.now().toString(36)}${(n++).toString(36)}`;
  const asset = (code: string, i: number) => `${code}-${String(i).padStart(2, "0")}`;

  return [
    // building outline
    {
      id: id(), kind: "rect", label: "Piso del gimnasio", x: 1, y: 1, w: 18, h: 12,
      color: "#94a3b8", zone: "perimetro",
    },
    // zones
    { id: id(), kind: "rect", label: "Cardio", x: 1.2, y: 1.2, w: 6.4, h: 5, color: "#38bdf8", zone: "cardio" },
    { id: id(), kind: "rect", label: "Fuerza", x: 7.8, y: 1.2, w: 6.4, h: 6.6, color: "#a78bfa", zone: "fuerza" },
    { id: id(), kind: "rect", label: "Peso libre", x: 1.2, y: 6.4, w: 8.6, h: 6.4, color: "#fb923c", zone: "peso-libre" },
    { id: id(), kind: "rect", label: "Funcional / turf", x: 10, y: 8, w: 8.8, h: 4.8, color: "#34d399", zone: "funcional" },
    { id: id(), kind: "rect", label: "Recepción", x: 14.4, y: 1.2, w: 4.4, h: 2.4, color: "#facc15", zone: "recepcion" },

    // cardio row
    { id: id(), kind: "machine", catalogId: "treadmill", label: "Caminadora", assetTag: asset("CAM", 1), x: 2.6, y: 2.2, w: 2.0, h: 0.95, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "treadmill", label: "Caminadora", assetTag: asset("CAM", 2), x: 4.9, y: 2.2, w: 2.0, h: 0.95, rotation: 0, status: "maintenance" },
    { id: id(), kind: "machine", catalogId: "elliptical", label: "Elíptica", assetTag: asset("ELP", 1), x: 2.6, y: 3.7, w: 1.8, h: 0.75, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "spin-bike", label: "Bici spinning", assetTag: asset("SPN", 1), x: 4.6, y: 3.7, w: 1.1, h: 0.55, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "rower", label: "Remo", assetTag: asset("REM", 1), x: 3.5, y: 5.2, w: 2.4, h: 0.55, rotation: 0, status: "down" },

    // strength stack
    { id: id(), kind: "machine", catalogId: "lat-pulldown", label: "Jalón al pecho", assetTag: asset("JAL", 1), x: 9.2, y: 2.4, w: 1.4, h: 1.2, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "seated-row", label: "Remo sentado", assetTag: asset("RMS", 1), x: 11.2, y: 2.4, w: 1.7, h: 1.1, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "leg-press", label: "Prensa de piernas", assetTag: asset("PRP", 1), x: 9.6, y: 4.6, w: 2.3, h: 1.2, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "smith", label: "Máquina Smith", assetTag: asset("SMT", 1), x: 12.6, y: 5.4, w: 2.1, h: 2.0, rotation: 0, status: "ok" },

    // free weights
    { id: id(), kind: "machine", catalogId: "power-rack", label: "Rack de potencia", assetTag: asset("RCK", 1), x: 2.6, y: 8.2, w: 1.7, h: 1.7, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "power-rack", label: "Rack de potencia", assetTag: asset("RCK", 2), x: 5.0, y: 8.2, w: 1.7, h: 1.7, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "flat-bench", label: "Banco plano", assetTag: asset("BPL", 1), x: 2.6, y: 10.6, w: 1.4, h: 0.6, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "adjustable-bench", label: "Banco ajustable", assetTag: asset("BAJ", 1), x: 5.0, y: 10.6, w: 1.4, h: 0.6, rotation: 0, status: "maintenance" },
    { id: id(), kind: "machine", catalogId: "dumbbell-rack", label: "Rack de mancuernas", assetTag: asset("MNC", 1), x: 7.8, y: 11.8, w: 2.6, h: 0.7, rotation: 0, status: "ok" },

    // functional
    { id: id(), kind: "machine", catalogId: "functional-trainer", label: "Entrenador funcional", assetTag: asset("FUN", 1), x: 11.4, y: 9.2, w: 1.6, h: 1.2, rotation: 0, status: "ok" },
    { id: id(), kind: "machine", catalogId: "stretch-mat", label: "Zona de colchonetas", assetTag: asset("MAT", 1), x: 15.6, y: 10.4, w: 2.0, h: 2.0, rotation: 0, status: "ok" },

    // amenities
    { id: id(), kind: "machine", catalogId: "reception", label: "Recepción", assetTag: asset("REC", 1), x: 16.4, y: 2.2, w: 2.4, h: 0.8, rotation: 0, status: "ok" },
  ];
}
