import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getOperatorFromRequest } from "@/lib/b2b-auth";
import { createBooking, createBookings, findBookingsByOperator } from "@/lib/models/booking";
import { sendBookingConfirmationEmail } from "@/lib/email/b2b-emails";
import { getB2BCatalog } from "@/lib/b2b-catalog";
import { isDateOnOrAfterMinBookableInCostaRica } from "@/lib/helpers/costa-rica-time";
import { getPackageSchedule, isPackageAvailableOnDate } from "@/lib/tour-packages";

type BookingPayload = {
  tourId: string;
  packageId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pax: number;
  date: string;
  notes?: string;
};

function isValidBookingPayload(payload: Partial<BookingPayload>) {
  return Boolean(
    payload.tourId &&
      payload.packageId &&
      payload.clientName &&
      payload.clientEmail &&
      payload.clientPhone &&
      payload.pax &&
      payload.date
  );
}

export async function GET(req: NextRequest) {
  const operator = getOperatorFromRequest(req);
  if (!operator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  let bookings = await findBookingsByOperator(operator.id);

  if (statusFilter && statusFilter !== "all") {
    bookings = bookings.filter((b) => b.status === statusFilter);
  }

  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const operator = getOperatorFromRequest(req);
  if (!operator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payloads: BookingPayload[] = Array.isArray(body?.bookings)
      ? body.bookings
      : [body as BookingPayload];

    if (payloads.length === 0) {
      return NextResponse.json({ error: "At least one booking is required." }, { status: 400 });
    }

    if (!payloads.every((payload) => isValidBookingPayload(payload))) {
      return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
    }

    if (!payloads.every((payload) => isDateOnOrAfterMinBookableInCostaRica(String(payload.date)))) {
      return NextResponse.json(
        { error: "Booking date must be at least the next available day in Costa Rica time." },
        { status: 400 }
      );
    }

    const { tours, ivaRate } = await getB2BCatalog();
    const byTourId = new Map(tours.map((tour) => [tour.id, tour]));

    const bookingDocs = payloads.map((payload) => {
      const tour = byTourId.get(payload.tourId);
      if (!tour) {
        throw new Error(`TOUR_NOT_FOUND:${payload.tourId}`);
      }

      const selectedPackage = tour.packages.find((pkg) => pkg.id === payload.packageId);
      if (!selectedPackage) {
        throw new Error(`PACKAGE_NOT_FOUND:${payload.packageId}`);
      }

      if (!isPackageAvailableOnDate(selectedPackage, String(payload.date))) {
        throw new Error(`PACKAGE_DATE_UNAVAILABLE:${getPackageSchedule(selectedPackage)}`);
      }

      if (payload.pax < tour.minPax || payload.pax > tour.maxPax) {
        throw new Error(`INVALID_PAX:${tour.minPax}:${tour.maxPax}`);
      }

      const subtotal = selectedPackage.priceCRC * Number(payload.pax);
      const ivaAmount = Math.round(subtotal * (ivaRate / 100));
      const totalPrice = subtotal + ivaAmount;
      const commissionAmount = Math.round(totalPrice * (operator.commissionRate / 100));

      return {
        operatorId: new ObjectId(operator.id),
        tourId: payload.tourId,
        tourName: `${tour.name} (${selectedPackage.name})`,
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        clientPhone: payload.clientPhone,
        pax: Number(payload.pax),
        date: new Date(payload.date),
        totalPrice,
        commissionAmount,
        status: "pending" as const,
        notes: payload.notes || "",
        createdAt: new Date(),
      };
    });

    const bookingCurrencies = payloads.map((payload) => byTourId.get(payload.tourId)?.currency ?? "CRC");

    if (bookingDocs.length === 1) {
      const [doc] = bookingDocs;
      const result = await createBooking(doc);
      const bookingId = result.insertedId.toString();

      sendBookingConfirmationEmail({
        operatorEmail: operator.email,
        operatorName: operator.name,
        bookingId,
        tourName: doc.tourName,
        clientName: doc.clientName,
        clientEmail: doc.clientEmail,
        pax: doc.pax,
        date: doc.date.toLocaleDateString("es-CR"),
        totalPrice: doc.totalPrice,
        commissionAmount: doc.commissionAmount,
        currency: bookingCurrencies[0],
      }).catch(console.error);

      return NextResponse.json(
        { message: "Booking created successfully.", bookingId },
        { status: 201 }
      );
    }

    const result = await createBookings(bookingDocs);
    const bookingIds = Object.values(result.insertedIds).map((id) => id.toString());

    bookingDocs.forEach((doc, index) => {
      sendBookingConfirmationEmail({
        operatorEmail: operator.email,
        operatorName: operator.name,
        bookingId: bookingIds[index],
        tourName: doc.tourName,
        clientName: doc.clientName,
        clientEmail: doc.clientEmail,
        pax: doc.pax,
        date: doc.date.toLocaleDateString("es-CR"),
        totalPrice: doc.totalPrice,
        commissionAmount: doc.commissionAmount,
        currency: bookingCurrencies[index],
      }).catch(console.error);
    });

    return NextResponse.json(
      { message: "Bookings created successfully.", bookingIds },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message.startsWith("TOUR_NOT_FOUND:")) {
      return NextResponse.json({ error: "Tour not found." }, { status: 404 });
    }

    if (message.startsWith("PACKAGE_NOT_FOUND:")) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    if (message.startsWith("INVALID_PAX:")) {
      const [, minPax, maxPax] = message.split(":");
      return NextResponse.json(
        { error: `Pax must be between ${minPax} and ${maxPax}.` },
        { status: 400 }
      );
    }

    if (message.startsWith("PACKAGE_DATE_UNAVAILABLE:")) {
      const [, schedule] = message.split(":");
      const error = schedule === "weekday"
        ? "This package is only available on weekdays."
        : "This package is only available on weekends.";

      return NextResponse.json({ error }, { status: 400 });
    }

    console.error("B2B booking create error:", err);
    return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
  }
}
