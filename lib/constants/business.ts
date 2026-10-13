// lib/constants/business.ts
// Constantes de lógica de negocio: IVA, comisiones, disponibilidad y paquetes B2B.

/** Tasa de IVA por defecto (%) cuando no hay configuración en base de datos */
export const DEFAULT_IVA_RATE = 13;

/** Comisión por defecto para nuevos operadores B2B (%) */
export const DEFAULT_COMMISSION_RATE = 10;

/** Multiplicadores de precio para paquetes B2B generados automáticamente */
export const B2B_PACKAGE_MULTIPLIERS = {
  PREMIUM: 1.25,
  VIP: 1.50,
} as const;

/** Slots de disponibilidad por defecto al generar el calendario */
export const DEFAULT_AVAILABILITY = {
  /** Días de semana (lunes–viernes) */
  WEEKDAY: 20,
  /** Fines de semana (sábado–domingo) */
  WEEKEND: 50,
} as const;

/** Estados que consumen cupo real, incluyendo variantes histÃ³ricas. */
export const CONFIRMED_RESERVATION_STATUSES = [
  "COMPLETED",
  "completed",
  "CONFIRMED",
  "confirmed",
  "CAPTURED",
  "captured",
  "APPROVED",
  "approved",
  "PAID",
  "paid",
] as const;
