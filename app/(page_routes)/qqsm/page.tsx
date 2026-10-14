"use client";

import { useEffect, useRef, useState } from "react";

type Option = { id: string; text: string };
type Player = { id: string; name: string; score: number; answered?: boolean };
type Question = { id: string; text: string; options: Option[]; number: number; deadlineAt?: string };
type MatchState = { players: Player[]; question?: Question | null; questionNumber: number; totalQuestions: number; deadlineAt?: string | null; finished?: boolean; winnerId?: string | null };

const WS_URL = process.env.NEXT_PUBLIC_QQSM_WS_URL || process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
const TOTAL_QUESTIONS = 10;
const ROUND_SECONDS = 10;

export default function QQSMPage() {
  const wsRef = useRef<WebSocket | null>(null);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<MatchState>({ players: [], question: null, questionNumber: 0, totalQuestions: TOTAL_QUESTIONS });
  const [selected, setSelected] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [error, setError] = useState("");

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setError("No se pudo conectar al juego.");
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "qqsm_state") {
          const next = message.state as MatchState;
          setState({ ...next, totalQuestions: next.totalQuestions || TOTAL_QUESTIONS });
          setSelected(null);
          setJoined(true);
        }
        if (message.type === "qqsm_error") setError(message.message || "No se pudo realizar la acción.");
      } catch { setError("El servidor envió un mensaje inválido."); }
    };
    return () => ws.close();
  }, []);

  const question = state.question;
  const me = state.players.find((player) => player.id === "me");
  const deadline = question?.deadlineAt || state.deadlineAt;
  useEffect(() => {
    if (!deadline || state.finished) { setSeconds(ROUND_SECONDS); return; }
    const tick = () => setSeconds(Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [deadline, state.finished]);

  function send(type: string, payload: Record<string, unknown> = {}) {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type, ...payload }));
  }
  function join() { const cleanName = name.trim().slice(0, 20); if (!cleanName) return; send("qqsm_join", { name: cleanName }); setJoined(true); }
  function answer(optionId: string) { if (!question || selected || me?.answered || seconds <= 0 || state.finished) return; setSelected(optionId); send("qqsm_answer", { questionId: question.id, optionId }); }

  if (!joined) return <main className="flex min-h-screen items-center justify-center bg-[#080b25] p-5 text-white"><section className="w-full max-w-md rounded-3xl border border-cyan-400/30 bg-[#111642] p-8 text-center shadow-2xl"><p className="mb-3 text-sm font-bold uppercase tracking-[.3em] text-cyan-300">QQSM · Vero</p><h1 className="text-4xl font-black">¿Quién quiere ser millonario?</h1><p className="mt-3 text-slate-300">Dos jugadores · 10 preguntas · 10 segundos por respuesta</p><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && join()} placeholder="Tu nombre" className="mt-8 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300" /><button onClick={join} disabled={!connected || !name.trim()} className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 font-black text-[#071126] disabled:cursor-not-allowed disabled:opacity-40">{connected ? "Entrar a la partida" : "Conectando…"}</button><p className="mt-4 text-xs text-slate-400">{connected ? "Servidor conectado" : "Esperando servidor"}</p>{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}</section></main>;

  const winner = state.winnerId && state.players.find((player) => player.id === state.winnerId);
  return <main className="min-h-screen bg-[#080b25] p-4 text-white sm:p-8"><div className="mx-auto max-w-5xl"><header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.3em] text-cyan-300">QQSM · Vero</p><h1 className="text-3xl font-black sm:text-5xl">Duelo de conocimiento</h1></div><div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center"><p className="text-xs uppercase text-slate-400">Pregunta</p><p className="text-2xl font-black">{Math.min(state.questionNumber || 0, TOTAL_QUESTIONS)}<span className="text-slate-500"> / {state.totalQuestions}</span></p></div></header><div className="mb-6 grid gap-3 sm:grid-cols-2">{state.players.slice(0, 2).map((player) => <div key={player.id} className="rounded-2xl border border-cyan-300/20 bg-[#111642] p-4"><div className="flex justify-between"><span className="font-bold">{player.name}{player.id === "me" ? " (tú)" : ""}</span><span className="font-black text-cyan-300">{player.score} pts</span></div><div className="mt-3 h-2 rounded-full bg-black/30"><div className="h-2 rounded-full bg-cyan-400 transition-all" style={{ width: `${Math.min(100, player.score * 10)}%` }} /></div><p className="mt-2 text-xs text-slate-400">{player.answered ? "Ya respondió" : "Pensando…"}</p></div>)}</div>{state.players.length < 2 && !state.finished && <div className="mb-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-center text-amber-100">Esperando a que se conecte el segundo jugador…</div>}{state.finished ? <section className="rounded-3xl border border-amber-300/40 bg-gradient-to-br from-[#211a52] to-[#111642] p-10 text-center"><p className="text-sm font-bold uppercase tracking-[.3em] text-amber-300">Partida terminada</p><h2 className="mt-3 text-4xl font-black">{winner ? `¡Ganó ${winner.name}!` : "¡Empate!"}</h2><p className="mt-3 text-slate-300">{state.players.map((player) => `${player.name}: ${player.score} puntos`).join(" · ")}</p><button onClick={() => send("qqsm_restart")} className="mt-8 rounded-xl bg-amber-300 px-6 py-3 font-black text-[#171025]">Jugar otra vez</button></section> : <section className="rounded-3xl border border-white/10 bg-[#111642] p-5 sm:p-8"><div className="mb-6 flex items-center justify-between gap-4"><p className="text-lg font-bold">{question?.text || "Esperando la próxima pregunta…"}</p><div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 text-2xl font-black ${seconds <= 3 ? "border-rose-400 text-rose-300" : "border-cyan-300 text-cyan-200"}`}>{seconds}</div></div><div className="grid gap-3 sm:grid-cols-2">{question?.options.map((option, index) => <button key={option.id} onClick={() => answer(option.id)} disabled={Boolean(selected) || Boolean(me?.answered) || seconds <= 0} className={`rounded-2xl border p-4 text-left transition ${selected === option.id ? "border-cyan-300 bg-cyan-400/20" : "border-white/15 bg-black/15 hover:border-cyan-300/60"} disabled:cursor-not-allowed disabled:opacity-60`}><span className="mr-3 font-black text-cyan-300">{String.fromCharCode(65 + index)}</span>{option.text}</button>)}</div>{seconds === 0 && <p className="mt-5 text-center font-bold text-rose-300">Tiempo agotado. Esperando el resultado…</p>}</section>}{error && <p className="mt-4 text-center text-sm text-rose-300">{error}</p>}</div></main>;
}
