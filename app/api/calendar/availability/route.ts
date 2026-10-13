import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { CONFIRMED_RESERVATION_STATUSES, DEFAULT_AVAILABILITY } from "@/lib/constants/business";
import { normalizeReservationDate } from "@/lib/reservation/dates";
import { getActiveHeldTicketsForMonth } from "@/lib/reservation/capacity-holds";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const tourSlug = searchParams.get("tourSlug")?.trim();

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json({ message: "Invalid year/month." }, { status: 400 });
  }

  const db = await getDb();
  const reservationQuery: Record<string, unknown> = {
    status: {
      $in: [...CONFIRMED_RESERVATION_STATUSES],
    },
  };

  if (tourSlug) {
    reservationQuery.tourSlug = tourSlug;
  }

  const docs = await db
    .collection(COLLECTIONS.RESERVATIONS)
    .find(
      reservationQuery,
      { projection: { date: 1, tickets: 1, tourSlug: 1 } }
    )
    .toArray();
  const heldByDay = await getActiveHeldTicketsForMonth({
    db,
    tourSlug: tourSlug ?? undefined,
    year,
    month,
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const bookedByDay: Record<number, number> = {};

  for (const doc of docs) {
    const normalizedDate = normalizeReservationDate(doc.date);
    if (!normalizedDate) continue;
    const [docYear, docMonth, docDay] = normalizedDate.split("-").map(Number);
    if (docYear !== year || docMonth !== month + 1) continue;

    const day = docDay;
    const tickets = typeof doc.tickets === "number" ? doc.tickets : Number(doc.tickets ?? 0);
    if (!Number.isFinite(tickets) || tickets <= 0) continue;

    bookedByDay[day] = (bookedByDay[day] ?? 0) + tickets;
  }

  const availability: Record<number, number> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const capacity = isWeekend ? DEFAULT_AVAILABILITY.WEEKEND : DEFAULT_AVAILABILITY.WEEKDAY;
    const reserved = bookedByDay[day] ?? 0;
    availability[day] = Math.max(0, capacity - reserved - (heldByDay[day] ?? 0));
  }

  return NextResponse.json({ availability, bookedByDay, heldByDay, tourSlug: tourSlug ?? null });
}
