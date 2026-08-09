import { CalendarDays, Check, Star, TrendingUp, Users, X as XIcon } from "lucide-react";
import { useMemo } from "react";
import type { MundialMatch, Prediction } from "../types";
import { cn, formatKickoff, normalizeKey } from "../utils";
import { teamCode } from "../flags";
import { computePredictionResult } from "@/lib/mundial/prediction-scoring";
import { Flag } from "./Flag";

type Outcome = "home" | "draw" | "away";
type PickStatus = {
  showIndicator: boolean;
  isWinning: boolean;
  isExact: boolean;
  points: number | null;
  kind: "exact" | "outcome" | "bonus" | "miss" | "pending";
};

function getOutcome(home: number, away: number): Outcome {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

function formatWinnerPick(match: MundialMatch, prediction: Prediction) {
  if (!prediction.winnerPick) return null;
  const team = prediction.winnerPick === "home" ? match.homeTeam : match.awayTeam;
  const methodLabel = prediction.winnerPickMethod === "extraTime"
    ? "tiempos extra"
    : prediction.winnerPickMethod === "penalties"
      ? "penales"
      : "";

  return match.stage === "group"
    ? null
    : `Pasa ${team}${methodLabel ? ` (${methodLabel})` : ""}`;
}

function pickStatus(match: MundialMatch, prediction: Prediction): PickStatus {
  const hasFinalScore =
    match.homeFinalScore !== null &&
    match.awayFinalScore !== null;
  const hasLiveScore =
    match.homeLiveScore !== null &&
    match.awayLiveScore !== null;

  const refHome = hasFinalScore ? match.homeFinalScore : match.homeLiveScore;
  const refAway = hasFinalScore ? match.awayFinalScore : match.awayLiveScore;
  const hasRef = refHome !== null && refAway !== null;
  const showIndicator = hasRef && (hasFinalScore || match.closed || hasLiveScore);

  if (!hasRef) {
    return { showIndicator: false, isWinning: false, isExact: false, points: null, kind: "pending" };
  }

  if (hasFinalScore) {
    const result = computePredictionResult(
      {
        stage: match.stage,
        homeFinalScore: refHome,
        awayFinalScore: refAway,
        homeRegulationScore: hasFinalScore ? match.homeRegulationScore : null,
        awayRegulationScore: hasFinalScore ? match.awayRegulationScore : null,
        actualWinner: match.actualWinner,
        decisionMethod: match.decisionMethod ?? undefined,
      },
      {
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        winnerPick: prediction.winnerPick,
        winnerPickMethod: prediction.winnerPickMethod,
      },
    );

    return {
      showIndicator,
      isWinning: result.correctOutcome || result.kind === "bonus",
      isExact: result.exactScore,
      points: result.points,
      kind: result.kind,
    };
  }

  const isWinning = getOutcome(prediction.homeScore, prediction.awayScore) === getOutcome(refHome, refAway);
  const isExact = prediction.homeScore === refHome && prediction.awayScore === refAway;

  return { showIndicator, isWinning, isExact, points: null, kind: "pending" };
}

type OtherPicksPanelProps = {
  match: MundialMatch;
  predictions: Prediction[];
  playerName: string;
  showEmpty?: boolean;
};

export function OtherPicksPanel({ match, predictions, playerName, showEmpty = false }: OtherPicksPanelProps) {
  const matchPicks = useMemo(
    () => predictions.filter((p) => p.matchId === match.id),
    [predictions, match.id]
  );

  const { homeWins, draws, awayWins } = useMemo(() => {
    let h = 0;
    let d = 0;
    let a = 0;

    for (const p of matchPicks) {
      const o = getOutcome(p.homeScore, p.awayScore);
      if (o === "home") h++;
      else if (o === "draw") d++;
      else a++;
    }

    return { homeWins: h, draws: d, awayWins: a };
  }, [matchPicks]);

  const total = matchPicks.length;
  if (total === 0 && !showEmpty) return null;

  const pctHome = total > 0 ? Math.round((homeWins / total) * 100) : 0;
  const pctDraw = total > 0 ? Math.round((draws / total) * 100) : 0;
  const pctAway = total > 0 && awayWins > 0 ? 100 - pctHome - pctDraw : 0;

  const myKey = normalizeKey(playerName);

  const sorted = [...matchPicks].sort((a, b) => {
    const aIsMe = normalizeKey(a.playerName) === myKey;
    const bIsMe = normalizeKey(b.playerName) === myKey;
    const aStatus = pickStatus(match, a);
    const bStatus = pickStatus(match, b);
    if (aStatus.isExact !== bStatus.isExact) return aStatus.isExact ? -1 : 1;
    if (aStatus.isWinning !== bStatus.isWinning) return aStatus.isWinning ? -1 : 1;
    if (aIsMe && !bIsMe) return -1;
    if (!aIsMe && bIsMe) return 1;
    return a.playerName.localeCompare(b.playerName);
  });

  const scoreCounts = new Map<string, number>();
  for (const p of matchPicks) {
    const key = `${p.homeScore}-${p.awayScore}`;
    scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1);
  }
  const popularEntry = [...scoreCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const [popularScore, popularCount] = popularEntry ?? ["?", 0];

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#f0b429]/45 bg-[#06140f] shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
      <div className="bg-[#12351f] px-5 py-4 sm:px-6 [background-image:linear-gradient(135deg,rgba(240,180,41,0.22),transparent_58%)]">
        <div className="flex flex-col items-stretch gap-3 min-[620px]:flex-row min-[620px]:items-center min-[620px]:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#f0b429]/40 bg-[#f0b429] text-[#07110b]">
              <Users className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d5ff3f]">Picks de amigos</p>
              <h2 className="mt-1 text-lg font-black uppercase text-white sm:text-xl">
                {teamCode(match.homeTeam)} vs {teamCode(match.awayTeam)}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-white/75 sm:text-sm">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{formatKickoff(match.kickoffAt)}</span>
              </p>
            </div>
          </div>
          <span className="rounded-md border border-white/20 bg-black/25 px-3 py-1.5 text-sm font-black text-white">
            {total} {total === 1 ? "pick" : "picks"}
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {total > 0 ? (
          <div className="grid gap-3 2xl:grid-cols-[minmax(18rem,1fr)_15rem] 2xl:items-start">
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d5ff3f]">Amigos</p>
                <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1 text-xs font-black tabular-nums text-white/75">
                  {sorted.length}
                </span>
              </div>

              <div className="max-h-[36rem] space-y-3 overflow-y-auto pr-2">
                {sorted.map((p) => {
                  const isMe = normalizeKey(p.playerName) === myKey;
                  const outcome = getOutcome(p.homeScore, p.awayScore);
                  const { showIndicator, isWinning, isExact, points, kind } = pickStatus(match, p);
                  const winnerText = formatWinnerPick(match, p);
                  const hasFinalScore =
                    match.homeFinalScore !== null && match.awayFinalScore !== null;
                  const statusLabel =
                    kind === "exact"
                      ? "Exacto"
                      : kind === "outcome"
                        ? "Resultado"
                        : kind === "bonus"
                          ? "Bonus TE"
                          : kind === "miss"
                            ? "Fallo"
                            : showIndicator && !hasFinalScore
                              ? "En vivo"
                              : "Pendiente";

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "grid grid-cols-1 items-start gap-3 rounded-lg border px-4 py-3 min-h-[64px] min-[520px]:grid-cols-[minmax(0,1fr)_auto] min-[520px]:items-center min-[520px]:gap-4",
                        kind === "exact"
                          ? "border-[#f0b429]/70 bg-[#211706]/80 shadow-[0_0_18px_rgba(240,180,41,0.14)]"
                          : isMe
                            ? "border-[#9dff34]/60 bg-[#10240b]/80"
                            : "border-white/10 bg-black/35"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {isMe && <span className="h-2 w-2 shrink-0 rounded-full bg-[#d5ff3f] shadow-[0_0_10px_rgba(213,255,63,0.9)]" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "min-w-0 text-base font-black leading-tight break-words",
                                isMe ? "text-[#d5ff3f]" : "text-white"
                              )}
                              title={isMe ? "Vos" : p.playerName}
                            >
                              {isMe ? "Vos" : p.playerName}
                            </span>
                            {kind === "exact" && (
                              <span className="hidden shrink-0 rounded border border-[#f0b429]/55 bg-[#f0b429]/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#f0b429] min-[460px]:inline">
                                Exacto
                              </span>
                            )}
                            {winnerText && (
                              <span className="hidden shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-white/70 min-[460px]:inline">
                                {winnerText}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white/70">
                              {statusLabel}
                            </span>
                            {points !== null && (
                              <span className="rounded-md border border-[#62ffe6]/40 bg-[#071d2a]/90 px-2 py-1 text-[10px] font-black text-[#62ffe6]">
                                +{points}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 justify-self-end">
                        <Flag team={match.homeTeam} size="sm" />
                        <span
                          className={cn(
                            "rounded-md border px-2 py-1 text-sm font-black tabular-nums sm:text-base",
                            outcome === "home"
                              ? "border-[#34d399]/60 bg-[#052e1a] text-[#34d399]"
                              : outcome === "draw"
                                ? "border-[#d5ff3f]/60 bg-[#1a2206] text-[#d5ff3f]"
                                : "border-[#ff6a3d]/60 bg-[#2a120b] text-[#ffb15f]"
                          )}
                        >
                          {p.homeScore}-{p.awayScore}
                        </span>
                        <Flag team={match.awayTeam} size="sm" />
                        {showIndicator && (
                          isExact ? (
                            <Star className="h-4 w-4 shrink-0 fill-[#f0b429] text-[#f0b429]" />
                          ) : isWinning ? (
                            <Check className="h-4 w-4 shrink-0 text-[#9dff34]" />
                          ) : (
                            <XIcon className="h-4 w-4 shrink-0 text-[#ff6a3d]" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="min-w-0 rounded-lg border border-white/15 bg-black/35 p-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="inline-flex min-w-0 items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#d5ff3f]">
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#f0b429]" />
                  <span className="truncate">Stats</span>
                </p>
                {popularCount > 1 && (
                  <span className="shrink-0 rounded-md border border-[#d5ff3f]/50 bg-[#1a2206] px-2 py-1 text-[11px] font-black text-[#d5ff3f]">
                    {popularScore}
                  </span>
                )}
              </div>
              <div className="grid gap-3">
                <DistBar team={match.homeTeam} label={teamCode(match.homeTeam)} pct={pctHome} count={homeWins} color="emerald" />
                <DistBar label="EMP" pct={pctDraw} count={draws} color="lime" />
                <DistBar team={match.awayTeam} label={teamCode(match.awayTeam)} pct={pctAway} count={awayWins} color="orange" />
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/20 bg-black/35 p-6 text-center">
            <Users className="mx-auto h-10 w-10 text-[#f0b429]" />
            <p className="mt-3 text-lg font-black text-white">Sin marcadores guardados</p>
            <p className="mt-2 text-sm font-bold text-white/60">
              Cuando otros jugadores guarden este partido, van a aparecer aqui.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DistBar({
  team,
  label,
  pct,
  count,
  color,
}: {
  team?: string;
  label: string;
  pct: number;
  count: number;
  color: "emerald" | "lime" | "orange";
}) {
  const barClass =
    color === "emerald"
      ? "bg-[#34d399]"
      : color === "lime"
        ? "bg-[#d5ff3f]"
        : "bg-[#ff6a3d]";
  const textClass =
    color === "emerald"
      ? "text-[#34d399]"
      : color === "lime"
        ? "text-[#d5ff3f]"
        : "text-[#ffb15f]";

  return (
    <div className="rounded-md border border-white/10 bg-[#05070d]/80 p-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-7 shrink-0 place-items-center rounded border border-white/15 bg-black">
          {team ? <Flag team={team} size="xs" /> : <span className="text-xs font-black leading-none text-white">X</span>}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-black text-white">{label}</span>
        <span className={cn("shrink-0 text-sm font-black tabular-nums", textClass)}>{pct}%</span>
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="h-1.5 min-w-0 overflow-hidden rounded-full border border-white/10 bg-black">
          {pct > 0 && (
            <div className={cn("h-full rounded-full transition-all duration-500", barClass)} style={{ width: `${pct}%` }} />
          )}
        </div>
        <span className="text-[10px] font-black text-white/55">{count} picks</span>
      </div>
    </div>
  );
}
