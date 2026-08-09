import { getDb } from "@/lib/helpers/mongodb";
import { listLiveChatMessages, type SerializedLiveChatMessage } from "@/lib/mundial/live-chat";
import { subscribeLiveChatChanges } from "@/lib/mundial/live-chat-events";

export const dynamic = "force-dynamic";
export const maxDuration = 55;

const POLL_MS = 1_500;
const HEARTBEAT_MS = 15_000;

function cleanMatchId(value: string | null): string {
  return value ? value.trim().slice(0, 80) : "";
}

type ChatPayload = {
  messages: SerializedLiveChatMessage[];
};

type ChatClient = {
  send: (payload: ChatPayload) => void;
  heartbeat: () => void;
};

type ChatTopic = {
  clients: Set<ChatClient>;
  lastPayload: ChatPayload;
  lastSignature: string;
  timerId: ReturnType<typeof setInterval> | null;
  refreshPromise: Promise<void> | null;
};

const topics = new Map<string, ChatTopic>();

function emptyPayload(): ChatPayload {
  return { messages: [] };
}

function getTopic(matchId: string): ChatTopic {
  const existing = topics.get(matchId);
  if (existing) return existing;

  const topic: ChatTopic = {
    clients: new Set(),
    lastPayload: emptyPayload(),
    lastSignature: JSON.stringify(emptyPayload()),
    timerId: null,
    refreshPromise: null,
  };
  topics.set(matchId, topic);
  return topic;
}

function broadcast(topic: ChatTopic, payload: ChatPayload) {
  const signature = JSON.stringify(payload);
  if (signature === topic.lastSignature) return;
  topic.lastSignature = signature;
  topic.lastPayload = payload;
  for (const client of topic.clients) client.send(payload);
}

async function refreshTopic(matchId: string, topic: ChatTopic) {
  if (!matchId) return;
  if (topic.refreshPromise) return topic.refreshPromise;

  topic.refreshPromise = (async () => {
    const db = await getDb();
    broadcast(topic, { messages: await listLiveChatMessages(db, matchId) });
  })().finally(() => {
    topic.refreshPromise = null;
  });

  return topic.refreshPromise;
}

function startTopic(matchId: string, topic: ChatTopic) {
  if (topic.timerId) return;
  topic.timerId = setInterval(() => {
    void refreshTopic(matchId, topic).catch((err) => {
      console.error("[mundial/chat/live] poll error", err);
    });
  }, POLL_MS);
}

function stopTopic(matchId: string, topic: ChatTopic) {
  if (topic.clients.size > 0) return;
  if (topic.timerId) clearInterval(topic.timerId);
  topics.delete(matchId);
}

subscribeLiveChatChanges((matchId) => {
  const topic = topics.get(matchId);
  if (!topic) return;
  void refreshTopic(matchId, topic).catch((err) => {
    console.error("[mundial/chat/live] notify refresh error", err);
  });
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const matchId = cleanMatchId(url.searchParams.get("matchId"));
  const encoder = new TextEncoder();
  let closed = false;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  const topic = getTopic(matchId);
  let client: ChatClient | null = null;

  function cleanup() {
    closed = true;
    if (client) {
      topic.clients.delete(client);
      client = null;
    }
    stopTopic(matchId, topic);
    if (heartbeatId) clearInterval(heartbeatId);
  }

  const stream = new ReadableStream({
    async start(controller) {
      function send(payload: ChatPayload) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // controller may already be closed
        }
      }

      function heartbeat() {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // controller may already be closed
        }
      }

      client = { send, heartbeat };
      topic.clients.add(client);
      send(topic.lastPayload);

      try {
        await refreshTopic(matchId, topic);
      } catch (err) {
        console.error("[mundial/chat/live] initial error", err);
      }

      startTopic(matchId, topic);
      heartbeatId = setInterval(heartbeat, HEARTBEAT_MS);

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },

    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
