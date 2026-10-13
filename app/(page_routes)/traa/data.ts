// Catalogo de demostracion para /traa.
// Precios en colones, IVA incluido (como se muestran de cara al cliente en CR).
// La disponibilidad y las sucursales son ilustrativas para el pitch.

export type CategoryId =
  | "transmision"
  | "frenos"
  | "motor"
  | "suspension"
  | "electrico"
  | "filtros";

export type StockState = "in" | "low" | "consult";

export type Product = {
  id: string; // sirve de SKU visible
  name: string;
  brand: string;
  category: CategoryId;
  price: number; // CRC, IVA incluido
  listPrice?: number; // precio de lista tachado, si aplica
  stock: StockState;
  branches: string[];
};

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "transmision", label: "Transmisión" },
  { id: "frenos", label: "Frenos" },
  { id: "motor", label: "Motor" },
  { id: "suspension", label: "Suspensión" },
  { id: "electrico", label: "Eléctrico" },
  { id: "filtros", label: "Filtros" },
];

export const CATEGORY_LABEL: Record<CategoryId, string> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c.label;
    return acc;
  },
  {} as Record<CategoryId, string>,
);

const B = {
  sjo: "San José Centro",
  her: "Heredia",
  sc: "San Carlos",
  lib: "Liberia",
  pz: "Pérez Zeledón",
  lim: "Limón",
};

