// Datos de demostracion del panel interno de /traa (ventas y despacho).
//
// Todo es determinista —semilla fija y fecha de referencia fija— para que el
// render del servidor y el del cliente coincidan y la demo se vea igual en
// cada visita. Sustituir estas constantes por la respuesta del ERP seria el
// unico cambio real.

/** Fecha de referencia de la demo (no usamos "hoy" para evitar desalineados). */
export const DEMO_TODAY = Date.UTC(2026, 8, 4); // 4 de setiembre de 2026
const DAY = 86_400_000;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

function dayLabel(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}
function weekday(ms: number): number {
  return new Date(ms).getUTCDay();
}

/** PRNG determinista (mulberry32) para que la serie tenga textura sin azar real. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- formato -----------------------------------------------------------------

function group(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** ₡ 1 284 500 */
export function crc(n: number): string {
  return `₡ ${group(n)}`;
}

/** ₡ 4,2 M — para ejes y tarjetas donde el detalle sobra. */
export function crcShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `₡ ${(n / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (Math.abs(n) >= 10_000) return `₡ ${Math.round(n / 1000)} K`;
  return crc(n);
}

export function pct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals).replace(".", ",")} %`;
}

// =============================================================================
// VENTAS
// =============================================================================

export type DayPoint = { ms: number; label: string; enLinea: number; mostrador: number };

/** 30 dias de ventas: el canal en linea crece, el mostrador manda los sabados. */
export const SALES_DAYS: DayPoint[] = (() => {
  const rand = rng(20260904);
  const out: DayPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const ms = DEMO_TODAY - i * DAY;
    const wd = weekday(ms);
    const trend = 1 + (29 - i) * 0.012; // el canal digital toma vuelo
    const finde = wd === 0 ? 0.18 : wd === 6 ? 0.72 : 1;
    const ruido = 0.82 + rand() * 0.36;
    out.push({
      ms,
      label: dayLabel(ms),
      enLinea: Math.round(268_000 * trend * finde * ruido),
      mostrador: Math.round(505_000 * finde * (0.86 + rand() * 0.28)),
    });
  }
  return out;
})();

const totalEnLinea = SALES_DAYS.reduce((s, d) => s + d.enLinea, 0);
const totalMostrador = SALES_DAYS.reduce((s, d) => s + d.mostrador, 0);

export const SALES_KPI = {
  total: totalEnLinea + totalMostrador,
  totalDelta: 18.4,
  enLinea: totalEnLinea,
  enLineaShare: (totalEnLinea / (totalEnLinea + totalMostrador)) * 100,
  pedidos: 412,
  pedidosDelta: 9.2,
  ticket: Math.round(totalEnLinea / 412),
  ticketDelta: 6.1,
  conversion: 3.8,
  conversionDelta: 0.6,
};

/** 12 puntos para las chispas de las tarjetas. */
export const SPARKS = {
  total: SALES_DAYS.slice(-12).map((d) => d.enLinea + d.mostrador),
  pedidos: [26, 31, 24, 35, 33, 41, 29, 38, 44, 40, 47, 52],
  ticket: [54_200, 56_100, 55_400, 58_900, 57_300, 59_800, 61_200, 58_400, 62_100, 60_500, 63_400, 64_900],
  conversion: [2.9, 3.1, 3.0, 3.4, 3.2, 3.5, 3.3, 3.6, 3.7, 3.5, 3.9, 3.8],
};

export const SALES_BY_CATEGORY: { label: string; value: number; orders: number }[] = [
  { label: "Frenos", value: 6_140_000, orders: 112 },
  { label: "Motor", value: 5_230_000, orders: 68 },
  { label: "Transmisión", value: 4_410_000, orders: 74 },
  { label: "Suspensión", value: 3_620_000, orders: 63 },
  { label: "Eléctrico", value: 3_180_000, orders: 41 },
  { label: "Filtros", value: 2_290_000, orders: 96 },
];

export const PAYMENT_MIX: { label: string; value: number }[] = [
  { label: "SINPE Móvil", value: 38 },
  { label: "Tarjeta", value: 33 },
  { label: "Transferencia", value: 17 },
  { label: "Contra entrega", value: 12 },
];

