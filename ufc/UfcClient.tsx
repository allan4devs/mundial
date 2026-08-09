"use client";

import {
  Check,
  ChevronDown,
  CircleAlert,
  CreditCard,
  ListChecks,
  Loader2,
  RefreshCw,
  Save,
  Swords,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { VIEW_OPTIONS } from "./constants";
import type { UfcDraft, UfcFight, UfcViewMode } from "./types";
import { useUfc } from "./useUfc";
import { cn, emptyDraft, isFightClosed } from "./utils";
import { CardPanel } from "./components/CardPanel";
import { FeaturedFight } from "./components/FeaturedFight";
import { MineView } from "./components/MineView";
import { OtherPicksPanel } from "./components/OtherPicksPanel";
import { PlayerPickerModal } from "./components/PlayerPickerModal";
import { PlayersView } from "./components/PlayersView";
import { PinModal } from "./components/PinModal";
import { UFC_EVENT_NAME, UFC_EVENT_SUBTITLE } from "@/lib/ufc/fights";

function ViewIcon({ id, active }: { id: UfcViewMode; active: boolean }) {
  const className = cn("h-4 w-4 shrink-0", active ? "text-[#f5c518]" : "text-white/55");
  if (id === "card") return <Swords className={className} />;
  if (id === "mine") return <ListChecks className={className} />;
  return <Users className={className} />;
}

export default function UfcClient() {
  const {
    playerName,
    setPlayerName,
    showPlayerPicker,
    setShowPlayerPicker,
    fights,
    orderedFights,
    predictions,
    players,
    leaderboard,
    viewMode,
    setViewMode,
    nowMs,
    isLoading,
    savingId,
    isSavingBulk,
    error,
    success,
    drafts,
    dirtyDrafts,
    savedCount,
    lockedCount,
    loadQuiniela,
    updateDraft,
    saveFight,
    saveDirtyDrafts,
    showPinModal,
    pinMode,
    onPinSuccess,
  } = useUfc();

  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [showPicksModal, setShowPicksModal] = useState(false);
  const featuredRef = useRef<HTMLDivElement>(null);

  const selectedFight = useMemo(() => {
    if (selectedFightId) return fights.find((f) => f.id === selectedFightId) ?? null;
    // Default: first open fight, else first fight
    return orderedFights.find((f) => !isFightClosed(f, nowMs)) ?? orderedFights[0] ?? null;
  }, [selectedFightId, fights, orderedFights, nowMs]);

  const pickCount = selectedFight ? predictions.filter((p) => p.fightId === selectedFight.id).length : 0;

  function handleSelectFight(fight: UfcFight) {
    setSelectedFightId(fight.id);
    setShowPicksModal(false);
    setTimeout(() => {
      featuredRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handlePickPlayer(name: string) {
    setPlayerName(name);
    setShowPlayerPicker(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060606] text-white [background-image:radial-gradient(circle_at_50%_-10%,rgba(200,16,46,0.18),transparent_40%),linear-gradient(135deg,#0d0d0d_0%,#1a0308_30%,#060606_70%,#0a0500_100%)]">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-white/10 bg-[#0d0d0d]/90">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,rgba(200,16,46,0.15),transparent_50%)]" />
        <div className="relative mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c8102e]/60 bg-[#c8102e] shadow-[0_0_0_2px_rgba(245,197,24,0.25)]">
              <Swords className="h-4 w-4 text-white" />
            </span>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f5c518]">{UFC_EVENT_NAME}</p>
              <h1 className="truncate text-lg font-black uppercase leading-none text-white sm:text-2xl">
                {UFC_EVENT_SUBTITLE}
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs font-black uppercase tracking-wide text-white/50 sm:flex">
            <span>{savedCount} picks</span>
            <span className="h-1 w-1 rounded-full bg-[#f5c518]" />
            <span>{lockedCount} cerrados</span>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#060606]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-1.5 px-2 py-1.5 min-[760px]:flex-row min-[760px]:items-center min-[760px]:justify-between sm:px-5">
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:min-w-0">
            {VIEW_OPTIONS.map((option) => {
              const active = viewMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setViewMode(option.id)}
                  className={cn(
                    "inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 text-center text-xs font-black uppercase tracking-wide transition sm:px-3",
                    active
                      ? "border-[#f5c518] bg-[#c8102e] text-white shadow-[0_0_24px_rgba(200,16,46,0.30)]"
                      : "border-white/10 bg-white/4 text-white/60 hover:border-[#c8102e]/50 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <ViewIcon id={option.id} active={active} />
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1.5 sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => setShowPlayerPicker(true)}
              className="flex h-9 max-w-full min-w-0 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-black/45 px-2.5 transition hover:border-[#f5c518] hover:bg-black/65 sm:px-3"
            >
              <UserRound className="h-4 w-4 shrink-0 text-[#f5c518]" />
              <span className={cn("max-w-[38vw] truncate text-sm font-black sm:max-w-44", playerName ? "text-white" : "text-white/50")}>
                {playerName || "Jugador"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[#c8102e]" />
            </button>
            <button
              type="button"
              onClick={() => void saveDirtyDrafts()}
              disabled={isSavingBulk || !dirtyDrafts.length}
              className="relative inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-[#f5c518] bg-[#f5c518] px-3 text-xs font-black text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/8 disabled:text-white/30"
            >
              {isSavingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="truncate">Guardar{dirtyDrafts.length > 0 ? ` (${dirtyDrafts.length})` : ""}</span>
            </button>
            <button
              type="button"
              onClick={() => void loadQuiniela()}
              disabled={isLoading}
              aria-label="Sincronizar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/4 text-white/60 transition hover:border-[#f5c518] hover:text-white disabled:opacity-40 sm:w-auto sm:px-3"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1.5 hidden text-xs font-black sm:inline">Sync</span>
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto w-full max-w-[1600px] px-3 py-3 sm:px-5 sm:py-4">
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#c8102e]/50 bg-[#1a0308]/80 p-4 text-sm font-bold text-[#ffc2c2]">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f5c518]/50 bg-[#1a1400]/80 p-4 text-sm font-bold text-[#fff3c2]">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#f5c518]" />
            <span className="min-w-0 break-words">{success}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-white/15 bg-black/35 p-8 text-center">
            <div>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#f5c518]" />
              <p className="mt-4 text-base font-black text-white/60">Cargando picks...</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "card" && (
              <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] xl:items-start">
                <div className="grid min-w-0 content-start gap-4">
                  {selectedFight ? (
                    <>
                      <div ref={featuredRef} className="scroll-mt-20">
                        <FeaturedFight
                          fight={selectedFight}
                          draft={drafts[selectedFight.id] ?? emptyDraft()}
                          savingId={savingId}
                          isSavingBulk={isSavingBulk}
                          nowMs={nowMs}
                          onUpdateDraft={updateDraft}
                          onSave={saveFight}
                        />
                      </div>

                      {/* Action bar */}
                      <div className="flex items-center justify-end gap-2 rounded-xl border border-white/8 bg-black/25 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setShowPicksModal(true)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#f5c518]/45 bg-[#1a1400] px-3 text-sm font-black text-[#f5c518] transition hover:border-white hover:text-white"
                        >
                          <Users className="h-4 w-4 shrink-0" />
                          <span>Picks amigos</span>
                          <span className="rounded bg-black/40 px-1.5 py-0.5 text-xs tabular-nums text-white">{pickCount}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-white/15 bg-black/25 p-8 text-center">
                      <div>
                        <Swords className="mx-auto h-12 w-12 text-[#c8102e]" />
                        <p className="mt-4 text-2xl font-black text-white">Card completa</p>
                        <p className="mt-2 text-base font-bold text-white/55">Todos los picks guardados.</p>
                      </div>
                    </div>
                  )}
                </div>

                <CardPanel
                  fights={orderedFights}
                  nowMs={nowMs}
                  selectedFightId={selectedFight?.id ?? null}
                  drafts={drafts}
                  onSelectFight={handleSelectFight}
                />
              </div>
            )}

            {viewMode === "mine" && (
              <MineView
                orderedFights={orderedFights}
                drafts={drafts}
                savingId={savingId}
                isSavingBulk={isSavingBulk}
                nowMs={nowMs}
                savedCount={savedCount}
                lockedCount={lockedCount}
                predictions={predictions}
                playerName={playerName}
                onUpdateDraft={updateDraft}
                onSave={saveFight}
              />
            )}

            {viewMode === "players" && (
              <PlayersView leaderboard={leaderboard} fights={fights} predictions={predictions} />
            )}
          </>
        )}
      </section>

      {showPlayerPicker && (
        <PlayerPickerModal
          players={players}
          onSelect={handlePickPlayer}
          onClose={() => setShowPlayerPicker(false)}
          allowClose={Boolean(playerName)}
        />
      )}

      {showPinModal && (
        <PinModal
          playerName={playerName}
          mode={pinMode}
          onSuccess={onPinSuccess}
        />
      )}

      {showPicksModal && selectedFight && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#f5c518]/35 bg-[#0a0a0a] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#c8102e] px-4 py-3">
              <p className="min-w-0 truncate text-sm font-black uppercase tracking-[0.18em] text-white">
                Picks: {selectedFight.redCorner} vs {selectedFight.blueCorner}
              </p>
              <button
                type="button"
                onClick={() => setShowPicksModal(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/20 bg-black/20 text-white/75 transition hover:border-[#f5c518] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              <OtherPicksPanel fight={selectedFight} predictions={predictions} playerName={playerName} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
