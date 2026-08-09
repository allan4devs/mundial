// app/api/mundial/penalitos/live/route.ts
// SSE endpoint for penalitos game state + live match snapshot.
// One shared poller per server process feeds all connected clients.
import type { Db } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import {
  ensureState,
  getState,
  serializeState,
  tickState,
  type SerializedLiveMatch,
  type SerializedPenalitosViewer,
  type SerializedPenalitosState,
} from "@/lib/mundial/penalitos";
import { subscribePenalitosChanges } from "@/lib/mundial/penalitos-events";
import { readLiveMundialMatch } from "@/lib/mundial/matches-store";

export const dynamic = "force-dynamic";
export const maxDuration = 55; // Vercel streaming limit

const POLL_MS = 1_000;
const HEARTBEAT_MS = 15_000;

// Per-process connection counter: approximate on multi-instance deployments.
let activeConnections = 0;
let pollTimerId: ReturnType<typeof setInterval> | null = null;
let refreshPromise: Promise<void> | null = null;
let lastSignature = "";
let lastPayload: SerializedPenalitosState = serializeState(null, {
  liveMatch: null,
  viewerCount: 0,
});

type MatchDoc = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLiveScore?: number | null;
  awayLiveScore?: number | null;
  liveMinute?: number | null;
  liveStatus?: string;
  liveNote?: string;
};

type LiveClient = {
  send: (payload: SerializedPenalitosState) => void;
  heartbeat: () => void;
};

const clients = new Set<LiveClient>();
const activeViewers = new Map<string, SerializedPenalitosViewer>();
const recentViewers = new Map<string, SerializedPenalitosViewer>();

function cleanName(value: string | null): string {
  const name = (value ?? "").trim().slice(0, 30);
  return name || "Invitado";
}

function viewerList(map: Map<string, SerializedPenalitosViewer>) {
  return [...map.values()].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)).slice(0, 18);
}

function presenceExtras() {
  return {
    viewerCount: activeConnections,
    viewers: viewerList(activeViewers),
    recentViewers: viewerList(recentViewers),
  };
}

async function fetchLiveMatch(db: Db): Promise<SerializedLiveMatch | null> {
  const doc = await readLiveMundialMatch(db) as MatchDoc | null;
  if (!doc) return null;
  const status = doc.liveStatus;
  return {
    id: doc.id,
    homeTeam: doc.homeTeam,
    awayTeam: doc.awayTeam,
    homeLiveScore: typeof doc.homeLiveScore === "number" ? doc.homeLiveScore : null,
    awayLiveScore: typeof doc.awayLiveScore === "number" ? doc.awayLiveScore : null,
    liveMinute: typeof doc.liveMinute === "number" ? doc.liveMinute : null,
    liveStatus: status === "live" || status === "halftime" || status === "fulltime" ? status : "scheduled",
    liveNote: doc.liveNote ?? "",
  };
}

function broadcast(payload: SerializedPenalitosState) {
  const signature = JSON.stringify(payload);
  if (signature === lastSignature) return;
  lastSignature = signature;
  lastPayload = payload;
  for (const client of clients) client.send(payload);
}

async function refreshSnapshot() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const db = await getDb();
    await tickState(db);
    const [state, liveMatch] = await Promise.all([getState(db), fetchLiveMatch(db)]);
    broadcast(serializeState(state, { liveMatch, ...presenceExtras() }));
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

subscribePenalitosChanges(() => {
  void refreshSnapshot().catch((err) => {
    console.error("[penalitos/live] notify refresh error", err);
  });
});

function startPoller() {
  if (pollTimerId) return;
  pollTimerId = setInterval(() => {
    void refreshSnapshot().catch((err) => {
      console.error("[penalitos/live] poll error", err);
    });
  }, POLL_MS);
}

function stopPollerIfIdle() {
  if (clients.size > 0) return;
  if (pollTimerId) clearInterval(pollTimerId);
  pollTimerId = null;
  lastSignature = "";
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const url = new URL(req.url);
  const visitorId = (url.searchParams.get("visitorId") ?? "").trim().slice(0, 64);
  const viewerName = cleanName(url.searchParams.get("name"));
  let closed = false;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let decremented = false;
  let client: LiveClient | null = null;

  activeConnections++;
  if (visitorId) {
    const now = new Date().toISOString();
    const viewer: SerializedPenalitosViewer = {
      visitorId,
      name: viewerName,
      connectedAt: activeViewers.get(visitorId)?.connectedAt ?? now,
      lastSeenAt: now,
    };
    activeViewers.set(visitorId, viewer);
    recentViewers.set(visitorId, viewer);
  }

  function decrement() {
    if (decremented) return;
    decremented = true;
    activeConnections = Math.max(0, activeConnections - 1);
  }

  function cleanup() {
    closed = true;
    decrement();
    if (client) {
      clients.delete(client);
      client = null;
    }
    if (visitorId) {
      const viewer = activeViewers.get(visitorId);
      if (viewer) {
        const updated = { ...viewer, lastSeenAt: new Date().toISOString() };
        recentViewers.set(visitorId, updated);
      }
      activeViewers.delete(visitorId);
    }
    stopPollerIfIdle();
    if (heartbeatId) clearInterval(heartbeatId);
    void refreshSnapshot().catch(() => {});
  }

  const stream = new ReadableStream({
    async start(controller) {
      function send(payload: SerializedPenalitosState) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: state\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // controller may already be closed
        }
      }

      function heartbeat() {
        if (closed) return;
        if (visitorId) {
          const viewer = activeViewers.get(visitorId);
          if (viewer) {
            const updated = { ...viewer, lastSeenAt: new Date().toISOString() };
            activeViewers.set(visitorId, updated);
            recentViewers.set(visitorId, updated);
          }
        }
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // controller may already be closed
        }
      }

      client = { send, heartbeat };
      clients.add(client);
      try {
        controller.enqueue(encoder.encode("retry: 1000\n\n"));
      } catch {
        // controller may already be closed
      }
      send(lastPayload);

      try {
        const db = await getDb();
        await ensureState(db);
        await refreshSnapshot();
      } catch (err) {
        console.error("[penalitos/live] initial fetch error", err);
        send(serializeState(null, { liveMatch: null, ...presenceExtras() }));
      }

      startPoller();
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
