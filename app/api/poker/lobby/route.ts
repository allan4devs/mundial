import { NextResponse } from "next/server";
import { requirePokerIdentity } from "@/lib/poker/identity";
import { getPokerLobby } from "@/lib/poker/store";

export async function GET() {
  try {
    const identity = await requirePokerIdentity();
    if (!identity) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
    const lobby = await getPokerLobby(identity.userId, identity.name);
    return NextResponse.json({ ok: true, ...lobby }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load poker lobby", error);
    return NextResponse.json({ ok: false, error: "lobby_load_failed" }, { status: 500 });
  }
}
