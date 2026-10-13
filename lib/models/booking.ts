import { ObjectId } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

export interface OperatorBooking {
  _id?: ObjectId;
  operatorId: ObjectId;
  tourId: string;
  tourName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  pax: number;
  date: Date;
  totalPrice: number;
  commissionAmount: number;
  status: "pending" | "confirmed" | "cancelled";
  notes: string;
  createdAt: Date;
}

export async function getBookingsCollection() {
  const db = await getDb();
  return db.collection<OperatorBooking>(COLLECTIONS.OPERATOR_BOOKINGS);
}

export async function createBooking(data: Omit<OperatorBooking, "_id">) {
  const col = await getBookingsCollection();
  const result = await col.insertOne(data);
  return result;
}

export async function createBookings(data: Omit<OperatorBooking, "_id">[]) {
  const col = await getBookingsCollection();
  const result = await col.insertMany(data);
  return result;
}

export async function findBookingsByOperator(operatorId: string) {
  const col = await getBookingsCollection();
  return col
    .find({ operatorId: new ObjectId(operatorId) })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getBookingStats(operatorId: string) {
  const col = await getBookingsCollection();
  const oid = new ObjectId(operatorId);

  const [total, pending, confirmed, commissionData] = await Promise.all([
    col.countDocuments({ operatorId: oid }),
    col.countDocuments({ operatorId: oid, status: "pending" }),
    col.countDocuments({ operatorId: oid, status: "confirmed" }),
    col
      .aggregate([
        { $match: { operatorId: oid, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
      ])
      .toArray(),
  ]);

  const totalCommission = commissionData[0]?.total ?? 0;
  return { total, pending, confirmed, totalCommission };
}
