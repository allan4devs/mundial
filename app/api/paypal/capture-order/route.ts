// app/api/paypal/capture-order/route.ts

import { NextResponse } from "next/server";
import { getPayPalApiBaseUrl, getPayPalAccessToken } from "@/lib/helpers/paypal";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import {
  isReservationQuoteError,
  quoteReservation,
  type ReservationQuoteInput,
} from "@/lib/reservation/quote";
import { releaseCapacityHold } from "@/lib/reservation/capacity-holds";

interface CaptureRequestBody {
  orderID: string;
}

interface PayPalPayer {
  name?: {
    given_name?: string;
    surname?: string;
  };
  email_address?: string;
  payer_id?: string;
}

interface PayPalCapture {
  id?: string;
  status?: string;
  amount?: { value?: string; currency_code?: string };
}

interface PayPalPurchaseUnit {
  custom_id?: string;
  payments?: {
    captures?: PayPalCapture[];
  };
}

interface PayPalCaptureResponse {
  id?: string;
  status?: string;
  payer?: PayPalPayer;
  purchase_units?: PayPalPurchaseUnit[];
}

// Helper to safely parse custom_id
function parseCustomData(customId: string | null | undefined) {
  if (!customId) return null;
  try {
    return JSON.parse(customId);
  } catch {
    return { rawCustomId: customId };
  }
}

