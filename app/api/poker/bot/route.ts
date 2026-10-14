import { NextResponse } from "next/server";
import { requirePokerIdentity } from "@/lib/poker/identity";
import { addPokerBot, runPokerBots } from "@/lib/poker/store";

export async function POST(request: Request) {
  const identity = await requirePokerIdentity();
  if (!identity) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const actionId = typeof body.actionId === "string" ? body.actionId : crypto.randomUUID();
  try {
    const result = body.mode === "run" ? await runPokerBots(identity.userId, actionId) : await addPokerBot(identity.userId, actionId);
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    console.error("Poker bot error", error);
    return NextResponse.json({ ok: false, error: "bot_unavailable" }, { status: 500 });
  }
}
