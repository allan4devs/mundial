"use client";

import { useState } from "react";
import {
  Loader2,
  Radio,
  CalendarClock,
  ListChecks,
  Trophy,
  RefreshCw,
  UserRound,
  Flag,
  Save,
} from "lucide-react";
import { VIEW_OPTIONS } from "./constants";
import { useScores } from "./useScores";
import { cn } from "./utils";
import { LiveView } from "./components/LiveView";
import { NextView } from "./components/NextView";
import { MineView } from "./components/MineView";
import { RankingView } from "./components/RankingView";
import { AuthModal } from "./components/AuthModal";
import { MatchCard } from "./components/MatchCard";
import { emptyDraft } from "./utils";
import { GrowthPanel } from "./components/GrowthPanel";

export default function ScoresClient() {
  const [showGrowth, setShowGrowth] = useState(false);
  const {
    viewer,
    showAuth,
    setShowAuth,
    competitions,
    sportFilter,
    setSportFilter,
    competitionFilter,
    setCompetitionFilter,
    liveMatches,
    nextMatches,
    finishedMatches,
    mineMatches,
    publicPredictions,
    leaderboard,
    viewMode,
    setViewMode,
    nowMs,
    isLoading,
    savingId,
    error,
    success,
    drafts,
    dirtyMatchIds,
    load,
    updateDraft,
    saveMatch,
    saveAllDirty,
    login,
    logout,
  } = useScores();

  const allCommunity = publicPredictions;

  return (
    <main className="min-h-screen bg-[#050a08] text-white [background-image:radial-gradient(circle_at_20%_-10%,rgba(157,255,52,0.12),transparent_40%)]">
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9dff34]/80">Scores</p>
            <h1 className="text-lg font-black">Quiniela multi-liga</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (viewer ? setShowGrowth(true) : setShowAuth(true))}
              className="inline-flex max-w-[140px] items-center gap-1.5 truncate rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-white/80"
            >
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              {viewer?.displayName || "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-white/15 p-2 text-white/70"
              aria-label="Recargar"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "Todos" },
            { id: "football", label: "Futbol" },
            { id: "basketball", label: "Basket" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSportFilter(s.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-bold",
                sportFilter === s.id
                  ? "border-[#9dff34]/50 bg-[#9dff34]/15 text-[#d5ff3f]"
                  : "border-white/10 text-white/55"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCompetitionFilter("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              competitionFilter === "all"
                ? "border-cyan-400/40 text-cyan-200"
                : "border-white/10 text-white/55"
            )}
          >
            Ligas
          </button>
          {competitions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCompetitionFilter(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-bold",
                competitionFilter === c.id
                  ? "border-cyan-400/40 text-cyan-200"
                  : "border-white/10 text-white/55"
              )}
              title={c.syncHealth}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {VIEW_OPTIONS.map((opt) => {
            const active = viewMode === opt.id;
            const Icon =
              opt.id === "live"
                ? Radio
                : opt.id === "next"
                  ? CalendarClock
                  : opt.id === "finished"
                    ? Flag
                    : opt.id === "ranking"
                      ? Trophy
                      : ListChecks;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setViewMode(opt.id)}
                className={cn(
                  "inline-flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-black sm:text-xs",
                  active ? "bg-[#9dff34] text-black" : "text-white/60"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="truncate">{opt.label}</span>
                {opt.id === "live" && liveMatches.length > 0 ? (
                  <span className="rounded-full bg-black/20 px-1">{liveMatches.length}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {dirtyMatchIds.length > 0 ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
            <span className="font-bold">{dirtyMatchIds.length} pick(s) sin guardar</span>
            <button
              type="button"
              onClick={() => void saveAllDirty()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9dff34] px-3 py-1.5 text-xs font-black text-black"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar todos
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mb-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mb-3 rounded-lg border border-[#9dff34]/30 bg-[#10240b] px-3 py-2 text-sm text-[#d5ff3f]">
            {success}
          </p>
        ) : null}

        {isLoading && nextMatches.length + liveMatches.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#9dff34]" />
          </div>
        ) : viewMode === "live" ? (
          <LiveView
            matches={liveMatches}
            drafts={drafts}
            predictions={allCommunity}
            nowMs={nowMs}
            savingId={savingId}
            onUpdate={updateDraft}
            onSave={(m) => void saveMatch(m)}
          />
        ) : viewMode === "next" ? (
          <NextView
            matches={nextMatches}
            drafts={drafts}
            nowMs={nowMs}
            savingId={savingId}
            onUpdate={updateDraft}
            onSave={(m) => void saveMatch(m)}
          />
        ) : viewMode === "finished" ? (
          <div className="grid gap-3">
            {finishedMatches.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-white/50">
                Sin finalizados aun.
              </div>
            ) : (
              finishedMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  draft={drafts[m.id] ?? emptyDraft()}
                  nowMs={nowMs}
                  saving={false}
                  community={allCommunity.filter((p) => p.matchId === m.id)}
                  onUpdate={() => {}}
                  onSave={() => {}}
                />
              ))
            )}
          </div>
        ) : viewMode === "ranking" ? (
          <RankingView leaderboard={leaderboard} competitions={competitions} />
        ) : (
          <MineView
            matches={mineMatches}
            drafts={drafts}
            leaderboard={leaderboard}
            predictions={allCommunity}
            viewerName={viewer?.displayName || ""}
            nowMs={nowMs}
            savingId={savingId}
            onUpdate={updateDraft}
            onSave={(m) => void saveMatch(m)}
          />
        )}
      </div>

      <AuthModal
        open={showAuth}
        onClose={viewer ? () => setShowAuth(false) : undefined}
        onAuth={login}
      />
      {viewer ? (
        <GrowthPanel
          open={showGrowth}
          viewer={viewer}
          onClose={() => setShowGrowth(false)}
          onLogout={() => {
            setShowGrowth(false);
            void logout();
          }}
          onRefresh={load}
        />
      ) : null}
    </main>
  );
}
