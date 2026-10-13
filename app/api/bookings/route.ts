import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id ?? null;
  const userEmail = session.user.email;

  const db = await getDb();

  // Query by userId if available (most reliable), fallback to email match
  const query = userId
    ? { $or: [{ userId }, { userEmail }, { email: userEmail }] }
    : { email: userEmail };

  const docs = await db
    .collection(COLLECTIONS.RESERVATIONS)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  const bookings = docs.map((doc) => ({
    id: doc._id.toString(),
    orderId: doc.orderId ?? null,
    name: doc.name ?? null,
    email: doc.email ?? null,
    phone: doc.phone ?? null,
    date: doc.date ?? null,
    tickets: doc.tickets ?? null,
    amount: doc.amount ?? null,
    currency: doc.currency ?? null,
    status: doc.status ?? null,
    tourTime: doc.tourTime ?? null,
    tourPackage: doc.tourPackage ?? null,
    tourSlug: doc.tourSlug ?? null,
    tourName: doc.tourName ?? null,
    packagePrice: doc.packagePrice ?? null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
  }));

  return NextResponse.json({ bookings });
}
