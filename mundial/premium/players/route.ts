import { NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { COLLECTIONS } from "@/lib/constants/db";

type PremiumPlayerDoc = {
  playerKey?: string;
};

export async function GET() {
  try {
    const db = await getDb();
    const players = await db
      .collection<PremiumPlayerDoc>(COLLECTIONS.MUNDIAL_PREMIUM)
      .find({}, { projection: { _id: 0, playerKey: 1 } })
      .toArray();

    const keys = new Set(["ALLAN"]);
    for (const player of players) {
      const key = player.playerKey?.trim().toUpperCase();
      if (key) keys.add(key);
    }

    return NextResponse.json({ players: Array.from(keys) });
  } catch {
    return NextResponse.json({ players: ["ALLAN"] });
  }
}
