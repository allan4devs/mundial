"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Check, CircleAlert, Loader2, Sparkles, Target, X } from "lucide-react";
import type { LiveMatchStatus, MundialMatch } from "./types";
import { isMatchFinished, normalizeKey, pickNextLiveFocusMatch } from "./utils";
import { useMundial } from "./useMundial";
import { useLiveMatch } from "./useLiveMatch";
import { MineView } from "./components/MineView";
import { NextView } from "./components/NextView";
import { PlayersView } from "./components/PlayersView";
import { PlayerPickerModal } from "./components/PlayerPickerModal";
import { PinModal } from "./components/PinModal";
import { MundialHeader } from "./components/MundialHeader";
import { ProfileModal } from "./components/ProfileModal";
import { PenalitosPanel } from "./components/PenalitosPanel";
import { ProximoEnAnotarPanel } from "./components/ProximoEnAnotarPanel";
import { LiveMatchChat } from "./components/LiveMatchChat";
import { BracketView } from "./components/BracketView";

export default function MundialClient() {
  const router = useRouter();
  const {
    playerName,
    isBanned,
    showPlayerPicker,
    canClosePlayerPicker,
    selectPlayer,
    openPlayerPicker,
    closePlayerPicker,
    matches,
    predictions,
    leaderboard,
    viewMode,
    setViewMode,
    nowMs,
    isLoading,
    savingId,
    isSavingBulk,
    error,
    success,
    activeMatch,
    liveMatch,
    activeMatchId,
    todayEditableMatchIds,
    drafts,
    dirtyDrafts,
    savedCount,
    lockedCount,
    activeCountdown,
    mineMatches,
    loadQuiniela,
    updateDraft,
    saveMatch,
    saveDirtyDrafts,
    showPinModal,
    onPinSuccess,
    registeredNames,
  } = useMundial();

  // Redirect banned players to the suspended account page
  useEffect(() => {
    if (isBanned) router.replace("/mundial/banned");
  }, [isBanned, router]);

  // SSE: receives live match updates pushed to all clients simultaneously
  const { data: liveSSE } = useLiveMatch();

  const [selectedInfoMatchId, setSelectedInfoMatchId] = useState<string | null>(null);
  const [featuredMatchId, setFeaturedMatchId] = useState<string | null>(null);
  const [focusedMineMatchId, setFocusedMineMatchId] = useState<string | null>(null);
  const [liveModal, setLiveModal] = useState<"scorer" | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileIsFirstTime, setProfileIsFirstTime] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [showProfileBanner, setShowProfileBanner] = useState(false);

  const playerKey = normalizeKey(playerName);

  // Load avatar whenever the active player changes; show banner for players without one
  useEffect(() => {
    if (!playerKey) {
      queueMicrotask(() => {
        setProfileAvatar(null);
        setShowProfileBanner(false);
      });
      return;
    }
    fetch(`/api/mundial/profile?name=${encodeURIComponent(playerKey)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { avatarDataUrl?: string | null } | null) => {
        const avatar = data?.avatarDataUrl ?? null;
        queueMicrotask(() => {
          setProfileAvatar(avatar);
          if (!avatar) {
            const key = `mundial-profile-banner-${playerKey}`;
            const dismissed = Boolean(localStorage.getItem(key));
            setShowProfileBanner(!dismissed);
          } else {
            setShowProfileBanner(false);
          }
        });
      })
      .catch(() => {});
  }, [playerKey]);

  function dismissProfileBanner() {
    setShowProfileBanner(false);
    if (playerKey) localStorage.setItem(`mundial-profile-banner-${playerKey}`, "1");
  }

  function handlePinSuccess(isNew: boolean) {
    onPinSuccess();
    if (isNew) {
      setProfileIsFirstTime(true);
      setShowProfile(true);
    }
  }

  // Merge SSE live fields onto the polled liveMatch so all clients see updates
  // at the same instant. Falls back to polling data when SSE has nothing new.
  const effectiveLiveMatch = useMemo<MundialMatch | null>(() => {
    const sseHasMatch = Boolean(liveSSE.matchId);
    // If SSE says there's a live match, find it in the matches array
    // (works even if polling hasn't refreshed the liveStatus yet)
    const base = liveMatch ?? (
      sseHasMatch
        ? (matches.find((m) => m.id === liveSSE.matchId) ?? null)
        : null
    );

    if (!base) return null;

    // Only overlay SSE data when the matchId matches
    if (liveSSE.matchId !== base.id) return base;

    const isFulltime = liveSSE.liveStatus === "fulltime";

    return {
      ...base,
      liveStatus: liveSSE.liveStatus as LiveMatchStatus,
      homeLiveScore: liveSSE.homeLiveScore,
      awayLiveScore: liveSSE.awayLiveScore,
      homeFinalScore: isFulltime && liveSSE.homeLiveScore !== null ? liveSSE.homeLiveScore : base.homeFinalScore,
      awayFinalScore: isFulltime && liveSSE.awayLiveScore !== null ? liveSSE.awayLiveScore : base.awayFinalScore,
      closed: isFulltime ? true : base.closed,
      liveMinute: liveSSE.liveMinute,
      liveMinuteUpdatedAt: liveSSE.liveMinuteUpdatedAt,
      liveNote: liveSSE.liveNote,
      liveEvents: liveSSE.liveEvents,
      liveStats: liveSSE.liveStats,
      liveUpdatedAt: liveSSE.liveUpdatedAt,
    };
  }, [liveMatch, liveSSE, matches]);

  const activeLiveMatch =
    effectiveLiveMatch?.liveStatus === "live" || effectiveLiveMatch?.liveStatus === "halftime"
      ? effectiveLiveMatch
      : null;

  const matchesWithLiveSSE = useMemo(
    () =>
      matches.map((match) => {
        if (!liveSSE.matchId || liveSSE.matchId !== match.id) return match;
        const isFulltime = liveSSE.liveStatus === "fulltime";
        return {
          ...match,
          liveStatus: liveSSE.liveStatus as LiveMatchStatus,
          homeLiveScore: liveSSE.homeLiveScore,
          awayLiveScore: liveSSE.awayLiveScore,
          homeFinalScore:
            isFulltime && liveSSE.homeLiveScore !== null ? liveSSE.homeLiveScore : match.homeFinalScore,
          awayFinalScore:
            isFulltime && liveSSE.awayLiveScore !== null ? liveSSE.awayLiveScore : match.awayFinalScore,
          closed: isFulltime ? true : match.closed,
          liveMinute: liveSSE.liveMinute,
          liveMinuteUpdatedAt: liveSSE.liveMinuteUpdatedAt,
          liveNote: liveSSE.liveNote,
          liveEvents: liveSSE.liveEvents,
          liveStats: liveSSE.liveStats,
          liveUpdatedAt: liveSSE.liveUpdatedAt,
        };
      }),
    [liveSSE, matches]
  );

  const mostRecentMatch = useMemo(
    () => effectiveLiveMatch ?? activeMatch ?? matches[0] ?? null,
    [activeMatch, effectiveLiveMatch, matches]
  );

  const focusLiveStatusRef = useRef<Map<string, LiveMatchStatus>>(new Map());
  const prevActiveLiveIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (viewMode !== "next") return;

    const focusId = featuredMatchId ?? selectedInfoMatchId ?? prevActiveLiveIdRef.current;
    if (!focusId) return;

    const focused = matchesWithLiveSSE.find((match) => match.id === focusId);
    if (!focused) return;

    const status = focused.liveStatus;
    const prevStatus = focusLiveStatusRef.current.get(focusId);
    focusLiveStatusRef.current.set(focusId, status);

    const wasLive = prevStatus === "live" || prevStatus === "halftime";
    const justFinished = wasLive && isMatchFinished(focused);
    if (!justFinished) return;

    const next = pickNextLiveFocusMatch(matchesWithLiveSSE, focusId);
    if (next) {
      setFeaturedMatchId(next.id);
      setSelectedInfoMatchId(next.id);
    } else {
      setFeaturedMatchId(null);
      setSelectedInfoMatchId(null);
    }
  }, [featuredMatchId, matchesWithLiveSSE, selectedInfoMatchId, viewMode]);

  useEffect(() => {
    const liveId = activeLiveMatch?.id ?? null;
    const prevLiveId = prevActiveLiveIdRef.current;

    if (viewMode === "next" && prevLiveId && prevLiveId !== liveId) {
      const userFocusId = featuredMatchId ?? selectedInfoMatchId;
      if (!userFocusId || userFocusId === prevLiveId) {
        const finished = matchesWithLiveSSE.find((match) => match.id === prevLiveId);
        if (finished && isMatchFinished(finished)) {
          const next = pickNextLiveFocusMatch(matchesWithLiveSSE, prevLiveId);
          if (next) {
            setFeaturedMatchId(next.id);
            setSelectedInfoMatchId(next.id);
          } else {
            setFeaturedMatchId(null);
            setSelectedInfoMatchId(null);
          }
        }
      }
    }

    prevActiveLiveIdRef.current = liveId;
  }, [activeLiveMatch?.id, featuredMatchId, matchesWithLiveSSE, selectedInfoMatchId, viewMode]);

  const explicitSelectedMatch = useMemo(
    () => matchesWithLiveSSE.find((match) => match.id === selectedInfoMatchId) ?? null,
    [matchesWithLiveSSE, selectedInfoMatchId]
  );

  const featuredMatch = useMemo(() => {
    if (featuredMatchId) {
      return matchesWithLiveSSE.find((match) => match.id === featuredMatchId) ?? activeMatch;
    }
    return effectiveLiveMatch ?? activeMatch;
  }, [activeMatch, featuredMatchId, effectiveLiveMatch, matchesWithLiveSSE]);

  const selectedInfoMatch = explicitSelectedMatch ?? featuredMatch ?? mostRecentMatch;

  function handlePickPlayer(name: string) {
    selectPlayer(name);
  }

  function handleSelectMatch(match: MundialMatch) {
    setSelectedInfoMatchId(match.id);
    setFeaturedMatchId(match.id);
  }

  function handleGoToMine(matchId?: string) {
    setFocusedMineMatchId(matchId ?? null);
    setViewMode("mine");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07110b] text-white [background-image:linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(135deg,#06100b_0%,#0b2216_45%,#14351d_74%,#07110b_100%)] [background-size:96px_96px,96px_96px,100%_100%]">

      <MundialHeader
        playerName={playerName}
        avatarDataUrl={profileAvatar}
        dirtyDrafts={dirtyDrafts}
        isSavingBulk={isSavingBulk}
        viewMode={viewMode}
        setViewMode={setViewMode}
        loadQuiniela={loadQuiniela}
        isLoading={isLoading}
        saveDirtyDrafts={saveDirtyDrafts}
        openPlayerPicker={openPlayerPicker}
        openProfile={() => setShowProfile(true)}
      />

      <section className="mx-auto w-full max-w-[1600px] px-2.5 py-2 min-[380px]:px-3 sm:px-5 sm:py-3">
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#ff6a3d]/60 bg-[#35130d]/80 p-4 text-sm font-bold text-[#ffd2c2]">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#9dff34]/60 bg-[#10240b]/80 p-4 text-sm font-bold text-[#e7ffc0]">
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{success}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-white/20 bg-black/35 p-8 text-center">
            <div>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#f0b429]" />
              <p className="mt-4 text-base font-black text-white/75">Cargando quiniela...</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "next" && (
              <NextView
                activeMatch={activeMatch}
                activeLiveMatch={activeLiveMatch}
                selectedInfoMatch={selectedInfoMatch}
                featuredMatch={featuredMatch}
                matches={matchesWithLiveSSE}
                predictions={predictions}
                drafts={drafts}
                activeMatchId={activeMatchId}
                nowMs={nowMs}
                activeCountdown={activeCountdown}
                playerName={playerName}
                todayEditableMatchIds={todayEditableMatchIds}
                onGoToMine={handleGoToMine}
                onSelectMatch={handleSelectMatch}
                onOpenPlayerPicker={openPlayerPicker}
              />
            )}

            {viewMode === "mine" && (
              <MineView
                savedCount={savedCount}
                lockedCount={lockedCount}
                mineMatches={mineMatches}
                drafts={drafts}
                savingId={savingId}
                isSavingBulk={isSavingBulk}
                todayEditableMatchIds={todayEditableMatchIds}
                nowMs={nowMs}
                focusMatchId={focusedMineMatchId}
                onUpdateDraft={updateDraft}
                onSave={saveMatch}
              />
            )}

            {viewMode === "players" && (
              <PlayersView
                leaderboard={leaderboard}
                matches={matches}
                predictions={predictions}
                playerName={playerName}
                onOpenProfile={() => setShowProfile(true)}
              />
            )}

            {viewMode === "bracket" && (
              <BracketView matches={matches} predictions={predictions} playerName={playerName} />
            )}

            {/* ====================== LIVE SECTION ========================== */}
            {activeLiveMatch && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-[#f0b429]/35 bg-[#06140f]/92 p-3 shadow-[0_18px_70px_rgba(0,0,0,0.45)] [background-image:linear-gradient(135deg,rgba(240,180,41,0.14),transparent_42%),linear-gradient(180deg,rgba(157,255,52,0.06),transparent_55%)] sm:p-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.55fr)]">
                <div className="grid min-w-0 gap-3">
                  {viewMode !== "next" && (
                    <PenalitosPanel liveMatch={activeLiveMatch} playerName={playerName} compact />
                  )}
                  <LiveToolButton
                    icon={<Target className="h-5 w-5" />}
                    title="Próximo en anotar"
                    description="Mini apuestas live"
                    onClick={() => setLiveModal("scorer")}
                  />
                </div>

                <div className="min-w-0">
                  <LiveMatchChat
                    liveMatch={activeLiveMatch}
                    playerName={playerName}
                    onOpenPlayerPicker={openPlayerPicker}
                    variant="panel"
                  />
                </div>
              </div>
            )}
            {/* ============================================================= */}
          </>
        )}
      </section>

      {activeLiveMatch && liveModal === "scorer" && (
        <LiveToolModal title="Próximo en anotar" onClose={() => setLiveModal(null)}>
          <ProximoEnAnotarPanel liveMatch={activeLiveMatch} playerName={playerName} embedded />
        </LiveToolModal>
      )}

      {showPlayerPicker && (
        <PlayerPickerModal
          players={registeredNames}
          onSelect={handlePickPlayer}
          onClose={closePlayerPicker}
          allowClose={Boolean(playerName) && canClosePlayerPicker}
        />
      )}

      {showPinModal && (
        <PinModal
          playerName={playerName}
          onSuccess={handlePinSuccess}
          onChangePlayer={openPlayerPicker}
        />
      )}

      <ProfileModal
        playerName={playerName}
        open={showProfile}
        isFirstTime={profileIsFirstTime}
        onClose={() => { setShowProfile(false); setProfileIsFirstTime(false); }}
        onSaved={({ avatarDataUrl }) => {
          setProfileAvatar(avatarDataUrl);
          if (avatarDataUrl) setShowProfileBanner(false);
        }}
      />

      {/* Profile setup banner for existing players without an avatar */}
      {showProfileBanner && playerName && !showProfile && (
        <div className="fixed inset-x-2 bottom-3 z-40 flex items-center gap-2 rounded-2xl border border-[#f0b429]/40 bg-[#080f0b]/95 px-3 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2 sm:gap-3 sm:px-4">
          <Sparkles className="h-4 w-4 shrink-0 text-[#f0b429]" />
          <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-white/80">
            ¡Personalizá tu avatar de jugador!
          </p>
          <button
            type="button"
            onClick={() => { dismissProfileBanner(); setShowProfile(true); }}
            className="shrink-0 rounded-lg border border-[#f0b429]/50 bg-[#f0b429] px-3 py-1.5 text-xs font-black text-[#07110b] transition hover:bg-[#f5c842]"
          >
            Ver
          </button>
          <button
            type="button"
            onClick={dismissProfileBanner}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white/30 transition hover:text-white/70 sm:h-6 sm:w-6"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </main>
  );
}

function LiveToolButton({
  icon,
  title,
  description,
  onClick,
  featured = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group flex min-w-0 items-center gap-3 rounded-xl border px-3 py-4 text-left transition hover:-translate-y-0.5 sm:px-4 sm:py-5",
        featured
          ? "border-[#f0b429]/55 bg-[#1a2206]/95 shadow-[0_12px_36px_rgba(240,180,41,0.16)] hover:border-[#f0b429] hover:bg-[#232d08]"
          : "border-white/14 bg-[#06140f] hover:border-[#f0b429]/55 hover:bg-[#10240b]",
      ].join(" ")}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#f0b429]/45 bg-[#1a2206] text-[#f0b429] transition group-hover:scale-105 sm:h-14 sm:w-14">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block min-w-0 break-words text-base font-black uppercase leading-tight text-white sm:text-lg">{title}</span>
        <span className="mt-1 block min-w-0 break-words text-xs font-bold leading-snug text-white/55 sm:text-sm">{description}</span>
      </span>
    </button>
  );
}

function LiveToolModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#f0b429]/35 bg-[#06140f] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/12 bg-[#12351f] px-4 py-3 [background-image:linear-gradient(135deg,rgba(240,180,41,0.18),transparent_58%)]">
          <p className="truncate font-black text-white">{title}</p>
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
          {children}
        </div>
      </div>
    </div>
  );
}
