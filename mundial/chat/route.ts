import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import {
  addLiveChatMessage,
  cleanChatName,
  cleanChatText,
  listLiveChatMessages,
} from "@/lib/mundial/live-chat";
import { notifyLiveChatChanged } from "@/lib/mundial/live-chat-events";
import { isBanned } from "@/lib/mundial/bans";

export const dynamic = "force-dynamic";

function cleanMatchId(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function cleanVisitorId(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

export async function GET(req: NextRequest) {
  try {
    const matchId = cleanMatchId(req.nextUrl.searchParams.get("matchId"));
    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

    const db = await getDb();
    return NextResponse.json({ messages: await listLiveChatMessages(db, matchId) });
  } catch (err) {
    console.error("[mundial/chat] GET error", err);
    return NextResponse.json({ error: "Error leyendo chat" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      matchId?: unknown;
      visitorId?: unknown;
      playerName?: unknown;
      text?: unknown;
    };

    const matchId = cleanMatchId(body.matchId);
    const visitorId = cleanVisitorId(body.visitorId);
    const playerName = cleanChatName(body.playerName) || "Jugador";
    const text = cleanChatText(body.text);

    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });
    if (!visitorId || visitorId.length < 4) return NextResponse.json({ error: "visitorId invalido" }, { status: 400 });
    if (!text) return NextResponse.json({ error: "mensaje requerido" }, { status: 400 });

    const db = await getDb();
    const ban = await isBanned(db, playerName.toUpperCase(), visitorId);
    if (ban) return NextResponse.json({ error: "Cuenta suspendida.", banned: true }, { status: 403 });

    const message = await addLiveChatMessage(db, { matchId, visitorId, playerName, text });
    notifyLiveChatChanged(matchId);
    return NextResponse.json({ ok: true, message });
  } catch (err) {
    console.error("[mundial/chat] POST error", err);
    return NextResponse.json({ error: "Error enviando mensaje" }, { status: 500 });
  }
}