export const PRODUCTS: Product[] = [
  // --- Transmisión ------------------------------------------------------------
  {
    id: "TR-TRN-0041",
    name: "Porta rol barra 40mm Isuzu NKR",
    brand: "NKR GROUP",
    category: "transmision",
    price: 18900,
    stock: "in",
    branches: [B.sjo, B.her, B.sc],
  },
  {
    id: "TR-TRN-0062",
    name: "Soporte barra 50mm 6902 GF18725",
    brand: "DAI",
    category: "transmision",
    price: 12400,
    stock: "in",
    branches: [B.sjo, B.her],
  },
  {
    id: "TR-TRN-0108",
    name: "Acople de barra cardán serie 1410",
    brand: "DANA SPICER",
    category: "transmision",
    price: 47500,
    listPrice: 52000,
    stock: "low",
    branches: [B.sjo],
  },
  {
    id: "TR-TRN-0133",
    name: "Cruceta cardán 1310 con grasera",
    brand: "SPICER",
    category: "transmision",
    price: 9800,
    stock: "in",
    branches: [B.sjo, B.her, B.sc, B.lib, B.pz],
  },
  {
    id: "TR-TRN-0150",
    name: "Yugo deslizante 1410 32 estrías",
    brand: "WORLD AMERICAN",
    category: "transmision",
    price: 63200,
    stock: "consult",
    branches: [B.sjo],
  },
  {
    id: "TR-TRN-0177",
    name: "Kit rótulas de barra estabilizadora (par)",
    brand: "555 JAPAN",
    category: "transmision",
    price: 21300,
    stock: "in",
    branches: [B.sjo, B.lib, B.sc],
  },

  // --- Frenos ---------------------------------------------------------------
  {
    id: "TR-FRN-0210",
    name: "Juego de pastillas delanteras cerámicas",
    brand: "BENDIX",
    category: "frenos",
    price: 24600,
    stock: "in",
    branches: [B.sjo, B.her, B.sc, B.lib, B.pz, B.lim],
  },
  {
    id: "TR-FRN-0233",
    name: "Disco de freno ventilado 300mm",
    brand: "TRW",
    category: "frenos",
    price: 38900,
    stock: "in",
    branches: [B.sjo, B.her, B.pz],
  },
  {
    id: "TR-FRN-0258",
    name: "Bomba de freno tándem con depósito",
    brand: "MERITOR",
    category: "frenos",
    price: 89000,
    listPrice: 98500,
    stock: "low",
    branches: [B.sjo],
  },
  {
    id: "TR-FRN-0274",
    name: "Juego de zapatas traseras reforzadas",
    brand: "FRAS-LE",
    category: "frenos",
    price: 34200,
    stock: "in",
    branches: [B.sjo, B.sc],
  },

  // --- Motor --------------------------------------------------------------
  {
    id: "TR-MOT-0312",
    name: "Kit de empaques completo 4JB1",
    brand: "ISUZU",
    category: "motor",
    price: 74500,
    stock: "consult",
    branches: [B.sjo],
  },
  {
    id: "TR-MOT-0330",
    name: "Bomba de agua 4HK1 con polea",
    brand: "GMB",
    category: "motor",
    price: 41900,
    stock: "in",
    branches: [B.sjo, B.her],
  },
  {
    id: "TR-MOT-0351",
    name: "Termostato 82°C con empaque",
    brand: "GATES",
    category: "motor",
    price: 8400,
    stock: "in",
    branches: [B.sjo, B.her, B.lib],
  },
  {
    id: "TR-MOT-0369",
    name: "Kit de banda de repartición + tensor",
    brand: "CONTITECH",
    category: "motor",
    price: 58700,
    listPrice: 64000,
    stock: "low",
    branches: [B.sjo, B.her],
  },

  // --- Suspensión --------------------------------------------------------
  {
    id: "TR-SUS-0402",
    name: "Amortiguador delantero a gas",
    brand: "MONROE",
    category: "suspension",
    price: 27800,
    stock: "in",
    branches: [B.sjo, B.her, B.sc, B.lib, B.pz],
  },
  {
    id: "TR-SUS-0421",
    name: "Terminal de dirección exterior",
    brand: "555 JAPAN",
    category: "suspension",
    price: 15600,
    stock: "in",
    branches: [B.sjo, B.sc],
  },
  {
    id: "TR-SUS-0448",
    name: "Rótula de suspensión inferior",
    brand: "CTR",
    category: "suspension",
    price: 19200,
    stock: "low",
    branches: [B.sjo],
  },
  {
    id: "TR-SUS-0463",
    name: "Bujes de mesa delantera (juego)",
    brand: "DAI",
    category: "suspension",
    price: 13400,
    stock: "in",
    branches: [B.sjo, B.her, B.pz],
  },

  // --- Eléctrico -------------------------------------------------------------
  {
    id: "TR-ELE-0505",
    name: "Alternador 24V 80A con polea de embrague",
    brand: "BOSCH",
    category: "electrico",
    price: 128000,
    listPrice: 139000,
    stock: "low",
    branches: [B.sjo],
  },
  {
    id: "TR-ELE-0522",
    name: "Motor de arranque 24V 4.5kW",
    brand: "DENSO",
    category: "electrico",
    price: 142500,
    stock: "consult",
    branches: [B.sjo],
  },
  {
    id: "TR-ELE-0540",
    name: "Batería 27 placas 1000 CCA",
    brand: "YUASA",
    category: "electrico",
    price: 96900,
    stock: "in",
    branches: [B.sjo, B.her, B.sc],
  },

  // --- Filtros -----------------------------------------------------------------
  {
    id: "TR-FIL-0601",
    name: "Filtro de aire primario",
    brand: "DONALDSON",
    category: "filtros",
    price: 18200,
    stock: "in",
    branches: [B.sjo, B.her, B.sc, B.lib, B.pz, B.lim],
  },
  {
    id: "TR-FIL-0618",
    name: "Filtro separador de agua / combustible",
    brand: "RACOR",
    category: "filtros",
    price: 22900,
    stock: "in",
    branches: [B.sjo, B.her],
  },
  {
    id: "TR-FIL-0629",
    name: "Filtro de aceite spin-on LF3349",
    brand: "FLEETGUARD",
    category: "filtros",
    price: 6700,
    stock: "in",
    branches: [B.sjo, B.her, B.sc, B.lib, B.pz, B.lim],
  },
];

const crc = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

/** Ej. "CRC 12 500" -> normalizamos a "12 500" y anteponemos el simbolo. */
export function money(value: number): string {
  const digits = crc
    .format(Math.round(value))
    .replace(/[^\d.,\s]/g, "")
    .trim();
  return `₡ ${digits}`;
}

export const STOCK_LABEL: Record<StockState, string> = {
  in: "Disponible",
  low: "Últimas unidades",
  consult: "Consulte disponibilidad",
};

/** normaliza para busqueda: sin tildes ni mayusculas */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export const BRANCHES = Object.values(B);

export const WHATSAPP = "50600000000"; // TODO: numero real de TRAA para la demo
export const FREE_SHIPPING_THRESHOLD = 50000;
