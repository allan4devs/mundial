"use client";

import {
  useEffect, useMemo, useRef, useState,
  type ReactNode, type MouseEvent, type KeyboardEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, Clock,
  Copy, Download, FileText, HelpCircle, Loader2, Lock, Mail, MessageCircle,
  Phone, RefreshCw, Send, Shield, ShieldAlert, ShieldOff, Smartphone,
  Upload, User, Wifi, WifiOff, X,
} from "lucide-react";
import { cn } from "../../utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | "start" | "captcha" | "form" | "signature"
  | "email-send" | "email-verify" | "phone-send" | "phone-verify"
  | "totp-setup" | "totp-verify" | "done";

type ChatMessage = { role: "user" | "bot" | "system"; text: string };

// ─── Fake error / loading system ──────────────────────────────────────────────

class FakeServerError extends Error {
  constructor(msg: string) { super(msg); this.name = "FakeServerError"; }
}

const FAKE_ERRORS = [
  "Error de conexión. Verifique su red e intente de nuevo.",
  "Tiempo de espera agotado (timeout 30s). El servidor no respondió.",
  "Error interno del servidor (código 503). El equipo técnico ha sido notificado.",
  "Servicio de verificación temporalmente inaccesible. Por favor espere.",
  "Error de autenticación. Sus credenciales no pudieron ser validadas.",
  "El servidor de seguridad rechazó la solicitud. Intente en unos momentos.",
];

const LOADING_MSGS = [
  "Conectando con servidores seguros...",
  "Verificando identidad...",
  "Validando datos del solicitante...",
  "Comprobando registros de seguridad...",
  "Procesando solicitud cifrada...",
  "Comunicando con base de datos central...",
];

const BOT_RESPONSES = [
  "Gracias por contactar soporte. Un agente se conectará pronto...",
  "Tiempo de espera estimado: 4 horas 32 minutos.",
  "Para problemas de recuperación de cuenta, complete el formulario en línea primero.",
  "Su número de caso ha sido registrado. Respuesta en 5-7 días hábiles.",
  "Nuestros sistemas de soporte están en mantenimiento programado.",
  "Por política de seguridad, no podemos brindar información por este canal.",
  "Para acelerar su caso, complete todos los pasos del proceso de recuperación.",
  "Un agente especializado revisará su solicitud. Tiempo estimado: 72 horas.",
  "Error al conectar con el sistema de tickets. Por favor intente más tarde.",
  "Le recomendamos revisar nuestra sección de preguntas frecuentes.",
];

function rndFakeError() {
  return FAKE_ERRORS[Math.floor(Math.random() * FAKE_ERRORS.length)];
}

async function withFake<T>(fn: () => Promise<T>, prob = 0.22): Promise<T> {
  if (Math.random() < prob) {
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 2200));
    throw new FakeServerError(rndFakeError());
  }
  return fn();
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEP_ORDER: Step[] = [
  "start", "captcha", "form", "signature",
  "email-send", "email-verify", "phone-send", "phone-verify",
  "totp-setup", "totp-verify", "done",
];

const STEP_LABELS = [
  { step: "captcha" as Step, label: "CAPTCHA", icon: <Shield className="h-3 w-3" /> },
  { step: "form" as Step, label: "Apelación", icon: <FileText className="h-3 w-3" /> },
  { step: "signature" as Step, label: "Firma", icon: <Upload className="h-3 w-3" /> },
  { step: "email-send" as Step, label: "Correo", icon: <Mail className="h-3 w-3" /> },
  { step: "phone-send" as Step, label: "Teléfono", icon: <Phone className="h-3 w-3" /> },
  { step: "totp-setup" as Step, label: "2FA", icon: <Smartphone className="h-3 w-3" /> },
  { step: "done" as Step, label: "Enviado", icon: <Check className="h-3 w-3" /> },
];

