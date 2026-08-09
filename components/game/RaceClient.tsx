"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useInterval } from "@/lib/hooks/useInterval";

type PlayerView = { id: string; name: string; segment: number; joinedAt: string };
type GameView = {
  id: string;
  totalSegments: number;
  players: PlayerView[];
  viewerCount: number;
  updatedAt: string;
};

const VISITOR_KEY = "ghost-game-visitor-id";
const POLL_MS = 1500;

function visitorId() {
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export default function RaceClient({ gameId }: { gameId: string }) {
  const [state, setState] = useState<GameView | null>(null);
  const [name, setName] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMe(visitorId());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/state?gameId=${encodeURIComponent(gameId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) {
        setState(data.state);
        setError(null);
      } else {
        setError("No se encontró la partida.");
      }
    } catch {
      setError("Sin conexión con el servidor.");
    }
  }, [gameId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useInterval(refresh, POLL_MS);

  const joined = useMemo(
    () => Boolean(me && state?.players.some((p) => p.id === me)),
    [me, state]
  );
  const myPlayer = state?.players.find((p) => p.id === me) ?? null;

  async function join() {
    if (!me || !name.trim()) return;
    await fetch("/api/game/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, visitorId: me, name: name.trim() }),
    });
    void refresh();
  }

  async function move(delta: number) {
    if (!me || !myPlayer || !state) return;
    const toSegment = Math.min(
      Math.max(0, myPlayer.segment + delta),
      state.totalSegments - 1
    );
    await fetch("/api/game/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, visitorId: me, toSegment }),
    });
    void refresh();
  }

  async function leave() {
    if (!me) return;
    await fetch("/api/game/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, visitorId: me }),
    });
    void refresh();
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!state) return <p className="text-neutral-400">Cargando partida…</p>;

  return (
    <div className="space-y-6">
      {!joined ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
            placeholder="Tu nombre"
            maxLength={20}
            className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-1 ring-neutral-700 focus:ring-neutral-500"
          />
          <button
            onClick={join}
            disabled={!name.trim()}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-40"
          >
            Entrar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => move(-1)}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-100"
          >
            ← Atrás
          </button>
          <button
            onClick={() => move(1)}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900"
          >
            Avanzar →
          </button>
          <button
            onClick={leave}
            className="rounded-lg px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
          >
            Salir
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {state.players.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <span
              className={`w-28 shrink-0 truncate text-sm ${
                p.id === me ? "font-semibold text-neutral-100" : "text-neutral-400"
              }`}
            >
              {p.name}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                style={{
                  width: `${((p.segment + 1) / state.totalSegments) * 100}%`,
                }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-neutral-500">
              {p.segment + 1}/{state.totalSegments}
            </span>
          </li>
        ))}
        {state.players.length === 0 && (
          <li className="text-sm text-neutral-500">Nadie se ha unido todavía.</li>
        )}
      </ul>

      <p className="text-xs text-neutral-600">
        {state.viewerCount} espectador{state.viewerCount === 1 ? "" : "es"}
      </p>
    </div>
  );
}
