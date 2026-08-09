"use client";

import { useState } from "react";
import { Delete, Loader2, Lock, ShieldCheck } from "lucide-react";
import { cn } from "../utils";

type Props = {
  playerName: string;
  mode: "set" | "verify";
  onSuccess: () => void;
};

const NUMPAD_TOP = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinModal({ playerName, mode: initialMode, onSuccess }: Props) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleComplete(pin: string) {
    if (mode === "set") {
      if (step === "enter") {
        setFirstPin(pin);
        setDigits("");
        setStep("confirm");
        return;
      }
      if (pin !== firstPin) {
        setError("Los PINs no coinciden. Intentá de nuevo.");
        setDigits("");
        setFirstPin("");
        setStep("enter");
        return;
      }
      setIsLoading(true);
      try {
        const r = await fetch("/api/ufc/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName, pin, action: "set" }),
        });
        const data = (await r.json()) as { error?: string; hasPinSet?: boolean };
        if (r.status === 409) {
          setMode("verify");
          setStep("enter");
          setDigits("");
          setFirstPin("");
          setError("Ya tenés un PIN. Ingresalo para entrar.");
          return;
        }
        if (!r.ok) throw new Error(data.error ?? "No se pudo guardar el PIN.");
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de conexión.");
        setDigits("");
        setFirstPin("");
        setStep("enter");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const r = await fetch("/api/ufc/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, pin, action: "verify" }),
      });
      const data = (await r.json()) as { valid?: boolean; error?: string };
      if (!r.ok) throw new Error(data.error ?? "Error de verificación.");
      if (data.valid) {
        onSuccess();
      } else {
        setError("PIN incorrecto. Intentá de nuevo.");
        setDigits("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
      setDigits("");
    } finally {
      setIsLoading(false);
    }
  }

  function pressDigit(d: string) {
    if (isLoading || digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    setError("");
    if (next.length === 4) void handleComplete(next);
  }

  function pressDelete() {
    setDigits((d) => d.slice(0, -1));
    setError("");
  }

  const title =
    mode === "set"
      ? step === "enter"
        ? "Creá tu PIN"
        : "Confirmá tu PIN"
      : "Ingresá tu PIN";

  const subtitle =
    mode === "set"
      ? step === "enter"
        ? "Elegí 4 dígitos para proteger tus picks"
        : "Repetí los 4 dígitos para confirmar"
      : "Verificá que sos vos antes de apostar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-md">
      <div className="flex w-full max-w-[280px] flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#f5c518]/35 bg-[#c8102e]/25 text-[#f5c518] shadow-[0_0_32px_rgba(200,16,46,0.25)]">
            {mode === "set" ? <ShieldCheck className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#f5c518]">{playerName}</p>
          <h2 className="text-[1.35rem] font-black uppercase leading-tight text-white">{title}</h2>
          <p className="text-sm font-bold text-white/50">{subtitle}</p>
        </div>

        <div className="flex gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-[14px] w-[14px] rounded-full border-2 transition-all duration-150",
                digits.length > i
                  ? "scale-110 border-[#f5c518] bg-[#f5c518]"
                  : "border-white/25 bg-transparent"
              )}
            />
          ))}
        </div>

        <div className="min-h-[1.5rem]">
          {error && <p className="text-center text-sm font-bold text-[#ff6a6a]">{error}</p>}
        </div>

        {isLoading ? (
          <Loader2 className="h-7 w-7 animate-spin text-[#f5c518]" />
        ) : (
          <div className="grid w-full grid-cols-3 gap-3">
            {NUMPAD_TOP.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => pressDigit(k)}
                disabled={digits.length >= 4}
                className="flex h-[3.5rem] items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-xl font-black text-white transition-all hover:border-[#f5c518]/60 hover:bg-[#c8102e]/30 active:scale-95 disabled:opacity-30"
              >
                {k}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => pressDigit("0")}
              disabled={digits.length >= 4}
              className="flex h-[3.5rem] items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-xl font-black text-white transition-all hover:border-[#f5c518]/60 hover:bg-[#c8102e]/30 active:scale-95 disabled:opacity-30"
            >
              0
            </button>
            <button
              type="button"
              onClick={pressDelete}
              disabled={digits.length === 0}
              className="flex h-[3.5rem] items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-white/60 transition-all hover:border-[#ff6a3d]/50 hover:bg-[#35130d]/30 hover:text-white active:scale-95 disabled:opacity-30"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
