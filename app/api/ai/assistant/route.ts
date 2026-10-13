import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/helpers/mongodb";
import { runConversation } from "@/lib/conversation/engine";
import type { ConversationReservation } from "@/lib/conversation/types";

const SESSION_ID_PATTERN = /^[a-zA-Z0-9:_-]{8,120}$/;

type ConversationPayload = {
  sessionId?: string;
  message?: string;
  optionKey?: string;
  reset?: boolean;
  requestId?: string;
  prefill?: Partial<ConversationReservation>;
};

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ConversationPayload;
    const sessionId = payload.sessionId?.trim() ?? "";
    if (!SESSION_ID_PATTERN.test(sessionId)) {
      return NextResponse.json({ error: "Invalid conversation session." }, { status: 400 });
    }

    const result = await runConversation(await getDb(), {
      sessionId,
      message: typeof payload.message === "string" ? payload.message.slice(0, 1000) : undefined,
      optionKey: typeof payload.optionKey === "string" ? payload.optionKey.slice(0, 20) : undefined,
      reset: payload.reset === true,
      requestId: typeof payload.requestId === "string" ? payload.requestId.slice(0, 120) : undefined,
      prefill: payload.prefill && typeof payload.prefill === "object" ? payload.prefill : undefined,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
        "X-Conversation-Mode": result.answerSource === "openai" ? "mongodb-openai-hybrid" : "mongodb-state-machine",
      },
    });
  } catch (error) {
    console.error("[conversation/assistant]", error);
    return NextResponse.json(
      {
        error: "Vero no pudo recuperar la conversación en este momento.",
        recovery: "Puede intentar de nuevo o comunicarse con una persona del equipo.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
