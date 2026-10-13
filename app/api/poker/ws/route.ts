import { experimental_upgradeWebSocket } from "@vercel/functions";
import { requirePokerIdentity } from "@/lib/poker/identity";
import { serializeLatestPokerState, watchPokerTable } from "@/lib/poker/store";

export async function GET() {
  const identity = await requirePokerIdentity();
  if (!identity) return Response.json({ ok: false, error: "authentication_required" }, { status: 401 });
  const watched = await watchPokerTable(identity.userId, identity.name);
  return experimental_upgradeWebSocket(async (socket) => {
    let closed = false;
    const heartbeat = setInterval(() => { if (socket.readyState === socket.OPEN) socket.ping(); }, 25_000);
    const close = async () => { if (closed) return; closed = true; clearInterval(heartbeat); await watched.stream.close().catch(() => undefined); };
    socket.on("close", () => { void close(); });
    socket.on("error", (error: Error) => { console.error("Poker WebSocket error", error); void close(); });
    socket.send(JSON.stringify({ type: "state", state: watched.initial.state }));
    try {
      for await (const change of watched.stream) {
        if (closed) break;
        if (change.operationType === "delete") { socket.close(1000, "Table closed"); break; }
        const state = await serializeLatestPokerState(identity.userId);
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ type: "state", state }));
      }
    } catch (error) {
      if (!closed) console.error("Poker change stream failed", error);
    } finally { await close(); }
  });
}
