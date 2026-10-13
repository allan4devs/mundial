import { NextRequest, NextResponse } from "next/server";
import { resolvePoint, calculateTransportCost } from "@/lib/transport/calc";

type IncomingPoint = { type: "coords" | "ref"; lat?: number; lng?: number; id?: string } | null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pickup: IncomingPoint = body.pickup ?? null;
    const dropoff: IncomingPoint = body.dropoff ?? null;
    const transportType: "private" | "shared" = body.transportType === "shared" ? "shared" : "private";
    const pax = Number(body.pax) || 1;

    if (!pickup && !dropoff) {
      return NextResponse.json({ error: "pickup or dropoff required" }, { status: 400 });
    }

    async function toCoords(p?: IncomingPoint) {
      if (!p) return null;
      if (p.type === "coords") {
        if (typeof p.lat !== "number" || typeof p.lng !== "number") return null;
        return { lat: p.lat, lng: p.lng, resolvedFrom: "coords" };
      }
      if (p.type === "ref") {
        if (!p.id) return null;
        const res = await resolvePoint({ type: "ref", id: String(p.id) });
        if (!res) return null;
        return { lat: res.lat, lng: res.lng, resolvedFrom: res.source, raw: res.raw };
      }
      return null;
    }

    const pickupCoords = await toCoords(pickup);
    const dropoffCoords = await toCoords(dropoff);

    if ((pickup && !pickupCoords) || (dropoff && !dropoffCoords)) {
      return NextResponse.json({ error: "Could not resolve one or more reference points" }, { status: 400 });
    }

    const result = calculateTransportCost({
      pickupCoords,
      dropoffCoords,
      transportType,
      pax,
      pickupRefId: pickup?.type === "ref" ? pickup.id ?? null : null,
      dropoffRefId: dropoff?.type === "ref" ? dropoff.id ?? null : null,
    });

    return NextResponse.json({ ok: true, result, pickup: pickupCoords, dropoff: dropoffCoords });
  } catch (err) {
    console.error("POST /api/transport/calc error:", err);
    return NextResponse.json({ error: "Failed to calculate transport" }, { status: 500 });
  }
}
