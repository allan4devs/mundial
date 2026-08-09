import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UFC_API_URL, EMPTY_DRAFTS, STORAGE_KEY } from "./constants";
import { useInterval } from "@/lib/hooks/useInterval";
import type {
  UfcDraft,
  UfcFight,
  UfcLeaderboardEntry,
  UfcPlayerProgress,
  UfcPrediction,
  UfcPredictionsResponse,
  UfcViewMode,
} from "./types";
import {
  computeLeaderboard,
  emptyDraft,
  fetchWithTimeout,
  isFightClosed,
  normalizeKey,
  normalizeName,
  scheduledMs,
} from "./utils";

export function useUfc() {
  const [playerName, setPlayerName] = useState("");
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [fights, setFights] = useState<UfcFight[]>([]);
  const [predictions, setPredictions] = useState<UfcPrediction[]>([]);
  const [players, setPlayers] = useState<UfcPlayerProgress[]>([]);
  const [draftOverridesByPlayer, setDraftOverridesByPlayer] = useState<Record<string, Record<string, UfcDraft>>>({});
  const [viewMode, setViewMode] = useState<UfcViewMode>("card");
  const [nowMs, setNowMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pinVerifiedPlayers, setPinVerifiedPlayers] = useState<Set<string>>(new Set());
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "verify">("verify");
  const pinCheckedRef = useRef<Set<string>>(new Set());

  const playerKey = useMemo(() => normalizeKey(playerName), [playerName]);
  const registeredKeys = useMemo(() => new Set(players.map((p) => p.key)), [players]);
  const isAuthenticated = !playerKey || pinVerifiedPlayers.has(playerKey) || !registeredKeys.has(playerKey);

  const orderedFights = useMemo(
    () => [...fights].sort((a, b) => scheduledMs(a) - scheduledMs(b) || a.number - b.number),
    [fights]
  );
  const fightById = useMemo(() => new Map(fights.map((f) => [f.id, f])), [fights]);

  const playerPredictions = useMemo(
    () => predictions.filter((p) => normalizeKey(p.playerName) === playerKey),
    [playerKey, predictions]
  );
  const predictionByFight = useMemo(
    () => new Map(playerPredictions.map((p) => [p.fightId, p])),
    [playerPredictions]
  );

  const baseDrafts = useMemo(() => {
    const next: Record<string, UfcDraft> = {};
    for (const fight of fights) {
      const prediction = predictionByFight.get(fight.id);
      const closed = isFightClosed(fight, nowMs);
      if (prediction) {
        next[fight.id] = {
          cornerPick: prediction.cornerPick,
          methodPick: prediction.methodPick,
          locked: prediction.locked || closed,
          dirty: false,
          saved: true,
          updatedAt: prediction.updatedAt,
        };
      }
    }
    return next;
  }, [fights, nowMs, predictionByFight]);

  const playerDraftOverrides = useMemo(
    () => draftOverridesByPlayer[playerKey] ?? EMPTY_DRAFTS,
    [draftOverridesByPlayer, playerKey]
  );

  const drafts = useMemo(() => {
    const merged: Record<string, UfcDraft> = { ...baseDrafts };
    for (const [fightId, draft] of Object.entries(playerDraftOverrides)) {
      const fight = fightById.get(fightId);
      const closed = fight ? isFightClosed(fight, nowMs) : false;
      const base = baseDrafts[fightId] ?? emptyDraft();
      merged[fightId] = {
        ...base,
        ...draft,
        dirty: closed ? false : draft.dirty,
        locked: closed || base.locked || draft.locked,
      };
    }
    return merged;
  }, [baseDrafts, fightById, nowMs, playerDraftOverrides]);

  const dirtyDrafts = useMemo(() => {
    return Object.entries(drafts).filter(([fightId, draft]) => {
      const fight = fightById.get(fightId);
      return draft.dirty && !draft.locked && fight && !isFightClosed(fight, nowMs);
    });
  }, [drafts, fightById, nowMs]);

  const savedCount = playerPredictions.length;
  const lockedCount = playerPredictions.filter((p) => {
    const fight = fightById.get(p.fightId);
    return fight ? isFightClosed(fight, nowMs) : p.locked;
  }).length;

  const leaderboard = useMemo<UfcLeaderboardEntry[]>(
    () => computeLeaderboard(fights, predictions),
    [fights, predictions]
  );

  async function readQuiniela() {
    const response = await fetchWithTimeout(UFC_API_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo cargar la quiniela.");
    return (await response.json()) as UfcPredictionsResponse;
  }

  const loadQuiniela = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await readQuiniela();
      setFights(data.fights ?? []);
      setPredictions(data.predictions ?? []);
      setPlayers(data.players ?? []);
    } catch (err) {
      console.error(err);
      setError("No pude cargar los datos en este momento.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollPredictions = useCallback(async () => {
    try {
      const data = await readQuiniela();
      setFights(data.fights ?? []);
      setPredictions(data.predictions ?? []);
      setPlayers(data.players ?? []);
    } catch {
      // silently ignore poll failures
    }
  }, []);

  useInterval(pollPredictions, 30_000);

  useEffect(() => {
    const storedPlayerName = window.localStorage.getItem(STORAGE_KEY) ?? "";
    setPlayerName(storedPlayerName);
    setShowPlayerPicker(!storedPlayerName);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadQuiniela(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadQuiniela]);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const trimmed = normalizeName(playerName);
    if (trimmed) window.localStorage.setItem(STORAGE_KEY, trimmed);
  }, [playerName]);

  // PIN check
  useEffect(() => {
    if (isLoading || !playerName || registeredKeys.size === 0) return;
    const key = normalizeKey(normalizeName(playerName));
    if (pinVerifiedPlayers.has(key)) return;
    if (pinCheckedRef.current.has(key)) return;
    if (!registeredKeys.has(key)) {
      setPinVerifiedPlayers((prev) => { const next = new Set(prev); next.add(key); return next; });
      return;
    }
    pinCheckedRef.current.add(key);
    void (async () => {
      try {
        const r = await fetch(`/api/ufc/pin?playerName=${encodeURIComponent(playerName)}`);
        const data = (await r.json()) as { hasPinSet: boolean };
        setPinMode(data.hasPinSet ? "verify" : "set");
        setShowPinModal(true);
      } catch {
        setPinVerifiedPlayers((prev) => { const next = new Set(prev); next.add(key); return next; });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, playerName, registeredKeys]);

  function getDraft(fightId: string) {
    return drafts[fightId] ?? emptyDraft();
  }

  function canEditFight(fight: UfcFight) {
    return !isFightClosed(fight, nowMs);
  }

  function updateDraft(fightId: string, patch: Partial<UfcDraft>) {
    setError("");
    setSuccess("");
    setDraftOverridesByPlayer((current) => {
      const fight = fightById.get(fightId);
      if (!fight || !canEditFight(fight)) return current;
      const playerDrafts = current[playerKey] ?? {};
      const existing = drafts[fightId] ?? emptyDraft();
      return {
        ...current,
        [playerKey]: {
          ...playerDrafts,
          [fightId]: { ...existing, ...patch, dirty: true, locked: false },
        },
      };
    });
  }

  function buildPayload(fight: UfcFight) {
    const draft = getDraft(fight.id);
    return {
      fightId: fight.id,
      playerName: normalizeName(playerName),
      cornerPick: draft.cornerPick,
      methodPick: draft.methodPick,
      locked: false,
    };
  }

  async function postPredictions(payload: unknown) {
    const response = await fetchWithTimeout(UFC_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? "No se pudo guardar.");
    return data as { predictions: UfcPrediction[] };
  }

  function mergeSaved(saved: UfcPrediction[]) {
    const savedFightIds = new Set(saved.map((p) => p.fightId));
    setPredictions((current) => {
      const savedIds = new Set(saved.map((p) => p.id));
      const savedKeys = new Set(saved.map((p) => `${p.fightId}:${normalizeKey(p.playerName)}`));
      const without = current.filter(
        (p) => !savedIds.has(p.id) && !savedKeys.has(`${p.fightId}:${normalizeKey(p.playerName)}`)
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
        Object.entries(playerDrafts).filter(([fightId]) => !savedFightIds.has(fightId))
      );
      return { ...current, [playerKey]: next };
    });
  }

  function onPinSuccess() {
    const key = normalizeKey(normalizeName(playerName));
    setPinVerifiedPlayers((prev) => { const next = new Set(prev); next.add(key); return next; });
    setShowPinModal(false);
  }

  async function saveFight(fight: UfcFight) {
    const trimmed = normalizeName(playerName);
    if (!trimmed) { setError("Pone tu nombre antes de guardar."); return; }
    if (!isAuthenticated) { setError("Verificá tu PIN antes de guardar."); return; }
    const draft = getDraft(fight.id);
    if (!draft.cornerPick) { setError("Elegí una esquina antes de guardar."); return; }
    if (!canEditFight(fight)) { setError("Esa pelea ya cerró."); return; }

    setSavingId(fight.id);
    setError("");
    setSuccess("");
    try {
      const data = await postPredictions(buildPayload(fight));
      mergeSaved(data.predictions);
      setPlayerName(trimmed);
      setSuccess(`Pick guardado: ${fight.redCorner} vs ${fight.blueCorner}.`);
      void loadQuiniela();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No pude guardar.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveDirtyDrafts() {
    const trimmed = normalizeName(playerName);
    if (!trimmed) { setError("Pone tu nombre antes de guardar."); return; }
    if (!isAuthenticated) { setError("Verificá tu PIN antes de guardar."); return; }

    const dirtyFights = dirtyDrafts
      .map(([fightId]) => fightById.get(fightId))
      .filter((f): f is UfcFight => Boolean(f));

    const noPickFight = dirtyFights.find((f) => !getDraft(f.id).cornerPick);
    if (noPickFight) { setError(`Elegí una esquina para ${noPickFight.redCorner} vs ${noPickFight.blueCorner}.`); return; }
    if (!dirtyFights.length) { setSuccess("No hay cambios pendientes."); return; }

    setIsSavingBulk(true);
    setError("");
    setSuccess("");
    try {
      const data = await postPredictions({
        playerName: trimmed,
        predictions: dirtyFights.map(buildPayload),
      });
      mergeSaved(data.predictions);
      setPlayerName(trimmed);
      setSuccess(`${data.predictions.length} pick${data.predictions.length !== 1 ? "s" : ""} guardado${data.predictions.length !== 1 ? "s" : ""}.`);
      void loadQuiniela();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No pude guardar.");
    } finally {
      setIsSavingBulk(false);
    }
  }

  return {
    playerName,
    setPlayerName,
    showPlayerPicker,
    setShowPlayerPicker,
    showPinModal,
    pinMode,
    isAuthenticated,
    onPinSuccess,
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
  };
}
