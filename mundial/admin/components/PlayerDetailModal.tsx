"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Target, TrendingUp, Clock, ShieldOff, ShieldCheck, Star, MinusCircle } from "lucide-react";
import { Flag } from "../../components/Flag";
import { cn, winnerPickText } from "../../utils";
import type { LeaderboardEntry, BanInfo } from "../adminTypes";

type PlayerMatchDetail = {
  matchId: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  stage: string;
  stageLabel: string;
  homeFinalScore: number | null;
  awayFinalScore: number | null;
  homeRegulationScore: number | null;
  awayRegulationScore: number | null;
  decisionMethod: "regular" | "extraTime" | "penalties" | null;
  actualWinner: "home" | "away" | null;
  hasPrediction: boolean;
  predictedHome: number | null;
  predictedAway: number | null;
  winnerPick: "home" | "away" | null;
  winnerPickMethod: "extraTime" | "penalties" | null;
  points: number | null;
  isExact: boolean;
  correctOutcome: boolean;
  closed: boolean;
};

type PlayerStatBetDetail = {
  questionId: string;
  matchId: string;
  matchNumber: number | null;
  matchLabel: string;
  question: string;
  pickedOption: string;
  correctOption: string | null;
  resolved: boolean;
  correct: boolean;
  points: number;
};

type PlayerDetailResponse = {
  playerName: string;
  predictions: PlayerMatchDetail[];
  statBets: PlayerStatBetDetail[];
  audit: {
    predictionPoints: number;
    statPoints: number;
    totalPoints: number;
  };
};

type Props = {
  entry: LeaderboardEntry;
  onClose: () => void;
};

function PointsBadge({ match }: { match: PlayerMatchDetail }) {
  if (!match.hasPrediction) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#ff6a3d]/35 bg-[#35130d] px-2 py-0.5 text-xs font-black text-[#ffd2c2]">
        <MinusCircle className="h-3 w-3" />
        No apostó · 0pts
      </span>
    );
  }
  if (!match.closed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-black/25/5 px-2 py-0.5 text-xs font-black text-white/45">
        <Clock className="h-3 w-3" />
        Pendiente
      </span>
    );
  }
  if (match.homeFinalScore === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-black/25/5 px-2 py-0.5 text-xs font-black text-white/45">
        Sin resultado
      </span>
    );
  }
  if (match.points === null) return null;

  if (match.isExact && match.points === 4) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#9dff34]/35 bg-[#10240b] px-2 py-0.5 text-xs font-black text-[#d5ff3f]">
        <Target className="h-3 w-3" />
        Exacto + pase + método · {match.points}pts
      </span>
    );
  }
  if (match.isExact && match.points === 1 && match.stage !== "group") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#f0b429]/35 bg-[#211707] px-2 py-0.5 text-xs font-black text-[#f0b429]">
        <Target className="h-3 w-3" />
        Marcador 90′; falló pase/método · 1pt
      </span>
    );
  }
  if (match.isExact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#9dff34]/35 bg-[#10240b] px-2 py-0.5 text-xs font-black text-[#d5ff3f]">
        <Target className="h-3 w-3" />
        Marcador exacto · {match.points}pts
      </span>
    );
  }
  if (match.correctOutcome) {
    const extra =
      match.points === 3 && match.decisionMethod === "penalties"
        ? " + pase + penales"
        : match.points === 2 && match.decisionMethod === "extraTime"
          ? " + pase + TE"
          : "";
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#62ffe6]/35 bg-[#071d2a] px-2 py-0.5 text-xs font-black text-[#62ffe6]">
        <TrendingUp className="h-3 w-3" />
        Resultado{extra} · {match.points}pts
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-[#ff6a3d]/35 bg-[#35130d] px-2 py-0.5 text-xs font-black text-[#ffd2c2]">
      Incorrecto · 0pts
    </span>
  );
}

