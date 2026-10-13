import { NextRequest, NextResponse } from "next/server";
import { requirePokerIdentity } from "@/lib/poker/identity";
import { standFromPokerTable } from "@/lib/poker/store";

export async function POST(request: NextRequest) {
  try {
    const identity = await requirePokerIdentity();
    if (!identity) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const result = await standFromPokerTable(identity.userId, typeof body.actionId === "string" ? body.actionId : crypto.randomUUID());
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    console.error("Failed to stand poker player", error);
    return NextResponse.json({ ok: false, error: "stand_failed" }, { status: 500 });
  }
}