export async function POST(req: Request) {
  try {
    const { orderID }: CaptureRequestBody = await req.json();

    if (!orderID?.trim()) {
      return NextResponse.json(
        { success: false, message: "orderID is required" },
        { status: 400 }
      );
    }

    const existingCapture = await findExistingCapture(orderID.trim());
    if (existingCapture) {
      return NextResponse.json({
        success: true,
        id: orderID.trim(),
        status: "COMPLETED",
        captureID: existingCapture,
        bookingSaved: true,
        reused: true,
      });
    }

    const captureValidation = await validateCaptureOrder(orderID.trim());
    if (!captureValidation.ok) {
      if (captureValidation.code !== "capture_validation_unavailable") {
        await releaseOrderCapacityHold(orderID.trim());
      }
      return NextResponse.json(
        {
          success: false,
          message: captureValidation.message,
          code: captureValidation.code,
          ...captureValidation.details,
        },
        { status: captureValidation.status },
      );
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${getPayPalApiBaseUrl()}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-Id": `capture-${orderID.trim()}`,
        },
        // IMPORTANT: Do NOT send body for simple capture
      }
    );

    const data: PayPalCaptureResponse = await response.json();

    if (!response.ok) {
      console.error("PayPal Capture Failed:", {
        status: response.status,
        data,
        orderID,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Failed to capture PayPal order",
          error: data,
        },
        { status: response.status || 500 }
      );
    }

    // Success response
    const purchaseUnit = data.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    const payerName =
      [data.payer?.name?.given_name, data.payer?.name?.surname]
        .filter(Boolean)
        .join(" ") || null;

    const bookingSaved = data.status === "COMPLETED" && capture?.id
      ? await saveCapturedReservation({
          orderId: data.id ?? orderID,
          captureId: capture.id,
          status: data.status,
          payerName,
          payerEmail: data.payer?.email_address ?? null,
          amount: capture.amount?.value,
          currency: capture.amount?.currency_code,
          paypalRaw: data,
        })
      : false;

    return NextResponse.json({
      success: true,
      id: data.id,
      status: data.status,
      captureID: capture?.id ?? null,
      bookingSaved,
      payer: {
        name: payerName,
        email: data.payer?.email_address ?? null,
        payerID: data.payer?.payer_id ?? null,
      },
      metadata: parseCustomData(purchaseUnit?.custom_id),
    });

  } catch (error: unknown) {
    console.error("Capture Route Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown internal error";

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

async function releaseOrderCapacityHold(orderId: string) {
  try {
    const db = await getDb();
    const context = await db.collection(COLLECTIONS.PAYPAL_ORDER_CONTEXTS).findOne({ orderId });
    const booking = context?.booking as Record<string, unknown> | undefined;
    if (
      typeof booking?.bookingAttemptId !== "string" ||
      typeof booking.date !== "string"
    ) return;

    await releaseCapacityHold({
      db,
      holdId: booking.bookingAttemptId,
      tourSlug: typeof booking.tourSlug === "string" ? booking.tourSlug : undefined,
      date: booking.date,
    });
  } catch (error) {
    console.error("Failed to release rejected PayPal capacity hold:", error);
  }
}

async function findExistingCapture(orderId: string): Promise<string | null> {
  try {
    const db = await getDb();
    const existing = await db.collection(COLLECTIONS.RESERVATIONS).findOne(
      { orderId, status: "COMPLETED" },
      { projection: { captureId: 1 } },
    );
    return typeof existing?.captureId === "string" && existing.captureId
      ? existing.captureId
      : null;
  } catch (error) {
    console.error("Failed to check existing PayPal capture:", error);
    return null;
  }
}

async function validateCaptureOrder(orderId: string): Promise<
  | { ok: true }
  | { ok: false; status: number; code: string; message: string; details?: Record<string, unknown> }
> {
  try {
    const db = await getDb();
    const context = await db.collection(COLLECTIONS.PAYPAL_ORDER_CONTEXTS).findOne({ orderId });
    const booking = context?.booking as ReservationQuoteInput & { total?: number | string } | undefined;

    if (!booking) {
      return {
        ok: false,
        status: 409,
        code: "booking_context_missing",
        message: "We couldn't verify this booking before payment. Please return to the booking page and try again.",
      };
    }

    const quote = await quoteReservation(db, booking);
    const storedTotal = Number(booking.total);
    if (!Number.isFinite(storedTotal) || Math.abs(storedTotal - quote.totalWithTax) >= 0.02) {
      return {
        ok: false,
        status: 409,
        code: "total_mismatch",
        message: "The booking total changed before payment. Please review the updated total and try again.",
        details: { serverTotal: quote.totalWithTax },
      };
    }

    return { ok: true };
  } catch (error) {
    if (isReservationQuoteError(error)) {
      return {
        ok: false,
        status: error.code === "capacity" ? 409 : error.status,
        code: error.code,
        message: error.message,
        details: error.details,
      };
    }

    console.error("Failed to validate PayPal capture:", error);
    return {
      ok: false,
      status: 503,
      code: "capture_validation_unavailable",
      message: "We couldn't verify availability before payment. Please try again in a moment.",
    };
  }
}

async function saveCapturedReservation({
  orderId,
  captureId,
  status,
  payerName,
  payerEmail,
  amount,
  currency,
  paypalRaw,
}: {
  orderId: string;
  captureId: string;
  status: string;
  payerName: string | null;
  payerEmail: string | null;
  amount?: string;
  currency?: string;
  paypalRaw: PayPalCaptureResponse;
}) {
  try {
    const db = await getDb();
    const context = await db.collection(COLLECTIONS.PAYPAL_ORDER_CONTEXTS).findOne({ orderId });
    const booking = context?.booking as Record<string, unknown> | undefined;
    const customer = context?.customer as Record<string, unknown> | undefined;

    if (!booking) {
      console.error("PayPal capture completed without booking context:", { orderId, captureId });
      return false;
    }

    const numericAmount = Number(amount ?? booking.total ?? 0);
    await db.collection(COLLECTIONS.RESERVATIONS).updateOne(
      { orderId },
      {
        $set: {
          captureId,
          status,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          orderId,
          name: customer?.name ?? payerName,
          email: customer?.email ?? payerEmail,
          phone: customer?.phone ?? null,
          date: booking.date ?? null,
          tickets: Number(booking.tickets ?? 0),
          amount: Number.isFinite(numericAmount) ? numericAmount : null,
          currency: currency ?? "USD",
          tourTime: booking.tourTime ?? null,
          tourPackage: booking.tourPackage ?? null,
          tourSlug: booking.tourSlug ?? null,
          tourName: booking.tourName ?? null,
          packagePrice: booking.packagePrice ?? null,
          addons: booking.addons ?? [],
          addonIds: booking.addonIds ?? [],
          addonDetails: booking.addonDetails ?? {},
          addonsPrice: booking.addonsPrice ?? 0,
          addonsBreakdown: booking.addonsBreakdown ?? [],
          transportQuote: booking.transportQuote ?? null,
          specialRequests: booking.specialRequests ?? "",
          ivaRate: booking.ivaRate ?? null,
          language: booking.language ?? "es",
          source: "paypal_checkout",
          paymentStatus: "paid",
          paypalRaw,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    await db.collection(COLLECTIONS.PAYPAL_ORDER_CONTEXTS).updateOne(
      { orderId },
      { $set: { status: "captured", captureId, capturedAt: new Date(), updatedAt: new Date() } },
    );
    if (
      typeof booking.bookingAttemptId === "string" &&
      typeof booking.date === "string"
    ) {
      try {
        await releaseCapacityHold({
          db,
          holdId: booking.bookingAttemptId,
          tourSlug: typeof booking.tourSlug === "string" ? booking.tourSlug : undefined,
          date: booking.date,
        });
      } catch (releaseError) {
        console.error("Failed to release captured capacity hold:", releaseError);
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to persist captured PayPal reservation:", error);
    return false;
  }
}
