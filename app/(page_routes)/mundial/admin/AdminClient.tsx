"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, BarChart3, CheckCircle2, Crown, Loader2, RefreshCw, Shield, Tv2, Trophy, Users } from "lucide-react";
import Link from "next/link";
import type { AdminData, AdminMatch, AdminView, LeaderboardEntry } from "./adminTypes";
import { cn } from "../utils";
import { AdminAnalyticsPanel } from "./components/AdminAnalyticsPanel";
import { AdminLeaderboard } from "./components/AdminLeaderboard";
import { MatchAdminCard } from "./components/MatchAdminCard";
import { StatQuestionsManager } from "./components/StatQuestionsManager";
import { PlayerDetailModal } from "./components/PlayerDetailModal";
import { AdminPremiumPredictionsPanel } from "./components/AdminPremiumPredictionsPanel";
import { buildTeamResolver } from "../utils";

const HALF_REAL_DURATION_MINUTES = 51;
const STANDARD_HALFTIME_MINUTES = 15;
const FINAL_HALFTIME_MINUTES = 27;

function autoLiveMaxMinutes(match: AdminMatch) {
  return (HALF_REAL_DURATION_MINUTES * 2) + (match.stage === "final" ? FINAL_HALFTIME_MINUTES : STANDARD_HALFTIME_MINUTES);
}

function isAutoLiveWindow(match: AdminMatch, nowMs: number) {
  if (!nowMs || match.liveStatus !== "scheduled" || match.forceClosed) return false;
  if (match.homeFinalScore !== null && match.awayFinalScore !== null) return false;
  const kickoff = new Date(match.kickoffAt).getTime();
  if (!Number.isFinite(kickoff)) return false;
  const elapsed = nowMs - kickoff;
  return elapsed >= 0 && elapsed < autoLiveMaxMinutes(match) * 60_000;
}

function sortByProximity(matches: AdminMatch[], nowMs: number): AdminMatch[] {
  return [...matches].sort((a, b) => {
    // Tier 0: explicitly live or halftime
    const aLive = a.liveStatus === "live" || a.liveStatus === "halftime" ? 0 : 1;
    const bLive = b.liveStatus === "live" || b.liveStatus === "halftime" ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;

    const aTime = new Date(a.kickoffAt).getTime();
    const bTime = new Date(b.kickoffAt).getTime();

    // Tier 1: kicked off but not yet closed (in progress, not yet marked live)
    const aInProgress = isAutoLiveWindow(a, nowMs) ? 0 : 1;
    const bInProgress = isAutoLiveWindow(b, nowMs) ? 0 : 1;
    if (aInProgress !== bInProgress) return aInProgress - bInProgress;

    // Tier 2: upcoming vs past
    const aUpcoming = nowMs === 0 || aTime > nowMs;
    const bUpcoming = nowMs === 0 || bTime > nowMs;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    if (aUpcoming) return aTime - bTime;
    return bTime - aTime;
  });
}

const ADMIN_API = "/api/mundial/admin";
const MATCH_API = "/api/mundial/admin/match";
const STAT_Q_API = "/api/mundial/admin/stat-questions";