export const TOP_PRODUCTS: {
  sku: string;
  name: string;
  units: number;
  revenue: number;
  margin: number;
}[] = [
  { sku: "TR-FRN-0210", name: "Pastillas delanteras cerámicas", units: 84, revenue: 2_066_400, margin: 34 },
  { sku: "TR-FIL-0629", name: "Filtro de aceite spin-on LF3349", units: 152, revenue: 1_018_400, margin: 41 },
  { sku: "TR-ELE-0540", name: "Batería 27 placas 1000 CCA", units: 21, revenue: 2_034_900, margin: 22 },
  { sku: "TR-SUS-0402", name: "Amortiguador delantero a gas", units: 46, revenue: 1_278_800, margin: 29 },
  { sku: "TR-TRN-0133", name: "Cruceta cardán 1310 con grasera", units: 118, revenue: 1_156_400, margin: 38 },
  { sku: "TR-FRN-0233", name: "Disco de freno ventilado 300mm", units: 28, revenue: 1_089_200, margin: 26 },
  { sku: "TR-MOT-0330", name: "Bomba de agua 4HK1 con polea", units: 22, revenue: 921_800, margin: 31 },
  { sku: "TR-FIL-0601", name: "Filtro de aire primario", units: 47, revenue: 855_400, margin: 36 },
];

export const SALES_BY_BRANCH: { label: string; value: number; orders: number }[] = [
  { label: "San José Centro", value: 8_920_000, orders: 141 },
  { label: "Heredia", value: 4_310_000, orders: 78 },
  { label: "San Carlos", value: 3_780_000, orders: 69 },
  { label: "Liberia", value: 2_940_000, orders: 52 },
  { label: "Pérez Zeledón", value: 2_460_000, orders: 44 },
  { label: "Limón", value: 1_460_000, orders: 28 },
];

// =============================================================================
// DESPACHO
// =============================================================================

export const DISPATCH_KPI = {
  porDespachar: 37,
  porDespacharDelta: 4,
  enRuta: 24,
  enRutaDelta: -2,
  entregadosHoy: 51,
  entregadosDelta: 11,
  atrasados: 3,
  tiempoAlistado: "2 h 14 min",
  slaGlobal: 93.4,
};

export type StageId = "recibido" | "alistado" | "empacado" | "ruta" | "entregado";

export const STAGES: { id: StageId; label: string; count: number; hint: string }[] = [
  { id: "recibido", label: "Recibido", count: 12, hint: "Pago confirmado, sin asignar" },
  { id: "alistado", label: "En alistado", count: 14, hint: "Bodega buscando la parte" },
  { id: "empacado", label: "Empacado", count: 11, hint: "Listo para el transportista" },
  { id: "ruta", label: "En ruta", count: 24, hint: "Con guía asignada" },
  { id: "entregado", label: "Entregado hoy", count: 51, hint: "Con acuse de recibo" },
];

/** Despachos por dia, ultimos 14 dias. */
export const DISPATCH_DAYS: { ms: number; label: string; value: number }[] = (() => {
  const rand = rng(773311);
  const out: { ms: number; label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const ms = DEMO_TODAY - i * DAY;
    const wd = weekday(ms);
    const finde = wd === 0 ? 0.15 : wd === 6 ? 0.7 : 1;
    out.push({ ms, label: dayLabel(ms), value: Math.round(48 * finde * (0.8 + rand() * 0.45)) });
  }
  return out;
})();

export const CARRIER_SLA: { label: string; value: number; envios: number }[] = [
  { label: "Retiro en sucursal", value: 99.1, envios: 96 },
  { label: "Flota TRAA · GAM", value: 96.4, envios: 148 },
  { label: "Correos de Costa Rica", value: 90.7, envios: 173 },
  { label: "Encomienda de bus", value: 87.2, envios: 64 },
];

export type QueueState = "recibido" | "alistado" | "empacado" | "ruta" | "entregado";
export type QueueRisk = "ok" | "riesgo" | "atrasado";

