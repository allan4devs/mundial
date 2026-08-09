"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, EyeOff, Loader2, Plus, Trash2, Trophy, Users, X } from "lucide-react";
import type { AdminMatch, AdminStatQuestion, BetOptionAnalytics } from "../adminTypes";
import { cn } from "../../utils";

type Props = {
  matches: AdminMatch[];
  statQuestions: AdminStatQuestion[];
  onCreateQuestion: (matchId: string, text: string, options: string[], pointValue: number) => Promise<void>;
  onResolveQuestion: (id: string, correctOptionId: string | null) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onBulkDeleteQuestions: (ids: string[]) => Promise<void>;
};

function OptionBar({
  opt,
  isCorrect,
  totalBets,
}: {
  opt: BetOptionAnalytics;
  isCorrect: boolean;
  totalBets: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasPlayers = opt.players.length > 0;

  return (
    <div className={cn(
      "overflow-hidden rounded-lg border transition-all",
      isCorrect
        ? "border-[#9dff34]/35 bg-[#10240b]"
        : totalBets > 0 && opt.count === 0
          ? "border-white/8 bg-black/20 opacity-60"
          : "border-white/12 bg-black/35"
    )}>
      <div className="px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {isCorrect && (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#10240b]">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            )}
            <span className={cn("text-sm font-black", isCorrect ? "text-[#d5ff3f]" : "text-white")}>
              {opt.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-black tabular-nums", isCorrect ? "text-[#9dff34]" : "text-white/50")}>
              {opt.pct}%
            </span>
            <span className={cn(
              "rounded-md px-1.5 py-0.5 text-xs font-black tabular-nums",
              isCorrect ? "bg-[#9dff34]/15 text-[#d5ff3f]" : "bg-white/10 text-white/60"
            )}>
              {opt.count}
            </span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isCorrect ? "bg-[#10240b]" : "bg-white/35")}
            style={{ width: `${opt.pct}%` }}
          />
        </div>
        {hasPlayers && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-black text-white/40 transition hover:text-white/70"
            >
              <Users className="h-3 w-3" />
              {opt.players.length} jugador{opt.players.length !== 1 ? "es" : ""}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {opt.players.map((name) => (
                  <span
                    key={name}
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-black",
                      isCorrect ? "bg-[#9dff34]/15 text-[#d5ff3f]" : "bg-white/10 text-white/60"
                    )}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  resolvingId,
  deletingId,
  isPastZeroBet,
  onResolve,
  onDelete,
}: {
  question: AdminStatQuestion;
  resolvingId: string | null;
  deletingId: string | null;
  isPastZeroBet: boolean;
  onResolve: (id: string, optionId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isResolving = resolvingId === question.id;
  const isDeleting = deletingId === question.id;
  const correctLabel = question.options.find((o) => o.id === question.correctOptionId)?.label;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border shadow-[0_18px_58px_rgba(0,0,0,0.18)]",
      question.resolved
        ? "border-[#9dff34]/30 bg-[#10240b]/45"
        : isPastZeroBet
          ? "border-white/8 bg-black/20 opacity-60"
          : "border-white/12 bg-black/35"
    )}>
      <div className={cn(
        "flex items-start justify-between gap-3 px-4 py-3",
        question.resolved ? "bg-[#10240b]/80" : "bg-black/35"
      )}>
        <div className="min-w-0">
          <p className={cn("font-black leading-snug", question.resolved ? "text-[#d5ff3f]" : "text-white")}>
            {question.text}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white/45">
              {question.pointValue} pt{question.pointValue !== 1 ? "s" : ""}
            </span>
            {question.totalBets > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white/45">
                <Users className="h-3 w-3" />
                {question.totalBets} apuesta{question.totalBets !== 1 ? "s" : ""}
              </span>
            )}
            {isPastZeroBet && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/8 px-1.5 py-0.5 text-[11px] font-black text-white/35">
                <EyeOff className="h-2.5 w-2.5" />
                Sin apuestas
              </span>
            )}
            {question.resolved && (
              <>
                <span className="rounded-md bg-[#10240b] px-1.5 py-0.5 text-[11px] font-black text-[#d5ff3f]">
                  OK {correctLabel}
                </span>
                <button
                  type="button"
                  disabled={isResolving}
                  onClick={() => onResolve(question.id, null)}
                  className="text-[11px] font-black text-white/40 underline transition hover:text-red-600 disabled:opacity-40"
                >
                  Quitar respuesta
                </button>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-[#ffd2c2]">Eliminar?</span>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => { setConfirmDelete(false); onDelete(question.id); }}
                className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[11px] font-black text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Si
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-md border border-white/18 bg-black/35 px-2 py-1 text-[11px] font-black text-white/65 transition hover:bg-white/5"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isDeleting || isResolving}
              onClick={() => setConfirmDelete(true)}
              className="grid h-7 w-7 place-items-center rounded-lg border border-white/12 bg-black/35 text-white/40 transition hover:border-[#ff6a3d]/50 hover:bg-[#35130d] hover:text-[#ffd2c2] disabled:opacity-40"
              title="Eliminar pregunta"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        {/* Resolve buttons: only for unresolved questions that have bets (skip zero-bet past match questions) */}
        {!question.resolved && !isPastZeroBet && (
          <div className="mb-3 rounded-lg border border-[#9dff34]/30 bg-[#10240b]/80 p-2.5">
            <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#d5ff3f]">
              Marcar respuesta correcta
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isResolving}
                  onClick={() => onResolve(question.id, opt.id)}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#9dff34]/35 bg-black/35 px-3 py-2 text-sm font-black text-[#d5ff3f] transition hover:border-[#d5ff3f] hover:bg-[#12351f] disabled:opacity-40"
                >
                  {isResolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {question.totalBets === 0 ? (
          <p className="text-xs font-bold text-white/45">Sin apuestas todavia.</p>
        ) : (
          <div className="mb-3 grid gap-2">
            {question.betsByOption.map((opt) => (
              <OptionBar
                key={opt.optionId}
                opt={opt}
                isCorrect={question.correctOptionId === opt.optionId}
                totalBets={question.totalBets}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatQuestionsManager({ matches, statQuestions, onCreateQuestion, onResolveQuestion, onDeleteQuestion, onBulkDeleteQuestions }: Props) {
  const [now] = useState(() => Date.now());

  // "pending" here means unresolved WITH bets — those are the ones admins truly need to action
  const questionStatsByMatch = useMemo(() => {
    const stats = new Map<string, { total: number; pending: number; emptyUnresolved: number; bets: number }>();
    for (const question of statQuestions) {
      const current = stats.get(question.matchId) ?? { total: 0, pending: 0, emptyUnresolved: 0, bets: 0 };
      current.total += 1;
      if (!question.resolved && question.totalBets > 0) current.pending += 1;
      if (!question.resolved && question.totalBets === 0) current.emptyUnresolved += 1;
      current.bets += question.totalBets;
      stats.set(question.matchId, current);
    }
    return stats;
  }, [statQuestions]);

  const upcomingMatches = matches.filter((m) => {
    const isLive = m.liveStatus === "live" || m.liveStatus === "halftime";
    return isLive || (!m.closed && new Date(m.kickoffAt).getTime() > now);
  });
  const pastMatches = matches.filter((m) => {
    const isLive = m.liveStatus === "live" || m.liveStatus === "halftime";
    return !isLive && (m.closed || new Date(m.kickoffAt).getTime() <= now);
  });
  // Only matches with unresolved questions that actually have bets
  const pendingPastMatches = pastMatches.filter((match) => (questionStatsByMatch.get(match.id)?.pending ?? 0) > 0);

  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => {
    const pastWithPending = matches.find((m) => {
      const isLive = m.liveStatus === "live" || m.liveStatus === "halftime";
      const isPast = !isLive && (m.closed || new Date(m.kickoffAt).getTime() <= Date.now());
      return isPast && statQuestions.some((q) => q.matchId === m.id && !q.resolved && q.totalBets > 0);
    });
    const withQuestions = matches.find((m) => statQuestions.some((q) => q.matchId === m.id));
    return pastWithPending?.id ?? withQuestions?.id ?? matches.find((m) => m.closed)?.id ?? matches[0]?.id ?? "";
  });
  const [questionFilter, setQuestionFilter] = useState<"pending" | "all" | "resolved">("pending");
  const [newText, setNewText] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [newPointValue, setNewPointValue] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const matchQuestions = statQuestions
    .filter((q) => q.matchId === selectedMatchId)
    .sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.totalBets - a.totalBets);

  const isPastMatch = useMemo(() => {
    if (!selectedMatch) return false;
    const isLive = selectedMatch.liveStatus === "live" || selectedMatch.liveStatus === "halftime";
    return !isLive && (selectedMatch.closed || new Date(selectedMatch.kickoffAt).getTime() <= now);
  }, [selectedMatch, now]);

  const zeroBetQuestions = useMemo(
    () => matchQuestions.filter((q) => !q.resolved && q.totalBets === 0),
    [matchQuestions]
  );
  const pendingWithBets = useMemo(
    () => matchQuestions.filter((q) => !q.resolved && q.totalBets > 0),
    [matchQuestions]
  );

  const totalBetsForMatch = matchQuestions.reduce((sum, q) => sum + q.totalBets, 0);
  const resolvedCount = matchQuestions.filter((q) => q.resolved).length;
  // For past matches, "pending" = only those with actual bets that need resolution
  const pendingCount = isPastMatch ? pendingWithBets.length : matchQuestions.length - resolvedCount;

  const visibleQuestions = matchQuestions.filter((q) => {
    if (questionFilter === "pending") {
      // In past matches, the pending filter only shows questions with bets
      if (isPastMatch) return !q.resolved && q.totalBets > 0;
      return !q.resolved;
    }
    if (questionFilter === "resolved") return q.resolved;
    return true;
  });

  // Zero-bet questions shown as a secondary dim section only in "pending" view for past matches
  const visibleZeroBetSection = isPastMatch && questionFilter === "pending" ? zeroBetQuestions : [];

  useEffect(() => {
    if (questionFilter === "pending" && pendingCount === 0 && matchQuestions.length > 0 && zeroBetQuestions.length === 0) {
      queueMicrotask(() => setQuestionFilter("all"));
    }
  }, [matchQuestions.length, pendingCount, questionFilter, zeroBetQuestions.length]);

  useEffect(() => {
    queueMicrotask(() => setConfirmBulkDelete(false));
  }, [selectedMatchId]);

  const statBetLeaderboard = useMemo(() => {
    const playerMap = new Map<string, { playerName: string; earned: number; total: number }>();
    for (const q of matchQuestions) {
      for (const opt of q.betsByOption) {
        for (const name of opt.players) {
          if (!playerMap.has(name)) playerMap.set(name, { playerName: name, earned: 0, total: 0 });
          const entry = playerMap.get(name)!;
          entry.total++;
          if (q.correctOptionId === opt.optionId) entry.earned += q.pointValue;
        }
      }
    }
    return [...playerMap.values()].sort(
      (a, b) => b.earned - a.earned || b.total - a.total || a.playerName.localeCompare(b.playerName)
    );
  }, [matchQuestions]);

  async function handleCreate() {
    const text = newText.trim();
    const opts = newOptions.map((o) => o.trim()).filter(Boolean);
    if (text.length < 3) { setFormError("La pregunta debe tener al menos 3 caracteres."); return; }
    if (opts.length < 2) { setFormError("Necesitas al menos 2 opciones."); return; }
    setFormError("");
    setIsCreating(true);
    try {
      await onCreateQuestion(selectedMatchId, text, opts, newPointValue);
      setNewText("");
      setNewOptions(["", ""]);
      setNewPointValue(1);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creando pregunta.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleResolve(questionId: string, optionId: string | null) {
    setResolvingId(questionId);
    try { await onResolveQuestion(questionId, optionId); }
    finally { setResolvingId(null); }
  }

  async function handleDelete(questionId: string) {
    setDeletingId(questionId);
    try { await onDeleteQuestion(questionId); }
    finally { setDeletingId(null); }
  }

  async function handleBulkDeleteZeroBet() {
    setIsBulkDeleting(true);
    setConfirmBulkDelete(false);
    try {
      await onBulkDeleteQuestions(zeroBetQuestions.map((q) => q.id));
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function MatchButton({ match }: { match: AdminMatch }) {
    const stats = questionStatsByMatch.get(match.id) ?? { total: 0, pending: 0, emptyUnresolved: 0, bets: 0 };
    const { total: count, bets, pending, emptyUnresolved } = stats;
    const isSelected = selectedMatchId === match.id;
    const isLive = match.liveStatus === "live" || match.liveStatus === "halftime";
    const kickoff = new Date(match.kickoffAt);
    const dateStr = kickoff.toLocaleDateString("es-CR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    return (
      <button
        key={match.id}
        type="button"
        onClick={() => { setSelectedMatchId(match.id); setQuestionFilter("pending"); }}
        className={cn(
          "flex w-full items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-left transition last:border-0",
          isSelected ? "bg-[#d5ff3f] text-[#06110b]" : "text-white/70 hover:bg-white/5"
        )}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-white/40">
            {isLive ? "LIVE" : dateStr} - {match.group ? `Grupo ${match.group}` : match.stageLabel}
          </p>
          <p className="truncate text-sm font-black">
            {match.homeTeam} vs {match.awayTeam}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {count > 0 && (
            <span className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
              isSelected ? "bg-white/15 text-white" : "bg-white/10 text-white/60"
            )}>
              {count}q
            </span>
          )}
          {pending > 0 && (
            <span className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
              isSelected ? "bg-[#06110b]/15 text-[#06110b]" : "bg-[#f0b429]/15 text-[#f0b429]"
            )}>
              {pending} pendientes
            </span>
          )}
          {emptyUnresolved > 0 && pending === 0 && (
            <span className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
              isSelected ? "bg-white/10 text-white/50" : "bg-white/8 text-white/30"
            )}>
              {emptyUnresolved} vacías
            </span>
          )}
          {bets > 0 && (
            <span className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums",
              isSelected ? "bg-white/10 text-white/60" : "bg-white/10 text-white/40"
            )}>
              {bets}b
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Match selector */}
      <aside className="grid content-start gap-2">
        <p className="text-xs font-black uppercase tracking-wider text-white/40">Partido</p>
        <div className="overflow-hidden rounded-xl border border-white/12 bg-black/35 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
          {pendingPastMatches.length > 0 && (
            <>
              <div className="border-b border-[#f0b429]/25 bg-[#211707]/80 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#f0b429]">Por resolver</p>
              </div>
              {pendingPastMatches.map((match) => <MatchButton key={`pending-${match.id}`} match={match} />)}
            </>
          )}
          {upcomingMatches.length > 0 && (
            <>
              <div className="border-b border-white/10 bg-black/25 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Proximos</p>
              </div>
              {upcomingMatches.map((match) => <MatchButton key={match.id} match={match} />)}
            </>
          )}
          {pastMatches.length > 0 && (
            <>
              <div className="border-b border-white/10 bg-black/25 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/40">Pasados</p>
              </div>
              {pastMatches
                .filter((match) => !pendingPastMatches.some((p) => p.id === match.id))
                .map((match) => <MatchButton key={match.id} match={match} />)}
            </>
          )}
        </div>
      </aside>

      {/* Questions panel */}
      <div className="grid content-start gap-4">
        {selectedMatch && (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Stats & Apuestas</p>
              <h2 className="text-xl font-black text-white">
                #{selectedMatch.number} {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
              </h2>
              {matchQuestions.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-white/45">
                  <span>{matchQuestions.length} pregunta{matchQuestions.length !== 1 ? "s" : ""}</span>
                  <span>-</span>
                  <span>{totalBetsForMatch} apuesta{totalBetsForMatch !== 1 ? "s" : ""} totales</span>
                  {resolvedCount > 0 && (
                    <>
                      <span>-</span>
                      <span className="text-[#9dff34]">{resolvedCount} resuelta{resolvedCount !== 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d5ff3f]/60 bg-[#d5ff3f] text-[#06110b] px-3 py-2 text-sm font-black transition hover:bg-[#efff9a]"
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cancelar" : "Nueva pregunta"}
            </button>
          </div>
        )}

        {matchQuestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/12 bg-black/35 p-2 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
            {([
              ["pending", `Pendientes (${pendingCount})`],
              ["all", `Todas (${matchQuestions.length})`],
              ["resolved", `Resueltas (${resolvedCount})`],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setQuestionFilter(id)}
                className={cn(
                  "h-8 rounded-lg border px-3 text-xs font-black transition",
                  questionFilter === id
                    ? "border-[#d5ff3f]/60 bg-[#d5ff3f] text-[#06110b]"
                    : "border-white/12 bg-white/5 text-white/65 hover:border-white/18 hover:bg-white/10"
                )}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto text-xs font-bold text-white/45">
              Mostrando {visibleQuestions.length + visibleZeroBetSection.length}
            </span>
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="rounded-xl border border-[#d5ff3f]/25 bg-[#10240b]/75 p-4">
            <p className="mb-3 text-sm font-black text-[#d5ff3f]">Nueva pregunta</p>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Ambos equipos anotan?"
              className="mb-3 h-10 w-full rounded-lg border border-white/18 bg-black/35 px-3 text-sm font-bold text-white outline-none focus:border-[#d5ff3f] focus:ring-4 focus:ring-[#d5ff3f]/15"
            />
            <div className="mb-3 grid gap-2">
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => { const next = [...newOptions]; next[i] = e.target.value; setNewOptions(next); }}
                    placeholder={`Opcion ${i + 1}`}
                    className="h-9 flex-1 rounded-lg border border-white/18 bg-black/35 px-3 text-sm font-bold text-white outline-none focus:border-[#d5ff3f] focus:ring-4 focus:ring-[#d5ff3f]/15"
                  />
                  {newOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setNewOptions(newOptions.filter((_, j) => j !== i))}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-white/18 bg-black/35 text-white/50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {newOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setNewOptions([...newOptions, ""])}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-white/18 px-3 text-sm font-bold text-white/50 hover:border-slate-400 hover:text-white/65"
                >
                  <Plus className="h-3 w-3" />
                  Agregar opcion
                </button>
              )}
            </div>
            <div className="mb-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#d5ff3f]">Puntos</p>
              <div className="flex gap-2">
                {[1, 2, 3].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setNewPointValue(pts)}
                    className={cn(
                      "h-9 w-14 rounded-lg border text-sm font-black transition",
                      newPointValue === pts
                        ? "border-[#d5ff3f]/60 bg-[#d5ff3f] text-[#06110b]"
                        : "border-white/18 bg-black/35 text-white/65 hover:border-[#d5ff3f]/45 hover:bg-[#12351f]"
                    )}
                  >
                    {pts}pt{pts !== 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>
            {formError && <p className="mb-3 text-xs font-bold text-[#ffd2c2]">{formError}</p>}
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-lg border border-[#d5ff3f]/60 bg-[#d5ff3f] text-[#06110b] px-4 py-2 text-sm font-black transition hover:bg-[#efff9a] disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Crear pregunta
            </button>
          </div>
        )}

        {/* Zero-bet action bar — past match cleanup */}
        {isPastMatch && zeroBetQuestions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <EyeOff className="h-4 w-4 shrink-0 text-amber-400/70" />
              <span className="text-sm font-black text-amber-200/80">
                {zeroBetQuestions.length} pregunta{zeroBetQuestions.length !== 1 ? "s" : ""} sin apuestas
              </span>
              {pendingWithBets.length === 0 && (
                <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-black text-amber-300/70">
                  Ninguna fue apostada — listo para cerrar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {confirmBulkDelete ? (
                <>
                  <span className="text-xs font-black text-amber-200/80">
                    ¿Eliminar {zeroBetQuestions.length}?
                  </span>
                  <button
                    type="button"
                    disabled={isBulkDeleting}
                    onClick={() => void handleBulkDeleteZeroBet()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-700 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {isBulkDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulkDelete(false)}
                    className="rounded-lg border border-white/18 bg-black/35 px-3 py-1.5 text-xs font-black text-white/65 transition hover:bg-white/8"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={() => setConfirmBulkDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/18 bg-black/35 px-3 py-1.5 text-xs font-black text-white/65 transition hover:border-amber-500/45 hover:bg-amber-950/30 hover:text-amber-200 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar sin apuestas ({zeroBetQuestions.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Questions list */}
        {!matchQuestions.length ? (
          <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/12 bg-black/35 p-6 text-center shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
            <div>
              <p className="text-2xl">📋</p>
              <p className="mt-2 text-sm font-black text-white/65">No hay preguntas para este partido.</p>
            </div>
          </div>
        ) : !visibleQuestions.length && !visibleZeroBetSection.length ? (
          <div className="grid min-h-32 place-items-center rounded-xl border border-dashed border-white/12 bg-black/35 p-6 text-center shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
            <p className="text-sm font-black text-white/50">No hay preguntas en este filtro.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {visibleQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                resolvingId={resolvingId}
                deletingId={deletingId}
                isPastZeroBet={isPastMatch && question.totalBets === 0}
                onResolve={(id, optId) => void handleResolve(id, optId)}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}

            {/* Zero-bet questions shown dimmed below a separator in "pending" view */}
            {visibleZeroBetSection.length > 0 && (
              <div className="mt-1 grid gap-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-white/10" />
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/25">
                    <EyeOff className="h-3 w-3" />
                    Sin apuestas · pueden eliminarse
                  </p>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                {visibleZeroBetSection.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    resolvingId={resolvingId}
                    deletingId={deletingId}
                    isPastZeroBet={true}
                    onResolve={(id, optId) => void handleResolve(id, optId)}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Per-match leaderboard */}
        {statBetLeaderboard.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/12 bg-black/35 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/25 px-4 py-3">
              <Trophy className="h-4 w-4 text-[#d5ff3f]" />
              <p className="text-sm font-black text-white">Tabla - Mini-apuestas</p>
              <span className="ml-auto text-xs font-bold text-white/45">{statBetLeaderboard.length} jugadores</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/25 text-xs">
                    <th className="px-3 py-2.5 text-left font-black uppercase tracking-wide text-white/40">#</th>
                    <th className="px-3 py-2.5 text-left font-black uppercase tracking-wide text-white/40">Jugador</th>
                    <th className="px-3 py-2.5 text-right font-black uppercase tracking-wide text-[#9dff34]">Pts</th>
                    <th className="px-3 py-2.5 text-right font-black uppercase tracking-wide text-white/40">Apuestas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {statBetLeaderboard.map((entry, i) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const isFirst = i === 0;
                    return (
                      <tr key={entry.playerName} className={isFirst ? "bg-[#211707]/80" : "hover:bg-white/5"}>
                        <td className="px-3 py-2.5">
                          {medals[i] ? (
                            <span className="text-base leading-none">{medals[i]}</span>
                          ) : (
                            <span className="text-sm font-black text-white/40">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className={`font-black ${isFirst ? "text-[#f0b429]" : "text-white"}`}>{entry.playerName}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={`font-black tabular-nums ${entry.earned > 0 ? "text-[#d5ff3f]" : "text-slate-300"}`}>
                            {entry.earned}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-xs font-bold tabular-nums text-white/40">{entry.total}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
