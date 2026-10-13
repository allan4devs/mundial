import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

type ManualReservationPayload = {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  tickets?: number;
  tourName?: string;
  tourPackage?: string;
  tourTime?: string;
  amount?: number | null;
  currency?: string;
  notes?: string;
  paymentMethod?: "cash" | "bank_transfer" | "unpaid";
};

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as ManualReservationPayload;

    const requiredFields = [body.name, body.email, body.phone, body.date, body.tourName, body.tickets];
    if (requiredFields.some((value) => value == null || String(value).trim() === "")) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!body.tickets || Number(body.tickets) <= 0) {
      return NextResponse.json({ error: "Tickets must be greater than zero." }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection(COLLECTIONS.RESERVATIONS).insertOne({
      orderId: null,
      captureId: null,
      userId: null,
      userEmail: null,
      name: body.name?.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      date: body.date,
      tickets: Number(body.tickets),
      amount: typeof body.amount === "number" ? Number(body.amount) : null,
      currency: body.currency?.trim() || "CRC",
      status: "manual_pending_payment",
      paymentStatus: "not_paid",
      paymentMethod: body.paymentMethod || "unpaid",
      source: "admin_b2b_manual",
      notes: body.notes?.trim() || "",
      tourName: body.tourName?.trim(),
      tourPackage: body.tourPackage?.trim() || null,
      tourTime: body.tourTime?.trim() || null,
      createdAt: new Date(),
      createdByAdmin: admin.username,
    });

    return NextResponse.json(
      { message: "Manual reservation created.", reservationId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual reservation create error:", error);
    return NextResponse.json({ error: "Failed to create manual reservation." }, { status: 500 });
  }
}
