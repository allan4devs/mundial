import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import {
  getMinBookableIsoDateInCostaRica,
  isDateOnOrAfterMinBookableInCostaRica,
} from "@/lib/helpers/costa-rica-time";
import { buildReservationReferenceCode } from "@/lib/reservation/checkout-messages";
import { normalizeReservationDate } from "@/lib/reservation/dates";
import {
  isReservationQuoteError,
  quoteReservation,
  requiredReservationFieldsPresent,
} from "@/lib/reservation/quote";
import type { ReservationAddonDetails } from "@/lib/reservation/types";

type PendingPaymentMethod = "whatsapp" | "sinpe";

type PendingReservationDocument = {
  _id?: string;
  referenceCode?: string;
  [key: string]: unknown;
};

interface PendingBookingRequest {
  bookingAttemptId?: string;
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
  packagePrice?: number | string;
  addons?: string[];
  addonIds?: string[];
  addonDetails?: ReservationAddonDetails;
  specialRequests?: string;
  language?: string;
  paymentMethod?: PendingPaymentMethod;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PendingBookingRequest;

    const {
      name,
      email,
      phone,
      tickets,
      total,
      date,
      dateIso,
      tourTime,
      packageId,
      tourPackage,
      tourSlug,
      tourName,
      addons,
      addonIds,
      addonDetails,
      specialRequests,
      language = "es",
      paymentMethod = "whatsapp",
      bookingAttemptId,
    } = body;

    if (!requiredReservationFieldsPresent({ name, email, phone, tickets, date, tourPackage, tourName }, { requireTourName: true })) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const normalizedDate = normalizeReservationDate(date, dateIso);
    if (!normalizedDate) {
      return NextResponse.json(
        { success: false, message: "Invalid reservation date format" },
        { status: 400 },
      );
    }

    if (!isDateOnOrAfterMinBookableInCostaRica(normalizedDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected date is no longer available. Please choose the next available day.",
          minBookableDate: getMinBookableIsoDateInCostaRica(),
          selectedDate: normalizedDate,
        },
        { status: 400 },
      );
    }

    const safePaymentMethod: PendingPaymentMethod =
      paymentMethod === "sinpe" ? "sinpe" : "whatsapp";

    const db = await getDb();
    const safeAttemptId = typeof bookingAttemptId === "string" && /^[a-f0-9-]{36}$/i.test(bookingAttemptId)
      ? bookingAttemptId
      : null;
    const pendingId = safeAttemptId ? `pending:${safeAttemptId}` : null;
    const reservations = db.collection<PendingReservationDocument>(COLLECTIONS.RESERVATIONS);

    if (pendingId) {
      const existing = await reservations.findOne({ _id: pendingId });
      if (existing?.referenceCode) {
        return NextResponse.json({
          success: true,
          reservationId: pendingId,
          referenceCode: String(existing.referenceCode),
          reused: true,
        });
      }
    }

    const referenceCode = buildReservationReferenceCode(
      safeAttemptId ?? `${email}-${normalizedDate}-${tourSlug ?? tourName}-${Date.now()}`,
    );

    const quote = await quoteReservation(db, {
      name,
      email,
      phone,
      tickets,
      date,
      dateIso,
      tourTime,
      packageId,
      tourPackage,
      tourSlug,
      tourName,
      addons,
      addonIds,
      addonDetails,
      specialRequests,
      language,
    });

    const reservationDocument = {
      ...(pendingId ? { _id: pendingId } : {}),
      orderId: null,
      captureId: null,
      referenceCode,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      date: normalizedDate,
      tickets: quote.safeTickets,
      amount: quote.totalWithTax,
      currency: "USD",
      status: "pending_payment",
      paymentStatus: "not_paid",
      paymentMethod: safePaymentMethod,
      source: "web_checkout",
      tourTime: tourTime?.trim() || null,
      tourPackage: quote.packageLabel,
      tourSlug: tourSlug?.trim() || null,
      tourName: String(tourName).trim(),
      packageId: quote.selectedPackage.id ?? packageId?.trim() ?? null,
      packagePrice: quote.packagePrice,
      addons: Array.isArray(addons) ? addons : [],
      addonIds: Array.isArray(addonIds) ? addonIds : [],
      addonDetails: addonDetails ?? {},
      specialRequests: typeof specialRequests === "string" ? specialRequests.trim() : "",
      clientTotal: total ? Number(total) : null,
      addonsPrice: quote.addonsPrice,
      addonsBreakdown: quote.addonsBreakdown,
      transportQuote: quote.transportQuote,
      ivaRate: quote.ivaRatePercent,
      language: quote.language,
      createdAt: new Date(),
    };

    let reservationId: string;
    try {
      const result = await reservations.insertOne(reservationDocument);
      reservationId = result.insertedId.toString();
    } catch (error) {
      const mongoError = error as { code?: number };
      if (!pendingId || mongoError.code !== 11000) throw error;

      const existing = await reservations.findOne({ _id: pendingId });
      if (!existing?.referenceCode) throw error;
      reservationId = pendingId;
    }

    return NextResponse.json({
      success: true,
      reservationId,
      referenceCode,
    });
  } catch (error: unknown) {
    if (isReservationQuoteError(error)) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code, ...error.details },
        { status: error.status },
      );
    }

    console.error("Pending booking route error:", error);
    const message = error instanceof Error ? error.message : "Unknown internal error";
    return NextResponse.json(
      { success: false, message: "Internal server error", error: message },
      { status: 500 },
    );
  }
}
