// Pedido confirmado de /traa: tipos, catalogos de entrega/pago y persistencia.
//
// La demo no tiene backend: el pedido se guarda en localStorage al confirmar y
// la pagina /traa/pedido lo lee para mostrar el comprobante. Sustituir estas
// tres funciones por llamadas a la API real seria el unico cambio.

import { Banknote, Building2, CreditCard, Smartphone, Store, Truck } from "lucide-react";
import type { CategoryId } from "./data";

export type DeliveryId = "retiro" | "gam" | "nacional" | "encomienda";
export type PaymentId = "sinpe" | "tarjeta" | "transferencia" | "contra";

export type DeliveryOption = {
  id: DeliveryId;
  label: string;
  desc: string;
  price: number;
  eta: string;
  icon: typeof Truck;
};

export const DELIVERY: DeliveryOption[] = [
  {
    id: "retiro",
    label: "Retiro en sucursal",
    desc: "Listo en 2 horas dentro del horario de tienda",
    price: 0,
    eta: "Hoy",
    icon: Store,
  },
  {
    id: "gam",
    label: "Envío GAM exprés",
    desc: "Gran Área Metropolitana, 24–48 h",
    price: 2500,
    eta: "24–48 h",
    icon: Truck,
  },
  {
    id: "nacional",
    label: "Envío nacional · Correos de Costa Rica",
    desc: "Todo el país, 2–5 días hábiles",
    price: 3900,
    eta: "2–5 días",
    icon: Truck,
  },
  {
    id: "encomienda",
    label: "Encomienda de bus",
    desc: "Mismo día a cabeceras de cantón",
    price: 2000,
    eta: "Mismo día",
    icon: Truck,
  },
];

export type PaymentOption = {
  id: PaymentId;
  label: string;
  desc: string;
  icon: typeof CreditCard;
};

export const PAYMENT: PaymentOption[] = [
  {
    id: "sinpe",
    label: "SINPE Móvil",
    desc: "Transferí al 8888-8888 (TRAA Repuestos S.A.) y adjuntá el comprobante",
    icon: Smartphone,
  },
  {
    id: "tarjeta",
    label: "Tarjeta de crédito o débito",
    desc: "Visa, Mastercard y AMEX · pago con 3-D Secure",
    icon: CreditCard,
  },
  {
    id: "transferencia",
    label: "Transferencia o SINPE a cuenta IBAN",
    desc: "BAC / Banco Nacional · CR00 0000 0000 0000 0000 00",
    icon: Building2,
  },
  {
    id: "contra",
    label: "Pago contra entrega",
    desc: "Efectivo o datáfono al recibir · solo retiro y GAM",
    icon: Banknote,
  },
];

export const SINPE_NUMBER = "8888-8888";
export const IBAN = "CR00 0000 0000 0000 0000 00";

export type OrderLine = {
  id: string;
  name: string;
  brand: string;
  category: CategoryId;
  qty: number;
  unit: number;
};

export type OrderAddress = {
  nombre: string;
  telefono: string;
  provincia: string;
  canton: string;
  direccion: string;
};

export type PlacedOrder = {
  id: string;
  createdAt: string; // ISO
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  shippingFree: boolean;
  total: number;
  delivery: { id: DeliveryId; label: string; eta: string };
  payment: { id: PaymentId; label: string };
  branch?: string;
  address?: OrderAddress;
  card4?: string; // ultimos 4 digitos, si pago con tarjeta
};

const ORDERS_KEY = "traa-orders-v1";
const MAX_STORED = 8;

function readAll(): PlacedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlacedOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Guarda el pedido (los mas recientes primero) y devuelve su id. */
export function saveOrder(order: PlacedOrder): string {
  try {
    const next = [order, ...readAll().filter((o) => o.id !== order.id)].slice(0, MAX_STORED);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible: la pagina cae al pedido de ejemplo */
  }
  return order.id;
}

export function readOrder(id: string | null): PlacedOrder | null {
  const all = readAll();
  if (!id) return all[0] ?? null;
  return all.find((o) => o.id === id) ?? null;
}

export function newOrderId(): string {
  return `TRAA-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/** Pedido de ejemplo: permite abrir /traa/pedido directo en la demo. */
export const SAMPLE_ORDER: PlacedOrder = {
  id: "TRAA-9K4M2X",
  createdAt: "2026-09-04T15:42:00.000Z",
  lines: [
    { id: "TR-FRN-0210", name: "Juego de pastillas delanteras cerámicas", brand: "BENDIX", category: "frenos", qty: 2, unit: 24600 },
    { id: "TR-FIL-0629", name: "Filtro de aceite spin-on LF3349", brand: "FLEETGUARD", category: "filtros", qty: 3, unit: 6700 },
    { id: "TR-TRN-0133", name: "Cruceta cardán 1310 con grasera", brand: "SPICER", category: "transmision", qty: 1, unit: 9800 },
  ],
  subtotal: 79100,
  shipping: 0,
  shippingFree: true,
  total: 79100,
  delivery: { id: "nacional", label: "Envío nacional · Correos de Costa Rica", eta: "2–5 días" },
  payment: { id: "sinpe", label: "SINPE Móvil" },
  address: {
    nombre: "Marcela Vargas Ureña",
    telefono: "8712-4409",
    provincia: "Alajuela",
    canton: "San Carlos, Ciudad Quesada",
    direccion: "300 m norte de la Cruz Roja, taller portón azul",
  },
};
