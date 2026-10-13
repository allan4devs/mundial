import { NextRequest, NextResponse } from "next/server";
import { requirePokerIdentity } from "@/lib/poker/identity";
import { actAtPokerTable } from "@/lib/poker/store";

const ACTION_TYPES = new Set(["fold", "check", "call", "bet", "raise", "allin"]);

export async function POST(request: NextRequest) {
  try {
    const identity = await requirePokerIdentity();
    if (!identity) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    if (!body.action || !ACTION_TYPES.has(body.action.type)) return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
    const action = { type: body.action.type } as { type: string; amount?: number };
    if (body.action.type === "bet" || body.action.type === "raise") action.amount = Math.floor(Number(body.action.amount));
    const result = await actAtPokerTable(identity.userId, typeof body.actionId === "string" ? body.actionId : crypto.randomUUID(), action);
    return NextResponse.json(result, { status: result.ok ? 200 : result.status });
  } catch (error) {
    console.error("Failed to apply poker action", error);
    return NextResponse.json({ ok: false, error: "action_failed" }, { status: 500 });
  }
}
