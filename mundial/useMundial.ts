import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, EMPTY_DRAFTS, SESSION_KEY, SESSION_TTL_MS, STORAGE_KEY, TOTAL_MATCHES, TRUSTED_PLAYER_KEY } from "./constants";
import type { Draft, LeaderboardEntry, MundialMatch, PlayerProgress, Prediction, PredictionsResponse, ViewMode } from "./types";
import { useInterval } from "@/lib/hooks/useInterval";
import {
  autoLiveMinute,
  autoLiveStatus,
  buildTeamResolver,
  emptyDraft,
  fetchWithTimeout,
  formatCountdown,
  isMatchAutoLive,
  isMatchClosed,
  isMatchLive,
  kickoffMs,
  normalizeKey,
  normalizeName,
} from "./utils";
import { computePredictionResult } from "@/lib/mundial/prediction-scoring";

const LIVE_REFRESH_MS = 12_000;        // SSE handles real-time scores; polling only detects state changes
const LIVE_ACTIVE_REFRESH_MS = 8_000;  // idem during active match
const ATTENTION_REFRESH_MIN_MS = 1_000;
const CROSS_TAB_SYNC_KEY = "mundial-sync-version";

export function useMundial() {
  const [playerName, setPlayerName] = useState("");
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [playerPickerRequired, setPlayerPickerRequired] = useState(false);
  const [trustedPlayerKey, setTrustedPlayerKey] = useState("");
  const [matches, setMatches] = useState<MundialMatch[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [players, setPlayers] = useState<PlayerProgress[]>([]);
  const [serverLeaderboard, setServerLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [draftOverridesByPlayer, setDraftOverridesByPlayer] = useState<Record<string, Record<string, Draft>>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("next");
  const [nowMs, setNowMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pinVerifiedPlayers, setPinVerifiedPlayers] = useState<Set<string>>(new Set());
  const [showPinModal, setShowPinModal] = useState(false);
  const pinCheckedRef = useRef<Set<string>>(new Set());
  const playerNameRef = useRef("");
  const dataVersionRef = useRef(0);
  const lastRefreshAtRef = useRef(0);

  const playerKey = useMemo(() => normalizeKey(playerName), [playerName]);
  const registeredNames = useMemo(() => players.map((p) => p.playerName).sort(), [players]);
  const registeredKeys = useMemo(() => new Set(players.map((p) => p.key)), [players]);
  const isAuthenticated = !playerKey || pinVerifiedPlayers.has(playerKey) || !registeredKeys.has(playerKey);

  // Resolve knockout-stage placeholder names ("1ro Grupo C" → actual team) based on group standings
  const teamResolver = useMemo(() => buildTeamResolver(matches), [matches]);
  const resolvedMatches = useMemo(
    () => matches.map((m) => ({
      ...m,
      homeTeam: teamResolver(m.homeTeam),
      awayTeam: teamResolver(m.awayTeam),
    })),
    [matches, teamResolver]
  );

  const orderedMatches = useMemo(
    () => [...resolvedMatches].sort((a, b) => kickoffMs(a) - kickoffMs(b) || a.number - b.number),
    [resolvedMatches]
  );
  const matchById = useMemo(() => new Map(resolvedMatches.map((m) => [m.id, m])), [resolvedMatches]);
  const activeMatch = useMemo(
    () => orderedMatches.find((m) => !isMatchClosed(m, nowMs)) ?? null,
    [nowMs, orderedMatches]
  );
  const liveMatch = useMemo(() => {
    // Search in reverse order so the most recently started match wins when multiple are "live"
    const reversed = [...orderedMatches].reverse();
    const raw = reversed.find((m) => isMatchLive(m) || isMatchAutoLive(m, nowMs)) ?? null;
    if (!raw || !isMatchAutoLive(raw, nowMs)) return raw;
    return {
      ...raw,
      liveStatus: autoLiveStatus(raw, nowMs),
      liveMinute: raw.liveMinute ?? autoLiveMinute(raw, nowMs),
    };
  }, [orderedMatches, nowMs]);
  const activeMatchId = activeMatch?.id ?? null;
  const todayEditableMatches = useMemo(
    () => orderedMatches.filter((m) => !isMatchClosed(m, nowMs)),
    [orderedMatches, nowMs]
  );
  const todayEditableMatchIds = useMemo(
    () => new Set(todayEditableMatches.map((m) => m.id)),
    [todayEditableMatches]
  );
  const nextMatches = useMemo(() => {
    const activeIndex = activeMatch ? orderedMatches.findIndex((m) => m.id === activeMatch.id) : -1;
    const startIndex = activeIndex >= 0 ? activeIndex + 1 : 0;
    return orderedMatches.slice(startIndex).filter((m) => !isMatchClosed(m, nowMs)).slice(0, 4);
  }, [activeMatch, nowMs, orderedMatches]);
  const recentClosedMatches = useMemo(
    () => [...orderedMatches].reverse().filter((m) => isMatchClosed(m, nowMs)),
    [nowMs, orderedMatches]
  );
  const slideMatches = useMemo(() => {
    const recent = recentClosedMatches.slice(0, 1);
    const active = activeMatch ? [activeMatch] : [];
    return [...recent, ...active, ...nextMatches.slice(0, 3)];
  }, [activeMatch, nextMatches, recentClosedMatches]);
  const playerPredictions = useMemo(
    () => predictions.filter((p) => normalizeKey(p.playerName) === playerKey),
    [playerKey, predictions]
  );
  const predictionByMatch = useMemo(
    () => new Map(playerPredictions.map((p) => [p.matchId, p])),
    [playerPredictions]
  );
  const baseDrafts = useMemo(() => {
    const next: Record<string, Draft> = {};
    for (const match of resolvedMatches) {
      const prediction = predictionByMatch.get(match.id);
      const closed = isMatchClosed(match, nowMs);
      if (prediction) {
        next[match.id] = {
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
          winnerPick: prediction.winnerPick,
          winnerPickMethod: prediction.winnerPickMethod,
          locked: prediction.locked || closed,
          dirty: false,
          saved: true,
          updatedAt: prediction.updatedAt,
        };
      }
    }
    return next;
  }, [resolvedMatches, nowMs, predictionByMatch]);
  const playerDraftOverrides = useMemo(
    () => draftOverridesByPlayer[playerKey] ?? EMPTY_DRAFTS,
    [draftOverridesByPlayer, playerKey]
  );
  const drafts = useMemo(() => {
    const merged: Record<string, Draft> = { ...baseDrafts };
    for (const [matchId, draft] of Object.entries(playerDraftOverrides)) {
      const match = matchById.get(matchId);
      const closed = match ? isMatchClosed(match, nowMs) : false;
      const base = baseDrafts[matchId] ?? emptyDraft();
      merged[matchId] = {
        ...base,
        ...draft,
        dirty: closed ? false : draft.dirty,
        locked: closed || base.locked || draft.locked,
      };
    }
    return merged;
  }, [baseDrafts, matchById, nowMs, playerDraftOverrides]);
  const dirtyDrafts = useMemo(() => {
    return Object.entries(drafts).filter(
      ([matchId, draft]) => draft.dirty && !draft.locked && todayEditableMatchIds.has(matchId)
    );
  }, [todayEditableMatchIds, drafts]);
  const savedCount = playerPredictions.length;
  const lockedCount = playerPredictions.filter((p) => {
    const match = matchById.get(p.matchId);
    return match ? isMatchClosed(match, nowMs) : p.locked;
  }).length;
  const closedMatchCount = orderedMatches.filter((m) => isMatchClosed(m, nowMs)).length;
  const completionPct = Math.round((savedCount / TOTAL_MATCHES) * 100);
  const lockedPct = Math.round((lockedCount / TOTAL_MATCHES) * 100);
  const activeCountdown =
    activeMatch && nowMs > 0 ? formatCountdown(kickoffMs(activeMatch) - nowMs) : "Calculando";
  const mineMatches = useMemo(() => {
    return orderedMatches.filter((m) => {
      const draft = drafts[m.id];
      return !isMatchClosed(m, nowMs) || draft?.saved || draft?.dirty;
    });
  }, [drafts, nowMs, orderedMatches]);

  const computedLeaderboard = useMemo<LeaderboardEntry[]>(() => {
    const playerMap = new Map<string, LeaderboardEntry>();

    for (const pred of predictions) {
      const key = normalizeKey(pred.playerName);
      if (!playerMap.has(key)) {
        playerMap.set(key, {
          playerName: pred.playerName,
          normalizedName: key,
          totalPoints: 0,
          totalPredictions: 0,
          scoredPredictions: 0,
          exactScores: 0,
          correctOutcomes: 0,
        });
      }
      const entry = playerMap.get(key)!;
      entry.totalPredictions++;

      const match = matchById.get(pred.matchId);
      if (match && match.homeFinalScore !== null && match.awayFinalScore !== null) {
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
          { homeScore: pred.homeScore, awayScore: pred.awayScore, winnerPick: pred.winnerPick, winnerPickMethod: pred.winnerPickMethod },
        );
        entry.scoredPredictions++;
        entry.totalPoints += result.points;
        if (result.exactScore) entry.exactScores++;
        if (result.correctOutcome) entry.correctOutcomes++;
      }
    }

    return [...playerMap.values()].sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        b.correctOutcomes - a.correctOutcomes ||
        a.playerName.localeCompare(b.playerName)
    );
  }, [predictions, matchById]);
  const leaderboard = serverLeaderboard.length ? serverLeaderboard : computedLeaderboard;

  async function readQuiniela(name: string) {
    const trimmed = normalizeName(name);
    const url = trimmed ? `${API_URL}?playerName=${encodeURIComponent(trimmed)}` : API_URL;
    const response = await fetchWithTimeout(url, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar la quiniela.");
    return (await response.json()) as PredictionsResponse;
  }

  const applyQuinielaData = useCallback((data: PredictionsResponse) => {
    setMatches(data.matches ?? []);
    setPredictions(data.predictions ?? []);
    setPlayers(data.players ?? []);
    setServerLeaderboard(data.leaderboard ?? []);
  }, []);

  const refreshQuiniela = useCallback(async ({
    showLoading = false,
    minIntervalMs = 0,
    suppressErrors = !showLoading,
  }: {
    showLoading?: boolean;
    minIntervalMs?: number;
    suppressErrors?: boolean;
  } = {}) => {
    const now = Date.now();
    if (minIntervalMs > 0 && now - lastRefreshAtRef.current < minIntervalMs) return;

    const requestPlayerName = normalizeName(playerNameRef.current);
    const requestVersion = dataVersionRef.current;
    lastRefreshAtRef.current = now;

    if (showLoading) {
      setIsLoading(true);
      setError("");
    }

    try {
      const data = await readQuiniela(requestPlayerName);
      const stillSamePlayer = normalizeName(playerNameRef.current) === requestPlayerName;
      const stillSameVersion = dataVersionRef.current === requestVersion;
      if (!stillSamePlayer || !stillSameVersion) return;
      applyQuinielaData(data);
    } catch (err) {
      if (!suppressErrors) {
        console.error(err);
        setError("No pude cargar Mongo en este momento.");
      }
    } finally {
      const stillSamePlayer = normalizeName(playerNameRef.current) === requestPlayerName;
      const stillSameVersion = dataVersionRef.current === requestVersion;
      if (showLoading && stillSamePlayer && stillSameVersion) setIsLoading(false);
    }
  }, [applyQuinielaData]);

  const loadQuiniela = useCallback(async () => {
    await refreshQuiniela({ showLoading: true, suppressErrors: false });
  }, [refreshQuiniela]);

  const pollPredictions = useCallback(async () => {
    await refreshQuiniela({ suppressErrors: true });
  }, [refreshQuiniela]);

  const pollInterval = useMemo(() => {
    if (savingId || isSavingBulk) return null;
    return liveMatch ? LIVE_ACTIVE_REFRESH_MS : LIVE_REFRESH_MS;
  }, [savingId, isSavingBulk, liveMatch]);
  useInterval(pollPredictions, pollInterval);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      // Check time-limited PIN session first.
      try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { playerName?: string; expiresAt?: number };
          if (typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now()) {
            const sessionName = normalizeName(parsed.playerName ?? "");
            if (sessionName) {
              const sessionKey = normalizeKey(sessionName);
              setPlayerName(sessionName);
              setTrustedPlayerKey(sessionKey);
              setPlayerPickerRequired(false);
              setShowPlayerPicker(false);
              // PIN check effect will read localStorage directly and skip the modal
              return;
            }
          }
        }
      } catch {}

      // Fallback: use the last player seen on this browser and let the PIN
      // effect verify if needed. This avoids sending returning users back to
      // the player list on their own device.
      const storedPlayerName = normalizeName(window.localStorage.getItem(STORAGE_KEY) ?? "");
      const storedTrustedKey = window.localStorage.getItem(TRUSTED_PLAYER_KEY) ?? "";
      const storedPlayerKey = normalizeKey(storedPlayerName);
      const hasStoredPlayer = Boolean(storedPlayerName);

      setPlayerName(storedPlayerName);
      setTrustedPlayerKey(storedTrustedKey || storedPlayerKey);
      setPlayerPickerRequired(!hasStoredPlayer);
      setShowPlayerPicker(!hasStoredPlayer);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadQuiniela(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadQuiniela, playerName]);

  // Check ban status whenever playerName changes
  useEffect(() => {
    const trimmed = normalizeName(playerName);
    if (!trimmed) return;
    const normalizedName = normalizeKey(trimmed);
    const visitorId = window.localStorage.getItem("penalitos-vid") ?? "";
    const p = new URLSearchParams({ playerName: normalizedName });
    if (visitorId) p.set("visitorId", visitorId);
    fetch(`/api/mundial/ban/status?${p}`)
      .then((r) => r.json() as Promise<{ banned?: boolean; reason?: string }>)
      .then((data) => {
        if (data.banned) { setIsBanned(true); setBanReason(data.reason ?? null); }
        else { setIsBanned(false); setBanReason(null); }
      })
      .catch(() => { /* ignore network errors */ });
  }, [playerName]);

  useEffect(() => {
    function refreshWhenActive() {
      if (document.visibilityState !== "visible") return;
      void refreshQuiniela({ minIntervalMs: ATTENTION_REFRESH_MIN_MS, suppressErrors: true });
    }

    function refreshFromAnotherTab(event: StorageEvent) {
      if (event.key === CROSS_TAB_SYNC_KEY) void refreshQuiniela({ suppressErrors: true });
    }

    window.addEventListener("focus", refreshWhenActive);
    window.addEventListener("online", refreshWhenActive);
    window.addEventListener("storage", refreshFromAnotherTab);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      window.removeEventListener("focus", refreshWhenActive);
      window.removeEventListener("online", refreshWhenActive);
      window.removeEventListener("storage", refreshFromAnotherTab);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [refreshQuiniela]);

  useEffect(() => {
    void refreshQuiniela({ minIntervalMs: ATTENTION_REFRESH_MIN_MS, suppressErrors: true });
  }, [refreshQuiniela, viewMode]);

  useEffect(() => {
    const tick = () => queueMicrotask(() => setNowMs(Date.now()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const trimmed = normalizeName(playerName);
    if (trimmed) window.localStorage.setItem(STORAGE_KEY, trimmed);
  }, [playerName]);

  useEffect(() => {
    if (isLoading || showPlayerPicker || !playerName) return;
    const key = normalizeKey(normalizeName(playerName));
    if (pinVerifiedPlayers.has(key)) return;
    if (pinCheckedRef.current.has(key)) return;

    // Read localStorage directly — avoids React state timing issues
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { playerName?: string; expiresAt?: number };
        if (
          typeof parsed.expiresAt === "number" &&
          parsed.expiresAt > Date.now() &&
          normalizeKey(normalizeName(parsed.playerName ?? "")) === key
        ) {
          pinCheckedRef.current.add(key);
          setPinVerifiedPlayers((prev) => { const next = new Set(prev); next.add(key); return next; });
          return;
        }
      }
    } catch {}

    // No valid browser session — the PIN modal resolves the account by cédula.
    pinCheckedRef.current.add(key);
    setShowPinModal(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, playerName, showPlayerPicker]);

  function rememberTrustedPlayer(name: string) {
    const key = normalizeKey(name);
    if (!key) return;
    window.localStorage.setItem(TRUSTED_PLAYER_KEY, key);
    setTrustedPlayerKey(key);
  }

  function storeSession(name: string) {
    const trimmed = normalizeName(name);
    if (!trimmed) return;
    window.localStorage.setItem(STORAGE_KEY, trimmed);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({
      playerName: trimmed,
      expiresAt: Date.now() + SESSION_TTL_MS,
    }));
  }

  function selectPlayer(name: string) {
    const trimmed = normalizeName(name);
    if (!trimmed) return;
    const key = normalizeKey(trimmed);

    setError("");
    setSuccess("");
    playerNameRef.current = trimmed;
    dataVersionRef.current += 1;
    setPredictions([]);
    setPlayerName(trimmed);
    setTrustedPlayerKey(key);
    setPlayerPickerRequired(false);
    setShowPlayerPicker(false);
    setShowPinModal(false);
    // Clear the pin check so the effect re-runs for this player
    pinCheckedRef.current.delete(key);
    // Don't store session here — session is only written after PIN passes
  }

  function openPlayerPicker() {
    const key = normalizeKey(normalizeName(playerName));
    if (key) pinCheckedRef.current.delete(key);
    setShowPinModal(false);
    setShowPlayerPicker(true);
  }

  function closePlayerPicker() {
    if (playerPickerRequired) return;
    setShowPlayerPicker(false);
  }

  function getDraft(matchId: string) {
    return drafts[matchId] ?? emptyDraft();
  }

  function canEditMatch(match: MundialMatch) {
    return !isMatchClosed(match, nowMs) && todayEditableMatches.some((m) => m.id === match.id);
  }

  function updateDraft(matchId: string, patch: Partial<Draft>) {
    setError("");
    setSuccess("");
    setDraftOverridesByPlayer((current) => {
      const match = matchById.get(matchId);
      if (!match || !canEditMatch(match)) return current;
      const playerDrafts = current[playerKey] ?? {};
      const existing = drafts[matchId] ?? emptyDraft();
      return {
        ...current,
        [playerKey]: {
          ...playerDrafts,
          [matchId]: { ...existing, ...patch, dirty: true, locked: false },
        },
      };
    });
  }

  function buildPayload(match: MundialMatch) {
    const draft = getDraft(match.id);
    return {
      matchId: match.id,
      playerName: normalizeName(playerName),
      homeScore: draft.homeScore,
      awayScore: draft.awayScore,
      winnerPick: draft.winnerPick,
      winnerPickMethod: draft.winnerPickMethod,
      locked: false,
    };
  }

  async function postPredictions(payload: unknown) {
    const response = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? "No se pudo guardar.");
    return data as { predictions: Prediction[] };
  }

  function mergeSaved(saved: Prediction[]) {
    const savedMatchIds = new Set(saved.map((p) => p.matchId));
    setPredictions((current) => {
      const savedIds = new Set(saved.map((p) => p.id));
      const savedKeys = new Set(saved.map((p) => `${p.matchId}:${normalizeKey(p.playerName)}`));
      const without = current.filter(
        (p) => !savedIds.has(p.id) && !savedKeys.has(`${p.matchId}:${normalizeKey(p.playerName)}`)
      );
      return [...saved, ...without].sort((a, b) => {
        const ta = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        const tb = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        return ta - tb;
      });
    });
    setDraftOverridesByPlayer((current) => {
      const playerDrafts = current[playerKey] ?? {};
      const next = Object.fromEntries(
        Object.entries(playerDrafts).filter(([matchId]) => !savedMatchIds.has(matchId))
      );
      return { ...current, [playerKey]: next };
    });
  }

  function validatePrediction(match: MundialMatch) {
    const draft = getDraft(match.id);
    if (match.stage !== "group" && draft.homeScore === draft.awayScore) {
      if (!draft.winnerPick) return "Elegis quien pasa antes de guardar una llave empatada.";
      if (!draft.winnerPickMethod) return "Elegis si pasa en tiempos extra o penales.";
    }
    if (!canEditMatch(match)) return "Ese partido no esta abierto.";
    return "";
  }

  function onPinSuccess() {
    const key = normalizeKey(normalizeName(playerName));
    setPinVerifiedPlayers((prev) => { const next = new Set(prev); next.add(key); return next; });
    setShowPinModal(false);
    storeSession(playerName);
  }

  async function saveMatch(match: MundialMatch) {
    const trimmed = normalizeName(playerName);
    if (!trimmed) { setError("Pone tu nombre antes de guardar."); return; }
    if (!isAuthenticated) { setError("Verificá tu PIN antes de guardar."); return; }
    const validationError = validatePrediction(match);
    if (validationError) { setError(validationError); return; }

    playerNameRef.current = trimmed;
    dataVersionRef.current += 1;
    setSavingId(match.id);
    setError("");
    setSuccess("");
    try {
      const data = await postPredictions(buildPayload(match));
      mergeSaved(data.predictions);
      setPlayerName(trimmed);
      rememberTrustedPlayer(trimmed);
      storeSession(trimmed);
      window.localStorage.setItem(CROSS_TAB_SYNC_KEY, String(Date.now()));
      await refreshQuiniela({ suppressErrors: true });
      setSuccess(`Guardado: ${match.homeTeam} vs ${match.awayTeam}.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No pude guardar en Mongo.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveDirtyDrafts() {
    const trimmed = normalizeName(playerName);
    if (!trimmed) { setError("Pone tu nombre antes de guardar."); return; }
    if (!isAuthenticated) { setError("Verificá tu PIN antes de guardar."); return; }

    const dirtyMatches = dirtyDrafts
      .map(([matchId]) => matchById.get(matchId))
      .filter((m): m is MundialMatch => Boolean(m));
    if (!dirtyMatches.length) { setSuccess("No hay cambios pendientes."); return; }

    const validationError = dirtyMatches.map(validatePrediction).find(Boolean);
    if (validationError) { setError(validationError); return; }

    playerNameRef.current = trimmed;
    dataVersionRef.current += 1;
    setIsSavingBulk(true);
    setError("");
    setSuccess("");
    try {
      const data = await postPredictions({
        playerName: trimmed,
        predictions: dirtyMatches.map(buildPayload),
      });
      mergeSaved(data.predictions);
      setPlayerName(trimmed);
      rememberTrustedPlayer(trimmed);
      storeSession(trimmed);
      window.localStorage.setItem(CROSS_TAB_SYNC_KEY, String(Date.now()));
      await refreshQuiniela({ suppressErrors: true });
      setSuccess(`${data.predictions.length} resultado guardado.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No pude guardar en Mongo.");
    } finally {
      setIsSavingBulk(false);
    }
  }

  return {
    playerName,
    setPlayerName,
    isBanned,
    banReason,
    showPlayerPicker,
    setShowPlayerPicker,
    canClosePlayerPicker: !playerPickerRequired,
    hasTrustedPlayer: trustedPlayerKey === playerKey,
    selectPlayer,
    openPlayerPicker,
    closePlayerPicker,
    showPinModal,
    isAuthenticated,
    onPinSuccess,
    matches: resolvedMatches,
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
    registeredNames,
    activeMatch,
    liveMatch,
    activeMatchId,
    todayEditableMatches,
    todayEditableMatchIds,
    slideMatches,
    recentClosedMatches,
    drafts,
    dirtyDrafts,
    savedCount,
    lockedCount,
    closedMatchCount,
    completionPct,
    lockedPct,
    activeCountdown,
    mineMatches,
    loadQuiniela,
    getDraft,
    updateDraft,
    saveMatch,
    saveDirtyDrafts
  };
}
