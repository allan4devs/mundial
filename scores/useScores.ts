"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInterval } from "@/lib/hooks/useInterval";
import { AUTH_API, BOOTSTRAP_API, POLL_MS, PREDICTIONS_API } from "./constants";
import type {
  BootstrapResponse,
  CompetitionInfo,
  Draft,
  LeaderboardEntry,
  ScoreMatch,
  ScorePrediction,
  ViewMode,
  Viewer,
} from "./types";
import {
  emptyDraft,
  fetchWithTimeout,
  isMatchClosed,
  isMatchFinished,
  isMatchLive,
  kickoffMs,
} from "./utils";

export function useScores() {
  const [viewer, setViewer] = useState<Viewer>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [matches, setMatches] = useState<ScoreMatch[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionInfo[]>([]);
  const [myPredictions, setMyPredictions] = useState<ScorePrediction[]>([]);
  const [publicPredictions, setPublicPredictions] = useState<ScorePrediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("next");
  const [nowMs, setNowMs] = useState(0);
  const [serverSkew, setServerSkew] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftOverrides, setDraftOverrides] = useState<Record<string, Draft>>({});

  const effectiveNow = nowMs + serverSkew;

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (sportFilter !== "all" && m.sport !== sportFilter) return false;
      if (competitionFilter !== "all" && m.competitionId !== competitionFilter && m.sourceId !== competitionFilter) {
        return false;
      }
      return true;
    });
  }, [matches, sportFilter, competitionFilter]);

  const liveMatches = useMemo(
    () => filteredMatches.filter(isMatchLive).sort((a, b) => kickoffMs(a) - kickoffMs(b)),
    [filteredMatches]
  );

  const nextMatches = useMemo(
    () =>
      filteredMatches
        .filter((m) => !isMatchLive(m) && !isMatchFinished(m) && !isMatchClosed(m, effectiveNow))
        .sort((a, b) => kickoffMs(a) - kickoffMs(b)),
    [filteredMatches, effectiveNow]
  );

  const finishedMatches = useMemo(
    () =>
      filteredMatches
        .filter((m) => isMatchFinished(m) || (isMatchClosed(m, effectiveNow) && m.homeScore != null))
        .sort((a, b) => kickoffMs(b) - kickoffMs(a)),
    [filteredMatches, effectiveNow]
  );

  const predictionByMatch = useMemo(
    () => new Map(myPredictions.map((p) => [p.matchId, p])),
    [myPredictions]
  );

  const drafts = useMemo(() => {
    const next: Record<string, Draft> = {};
    for (const m of matches) {
      const saved = predictionByMatch.get(m.id);
      if (draftOverrides[m.id]) next[m.id] = draftOverrides[m.id];
      else if (saved) {
        next[m.id] = {
          homeScore: saved.homeScore,
          awayScore: saved.awayScore,
          dirty: false,
          saved: true,
          updatedAt: saved.updatedAt,
        };
      } else next[m.id] = emptyDraft();
    }
    return next;
  }, [matches, predictionByMatch, draftOverrides]);

  const mineMatches = useMemo(() => {
    const ids = new Set(myPredictions.map((p) => p.matchId));
    const open = filteredMatches.filter((m) => !isMatchClosed(m, effectiveNow));
    const withPick = filteredMatches.filter((m) => ids.has(m.id));
    const map = new Map<string, ScoreMatch>();
    for (const m of [...open, ...withPick]) map.set(m.id, m);
    return [...map.values()].sort((a, b) => kickoffMs(a) - kickoffMs(b));
  }, [filteredMatches, myPredictions, effectiveNow]);

  const applyBootstrap = useCallback((data: BootstrapResponse) => {
    setViewer(data.viewer ?? null);
    setCompetitions(data.competitions ?? []);
    setMatches(data.matches ?? []);
    setMyPredictions(data.myPredictions ?? []);
    setPublicPredictions(data.publicPredictions ?? []);
    setLeaderboard(data.leaderboard ?? []);
    if (data.serverTime) {
      const server = new Date(data.serverTime).getTime();
      if (Number.isFinite(server)) setServerSkew(server - Date.now());
    }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetchWithTimeout(BOOTSTRAP_API, { cache: "no-store" });
      if (!res.ok) throw new Error("load");
      applyBootstrap((await res.json()) as BootstrapResponse);
    } catch {
      setError("No se pudo cargar. Reintenta.");
    } finally {
      setIsLoading(false);
    }
  }, [applyBootstrap]);

  const poll = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(BOOTSTRAP_API, { cache: "no-store" });
      if (!res.ok) return;
      applyBootstrap((await res.json()) as BootstrapResponse);
    } catch {
      /* ignore */
    }
  }, [applyBootstrap]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    // 1s tick keeps countdowns smooth without re-fetching
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, []);

  useInterval(poll, POLL_MS);

  function updateDraft(matchId: string, patch: Partial<Draft>) {
    setDraftOverrides((prev) => {
      const base = prev[matchId] ?? drafts[matchId] ?? emptyDraft();
      return { ...prev, [matchId]: { ...base, ...patch, dirty: true, saved: false } };
    });
  }

  async function login(action: "set" | "verify", displayName: string, pin: string) {
    setError("");
    const res = await fetchWithTimeout(AUTH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, displayName, pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Auth fallida");
    setViewer(data.viewer ?? null);
    setShowAuth(false);
    setSuccess(action === "set" ? "Cuenta creada." : "Sesion iniciada.");
    await load();
  }

  async function logout() {
    await fetchWithTimeout(AUTH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setViewer(null);
    setMyPredictions([]);
    await load();
  }

  const dirtyMatchIds = useMemo(() => {
    return Object.entries(drafts)
      .filter(([, draft]) => draft.dirty)
      .map(([id]) => id)
      .filter((id) => {
        const match = matches.find((m) => m.id === id);
        return match ? !isMatchClosed(match, effectiveNow) : false;
      });
  }, [drafts, matches, effectiveNow]);

  async function saveMatch(match: ScoreMatch): Promise<boolean> {
    if (!viewer) {
      setShowAuth(true);
      return false;
    }
    if (isMatchClosed(match, effectiveNow)) {
      setError("Ese partido ya cerro.");
      return false;
    }
    const draft = drafts[match.id] ?? emptyDraft();
    const previousUpdatedAt = draft.updatedAt;
    const optimisticAt = new Date().toISOString();
    // Optimistic UI: mark saved immediately; roll back on failure
    setDraftOverrides((prev) => ({
      ...prev,
      [match.id]: {
        homeScore: draft.homeScore,
        awayScore: draft.awayScore,
        dirty: false,
        saved: true,
        updatedAt: optimisticAt,
      },
    }));
    setMyPredictions((prev) => {
      const rest = prev.filter((p) => p.matchId !== match.id);
      return [
        ...rest,
        {
          id: `local-${match.id}`,
          matchId: match.id,
          userId: viewer.userId,
          playerName: viewer.displayName,
          homeScore: draft.homeScore,
          awayScore: draft.awayScore,
          locked: false,
          lockedAt: null,
          createdAt: optimisticAt,
          updatedAt: optimisticAt,
        },
      ];
    });
    setSavingId(match.id);
    setError("");
    setSuccess("Guardando…");
    try {
      const res = await fetchWithTimeout(`${PREDICTIONS_API}/${encodeURIComponent(match.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: draft.homeScore,
          awayScore: draft.awayScore,
          // Only send concurrency token when we have a server version
          ...(previousUpdatedAt ? { expectedUpdatedAt: previousUpdatedAt } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setDraftOverrides((prev) => {
        const next = { ...prev };
        delete next[match.id];
        return next;
      });
      setSuccess("Pick guardado.");
      await poll();
      return true;
    } catch (e) {
      setDraftOverrides((prev) => ({
        ...prev,
        [match.id]: {
          homeScore: draft.homeScore,
          awayScore: draft.awayScore,
          dirty: true,
          saved: false,
          updatedAt: previousUpdatedAt,
        },
      }));
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
      setSuccess("");
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function saveAllDirty() {
    if (!viewer) {
      setShowAuth(true);
      return;
    }
    const ids = [...dirtyMatchIds];
    if (ids.length === 0) {
      setSuccess("Nada pendiente.");
      return;
    }
    setError("");
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      const match = matches.find((m) => m.id === id);
      if (!match) continue;
      const saved = await saveMatch(match);
      if (saved) ok += 1;
      else fail += 1;
    }
    if (fail === 0) setSuccess(`Guardados ${ok} picks.`);
    else setError(`Guardados ${ok}, fallaron ${fail}.`);
  }

  return {
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
    myPredictions,
    publicPredictions,
    leaderboard,
    dirtyMatchIds,
    saveAllDirty,
    viewMode,
    setViewMode,
    nowMs: effectiveNow,
    isLoading,
    savingId,
    error,
    success,
    drafts,
    load,
    updateDraft,
    saveMatch,
    login,
    logout,
  };
}