function stepIdx(s: Step) { return STEP_ORDER.indexOf(s); }
function fmt(secs: number) {
  return `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;
}
function maskEmail(e: string) {
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;
  return `${user[0]}${"*".repeat(Math.max(user.length - 2, 2))}${user.slice(-1)}@${domain[0]}${"*".repeat(Math.max(domain.length - 5, 2))}.${domain.split(".").pop()}`;
}

// ─── Shared tiny components ───────────────────────────────────────────────────

function Badge({ children, variant = "neutral" }: { children: ReactNode; variant?: "green" | "amber" | "red" | "neutral" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
      variant === "green" && "bg-[#10240b] text-[#9dff34] border border-[#9dff34]/25",
      variant === "amber" && "bg-[#211707] text-[#f0b429] border border-[#f0b429]/25",
      variant === "red" && "bg-red-950/60 text-red-300 border border-red-500/25",
      variant === "neutral" && "bg-white/6 text-white/50 border border-white/12",
    )}>{children}</span>
  );
}

// ─── OTP digit input ──────────────────────────────────────────────────────────

function OtpInput({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete?: () => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function handleChange(i: number, char: string) {
    const d = char.replace(/\D/g, "").slice(-1);
    const arr = [...digits]; arr[i] = d;
    const next = arr.join("");
    onChange(next);
    if (d && i < 5) setTimeout(() => refs.current[i + 1]?.focus(), 0);
    if (next.replace(/\s/g, "").length === 6 && d) onComplete?.();
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const arr = [...digits]; arr[i] = ""; onChange(arr.join(""));
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        const arr = [...digits]; arr[i - 1] = ""; onChange(arr.join(""));
      }
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted.padEnd(6, "").slice(0, 6)); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={cn(
            "h-14 w-11 rounded-xl border text-center text-2xl font-black tabular-nums text-white outline-none transition-all duration-150 sm:h-16 sm:w-13 sm:text-3xl",
            d
              ? "border-[#d5ff3f]/70 bg-[#0d1f09] shadow-[0_0_12px_rgba(213,255,63,0.15)] scale-105"
              : "border-white/15 bg-black/40",
            "focus:border-[#d5ff3f]/90 focus:bg-[#0d1f09] focus:shadow-[0_0_16px_rgba(213,255,63,0.2)] focus:scale-105",
          )}
        />
      ))}
    </div>
  );
}

// ─── Loading overlay ──────────────────────────────────────────────────────────

function LoadingOverlay({ visible }: { visible: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 1200);
    return () => clearInterval(id);
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black/75 backdrop-blur-sm">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#d5ff3f]/80" />
        <div className="absolute inset-2 animate-spin rounded-full border border-transparent border-t-[#d5ff3f]/30" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        <Shield className="h-6 w-6 text-[#d5ff3f]/70" />
      </div>
      <p className="text-sm font-bold text-white/60 transition-all duration-500">{LOADING_MSGS[msgIdx]}</p>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 animate-bounce rounded-full bg-[#d5ff3f]/50" style={{ animationDelay: `${i * 150}ms` }} />)}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecoverClient() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("start");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(params.get("playerName") ?? "");

  const [captchaQ, setCaptchaQ] = useState("");
  const [captchaIn, setCaptchaIn] = useState("");
  const [captchasDone, setCaptchasDone] = useState(0);
  const [captchaExpiry, setCaptchaExpiry] = useState(120);

  const [fFullName, setFFullName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fMsg, setFMsg] = useState("");

  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [sigErr, setSigErr] = useState("");
  const [sigDragging, setSigDragging] = useState(false);

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [codeSentAt, setCodeSentAt] = useState<number | null>(null);

  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpIn, setTotpIn] = useState("");
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode] = useState(() => `ERR-${Math.floor(Math.random() * 90000 + 10000)}`);
  const [fakeRetry, setFakeRetry] = useState<(() => void) | null>(null);
  const [sessionSecs, setSessionSecs] = useState(900);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([
    { role: "system", text: "Soporte en línea — Sistema de Recuperación v2.4.1" },
    { role: "bot", text: "Hola, bienvenido al soporte técnico. Conectando con el siguiente agente disponible..." },
  ]);
  const [chatIn, setChatIn] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [showTrack, setShowTrack] = useState(false);

  // captcha expiry counter
  useEffect(() => {
    if (step !== "captcha") return;
    queueMicrotask(() => setCaptchaExpiry(120));
    const id = setInterval(() => setCaptchaExpiry((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [step, captchasDone]);

  // session countdown
  useEffect(() => {
    if (step === "start" || step === "done" || sessionExpired) return;
    const id = setInterval(() => {
      setSessionSecs((s) => {
        if (s <= 1) { clearInterval(id); setSessionExpired(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, sessionExpired]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, chatTyping]);

  async function callRecover(body: Record<string, unknown>) {
    const res = await fetch("/api/mundial/ban/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (!res.ok) throw new Error((data.error as string) ?? "Error del servidor.");
    return data;
  }

  function resetToStart(msg?: string) {
    setStep("start"); setTicketId(null); setCaptchaQ(""); setCaptchaIn("");
    setCaptchasDone(0); setSigPreview(null); setEmailCode(""); setPhoneCode("");
    setTotpSecret(null); setTotpIn(""); setSessionSecs(900);
    setSessionExpired(false); setFakeRetry(null); setError(msg ?? null);
  }

  function brokenLink(e: MouseEvent) {
    e.preventDefault();
    setError("El enlace no está disponible en este momento. Intente más tarde.");
  }

  async function handleStart() {
    const name = playerName.trim();
    if (!name) { setError("Ingresa tu nombre de jugador."); return; }
    setError(null); setLoading(true);
    try {
      const d = await withFake(() => callRecover({ action: "start", playerName: name }));
      setTicketId(d.ticketId as string);
      setCaptchaQ((d.captcha as { question: string } | undefined)?.question ?? "");
      setCaptchasDone(0); setStep("captcha");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleStart()); }
      setError(err instanceof Error ? err.message : "Error.");
    } finally { setLoading(false); }
  }

  async function handleCaptcha() {
    const ans = parseInt(captchaIn, 10);
    if (isNaN(ans)) { setError("Ingresa un número."); return; }
    setError(null); setLoading(true);
    try {
      const d = await withFake(() => callRecover({ action: "captcha", ticketId, answer: ans }));
      const next = captchasDone + 1;
      setCaptchasDone(next); setCaptchaIn("");
      if (d.nextStep === "form") { setStep("form"); }
      else { setCaptchaQ((d.captcha as { question: string } | undefined)?.question ?? ""); }
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleCaptcha()); }
      setError(err instanceof Error ? err.message : "Respuesta incorrecta.");
    } finally { setLoading(false); }
  }

  async function handleForm() {
    if (!fFullName.trim() || !fEmail.trim() || !fPhone.trim()) { setError("Todos los campos son obligatorios."); return; }
    if (fMsg.trim().length < 20) { setError("El mensaje debe tener al menos 20 caracteres."); return; }
    setError(null); setLoading(true);
    try {
      await withFake(() => callRecover({ action: "form", ticketId, fullName: fFullName, email: fEmail, phone: fPhone, message: fMsg }));
      setStep("signature");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleForm()); }
      setError(err instanceof Error ? err.message : "Error guardando formulario.");
    } finally { setLoading(false); }
  }

  function handleSigFile(file: File) {
    setSigErr("");
    if (!file.type.startsWith("image/")) { setSigErr("Solo se aceptan imágenes (JPG, PNG)."); return; }
    if (file.size > 6_000_000) { setSigErr("El archivo supera 6MB."); return; }
    const r = new FileReader();
    r.onload = (e) => setSigPreview(e.target?.result as string ?? null);
    r.readAsDataURL(file);
  }

  async function handleSignature() {
    if (!sigPreview) { setError("Sube la foto de tu formulario firmado."); return; }
    setError(null); setLoading(true);
    try {
      await withFake(() => callRecover({ action: "signature", ticketId, signatureDataUrl: sigPreview }));
      setStep("email-send");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleSignature()); }
      setError(err instanceof Error ? err.message : "Error subiendo firma.");
    } finally { setLoading(false); }
  }

  async function handleSendEmailCode() {
    setError(null); setLoading(true);
    try {
      await withFake(() => callRecover({ action: "send-email-code", ticketId }));
      setCodeSentAt(Date.now()); setStep("email-verify");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleSendEmailCode()); }
      setError(err instanceof Error ? err.message : "Error enviando código.");
    } finally { setLoading(false); }
  }

  async function handleVerifyEmail() {
    if (emailCode.replace(/\s/g, "").length !== 6) { setError("El código debe tener 6 dígitos."); return; }
    setError(null); setLoading(true);
    try {
      await withFake(() => callRecover({ action: "verify-email", ticketId, code: emailCode.replace(/\s/g, "") }), 0.3);
      setStep("phone-send");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleVerifyEmail()); }
      setError(err instanceof Error ? err.message : "Código incorrecto o expirado.");
    } finally { setLoading(false); }
  }

  async function handleSendPhoneCode() {
    setError(null); setLoading(true);
    try {
      await withFake(() => callRecover({ action: "send-phone-code", ticketId }));
      setCodeSentAt(Date.now()); setStep("phone-verify");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleSendPhoneCode()); }
      setError(err instanceof Error ? err.message : "Error enviando código.");
    } finally { setLoading(false); }
  }

  async function handleVerifyPhone() {
    if (phoneCode.replace(/\s/g, "").length !== 6) { setError("El código debe tener 6 dígitos."); return; }
    setError(null); setLoading(true);
    try {
      await withFake(() => callRecover({ action: "verify-phone", ticketId, code: phoneCode.replace(/\s/g, "") }), 0.3);
      const d = await callRecover({ action: "get-totp", ticketId });
      setTotpSecret(d.secret as string ?? null);
      setStep("totp-setup");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleVerifyPhone()); }
      setError(err instanceof Error ? err.message : "Código incorrecto o expirado.");
    } finally { setLoading(false); }
  }

  async function handleVerifyTotp() {
    if (totpIn.replace(/\s/g, "").length !== 6) { setError("El código TOTP debe tener 6 dígitos."); return; }
    setError(null); setLoading(true);
    try {
      await withFake(() => callRecover({ action: "verify-totp", ticketId, code: totpIn.replace(/\s/g, "") }), 0.3);
      setStep("done");
    } catch (err) {
      if (err instanceof FakeServerError) { setFakeRetry(() => () => void handleVerifyTotp()); }
      setError(err instanceof Error ? err.message : "Código TOTP incorrecto. Sincronice su reloj e intente de nuevo.");
    } finally { setLoading(false); }
  }

  async function sendChatMsg() {
    const text = chatIn.trim(); if (!text) return;
    setChatIn("");
    setChatMsgs((m) => [...m, { role: "user", text }]);
    setChatTyping(true);
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000));
    setChatTyping(false);
    setChatMsgs((m) => [...m, { role: "bot", text: BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)] }]);
  }

  if (sessionExpired) return <SessionExpired onRestart={() => resetToStart("Su sesión expiró. Debe reiniciar el proceso completamente desde el principio.")} />;
  if (showTrack) return <TrackView ticketId={ticketId} onBack={() => setShowTrack(false)} />;

  const curStepIdx = stepIdx(step);
  const totalDisplaySteps = STEP_LABELS.length;
  const doneDisplaySteps = STEP_LABELS.filter((s) => curStepIdx > stepIdx(s.step)).length;
  const progressPct = step === "done" ? 100 : Math.round((doneDisplaySteps / totalDisplaySteps) * 100);

  return (
    <div className="relative min-h-screen bg-[#040b06] text-white [background-image:radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(157,255,52,0.06),transparent)]">
      <LoadingOverlay visible={loading} />

      {/* Top security bar */}
      <div className="border-b border-white/8 bg-black/60 px-4 py-2 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[#9dff34]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Sistema de Recuperación</span>
            <Badge variant="neutral">v2.4.1</Badge>
          </div>
          {step !== "start" && step !== "done" && (
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black",
              sessionSecs < 120 ? "bg-red-950/80 text-red-300 animate-pulse"
              : sessionSecs < 300 ? "bg-amber-950/70 text-amber-300"
              : "bg-white/5 text-white/35"
            )}>
              <Clock className="h-3 w-3" />
              {fmt(sessionSecs)}
              {sessionSecs < 300 && <span className="hidden sm:inline"> — SESIÓN EXPIRA PRONTO</span>}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pb-24 pt-8">

        {/* Header */}
        <div className="mb-7 flex items-start gap-3">
          <Link
            href="/mundial/banned"
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/40 text-white/40 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-white">Recuperación de cuenta</h1>
              {ticketId && <Badge variant="neutral">#{ticketId.slice(0, 8).toUpperCase()}</Badge>}
            </div>
            <p className="text-xs text-white/35">Proceso de verificación de identidad completa · Protegido con cifrado TLS 1.3</p>
          </div>
        </div>

        {/* Progress bar */}
        {step !== "start" && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/30">
                Progreso de recuperación
              </span>
              <span className="text-[10px] font-black tabular-nums text-[#d5ff3f]">{progressPct}% completado</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#9dff34] to-[#d5ff3f] transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 flex items-start gap-0.5 overflow-x-auto pb-1">
              {STEP_LABELS.map((s, i) => {
                const sIdx = stepIdx(s.step);
                const done = curStepIdx > sIdx;
                const realActive = curStepIdx >= sIdx && curStepIdx < sIdx + 2;
                return (
                  <div key={s.step} className="flex shrink-0 flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                    <div className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black transition-all",
                      done ? "border-[#9dff34]/50 bg-[#0d1f09] text-[#9dff34] shadow-[0_0_8px_rgba(157,255,52,0.3)]"
                      : realActive ? "border-[#d5ff3f]/70 bg-[#111f08] text-[#d5ff3f] shadow-[0_0_12px_rgba(213,255,63,0.25)] scale-110"
                      : "border-white/10 bg-black/35 text-white/25"
                    )}>
                      {done ? <Check className="h-3 w-3" /> : s.icon}
                    </div>
                    <span className={cn(
                      "mt-1 hidden text-center text-[9px] font-black leading-tight sm:block",
                      done ? "text-[#9dff34]/70" : realActive ? "text-[#d5ff3f]" : "text-white/20"
                    )}>{s.label}</span>
                    {i < STEP_LABELS.length - 1 && (
                      <div className={cn("absolute hidden")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning banner */}
        {step !== "start" && step !== "done" && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-950/15 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/60" />
            <p className="text-xs text-amber-200/55 leading-relaxed">
              <strong className="text-amber-200/80">Sesión sin respaldo:</strong> Si cierra esta pestaña o la sesión expira, deberá reiniciar el proceso completamente desde el principio. No se guarda ningún progreso.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/25 bg-red-950/25 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-500/25 bg-red-950/40">
                <WifiOff className="h-4 w-4 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-black text-red-200">{error}</p>
                </div>
                <p className="text-[10px] text-red-400/50 font-mono">{errorCode} · Referencia de error</p>
                {fakeRetry && (
                  <button
                    type="button"
                    onClick={() => { setError(null); const fn = fakeRetry; setFakeRetry(null); fn(); }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-500/35 bg-red-900/30 px-3 py-1.5 text-xs font-black text-red-200 transition hover:bg-red-900/55 active:scale-95"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reintentar solicitud
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        {step === "start" && <StartStep playerName={playerName} onName={setPlayerName} onSubmit={() => void handleStart()} loading={loading} onBroken={brokenLink} />}
        {step === "captcha" && <CaptchaStep question={captchaQ} value={captchaIn} onChange={setCaptchaIn} onSubmit={() => void handleCaptcha()} loading={loading} done={captchasDone} total={3} expiry={captchaExpiry} />}
        {step === "form" && <FormStep fFullName={fFullName} setFFullName={setFFullName} fEmail={fEmail} setFEmail={setFEmail} fPhone={fPhone} setFPhone={setFPhone} fMsg={fMsg} setFMsg={setFMsg} onSubmit={() => void handleForm()} loading={loading} onBroken={brokenLink} />}
        {step === "signature" && <SigStep sigPreview={sigPreview} sigErr={sigErr} dragging={sigDragging} setDragging={setSigDragging} onFile={handleSigFile} onSubmit={() => void handleSignature()} loading={loading} onBroken={brokenLink} />}
        {step === "email-send" && <EmailSendStep email={fEmail} onSend={() => void handleSendEmailCode()} loading={loading} />}
        {step === "email-verify" && (
          <CodeVerifyStep
            title="Verificación de correo electrónico"
            icon={<Mail className="h-5 w-5" />}
            destination={maskEmail(fEmail) || "tu correo"}
            value={emailCode} onChange={setEmailCode}
            onSubmit={() => void handleVerifyEmail()} onResend={() => void handleSendEmailCode()}
            loading={loading} codeSentAt={codeSentAt}
          />
        )}
        {step === "phone-send" && <PhoneSendStep phone={fPhone} email={fEmail} onSend={() => void handleSendPhoneCode()} loading={loading} />}
        {step === "phone-verify" && (
          <CodeVerifyStep
            title="Verificación de número de teléfono"
            icon={<Phone className="h-5 w-5" />}
            destination={maskEmail(fEmail) || "tu correo"}
            value={phoneCode} onChange={setPhoneCode}
            onSubmit={() => void handleVerifyPhone()} onResend={() => void handleSendPhoneCode()}
            loading={loading} codeSentAt={codeSentAt}
          />
        )}
        {step === "totp-setup" && (
          <TotpSetupStep
            secret={totpSecret} copied={copied}
            onCopy={() => { if (totpSecret) { void navigator.clipboard.writeText(totpSecret); setCopied(true); setTimeout(() => setCopied(false), 2000); } }}
            onContinue={() => setStep("totp-verify")}
            onBroken={brokenLink}
          />
        )}
        {step === "totp-verify" && <TotpVerifyStep value={totpIn} onChange={setTotpIn} onSubmit={() => void handleVerifyTotp()} loading={loading} />}
        {step === "done" && <DoneStep ticketId={ticketId} onTrack={() => setShowTrack(true)} onBroken={brokenLink} />}

        {/* Footer links */}
        {step !== "start" && step !== "done" && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5 border-t border-white/6 pt-6">
            <button onClick={brokenLink} className="flex items-center gap-1.5 text-[10px] font-bold text-white/20 hover:text-white/40 transition"><HelpCircle className="h-3 w-3" />Centro de ayuda</button>
            <button onClick={brokenLink} className="flex items-center gap-1.5 text-[10px] font-bold text-white/20 hover:text-white/40 transition"><FileText className="h-3 w-3" />Política de privacidad</button>
            <button onClick={brokenLink} className="flex items-center gap-1.5 text-[10px] font-bold text-white/20 hover:text-white/40 transition"><Lock className="h-3 w-3" />Seguridad</button>
            <span className="text-[10px] text-white/12">© 2026 La Vieja Adventures</span>
          </div>
        )}
      </div>

      {/* Floating chat */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {showChat && (
          <div className="flex w-80 flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#080f0a] shadow-[0_32px_100px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3 border-b border-white/8 bg-[#0c1f10] px-4 py-3">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#9dff34]/30 bg-[#10240b]">
                <Wifi className="h-3.5 w-3.5 text-[#9dff34]" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 animate-pulse rounded-full border border-[#080f0a] bg-[#9dff34]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white">Soporte Técnico</p>
                <p className="text-[10px] text-[#9dff34]/70">● En línea — Tiempo de espera: 4h 32m</p>
              </div>
              <button type="button" onClick={() => setShowChat(false)} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-white/35 hover:text-white transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="h-60 space-y-2 overflow-y-auto p-3">
              {chatMsgs.map((m, i) => (
                <div key={i} className={cn(
                  "max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  m.role === "system" ? "mx-auto rounded-md text-center text-white/25 text-[10px] bg-white/4 border border-white/8"
                  : m.role === "user" ? "ml-auto rounded-br-sm bg-[#10240b] text-white"
                  : "rounded-bl-sm bg-white/5 text-white/65"
                )}>{m.text}</div>
              ))}
              {chatTyping && (
                <div className="flex w-16 items-center gap-1 rounded-2xl rounded-bl-sm bg-white/5 px-3 py-2.5">
                  {[0, 150, 300].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 border-t border-white/8 p-2.5">
              <input
                type="text" value={chatIn}
                onChange={(e) => setChatIn(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void sendChatMsg(); }}
                placeholder="Escribe un mensaje..."
                className="h-9 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/25"
              />
              <button type="button" onClick={() => void sendChatMsg()} className="grid h-9 w-9 place-items-center rounded-xl bg-[#0d1f09] text-[#d5ff3f] hover:bg-[#142a10] transition active:scale-95">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowChat((v) => !v)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#0b1f10] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition hover:border-[#d5ff3f]/35 hover:bg-[#101f13] active:scale-95"
        >
          {showChat ? <X className="h-5 w-5 text-white/60" /> : <MessageCircle className="h-5 w-5 text-white/60" />}
          {!showChat && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-[#080f0a] bg-[#9dff34]" />}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-steps ────────────────────────────────────────────────────────────────

function StartStep({ playerName, onName, onSubmit, loading, onBroken }: {
  playerName: string; onName: (v: string) => void; onSubmit: () => void; loading: boolean; onBroken: (e: MouseEvent) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/15 bg-gradient-to-b from-red-950/25 to-black/40 p-7 text-center">
        <div className="absolute inset-0 [background-image:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(239,68,68,0.12),transparent)]" />
        <div className="relative">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/10" />
            <div className="absolute inset-2 rounded-full border border-red-500/20 bg-red-950/50" />
            <ShieldOff className="relative h-9 w-9 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white">Cuenta suspendida</h2>
          <p className="mt-2 text-sm text-white/45 leading-relaxed">
            Para recuperar el acceso debes completar el proceso de verificación de identidad. Este proceso es <strong className="text-white/65">obligatorio</strong> y no tiene atajos.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="red">Acceso bloqueado</Badge>
            <Badge variant="amber">~20-25 min</Badge>
            <Badge variant="neutral">7 pasos</Badge>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-4">
        <p className="text-xs font-black uppercase tracking-wider text-white/40">Necesitarás tener a mano</p>
        <div className="space-y-2.5">
          {[
            { icon: <User className="h-4 w-4" />, text: "Tu nombre exacto en la quiniela" },
            { icon: <FileText className="h-4 w-4" />, text: "Documento de identidad (para el formulario)" },
            { icon: <Mail className="h-4 w-4" />, text: "Acceso a tu correo electrónico" },
            { icon: <Phone className="h-4 w-4" />, text: "Tu número de teléfono celular" },
            { icon: <Smartphone className="h-4 w-4" />, text: "Un teléfono con Google Authenticator" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/35">{icon}</div>
              <span className="text-sm text-white/55">{text}</span>
              <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/15" />
            </div>
          ))}
        </div>
      </div>

      {/* Input + CTA */}
      <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/40">Nombre de jugador (exacto, sensible a mayúsculas)</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              type="text" value={playerName} onChange={(e) => onName(e.target.value)}
              placeholder="Tu nombre en la quiniela"
              onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
              className="h-12 w-full rounded-xl border border-white/15 bg-black/40 pl-10 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-[#d5ff3f]/60 focus:ring-4 focus:ring-[#d5ff3f]/8 transition"
            />
          </div>
        </div>
        <button
          type="button" onClick={onSubmit} disabled={loading || !playerName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d5ff3f]/20 bg-[#0d1f09] py-3.5 text-sm font-black text-[#d5ff3f] transition hover:border-[#d5ff3f]/40 hover:bg-[#111f0d] disabled:opacity-40 active:scale-[0.99]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          {loading ? "Verificando..." : "Iniciar proceso de recuperación"}
        </button>
      </div>

      {/* Broken resources */}
      <div className="rounded-xl border border-white/6 bg-black/20 p-4 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-white/20">Recursos de referencia</p>
        {[
          { icon: <FileText className="h-3.5 w-3.5" />, label: "Política de suspensión de cuentas" },
          { icon: <Download className="h-3.5 w-3.5" />, label: "Formulario oficial de apelación (PDF)" },
          { icon: <HelpCircle className="h-3.5 w-3.5" />, label: "Preguntas frecuentes — Recuperación de cuenta" },
        ].map(({ icon, label }) => (
          <button key={label} type="button" onClick={onBroken} className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-xs text-white/25 hover:text-white/45 transition">
            <span className="text-white/20">{icon}</span>{label}
            <span className="ml-auto flex items-center gap-1 text-[10px] text-red-400/50"><span className="h-1.5 w-1.5 rounded-full bg-red-400/50" />No disponible</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CaptchaStep({ question, value, onChange, onSubmit, loading, done, total, expiry }: {
  question: string; value: string; onChange: (v: string) => void; onSubmit: () => void;
  loading: boolean; done: number; total: number; expiry: number;
}) {
  const challengeId = useMemo(() => `CHK-${question.length}-${done + 1}`, [done, question]);
  return (
    <div className="space-y-3">
      {/* Widget header */}
      <div className="flex items-center justify-between rounded-t-2xl border border-b-0 border-white/10 bg-black/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#d5ff3f]" />
          <span className="text-xs font-black text-white/70">Verificación de seguridad</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={expiry < 30 ? "red" : "amber"}>
            <Clock className="h-2.5 w-2.5" />
            {fmt(expiry)}
          </Badge>
        </div>
      </div>

      <div className="rounded-b-2xl border border-t-0 border-white/10 bg-black/35 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Prueba anti-robot · {done + 1} de {total}</p>
            <p className="mt-0.5 text-xs text-white/35">Un error reinicia el contador desde el principio</p>
          </div>
          <span className="text-[10px] font-mono text-white/20">{challengeId}</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={cn(
                "h-7 w-7 rounded-full border flex items-center justify-center text-[10px] font-black transition-all",
                i < done ? "border-[#9dff34]/50 bg-[#0d1f09] text-[#9dff34] shadow-[0_0_8px_rgba(157,255,52,0.3)]"
                : i === done ? "border-[#d5ff3f]/70 bg-[#111f08] text-[#d5ff3f] shadow-[0_0_10px_rgba(213,255,63,0.2)] scale-110"
                : "border-white/12 bg-black/30 text-white/20"
              )}>
                {i < done ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn("text-[9px] font-black", i < done ? "text-[#9dff34]/60" : i === done ? "text-[#d5ff3f]/70" : "text-white/15")}>
                {i < done ? "OK" : i === done ? "Activo" : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Challenge */}
        <div className="relative overflow-hidden rounded-xl border border-[#d5ff3f]/15 bg-gradient-to-br from-[#0d1f09] to-black/60 px-8 py-8 text-center">
          <div className="absolute inset-0 [background-image:repeating-linear-gradient(45deg,rgba(213,255,63,0.015)_0px,rgba(213,255,63,0.015)_1px,transparent_1px,transparent_8px)]" />
          <p className="relative text-4xl font-black tracking-wide text-[#d5ff3f] font-mono">{question || "Cargando..."}</p>
          <p className="relative mt-1 text-[10px] text-white/25">Operación aritmética</p>
        </div>

        {/* Answer */}
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-white/35">Resultado</label>
          <input
            type="number" value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="Ingresa el resultado..."
            onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
            className="h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-center text-xl font-black tabular-nums text-white outline-none focus:border-[#d5ff3f]/60 focus:ring-4 focus:ring-[#d5ff3f]/8 transition"
          />
        </div>

        <button
          type="button" onClick={onSubmit} disabled={loading || !value}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] disabled:opacity-45 transition active:scale-[0.99]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {loading ? "Verificando respuesta..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

const INPUT_CLS = "h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-[#d5ff3f]/60 focus:ring-4 focus:ring-[#d5ff3f]/8 transition";

function FieldRow({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white/35">
        <span className="text-white/20">{icon}</span>{label}
      </label>
      {children}
    </div>
  );
}

function FormStep({ fFullName, setFFullName, fEmail, setFEmail, fPhone, setFPhone, fMsg, setFMsg, onSubmit, loading, onBroken }: {
  fFullName: string; setFFullName: (v: string) => void; fEmail: string; setFEmail: (v: string) => void;
  fPhone: string; setFPhone: (v: string) => void; fMsg: string; setFMsg: (v: string) => void;
  onSubmit: () => void; loading: boolean; onBroken: (e: MouseEvent) => void;
}) {
  const msgLen = fMsg.trim().length;
  const msgOk = msgLen >= 20;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-5">
        <div className="border-b border-white/8 pb-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Paso 2 de 7 — Formulario de apelación</p>
          <h2 className="mt-1 text-lg font-black text-white">Datos de identificación personal</h2>
          <p className="mt-1 text-xs text-white/40 leading-relaxed">Todos los campos son requeridos y deben coincidir con su documento de identidad oficial.</p>
        </div>

        <div className="space-y-4">
          <FieldRow label="Nombre completo (según cédula o pasaporte)" icon={<User className="h-3.5 w-3.5" />}>
            <input type="text" value={fFullName} onChange={(e) => setFFullName(e.target.value)} placeholder="Nombre Apellido Apellido" className={INPUT_CLS} />
          </FieldRow>
          <FieldRow label="Correo electrónico de contacto" icon={<Mail className="h-3.5 w-3.5" />}>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
              <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="correo@ejemplo.com" className={cn(INPUT_CLS, "pl-10")} />
            </div>
          </FieldRow>
          <FieldRow label="Número de teléfono (con código de país)" icon={<Phone className="h-3.5 w-3.5" />}>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
              <input type="tel" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="+506 8888-8888" className={cn(INPUT_CLS, "pl-10")} />
            </div>
          </FieldRow>
          <FieldRow label={`Motivo de la apelación`} icon={<FileText className="h-3.5 w-3.5" />}>
            <div className="relative">
              <textarea
                value={fMsg} onChange={(e) => setFMsg(e.target.value)} rows={5}
                placeholder="Explica detalladamente por qué consideras que tu cuenta fue suspendida por error..."
                className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/20 focus:border-[#d5ff3f]/60 focus:ring-4 focus:ring-[#d5ff3f]/8 transition"
              />
              <div className={cn(
                "absolute bottom-3 right-3 text-[10px] font-black tabular-nums transition",
                msgOk ? "text-[#9dff34]" : msgLen > 0 ? "text-amber-400" : "text-white/20"
              )}>
                {msgLen}/20 mín.
                {msgOk && <Check className="ml-1 inline h-3 w-3" />}
              </div>
            </div>
          </FieldRow>
        </div>

        <button
          type="button" onClick={onSubmit} disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] disabled:opacity-45 transition active:scale-[0.99]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
          {loading ? "Guardando datos..." : "Guardar y continuar"}
        </button>
      </div>

      <p className="text-center text-[10px] text-white/18 leading-relaxed">
        Al continuar acepta la{" "}
        <button onClick={onBroken} className="underline hover:text-white/35 transition">Política de Privacidad</button>
        {" "}y los{" "}
        <button onClick={onBroken} className="underline hover:text-white/35 transition">Términos de Servicio</button>.{" "}
        El proceso de revisión puede tomar entre 5 y 15 días hábiles.
      </p>
    </div>
  );
}

function SigStep({ sigPreview, sigErr, dragging, setDragging, onFile, onSubmit, loading, onBroken }: {
  sigPreview: string | null; sigErr: string; dragging: boolean; setDragging: (v: boolean) => void;
  onFile: (f: File) => void; onSubmit: () => void; loading: boolean; onBroken: (e: MouseEvent) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) onFile(f);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-5">
      <div className="border-b border-white/8 pb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Paso 3 de 7 — Firma física</p>
        <h2 className="mt-1 text-lg font-black text-white">Formulario impreso y firmado</h2>
        <p className="mt-1 text-xs text-white/40">Este paso requiere imprimir un formulario, firmarlo a mano y fotografiarlo.</p>
      </div>

      {/* Instruction steps */}
      <div className="space-y-2.5">
        {[
          {
            n: 1,
            content: (
              <>Descargue el{" "}
                <button onClick={onBroken} className="font-black text-[#d5ff3f] underline decoration-dotted underline-offset-2">formulario oficial (PDF)</button>
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-red-400/60"><span className="h-1.5 w-1.5 rounded-full bg-red-400/50" />En mantenimiento</span>
              </>
            ),
          },
          { n: 2, content: "Imprima el formulario y llénelo a mano con tinta azul o negra. No se aceptan copias digitales." },
          { n: 3, content: "Firme en el espacio indicado. La firma debe coincidir exactamente con su documento de identidad." },
          { n: 4, content: "Tome una fotografía clara del documento completo bajo buena iluminación y súbala abajo." },
        ].map(({ n, content }) => (
          <div key={n} className="flex items-start gap-3 rounded-xl border border-white/6 bg-black/20 px-4 py-3">
            <span className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
              "border border-white/15 bg-white/6 text-white/45"
            )}>{n}</span>
            <span className="text-xs text-white/50 leading-relaxed">{content}</span>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <div
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all",
            dragging ? "border-[#d5ff3f]/60 bg-[#0d1f09]/60 scale-[1.01]"
            : sigPreview ? "border-[#9dff34]/35 bg-[#0a1a08]/60"
            : "border-white/12 bg-black/20 hover:border-white/25 hover:bg-white/3"
          )}
        >
          {sigPreview ? (
            <div>
              <div className="relative mb-3 mx-auto w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sigPreview} alt="Firma" className="max-h-44 rounded-lg object-contain ring-2 ring-[#9dff34]/25" />
                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#9dff34]/40 bg-[#0d1f09]">
                  <Check className="h-3.5 w-3.5 text-[#9dff34]" />
                </div>
              </div>
              <p className="text-xs font-black text-[#9dff34]">Imagen cargada correctamente</p>
              <p className="mt-0.5 text-[10px] text-white/30">Haz clic para cambiar</p>
            </div>
          ) : (
            <div className="py-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Upload className="h-5 w-5 text-white/30" />
              </div>
              <p className="text-sm font-black text-white/50">{dragging ? "Suelta aquí" : "Haz clic o arrastra tu imagen"}</p>
              <p className="mt-1 text-[10px] text-white/25">JPG / PNG · máx. 6MB · Fondo claro recomendado</p>
            </div>
          )}
        </div>
        {sigErr && <p className="mt-2 text-xs font-bold text-red-300">{sigErr}</p>}
      </div>

      <button
        type="button" onClick={onSubmit} disabled={loading || !sigPreview}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] disabled:opacity-45 transition active:scale-[0.99]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {loading ? "Subiendo documento..." : "Subir formulario firmado"}
      </button>
    </div>
  );
}

function EmailSendStep({ email, onSend, loading }: { email: string; onSend: () => void; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-5">
      <div className="border-b border-white/8 pb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Paso 4 de 7 — Verificación de correo</p>
        <h2 className="mt-1 text-lg font-black text-white">Confirmar correo electrónico</h2>
      </div>
      <div className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-black/30 px-5 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Mail className="h-5 w-5 text-white/40" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/35">Código se enviará a</p>
          <p className="mt-0.5 text-base font-black text-white">{email || "—"}</p>
        </div>
        <div className="absolute right-4 top-4">
          <Badge variant="green">Verificado</Badge>
        </div>
      </div>
      <div className="rounded-xl border border-white/8 bg-black/20 p-4 space-y-1.5">
        {[
          "El código tiene 6 dígitos y expira en 15 minutos.",
          "Revisa también la carpeta de spam o correo no deseado.",
          "No compartas el código con nadie.",
        ].map((t, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-white/35">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />{t}
          </div>
        ))}
      </div>
      <button
        type="button" onClick={onSend} disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] disabled:opacity-45 transition active:scale-[0.99]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Enviando código..." : "Enviar código de verificación"}
      </button>
    </div>
  );
}

function PhoneSendStep({ phone, email, onSend, loading }: { phone: string; email: string; onSend: () => void; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-5">
      <div className="border-b border-white/8 pb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Paso 5 de 7 — Verificación de teléfono</p>
        <h2 className="mt-1 text-lg font-black text-white">Confirmar número de teléfono</h2>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/30 px-5 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Phone className="h-5 w-5 text-white/40" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/35">Teléfono a verificar</p>
          <p className="mt-0.5 text-base font-black text-white">{phone || "—"}</p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/15 bg-amber-950/15 px-4 py-3.5">
        <Mail className="h-4 w-4 shrink-0 mt-0.5 text-amber-400/60" />
        <p className="text-xs text-amber-200/60 leading-relaxed">Por razones de seguridad, el código de verificación de teléfono se enviará a <strong className="text-amber-200/80">{email || "tu correo"}</strong> y no por SMS.</p>
      </div>
      <button
        type="button" onClick={onSend} disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] disabled:opacity-45 transition active:scale-[0.99]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Enviando código..." : "Enviar código al correo"}
      </button>
    </div>
  );
}

function CodeVerifyStep({ title, destination, icon, value, onChange, onSubmit, onResend, loading, codeSentAt }: {
  title: string; destination: string; icon: ReactNode; value: string;
  onChange: (v: string) => void; onSubmit: () => void; onResend: () => void;
  loading: boolean; codeSentAt: number | null;
}) {
  const [cooldown, setCooldown] = useState(60);
  const [codeAge, setCodeAge] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (!codeSentAt) return;
      const elapsed = Math.floor((Date.now() - codeSentAt) / 1000);
      setCooldown(Math.max(0, 60 - elapsed));
      setCodeAge(elapsed);
    }, 1000);
    return () => clearInterval(id);
  }, [codeSentAt]);

  const codeExpiresSecs = 900 - codeAge;
  const filled = value.replace(/\s/g, "").length;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-6">
      <div className="border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/40 text-white/45">{icon}</div>
          <div>
            <h2 className="text-base font-black text-white">{title}</h2>
            <p className="text-xs text-white/35">Código enviado a <strong className="text-white/55">{destination}</strong></p>
          </div>
        </div>
      </div>

      {/* OTP input */}
      <div className="space-y-3">
        <p className="text-center text-xs font-black uppercase tracking-wider text-white/30">Ingresa el código de 6 dígitos</p>
        <OtpInput value={value} onChange={onChange} onComplete={onSubmit} />
        {/* Fill indicator */}
        <div className="flex justify-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn("h-0.5 w-8 rounded-full transition-all", i < filled ? "bg-[#d5ff3f]/80" : "bg-white/10")} />
          ))}
        </div>
      </div>

      {/* Expiry */}
      {codeSentAt && (
        <div className={cn(
          "flex items-center justify-center gap-1.5 text-xs font-bold",
          codeExpiresSecs < 120 ? "text-red-400" : "text-white/30"
        )}>
          <Clock className="h-3 w-3" />
          {codeExpiresSecs > 0 ? `Código expira en ${fmt(codeExpiresSecs)}` : "Código expirado — reenvía uno nuevo"}
        </div>
      )}

      <button
        type="button" onClick={onSubmit} disabled={loading || filled !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] disabled:opacity-45 transition active:scale-[0.99]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {loading ? "Verificando..." : "Verificar código"}
      </button>

      <div className="text-center">
        <span className="text-[10px] text-white/25">¿No recibiste el código? </span>
        <button
          type="button" onClick={onResend} disabled={cooldown > 0 || loading}
          className="text-[10px] font-black text-white/40 underline underline-offset-2 hover:text-white/65 disabled:opacity-30 disabled:no-underline disabled:cursor-not-allowed transition"
        >
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
        </button>
      </div>
    </div>
  );
}

function FakeQR() {
  const pattern = useMemo(() => {
    return Array.from({ length: 121 }, (_, i) => {
      const x = Math.sin(i * 127.1 + 31) * 43758.5;
      return (x - Math.floor(x)) > 0.42;
    });
  }, []);
  return (
    <div className="relative mx-auto h-36 w-36 rounded-xl border-2 border-[#d5ff3f]/25 bg-[#0a1a08] p-2">
      {/* Corner markers */}
      {[
        "top-2 left-2", "top-2 right-2", "bottom-2 left-2",
      ].map((pos) => (
        <div key={pos} className={cn("absolute h-7 w-7 rounded border-2 border-[#d5ff3f]/60", pos)} />
      ))}
      {/* QR cells */}
      <div className="grid h-full w-full grid-cols-11 gap-[1.5px] p-4">
        {pattern.map((on, i) => (
          <div key={i} className={cn("rounded-[1px]", on ? "bg-[#d5ff3f]/70" : "bg-transparent")} />
        ))}
      </div>
    </div>
  );
}

function TotpSetupStep({ secret, copied, onCopy, onContinue, onBroken }: {
  secret: string | null; copied: boolean; onCopy: () => void; onContinue: () => void; onBroken: (e: MouseEvent) => void;
}) {
  const formatted = secret?.match(/.{1,4}/g)?.join(" ") ?? "";
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-5">
      <div className="border-b border-white/8 pb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Paso 6 de 7 — Autenticador 2FA</p>
        <h2 className="mt-1 text-lg font-black text-white">Configurar Google Authenticator</h2>
        <p className="mt-1 text-xs text-white/40">Agrega una capa adicional de seguridad a tu cuenta.</p>
      </div>

      {/* QR + Steps side by side on wide, stacked on mobile */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2 sm:shrink-0">
          <FakeQR />
          <p className="text-[10px] text-white/25">Escanea con la app</p>
          <div className="flex gap-2">
            <button onClick={onBroken} className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black text-white/30 hover:text-white/50 transition">
              <Smartphone className="h-2.5 w-2.5" /> App Store
              <span className="ml-1 text-red-400/50">↑</span>
            </button>
            <button onClick={onBroken} className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black text-white/30 hover:text-white/50 transition">
              <Smartphone className="h-2.5 w-2.5" /> Play Store
              <span className="ml-1 text-red-400/50">↑</span>
            </button>
          </div>
        </div>

        <ol className="flex-1 space-y-3 text-xs text-white/50">
          {[
            <><strong className="text-white/75">Descarga</strong> Google Authenticator en iOS o Android.</>,
            <>Toca <strong className="text-white/75">&quot;+&quot;</strong> → <em className="text-white/70">&quot;Ingresar clave de configuración&quot;</em>.</>,
            <>Escanea el código QR <strong className="text-white/75">o copia la clave</strong> de abajo.</>,
            <>La app generará códigos nuevos <strong className="text-white/75">cada 30 segundos</strong>.</>,
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/6 text-[10px] font-black">{i + 1}</span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Secret key */}
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/35">Clave secreta (alternativa al QR)</p>
        <div className="group flex items-center gap-2 rounded-xl border border-[#d5ff3f]/20 bg-[#0a1a08] px-4 py-3">
          <code className="min-w-0 flex-1 break-all font-mono text-sm font-black tracking-[0.2em] text-[#d5ff3f]">
            {formatted || "Cargando..."}
          </code>
          <button
            type="button" onClick={onCopy}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition",
              copied ? "border-[#9dff34]/50 bg-[#0d1f09] text-[#9dff34]" : "border-[#d5ff3f]/25 bg-black/35 text-[#d5ff3f] hover:border-[#d5ff3f]/50"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-white/25 leading-relaxed">Guarda esta clave en un lugar seguro. Si pierdes el autenticador, no podrás recuperar el acceso.</p>
      </div>

      <button
        type="button" onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] transition active:scale-[0.99]"
      >
        <Check className="h-4 w-4" />
        Ya configuré el autenticador — continuar
      </button>
    </div>
  );
}

function TotpVerifyStep({ value, onChange, onSubmit, loading }: { value: string; onChange: (v: string) => void; onSubmit: () => void; loading: boolean }) {
  const [totpSecs, setTotpSecs] = useState(30);
  useEffect(() => {
    queueMicrotask(() => setTotpSecs(30 - (Math.floor(Date.now() / 1000) % 30)));
    const id = setInterval(() => setTotpSecs(30 - (Math.floor(Date.now() / 1000) % 30)), 1000);
    return () => clearInterval(id);
  }, []);
  const pct = (totpSecs / 30) * 100;
  const filled = value.replace(/\s/g, "").length;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-6">
      <div className="border-b border-white/8 pb-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Paso 7 de 7 — Código TOTP</p>
        <h2 className="mt-1 text-lg font-black text-white">Verificación del autenticador</h2>
      </div>

      {/* TOTP timer ring */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={totpSecs < 8 ? "#f87171" : "#d5ff3f"}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="text-center">
            <p className={cn("text-2xl font-black tabular-nums leading-none", totpSecs < 8 ? "text-red-400" : "text-[#d5ff3f]")}>{totpSecs}</p>
            <p className="text-[9px] text-white/30">segs.</p>
          </div>
        </div>
        <p className="text-xs text-white/40">Abre Google Authenticator — el código cambia cada 30 segundos</p>
      </div>

      <div className="space-y-3">
        <p className="text-center text-xs font-black uppercase tracking-wider text-white/30">Código de 6 dígitos</p>
        <OtpInput value={value} onChange={onChange} onComplete={onSubmit} />
        <div className="flex justify-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn("h-0.5 w-8 rounded-full transition-all", i < filled ? "bg-[#d5ff3f]/80" : "bg-white/10")} />
          ))}
        </div>
      </div>

      <button
        type="button" onClick={onSubmit} disabled={loading || filled !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d5ff3f] py-3.5 text-sm font-black text-[#06110b] hover:bg-[#e8ff6a] disabled:opacity-45 transition active:scale-[0.99]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
        {loading ? "Verificando con servidor seguro..." : "Verificar y enviar solicitud final"}
      </button>

      <div className="rounded-xl border border-amber-500/12 bg-amber-950/12 px-4 py-3">
        <p className="text-[10px] text-amber-200/50 leading-relaxed">Si el código no es aceptado: asegúrese de que la hora de su dispositivo esté sincronizada automáticamente con el servidor de tiempo.</p>
      </div>
    </div>
  );
}

function DoneStep({ ticketId, onTrack, onBroken }: { ticketId: string | null; onTrack: () => void; onBroken: (e: MouseEvent) => void }) {
  const [copiedId, setCopiedId] = useState(false);
  function copyTicket() {
    if (ticketId) { void navigator.clipboard.writeText(ticketId); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[#9dff34]/15 bg-gradient-to-b from-[#0d2010] to-black/40 p-8 text-center">
        <div className="absolute inset-0 [background-image:radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(157,255,52,0.1),transparent)]" />
        <div className="relative">
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#9dff34]/8 animate-pulse" />
            <div className="absolute inset-2 rounded-full border border-[#9dff34]/20 bg-[#0d1f09]" />
            <CheckCircle2 className="relative h-9 w-9 text-[#9dff34]" />
          </div>
          <Badge variant="green">Proceso completado</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">Solicitud enviada</h2>
          <p className="mt-2 text-sm text-white/45 leading-relaxed max-w-xs mx-auto">Tu solicitud de recuperación ha sido enviada y está en la cola de revisión del equipo de seguridad.</p>
        </div>
      </div>

      {/* Ticket */}
      {ticketId && (
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-white/35">Número de caso — guárdalo</p>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3.5">
            <code className="min-w-0 flex-1 break-all font-mono text-sm font-black text-white">{ticketId}</code>
            <button type="button" onClick={copyTicket} className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition", copiedId ? "border-[#9dff34]/40 bg-[#0d1f09] text-[#9dff34]" : "border-white/12 bg-white/5 text-white/40 hover:text-white")}>
              {copiedId ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-white/22">Necesitarás este número para dar seguimiento a tu caso.</p>
        </div>
      )}

      {/* What's next */}
      <div className="rounded-2xl border border-white/10 bg-black/35 p-5 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-white/35">Próximos pasos</p>
        {[
          { icon: <Clock className="h-4 w-4" />, title: "Revisión inicial", body: "El equipo de seguridad revisará tu solicitud en 1-3 días." },
          { icon: <Mail className="h-4 w-4" />, title: "Notificación por correo", body: "Recibirás actualizaciones en el correo proporcionado." },
          { icon: <FileText className="h-4 w-4" />, title: "Decisión final", body: "El proceso completo puede tomar hasta 15 días hábiles." },
        ].map(({ icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/30">{icon}</div>
            <div>
              <p className="text-xs font-black text-white/65">{title}</p>
              <p className="text-[11px] text-white/35 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <button
        type="button" onClick={onTrack}
        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-left transition hover:border-white/20 hover:bg-black/40 active:scale-[0.99]"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d5ff3f]/20 bg-[#0a1a08]">
          <Shield className="h-5 w-5 text-[#d5ff3f]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">Ver estado de mi solicitud</p>
          <p className="text-xs text-white/30">Seguimiento del proceso de revisión</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/20" />
      </button>

      <div className="space-y-2">
        {[
          { icon: <Download className="h-4 w-4" />, label: "Descargar comprobante de solicitud (PDF)" },
          { icon: <Mail className="h-4 w-4" />, label: "Reenviar confirmación por correo" },
        ].map(({ icon, label }) => (
          <button key={label} type="button" onClick={onBroken} className="flex w-full items-center gap-3 rounded-xl border border-white/6 bg-black/20 px-4 py-3 text-sm text-white/30 hover:text-white/50 transition">
            <span className="text-white/20">{icon}</span>{label}
            <span className="ml-auto flex items-center gap-1 text-[10px] text-red-400/50"><span className="h-1.5 w-1.5 rounded-full bg-red-400/50" />No disponible</span>
          </button>
        ))}
      </div>

      <Link href="/mundial" className="block text-center text-xs text-white/20 underline underline-offset-2 hover:text-white/40 transition">Volver a la página principal</Link>
    </div>
  );
}

function SessionExpired({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0202] flex flex-col items-center justify-center px-4 py-16 text-white [background-image:radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(220,50,50,0.08),transparent)]">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-red-500/25 bg-red-950/40">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-950/60">
          <Clock className="h-8 w-8 text-red-400" />
        </div>
      </div>
      <Badge variant="red" >Sesión terminada</Badge>
      <h1 className="mt-4 text-2xl font-black">Tiempo agotado</h1>
      <p className="mt-3 max-w-xs text-center text-sm text-white/40 leading-relaxed">
        Tu sesión de recuperación expiró después de 15 minutos de inactividad. Por seguridad, debes iniciar el proceso completamente desde cero.
      </p>
      <p className="mt-6 text-xs text-white/25">No se guardó ningún progreso.</p>
      <button
        type="button" onClick={onRestart}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-950/30 px-6 py-3 text-sm font-black text-red-200 hover:bg-red-950/50 transition active:scale-95"
      >
        <RefreshCw className="h-4 w-4" />Reiniciar desde el principio
      </button>
    </div>
  );
}

const TRACK_STAGES = [
  { label: "Solicitud recibida y registrada", done: true, note: "Completado automáticamente · hoy" },
  { label: "Validación inicial de identidad", done: true, note: "Sistema automatizado · hoy" },
  { label: "Verificación de antecedentes", done: false, current: true, note: "En revisión — estimado: 1-3 días hábiles" },
  { label: "Revisión por comité de seguridad", done: false, note: "Requiere aprobación del paso anterior" },
  { label: "Auditoría de actividad sospechosa", done: false, note: "Proceso paralelo e independiente — hasta 5 días" },
  { label: "Segunda validación de identidad", done: false, note: "Requerido por política de seguridad interna" },
  { label: "Aprobación final por gerencia", done: false, note: "Último paso administrativo obligatorio" },
  { label: "Restauración de acceso", done: false, note: "Solo si todos los pasos anteriores son aprobados" },
];

const ACTIVITY_LOG = [
  { time: "Hoy, 15:42", event: "Verificación TOTP completada. Ticket generado." },
  { time: "Hoy, 15:41", event: "Autenticador 2FA configurado y vinculado." },
  { time: "Hoy, 15:38", event: "Teléfono verificado mediante código enviado a correo." },
  { time: "Hoy, 15:35", event: "Correo electrónico verificado exitosamente." },
  { time: "Hoy, 15:33", event: "Formulario firmado recibido — análisis en cola." },
  { time: "Hoy, 15:30", event: "Formulario de apelación guardado en el sistema." },
  { time: "Hoy, 15:28", event: "CAPTCHA × 3 completados. Identidad básica confirmada." },
  { time: "Hoy, 15:27", event: "Solicitud iniciada. Sesión segura establecida." },
];

function TrackView({ ticketId, onBack }: { ticketId: string | null; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#040b06] text-white [background-image:radial-gradient(ellipse_80%_40%_at_50%_-5%,rgba(157,255,52,0.04),transparent)]">
      {/* Top bar */}
      <div className="border-b border-white/8 bg-black/60 px-4 py-2 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[#9dff34]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Sistema de Recuperación</span>
          </div>
          <Badge variant="amber">EN REVISIÓN</Badge>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/40 text-white/40 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black">Seguimiento de solicitud</h1>
            {ticketId && <p className="text-xs font-mono text-white/25">{ticketId}</p>}
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-amber-500/15 bg-amber-950/12 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                <p className="text-sm font-black text-amber-200/90">Solicitud en revisión activa</p>
              </div>
              <p className="text-xs text-amber-200/50">Última actualización: hace 3 horas</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-amber-200/60">Tiempo estimado</p>
              <p className="text-sm font-black text-amber-200/90">10–14 días</p>
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <p className="mb-4 text-[10px] font-black uppercase tracking-wider text-white/30">Etapas del proceso</p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-4 bottom-4 w-px bg-white/8" />
            <div className="space-y-5">
              {TRACK_STAGES.map((s, i) => (
                <div key={i} className="relative flex items-start gap-4 pl-8">
                  {/* Dot */}
                  <div className={cn(
                    "absolute left-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black",
                    s.done ? "border-[#9dff34]/40 bg-[#0d1f09] text-[#9dff34] shadow-[0_0_8px_rgba(157,255,52,0.25)]"
                    : s.current ? "border-amber-500/50 bg-[#1a1005] text-amber-400"
                    : "border-white/10 bg-black/40 text-white/20"
                  )}>
                    {s.done ? <Check className="h-3 w-3" /> : s.current ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm font-black",
                        s.done ? "text-[#9dff34]" : s.current ? "text-amber-300" : "text-white/30"
                      )}>{s.label}</p>
                      {s.current && <Badge variant="amber">Activo</Badge>}
                    </div>
                    <p className="text-[10px] text-white/22 mt-0.5">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity log */}
        <div className="rounded-2xl border border-white/8 bg-black/25 p-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-wider text-white/25">Registro de actividad</p>
          <div className="space-y-2 font-mono">
            {ACTIVITY_LOG.map(({ time, event }, i) => (
              <div key={i} className="flex gap-3 text-[10px]">
                <span className="w-20 shrink-0 tabular-nums text-white/20">{time}</span>
                <span className="text-white/40">{event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-xl border border-red-500/12 bg-red-950/15 px-4 py-3.5">
          <p className="text-[10px] text-red-300/55 leading-relaxed">
            <strong className="text-red-300/75">Advertencia:</strong> El proceso no puede ser acelerado. Cualquier intento de contactar al equipo de soporte para agilizar la revisión resultará en el reinicio del proceso desde la etapa 1.
          </p>
        </div>
      </div>
    </div>
  );
}
