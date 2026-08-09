import { REQUEST_TIMEOUT_MS } from "./constants";
import type { CornerPick, MethodPick, UfcDraft, UfcFight, UfcLeaderboardEntry, UfcPrediction } from "./types";

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeKey(value: string) {
  return normalizeName(value).toUpperCase();
}

export function emptyDraft(): UfcDraft {
  return {
    cornerPick: null,
    methodPick: null,
    locked: false,
    dirty: false,
    saved: false,
    updatedAt: null,
  };
}

export function scheduledMs(fight: UfcFight) {
  const t = new Date(fight.scheduledAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

export function isFightClosed(fight: UfcFight, nowMs: number) {
  return fight.closed || (nowMs > 0 && scheduledMs(fight) <= nowMs);
}

export function isFightLive(fight: UfcFight) {
  return fight.liveStatus === "live";
}

export function isFightFinished(fight: UfcFight) {
  return fight.liveStatus === "finished";
}

export function formatScheduled(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Hora por confirmar";
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatCountdown(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "Cerrado";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatUpdatedAt(value: string | null) {
  if (!value) return "Sin guardar";
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function predictionLabel(fight: UfcFight, draft: UfcDraft): string {
  const winner = draft.cornerPick === "red" ? fight.redCorner : draft.cornerPick === "blue" ? fight.blueCorner : null;
  if (!winner) return "Sin pick";
  const method = draft.methodPick === "ko_tko" ? " · KO/TKO" : draft.methodPick === "submission" ? " · Sub" : draft.methodPick === "decision" ? " · Dec." : "";
  return `${winner}${method}`;
}

export function methodLabel(method: MethodPick | string | null) {
  if (method === "ko_tko") return "KO / TKO";
  if (method === "submission") return "Submission";
  if (method === "decision") return "Decision";
  return null;
}

export function cornerLabel(corner: CornerPick): string {
  if (corner === "red") return "Esquina Roja";
  if (corner === "blue") return "Esquina Azul";
  return "—";
}

export function scorePickPoints(fight: UfcFight, prediction: UfcPrediction): number | null {
  if (!fight.winnerCorner) return null;
  const correctWinner = prediction.cornerPick === fight.winnerCorner;
  if (!correctWinner) return 0;
  const correctMethod = fight.method != null && prediction.methodPick === fight.method;
  return correctMethod ? 2 : 1;
}

export function computeLeaderboard(
  fights: UfcFight[],
  predictions: UfcPrediction[]
): UfcLeaderboardEntry[] {
  const fightById = new Map(fights.map((f) => [f.id, f]));
  const playerMap = new Map<string, UfcLeaderboardEntry>();

  for (const pred of predictions) {
    const key = normalizeKey(pred.playerName);
    if (!playerMap.has(key)) {
      playerMap.set(key, {
        playerName: pred.playerName,
        normalizedName: key,
        totalPoints: 0,
        totalPredictions: 0,
        scoredPredictions: 0,
        exactPicks: 0,
        correctWinners: 0,
      });
    }
    const entry = playerMap.get(key)!;
    entry.totalPredictions++;

    const fight = fightById.get(pred.fightId);
    if (fight && fight.winnerCorner) {
      const pts = scorePickPoints(fight, pred);
      if (pts !== null) {
        entry.scoredPredictions++;
        entry.totalPoints += pts;
        if (pts >= 1) entry.correctWinners++;
        if (pts >= 2) entry.exactPicks++;
      }
    }
  }

  return [...playerMap.values()].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.playerName.localeCompare(b.playerName)
  );
}

export function accuracyPct(entry: UfcLeaderboardEntry) {
  return entry.scoredPredictions > 0
    ? Math.round((entry.correctWinners / entry.scoredPredictions) * 100)
    : 0;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
