import type { TourSummary } from "@/lib/types/index";
import { CRC_PER_USD } from "@/lib/reservation/packages";

export const WHATSAPP_HREF = "https://wa.me/50662332535";
export const CIUDAD_ESMERALDA_SLUG = "tour-ciudad-esmeralda";
export const BOOKING_HREF = `/reservar?tour=${CIUDAD_ESMERALDA_SLUG}`;
export const TOURS_HREF = "/tours";

export function primaryBookingLabel(isEs: boolean): string {
  return isEs ? "Ver fechas y reservar" : "See dates and book";
}

export function compactBookingLabel(isEs: boolean): string {
  return isEs ? "Reservar ahora" : "Book now";
}

type PricePair = {
  usd: number | null;
  crc: number | null;
};

export type TourPriceDisplay = {
  primary: string;
  secondary: string | null;
  compact: string;
};

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function tourMinPrice(tour?: TourSummary | null): PricePair | null {
  const packagePrices = (tour?.packages ?? [])
    .map((pkg) => ({
      usd: isPositiveNumber(pkg.price) ? pkg.price : null,
      crc: isPositiveNumber(pkg.priceCRC) ? pkg.priceCRC : null,
    }))
    .filter((price) => price.usd != null || price.crc != null);

  if (packagePrices.length > 0) {
    return packagePrices.reduce((lowest, current) => {
      const lowestComparable = lowest.crc ?? (lowest.usd != null ? lowest.usd * CRC_PER_USD : Number.POSITIVE_INFINITY);
      const currentComparable = current.crc ?? (current.usd != null ? current.usd * CRC_PER_USD : Number.POSITIVE_INFINITY);
      return currentComparable < lowestComparable ? current : lowest;
    });
  }

  return isPositiveNumber(tour?.priceCRC) ? { usd: null, crc: tour.priceCRC } : null;
}

function formatUsd(value: number, isEs: boolean): string {
  return `${isEs ? "US" : ""}$${value.toLocaleString(isEs ? "es-CR" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}`;
}

function formatCrc(value: number, isEs: boolean): string {
  const amount = Math.round(value).toLocaleString(isEs ? "es-CR" : "en-US", {
    maximumFractionDigits: 0,
  });
  return isEs ? `₡${amount.replace(/\./g, " ")}` : `CRC ${amount}`;
}

export function getTourPriceDisplay(tour: TourSummary | undefined | null, isEs: boolean): TourPriceDisplay {
  const price = tourMinPrice(tour);
  if (price == null) {
    const fallback = isEs ? "Consultar" : "Ask us";
    return { primary: fallback, secondary: null, compact: fallback };
  }

  const usd = price.usd ?? (price.crc != null ? Math.round(price.crc / CRC_PER_USD) : null);
  const crc = price.crc ?? (price.usd != null ? Math.round(price.usd * CRC_PER_USD) : null);

  const primary = isEs
    ? crc != null
      ? formatCrc(crc, isEs)
      : formatUsd(usd ?? 0, isEs)
    : usd != null
      ? formatUsd(usd, isEs)
      : formatCrc(crc ?? 0, isEs);

  const secondary = isEs
    ? usd != null
      ? formatUsd(usd, isEs)
      : null
    : crc != null
      ? formatCrc(crc, isEs)
      : null;

  return {
    primary,
    secondary: secondary && secondary !== primary ? secondary : null,
    compact: secondary && secondary !== primary ? `${primary} · ${secondary}` : primary,
  };
}

export function formatTourPrice(tour: TourSummary | undefined | null, isEs: boolean): string {
  return getTourPriceDisplay(tour, isEs).compact;
}

export function tourTitle(tour: TourSummary, isEs: boolean): string {
  return isEs ? tour.titleEs : tour.titleEn;
}
