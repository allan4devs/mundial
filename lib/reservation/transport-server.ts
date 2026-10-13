import { calculateTransportCost, resolvePoint } from "@/lib/transport/calc";
import type { ReservationAddonDetails } from "./types";
import {
  resolveTransportEndpoints,
  type TransportPointRef,
  type TransportQuoteResult,
} from "./transport";

export async function quoteTransportAddon(
  details: ReservationAddonDetails,
  pax: number,
): Promise<TransportQuoteResult | null> {
  const { pickup, dropoff } = resolveTransportEndpoints(details);
  if (!pickup?.id || !dropoff?.id) return null;

  async function toCoords(ref: TransportPointRef | null) {
    if (!ref?.id) return null;
    const resolved = await resolvePoint({ type: "ref", id: ref.id });
    if (!resolved) return null;
    return { lat: resolved.lat, lng: resolved.lng };
  }

  const pickupCoords = await toCoords(pickup);
  const dropoffCoords = await toCoords(dropoff);
  if (!pickupCoords || !dropoffCoords) return null;

  const transportType = details.transportType === "shared" ? "shared" : "private";
  return calculateTransportCost({
    pickupCoords,
    dropoffCoords,
    transportType,
    pax: Math.max(1, pax),
    pickupRefId: pickup.id,
    dropoffRefId: dropoff.id,
  }) as TransportQuoteResult;
}
