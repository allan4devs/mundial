"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Player = { visitorId: string; name: string; positionSegment: number; finished: boolean };

export default function RaceClient({ gameId, wsUrl }: { gameId: string; wsUrl?: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [totalSegments, setTotalSegments] = useState(10);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [visitorId, setVisitorId] = useState(() => typeof window !== "undefined" ? localStorage.getItem("visitorId") ?? "" : "");
  const [playerName, setPlayerName] = useState(() => typeof window !== "undefined" ? localStorage.getItem("playerName") ?? "" : "");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // initial fetch state
    (async () => {
      try {
        const res = await fetch(`/api/game/state?gameId=${encodeURIComponent(gameId)}`);
        const j = await res.json();
        if (j?.state) applyState(j.state);
      } catch (e) {}
    })();

    const url = wsUrl ?? `ws://localhost:3001/?gameId=${encodeURIComponent(gameId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ action: "subscribe", gameId }));
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === "state" && msg.state) applyState(msg.state);
      } catch (e) {}
    };
    ws.onclose = () => (wsRef.current = null);
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  function applyState(s: any) {
    setTotalSegments(s.totalSegments ?? 10);
    setCurrentSegment(s.currentSegment ?? 0);
    setPlayers((s.players ?? []).map((p: any) => ({ visitorId: p.visitorId, name: p.name, positionSegment: p.positionSegment, finished: !!p.finished })));
    if (visitorId) {
      const exists = (s.players ?? []).some((p: any) => p.visitorId === visitorId);
      setJoined(Boolean(exists));
    }
  }

  function getOwn(): Player | undefined {
    return players.find((p) => p.visitorId === visitorId);
  }

  async function doJoin() {
    if (!visitorId || !playerName) return alert("Ingrese id y nombre");
    localStorage.setItem("visitorId", visitorId);
    localStorage.setItem("playerName", playerName);
    setLoading(true);
    try {
      const res = await fetch(`/api/game/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, visitorId, name: playerName }) });
      const j = await res.json();
      if (j?.state) applyState(j.state);
      setJoined(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function doLeave() {
    if (!visitorId) return;
    setLoading(true);
    try {
      await fetch(`/api/game/leave`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, visitorId }) });
      setJoined(false);
      // optimistic remove
      setPlayers((ps) => ps.filter((p) => p.visitorId !== visitorId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function doMove(step = 1) {
    const own = getOwn();
    if (!own) return alert("No estás en la partida");
    const to = Math.min(totalSegments, own.positionSegment + step);
    setLoading(true);
    try {
      const res = await fetch(`/api/game/move`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, visitorId, toSegment: to }) });
      const j = await res.json();
      if (j?.state) applyState(j.state);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-4">
        <div className="text-sm">Game: <strong>{gameId}</strong></div>
        <div className="text-sm">Segment: {currentSegment}/{totalSegments}</div>
      </div>

      <div className="mb-4 flex gap-2">
        <input placeholder="visitorId" value={visitorId} onChange={(e) => setVisitorId(e.target.value)} className="border p-1 rounded" />
        <input placeholder="name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="border p-1 rounded" />
        {!joined ? (
          <button onClick={doJoin} disabled={loading} className="bg-green-500 text-white px-3 py-1 rounded">{loading? '...' : 'Join'}</button>
        ) : (
          <button onClick={doLeave} disabled={loading} className="bg-red-500 text-white px-3 py-1 rounded">{loading? '...' : 'Leave'}</button>
        )}
        <button onClick={() => doMove(1)} disabled={!joined || loading} className="bg-blue-600 text-white px-3 py-1 rounded">Advance +1</button>
        <button onClick={() => doMove(3)} disabled={!joined || loading} className="bg-blue-600 text-white px-3 py-1 rounded">Advance +3</button>
      </div>

      <div className="space-y-3">
        {players.map((p) => {
          const pct = Math.round((p.positionSegment / Math.max(1, totalSegments)) * 100);
          const isOwn = p.visitorId === visitorId;
          return (
            <div key={p.visitorId} className={`border rounded p-3 ${isOwn ? "ring-2 ring-indigo-400" : ""}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{p.name}{p.finished ? " 🏁" : ""}</div>
                <div className="text-sm text-gray-600">{p.positionSegment}/{totalSegments}</div>
              </div>
              <div className="w-full bg-gray-200 h-4 rounded overflow-hidden">
                <motion.div className="bg-indigo-500 h-4" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 200, damping: 30 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