export type QueueRow = {
  id: string;
  cliente: string;
  sucursal: string;
  metodo: string;
  transportista: string;
  items: number;
  total: number;
  estado: QueueState;
  riesgo: QueueRisk;
  eta: string;
};

export const QUEUE: QueueRow[] = [
  { id: "TRAA-9K4M2X", cliente: "Marcela Vargas U.", sucursal: "San Carlos", metodo: "Envío nacional", transportista: "Correos de CR", items: 6, total: 79_100, estado: "recibido", riesgo: "ok", eta: "8 set" },
  { id: "TRAA-9K4L7P", cliente: "Taller El Roble S.A.", sucursal: "San José Centro", metodo: "GAM exprés", transportista: "Flota TRAA", items: 3, total: 214_500, estado: "alistado", riesgo: "riesgo", eta: "Hoy 5 p. m." },
  { id: "TRAA-9K4J1D", cliente: "Transportes Zamora", sucursal: "Heredia", metodo: "GAM exprés", transportista: "Flota TRAA", items: 12, total: 486_200, estado: "empacado", riesgo: "ok", eta: "Mañana" },
  { id: "TRAA-9K4H8B", cliente: "Rónald Jiménez", sucursal: "San José Centro", metodo: "Retiro", transportista: "—", items: 1, total: 24_600, estado: "empacado", riesgo: "ok", eta: "Hoy" },
  { id: "TRAA-9K4G3S", cliente: "Buses La Fortuna", sucursal: "San Carlos", metodo: "Encomienda", transportista: "Encomienda de bus", items: 8, total: 312_800, estado: "ruta", riesgo: "atrasado", eta: "Venció ayer" },
  { id: "TRAA-9K4F9N", cliente: "Autorepuestos Nicoya", sucursal: "Liberia", metodo: "Envío nacional", transportista: "Correos de CR", items: 15, total: 728_400, estado: "ruta", riesgo: "ok", eta: "9 set" },
  { id: "TRAA-9K4E5R", cliente: "Kattia Solano M.", sucursal: "Pérez Zeledón", metodo: "Envío nacional", transportista: "Correos de CR", items: 2, total: 41_700, estado: "ruta", riesgo: "riesgo", eta: "6 set" },
  { id: "TRAA-9K4D2T", cliente: "Mecánica Hermanos Rojas", sucursal: "Heredia", metodo: "GAM exprés", transportista: "Flota TRAA", items: 5, total: 158_900, estado: "alistado", riesgo: "ok", eta: "Mañana" },
  { id: "TRAA-9K4C6V", cliente: "Grupo Agrícola Coto", sucursal: "Limón", metodo: "Encomienda", transportista: "Encomienda de bus", items: 9, total: 397_300, estado: "recibido", riesgo: "riesgo", eta: "Hoy 7 p. m." },
  { id: "TRAA-9K4B4W", cliente: "Diego Camacho A.", sucursal: "San José Centro", metodo: "Retiro", transportista: "—", items: 3, total: 62_100, estado: "entregado", riesgo: "ok", eta: "Entregado" },
  { id: "TRAA-9K4A1Y", cliente: "Flota Municipal Escazú", sucursal: "San José Centro", metodo: "GAM exprés", transportista: "Flota TRAA", items: 22, total: 1_284_000, estado: "empacado", riesgo: "atrasado", eta: "Venció hoy" },
  { id: "TRAA-9K3Z8K", cliente: "Servicentro Guápiles", sucursal: "Limón", metodo: "Envío nacional", transportista: "Correos de CR", items: 4, total: 96_900, estado: "entregado", riesgo: "ok", eta: "Entregado" },
];

export const QUEUE_STATE_LABEL: Record<QueueState, string> = {
  recibido: "Recibido",
  alistado: "En alistado",
  empacado: "Empacado",
  ruta: "En ruta",
  entregado: "Entregado",
};

export const RISK_LABEL: Record<QueueRisk, string> = {
  ok: "A tiempo",
  riesgo: "En riesgo",
  atrasado: "Atrasado",
};
