// app/api/paypal/create-order/route.ts

import { NextResponse } from "next/server";
import {
  getPayPalApiBaseUrl,
  getPayPalAccessToken,
} from "@/lib/helpers/paypal";

import { getDb } from "@/lib/helpers/mongodb";
import { PAYPAL_CURRENCY, PAYPAL_CUSTOM_ID_MAX_LENGTH } from "@/lib/constants/paypal";
import { COLLECTIONS } from "@/lib/constants/db";
import { randomUUID } from "node:crypto";
import { acquireCapacityHold, releaseCapacityHold } from "@/lib/reservation/capacity-holds";
import { getRemainingCapacityForTourDate } from "@/lib/reservation/capacity";

import {
  getMinBookableIsoDateInCostaRica,
  isDateOnOrAfterMinBookableInCostaRica,
} from "@/lib/helpers/costa-rica-time";

import type { ReservationAddonDetails } from "@/lib/reservation/types";
import { normalizeReservationDate } from "@/lib/reservation/dates";
import {
  isReservationQuoteError,
  quoteReservation,
  requiredReservationFieldsPresent,
} from "@/lib/reservation/quote";

interface CreateOrderRequest {
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
  addons?: string[];
  addonIds?: string[];
  addonDetails?: ReservationAddonDetails;
  specialRequests?: string;
  language?: string;
  countryCode?: string;
}

interface CreateOrderResponse {
  id?: string;
  links?: Array<{ rel?: string; href?: string }>;
}

