"use client";

import { useEffect, useState } from "react";
import { UserRound, X, Plus } from "lucide-react";
import { cn } from "../utils";

type Props = {
  players: string[];
  onSelect: (name: string) => void;
  onClose?: () => void;
  allowClose?: boolean;
};

export function PlayerPickerModal({ players, onSelect, onClose, allowClose }: Props) {
  const [showNew, setShowNew] = useState(players.length === 0);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!allowClose || !onClose) return;
    const close = onClose;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [allowClose, onClose]);

  function handleSubmit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("El nombre debe tener al menos 2 letras.");
      return;
    }
    onSelect(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-[#071018] shadow-[0_32px_90px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#3151ff] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10">
              <UserRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d5ff3f]">
                Mundial 2026
              </p>
              <h2 className="text-xl font-black text-white">¿Quién sos?</h2>
            </div>
          </div>
          {allowClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/20 text-white/60 transition hover:border-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-5">
          {players.length > 0 && !showNew && (
            <>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/35">
                Elegí tu usuario
              </p>
              <ul className="mb-3 max-h-60 space-y-1.5 overflow-y-auto">
                {players.map((p) => (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => onSelect(p)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold text-white transition hover:border-[#3151ff]/60 hover:bg-[#3151ff]/20 active:scale-[0.98]"
                    >
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm font-bold text-white/50 transition hover:border-white/40 hover:text-white/75"
              >
                <Plus className="h-4 w-4" />
                Soy nuevo
              </button>
            </>
          )}

          {showNew && (
            <>
              {players.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setShowNew(false); setName(""); setError(""); }}
                  className="mb-3 text-xs font-bold text-white/40 underline underline-offset-2 transition hover:text-white/70"
                >
                  ← Volver a la lista
                </button>
              )}
              <p className="mb-3 text-sm font-bold text-white/55">
                Ingresá tu nombre para registrarte.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Tu nombre..."
                maxLength={40}
                autoFocus
                className="h-14 w-full rounded-xl border border-white/15 bg-black/45 px-4 text-base font-bold text-white outline-none placeholder:text-white/30 focus:border-[#62ffe6] focus:ring-2 focus:ring-[#62ffe6]/15"
              />
              {error && (
                <p className="mt-2 text-xs font-bold text-amber-400">{error}</p>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!name.trim()}
                className={cn(
                  "mt-3 h-14 w-full rounded-xl text-base font-black transition-all",
                  name.trim()
                    ? "bg-[#9dff34] text-[#06121c] hover:bg-[#d5ff3f]"
                    : "cursor-not-allowed bg-white/8 text-white/25"
                )}
              >
                Continuar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
