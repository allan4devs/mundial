import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const playerKey = searchParams.get("name")?.trim().toUpperCase();

  if (!playerKey) {
    return NextResponse.json({ bets: [] });
  }

  try {
    const db = await getDb();
    const bets = await db
      .collection(COLLECTIONS.MUNDIAL_PREMIUM_PREDICTIONS)
      .find({ playerKey }, { projection: { _id: 0, betId: 1, betTitle: 1, pick: 1, amountPaid: 1, paidAt: 1, resolved: 1, result: 1 } })
      .toArray();

    return NextResponse.json({ bets });
  } catch {
    return NextResponse.json({ bets: [] });
  }
}
