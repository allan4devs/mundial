import type { Db } from "mongodb";
import { COLLECTIONS } from "@/lib/constants/db";
import { CONFIRMED_RESERVATION_STATUSES, DEFAULT_AVAILABILITY } from "@/lib/constants/business";
import { isWeekendIsoDate, normalizeReservationDate } from "./dates";
import { getActiveHeldTickets } from "./capacity-holds";

export async function getRemainingCapacityForTourDate({
  db,
  tourSlug,
  date,
  excludeHoldId,
  includeHolds = true,
}: {
  db: Db;
  tourSlug?: string;
  date: string;
  excludeHoldId?: string;
  includeHolds?: boolean;
}): Promise<number> {
  const capacity = isWeekendIsoDate(date)
    ? DEFAULT_AVAILABILITY.WEEKEND
    : DEFAULT_AVAILABILITY.WEEKDAY;

  const query: Record<string, unknown> = {
    status: {
      $in: [...CONFIRMED_RESERVATION_STATUSES],
    },
  };

  if (tourSlug?.trim()) {
    query.tourSlug = tourSlug.trim();
  }

  const existingReservations = await db
    .collection(COLLECTIONS.RESERVATIONS)
    .find(query, { projection: { date: 1, tickets: 1 } })
    .toArray();

  const reserved = existingReservations.reduce((sum, doc) => {
    if (normalizeReservationDate(doc.date) !== date) return sum;
    const tickets = typeof doc.tickets === "number" ? doc.tickets : Number(doc.tickets ?? 0);
    return Number.isFinite(tickets) && tickets > 0 ? sum + tickets : sum;
  }, 0);

  const held = includeHolds
    ? await getActiveHeldTickets({ db, tourSlug, date, excludeHoldId })
    : 0;

  return Math.max(0, capacity - reserved - held);
}
