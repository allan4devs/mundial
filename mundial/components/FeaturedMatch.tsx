import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, ChevronDown, ChevronRight, ChevronUp, CircleDot, ClipboardList, Clock3, ListChecks, Lock, Timer, Trophy, X, Zap } from "lucide-react";
import { hasAnyLiveStats, type LiveTeamStats } from "@/lib/mundial/live-stats";
import type { Draft, MundialMatch, Prediction } from "../types";
import {
  cn,
  formatKickoff,
  formatUpdatedAt,
  hasFinalScore,
  isMatchClosed,
  isMatchLive,
  livePickStatus,
  liveScoreText,
  liveStatusLabel,
  LIVE_TIMING,
  predictionResult,

} from "../utils";
import { Flag } from "./Flag";
import { teamCode } from "../flags";
import { StatBetsPanel } from "./StatBetsPanel";

type FeaturedMatchProps = {
  match: MundialMatch;
  draft: Draft;
  _predictions: Prediction[];
  nowMs: number;
  activeCountdown?: string;
  playerName: string;
  canPredict: boolean;
  onGoToMine: (matchId?: string) => void;
  onOpenPlayerPicker: () => void;
};

export function FeaturedMatch({
  match,
  draft,
  _predictions,
  nowMs,
  activeCountdown,
  playerName,
  canPredict,
  onGoToMine,
  onOpenPlayerPicker,
}: FeaturedMatchProps) {
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showFinalBetsModal, setShowFinalBetsModal] = useState(false);
  const [showLiveBetsModal, setShowLiveBetsModal] = useState(false);
  const isClosed = isMatchClosed(match, nowMs);
  const isLive = isMatchLive(match);
  const isActive = !!activeCountdown;
  const isKnockoutTie = match.stage !== "group" && draft.homeScore === draft.awayScore;
  const hasLiveDetail = isLive || match.liveEvents.length > 0 || Boolean(match.liveNote);
  const canGoPredict = !isLive && !isClosed && canPredict;
  const pickLiveStatus = livePickStatus(match, draft);

  const homeLiveScore = isLive
    ? (match.homeLiveScore ?? 0)
    : hasFinalScore(match)
      ? (match.homeFinalScore ?? 0)
      : null;

  const awayLiveScore = isLive
    ? (match.awayLiveScore ?? 0)
    : hasFinalScore(match)
      ? (match.awayFinalScore ?? 0)
      : null;

  return (
    <>
    <section
      className={cn(
        "relative min-w-0 overflow-hidden rounded-xl border bg-[#07110d] shadow-[0_24px_70px_rgba(0,0,0,0.32)]",
        isLive
          ? "border-[#9dff34]/70"
          : isClosed
            ? "border-[#ffb15f]/55"
            : isActive
              ? "border-[#f0b429]/65"
              : "border-white/20"
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(90deg,rgba(240,180,41,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />

      {/* Header bar */}
      <div className="relative border-b border-white/12 bg-black/40 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#9dff34] shadow-[0_0_10px_rgba(157,255,52,0.9)]" />
            ) : isClosed ? (
              <Lock className="h-3 w-3 shrink-0 text-[#ffb15f]" />
            ) : (
              <Clock3 className="h-3 w-3 shrink-0 text-[#f0b429]" />
            )}
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/80">
              {isLive ? "En vivo" : isClosed ? "Cerrado" : "Pendiente"}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-[11px] font-bold text-white/50">
              {match.group ? `Grupo ${match.group}` : match.stageLabel}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {isActive && !isLive && (
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-[#d5ff3f]" />
                <span className="text-sm font-black tabular-nums text-[#f0b429]">{activeCountdown}</span>
              </div>
            )}
            <p className="text-[11px] font-bold text-white/40">{formatKickoff(match.kickoffAt)}</p>
          </div>
        </div>
      </div>

      {/* ── LIVE layout: single column, breathing room ── */}
      {isLive ? (
        <div className="space-y-3 p-3 min-[380px]:p-4">
          <LiveMatchScoreboard
            match={match}
            isLive={true}
            homeLiveScore={homeLiveScore ?? 0}
            awayLiveScore={awayLiveScore ?? 0}
          />

          {match.liveNote && (
            <p className="rounded-lg border border-[#9dff34]/20 bg-[#0b1e0e]/70 px-3 py-2 text-sm font-bold leading-snug text-[#e7ffc0]">
              {match.liveNote}
            </p>
          )}

          {/* Prediction strip — compact, inline */}
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 min-[460px]:flex-row min-[460px]:items-center min-[460px]:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2 min-[460px]:flex-nowrap min-[460px]:gap-2.5 min-[460px]:overflow-hidden">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.15em] text-[#f0b429]">
                Tu pick
              </span>
              <span className="text-lg font-black tabular-nums text-white leading-none">
                {draft.homeScore} – {draft.awayScore}
              </span>
              <span className="min-w-0 break-words text-sm font-bold text-white/55 min-[460px]:truncate">
                {predictionResult(match, draft)}
              </span>
              {isKnockoutTie && draft.winnerPick && (
                <span className="shrink-0 text-xs font-bold text-[#d5ff3f]">
                  · Pen: {draft.winnerPick === "home" ? match.homeTeam : match.awayTeam}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onGoToMine(match.id)}
              className="self-start shrink-0 text-xs font-black text-white/45 transition hover:text-white min-[460px]:self-auto"
            >
              Ver picks →
            </button>
          </div>

          {pickLiveStatus && (
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5",
                pickLiveStatus.tone === "lost"
                  ? "border-[#ff6a3d]/55 bg-[#35130d]/85 text-[#ffd2c2]"
                  : "border-[#9dff34]/45 bg-[#10240b]/85 text-[#e7ffc0]"
              )}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.16em]">
                {pickLiveStatus.title}
              </p>
              <p className="mt-1 text-sm font-bold leading-snug">{pickLiveStatus.message}</p>
            </div>
          )}

          {/* Action row */}
          <div className="grid grid-cols-1 gap-2 min-[430px]:grid-cols-2 sm:flex sm:flex-wrap">
            {hasLiveDetail && (
              <button
                type="button"
                onClick={() => setShowLiveModal(true)}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#9dff34]/25 bg-[#0a1e0e] px-3 py-2 text-xs font-black text-[#d5ff3f] transition hover:bg-[#12351f] sm:justify-start"
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                Detalles live
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFinalBetsModal(true)}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#f0b429]/25 bg-[#0a1e0e] px-3 py-2 text-xs font-black text-white transition hover:bg-[#12351f] sm:justify-start"
            >
              <ClipboardList className="h-3.5 w-3.5 shrink-0 text-[#f0b429]" />
              Apuestas al final
            </button>
            <button
              type="button"
              onClick={() => setShowLiveBetsModal(true)}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#d5ff3f]/25 bg-[#0a1e0e] px-3 py-2 text-xs font-black text-white transition hover:bg-[#12351f] sm:justify-start"
            >
              <Activity className="h-3.5 w-3.5 shrink-0 text-[#d5ff3f]" />
              Mini apuestas
            </button>
          </div>

          {/* Live bets — full width, prominent */}
        </div>
      ) : (
        /* ── Non-live: 2-column layout ── */
        <>
          <div className="relative grid grid-cols-1 lg:grid-cols-2">
            {/* Panel 1 — Info del partido */}
            <div className="border-b border-white/10 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:border-white/10">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                Info del partido
              </p>

              <MatchStatusBanner match={match} isLive={false} isClosed={isClosed} />

              {canGoPredict && (
                <button
                  type="button"
                  onClick={() => onGoToMine(match.id)}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-[#d5ff3f]/55 bg-[#d5ff3f] px-4 py-4 text-left text-[#06110b] shadow-[0_14px_36px_rgba(213,255,63,0.18)] transition hover:border-white hover:bg-[#efff9a]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#06110b] text-[#d5ff3f]">
                      <ListChecks className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-black uppercase leading-tight">Hacer mi pick</span>
                      <span className="mt-0.5 block truncate text-sm font-bold text-[#174826]">
                        Ir a Mis Picks para {match.homeTeam} vs {match.awayTeam}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="h-6 w-6 shrink-0" />
                </button>
              )}

              {homeLiveScore !== null ? (
                <LiveMatchScoreboard
                  match={match}
                  isLive={false}
                  homeLiveScore={homeLiveScore}
                  awayLiveScore={awayLiveScore!}
                />
              ) : (
                <div className="mt-5 flex items-center justify-center gap-6 py-3">
                  <div className="flex flex-col items-center gap-2">
                    <Flag team={match.homeTeam} size="lg" className="rounded-sm" />
                    <p className="text-sm font-black uppercase text-white">{teamCode(match.homeTeam)}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Trophy className="h-4 w-4 text-[#f0b429]" />
                    <span className="text-[9px] font-black tracking-wide text-white/25">WC26</span>
                    <span className="mt-0.5 text-base font-black text-white/20">vs</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Flag team={match.awayTeam} size="lg" className="rounded-sm" />
                    <p className="text-sm font-black uppercase text-white">{teamCode(match.awayTeam)}</p>
                  </div>
                </div>
              )}

              {hasLiveDetail && (
                <button
                  type="button"
                  onClick={() => setShowLiveModal(true)}
                  className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-[#9dff34]/25 bg-black/25 px-3 py-2.5 text-left transition hover:bg-white/5"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#d5ff3f]">
                    <Zap className="h-4 w-4 shrink-0" />
                    Ver detalles live
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/45" />
                </button>
              )}
            </div>

            {/* Panel 2 — Tu predicción (read-only) */}
            <div className="p-4 sm:p-5">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                Tu predicción
              </p>

              <div className="mt-4 rounded-lg border border-white/15 bg-black/35 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f0b429]">
                  {isClosed ? "Tu pick guardado" : "Tu predicción actual"}
                </p>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-5xl font-black tabular-nums text-white leading-none">{draft.homeScore}</span>
                  <span className="text-2xl font-black text-white/20">–</span>
                  <span className="text-5xl font-black tabular-nums text-white leading-none">{draft.awayScore}</span>
                </div>
                <p className="mt-2 break-words text-xl font-black text-white/80">
                  {predictionResult(match, draft)}
                </p>
                {isKnockoutTie && draft.winnerPick && (
                  <p className="mt-1 text-sm font-bold text-[#d5ff3f]">
                    Penales: {draft.winnerPick === "home" ? match.homeTeam : match.awayTeam}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onGoToMine(match.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-white/60 transition hover:border-[#f0b429]/40 hover:bg-[#12200a] hover:text-white"
              >
                <ChevronRight className="h-4 w-4 text-[#f0b429]" />
                {isClosed ? "Ver todos mis picks →" : "Editar pick en Mis Picks →"}
              </button>
            </div>
          </div>

          {/* Card footer — modal shortcuts */}
          <div className="flex flex-wrap gap-2 border-t border-white/8 p-3">
            <button
              type="button"
              onClick={() => setShowFinalBetsModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0b429]/25 bg-[#0a1e0e] px-3 py-2 text-xs font-black text-white transition hover:bg-[#12351f]"
            >
              <ClipboardList className="h-3.5 w-3.5 shrink-0 text-[#f0b429]" />
              Apuestas al final
            </button>
          </div>
        </>
      )}
    </section>
    {showLiveModal && (
      <LiveDetailsModal match={match} onClose={() => setShowLiveModal(false)} />
    )}
    {showFinalBetsModal && (
      <FinalBetsModal
        match={match}
        playerName={playerName}
        onOpenPlayerPicker={onOpenPlayerPicker}
        onClose={() => setShowFinalBetsModal(false)}
      />
    )}
    {showLiveBetsModal && (
      <LiveBetsModal
        match={match}
        playerName={playerName}
        onOpenPlayerPicker={onOpenPlayerPicker}
        onClose={() => setShowLiveBetsModal(false)}
      />
    )}
    </>
  );
}

function FinalBetsModal({
  match,
  playerName,
  onOpenPlayerPicker,
  onClose,
}: {
  match: MundialMatch;
  playerName: string;
  onOpenPlayerPicker: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#f0b429]/35 bg-[#06140f] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/12 bg-[#12351f] px-4 py-3 [background-image:linear-gradient(135deg,rgba(240,180,41,0.18),transparent_58%)]">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-[#f0b429]" />
            <p className="font-black text-white">Apuestas al final</p>
            <span className="truncate text-xs text-white/50">{match.homeTeam} vs {match.awayTeam}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/20 bg-black/20 text-white/75 transition hover:border-[#d5ff3f] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <StatBetsPanel
            matchId={match.id}
            playerName={playerName}
            matchLabel={`${match.homeTeam} vs ${match.awayTeam}`}
            variant="full"
            questionScope="final"
            onOpenPlayerPicker={onOpenPlayerPicker}
          />
        </div>
      </div>
    </div>
  );
}

function LiveBetsModal({
  match,
  playerName,
  onOpenPlayerPicker,
  onClose,
}: {
  match: MundialMatch;
  playerName: string;
  onOpenPlayerPicker: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const matchLabel = `${match.homeTeam} vs ${match.awayTeam}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#d5ff3f]/35 bg-[#06140f] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/12 bg-[#12351f] px-4 py-3 [background-image:linear-gradient(135deg,rgba(213,255,63,0.14),transparent_58%)]">
          <div className="flex min-w-0 items-center gap-2">
            <Activity className="h-4 w-4 shrink-0 text-[#d5ff3f]" />
            <p className="font-black text-white">Mini apuestas</p>
            <span className="truncate text-xs text-white/50">{matchLabel}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/20 bg-black/20 text-white/75 transition hover:border-[#d5ff3f] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <StatBetsPanel
            matchId={match.id}
            playerName={playerName}
            matchLabel={matchLabel}
            variant="mini"
            questionScope="live"
            onOpenPlayerPicker={onOpenPlayerPicker}
          />
        </div>
      </div>
    </div>
  );
}

function MatchStatusBanner({
  match,
  isLive,
  isClosed,
}: {
  match: MundialMatch;
  isLive: boolean;
  isClosed: boolean;
}) {
  if (isLive) {
    return (
      <div className="rounded-xl border border-[#9dff34]/45 bg-[#10240b]/80 px-3 py-3 text-[#e7ffc0]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex min-w-0 items-center gap-2 text-sm font-black">
            <Zap className="h-4 w-4 shrink-0 text-[#d5ff3f]" />
            <span>{liveStatusLabel(match)}</span>
            <span className="text-white/30">/</span>
            <span className="truncate">{liveScoreText(match)}</span>
          </p>
          <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1 text-[11px] font-black text-white/70">
            {formatUpdatedAt(match.liveUpdatedAt)}
          </span>
        </div>
        {match.liveNote ? (
          <p className="mt-2 text-sm font-bold leading-snug text-white/70">{match.liveNote}</p>
        ) : null}
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#ffb15f]/45 bg-[#2a120b]/70 px-3 py-2.5 text-[#ffd9a8]">
        <Lock className="h-4 w-4 shrink-0 text-[#ffb15f]" />
        <p className="text-sm font-bold">
          {hasFinalScore(match) ? "Resultado final registrado." : "Partido cerrado; resultado pendiente."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#f0b429]/35 bg-[#1a2206]/75 px-3 py-2.5 text-[#fff1b8]">
      <Clock3 className="h-4 w-4 shrink-0 text-[#f0b429]" />
      <p className="text-sm font-bold">El pick se bloquea cuando inicia el partido. Revisa y guarda antes del cierre.</p>
    </div>
  );
}

function useLiveClock(match: MundialMatch, isLive: boolean) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [isLive]);

  return useMemo(() => {
    if (!isLive) return null;

    const status = match.liveStatus;

    // Halftime: clock frozen at 45:00
    if (status === "halftime") return { mins: 45, secs: 0 };

    if (status !== "live") return null;

    // Admin anchored the minute with its own timestamp — use that as base
    if (match.liveMinute !== null && match.liveMinuteUpdatedAt) {
      const anchorMs = new Date(match.liveMinuteUpdatedAt).getTime();
      if (Number.isFinite(anchorMs)) {
        const elapsedMs = Math.max(0, nowMs - anchorMs);
        const totalSec = Math.floor(elapsedMs / 1_000);
        return {
          mins: match.liveMinute + Math.floor(totalSec / 60),
          secs: totalSec % 60,
        };
      }
    }

    // Fallback: derive from kickoff (auto-live with no admin minute set)
    const koMs = new Date(match.kickoffAt).getTime();
    if (!Number.isFinite(koMs)) return null;
    const totalSec = Math.max(0, Math.floor((nowMs - koMs) / 1_000));
    const halftimeMinutes =
      match.stage === "final"
        ? LIVE_TIMING.finalHalftimeMinutes
        : LIVE_TIMING.standardHalftimeMinutes;
    const firstHalfSec =
      (LIVE_TIMING.halfMinutes +
        LIVE_TIMING.hydrationBreakMinutes +
        LIVE_TIMING.averageStoppagePerHalfMinutes) * 60;
    const halftimeSec = halftimeMinutes * 60;
    const maxFirstHalfDisplay = (LIVE_TIMING.halfMinutes + LIVE_TIMING.averageStoppagePerHalfMinutes) * 60;
    const maxSecondHalfDisplay = ((LIVE_TIMING.halfMinutes * 2) + LIVE_TIMING.averageStoppagePerHalfMinutes) * 60;

    if (totalSec < firstHalfSec) {
      const displaySec = Math.min(totalSec, maxFirstHalfDisplay);
      return { mins: Math.floor(displaySec / 60), secs: displaySec % 60 };
    }
    if (totalSec < firstHalfSec + halftimeSec) {
      return { mins: 45, secs: 0 };
    }
    const secondHalfSec = totalSec - firstHalfSec - halftimeSec;
    const displaySec = Math.min((LIVE_TIMING.halfMinutes * 60) + secondHalfSec, maxSecondHalfDisplay);
    return { mins: Math.floor(displaySec / 60), secs: displaySec % 60 };
  }, [isLive, match, nowMs]);
}

function LiveMatchScoreboard({
  match,
  isLive,
  homeLiveScore,
  awayLiveScore,
}: {
  match: MundialMatch;
  isLive: boolean;
  homeLiveScore: number;
  awayLiveScore: number;
}) {
  const clock = useLiveClock(match, isLive);

  const homeGoals = goalSummary(match, "home", homeLiveScore);
  const awayGoals = goalSummary(match, "away", awayLiveScore);
  const tone = isLive ? "border-[#9dff34]/35 bg-[#071b0b]/88" : "border-[#ffb15f]/35 bg-[#1b0d05]/88";
  const clockTone = isLive ? "border-[#9dff34]/45 text-[#d5ff3f]" : "border-[#ffb15f]/45 text-[#ffb15f]";
  const scoreTone = isLive
    ? "border-[#9dff34]/45 bg-[#0c2409] text-[#9dff34]"
    : "border-[#ffb15f]/45 bg-[#261006] text-[#ffb15f]";

  const clockLabel = (() => {
    if (!isLive) return formatLiveMinute(match);
    if (clock) return `${clock.mins}:${String(clock.secs).padStart(2, "0")}`;
    return "En vivo";
  })();

  return (
    <div className={cn("mt-2 overflow-hidden rounded-xl border shadow-[0_18px_45px_rgba(0,0,0,0.25)] min-[380px]:mt-3 min-[380px]:rounded-2xl", tone)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/35 px-3 py-2">
        <span className={cn("inline-flex items-center gap-2 rounded-full border bg-black/35 px-3 py-1 text-xs font-black uppercase tracking-wide", clockTone)}>
          <span className={cn("h-2 w-2 rounded-full", isLive ? "animate-pulse bg-[#9dff34]" : "bg-[#ffb15f]")} />
          {isLive ? "Ahora" : "Marcador"}
        </span>
        <span className="text-xs font-black tabular-nums text-white/75">
          {clockLabel}
        </span>
      </div>

      <div className="px-2.5 py-3 min-[380px]:px-3">
        {/* [Home team] [SCORE – SCORE] [Away team] */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-3">
          <div className="flex min-w-0 flex-col items-center gap-1 text-center min-[420px]:flex-row min-[420px]:text-left">
            <Flag team={match.homeTeam} size="sm" className="rounded-sm" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{teamCode(match.homeTeam)}</p>
              <p className="max-w-16 truncate text-[11px] font-black text-white min-[420px]:max-w-none min-[420px]:text-xs">{match.homeTeam}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 min-[380px]:gap-1 sm:gap-2">
            <span className={cn(
              "grid h-11 w-11 place-items-center rounded-lg border text-4xl font-black tabular-nums leading-none min-[380px]:h-14 min-[380px]:w-14 min-[380px]:rounded-xl min-[380px]:text-5xl sm:h-16 sm:w-16 sm:text-5xl",
              scoreTone
            )}>
              {homeLiveScore}
            </span>
            <span className="text-sm font-black text-white/25">–</span>
            <span className={cn(
              "grid h-11 w-11 place-items-center rounded-lg border text-4xl font-black tabular-nums leading-none min-[380px]:h-14 min-[380px]:w-14 min-[380px]:rounded-xl min-[380px]:text-5xl sm:h-16 sm:w-16 sm:text-5xl",
              scoreTone
            )}>
              {awayLiveScore}
            </span>
          </div>

          <div className="flex min-w-0 flex-col-reverse items-center justify-end gap-1 text-center min-[420px]:flex-row min-[420px]:text-right">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{teamCode(match.awayTeam)}</p>
              <p className="max-w-16 truncate text-[11px] font-black text-white min-[420px]:max-w-none min-[420px]:text-xs">{match.awayTeam}</p>
            </div>
            <Flag team={match.awayTeam} size="sm" className="rounded-sm" />
          </div>
        </div>

        {/* Goals row */}
        <div className="mt-3 grid grid-cols-1 gap-2 border-t border-white/8 pt-3 min-[420px]:grid-cols-2">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-white/35">
              <CircleDot className="h-3 w-3" />
              Goles
            </p>
            <p className="mt-0.5 break-words text-xs font-bold leading-snug text-white/65">{homeGoals}</p>
          </div>
          <div className="min-w-0 min-[420px]:text-right">
            <p className="inline-flex w-full items-center gap-1 text-[10px] font-black uppercase tracking-wide text-white/35 min-[420px]:justify-end">
              Goles
              <CircleDot className="h-3 w-3" />
            </p>
            <p className="mt-0.5 break-words text-xs font-bold leading-snug text-white/65">{awayGoals}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStatsDisclosure({
  match,
  open,
  onToggle,
}: {
  match: MundialMatch;
  open: boolean;
  onToggle: () => void;
}) {
  const hasStats = hasAnyLiveStats(match.liveStats);
  const possession = possessionText(match.liveStats.home.possessionPct, match.liveStats.away.possessionPct);
  const shotsOnTarget = statPairText(match.liveStats.home.shotsOnTarget, match.liveStats.away.shotsOnTarget);
  const cards = cardsPairText(match.liveStats.home, match.liveStats.away);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/12 bg-black/25">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-white/5"
      >
        <span className="inline-flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#d5ff3f]">
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span>Más stats</span>
        </span>
        <span className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex">
          <StatChip label="Pos." value={possession} />
          <StatChip label="TAM" value={shotsOnTarget} />
          <StatChip label="Tarj." value={cards} />
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-white/45" /> : <ChevronDown className="h-4 w-4 shrink-0 text-white/45" />}
      </button>

      {open && (
        <div className="grid gap-2 border-t border-white/10 px-3 py-3">
          {hasStats ? (
            LIVE_STAT_ROWS.map((row) => (
              <StatsComparisonRow
                key={row.key}
                label={row.label}
                home={match.liveStats.home[row.key]}
                away={match.liveStats.away[row.key]}
                suffix={row.suffix}
                bar={row.key === "possessionPct"}
              />
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-3 text-sm font-bold text-white/55">
              Stats pendientes del admin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/60">
      {label} {value}
    </span>
  );
}

const LIVE_STAT_ROWS: Array<{ key: keyof LiveTeamStats; label: string; suffix?: string }> = [
  { key: "possessionPct", label: "Posesión", suffix: "%" },
  { key: "shots", label: "Tiros" },
  { key: "shotsOnTarget", label: "Tiros a marco" },
  { key: "assists", label: "Asistencias" },
  { key: "passesCompleted", label: "Pases completados" },
  { key: "distanceCovered", label: "Distancia", suffix: "km" },
  { key: "topSpeed", label: "Vel. máxima", suffix: "km/h" },
  { key: "foulsFor", label: "Faltas recibidas" },
  { key: "yellowCards", label: "Amarillas" },
  { key: "redCards", label: "Rojas" },
  { key: "corners", label: "Córners" },
  { key: "fouls", label: "Faltas cometidas" },
  { key: "saves", label: "Atajadas" },
];

function StatsComparisonRow({
  label,
  home,
  away,
  suffix = "",
  bar = false,
}: {
  label: string;
  home: number | null;
  away: number | null;
  suffix?: string;
  bar?: boolean;
}) {
  const homeText = statValue(home, suffix);
  const awayText = statValue(away, suffix);
  const homePct = bar && home !== null ? Math.max(0, Math.min(100, home)) : null;

  return (
    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 rounded-lg border border-white/10 bg-[#06100b]/75 px-3 py-2">
      <span className="text-left text-sm font-black tabular-nums text-white">{homeText}</span>
      <div className="min-w-0">
        <p className="mb-1 text-center text-[10px] font-black uppercase tracking-wide text-white/40">{label}</p>
        {homePct !== null ? (
          <div className="flex h-1.5 overflow-hidden rounded-full bg-[#ffb15f]/45">
            <span className="block h-full bg-[#9dff34]" style={{ width: `${homePct}%` }} />
          </div>
        ) : (
          <div className="h-1.5 rounded-full bg-white/10" />
        )}
      </div>
      <span className="text-right text-sm font-black tabular-nums text-white">{awayText}</span>
    </div>
  );
}


function LiveTimeline({ match }: { match: MundialMatch }) {
  const events = dedupeLiveEvents(match.liveEvents).sort((a, b) => (b.minute ?? -1) - (a.minute ?? -1));

  return (
    <div className="rounded-lg border border-[#9dff34]/35 bg-black/35 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex min-w-0 items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#d5ff3f]">
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Momentos live</span>
        </p>
        <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1 text-xs font-black text-white/65">
          {liveStatusLabel(match)}
        </span>
      </div>

      {match.liveNote && (
        <p className="mb-3 rounded-md border border-white/10 bg-[#10240b]/75 px-3 py-2 text-sm font-bold text-[#e7ffc0]">
          {match.liveNote}
        </p>
      )}

      {events.length ? (
        <div className="grid gap-2">
          {events.map((event) => {
            const team = event.team === "home" ? match.homeTeam : event.team === "away" ? match.awayTeam : "";
            const title = event.player || event.note || eventTypeLabel(event.type);

            return (
              <div
                key={event.id}
                className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 rounded-md border border-white/10 bg-[#05070d]/80 px-3 py-2"
              >
                <span className="rounded bg-[#174826] px-2 py-1 text-center text-xs font-black tabular-nums text-white">
                  {event.minute !== null ? `${event.minute}'` : "--"}
                </span>
                <div className="min-w-0">
                  <p className="min-w-0 break-words text-sm font-black text-white">
                    {eventTypeLabel(event.type)}
                    {team ? <span className="text-[#d5ff3f]"> / {teamCode(team)}</span> : null}
                    {title !== eventTypeLabel(event.type) ? <span> / {title}</span> : null}
                  </p>
                  {event.note && event.note !== title && (
                    <p className="mt-0.5 min-w-0 break-words text-xs font-bold text-white/55">{event.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-white/15 bg-black/20 px-3 py-3 text-sm font-bold text-white/55">
          Esperando eventos del admin.
        </p>
      )}
    </div>
  );
}

function eventTypeLabel(type: string) {
  if (type === "goal") return "Gol";
  if (type === "penalty") return "Penal";
  if (type === "yellow") return "Amarilla";
  if (type === "red") return "Roja";
  if (type === "var") return "VAR";
  if (type === "substitution") return "Cambio";
  return "Nota";
}

function formatLiveMinute(match: MundialMatch) {
  if (match.liveStatus === "live") return match.liveMinute !== null ? `Min ${match.liveMinute}'` : "En vivo";
  if (match.liveStatus === "halftime") return "Descanso";
  if (match.liveStatus === "fulltime") return "Finalizado";
  return "Programado";
}

function liveEventSignature(event: MundialMatch["liveEvents"][number]) {
  return [
    event.type,
    event.team ?? "general",
    event.minute ?? "",
    event.player.trim().toUpperCase(),
    event.note.trim().toUpperCase(),
  ].join("|");
}

function dedupeLiveEvents(events: MundialMatch["liveEvents"]) {
  const seen = new Set<string>();

  return events.filter((event) => {
    const signature = liveEventSignature(event);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function goalSummary(match: MundialMatch, team: "home" | "away", score: number) {
  const goals = dedupeLiveEvents(match.liveEvents)
    .filter((event) => (event.type === "goal" || event.type === "penalty") && event.team === team)
    .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));

  if (goals.length > 0) {
    return goals
      .map((event) => {
        const minute = event.minute !== null ? ` ${event.minute}'` : "";
        const scorer = event.player || event.note || eventTypeLabel(event.type);
        return `${scorer}${minute}`;
      })
      .join(", ");
  }

  if (score > 0) return `${score} gol${score === 1 ? "" : "es"} sin detalle`;
  return "Sin goles";
}

function statValue(value: number | null, suffix = "") {
  return value === null ? "—" : `${value}${suffix}`;
}

function statPairText(home: number | null, away: number | null, suffix = "") {
  if (home === null && away === null) return "—";
  return `${statValue(home, suffix)}-${statValue(away, suffix)}`;
}

function possessionText(home: number | null, away: number | null) {
  if (home === null && away === null) return "—";
  return `${statValue(home, "%")}/${statValue(away, "%")}`;
}

function cardValue(stats: LiveTeamStats) {
  if (stats.yellowCards === null && stats.redCards === null) return "—";
  const yellow = stats.yellowCards ?? 0;
  const red = stats.redCards ?? 0;
  return red > 0 ? `${yellow}A/${red}R` : `${yellow}A`;
}

function cardsPairText(home: LiveTeamStats, away: LiveTeamStats) {
  return `${cardValue(home)}-${cardValue(away)}`;
}

function LiveDetailsModal({ match, onClose }: { match: MundialMatch; onClose: () => void }) {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const hasDetail = match.liveEvents.length > 0 || Boolean(match.liveNote);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#9dff34]/35 bg-[#06140f] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/12 bg-black/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#9dff34]" />
            <p className="font-black text-white">Detalles live</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/20 bg-black/20 text-white/75 transition hover:border-[#d5ff3f] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 grid gap-4">
          <LiveStatsDisclosure match={match} open={showStats} onToggle={() => setShowStats((v) => !v)} />
          {hasDetail && <LiveTimeline match={match} />}
        </div>
      </div>
    </div>
  );
}