function finalScoreLabel(match: PlayerMatchDetail) {
  if (match.homeFinalScore === null || match.awayFinalScore === null) return "vs";
  const methodLabel = match.decisionMethod === "extraTime" ? "TE" : match.decisionMethod === "penalties" ? "Pen" : "";
  const regulation =
    methodLabel && match.homeRegulationScore !== null && match.awayRegulationScore !== null
      ? `90' ${match.homeRegulationScore}-${match.awayRegulationScore}`
      : "";
  return [`${match.homeFinalScore}-${match.awayFinalScore}`, methodLabel, regulation].filter(Boolean).join(" · ");
}

export function PlayerDetailModal({ entry, onClose }: Props) {
  const [data, setData] = useState<PlayerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [banLoading, setBanLoading] = useState(true);
  const [banReason, setBanReason] = useState("");
  const [banVisitorId, setBanVisitorId] = useState("");
  const [banWorking, setBanWorking] = useState(false);
  const [banMsg, setBanMsg] = useState("");
  const [showBanForm, setShowBanForm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/mundial/admin/player?name=${encodeURIComponent(entry.normalizedName)}`);
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch {
        setError("No se pudo cargar el detalle del jugador.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [entry.normalizedName]);

  useEffect(() => {
    async function loadBan() {
      try {
        const res = await fetch(`/api/mundial/ban/status?playerName=${encodeURIComponent(entry.normalizedName)}`);
        const json = await res.json() as { banned?: boolean; reason?: string; playerName?: string; bannedAt?: string };
        if (json.banned) {
          setBanInfo({
            normalizedName: entry.normalizedName,
            playerName: entry.playerName,
            reason: json.reason ?? "",
            bannedAt: json.bannedAt ?? "",
            bannedBy: "",
            bannedVisitorIds: [],
            active: true,
          });
        }
      } catch { /* ignore */ } finally {
        setBanLoading(false);
      }
    }
    void loadBan();
  }, [entry.normalizedName, entry.playerName]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleBan() {
    if (!banReason.trim()) { setBanMsg("Escribe el motivo del ban."); return; }
    setBanWorking(true); setBanMsg("");
    try {
      const res = await fetch("/api/mundial/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: entry.playerName,
          visitorId: banVisitorId.trim() || undefined,
          reason: banReason.trim(),
          bannedBy: "admin",
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setBanMsg(json.error ?? "Error al aplicar ban."); return; }
      setBanInfo({
        normalizedName: entry.normalizedName,
        playerName: entry.playerName,
        reason: banReason.trim(),
        bannedAt: new Date().toISOString(),
        bannedBy: "admin",
        bannedVisitorIds: banVisitorId.trim() ? [banVisitorId.trim()] : [],
        active: true,
      });
      setShowBanForm(false);
      setBanMsg("");
    } catch { setBanMsg("Error de red al aplicar ban."); }
    finally { setBanWorking(false); }
  }

  async function handleUnban() {
    setBanWorking(true); setBanMsg("");
    try {
      const res = await fetch("/api/mundial/admin/ban", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ normalizedName: entry.normalizedName }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setBanMsg(json.error ?? "Error al quitar ban."); return; }
      setBanInfo(null);
    } catch { setBanMsg("Error de red al quitar ban."); }
    finally { setBanWorking(false); }
  }

  const predictions = data?.predictions ?? [];
  const statBets = data?.statBets ?? [];
  const auditMatchesLeaderboard = data?.audit.totalPoints === entry.totalPoints;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-2 pb-2 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#06140f] shadow-2xl sm:max-h-[88vh]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/35 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Detalle de jugador</p>
            <h2 className="truncate text-xl font-black leading-tight text-white">
              {entry.playerName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 text-white/45 transition hover:border-[#d5ff3f]/45 hover:bg-[#12351f] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary chips */}
        <div className="shrink-0 flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
          <span className="rounded-lg border border-[#f0b429]/35 bg-[#211707] px-3 py-1 text-xs font-black text-[#f0b429]">
            {entry.totalPoints} pts totales
          </span>
          <span className="rounded-lg border border-[#9dff34]/35 bg-[#10240b] px-3 py-1 text-xs font-black text-[#d5ff3f]">
            {entry.exactScores} exactos
          </span>
          <span className="rounded-lg border border-[#62ffe6]/35 bg-[#071d2a] px-3 py-1 text-xs font-black text-[#62ffe6]">
            {entry.correctOutcomes} resultados
          </span>
          <span className="rounded-lg border border-white/12 bg-black/25/5 px-3 py-1 text-xs font-black text-white/50">
            {entry.scoredPredictions}/{entry.totalPredictions} jugados
          </span>
          {data?.audit && (
            <span className={cn(
              "rounded-lg border px-3 py-1 text-xs font-black",
              auditMatchesLeaderboard
                ? "border-emerald-500/30 bg-emerald-950/35 text-emerald-300"
                : "border-red-500/40 bg-red-950/45 text-red-300"
            )}>
              {auditMatchesLeaderboard
                ? `Verificado: ${data.audit.predictionPoints} partidos + ${data.audit.statPoints} mini-apuestas`
                : `Diferencia: detalle ${data.audit.totalPoints} vs tabla ${entry.totalPoints}`}
            </span>
          )}
        </div>

        {/* Ban section */}
        <div className="shrink-0 border-b border-white/10 px-5 py-3">
          {banLoading ? (
            <div className="flex items-center gap-2 text-xs text-white/35">
              <Loader2 className="h-3 w-3 animate-spin" /> Verificando estado...
            </div>
          ) : banInfo ? (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldOff className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Cuenta suspendida</span>
                  </div>
                  <p className="text-xs text-red-300/80 break-words">Motivo: {banInfo.reason}</p>
                </div>
                <button
                  type="button"
                  disabled={banWorking}
                  onClick={handleUnban}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-900/40 px-3 py-1.5 text-[11px] font-black text-emerald-300 transition hover:bg-emerald-900/70 disabled:opacity-50"
                >
                  <ShieldCheck className="h-3 w-3" />
                  {banWorking ? "..." : "Levantar ban"}
                </button>
              </div>
              {banMsg && <p className="mt-2 text-[11px] text-red-300">{banMsg}</p>}
            </div>
          ) : (
            <div>
              {!showBanForm ? (
                <button
                  type="button"
                  onClick={() => setShowBanForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-1.5 text-[11px] font-black text-red-400 transition hover:bg-red-950/60 hover:border-red-400/50"
                >
                  <ShieldOff className="h-3 w-3" />
                  Suspender cuenta
                </button>
              ) : (
                <div className="rounded-xl border border-red-500/25 bg-red-950/25 p-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400/80">Suspender cuenta</p>
                  <input
                    className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-red-500/50 focus:outline-none"
                    placeholder="Motivo del ban (requerido)"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    maxLength={300}
                  />
                  <input
                    className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-red-500/50 focus:outline-none"
                    placeholder="Visitor ID (opcional, para bloquear el dispositivo)"
                    value={banVisitorId}
                    onChange={(e) => setBanVisitorId(e.target.value)}
                    maxLength={80}
                  />
                  {banMsg && <p className="text-[11px] text-red-300">{banMsg}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={banWorking}
                      onClick={handleBan}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-700 px-4 py-1.5 text-[11px] font-black text-white transition hover:bg-red-600 disabled:opacity-50"
                    >
                      <ShieldOff className="h-3 w-3" />
                      {banWorking ? "Aplicando..." : "Confirmar ban"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowBanForm(false); setBanMsg(""); }}
                      className="rounded-lg border border-white/12 px-4 py-1.5 text-[11px] font-black text-white/50 transition hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid min-h-48 place-items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm font-bold text-[#ffd2c2]">{error}</div>
          ) : predictions.length === 0 && statBets.length === 0 ? (
            <div className="grid min-h-48 place-items-center p-8">
              <p className="text-sm font-black text-white/40">Sin apuestas registradas.</p>
            </div>
          ) : (
            <div>
              {predictions.length > 0 && (
                <>
                  <div className="border-b border-white/10 bg-black/25 px-5 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                      Partidos · aciertos, fallos y puntos
                    </p>
                  </div>
                  <ul className="divide-y divide-white/8">
                    {predictions.map((match) => {
                const hasResult = match.homeFinalScore !== null;
                return (
                  <li key={match.matchId} className={cn(
                    "px-5 py-4",
                    match.hasPrediction && match.isExact && "bg-[#10240b]/45",
                    match.correctOutcome && !match.isExact && "bg-[#071d2a]/45",
                    !match.hasPrediction && "bg-[#35130d]/20",
                    !match.closed && "bg-black/25"
                  )}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        #{match.matchNumber} · {match.stageLabel}
                      </span>
                      <PointsBadge match={match} />
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Flag team={match.homeTeam} size="sm" className="shrink-0 rounded-sm" />
                        <span className="truncate text-sm font-black text-white/80">{match.homeTeam}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        {hasResult ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "w-7 text-center text-base font-black tabular-nums",
                              match.isExact ? "text-emerald-700" : match.correctOutcome ? "text-sky-700" : "text-white"
                            )}>
                              {match.homeFinalScore}
                            </span>
                            <span className="text-xs font-black text-white/25">–</span>
                            <span className={cn(
                              "w-7 text-center text-base font-black tabular-nums",
                              match.isExact ? "text-emerald-700" : match.correctOutcome ? "text-sky-700" : "text-white"
                            )}>
                              {match.awayFinalScore}
                            </span>
                            </div>
                            {match.decisionMethod && match.decisionMethod !== "regular" && (
                              <>
                                <span className="rounded bg-[#d5ff3f]/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#d5ff3f]">
                                  {finalScoreLabel(match)}
                                </span>
                                {match.actualWinner && (
                                  <span className="text-[9px] font-black uppercase tracking-wide text-white/55">
                                    Clasificó {match.actualWinner === "home" ? match.homeTeam : match.awayTeam}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-black text-white/25">vs</span>
                        )}
                        <div className="flex items-center gap-1 rounded-md border border-white/15 bg-black/25 px-2 py-0.5">
                          <span className="text-[10px] font-black text-white/40">apuesta:</span>
                          <span className="text-[11px] font-black tabular-nums text-white/65">
                            {match.hasPrediction ? `${match.predictedHome}–${match.predictedAway}` : "sin apuesta"}
                          </span>
                          {match.winnerPick && (
                            <span className="rounded bg-[#d5ff3f]/10 px-1 py-0.5 text-[9px] font-black text-[#d5ff3f]">
                              {winnerPickText(match.winnerPick, match.winnerPickMethod, match.homeTeam, match.awayTeam, true)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 min-w-0">
                        <span className="truncate text-right text-sm font-black text-white/80">{match.awayTeam}</span>
                        <Flag team={match.awayTeam} size="sm" className="shrink-0 rounded-sm" />
                      </div>
                    </div>
                  </li>
                );
                    })}
                  </ul>
                </>
              )}

              {statBets.length > 0 && (
                <>
                  <div className="border-y border-white/10 bg-black/25 px-5 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                      Mini-apuestas · incluidas en el total
                    </p>
                  </div>
                  <ul className="divide-y divide-white/8">
                    {statBets.map((bet) => (
                      <li key={bet.questionId} className={cn("px-5 py-3", bet.correct ? "bg-[#10240b]/45" : bet.resolved ? "bg-[#35130d]/20" : "bg-black/20")}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wider text-white/35">
                              {bet.matchNumber ? `#${bet.matchNumber} · ` : ""}{bet.matchLabel}
                            </p>
                            <p className="mt-1 text-sm font-black text-white/85">{bet.question}</p>
                            <p className="mt-1 text-xs font-bold text-white/55">
                              Apostó: <span className="text-white/85">{bet.pickedOption}</span>
                              {bet.resolved && !bet.correct && bet.correctOption && (
                                <> · Correcta: <span className="text-[#d5ff3f]">{bet.correctOption}</span></>
                              )}
                            </p>
                          </div>
                          <span className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-black",
                            bet.correct
                              ? "border-purple-400/35 bg-purple-950/35 text-purple-300"
                              : bet.resolved
                                ? "border-[#ff6a3d]/35 bg-[#35130d] text-[#ffd2c2]"
                                : "border-white/12 bg-black/25 text-white/45"
                          )}>
                            {bet.correct ? <Star className="h-3 w-3" /> : bet.resolved ? <MinusCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {bet.resolved ? (bet.correct ? `Correcta · ${bet.points}pt${bet.points === 1 ? "" : "s"}` : "Incorrecta · 0pts") : "Pendiente"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
