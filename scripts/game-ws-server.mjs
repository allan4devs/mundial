import { MongoClient } from "mongodb";
import WebSocket, { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lva";
const MONGODB_DB = process.env.MONGODB_DB || "lva";
const PORT = process.env.GAME_WS_PORT ? Number(process.env.GAME_WS_PORT) : 3001;
const POLL_MS = 250;
const QQSM_ADMIN_CODE = process.env.QQSM_ADMIN_CODE || process.env.XTREME_ADMIN_CODE || "";

async function main() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 });
  try {
    await client.connect();
  } catch (error) {
    console.error(`No se pudo conectar a MongoDB en ${MONGODB_URI}. Inicia MongoDB o configura MONGODB_URI antes de ejecutar npm run ws.`);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }
  const db = client.db(MONGODB_DB);
  const col = db.collection("ghost_game_state");
  const raceCol = db.collection("ghost_race_rooms");
  const qqsmCol = db.collection("qqsm_rooms");
  const qqsmQuestions = db.collection("qqsm_questions");

  const wss = new WebSocketServer({ port: PORT });
  console.log(`game-ws-server listening on ws://localhost:${PORT}`);

  // Map of socket -> subscriptions plus the QQSM player identity.
  const subs = new Map();
  const qqsmConnections = new Map();

  async function getQqsmQuestions() {
    const questions = await qqsmQuestions.find({}).limit(10).toArray();
    if (questions.length >= 10) return questions;
    return [
      ["¿Cuál es la capital de Costa Rica?", ["San José", "Cartago", "Alajuela", "Heredia"], 0],
      ["¿Cuántos lados tiene un hexágono?", ["5", "6", "7", "8"], 1],
      ["¿Qué planeta es conocido como el planeta rojo?", ["Venus", "Marte", "Júpiter", "Saturno"], 1],
      ["¿Cuál es el océano más grande?", ["Atlántico", "Índico", "Pacífico", "Ártico"], 2],
      ["¿Cuánto es 9 x 7?", ["54", "63", "72", "81"], 1],
      ["¿Quién pintó la Mona Lisa?", ["Van Gogh", "Picasso", "Leonardo da Vinci", "Monet"], 2],
      ["¿Cuál es el idioma más hablado por nativos?", ["Inglés", "Español", "Mandarín", "Francés"], 2],
      ["¿Qué gas respiramos principalmente del aire?", ["Oxígeno", "Nitrógeno", "Helio", "CO2"], 1],
      ["¿Cuántos minutos tiene una hora?", ["30", "45", "60", "90"], 2],
      ["¿Cuál es el resultado de 12 + 15?", ["25", "27", "29", "30"], 1],
    ].map(([text, options, correct], index) => ({ _id: `fallback-${index}`, text, options: options.map((option, i) => ({ id: String(i), text: option })), correct }));
  }

  function publicQqsm(room, playerId) {
    return {
      players: (room.players || []).map((p) => ({ id: p.id === playerId ? "me" : p.id, name: p.name, score: p.score, answered: Boolean(p.answered) })),
      question: room.question ? { id: room.question.id, text: room.question.text, options: room.question.options, number: room.question.number, deadlineAt: room.question.deadlineAt } : null,
      questionNumber: room.questionNumber || 0, totalQuestions: 10, deadlineAt: room.question?.deadlineAt || null,
      finished: Boolean(room.finished), winnerId: room.winnerId || null,
    };
  }

  async function broadcastQqsm(roomId) {
    const room = await qqsmCol.findOne({ _id: roomId });
    if (!room) return;
    const payloads = new Map();
    for (const [socket, player] of qqsmConnections.entries()) {
      if (player.roomId === roomId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "qqsm_state", state: publicQqsm(room, player.playerId) }));
      }
    }
  }

  async function startQqsmRound(roomId, questions) {
    const room = await qqsmCol.findOne({ _id: roomId });
    if (!room || room.finished || room.players.length < 2 || room.question) return;
    const source = questions[room.questionNumber];
    if (!source) return;
    const now = new Date();
    await qqsmCol.updateOne({ _id: roomId, question: null }, { $set: { question: { id: String(source._id), text: source.text, options: source.options, correct: source.correct, number: room.questionNumber + 1, deadlineAt: new Date(now.getTime() + 10000).toISOString() }, updatedAt: now }, $setOnInsert: { createdAt: now } });
    await broadcastQqsm(roomId);
  }

  async function finishQqsmRound(roomId, questions) {
    const room = await qqsmCol.findOne({ _id: roomId });
    if (!room?.question) return;
    const deadline = Date.parse(room.question.deadlineAt);
    if (Date.now() < deadline && !(room.players || []).every((p) => p.answered)) return;
    const nextNumber = (room.questionNumber || 0) + 1;
    const players = (room.players || []).map((p) => ({ ...p, answered: false }));
    const finished = nextNumber >= 10;
    const winnerId = finished ? (players[0].score === players[1].score ? null : players[0].score > players[1].score ? players[0].id : players[1].id) : null;
    await qqsmCol.updateOne({ _id: roomId, "question.id": room.question.id }, { $set: { players, question: null, questionNumber: nextNumber, finished, winnerId, updatedAt: new Date() } });
    await broadcastQqsm(roomId);
    if (!finished) await startQqsmRound(roomId, questions);
  }

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
      const qqsmPlayer = qqsmConnections.get(ws);
      qqsmConnections.delete(ws);
      if (qqsmPlayer) {
        try {
          await qqsmCol.updateOne(
            { _id: qqsmPlayer.roomId },
            { $pull: { players: { id: qqsmPlayer.playerId } }, $set: { updatedAt: new Date() } }
          );
          const remaining = await qqsmCol.findOne({ _id: qqsmPlayer.roomId });
          if (remaining && remaining.players.length < 2) {
            await qqsmCol.updateOne(
              { _id: qqsmPlayer.roomId },
              { $set: { players: remaining.players.map((p) => ({ ...p, score: 0, answered: false })), questionNumber: 0, question: null, finished: false, winnerId: null, updatedAt: new Date() } }
            );
          }
          await broadcastQqsm(qqsmPlayer.roomId);
        } catch (error) {
          console.error("QQSM disconnect cleanup error", error instanceof Error ? error.message : error);
        }
      }
    });

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (["qqsm_join", "qqsm_answer", "qqsm_restart", "qqsm_sync", "qqsm_admin_reset"].includes(msg?.type)) {
          const questions = await getQqsmQuestions();
          let identity = qqsmConnections.get(ws);
          if (msg.type === "qqsm_admin_reset") {
            if (!QQSM_ADMIN_CODE || String(msg.code || "") !== QQSM_ADMIN_CODE) {
              ws.send(JSON.stringify({ type: "qqsm_error", message: "Código administrativo inválido." }));
              return;
            }
            await qqsmCol.deleteOne({ _id: "public" });
            await broadcastQqsm("public");
            return;
          }
          if (msg.type === "qqsm_join") {
            const roomId = "public";
            const playerId = identity?.playerId || randomUUID();
            let room = await qqsmCol.findOne({ _id: roomId });
            if (!room || room.finished) { room = { _id: roomId, players: [], questionNumber: 0, question: null, finished: false, winnerId: null, updatedAt: new Date() }; await qqsmCol.replaceOne({ _id: roomId }, room, { upsert: true }); }
            const name = String(msg.name || "Jugador").trim().slice(0, 20) || "Jugador";
            const players = room.players.filter((p) => p.id !== playerId);
            if (players.length >= 2) { ws.send(JSON.stringify({ type: "qqsm_error", message: "La partida ya tiene dos jugadores." })); return; }
            players.push({ id: playerId, name, score: 0, answered: false });
            await qqsmCol.updateOne({ _id: roomId }, { $set: { players, updatedAt: new Date() } });
            qqsmConnections.set(ws, { roomId, playerId });
            await broadcastQqsm(roomId);
            if (players.length === 2) await startQqsmRound(roomId, questions);
            return;
          }
          if (!identity) return;
          const room = await qqsmCol.findOne({ _id: identity.roomId });
          if (!room) return;
          if (msg.type === "qqsm_sync") {
            ws.send(JSON.stringify({ type: "qqsm_state", state: publicQqsm(room, identity.playerId) }));
            return;
          }
          if (msg.type === "qqsm_answer") {
            if (!room.question || room.question.id !== msg.questionId || Date.now() > Date.parse(room.question.deadlineAt)) { await finishQqsmRound(identity.roomId, questions); return; }
            const player = room.players.find((p) => p.id === identity.playerId);
            if (!player || player.answered) return;
            const score = player.score + (String(msg.optionId) === String(room.question.correct) ? 1 : 0);
            await qqsmCol.updateOne({ _id: identity.roomId, "players.id": identity.playerId, "players.answered": false }, { $set: { "players.$.answered": true, "players.$.score": score, updatedAt: new Date() } });
            await broadcastQqsm(identity.roomId);
            await finishQqsmRound(identity.roomId, questions);
            return;
          }
          if (msg.type === "qqsm_restart") { await qqsmCol.updateOne({ _id: identity.roomId }, { $set: { players: room.players.map((p) => ({ ...p, score: 0, answered: false })), questionNumber: 0, question: null, finished: false, winnerId: null, updatedAt: new Date() } }); await broadcastQqsm(identity.roomId); await startQqsmRound(identity.roomId, questions); return; }
        }
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

  setInterval(async () => {
    for (const room of await qqsmCol.find({ finished: { $ne: true }, question: { $ne: null } }).toArray()) {
      if (Date.now() >= Date.parse(room.question.deadlineAt)) await finishQqsmRound(room._id, await getQqsmQuestions());
    }
  }, 250);

  // Keep clients in sync even if a browser misses the join broadcast.
  setInterval(async () => {
    const activeRooms = await qqsmCol.find({ _id: "public", "players.1": { $exists: true } }).toArray();
    for (const room of activeRooms) await broadcastQqsm(room._id);
  }, 1000);
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
