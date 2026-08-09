import type { Draft, ScoreMatch } from "./types";
import { REQUEST_TIMEOUT_MS } from "./constants";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function emptyDraft(): Draft {
  return { homeScore: 0, awayScore: 0, dirty: false, saved: false, updatedAt: null };
}

export function kickoffMs(match: ScoreMatch) {
  const t = new Date(match.startsAt || match.kickoffAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

export function matchStatus(match: ScoreMatch) {
  return match.status || match.liveStatus;
}

export function isMatchLive(match: ScoreMatch) {
  const s = matchStatus(match);
  return s === "live" || s === "halftime";
}

export function isMatchFinished(match: ScoreMatch) {
  const s = matchStatus(match);
  return s === "finished" || s === "fulltime" || s === "cancelled";
}

export function isMatchClosed(match: ScoreMatch, nowMs: number) {
  if (match.forceClosed || match.closed) return true;
  if (isMatchFinished(match)) return true;
  if (matchStatus(match) === "postponed") return false;
  const close = new Date(match.predictionClosesAt || match.startsAt || match.kickoffAt).getTime();
  return Number.isFinite(close) && close <= nowMs;
}

export function formatKickoff(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function liveLabel(status: ScoreMatch["liveStatus"] | ScoreMatch["status"]) {
  if (status === "live") return "EN VIVO";
  if (status === "halftime") return "ENTRE";
  if (status === "finished" || status === "fulltime") return "FINAL";
  if (status === "postponed") return "POSPUESTO";
  if (status === "cancelled") return "CANCELADO";
  return "PROGRAMADO";
}

export function displayScore(match: ScoreMatch) {
  if (isMatchLive(match)) {
    return `${match.homeLiveScore ?? 0} - ${match.awayLiveScore ?? 0}`;
  }
  if (match.homeScore != null && match.awayScore != null) {
    return `${match.homeScore} - ${match.awayScore}`;
  }
  return "vs";
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal, credentials: "same-origin" });
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Countdown until prediction closes / kickoff. */
export function formatCountdown(targetIso: string, nowMs: number) {
  const t = new Date(targetIso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = t - nowMs;
  if (diff <= 0) return "Cerrado";
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
