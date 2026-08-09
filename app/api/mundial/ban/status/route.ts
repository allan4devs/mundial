// app/api/mundial/ban/status/route.ts
// GET ?playerName=...&visitorId=... — returns { banned: bool, reason?: string }
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { isBanned } from "@/lib/mundial/bans";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const playerName = (req.nextUrl.searchParams.get("playerName") ?? "").trim().toUpperCase();
    const visitorId = (req.nextUrl.searchParams.get("visitorId") ?? "").trim();

    if (!playerName && !visitorId) {
      return NextResponse.json({ banned: false });
    }

    const db = await getDb();
    const ban = await isBanned(db, playerName || null, visitorId || null);

    if (!ban) return NextResponse.json({ banned: false });

    return NextResponse.json({
      banned: true,
      reason: ban.reason,
      playerName: ban.playerName,
      bannedAt: ban.bannedAt,
    });
  } catch (err) {
    console.error("[ban/status] GET error", err);
    return NextResponse.json({ banned: false });
  }
}
