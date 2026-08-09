"use client";

import { useCallback, useEffect, useState } from "react";
import { Delete, IdCard, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { cn } from "../utils";

type Props = {
  playerName: string;
  onSuccess: (isNew: boolean) => void;
  onChangePlayer?: () => void;
};

type Mode = "set" | "verify" | "migrate";
type Step = "identity" | "legacy" | "email" | "enter" | "confirm";

const NUMPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PinModal({ playerName, onSuccess, onChangePlayer }: Props) {
  const [mode, setMode] = useState<Mode>("verify");
  const [step, setStep] = useState<Step>("identity");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [legacyPin, setLegacyPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pinLength = step === "legacy" ? 4 : 6;

  async function checkIdentity() {
    const cleanCedula = cedula.trim();
    if (!/^[A-Za-z0-9 -]{9,24}$/.test(cleanCedula)) {
      setError("Ingresá una cédula o documento válido.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ playerName, cedula: cleanCedula });
      const response = await fetch(`/api/mundial/pin?${query}`);
      const data = await response.json() as { error?: string; hasPinSet?: boolean; migrationRequired?: boolean };
      if (!response.ok) throw new Error(data.error ?? "No se pudo verificar la identidad.");
      if (data.hasPinSet) {
        setMode("verify");
        setStep("enter");
      } else if (data.migrationRequired) {
        setMode("migrate");
        setStep("legacy");
      } else {
        setMode("set");
        setStep("email");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo verificar la identidad.");
    } finally {
      setIsLoading(false);
    }
  }

  function continueWithEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresá un correo válido para respaldar tu acceso.");
      return;
    }
    setError("");
    setStep("enter");
  }

  const submitPin = useCallback(async (pin: string) => {
    if (step === "legacy") {
      setLegacyPin(pin);
      setDigits("");
      setStep("email");
      return;
    }

    if (mode !== "verify") {
      if (step === "enter") {
        setFirstPin(pin);
        setDigits("");
        setStep("confirm");
        return;
      }
      if (pin !== firstPin) {
        setError("Los PIN no coinciden. Intentá de nuevo.");
        setDigits("");
        setFirstPin("");
        setStep("enter");
        return;
      }
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/mundial/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          playerName,
          cedula,
          email,
          pin,
          legacyPin: mode === "migrate" ? legacyPin : undefined,
        }),
      });
      const data = await response.json() as { error?: string; valid?: boolean; isNew?: boolean };
      if (!response.ok || !data.valid) throw new Error(data.error ?? "PIN incorrecto.");
      onSuccess(Boolean(data.isNew));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error de conexión.");
      setDigits("");
      if (mode !== "verify") {
        setFirstPin("");
        setStep(mode === "migrate" ? "legacy" : "email");
      }
    } finally {
      setIsLoading(false);
    }
  }, [cedula, email, firstPin, legacyPin, mode, onSuccess, playerName, step]);

  const pressDigit = useCallback((digit: string) => {
    if (isLoading || digits.length >= pinLength) return;
    const next = digits + digit;
    setDigits(next);
    setError("");
    if (next.length === pinLength) void submitPin(next);
  }, [digits, isLoading, pinLength, submitPin]);

  const pressDelete = useCallback(() => {
    if (isLoading) return;
    setDigits((current) => current.slice(0, -1));
    setError("");
  }, [isLoading]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (step === "identity" || step === "email" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        pressDigit(event.key);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        pressDelete();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pressDelete, pressDigit, step]);

  const title = step === "identity"
    ? "Verificá tu identidad"
    : step === "legacy"
      ? "PIN anterior"
      : step === "email"
        ? "Correo de respaldo"
        : mode === "verify"
          ? "Ingresá tu PIN"
          : step === "confirm"
            ? "Confirmá tu PIN nuevo"
            : "Creá un PIN de 6 dígitos";

  const subtitle = step === "identity"
    ? "La cédula es la única identidad de tu quiniela"
    : step === "legacy"
      ? "Ingresá tus 4 dígitos actuales para migrar la cuenta"
      : step === "email"
        ? "Recibirás una confirmación de seguridad en este correo"
        : mode === "verify"
          ? "Cédula y PIN deben pertenecer a la misma cuenta"
          : "No uses secuencias ni números de tu cédula";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-md">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#62ffe6]/35 bg-[#3151ff]/25 text-[#62ffe6]">
            {step === "identity" ? <IdCard className="h-8 w-8" /> : step === "email" ? <Mail className="h-8 w-8" /> : mode === "verify" ? <Lock className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#d5ff3f]">{playerName}</p>
          <h2 className="text-[1.35rem] font-black uppercase leading-tight text-white">{title}</h2>
          <p className="text-sm font-bold text-white/50">{subtitle}</p>
          {onChangePlayer && (
            <button type="button" onClick={onChangePlayer} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#62ffe6]">
              Cambiar jugador
            </button>
          )}
        </div>

        {step === "identity" ? (
          <div className="w-full space-y-3">
            <input
              value={cedula}
              onChange={(event) => { setCedula(event.target.value); setError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") void checkIdentity(); }}
              placeholder="Cédula o documento"
              autoComplete="username"
              autoFocus
              className="h-14 w-full rounded-xl border border-white/15 bg-black/45 px-4 text-base font-bold text-white outline-none placeholder:text-white/30 focus:border-[#62ffe6]"
            />
            <button type="button" onClick={() => void checkIdentity()} disabled={isLoading || !cedula.trim()} className="h-14 w-full rounded-xl bg-[#9dff34] text-base font-black text-[#06121c] disabled:opacity-40">
              {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Continuar"}
            </button>
          </div>
        ) : step === "email" ? (
          <div className="w-full space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") continueWithEmail(); }}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              autoFocus
              className="h-14 w-full rounded-xl border border-white/15 bg-black/45 px-4 text-base font-bold text-white outline-none placeholder:text-white/30 focus:border-[#62ffe6]"
            />
            <button type="button" onClick={continueWithEmail} disabled={!email.trim()} className="h-14 w-full rounded-xl bg-[#9dff34] text-base font-black text-[#06121c] disabled:opacity-40">
              Configurar PIN seguro
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              {Array.from({ length: pinLength }, (_, index) => (
                <div key={index} className={cn("h-3.5 w-3.5 rounded-full border-2", digits.length > index ? "border-[#62ffe6] bg-[#62ffe6]" : "border-white/25")} />
              ))}
            </div>
            {isLoading ? <Loader2 className="h-7 w-7 animate-spin text-[#62ffe6]" /> : (
              <div className="grid w-full grid-cols-3 gap-3">
                {NUMPAD.map((key) => <button key={key} type="button" onClick={() => pressDigit(key)} className="flex h-14 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-xl font-black text-white">{key}</button>)}
                <div />
                <button type="button" onClick={() => pressDigit("0")} className="flex h-14 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-xl font-black text-white">0</button>
                <button type="button" onClick={pressDelete} className="flex h-14 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-white/60"><Delete className="h-5 w-5" /></button>
              </div>
            )}
          </>
        )}

        <div className="min-h-6">{error && <p className="text-center text-sm font-bold text-[#ff6a6a]">{error}</p>}</div>
      </div>
    </div>
  );
}
