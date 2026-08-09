"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "../utils";

type StatQuestion = {
  id: string;
  text: string;
  options: Array<{ id: string; label: string }>;
  optionStats?: Array<{ optionId: string; label: string; count: number; players: string[] }>;
  correctOptionId: string | null;
  resolved: boolean;
  pointValue: number;
  closed: boolean;
};

type StatBet = { questionId: string; optionId: string };

type BetLeaderboardEntry = {
  playerName: string;
  earned: number;
  total: number;
};

type StatBetsPanelProps = {
  matchId: string;
  playerName: string;
  matchLabel?: string;
  variant?: "full" | "mini";
  questionScope?: "all" | "live" | "final";
  onOpenPlayerPicker?: () => void;
};

// ── helpers ────────────────────────────────────────────────────────────────

function isBinary(q: StatQuestion) {
  return q.options.length === 2;
}

function pointsBadge(pts: number) {
  return pts >= 3 ? "🔥" : pts === 2 ? "⭐" : null;
}

// ── sub-components ─────────────────────────────────────────────────────────

function normalizedText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isLiveQuestion(question: StatQuestion) {
  const text = normalizedText(question.text);
  return [
    "proximo",
    "proximos",
    "siguiente",
    "20 segundos",
    "30 segundos",
    "1 minuto",
    "un minuto",
    "3 minutos",
    "5 minutos",
    "10 minutos",
    "antes del minuto",
    "despues del minuto",
    "var actua",
    "var cambia",
    "sale amarilla",
    "sale roja",
    "tiro libre peligroso",
    "revision arbitral",
    "atajada",
    "la tapa",
    "remata",
  ].some((needle) => text.includes(needle));
}

function filterQuestions(questions: StatQuestion[], scope: StatBetsPanelProps["questionScope"]) {
  if (!scope || scope === "all") return questions;
  return questions.filter((question) => (scope === "live" ? isLiveQuestion(question) : !isLiveQuestion(question)));
}

function OptionButton({
  label,
  selected,
  isCorrect,
  isWrong,
  disabled,
  saving,
  binary,
  onClick,
}: {
  label: string;
  selected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  disabled: boolean;
  saving: boolean;
  binary: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border font-black transition-all duration-150 active:scale-[0.97]",
        binary ? "min-h-[3.5rem] px-4 py-3 text-base" : "min-h-[3rem] px-4 py-3 text-sm",
        isCorrect
          ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.45)]"
          : isWrong
            ? "border-white/10 bg-white/5 text-white/30 line-through opacity-60"
            : selected
              ? "border-[#f0b429] bg-[#f0b429]/15 text-[#f0b429] shadow-[0_0_20px_rgba(240,180,41,0.25)] ring-1 ring-[#f0b429]/50"
              : disabled
                ? "cursor-not-allowed border-white/8 bg-white/4 text-white/25"
                : "border-white/12 bg-white/5 text-white/80 hover:border-[#f0b429]/60 hover:bg-[#f0b429]/8 hover:text-white"
      )}
    >
      {/* shimmer on hover */}
      {!disabled && !selected && !isCorrect && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 break-words text-left leading-snug">{label}</span>
        <span className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs",
          isCorrect
            ? "border-white/40 bg-white/20 text-white"
            : selected
              ? "border-[#f0b429]/60 bg-[#f0b429]/20 text-[#f0b429]"
              : "border-white/15 bg-transparent text-transparent"
        )}>
          {saving ? (
            <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : isCorrect ? (
            "✓"
          ) : selected ? (
            "✓"
          ) : null}
        </span>
      </div>
    </button>
  );
}

