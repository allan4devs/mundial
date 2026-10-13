import { NextRequest, NextResponse } from "next/server";
import { requirePokerIdentity } from "@/lib/poker/identity";
import { sitAtPokerTable } from "@/lib/poker/store";

export async function POST(request: NextRequest) {
  try {
    const identity = await requirePokerIdentity();
    if (!identity) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const result = await sitAtPokerTable(identity.userId, identity.name, Number(body.buyIn), typeof body.actionId === "string" ? body.actionId : crypto.randomUUID());
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    console.error("Failed to seat poker player", error);
    return NextResponse.json({ ok: false, error: "seat_failed" }, { status: 500 });
  }
}
