import type { ReservationAddonDetails } from "./types";

export type TransportPointRef = { type: "ref"; id: string };

export type TransportQuoteResult = {
  distanceKm: number;
  basePrice: number;
  legs: number;
  total: number;
  perPerson: number;
  type: "private" | "shared";
};

export const TRANSPORT_PICKUP_OPTIONS = [
  // Zona Local
  { id: "san-carlos", labelEs: "San Carlos", labelEn: "San Carlos", region: "local", distance: 0 },
  { id: "ciudad-quesada", labelEs: "Ciudad Quesada", labelEn: "Ciudad Quesada", region: "local", distance: 30 },
  { id: "hotel-airbnb", labelEs: "Hotel / Airbnb (San Carlos)", labelEn: "Hotel / Airbnb (San Carlos)", region: "local", distance: 0 },
  
  // Arenal / La Fortuna
  { id: "la-fortuna", labelEs: "La Fortuna", labelEn: "La Fortuna", region: "arenal", distance: 80 },
  { id: "hotel-la-fortuna-central", labelEs: "Hotel - La Fortuna centro", labelEn: "Hotel - La Fortuna downtown", region: "arenal", distance: 80 },
  { id: "hotel-arenal-area", labelEs: "Hotel - Arenal zona", labelEn: "Hotel - Arenal area", region: "arenal", distance: 100 },
  
  // San José / Aeropuerto
  { id: "san-jose", labelEs: "San José", labelEn: "San José", region: "sanjose", distance: 200 },
  { id: "hotel-san-jose-airport", labelEs: "Aeropuerto SJO / Hotel área", labelEn: "SJO Airport / Hotel area", region: "sanjose", distance: 200 },
  
  // Guanacaste
  { id: "guanacaste-liberia", labelEs: "Liberia, Guanacaste", labelEn: "Liberia, Guanacaste", region: "guanacaste", distance: 280 },
  { id: "guanacaste-tamarindo", labelEs: "Tamarindo, Guanacaste", labelEn: "Tamarindo, Guanacaste", region: "guanacaste", distance: 320 },
  { id: "guanacaste-playa-hermosa", labelEs: "Playa Hermosa, Guanacaste", labelEn: "Playa Hermosa, Guanacaste", region: "guanacaste", distance: 260 },
  
  // Limón
  { id: "limon-puerto", labelEs: "Puerto Limón", labelEn: "Puerto Limón", region: "limon", distance: 180 },
  { id: "limon-cahuita", labelEs: "Cahuita, Limón", labelEn: "Cahuita, Limón", region: "limon", distance: 210 },
  { id: "limon-puerto-viejo", labelEs: "Puerto Viejo, Limón", labelEn: "Puerto Viejo, Limón", region: "limon", distance: 240 },
  
  // Puntarenas
  { id: "puntarenas-puerto", labelEs: "Puerto de Puntarenas", labelEn: "Puntarenas Port", region: "puntarenas", distance: 220 },
  { id: "puntarenas-uvita", labelEs: "Uvita, Puntarenas", labelEn: "Uvita, Puntarenas", region: "puntarenas", distance: 340 },
  { id: "puntarenas-dominical", labelEs: "Dominical, Puntarenas", labelEn: "Dominical, Puntarenas", region: "puntarenas", distance: 310 },

  // Zona Sur
  { id: "perez-zeledon", labelEs: "Pérez Zeledón", labelEn: "Pérez Zeledón", region: "south", distance: 300 },
  
  // San Vicente
  { id: "hotel-san-vicente", labelEs: "Hotel - San Vicente", labelEn: "Hotel - San Vicente", region: "local", distance: 15 },
] as const;

export const TRANSPORT_DROPOFF_OPTIONS = [
  { id: "la-vieja-adventures", labelEs: "La Vieja Adventures (Salida)", labelEn: "La Vieja Adventures (Departure)", region: "local" },
  { id: "san-vicente", labelEs: "San Vicente (Retorno)", labelEn: "San Vicente (Return)", region: "local" },
  { id: "la-fortuna", labelEs: "La Fortuna", labelEn: "La Fortuna", region: "arenal" },
  { id: "san-jose", labelEs: "San José", labelEn: "San José", region: "sanjose" },
  { id: "same-pickup", labelEs: "Mismo lugar de pickup", labelEn: "Same as pickup location", region: "same" },
] as const;

const TRANSPORT_LOCATION_MAP = new Map<string, (typeof TRANSPORT_PICKUP_OPTIONS | typeof TRANSPORT_DROPOFF_OPTIONS)[number]>(
  [...TRANSPORT_PICKUP_OPTIONS, ...TRANSPORT_DROPOFF_OPTIONS].map((location) => [location.id, location]),
);

export function getTransportLocationLabel(id: string, lang: "es" | "en") {
  const option = TRANSPORT_LOCATION_MAP.get(id);
  if (!option) return id;
  return lang === "es" ? option.labelEs : option.labelEn;
}

export function getDefaultTransportDetails(): ReservationAddonDetails {
  return {
    transportType: "private",
    pickupLocation: TRANSPORT_PICKUP_OPTIONS[0].id,
    dropoffLocation: TRANSPORT_DROPOFF_OPTIONS[0].id,
  };
}

export function resolveTransportEndpoints(
  details: ReservationAddonDetails,
): { pickup: TransportPointRef | null; dropoff: TransportPointRef | null } {
  const pickup = details.pickupLocation
    ? { type: "ref" as const, id: details.pickupLocation }
    : null;

  let dropoff = details.dropoffLocation
    ? { type: "ref" as const, id: details.dropoffLocation }
    : null;

  if (dropoff?.id === "same-pickup") {
    dropoff = pickup;
  }

  return { pickup, dropoff };
}

export function isTransportConfigComplete(details: ReservationAddonDetails): boolean {
  const { pickup, dropoff } = resolveTransportEndpoints(details);
  return Boolean(pickup?.id && dropoff?.id);
}

export function getTransportPerPersonPrice(
  quote: TransportQuoteResult | null | undefined,
  fallbackPrice: number,
): number {
  if (quote?.perPerson && Number.isFinite(quote.perPerson)) {
    return quote.perPerson;
  }
  return fallbackPrice;
}