function QuestionCard({
  question,
  index,
  total,
  myBet,
  saving,
  error,
  compact,
  onBet,
}: {
  question: StatQuestion;
  index: number;
  total: number;
  myBet: string | undefined;
  saving: boolean;
  error: string;
  compact: boolean;
  onBet: (optionId: string) => void;
}) {
  const isClosed = question.closed || question.resolved;
  const binary = isBinary(question);
  const myPoints =
    question.resolved && myBet && myBet === question.correctOptionId
      ? question.pointValue
      : null;
  const lost = question.resolved && myBet && myBet !== question.correctOptionId;
  const badge = pointsBadge(question.pointValue);

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border transition-all",
      myBet && !isClosed
        ? "border-[#f0b429]/30 bg-[#f0b429]/5"
        : isClosed
          ? "border-white/8 bg-[#0f1218]"
          : "border-white/10 bg-[#111827]",
    )}>
      {/* top accent strip */}
      <div className={cn(
        "h-0.5 w-full",
        myPoints !== null
          ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
          : lost
            ? "bg-white/10"
            : myBet
              ? "bg-gradient-to-r from-[#f0b429] to-[#fbbf24]"
              : isClosed
                ? "bg-white/8"
                : "bg-gradient-to-r from-[#2f7d32]/70 to-[#f0b429]/45"
      )} />

      <div className={compact ? "p-3" : "p-4"}>
        {/* meta row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white/40">
            #{index + 1}/{total}
          </span>

          <span className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
            question.pointValue >= 3
              ? "bg-amber-500/15 text-amber-400"
              : question.pointValue === 2
                ? "bg-purple-500/15 text-purple-400"
                : "bg-white/8 text-white/40"
          )}>
            {badge && <span>{badge}</span>}
            {question.pointValue} pt{question.pointValue !== 1 ? "s" : ""}
          </span>

          {isClosed && (
            <span className="inline-flex items-center gap-1 rounded-md bg-white/6 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/35">
              <Lock className="h-2.5 w-2.5" />
              {question.resolved ? "Resuelta" : "Cerrada"}
            </span>
          )}

          {myPoints !== null && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-black text-emerald-400">
              <Trophy className="h-3 w-3" />
              +{myPoints} pt{myPoints !== 1 ? "s" : ""}
            </span>
          )}
          {lost && (
            <span className="ml-auto rounded-md bg-white/6 px-2.5 py-0.5 text-[10px] font-black text-white/30">
              Sin puntos
            </span>
          )}
        </div>

        {/* question text */}
        <p className={cn(
          "mb-4 font-black leading-snug text-white",
          compact ? "text-base" : "text-lg"
        )}>
          {question.text}
        </p>

        {/* options */}
        <div className={cn(
          "grid gap-2",
          binary ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
        )}>
          {question.options.map((opt) => {
            const selected = myBet === opt.id;
            const isCorrect = question.resolved && question.correctOptionId === opt.id;
            const isWrong = question.resolved && selected && !isCorrect;
            return (
              <OptionButton
                key={opt.id}
                label={opt.label}
                selected={selected}
                isCorrect={isCorrect}
                isWrong={isWrong}
                disabled={isClosed || !myBet && false || saving}
                saving={saving && selected}
                binary={binary}
                onClick={() => onBet(opt.id)}
              />
            );
          })}
        </div>

        {error && (
          <p className="mt-2 text-xs font-bold text-amber-400">{error}</p>
        )}

        {question.resolved && question.optionStats && question.optionStats.length > 0 && (
          <ResolvedFriendsSummary question={question} myBet={myBet} />
        )}
      </div>
    </div>
  );
}

function ResolvedFriendsSummary({ question, myBet }: { question: StatQuestion; myBet: string | undefined }) {
  const correct = question.optionStats?.find((stat) => stat.optionId === question.correctOptionId);
  const wrong = (question.optionStats ?? []).filter((stat) => stat.optionId !== question.correctOptionId && stat.count > 0);
  const wrongPlayers = wrong.flatMap((stat) => stat.players.map((player) => ({ player, label: stat.label })));

  return (
    <div className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Amigos</p>
        {myBet && (
          <span className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-black",
            myBet === question.correctOptionId ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-300"
          )}>
            {myBet === question.correctOptionId ? "Acertaste" : "Fallaste"}
          </span>
        )}
      </div>

      <FriendPillGroup
        label={`Acertaron${correct?.label ? `: ${correct.label}` : ""}`}
        tone="win"
        players={correct?.players ?? []}
      />
      <FriendPillGroup
        label="Fallaron"
        tone="loss"
        players={wrongPlayers.map(({ player, label }) => `${player} (${label})`)}
      />
    </div>
  );
}