const VIEW_OPTIONS: Array<{ id: AdminView; label: string; icon: React.ReactNode }> = [
  { id: "matches", label: "Partidos", icon: <Tv2 className="h-4 w-4" /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
  { id: "stats", label: "Stats & Apuestas", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "premium", label: "Final pagas", icon: <Crown className="h-4 w-4" /> },
  { id: "analytics", label: "Analytics", icon: <Activity className="h-4 w-4" /> },
];

type MatchFilter = "upcoming" | "live" | "recent" | "open" | "scored" | "all";
const FILTER_OPTIONS: Array<{ id: MatchFilter; label: string }> = [
  { id: "upcoming", label: "Próximos" },
  { id: "live",     label: "Live" },
  { id: "recent",   label: "Recientes" },
  { id: "open",     label: "Abiertos" },
  { id: "scored",   label: "Con resultado" },
  { id: "all",      label: "Todos" },
];

export default function AdminClient() {
  const [data, setData] = useState<AdminData | null>(null);
  const [view, setView] = useState<AdminView>("matches");
  const [nowMs, setNowMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("recent");
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(ADMIN_API, { cache: "no-store" });
      if (!res.ok) throw new Error("Error cargando datos.");
      setData(await res.json());
    } catch {
      setError("No se pudo cargar el panel de admin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function patchMatch(matchId: string, patch: Record<string, unknown>) {
    const res = await fetch(MATCH_API, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, ...patch }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Error actualizando partido.");
    }
    await load();
  }

  async function createStatQuestion(matchId: string, text: string, options: string[], pointValue: number = 1) {
    const res = await fetch(STAT_Q_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, text, options, pointValue }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Error creando pregunta.");
    }
    await load();
  }

  async function deleteStatQuestion(id: string) {
    const res = await fetch(STAT_Q_API, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Error eliminando pregunta.");
    }
    await load();
  }

  async function bulkDeleteStatQuestions(ids: string[]) {
    await Promise.all(
      ids.map((id) =>
        fetch(STAT_Q_API, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })
      )
    );
    await load();
  }

  async function resolveStatQuestion(id: string, correctOptionId: string | null) {
    const res = await fetch(STAT_Q_API, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, correctOptionId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Error resolviendo pregunta.");
    }
    await load();
  }

  const resolvedMatches = useMemo(() => {
    const matches = data?.matches ?? [];
    const resolveTeam = buildTeamResolver(matches);
    const rostersByTeam = new Map<string, AdminMatch["homeRoster"]>();

    for (const match of matches) {
      if (!rostersByTeam.has(match.homeTeam)) rostersByTeam.set(match.homeTeam, match.homeRoster);
      if (!rostersByTeam.has(match.awayTeam)) rostersByTeam.set(match.awayTeam, match.awayRoster);
    }

    return matches.map((match) => {
      const homeTeam = resolveTeam(match.homeTeam);
      const awayTeam = resolveTeam(match.awayTeam);

      if (homeTeam === match.homeTeam && awayTeam === match.awayTeam) return match;

      return {
        ...match,
        homeTeam,
        awayTeam,
        homeRoster: rostersByTeam.get(homeTeam) ?? match.homeRoster,
        awayRoster: rostersByTeam.get(awayTeam) ?? match.awayRoster,
      };
    });
  }, [data?.matches]);

  const allMatchesSorted = useMemo(() => sortByProximity(resolvedMatches, nowMs), [nowMs, resolvedMatches]);

  const isLive = (m: AdminMatch) => m.liveStatus === "live" || m.liveStatus === "halftime";

  const filteredMatches = useMemo(() => {
    if (matchFilter === "upcoming") return allMatchesSorted.filter((m) => isLive(m) || isAutoLiveWindow(m, nowMs) || nowMs === 0 || new Date(m.kickoffAt).getTime() > nowMs);
    if (matchFilter === "live")     return allMatchesSorted.filter(isLive);
    if (matchFilter === "recent")   return allMatchesSorted.filter((m) => m.closed).slice(0, 8);
    if (matchFilter === "open")     return allMatchesSorted.filter((m) => !m.closed);
    if (matchFilter === "scored")   return allMatchesSorted.filter((m) => m.homeFinalScore !== null && m.awayFinalScore !== null);
    return allMatchesSorted;
  }, [allMatchesSorted, matchFilter, nowMs]);

  // For "upcoming" and "all" modes, split into labelled sections
  const matchSections = useMemo(() => {
    if (matchFilter !== "upcoming" && matchFilter !== "all") return null;
    if (matchFilter === "upcoming") {
      return {
        live:     filteredMatches.filter((m) => isLive(m) || isAutoLiveWindow(m, nowMs)),
        upcoming: filteredMatches.filter((m) => nowMs === 0 || new Date(m.kickoffAt).getTime() > nowMs),
        past:     [] as AdminMatch[],
      };
    }
    return {
      live:     allMatchesSorted.filter(isLive),
      upcoming: allMatchesSorted.filter((m) => !isLive(m) && (nowMs === 0 || new Date(m.kickoffAt).getTime() > nowMs)),
      past:     allMatchesSorted.filter((m) => m.closed),
    };
  }, [allMatchesSorted, filteredMatches, matchFilter, nowMs]);

  // Summary stats (computed client-side from data)
  const scoredCount = data?.matches.filter((m) => m.homeFinalScore !== null).length ?? 0;
  const openCount = data?.matches.filter((m) => !m.closed).length ?? 0;
  const liveCount = data?.matches.filter((m) => m.liveStatus === "live" || m.liveStatus === "halftime").length ?? 0;
  const playerCount = data?.leaderboard.length ?? 0;
  const leader = data?.leaderboard[0] ?? null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07110b] text-white [background-image:linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(135deg,#06100b_0%,#0b2216_45%,#14351d_74%,#07110b_100%)] [background-size:96px_96px,96px_96px,100%_100%]">
      {/* Header */}
      <header className="border-b border-white/12 bg-black/35 shadow-[0_16px_46px_rgba(0,0,0,0.22)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#f0b429]/45 bg-[#f0b429] text-[#07110b] shadow-[0_0_22px_rgba(240,180,41,0.24)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#d5ff3f]">Admin</p>
              <h1 className="text-lg font-black leading-tight text-white">Mundial 2026</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/mundial"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-black text-white/70 transition hover:border-[#d5ff3f]/45 hover:bg-[#12351f] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Quiniela</span>
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              disabled={isLoading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-black text-white/70 transition hover:border-[#d5ff3f]/45 hover:bg-[#12351f] hover:text-white disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6">
        {/* Summary stats */}
        {data && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-black/35 px-4 py-3 shadow-[0_16px_46px_rgba(0,0,0,0.18)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/8">
                <Users className="h-4 w-4 text-white/65" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Jugadores</p>
                <p className="text-xl font-black tabular-nums text-white">{playerCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#9dff34]/25 bg-[#10240b]/75 px-4 py-3 shadow-[0_16px_46px_rgba(0,0,0,0.18)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#9dff34]/25 bg-[#9dff34]/10">
                <CheckCircle2 className="h-4 w-4 text-[#d5ff3f]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Con resultado</p>
                <p className="text-xl font-black tabular-nums text-white">
                  {scoredCount}
                  <span className="text-sm font-bold text-white/35">/{data.matches.length}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#f0b429]/25 bg-[#211707]/70 px-4 py-3 shadow-[0_16px_46px_rgba(0,0,0,0.18)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#f0b429]/25 bg-[#f0b429]/10">
                <Tv2 className="h-4 w-4 text-[#f0b429]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Abiertos</p>
                <p className="text-xl font-black tabular-nums text-[#f0b429]">{openCount}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setView("matches"); setMatchFilter("live"); }}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-[0_16px_46px_rgba(0,0,0,0.18)] transition",
                liveCount > 0
                  ? "border-[#9dff34]/55 bg-[#10240b]/85 ring-1 ring-[#9dff34]/25 hover:bg-[#16351d]"
                  : "border-white/12 bg-black/35 hover:bg-white/8"
              )}
            >
              <div className={cn(
                "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
                liveCount > 0 ? "border-[#9dff34]/35 bg-[#9dff34]/10" : "border-white/10 bg-white/8"
              )}>
                <Tv2 className={cn("h-4 w-4", liveCount > 0 ? "text-[#d5ff3f]" : "text-white/35")} />
                {liveCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-[#9dff34]" />
                )}
              </div>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-black uppercase tracking-wide", liveCount > 0 ? "text-[#d5ff3f]" : "text-white/40")}>
                  En vivo
                </p>
                <p className={cn("text-xl font-black tabular-nums", liveCount > 0 ? "text-[#d5ff3f]" : "text-white/35")}>
                  {liveCount}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-[#f0b429]/25 bg-black/35 px-4 py-3 shadow-[0_16px_46px_rgba(0,0,0,0.18)]">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#f0b429]/25 bg-[#f0b429]/10">
                <Trophy className="h-4 w-4 text-[#f0b429]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Líder</p>
                <p className="truncate text-sm font-black text-white">
                  {leader ? `${leader.playerName} · ${leader.totalPoints}pts` : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-black transition",
                view === option.id
                  ? "border-[#d5ff3f]/60 bg-[#d5ff3f] text-[#06110b] shadow-[0_14px_36px_rgba(213,255,63,0.16)]"
                  : "border-white/12 bg-black/30 text-white/55 hover:border-[#f0b429]/35 hover:bg-[#12351f] hover:text-white"
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#ff6a3d]/60 bg-[#35130d]/80 p-3 text-sm font-bold text-[#ffd2c2]">
            {error}
          </div>
        )}
        {isLoading && !data ? (
          <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-white/20 bg-black/35 p-8 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#f0b429]" />
              <p className="mt-3 text-sm font-black text-white/70">Cargando panel...</p>
            </div>
          </div>
        ) : data ? (
          <>
            {view === "leaderboard" && (
              <AdminLeaderboard
                leaderboard={data.leaderboard}
                onPlayerClick={setSelectedPlayer}
              />
            )}

            {view === "matches" && (
              <div className="grid gap-4">
                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/12 bg-black/25 p-2">
                  {FILTER_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setMatchFilter(f.id)}
                      className={cn(
                        "h-8 rounded-lg border px-3 text-xs font-black transition",
                        matchFilter === f.id
                          ? "border-[#f0b429]/65 bg-[#f0b429] text-[#06110b]"
                          : "border-white/12 bg-white/5 text-white/55 hover:border-[#d5ff3f]/40 hover:bg-[#12351f] hover:text-white"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                  <span className="ml-auto text-xs font-bold text-white/40">
                    {filteredMatches.length} partido{filteredMatches.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {matchSections ? (
                  /* Sectioned view for "upcoming" and "all" filters */
                  <div className="grid gap-7">
                    {matchSections.live.length > 0 && (
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[#9dff34]/35 bg-[#10240b] px-2.5 text-[10px] font-black uppercase tracking-wide text-[#d5ff3f]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9dff34]" />
                            En vivo · {matchSections.live.length}
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {matchSections.live.map((m) => <MatchAdminCard key={m.id} match={m} onPatch={patchMatch} />)}
                        </div>
                      </div>
                    )}

                    {matchSections.upcoming.length > 0 && (
                      <div>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                          {matchFilter === "upcoming" ? "Programados" : "Próximos"} · {matchSections.upcoming.length}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {matchSections.upcoming.map((m) => <MatchAdminCard key={m.id} match={m} onPatch={patchMatch} />)}
                        </div>
                      </div>
                    )}

                    {matchSections.past.length > 0 && (
                      <div>
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                          Jugados · {matchSections.past.length}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {matchSections.past.map((m) => <MatchAdminCard key={m.id} match={m} onPatch={patchMatch} />)}
                        </div>
                      </div>
                    )}

                    {matchSections.live.length === 0 && matchSections.upcoming.length === 0 && matchSections.past.length === 0 && (
                      <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-white/20 bg-black/35 p-8 text-center">
                        <div>
                          <Tv2 className="mx-auto h-9 w-9 text-[#f0b429]" />
                          <p className="mt-3 text-sm font-black text-white/65">No hay partidos en esta categoría.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : filteredMatches.length ? (
                  /* Flat grid for live / recent / open / scored */
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredMatches.map((match) => (
                      <MatchAdminCard key={match.id} match={match} onPatch={patchMatch} />
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-white/20 bg-black/35 p-8 text-center">
                    <div>
                      <Tv2 className="mx-auto h-9 w-9 text-[#f0b429]" />
                      <p className="mt-3 text-sm font-black text-white/65">No hay partidos en esta categoría.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === "stats" && (
              <StatQuestionsManager
                matches={allMatchesSorted}
                statQuestions={data.statQuestions}
                onCreateQuestion={createStatQuestion}
                onResolveQuestion={resolveStatQuestion}
                onDeleteQuestion={deleteStatQuestion}
                onBulkDeleteQuestions={bulkDeleteStatQuestions}
              />
            )}

            {view === "premium" && (
              <AdminPremiumPredictionsPanel
                players={data.premium.players}
                predictions={data.premium.predictions}
              />
            )}

            {view === "analytics" && (
              <AdminAnalyticsPanel
                summary={data.analytics.summary}
                events={data.analytics.events}
              />
            )}
          </>
        ) : null}
      </div>

      {selectedPlayer && (
        <PlayerDetailModal
          entry={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </main>
  );
}
