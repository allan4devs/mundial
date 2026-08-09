import { MongoClient } from "mongodb";
import WebSocket, { WebSocketServer } from "ws";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lva";
const MONGODB_DB = process.env.MONGODB_DB || "lva";
const PORT = process.env.GAME_WS_PORT ? Number(process.env.GAME_WS_PORT) : 3001;
const POLL_MS = 250;

async function main() {
  const client = new MongoClient(MONGODB_URI, {});
  await client.connect();
  const db = client.db(MONGODB_DB);
  const col = db.collection("ghost_game_state");
  const raceCol = db.collection("ghost_race_rooms");

  const wss = new WebSocketServer({ port: PORT });
  console.log(`game-ws-server listening on ws://localhost:${PORT}`);

  // Map of socket -> { gameId, raceCode }
  const subs = new Map();

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://localhost`);
    const initialGameId = url.searchParams.get("gameId");
    let lastGame = null;
    let lastRace = null;

    subs.set(ws, { gameId: null, raceCode: null });

    async function changeGameSubscription(newGameId) {
      if (lastGame === newGameId) return;
      try {
        if (lastGame) {
          await col.findOneAndUpdate({ _id: lastGame }, { $inc: { viewerCount: -1 }, $set: { updatedAt: new Date() } });
        }
        if (newGameId) {
          await col.findOneAndUpdate({ _id: newGameId }, { $inc: { viewerCount: 1 }, $set: { updatedAt: new Date() } }, { upsert: false });
        }
      } catch (e) {
        console.error("viewerCount update error", e);
      }
      lastGame = newGameId;
      const cur = subs.get(ws) ?? {};
      subs.set(ws, { ...cur, gameId: newGameId });
    }

    function changeRaceSubscription(newCode) {
      if (lastRace === newCode) return;
      lastRace = newCode;
      const cur = subs.get(ws) ?? {};
      subs.set(ws, { ...cur, raceCode: newCode });
    }

    if (initialGameId) changeGameSubscription(initialGameId);

    ws.on("close", async () => {
      try {
        if (lastGame) {
          await col.findOneAndUpdate({ _id: lastGame }, { $inc: { viewerCount: -1 }, $set: { updatedAt: new Date() } });
        }
      } catch (e) {
        console.error("viewerCount decrement error", e);
      }
      subs.delete(ws);
    });

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.action === "subscribe") await changeGameSubscription(msg.gameId ?? null);
        if (msg?.action === "subscribe_race") changeRaceSubscription(msg.code ?? null);
      } catch (e) {}
    });
  });

  // Cache last updatedAt per gameId and raceCode
  const lastSeenGame = new Map();
  const lastSeenRace = new Map();

  setInterval(async () => {
    try {
      // --- ghost_game_state polling ---
      const gameIds = new Set(Array.from(subs.values()).map((s) => s.gameId).filter(Boolean));
      if (gameIds.size > 0) {
        const docs = await col.find({ _id: { $in: Array.from(gameIds) } }).toArray();
        for (const doc of docs) {
          const id = doc._id;
          const prev = lastSeenGame.get(id)?.toISOString?.() ?? null;
          const now = doc.updatedAt?.toISOString?.() ?? null;
          if (prev !== now) {
            lastSeenGame.set(id, doc.updatedAt ?? new Date());
            const payload = JSON.stringify({ type: "state", state: doc });
            for (const [ws, sub] of subs.entries()) {
              if (sub.gameId === id && ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
              }
            }
          }
        }
      }

      // --- ghost_race_rooms polling ---
      const raceCodes = new Set(Array.from(subs.values()).map((s) => s.raceCode).filter(Boolean));
      if (raceCodes.size > 0) {
        const raceDocs = await raceCol.find({ _id: { $in: Array.from(raceCodes) } }).toArray();
        for (const doc of raceDocs) {
          const code = doc._id;
          const prev = lastSeenRace.get(code)?.toISOString?.() ?? null;
          const now = doc.updatedAt?.toISOString?.() ?? null;
          if (prev !== now) {
            lastSeenRace.set(code, doc.updatedAt ?? new Date());
            const payload = JSON.stringify({ type: "race_room", room: serializeRoom(doc) });
            for (const [ws, sub] of subs.entries()) {
              if (sub.raceCode === code && ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("ws-server poll error", err);
    }
  }, POLL_MS);
}

function serializeRoom(doc) {
  return {
    ...doc,
    _id: doc._id,
    startedAt: doc.startedAt ? doc.startedAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