function FriendPillGroup({ label, players, tone }: { label: string; players: string[]; tone: "win" | "loss" }) {
  return (
    <div>
      <p className={cn(
        "text-[10px] font-black uppercase tracking-wide",
        tone === "win" ? "text-emerald-400/80" : "text-red-300/75"
      )}>
        {label}
      </p>
      {players.length ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {players.slice(0, 8).map((player) => (
            <span
              key={player}
              className={cn(
                "rounded-md border px-2 py-1 text-[11px] font-black",
                tone === "win"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/20 bg-red-500/10 text-red-200"
              )}
            >
              {player}
            </span>
          ))}
          {players.length > 8 && (
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-black text-white/35">
              +{players.length - 8}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-1 text-xs font-bold text-white/30">Nadie todavia.</p>
      )}
    </div>
  );
}

// ── Bet leaderboard ────────────────────────────────────────────────────────

function BetLeaderboard({
  entries,
  myName,
}: {
  entries: BetLeaderboardEntry[];
  myName: string;
}) {
  if (!entries.length) return null;
  const maxEarned = Math.max(...entries.map((e) => e.earned), 1);
  const medals = ["🥇", "🥈", "🥉"];
  const myKey = myName.trim().toUpperCase();

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0b429]/70">Puntaje Preguntas</p>
        <p className="mt-0.5 text-sm font-black text-white">{entries.length} jugadores</p>
      </div>
      <div className="divide-y divide-white/8">
        {entries.map((entry, i) => {
          const isMe = entry.playerName.trim().toUpperCase() === myKey;
          const barWidth = maxEarned > 0 ? Math.round((entry.earned / maxEarned) * 100) : 0;
          return (
            <div
              key={entry.playerName}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                isMe && "bg-[#f0b429]/5 ring-1 ring-inset ring-[#f0b429]/15"
              )}
            >
              <div className="w-6 shrink-0 text-center">
                {medals[i] ? (
                  <span className="text-lg leading-none">{medals[i]}</span>
                ) : (
                  <span className="text-xs font-black text-white/30">{i + 1}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "truncate text-sm font-black",
                    i === 0 ? "text-[#f0b429]" : isMe ? "text-white" : "text-white/65"
                  )}>
                    {entry.playerName}
                  </p>
                  {isMe && (
                    <span className="shrink-0 rounded bg-[#f0b429]/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#f0b429]">
                      Tú
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      i === 0 ? "bg-[#f0b429]" : entry.earned > 0 ? "bg-emerald-500/60" : "bg-white/15"
                    )}
                    style={{ width: `${Math.max(barWidth, entry.total > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className={cn(
                  "text-sm font-black tabular-nums",
                  entry.earned > 0
                    ? i === 0 ? "text-[#f0b429]" : "text-emerald-400"
                    : "text-white/25"
                )}>
                  {entry.earned}
                </span>
                <span className="ml-0.5 text-[10px] font-bold text-white/30">pts</span>
                {entry.total > 0 && (
                  <p className="text-[10px] font-bold text-white/25">{entry.total} apuesta{entry.total !== 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function StatBetsPanel({
  matchId,
  playerName,
  matchLabel,
  variant = "full",
  questionScope = "all",
  onOpenPlayerPicker,
}: StatBetsPanelProps) {
  const [questions, setQuestions] = useState<StatQuestion[]>([]);
  const [myBets, setMyBets] = useState<Record<string, string>>({});
  const [leaderboard, setLeaderboard] = useState<BetLeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ matchId });
    if (playerName) params.set("playerName", playerName);
    const res = await fetch(`/api/mundial/stat-bets?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setQuestions(filterQuestions(data.questions ?? [], questionScope));
    setLeaderboard(data.leaderboard ?? []);
    const betsMap: Record<string, string> = {};
    for (const bet of (data.myBets ?? []) as StatBet[]) {
      betsMap[bet.questionId] = bet.optionId;
    }
    setMyBets(betsMap);
  }, [matchId, playerName, questionScope]);

  useEffect(() => {
    if (!matchId) return;
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load, matchId]);

  useEffect(() => {
    if (!matchId) return;
    const interval = window.setInterval(() => void load(), 4_000);
    return () => window.clearInterval(interval);
  }, [load, matchId]);

  useEffect(() => {
    const t = window.setTimeout(() => setActiveIndex(0), 0);
    return () => window.clearTimeout(t);
  }, [matchId, questionScope]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setActiveIndex((c) => Math.min(c, Math.max(questions.length - 1, 0)));
    }, 0);
    return () => window.clearTimeout(t);
  }, [questions.length]);

  useEffect(() => {
    if (!questions.length) return;
    const current = questions[activeIndex];
    if (current && !myBets[current.id] && !current.closed && !current.resolved) return;

    const next = questions.findIndex((q) => !myBets[q.id] && !q.closed && !q.resolved);
    if (next >= 0) queueMicrotask(() => setActiveIndex(next));
  }, [activeIndex, myBets, questions]);

  function nextPendingIndex(fromId: string, bets: Record<string, string>) {
    const fromIndex = questions.findIndex((q) => q.id === fromId);
    const canAnswer = (q: StatQuestion) => !bets[q.id] && !q.closed && !q.resolved;

    for (let i = Math.max(fromIndex + 1, 0); i < questions.length; i++) {
      if (canAnswer(questions[i])) return i;
    }

    return questions.findIndex(canAnswer);
  }

  async function placeBet(questionId: string, optionId: string, advance = false) {
    if (!playerName) { onOpenPlayerPicker?.(); return; }
    setSaving(questionId);
    setErrors((p) => ({ ...p, [questionId]: "" }));
    try {
      const res = await fetch("/api/mundial/stat-bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, matchId, playerName, optionId }),
      });
      if (res.ok) {
        const nextBets = { ...myBets, [questionId]: optionId };
        setMyBets(nextBets);
        void load();
        if (advance) {
          const nextIndex = nextPendingIndex(questionId, nextBets);
          setActiveIndex(nextIndex >= 0 ? nextIndex : 0);
        }
      } else {
        const body = await res.json().catch(() => ({}));
        setErrors((p) => ({ ...p, [questionId]: body.error ?? "Error guardando." }));
      }
    } catch {
      setErrors((p) => ({ ...p, [questionId]: "Error de red." }));
    } finally {
      setSaving(null);
    }
  }

  if (!questions.length) return null;

  const answeredCount = questions.filter((q) => myBets[q.id]).length;
  const totalPts = questions.reduce((acc, q) => acc + q.pointValue, 0);
  const earnedPts = questions.reduce((acc, q) => {
    if (q.resolved && myBets[q.id] === q.correctOptionId) return acc + q.pointValue;
    return acc;
  }, 0);
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  // For mini variant: only show one unanswered question at a time.
  const pendingQuestions = questions.filter((q) => !myBets[q.id] && !q.closed && !q.resolved);
  const activePendingQuestion =
    pendingQuestions.find((q) => questions.indexOf(q) >= activeIndex) ?? pendingQuestions[0] ?? null;
  const activeQuestionNumber = activePendingQuestion ? questions.indexOf(activePendingQuestion) + 1 : answeredCount;
  const clampedMiniIndex = activePendingQuestion ? pendingQuestions.indexOf(activePendingQuestion) : 0;

  // ── MINI VARIANT ────────────────────────────────────────────────────────

  if (variant === "mini") {
    const allDone = answeredCount === questions.length && questions.length > 0;
    const unavailable = !allDone && pendingQuestions.length === 0;

    return (
      <section className="overflow-hidden rounded-2xl border border-[#f0b429]/20 bg-[#0b0d14] shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
        {/* header */}
        <div className="relative overflow-hidden border-b border-white/8 bg-gradient-to-r from-[#16220c] to-[#07130d] px-4 py-4 sm:px-5">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(ellipse_at_top_left,rgba(240,180,41,0.2),transparent_60%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f0b429] to-[#e8a30a] shadow-[0_0_16px_rgba(240,180,41,0.4)]">
                <Zap className="h-5 w-5 text-[#0b0d14]" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0b429]/80">
                  {questionScope === "live" ? "Apuestas live" : "Apuestas extra"}
                </p>
                <p className="truncate text-lg font-black text-white">
                  {matchLabel ?? "Preguntas del partido"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-black tabular-nums text-emerald-400">
                {answeredCount}/{questions.length}
              </span>
              {false && answeredCount > 0 && (
                <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-black tabular-nums text-emerald-400">
                  {answeredCount} ✓
                </span>
              )}
              <span className="rounded-lg border border-[#f0b429]/30 bg-[#f0b429]/10 px-2 py-1 text-[11px] font-black text-[#f0b429]">
                {totalPts}pts
              </span>
            </div>
          </div>

          {/* progress bar */}
          <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f0b429] to-[#fbbf24] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* body */}
        <div className="p-4 sm:p-5">
          {allDone ? (
            /* all done state */
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-black text-emerald-400">¡Todas apostadas!</p>
                <p className="text-[11px] font-bold text-emerald-500/60">
                  {answeredCount}/{questions.length} preguntas respondidas
                </p>
              </div>
            </div>
          ) : activePendingQuestion ? (
            <>
              {/* pending count pill */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/35">
                  Pregunta {activeQuestionNumber} de {questions.length}
                </p>
                <p className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-black text-white/45">
                  {pendingQuestions.length} pendiente{pendingQuestions.length !== 1 ? "s" : ""}
                </p>
              </div>

              <QuestionCard
                key={activePendingQuestion.id}
                question={activePendingQuestion}
                index={questions.indexOf(activePendingQuestion)}
                total={questions.length}
                myBet={myBets[activePendingQuestion.id]}
                saving={saving === activePendingQuestion.id}
                error={errors[activePendingQuestion.id] ?? ""}
                compact
                onBet={(optId) => void placeBet(activePendingQuestion.id, optId, true)}
              />

              {!playerName && (
                <button
                  type="button"
                  onClick={onOpenPlayerPicker}
                  className="mt-3 w-full rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 py-2.5 text-sm font-black text-[#f0b429] transition hover:bg-[#f0b429]/15"
                >
                  Elegí tu nombre para apostar
                </button>
              )}

              {/* navigation — only render if more than 1 pending */}
              {false && pendingQuestions.length > 1 && (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveIndex((c) => Math.max(c - 1, 0))}
                    disabled={clampedMiniIndex === 0}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition hover:border-white/25 hover:text-white disabled:opacity-25"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* dot rail — one dot per pending question */}
                  <div className="flex flex-1 items-center justify-center gap-1.5 py-1">
                    {pendingQuestions.map((q, i) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        aria-label={`Pregunta pendiente ${i + 1}`}
                        className={cn(
                          "h-2 shrink-0 rounded-full transition-all duration-200",
                          i === clampedMiniIndex ? "w-5 bg-[#f0b429]" : "w-2 bg-white/20"
                        )}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveIndex((c) => Math.min(c + 1, pendingQuestions.length - 1))}
                    disabled={clampedMiniIndex >= pendingQuestions.length - 1}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#f0b429]/30 bg-[#f0b429]/8 text-[#f0b429] transition hover:bg-[#f0b429]/15 disabled:opacity-25"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : unavailable ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-4">
              <Lock className="h-5 w-5 shrink-0 text-white/35" />
              <div>
                <p className="text-sm font-black text-white/70">No hay preguntas abiertas para responder.</p>
                <p className="text-xs font-bold text-white/40">
                  {answeredCount}/{questions.length} preguntas respondidas
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  // ── FULL VARIANT ────────────────────────────────────────────────────────

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d14] shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
      {/* header */}
      <div className="relative overflow-hidden border-b border-white/8 bg-gradient-to-r from-[#16220c] via-[#111827] to-[#07130d] px-5 py-4">
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(ellipse_at_top_left,rgba(240,180,41,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,197,94,0.1),transparent_55%)]" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f0b429] to-[#e8a30a] shadow-[0_0_20px_rgba(240,180,41,0.45)]">
              <Zap className="h-5 w-5 text-[#0b0d14]" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f0b429]/70">
                {questionScope === "final" ? "Apuestas de cierre" : "Apuestas del partido"}
              </p>
              <h2 className="text-xl font-black text-white">
                {questions.length} preguntas
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {earnedPts > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-black text-emerald-400">
                <Trophy className="h-3.5 w-3.5" />
                +{earnedPts} pts ganados
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#f0b429]/25 bg-[#f0b429]/8 px-3 py-1.5 text-sm font-black text-[#f0b429]">
              <TrendingUp className="h-3.5 w-3.5" />
              {totalPts} pts en juego
            </span>
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-black tabular-nums text-white/50">
              {answeredCount}/{questions.length}
            </span>
          </div>
        </div>

        {/* progress */}
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f0b429] to-[#fbbf24] shadow-[0_0_12px_rgba(240,180,41,0.5)] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-black text-white/30">
          <span>{answeredCount} de {questions.length} apostadas</span>
          <span>{progressPct}%</span>
        </div>
      </div>

      {/* no player warning */}
      {!playerName && (
        <div className="border-b border-white/8 bg-[#f0b429]/8 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-[#f0b429]">
              Elegí tu nombre para poder apostar
            </p>
            <button
              type="button"
              onClick={onOpenPlayerPicker}
              className="shrink-0 rounded-lg border border-[#f0b429]/50 bg-[#f0b429]/15 px-3 py-1.5 text-xs font-black text-[#f0b429] transition hover:bg-[#f0b429]/25"
            >
              Elegir jugador
            </button>
          </div>
        </div>
      )}

      {/* questions list */}
      <div className="grid gap-3 p-4 sm:p-5">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            myBet={myBets[q.id]}
            saving={saving === q.id}
            error={errors[q.id] ?? ""}
            compact={false}
            onBet={(optId) => void placeBet(q.id, optId)}
          />
        ))}

        {/* all done banner */}
        {answeredCount === questions.length && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
            <Sparkles className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-black text-emerald-400">
                ¡Todas las apuestas guardadas!
              </p>
              <p className="text-xs font-bold text-emerald-500/60">
                Te avisamos cuando se resuelvan.
              </p>
            </div>
          </div>
        )}

        {/* leaderboard toggle */}
        {leaderboard.length > 0 && (
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setShowLeaderboard((v) => !v)}
              className="flex items-center justify-between gap-2 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3 text-left transition hover:bg-[#f0b429]/8"
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="h-4 w-4 text-[#f0b429]" />
                <span className="text-sm font-black text-white">Puntaje Preguntas</span>
                <span className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-black tabular-nums text-white/40">
                  {leaderboard.length}
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform duration-200", showLeaderboard && "rotate-180")} />
            </button>
            {showLeaderboard && <BetLeaderboard entries={leaderboard} myName={playerName} />}
          </div>
        )}
      </div>
    </section>
  );
}
