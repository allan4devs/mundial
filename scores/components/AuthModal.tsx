"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose?: () => void;
  onAuth: (action: "set" | "verify", name: string, pin: string) => Promise<void>;
};

export function AuthModal({ open, onClose, onAuth }: Props) {
  const [mode, setMode] = useState<"set" | "verify">("set");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      await onAuth(mode, name.trim(), pin.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#0c1410] p-5 shadow-2xl">
        <h2 className="text-lg font-black text-white">
          {mode === "set" ? "Crear cuenta Scores" : "Entrar"}
        </h2>
        <p className="mt-1 text-sm text-white/55">Nombre + PIN de 6 digitos. Sesion segura en cookie.</p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("set")}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold ${mode === "set" ? "bg-[#9dff34] text-black" : "border border-white/15 text-white/60"}`}
          >
            Registrar
          </button>
          <button
            type="button"
            onClick={() => setMode("verify")}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold ${mode === "verify" ? "bg-[#9dff34] text-black" : "border border-white/15 text-white/60"}`}
          >
            Ya tengo PIN
          </button>
        </div>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="mt-4 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#9dff34]"
        />
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="PIN 6 digitos"
          inputMode="numeric"
          type="password"
          className="mt-2 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#9dff34]"
        />
        {err ? <p className="mt-2 text-sm text-red-300">{err}</p> : null}
        <div className="mt-4 flex gap-2">
          {onClose ? (
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-sm font-bold text-white/70">
              Cerrar
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || name.trim().length < 2 || pin.length !== 6}
            onClick={() => void submit()}
            className="flex-1 rounded-lg bg-[#9dff34] px-3 py-2 text-sm font-black text-black disabled:opacity-40"
          >
            {busy ? "..." : mode === "set" ? "Crear" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
