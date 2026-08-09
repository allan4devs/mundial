"use client";

import { CalendarDays, Camera, ChevronRight, Crown, Lock, MinusCircle, Target, TrendingUp, Trophy, Users, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LeaderboardEntry, MundialMatch, Prediction } from "../types";
import { cn, finalScoreText, formatKickoff, normalizeKey, winnerPickText } from "../utils";
import { teamCode } from "../flags";
import { computePredictionResult } from "@/lib/mundial/prediction-scoring";
import { Flag } from "./Flag";

type PlayersViewProps = {
  leaderboard: LeaderboardEntry[];
  matches: MundialMatch[];
  predictions: Prediction[];
  playerName: string;
  onOpenProfile: () => void;
};

type PredictionScore = {
  points: number | null;
  kind: "exact" | "outcome" | "bonus" | "miss" | "pending";
};

function PremiumCrown({ className }: { className?: string }) {
  return (
    <span
      title="Premium"
      aria-label="Premium"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full border border-[#f0b429]/40 bg-[#f0b429]/15 text-[#f0b429] shadow-[0_0_10px_rgba(240,180,41,0.16)]",
        className
      )}
    >
      <Crown className="h-2.5 w-2.5" />
    </span>
  );
}

export function PlayersView({ leaderboard, matches, predictions, playerName, onOpenProfile }: PlayersViewProps) {
  const [selectedPlayerKey, setSelectedPlayerKey] = useState<string | null>(null);
  const [avatarByKey, setAvatarByKey] = useState<Record<string, string | null>>({});
  const [premiumKeys, setPremiumKeys] = useState<Set<string>>(() => new Set());
  const matchById = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);
  const selectedEntry = leaderboard.find((entry) => entry.normalizedName === selectedPlayerKey) ?? null;

  useEffect(() => {
    const names = Array.from(new Set(leaderboard.map((entry) => entry.normalizedName).filter(Boolean)));
    if (!names.length) {
      setAvatarByKey({});
      return;
    }

    let cancelled = false;
    fetch("/api/mundial/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    })
      .then((r) => (r.ok ? r.json() : { avatars: {} }))
      .then((data: { avatars?: Record<string, string | null> }) => {
        if (!cancelled) setAvatarByKey(data.avatars ?? {});
      })
      .catch(() => {
        if (!cancelled) setAvatarByKey({});
      });

    return () => { cancelled = true; };
  }, [leaderboard]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mundial/premium/players")
      .then((r) => (r.ok ? r.json() : { players: [] }))
      .then((data: { players?: string[] }) => {
        if (!cancelled) setPremiumKeys(new Set((data.players ?? []).map(normalizeKey)));
      })
      .catch(() => {
        if (!cancelled) setPremiumKeys(new Set());
      });

    return () => { cancelled = true; };
  }, []);

  if (!leaderboard.length) {
    return (
      <section className="grid min-h-56 place-items-center rounded-xl border border-dashed border-[#f0b429]/30 bg-black/35 p-6 text-center sm:p-8">
        <div>
          <Users className="mx-auto h-12 w-12 text-[#f0b429]" />
          <p className="mt-4 text-xl font-black text-white">Todavia no hay jugadores</p>
          <p className="mt-2 text-base font-bold text-white/60">Se el primero en guardar tu quiniela.</p>
        </div>
      </section>
    );
  }

  const maxPts = leaderboard[0].totalPoints;
  const totalExact = leaderboard.reduce((sum, entry) => sum + entry.exactScores, 0);
  const totalOutcome = leaderboard.reduce((sum, entry) => sum + entry.correctOutcomes, 0);
  const totalScored = leaderboard.reduce((sum, entry) => sum + entry.scoredPredictions, 0);
  const leader = leaderboard[0];
  const leaderAccuracy = accuracyPct(leader);

  return (
    <section className="grid gap-4">
      <ProfilePhotoNotice playerName={playerName} onOpenProfile={onOpenProfile} />

      <div className="relative overflow-hidden rounded-xl border border-[#f0b429]/30 bg-[#06140f] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(90deg,rgba(240,180,41,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="relative border-b border-white/12 bg-black/35 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#f0b429]/40 bg-[#f0b429] text-[#07110b] shadow-[0_0_18px_rgba(240,180,41,0.22)]">
                <Trophy className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d5ff3f]">Quiniela · Mundial 2026</p>
                <h2 className="mt-1 text-2xl font-black uppercase text-white sm:text-3xl">
                  Ranking de Puntos
                </h2>
                <p className="mt-1 text-xs font-bold text-white/40">{leaderboard.length} participantes</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 min-[520px]:grid-cols-4 lg:min-w-[560px]">
              <HeaderStat label="Lider" value={leader.playerName} tone="lime" />
              <HeaderStat label="Precision" value={`${leaderAccuracy}%`} tone="cyan" />
              <HeaderStat label="Exactos" value={totalExact} tone="lime" />
              <HeaderStat label="Resueltos" value={totalScored} tone="white" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Cartoon Podium ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#f0b429]/25 bg-[#04100a] shadow-[0_32px_80px_rgba(0,0,0,0.60)]">
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
        {/* Gold spotlight from top-center */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_65%_52%_at_50%_0%,rgba(240,180,41,0.18),transparent_72%)]" />
        {/* Floating sparkles */}
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
          <span className="absolute left-[6%] top-[14%] text-lg text-[#f0b429] opacity-40">✦</span>
          <span className="absolute left-[19%] top-[7%] text-sm text-[#d5ff3f] opacity-30">★</span>
          <span className="absolute right-[9%] top-[12%] text-base text-[#f0b429] opacity-35">✦</span>
          <span className="absolute right-[23%] top-[5%] text-xs text-[#62ffe6] opacity-25">★</span>
          <span className="absolute left-[47%] top-[3%] text-xs text-[#f0b429] opacity-20">✦</span>
        </div>

        {/* Stage — all columns bottom-aligned; platform height = visual elevation */}
        <div className="flex items-end justify-center pt-8 sm:pt-12">

          {/* ── Silver (2nd) — left ── */}
          {leaderboard[1] ? (
            <button
              type="button"
              onClick={() => setSelectedPlayerKey(leaderboard[1].normalizedName)}
              className="group flex w-1/3 flex-col items-center transition hover:brightness-110 focus:outline-none"
            >
              <div className="flex w-full flex-col items-center px-2 pb-3 sm:px-4">
                <div className="mb-2 grid h-11 w-11 place-items-center rounded-full border-2 border-[#62ffe6]/60 bg-[#071d2a] text-xl font-black text-[#62ffe6] shadow-[0_0_18px_rgba(98,255,230,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]">
                  2
                </div>
                <div className="mb-1.5 grid h-12 w-12 place-items-center rounded-full border-2 border-[#62ffe6]/45 bg-[#071d2a] text-sm font-black text-[#62ffe6] shadow-[0_4px_16px_rgba(0,0,0,0.50)]">
                  <PlayerAvatar entry={leaderboard[1]} avatarUrl={avatarByKey[leaderboard[1].normalizedName]} size="md" />
                </div>
                <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
                  <p className="min-w-0 truncate text-center text-[11px] font-black text-white sm:text-xs">{leaderboard[1].playerName}</p>
                  {premiumKeys.has(leaderboard[1].normalizedName) && <PremiumCrown className="h-4 w-4" />}
                </div>
                <p className="mt-0.5 text-base font-black tabular-nums text-[#62ffe6] sm:text-lg">
                  {leaderboard[1].totalPoints}<span className="ml-0.5 text-[9px] font-bold text-white/35">pts</span>
                </p>
                <div className="mt-1.5 flex w-full flex-col gap-0.5 px-0.5">
                  <span className="rounded bg-black/40 px-1 py-0.5 text-center text-[9px] font-black text-[#d5ff3f]">{leaderboard[1].exactScores} exactos</span>
                  <span className="rounded bg-black/40 px-1 py-0.5 text-center text-[9px] font-black text-white/45">{accuracyPct(leaderboard[1])}% prec.</span>
                </div>
              </div>
              <div className="relative w-full border-t-[3px] border-[#62ffe6]/65 bg-gradient-to-b from-[#0b2533] to-[#051520]" style={{ height: 88 }}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#62ffe6]/45 to-transparent" />
                <span aria-hidden className="absolute inset-0 flex items-center justify-center select-none text-5xl font-black text-[#62ffe6]/8">2</span>
              </div>
            </button>
          ) : <div className="w-1/3" />}

          {/* ── Gold (1st) — center, tallest ── */}
          {leaderboard[0] ? (
            <button
              type="button"
              onClick={() => setSelectedPlayerKey(leaderboard[0].normalizedName)}
              className="group relative z-10 flex w-1/3 flex-col items-center transition hover:brightness-110 focus:outline-none"
            >
              {/* Crown */}
              <div aria-hidden className="mb-0.5 select-none">
                <svg viewBox="0 0 48 30" className="mx-auto h-9 w-14 drop-shadow-[0_3px_12px_rgba(240,180,41,0.75)]">
                  <path d="M5 26h38v4H5z" fill="#7a4d08"/>
                  <path d="M5 26h38v2H5z" fill="#a06610"/>
                  <path d="M5 26L11 8l9 11L24 4l4 15 9-11 6 18z" fill="#f0b429" stroke="#9a5e0a" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="11" cy="8" r="3.5" fill="#d5ff3f" stroke="#9a5e0a" strokeWidth="1"/>
                  <circle cx="24" cy="4" r="3.5" fill="#d5ff3f" stroke="#9a5e0a" strokeWidth="1"/>
                  <circle cx="37" cy="8" r="3.5" fill="#d5ff3f" stroke="#9a5e0a" strokeWidth="1"/>
                  <circle cx="11" cy="8" r="1.5" fill="white" opacity="0.7"/>
                  <circle cx="24" cy="4" r="1.5" fill="white" opacity="0.7"/>
                  <circle cx="37" cy="8" r="1.5" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <div className="flex w-full flex-col items-center px-2 pb-3 sm:px-4">
                <div className="mb-1.5 grid h-16 w-16 place-items-center rounded-full border-[3px] border-[#f0b429] bg-[#10240b] text-xl font-black text-[#d5ff3f] shadow-[0_0_30px_rgba(240,180,41,0.55),0_6px_24px_rgba(0,0,0,0.65)]">
                  <PlayerAvatar entry={leaderboard[0]} avatarUrl={avatarByKey[leaderboard[0].normalizedName]} size="lg" />
                </div>
                <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
                  <p className="min-w-0 truncate text-center text-xs font-black text-white sm:text-sm">{leaderboard[0].playerName}</p>
                  {premiumKeys.has(leaderboard[0].normalizedName) && <PremiumCrown className="h-4 w-4" />}
                </div>
                <p className="mt-0.5 text-xl font-black tabular-nums text-[#d5ff3f] sm:text-2xl">
                  {leaderboard[0].totalPoints}<span className="ml-0.5 text-[10px] font-bold text-white/35">pts</span>
                </p>
                <div className="mt-1.5 flex w-full flex-col gap-0.5 px-0.5">
                  <span className="rounded border border-[#f0b429]/30 bg-[#f0b429]/12 px-1 py-0.5 text-center text-[9px] font-black text-[#d5ff3f]">{leaderboard[0].exactScores} exactos</span>
                  <span className="rounded border border-[#f0b429]/25 bg-[#f0b429]/10 px-1 py-0.5 text-center text-[9px] font-black text-[#f0b429]">{accuracyPct(leaderboard[0])}% prec.</span>
                </div>
              </div>
              <div className="relative w-full border-t-4 border-[#f0b429] bg-gradient-to-b from-[#2a1803] to-[#130d01] shadow-[0_0_32px_rgba(240,180,41,0.14)]" style={{ height: 122 }}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f0b429]/65 to-transparent" />
                <span aria-hidden className="absolute inset-0 flex items-center justify-center select-none text-7xl font-black text-[#f0b429]/8">1</span>
              </div>
            </button>
          ) : <div className="w-1/3" />}

          {/* ── Bronze (3rd) — right ── */}
          {leaderboard[2] ? (
            <button
              type="button"
              onClick={() => setSelectedPlayerKey(leaderboard[2].normalizedName)}
              className="group flex w-1/3 flex-col items-center transition hover:brightness-110 focus:outline-none"
            >
              <div className="flex w-full flex-col items-center px-2 pb-3 sm:px-4">
                <div className="mb-2 grid h-11 w-11 place-items-center rounded-full border-2 border-[#ffb15f]/60 bg-[#200d03] text-xl font-black text-[#ffb15f] shadow-[0_0_14px_rgba(255,177,95,0.22),inset_0_1px_0_rgba(255,255,255,0.10)]">
                  3
                </div>
                <div className="mb-1.5 grid h-12 w-12 place-items-center rounded-full border-2 border-[#ffb15f]/40 bg-[#200d03] text-sm font-black text-[#ffb15f] shadow-[0_4px_16px_rgba(0,0,0,0.50)]">
                  <PlayerAvatar entry={leaderboard[2]} avatarUrl={avatarByKey[leaderboard[2].normalizedName]} size="md" />
                </div>
                <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
                  <p className="min-w-0 truncate text-center text-[11px] font-black text-white sm:text-xs">{leaderboard[2].playerName}</p>
                  {premiumKeys.has(leaderboard[2].normalizedName) && <PremiumCrown className="h-4 w-4" />}
                </div>
                <p className="mt-0.5 text-base font-black tabular-nums text-[#ffb15f] sm:text-lg">
                  {leaderboard[2].totalPoints}<span className="ml-0.5 text-[9px] font-bold text-white/35">pts</span>
                </p>
                <div className="mt-1.5 flex w-full flex-col gap-0.5 px-0.5">
                  <span className="rounded bg-black/40 px-1 py-0.5 text-center text-[9px] font-black text-[#d5ff3f]">{leaderboard[2].exactScores} exactos</span>
                  <span className="rounded bg-black/40 px-1 py-0.5 text-center text-[9px] font-black text-white/45">{accuracyPct(leaderboard[2])}% prec.</span>
                </div>
              </div>
              <div className="relative w-full border-t-[3px] border-[#ffb15f]/60 bg-gradient-to-b from-[#2a1003] to-[#160802]" style={{ height: 66 }}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb15f]/35 to-transparent" />
                <span aria-hidden className="absolute inset-0 flex items-center justify-center select-none text-4xl font-black text-[#ffb15f]/8">3</span>
              </div>
            </button>
          ) : <div className="w-1/3" />}

        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#f0b429]/25 bg-[#06140f] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/12 bg-black/45 text-xs">
                <th className="px-2 py-2.5 text-left font-black uppercase tracking-wide text-[#d5ff3f] sm:px-3 sm:py-3">#</th>
                <th className="px-2 py-2.5 text-left font-black uppercase tracking-wide text-white sm:px-3 sm:py-3">Jugador</th>
                <th className="px-2 py-2.5 text-right font-black uppercase tracking-wide text-white sm:px-3 sm:py-3">Pts</th>
                <th className="px-2 py-2.5 text-right font-black uppercase tracking-wide text-[#d5ff3f] sm:px-3 sm:py-3">Exact.</th>
                <th className="px-2 py-2.5 text-right font-black uppercase tracking-wide text-[#62ffe6] sm:px-3 sm:py-3">Res.</th>
                <th className="hidden px-3 py-2.5 text-right font-black uppercase tracking-wide text-[#ffb15f] sm:table-cell sm:py-3">Fallos</th>
                <th className="hidden px-3 py-2.5 text-right font-black uppercase tracking-wide text-white/70 md:table-cell sm:py-3">Prec.</th>
                <th className="hidden px-3 py-2.5 text-right font-black uppercase tracking-wide text-white/70 lg:table-cell sm:py-3">Picks</th>
                <th className="px-2 py-2.5 text-right font-black uppercase tracking-wide text-white/70 sm:px-3 sm:py-3">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leaderboard.map((entry, i) => {
                const isFirst = i === 0;
                const isTied = i > 0 && entry.totalPoints === leaderboard[i - 1].totalPoints;
                const barWidth = maxPts > 0 ? Math.round((entry.totalPoints / maxPts) * 100) : 0;
                const misses = Math.max(entry.scoredPredictions - entry.correctOutcomes, 0);
                const pending = Math.max(entry.totalPredictions - entry.scoredPredictions, 0);

                return (
                  <tr
                    key={entry.normalizedName}
                    onClick={() => setSelectedPlayerKey(entry.normalizedName)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isFirst ? "bg-[#10240b]/65 hover:bg-[#10240b]/90" : "hover:bg-white/5"
                    )}
                  >
                    <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                      <span className={cn("text-sm font-black tabular-nums", isTied ? "text-white/50" : "text-white")}>
                        {isTied ? "=" : i + 1}
                      </span>
                    </td>

                    <td className="px-2 py-2.5 sm:px-3 sm:py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <PlayerAvatar entry={entry} avatarUrl={avatarByKey[entry.normalizedName]} size="sm" />
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p className={cn("min-w-0 truncate text-sm font-black sm:text-base", isFirst ? "text-[#d5ff3f]" : "text-white")}>
                              {entry.playerName}
                            </p>
                            {premiumKeys.has(entry.normalizedName) && <PremiumCrown className="h-4 w-4" />}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 sm:mt-1 sm:gap-2">
                            <div className="h-1 w-14 overflow-hidden rounded-full bg-black/55 sm:w-20">
                              <div
                                className={cn("h-full rounded-full", isFirst ? "bg-[#d5ff3f]" : "bg-[#62ffe6]")}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            {pending > 0 && <span className="text-[9px] font-black text-white/45 sm:text-[10px]">{pending} pend.</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-2.5 text-right sm:px-3 sm:py-3">
                      <span className={cn("text-base font-black tabular-nums", isFirst ? "text-[#d5ff3f]" : "text-white")}>
                        {entry.totalPoints}
                      </span>
                    </td>

                    <td className="px-2 py-2.5 text-right sm:px-3 sm:py-3">
                      <span className={cn("font-black tabular-nums", entry.exactScores > 0 ? "text-[#d5ff3f]" : "text-white/25")}>
                        {entry.exactScores}
                      </span>
                    </td>

                    <td className="px-2 py-2.5 text-right sm:px-3 sm:py-3">
                      <span className={cn("font-black tabular-nums", entry.correctOutcomes > 0 ? "text-[#62ffe6]" : "text-white/25")}>
                        {entry.correctOutcomes}
                      </span>
                    </td>

                    <td className="hidden px-3 py-2.5 text-right sm:table-cell sm:py-3">
                      <span className={cn("font-black tabular-nums", misses > 0 ? "text-[#ffb15f]" : "text-white/25")}>
                        {misses}
                      </span>
                    </td>

                    <td className="hidden px-3 py-2.5 text-right md:table-cell sm:py-3">
                      <span className="text-xs font-black tabular-nums text-white/70">{accuracyPct(entry)}%</span>
                    </td>

                    <td className="hidden px-3 py-2.5 text-right lg:table-cell sm:py-3">
                      <span className="text-xs font-bold tabular-nums text-white/55">
                        {entry.scoredPredictions}/{entry.totalPredictions}
                      </span>
                    </td>

                    <td className="px-2 py-2.5 text-right sm:px-3 sm:py-3">
                      <ChevronRight className="ml-auto h-4 w-4 text-white/45" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/12 bg-black/30 px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-white/60">
            <span className="flex items-center gap-1"><Target className="h-3 w-3 text-[#d5ff3f]" /> Exacto = 3 pts · exacto + pase + método = 4 pts</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-[#62ffe6]" /> Resultado = 1 pt · TE = 2 pts · penales = 3 pts</span>
            <span>{totalOutcome} resultados acertados entre todos</span>
          </div>
        </div>
      </div>

      <StatBetsLeaderboard avatarByKey={avatarByKey} premiumKeys={premiumKeys} />

      {selectedEntry && (
        <PlayerPredictionsModal
          entry={selectedEntry}
          avatarUrl={avatarByKey[selectedEntry.normalizedName]}
          predictions={predictions.filter((prediction) => normalizeKey(prediction.playerName) === selectedEntry.normalizedName)}
          matchById={matchById}
          onClose={() => setSelectedPlayerKey(null)}
        />
      )}
    </section>
  );
}

type GlobalStatBetEntry = { playerName: string; earned: number; total: number };

function StatBetsLeaderboard({
  avatarByKey,
  premiumKeys,
}: {
  avatarByKey: Record<string, string | null>;
  premiumKeys: Set<string>;
}) {
  const [entries, setEntries] = useState<GlobalStatBetEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/mundial/stat-bets?global=true")
      .then((r) => (r.ok ? r.json() : { leaderboard: [] }))
      .then((data) => {
        setEntries(data.leaderboard ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || !entries.length) return null;

  const max = Math.max(...entries.map((e) => e.earned), 1);

  return (
    <div className="overflow-hidden rounded-xl border border-[#f0b429]/25 bg-[#06140f] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="border-b border-white/10 bg-[#12351f] px-4 py-3 [background-image:linear-gradient(135deg,rgba(240,180,41,0.18),transparent_58%)]">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#f0b429]/40 bg-[#f0b429] text-[#07110b]">
            <Zap className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0b429]">Preguntas de partido</p>
            <p className="mt-0.5 text-sm font-black text-white">
              Puntaje Mini-Preguntas
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-black/35 text-xs">
              <th className="px-3 py-2.5 text-left font-black uppercase tracking-wide text-white/40">#</th>
              <th className="px-3 py-2.5 text-left font-black uppercase tracking-wide text-white">Jugador</th>
              <th className="px-3 py-2.5 text-right font-black uppercase tracking-wide text-[#f0b429]">Pts ganados</th>
              <th className="px-3 py-2.5 text-right font-black uppercase tracking-wide text-white/50">Apostadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {entries.map((entry, i) => {
              const barWidth = max > 0 ? Math.round((entry.earned / max) * 100) : 0;
              const isFirst = i === 0;
              return (
                <tr key={entry.playerName} className={cn(isFirst ? "bg-[#f0b429]/5" : "hover:bg-white/3", "transition-colors")}>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-md border text-xs font-black tabular-nums",
                        isFirst
                          ? "border-[#f0b429]/60 bg-[#f0b429] text-[#07110b]"
                          : "border-white/12 bg-black/35 text-white/55"
                      )}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PlayerAvatar
                        entry={{ playerName: entry.playerName, normalizedName: normalizeKey(entry.playerName) }}
                        avatarUrl={avatarByKey[normalizeKey(entry.playerName)]}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className={cn("min-w-0 truncate font-black", isFirst ? "text-[#f0b429]" : "text-white")}>
                            {entry.playerName}
                          </p>
                          {premiumKeys.has(normalizeKey(entry.playerName)) && <PremiumCrown className="h-4 w-4" />}
                        </div>
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-black/55">
                          <div
                            className={cn("h-full rounded-full", isFirst ? "bg-[#f0b429]" : "bg-emerald-500/50")}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={cn(
                      "font-black tabular-nums",
                      entry.earned > 0 ? (isFirst ? "text-[#f0b429]" : "text-emerald-400") : "text-white/25"
                    )}>
                      {entry.earned}
                    </span>
                    <span className="ml-0.5 text-[10px] text-white/30">pts</span>
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
  );
}

function PlayerPredictionsModal({
  entry,
  avatarUrl,
  predictions,
  matchById,
  onClose,
}: {
  entry: LeaderboardEntry;
  avatarUrl?: string | null;
  predictions: Prediction[];
  matchById: Map<string, MundialMatch>;
  onClose: () => void;
}) {
  const predictionByMatch = new Map(predictions.map((prediction) => [prediction.matchId, prediction]));
  const detailRows = Array.from(matchById.values())
    .filter((match) => match.homeFinalScore !== null || predictionByMatch.has(match.id))
    .map((match) => ({ match, prediction: predictionByMatch.get(match.id) }))
    .sort((a, b) => (b.match.sortOrder ?? -1) - (a.match.sortOrder ?? -1) || b.match.number - a.match.number);
  const visiblePredictionCount = detailRows.filter((row) => row.prediction).length;
  const missedPlayedCount = detailRows.filter(
    (row) => !row.prediction && row.match.homeFinalScore !== null && row.match.awayFinalScore !== null
  ).length;
  const scored = detailRows
    .filter((row) => row.prediction)
    .map((row) => computePredictionScore(row.match, row.prediction!))
    .filter((score) => score.points !== null);
  const modalPoints = scored.reduce((sum, score) => sum + (score.points ?? 0), 0);
  const hiddenCount = Math.max(entry.totalPredictions - visiblePredictionCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#f0b429]/35 bg-[#06140f] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/12 bg-[#12351f] px-4 py-3 [background-image:linear-gradient(135deg,rgba(240,180,41,0.18),transparent_58%)]">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar entry={entry} avatarUrl={avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate text-lg font-black uppercase text-white">{entry.playerName}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#d5ff3f]">
                {modalPoints} pts auditados / {entry.totalPredictions} picks / {missedPlayedCount} sin pick / {accuracyPct(entry)}% precision
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle de jugador"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/20 bg-black/20 text-white/75 transition hover:border-[#d5ff3f] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-1.5 border-b border-white/10 bg-black/25 p-3 sm:grid-cols-6 sm:gap-2">
          <MiniStat label="Total" value={entry.totalPoints} tone="lime" />
          <MiniStat label="Exactos" value={entry.exactScores} tone="lime" />
          <MiniStat label="Result." value={entry.correctOutcomes} tone="cyan" />
          <MiniStat label="Fallos" value={Math.max(entry.scoredPredictions - entry.correctOutcomes, 0)} tone="orange" />
          <MiniStat label="No pred." value={missedPlayedCount} tone="orange" />
          <MiniStat label="Jugados" value={`${entry.scoredPredictions}/${entry.totalPredictions}`} tone="white" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {hiddenCount > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#f0b429]/30 bg-[#1a2206]/55 px-3 py-2.5 text-sm font-bold text-[#fff1b8]">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#f0b429]" />
              <p>
                {hiddenCount} {hiddenCount === 1 ? "pick esta oculto" : "picks estan ocultos"} hasta que guardes tu prediccion en esos partidos.
              </p>
            </div>
          )}

          {detailRows.length ? (
            <div className="grid gap-2">
              {detailRows.map(({ match, prediction }) => {
                const score = prediction
                  ? computePredictionScore(match, prediction)
                  : ({ points: 0, kind: "miss" } satisfies PredictionScore);

                return (
                  <PredictionRow
                    key={prediction?.id ?? `missing-${match.id}`}
                    prediction={prediction}
                    match={match}
                    score={score}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/20 bg-black/35 p-6 text-center">
              {hiddenCount > 0 ? (
                <>
                  <Lock className="mx-auto h-10 w-10 text-[#f0b429]" />
                  <p className="mt-3 text-lg font-black text-white">Picks ocultos</p>
                  <p className="mt-2 text-sm font-bold text-white/55">
                    Guardá tu predicción en un partido para ver qué puso este jugador ahí.
                  </p>
                </>
              ) : (
                <>
                  <Users className="mx-auto h-10 w-10 text-[#62ffe6]" />
                  <p className="mt-3 text-lg font-black text-white">Sin predicciones guardadas</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PredictionRow({
  prediction,
  match,
  score,
}: {
  prediction?: Prediction;
  match?: MundialMatch;
  score: PredictionScore;
}) {
  const noPrediction = !prediction;
  const status = score.kind;
  const statusClass =
    status === "exact"
      ? "border-[#d5ff3f]/60 bg-[#1a2206] text-[#d5ff3f]"
      : status === "outcome"
        ? "border-[#62ffe6]/60 bg-[#071d2a] text-[#62ffe6]"
        : status === "bonus"
          ? "border-[#f0b429]/60 bg-[#211707] text-[#f0b429]"
        : status === "miss"
          ? "border-[#ff6a3d]/60 bg-[#2a120b] text-[#ffb15f]"
          : "border-white/15 bg-white/5 text-white/55";
  const statusLabel =
    status === "exact" ? "Exacto" : status === "outcome" ? "Resultado" : status === "miss" ? "Fallo" : "Pendiente";
  const displayStatusLabel = noPrediction ? "No predijo" : status === "bonus" ? "Bonus TE" : statusLabel;

  return (
    <article className="grid gap-3 rounded-lg border border-white/10 bg-black/35 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1 text-xs font-black text-white">
            #{match?.number ?? prediction?.matchNumber ?? "?"}
          </span>
          {match && (
            <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1 text-xs font-black text-white/60">
              {match.group ? `Grupo ${match.group}` : match.stageLabel}
            </span>
          )}
          {match && (
            <span className="inline-flex min-w-0 items-center gap-1 text-xs font-bold text-white/55">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formatKickoff(match.kickoffAt)}</span>
            </span>
          )}
        </div>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
          {match ? (
            <>
              <TeamChip team={match.homeTeam} />
              <span className="text-xs font-black text-white/45">VS</span>
              <TeamChip team={match.awayTeam} />
            </>
          ) : (
            <p className="font-black text-white">Partido no encontrado</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <span
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-black tabular-nums",
            noPrediction
              ? "border-[#ff6a3d]/45 bg-[#2a120b] text-[#ffb15f]"
              : "border-[#62ffe6]/45 bg-[#071d2a] text-[#62ffe6]"
          )}
        >
          {prediction ? `Pick ${prediction.homeScore}-${prediction.awayScore}` : "No predijo"}
        </span>
        {prediction?.winnerPick && match && (
          <span className="rounded-md border border-[#d5ff3f]/45 bg-[#1a2206] px-2 py-1 text-xs font-black text-[#d5ff3f]">
            {winnerPickText(prediction.winnerPick, prediction.winnerPickMethod, teamCode(match.homeTeam), teamCode(match.awayTeam), true)}
          </span>
        )}
        <span className="rounded-md border border-white/15 bg-black/35 px-3 py-2 text-sm font-black text-white">
          {match ? finalScoreText(match) : "Resultado pendiente"}
        </span>
        <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-black", statusClass)}>
          {status === "exact" ? <Target className="h-3.5 w-3.5" /> : status === "outcome" || status === "bonus" ? <TrendingUp className="h-3.5 w-3.5" /> : status === "miss" ? <MinusCircle className="h-3.5 w-3.5" /> : null}
          {displayStatusLabel}
          {score.points !== null && <span className="tabular-nums">+{score.points}</span>}
        </span>
      </div>
    </article>
  );
}

function ProfilePhotoNotice({
  playerName,
  onOpenProfile,
}: {
  playerName: string;
  onOpenProfile: () => void;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem("mundial-profile-photo-notice") === "hidden");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem("mundial-profile-photo-notice", "hidden");
    } catch {}
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#d5ff3f]/25 bg-[#10240b]/85 shadow-[0_18px_58px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#d5ff3f]/35 bg-[#d5ff3f] text-[#06110b]">
            <Camera className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-white">
              Ya pueden agregar foto de perfil al ranking.
            </p>
            <p className="mt-0.5 text-xs font-bold text-white/55">
              {playerName ? "Abrí Mi Perfil y subí tu foto o elegí un avatar." : "Elegí tu jugador y luego abrí Mi Perfil para poner tu foto."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d5ff3f]/45 bg-[#d5ff3f] px-3 text-xs font-black text-[#06110b] transition hover:bg-[#efff9a]"
          >
            Agregar foto
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Ocultar aviso"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/12 bg-black/25 text-white/50 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerAvatar({
  entry,
  avatarUrl,
  size = "sm",
}: {
  entry: Pick<LeaderboardEntry, "playerName" | "normalizedName">;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-16 w-16 text-xl"
      : size === "md"
        ? "h-12 w-12 text-sm"
        : size === "xs"
          ? "h-8 w-8 text-[11px]"
          : "h-9 w-9 text-xs";
  const initials = entry.playerName.trim().slice(0, 2).toUpperCase() || "?";

  return (
    <span className={cn(
      "grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-[#10240b] font-black text-[#d5ff3f]",
      sizeClass
    )}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}

function HeaderStat({ label, value, tone }: { label: string; value: number | string; tone: "lime" | "cyan" | "white" }) {
  const color = tone === "lime" ? "text-[#d5ff3f]" : tone === "cyan" ? "text-[#62ffe6]" : "text-white";
  return (
    <div className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/55">{label}</p>
      <p className={cn("mt-0.5 truncate text-sm font-black", color)}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number | string; tone: "lime" | "cyan" | "orange" | "white" }) {
  const textClass =
    tone === "lime" ? "text-[#d5ff3f]" : tone === "cyan" ? "text-[#62ffe6]" : tone === "orange" ? "text-[#ffb15f]" : "text-white";

  return (
    <div className="rounded-md border border-white/10 bg-black/45 px-2 py-1.5 text-center">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/55">{label}</p>
      <p className={cn("text-sm font-black", textClass)}>{value}</p>
    </div>
  );
}

function TeamChip({ team }: { team: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-[#f0b429]/25 bg-[#12351f] px-2 py-1">
      <Flag team={team} size="xs" />
      <span className="text-xs font-black text-white">{teamCode(team)}</span>
      <span className="hidden max-w-28 truncate text-xs font-bold text-white/70 sm:inline">{team}</span>
    </span>
  );
}

function accuracyPct(entry: LeaderboardEntry) {
  return entry.scoredPredictions > 0 ? Math.round((entry.correctOutcomes / entry.scoredPredictions) * 100) : 0;
}

function computePredictionScore(match: MundialMatch | undefined, prediction: Prediction): PredictionScore {
  if (!match || match.homeFinalScore === null || match.awayFinalScore === null) {
    return { points: null, kind: "pending" };
  }

  const result = computePredictionResult(
    {
      stage: match.stage,
      homeFinalScore: match.homeFinalScore,
      awayFinalScore: match.awayFinalScore,
      homeRegulationScore: match.homeRegulationScore,
      awayRegulationScore: match.awayRegulationScore,
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

  return { points: result.points, kind: result.kind };
}
