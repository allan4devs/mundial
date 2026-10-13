import type { Db } from "mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

const DEFAULT_HOLD_TTL_MS = 15 * 60 * 1000;

type CapacityHold = {
  id: string;
  tickets: number;
  expiresAt: Date;
};

type CapacityHoldDocument = {
  _id: string;
  tourSlug: string | null;
  date: string;
  holds: CapacityHold[];
  heldTickets: number;
  createdAt: Date;
  updatedAt?: Date;
};

function capacityHoldsCollection(db: Db) {
  return db.collection<CapacityHoldDocument>(COLLECTIONS.RESERVATION_CAPACITY_HOLDS);
}

function holdDocumentId(tourSlug: string | undefined, date: string) {
  return `${tourSlug?.trim() || "all-tours"}:${date}`;
}

async function removeExpiredHolds(db: Db, documentId: string, now = new Date()) {
  await capacityHoldsCollection(db).updateOne(
    { _id: documentId },
    [
      {
        $set: {
          holds: {
            $filter: {
              input: { $ifNull: ["$holds", []] },
              as: "hold",
              cond: { $gt: ["$$hold.expiresAt", now] },
            },
          },
        },
      },
      { $set: { heldTickets: { $sum: "$holds.tickets" }, updatedAt: now } },
    ],
  );
}

export async function acquireCapacityHold({
  db,
  holdId,
  tourSlug,
  date,
  tickets,
  remainingConfirmedCapacity,
  ttlMs = DEFAULT_HOLD_TTL_MS,
}: {
  db: Db;
  holdId: string;
  tourSlug?: string;
  date: string;
  tickets: number;
  remainingConfirmedCapacity: number;
  ttlMs?: number;
}) {
  const documentId = holdDocumentId(tourSlug, date);
  const collection = capacityHoldsCollection(db);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  await collection.updateOne(
    { _id: documentId },
    {
      $setOnInsert: {
        tourSlug: tourSlug?.trim() || null,
        date,
        holds: [],
        heldTickets: 0,
        createdAt: now,
      },
    },
    { upsert: true },
  );
  await removeExpiredHolds(db, documentId, now);

  const maximumHeldBeforeInsert = remainingConfirmedCapacity - tickets;
  if (maximumHeldBeforeInsert < 0) return false;

  const result = await collection.updateOne(
    {
      _id: documentId,
      heldTickets: { $lte: maximumHeldBeforeInsert },
      "holds.id": { $ne: holdId },
    },
    {
      $inc: { heldTickets: tickets },
      $push: { holds: { id: holdId, tickets, expiresAt } },
      $set: { updatedAt: now },
    },
  );

  if (result.modifiedCount === 1) return true;
  const existing = await collection.findOne(
    { _id: documentId, "holds.id": holdId },
    { projection: { _id: 1 } },
  );
  return Boolean(existing);
}

export async function releaseCapacityHold({
  db,
  holdId,
  tourSlug,
  date,
}: {
  db: Db;
  holdId: string;
  tourSlug?: string;
  date: string;
}) {
  const documentId = holdDocumentId(tourSlug, date);
  const now = new Date();
  await capacityHoldsCollection(db).updateOne(
    { _id: documentId },
    [
      {
        $set: {
          holds: {
            $filter: {
              input: { $ifNull: ["$holds", []] },
              as: "hold",
              cond: { $ne: ["$$hold.id", holdId] },
            },
          },
        },
      },
      { $set: { heldTickets: { $sum: "$holds.tickets" }, updatedAt: now } },
    ],
  );
}

export async function getActiveHeldTickets({
  db,
  tourSlug,
  date,
  excludeHoldId,
}: {
  db: Db;
  tourSlug?: string;
  date: string;
  excludeHoldId?: string;
}) {
  const document = await capacityHoldsCollection(db).findOne({
    _id: holdDocumentId(tourSlug, date),
  });
  const now = Date.now();
  const holds = Array.isArray(document?.holds) ? document.holds as CapacityHold[] : [];
  return holds.reduce((sum, hold) => {
    const expiresAt = new Date(hold.expiresAt).getTime();
    if (hold.id === excludeHoldId || expiresAt <= now) return sum;
    return sum + (Number.isFinite(hold.tickets) ? Math.max(0, hold.tickets) : 0);
  }, 0);
}

export async function getActiveHeldTicketsForMonth({
  db,
  tourSlug,
  year,
  month,
}: {
  db: Db;
  tourSlug?: string;
  year: number;
  month: number;
}) {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const documents = await capacityHoldsCollection(db).find({
    date: { $regex: `^${monthPrefix}` },
    tourSlug: tourSlug?.trim() || null,
  }).toArray();
  const now = Date.now();
  const heldByDay: Record<number, number> = {};

  for (const document of documents) {
    const day = Number(String(document.date).slice(-2));
    if (!Number.isInteger(day)) continue;
    const holds = Array.isArray(document.holds) ? document.holds as CapacityHold[] : [];
    heldByDay[day] = holds.reduce((sum, hold) => {
      if (new Date(hold.expiresAt).getTime() <= now) return sum;
      return sum + (Number.isFinite(hold.tickets) ? Math.max(0, hold.tickets) : 0);
    }, 0);
  }

  return heldByDay;
}
