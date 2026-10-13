import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import {
  isReservationQuoteError,
  quoteReservation,
  requiredReservationFieldsPresent,
} from "@/lib/reservation/quote";
import type { ReservationAddonDetails } from "@/lib/reservation/types";

type QuoteRequest = {
  name?: string;
  email?: string;
  phone?: string;
  tickets?: number | string;
  total?: number | string;
  date?: string;
  dateIso?: string;
  tourTime?: string;
  packageId?: string;
  tourPackage?: string;
  tourSlug?: string;
  tourName?: string;
  addons?: string[];
  addonIds?: string[];
  addonDetails?: ReservationAddonDetails;
  specialRequests?: string;
  language?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as QuoteRequest;

    if (!requiredReservationFieldsPresent(body)) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const quote = await quoteReservation(db, body);
    const clientTotal = body.total != null ? Number(body.total) : null;
    const totalMatchesClient = clientTotal == null
      || Number.isFinite(clientTotal) && Math.abs(clientTotal - quote.totalWithTax) < 0.02;

    return NextResponse.json({
      success: true,
      totalWithTax: quote.totalWithTax,
      formattedTotal: quote.formattedTotal,
      subtotal: quote.subtotal,
      packagePrice: quote.packagePrice,
      addonsPricePerPerson: quote.addonsPricePerPerson,
      addonsPrice: quote.addonsPrice,
      addonsBreakdown: quote.addonsBreakdown,
      transportQuote: quote.transportQuote,
      ivaRatePercent: quote.ivaRatePercent,
      totalMatchesClient,
      clientTotal,
    });
  } catch (error: unknown) {
    if (isReservationQuoteError(error)) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code, ...error.details },
        { status: error.status },
      );
    }

    console.error("POST /api/reservation/quote error:", error);
    const message = error instanceof Error ? error.message : "Unknown internal error";
    return NextResponse.json(
      { success: false, message: "Internal server error", error: message },
      { status: 500 },
    );
  }
}