export async function POST(req: Request) {
  let acquiredHold: { id: string; tourSlug?: string; date: string } | null = null;
  try {
    const body: CreateOrderRequest = await req.json();

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
      countryCode,
      bookingAttemptId,
    } = body;

    // Basic validation
    if (!requiredReservationFieldsPresent({ name, email, phone, tickets, date, tourPackage })) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Normalize and validate date
    const normalizedDate = normalizeReservationDate(date, dateIso);
    if (!normalizedDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid reservation date format",
          selectedDate: String(date),
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const db = await getDb();
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
      bookingAttemptId,
    });

    const {
      safeTickets,
      selectedPackage,
      packageLabel,
      packagePrice,
      addonsPricePerPerson,
      addonsPrice,
      addonsBreakdown,
      transportQuote,
      totalWithTax,
      formattedTotal,
      ivaRatePercent,
    } = quote;

    const clientTotal = total != null ? Number(total) : null;
    if (clientTotal != null && Number.isFinite(clientTotal) && Math.abs(clientTotal - totalWithTax) >= 0.02) {
      return NextResponse.json(
        {
          success: false,
          message: language === "en"
            ? "The booking total changed. Please refresh checkout and try again."
            : "El total de la reserva cambió. Actualizá el checkout e intentá de nuevo.",
          code: "total_mismatch",
          serverTotal: totalWithTax,
          formattedTotal,
          clientTotal,
        },
        { status: 409 },
      );
    }

    const holdId = isValidBookingAttemptId(bookingAttemptId) ? bookingAttemptId : randomUUID();
    const remainingConfirmedCapacity = await getRemainingCapacityForTourDate({
      db,
      tourSlug,
      date: normalizedDate,
      includeHolds: false,
    });
    const holdAcquired = await acquireCapacityHold({
      db,
      holdId,
      tourSlug,
      date: normalizedDate,
      tickets: safeTickets,
      remainingConfirmedCapacity,
    });
    if (!holdAcquired) {
      return NextResponse.json(
        {
          success: false,
          code: "capacity",
          message: language === "en"
            ? "Those spots were just taken. Please choose another date or fewer guests."
            : "Esos cupos se acaban de ocupar. Elegí otra fecha o menos personas.",
        },
        { status: 409 },
      );
    }
    acquiredHold = { id: holdId, tourSlug, date: normalizedDate };

    // Custom ID (PayPal limit = 127 chars)
    const custom_id = createCustomId({
      tickets: safeTickets,
      time: tourTime ?? null,
      pkg: packageLabel,
      packageId: selectedPackage.id ?? null,
      ppUSD: packagePrice,
      ...(Array.isArray(addonIds) && addonIds.length > 0
        ? { add: addonIds, addUSD: addonsPricePerPerson }
        : {}),
      tourSlug: tourSlug ?? null,
      tourName: tourName ?? null,
      date: normalizedDate,
      lang: language === "en" ? "en" : "es",
    });

    const payer = createPayPalPayer({ name, email, phone, countryCode });
    const accessToken = await getPayPalAccessToken();

    const res = await fetch(`${getPayPalApiBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Prefer: "return=representation",
        ...(isValidBookingAttemptId(bookingAttemptId)
          ? { "PayPal-Request-Id": bookingAttemptId }
          : {}),
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        payer,
        purchase_units: [
          {
            amount: {
              currency_code: PAYPAL_CURRENCY,
              value: formattedTotal,
            },
            description: `Reserva: ${safeTickets} pax - ${tourName ?? packageLabel}${tourTime ? ` (${tourTime})` : ""} - ${normalizedDate}`,
            custom_id,
          },
        ],
      }),
    });

    const data: CreateOrderResponse = await res.json();

    if (!res.ok || !data.id) {
      await releaseCapacityHold({ db, holdId, tourSlug, date: normalizedDate });
      acquiredHold = null;
      console.error("PayPal Create Order Error:", { status: res.status, data });
      return NextResponse.json(
        { success: false, message: "Failed to create PayPal order", error: data },
        { status: res.status || 500 }
      );
    }

    // Save context in database
    const contextSaved = await saveOrderContext(data.id, {
      bookingAttemptId: holdId,
      name,
      email,
      phone,
      tickets: safeTickets,
      date: normalizedDate,
      tourTime,
      packageId: selectedPackage.id,
      tourPackage: packageLabel,
      packagePrice,
      addons: Array.isArray(addons) ? addons : [],
      addonIds: Array.isArray(addonIds) ? addonIds : [],
      addonDetails: addonDetails ?? {},
      specialRequests: typeof specialRequests === "string" ? specialRequests : "",
      addonsPrice,
      addonsBreakdown,
      transportQuote: transportQuote ?? null,
      tourSlug,
      tourName,
      clientTotal: total ? Number(total) : null,
      total: totalWithTax,
      ivaRate: ivaRatePercent,
      language: quote.language,
    });
    if (!contextSaved) {
      await releaseCapacityHold({ db, holdId, tourSlug, date: normalizedDate });
      acquiredHold = null;
      return NextResponse.json(
        { success: false, message: "Order created but booking context could not be saved" },
        { status: 503 },
      );
    }

    const approvalUrl = data.links?.find((link) => link.rel === "approve")?.href;

    if (!approvalUrl) {
      await releaseCapacityHold({ db, holdId, tourSlug, date: normalizedDate });
      acquiredHold = null;
      console.error("No approval URL returned from PayPal", data);
      return NextResponse.json(
        { success: false, message: "Order created but no approval URL", orderID: data.id },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderID: data.id,
      approvalUrl,
      totalWithTax,
      formattedTotal,
      addonsBreakdown,
    });
  } catch (error: unknown) {
    if (acquiredHold) {
      try {
        const db = await getDb();
        await releaseCapacityHold({
          db,
          holdId: acquiredHold.id,
          tourSlug: acquiredHold.tourSlug,
          date: acquiredHold.date,
        });
      } catch (releaseError) {
        console.error("Failed to release PayPal capacity hold:", releaseError);
      }
    }
    if (isReservationQuoteError(error)) {
      return NextResponse.json(
        { success: false, message: error.message, code: error.code, ...error.details },
        { status: error.status }
      );
    }

    console.error("Create Order Route Error:", error);

    const message = error instanceof Error ? error.message : "Unknown internal error";

    return NextResponse.json(
      { success: false, message: "Internal server error", error: message },
      { status: 500 }
    );
  }
}

function isValidBookingAttemptId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value);
}

// ====================== Helper Functions ======================

function createCustomId(data: Record<string, any>): string {
  const payload = JSON.stringify(data);
  if (payload.length <= PAYPAL_CUSTOM_ID_MAX_LENGTH) return payload;

  // Fallback - shorter version
  return JSON.stringify({
    tickets: data.tickets,
    time: data.time,
    pkg: data.packageId ?? data.pkg,
    date: data.date,
    lang: data.lang,
  });
}

function normalizeCountryCode(countryCode: unknown): string {
  const normalizedCountryCode = String(countryCode ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalizedCountryCode) ? normalizedCountryCode : "CR";
}

function createPayPalPayer({
  name,
  email,
  phone,
  countryCode,
}: {
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
}) {
  const trimmedName = String(name ?? "").trim().replace(/\s+/g, " ");
  const nameParts = trimmedName.split(" ").filter(Boolean);
  const givenName = nameParts[0] ?? undefined;
  const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;
  const nationalPhone = String(phone ?? "").replace(/^\+\d{1,3}\s*/, "").replace(/\D/g, "");
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  return {
    email_address: String(email ?? "").trim(),
    address: {
      country_code: normalizedCountryCode,
    },
    ...(givenName && surname
      ? {
          name: {
            given_name: givenName,
            surname,
          },
        }
      : {}),
    ...(nationalPhone
      ? {
          phone: {
            phone_type: "MOBILE",
            phone_number: {
              national_number: nationalPhone,
            },
          },
        }
      : {}),
  };
}

async function saveOrderContext(orderId: string, bookingData: any) {
  try {
    const db = await getDb();
    await db.collection(COLLECTIONS.PAYPAL_ORDER_CONTEXTS).updateOne(
      { orderId },
      {
        $set: {
          orderId,
          customer: {
            name: bookingData.name,
            email: bookingData.email,
            phone: bookingData.phone,
          },
          booking: bookingData,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.error("Failed to save PayPal order context:", err);
    return false;
  }
}
