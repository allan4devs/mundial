import { NextRequest, NextResponse } from "next/server";
import { requirePokerIdentity } from "@/lib/poker/identity";
import { resetPokerTable } from "@/lib/poker/store";

export async function POST(request: NextRequest) {
  const identity = await requirePokerIdentity();
  if (!identity) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    const result = await resetPokerTable(identity.userId, typeof body.actionId === "string" ? body.actionId : crypto.randomUUID());
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    console.error("Failed to reset poker table", error);
    return NextResponse.json({ ok: false, error: "reset_failed" }, { status: 500 });
  }
}
