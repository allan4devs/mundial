"use client";

import { useState } from "react";
import { Plus, Search, UserRound, X } from "lucide-react";
import type { UfcPlayerProgress } from "../types";
import { cn, normalizeName } from "../utils";

type Props = {
  players: UfcPlayerProgress[];
  onSelect: (name: string) => void;
  onClose: () => void;
  allowClose: boolean;
};

export function PlayerPickerModal({ players, onSelect, onClose, allowClose }: Props) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");

  const filtered = players.filter((p) =>
    p.playerName.toLowerCase().includes(query.toLowerCase())
  );

  function handleNewPlayer() {
    const trimmed = normalizeName(newName);
    if (trimmed) onSelect(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-[#f5c518]/35 bg-[#0d0d0d] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#c8102e] px-4 py-3">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-white" />
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white">¿Quién sos?</p>
          </div>
          {allowClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-black/20 text-white/75 transition hover:border-[#f5c518] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="shrink-0 border-b border-white/10 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jugador..."
              className="h-10 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm font-bold text-white placeholder-white/35 outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/15"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length ? (
            <ul className="divide-y divide-white/8">
              {filtered.map((player) => (
                <li key={player.key}>
                  <button
                    type="button"
                    onClick={() => onSelect(player.playerName)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c8102e]/50 bg-[#c8102e]/15 text-sm font-black text-[#f5c518]">
                      {player.playerName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-white">{player.playerName}</p>
                      <p className="text-xs font-bold text-white/50">
                        {player.totalPredictions} pick{player.totalPredictions !== 1 ? "s" : ""} · {player.lockedPredictions} cerrado{player.lockedPredictions !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid place-items-center p-8 text-center">
              <UserRound className="h-10 w-10 text-white/30" />
              <p className="mt-3 text-sm font-black text-white/60">
                {query ? "Sin resultados" : "Aún no hay jugadores"}
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/50">Jugador nuevo</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleNewPlayer(); }}
              placeholder="Tu nombre..."
              className="h-10 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-bold text-white placeholder-white/35 outline-none focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/15"
            />
            <button
              type="button"
              onClick={handleNewPlayer}
              disabled={!normalizeName(newName)}
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition",
                normalizeName(newName)
                  ? "border-[#f5c518] bg-[#f5c518] text-black hover:bg-yellow-400"
                  : "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
              )}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
