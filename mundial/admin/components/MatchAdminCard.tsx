"use client";

import { useEffect, useState } from "react";
import { BarChart3, Braces, Check, ChevronDown, ChevronUp, ClipboardPaste, Heart, Loader2, Lock, LockOpen, MessageCircle, Minus, Plus, RefreshCw, Repeat2, Save, Send, Trash2, Tv2, Users } from "lucide-react";
import type { AdminLiveMatchEvent, AdminLiveMatchStats, AdminLiveTeamStats, AdminMatch, AdminRosterPlayer, LiveEventTeam, LiveEventType, LiveMatchStatus, MatchDecisionMethod } from "../adminTypes";
import { cn, formatKickoff } from "../../utils";
import { getCountryFlag } from "../../flags";
import { Flag } from "../../components/Flag";

type MatchAdminCardProps = {
  match: AdminMatch;
  onPatch: (matchId: string, patch: Record<string, unknown>) => Promise<void>;
};

type AdminXPost = {
  id: string;
  text: string;
  createdAt: string | null;
  author: {
    name: string;
    username: string;
    verified: boolean;
  };
  metrics: {
    likes: number;
    reposts: number;
    replies: number;
  };
};

type AdminXPayload = {
  posts: AdminXPost[];
  fetchedAt: string | null;
  error?: string;
};

const LIVE_STATUS_OPTIONS: Array<{ value: LiveMatchStatus; label: string; color: string }> = [
  { value: "scheduled", label: "Prog.", color: "bg-white/10 text-white/70" },
  { value: "live", label: "Live", color: "bg-red-600 text-white" },
  { value: "halftime", label: "Descanso", color: "bg-[#211707] text-white" },
  { value: "fulltime", label: "FT", color: "bg-slate-950 text-white" },
];

const LIVE_EVENT_OPTIONS: Array<{ value: LiveEventType; label: string }> = [
  { value: "goal", label: "Gol" },
  { value: "penalty", label: "Penal" },
  { value: "yellow", label: "Amarilla" },
  { value: "red", label: "Roja" },
  { value: "var", label: "VAR" },
  { value: "substitution", label: "Cambio" },
  { value: "note", label: "Nota" },
];

const DECISION_METHOD_LABELS: Record<MatchDecisionMethod, string> = {
  regular: "Tiempo regular",
  extraTime: "Tiempos extra",
  penalties: "Penales",
};

const LIVE_STATS_FIELDS: Array<{ key: keyof AdminLiveTeamStats; label: string; max?: number; suffix?: string; decimal?: boolean }> = [
  { key: "possessionPct", label: "Posesion", max: 100, suffix: "%" },
  { key: "shots", label: "Tiros (attempts)" },
  { key: "shotsOnTarget", label: "Tiros a marco" },
  { key: "assists", label: "Asistencias" },
  { key: "passesCompleted", label: "Pases completados" },
  { key: "distanceCovered", label: "Distancia km", suffix: "km", decimal: true },
  { key: "topSpeed", label: "Vel. maxima", suffix: "km/h", decimal: true },
  { key: "foulsFor", label: "Faltas recibidas" },
  { key: "yellowCards", label: "Amarillas" },
  { key: "redCards", label: "Rojas" },
  { key: "corners", label: "Corners" },
  { key: "fouls", label: "Faltas cometidas" },
  { key: "saves", label: "Atajadas" },
];

const DECIMAL_STAT_KEYS: ReadonlyArray<keyof AdminLiveTeamStats> = ["distanceCovered", "topSpeed"];

const STAT_JSON_TEMPLATE = {
  home: {
    shots: 0, shotsOnTarget: 0, assists: 0, passesCompleted: 0,
    distanceCovered: 0.0, topSpeed: 0.0, foulsFor: 0, possessionPct: 50,
    yellowCards: 0, redCards: 0, corners: 0, fouls: 0, saves: 0,
  },
  away: {
    shots: 0, shotsOnTarget: 0, assists: 0, passesCompleted: 0,
    distanceCovered: 0.0, topSpeed: 0.0, foulsFor: 0, possessionPct: 50,
    yellowCards: 0, redCards: 0, corners: 0, fouls: 0, saves: 0,
  },
};

function rosterForTeam(match: AdminMatch, team: LiveEventTeam) {
  if (team === "home") return match.homeRoster;
  if (team === "away") return match.awayRoster;
  return [];
}

function teamLabel(match: AdminMatch, team: LiveEventTeam) {
  if (team === "home") return match.homeTeam;
  if (team === "away") return match.awayTeam;
  return "General";
}

function playerOptionLabel(player: AdminRosterPlayer) {
  return [
    player.squadNumber !== null ? `#${player.squadNumber}` : null,
    player.pos || null,
    player.club || null,
    player.caps !== null ? `${player.caps} caps` : null,
    player.goals !== null ? `${player.goals} goles` : null,
  ].filter(Boolean).join(" - ");
}

function safeInc(value: string) {
  const n = Number(value);
  return String(Number.isFinite(n) ? Math.max(0, Math.trunc(n)) + 1 : 1);
}

function safeDec(value: string) {
  const n = Number(value);
  return String(Number.isFinite(n) ? Math.max(0, Math.trunc(n) - 1) : 0);
}

function parseMinuteInput(value: string) {
  if (value === "") return null;
  const minute = Number(value);
  return Number.isFinite(minute) ? Math.max(0, Math.trunc(minute)) : null;
}

function numberDraft(value: number | null | undefined) {
  return typeof value === "number" ? String(value) : "";
}

function scoreOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs)) return "";
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function compactNumber(value: number) {
  if (value <= 0) return "";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function liveEventSignature(event: Pick<AdminLiveMatchEvent, "type" | "team" | "minute" | "player" | "note">) {
  return [
    event.type,
    event.team ?? "general",
    event.minute ?? "",
    event.player.trim().toUpperCase(),
    event.note.trim().toUpperCase(),
  ].join("|");
}

function updateTeamStat(
  stats: AdminLiveMatchStats,
  team: Exclude<LiveEventTeam, null>,
  key: keyof AdminLiveTeamStats,
  value: number | null
): AdminLiveMatchStats {
  return {
    ...stats,
    [team]: {
      ...stats[team],
      [key]: value,
    },
  };
}

function incrementTeamStat(
  stats: AdminLiveMatchStats,
  team: Exclude<LiveEventTeam, null>,
  key: keyof AdminLiveTeamStats
): AdminLiveMatchStats {
  const current = stats[team][key] ?? 0;
  return updateTeamStat(stats, team, key, current + 1);
}

function StatBar({ label, count, total, barColor, textColor }: {
  label: string; count: number; total: number; barColor: string; textColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-[11px] font-black uppercase tracking-wide text-white/40">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("w-8 shrink-0 text-right text-xs font-black tabular-nums", textColor)}>{count}/{total}</span>
      <span className="w-8 shrink-0 text-right text-[11px] font-bold text-white/30">{pct}%</span>
    </div>
  );
}

function ScoreSpinner({ value, onChange, disabled, focusColor = "focus:border-emerald-600 focus:ring-emerald-100" }: {
  value: string; onChange: (v: string) => void; disabled?: boolean; focusColor?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(safeDec(value))}
        disabled={disabled || value === "" || Number(value) <= 0}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-black/35 text-white/65 transition hover:bg-white/10 disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        min={0}
        max={30}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="-"
        disabled={disabled}
        className={cn(
          "h-11 w-14 rounded-lg border border-white/18 bg-black/35 text-center text-2xl font-black tabular-nums text-white outline-none transition focus:ring-4",
          focusColor
        )}
      />
      <button
        type="button"
        onClick={() => onChange(safeInc(value))}
        disabled={disabled}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-black/35 text-white/65 transition hover:bg-white/10 disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function MatchAdminCard({ match, onPatch }: MatchAdminCardProps) {
  const hasResult = match.homeFinalScore !== null && match.awayFinalScore !== null;
  const homeFlag = getCountryFlag(match.homeTeam);
  const awayFlag = getCountryFlag(match.awayTeam);

  const [homeScore, setHomeScore] = useState(match.homeFinalScore !== null ? String(match.homeFinalScore) : "");
  const [awayScore, setAwayScore] = useState(match.awayFinalScore !== null ? String(match.awayFinalScore) : "");
  const [homeRegulationScore, setHomeRegulationScore] = useState(match.homeRegulationScore !== null ? String(match.homeRegulationScore) : "");
  const [awayRegulationScore, setAwayRegulationScore] = useState(match.awayRegulationScore !== null ? String(match.awayRegulationScore) : "");
  const [actualWinner, setActualWinner] = useState<"home" | "away" | "">(match.actualWinner ?? "");
  const [decisionMethod, setDecisionMethod] = useState<MatchDecisionMethod | "">(match.decisionMethod ?? "");
  const [liveStatus, setLiveStatus] = useState<LiveMatchStatus>(match.liveStatus);
  const [liveMinute, setLiveMinute] = useState(match.liveMinute !== null ? String(match.liveMinute) : "");
  const [homeLiveScore, setHomeLiveScore] = useState(match.homeLiveScore !== null ? String(match.homeLiveScore) : "");
  const [awayLiveScore, setAwayLiveScore] = useState(match.awayLiveScore !== null ? String(match.awayLiveScore) : "");
  const [liveNote, setLiveNote] = useState(match.liveNote);
  const [liveEvents, setLiveEvents] = useState<AdminLiveMatchEvent[]>(match.liveEvents);
  const [liveStats, setLiveStats] = useState<AdminLiveMatchStats>(match.liveStats);
  const [draftType, setDraftType] = useState<LiveEventType>("goal");
  const [draftTeam, setDraftTeam] = useState<LiveEventTeam>("home");
  const [draftMinute, setDraftMinute] = useState(match.liveMinute !== null ? String(match.liveMinute) : "");
  const [draftPlayer, setDraftPlayer] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingClose, setIsTogglingClose] = useState(false);
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liveSaved, setLiveSaved] = useState(false);
  const [error, setError] = useState("");
  const [liveError, setLiveError] = useState("");
  const [showEdit, setShowEdit] = useState(!hasResult);
  const [showLive, setShowLive] = useState(match.liveStatus !== "scheduled");
  const [showXFeed, setShowXFeed] = useState(match.liveStatus !== "scheduled");
  const [showStatsJson, setShowStatsJson] = useState(false);
  const [statsJsonText, setStatsJsonText] = useState("");
  const [statsJsonError, setStatsJsonError] = useState("");
  const [xPosts, setXPosts] = useState<AdminXPost[]>([]);
  const [xDraft, setXDraft] = useState("");
  const [isLoadingXPosts, setIsLoadingXPosts] = useState(false);
  const [isPublishingXPost, setIsPublishingXPost] = useState(false);
  const [xFeedError, setXFeedError] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setHomeScore(match.homeFinalScore !== null ? String(match.homeFinalScore) : "");
      setAwayScore(match.awayFinalScore !== null ? String(match.awayFinalScore) : "");
      setHomeRegulationScore(match.homeRegulationScore !== null ? String(match.homeRegulationScore) : "");
      setAwayRegulationScore(match.awayRegulationScore !== null ? String(match.awayRegulationScore) : "");
      setActualWinner(match.actualWinner ?? "");
      setDecisionMethod(match.decisionMethod ?? "");
      setLiveStatus(match.liveStatus);
      setLiveMinute(match.liveMinute !== null ? String(match.liveMinute) : "");
      setHomeLiveScore(match.homeLiveScore !== null ? String(match.homeLiveScore) : "");
      setAwayLiveScore(match.awayLiveScore !== null ? String(match.awayLiveScore) : "");
      setLiveNote(match.liveNote);
      setLiveEvents(match.liveEvents);
      setLiveStats(match.liveStats);
      setDraftMinute(match.liveMinute !== null ? String(match.liveMinute) : "");
      setDraftPlayer("");
      setDraftNote("");
      if (match.liveStatus !== "scheduled") setShowLive(true);
      if (match.liveStatus !== "scheduled") setShowXFeed(true);
    });
  }, [match]);

  useEffect(() => {
    if (!showXFeed) return;
    void loadXFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showXFeed, match.id]);

  const isKnockout = match.stage !== "group";
  const parsedHome = homeScore === "" ? null : Number(homeScore);
  const parsedAway = awayScore === "" ? null : Number(awayScore);
  const isTied = parsedHome !== null && parsedAway !== null && parsedHome === parsedAway;
  const needsRegulationScore = isKnockout && (decisionMethod === "extraTime" || decisionMethod === "penalties");
  const needsWinner = isKnockout && (isTied || needsRegulationScore);
  const isLiveNow = liveStatus === "live";
  const isHalftime = liveStatus === "halftime";
  const homePlayersListId = `players-${match.id}-home`;
  const awayPlayersListId = `players-${match.id}-away`;
  const draftPlayersListId =
    draftTeam === "home" ? homePlayersListId : draftTeam === "away" ? awayPlayersListId : undefined;
  const draftRoster = rosterForTeam(match, draftTeam);

  async function handleSaveScore() {
    setError("");
    setSaved(false);
    const patch: Record<string, unknown> = { homeFinalScore: parsedHome, awayFinalScore: parsedAway };
    if (isKnockout) {
      patch.actualWinner = actualWinner === "home" || actualWinner === "away" ? actualWinner : null;
      patch.decisionMethod = decisionMethod || null;
      patch.homeRegulationScore = needsRegulationScore ? (homeRegulationScore === "" ? null : Number(homeRegulationScore)) : null;
      patch.awayRegulationScore = needsRegulationScore ? (awayRegulationScore === "" ? null : Number(awayRegulationScore)) : null;
    }
    setIsSaving(true);
    try {
      await onPatch(match.id, patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleClose() {
    setError("");
    setIsTogglingClose(true);
    try {
      const isClosing = !match.forceClosed;
      const patch: Record<string, unknown> = { forceClosed: isClosing };
      const liveHome = scoreOrNull(homeLiveScore);
      const liveAway = scoreOrNull(awayLiveScore);

      if (isClosing && liveHome !== null && liveAway !== null) {
        patch.homeFinalScore = liveHome;
        patch.awayFinalScore = liveAway;
        if (isKnockout) {
          patch.actualWinner =
            liveHome > liveAway ? "home" : liveAway > liveHome ? "away" : actualWinner || null;
          patch.decisionMethod = liveHome === liveAway ? decisionMethod || null : decisionMethod || "regular";
          patch.homeRegulationScore = decisionMethod === "extraTime" || decisionMethod === "penalties"
            ? homeRegulationScore === "" ? null : Number(homeRegulationScore)
            : null;
          patch.awayRegulationScore = decisionMethod === "extraTime" || decisionMethod === "penalties"
            ? awayRegulationScore === "" ? null : Number(awayRegulationScore)
            : null;
        }
      }

      await onPatch(match.id, patch);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error.");
    } finally {
      setIsTogglingClose(false);
    }
  }

  async function handleSaveLive() {
    setLiveError("");
    setLiveSaved(false);
    setIsSavingLive(true);
    try {
      await onPatch(match.id, {
        liveStatus,
        liveMinute: liveMinute === "" ? null : Number(liveMinute),
        homeLiveScore: homeLiveScore === "" ? null : Number(homeLiveScore),
        awayLiveScore: awayLiveScore === "" ? null : Number(awayLiveScore),
        liveNote,
        liveEvents,
        liveStats,
      });
      setLiveSaved(true);
      setTimeout(() => setLiveSaved(false), 2500);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : "Error guardando live.");
    } finally {
      setIsSavingLive(false);
    }
  }

  function addLiveEvent(
    type: LiveEventType,
    team: LiveEventTeam = null,
    player = "",
    note = "",
    minuteValue = liveMinute
  ) {
    const nextEvent: AdminLiveMatchEvent = {
      id: `${Date.now()}-${liveEvents.length}`,
      type,
      team,
      minute: parseMinuteInput(minuteValue),
      player: player.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };
    const signature = liveEventSignature(nextEvent);
    if (liveEvents.some((event) => liveEventSignature(event) === signature)) return;

    if ((type === "goal" || type === "penalty") && team === "home") setHomeLiveScore((v) => safeInc(v));
    if ((type === "goal" || type === "penalty") && team === "away") setAwayLiveScore((v) => safeInc(v));
    if ((type === "goal" || type === "penalty") && team) {
      setLiveStats((stats) => incrementTeamStat(incrementTeamStat(stats, team, "shots"), team, "shotsOnTarget"));
    }
    if (type === "yellow" && team) setLiveStats((stats) => incrementTeamStat(stats, team, "yellowCards"));
    if (type === "red" && team) setLiveStats((stats) => incrementTeamStat(stats, team, "redCards"));
    if (liveStatus === "scheduled") setLiveStatus("live");
    setLiveEvents((curr) => [nextEvent, ...curr]);
  }

  function selectEventPreset(type: LiveEventType, team: LiveEventTeam = null) {
    setDraftType(type);
    setDraftTeam(team);
    setDraftMinute(liveMinute);
    setDraftPlayer("");
    setDraftNote("");
  }

  function addDraftEvent() {
    addLiveEvent(draftType, draftTeam, draftPlayer, draftNote, draftMinute);
    setDraftPlayer("");
    setDraftNote("");
  }

  function updateLiveEvent(id: string, patch: Partial<AdminLiveMatchEvent>) {
    setLiveEvents((curr) => curr.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeLiveEvent(id: string) {
    setLiveEvents((curr) => curr.filter((e) => e.id !== id));
  }

  function updateLiveStat(team: Exclude<LiveEventTeam, null>, key: keyof AdminLiveTeamStats, value: string) {
    const parsed = value.trim() === "" ? null : Number(value);
    if (parsed === null || !Number.isFinite(parsed)) {
      setLiveStats((stats) => updateTeamStat(stats, team, key, null));
      return;
    }
    const isDecimal = (DECIMAL_STAT_KEYS as ReadonlyArray<string>).includes(key);
    const max = key === "possessionPct" ? 100 : undefined;
    const normalized = isDecimal
      ? Math.max(0, Math.round(parsed * 10) / 10)
      : Math.max(0, Math.trunc(max ? Math.min(max, parsed) : parsed));
    setLiveStats((stats) => updateTeamStat(stats, team, key, normalized));
  }

  async function loadXFeed() {
    setIsLoadingXPosts(true);
    setXFeedError("");
    try {
      const res = await fetch(`/api/mundial/x-live?matchId=${encodeURIComponent(match.id)}`, { cache: "no-store" });
      const data = (await res.json()) as AdminXPayload;
      if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el feed.");
      setXPosts(data.posts ?? []);
    } catch (err) {
      setXFeedError(err instanceof Error ? err.message : "No se pudo cargar el feed.");
    } finally {
      setIsLoadingXPosts(false);
    }
  }

  async function publishXPost() {
    const text = xDraft.trim();
    if (!text) return;

    setIsPublishingXPost(true);
    setXFeedError("");
    try {
      const res = await fetch("/api/mundial/x-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          text,
          authorName: "Mundial La Vieja",
          authorUsername: "MundialLV",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo publicar.");
      setXDraft("");
      await loadXFeed();
    } catch (err) {
      setXFeedError(err instanceof Error ? err.message : "No se pudo publicar.");
    } finally {
      setIsPublishingXPost(false);
    }
  }

  async function deleteXPost(id: string) {
    setXFeedError("");
    try {
      const res = await fetch("/api/mundial/x-live", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo borrar.");
      setXPosts((posts) => posts.filter((post) => post.id !== id));
    } catch (err) {
      setXFeedError(err instanceof Error ? err.message : "No se pudo borrar.");
    }
  }

  function applyStatsJson() {
    setStatsJsonError("");
    try {
      const parsed = JSON.parse(statsJsonText) as Record<string, unknown>;
      const homeRaw = parsed.home ?? parsed.local ?? parsed.Home;
      const awayRaw = parsed.away ?? parsed.visita ?? parsed.Away;
      if (!homeRaw && !awayRaw) {
        setStatsJsonError('Formato invalido. Usa: { "home": {...}, "away": {...} }');
        return;
      }
      function parseVal(key: keyof AdminLiveTeamStats, val: unknown): number | null {
        if (val === null || val === undefined || val === "") return null;
        const n = Number(val);
        if (!Number.isFinite(n) || n < 0) return null;
        return (DECIMAL_STAT_KEYS as ReadonlyArray<string>).includes(key)
          ? Math.round(n * 10) / 10
          : Math.trunc(n);
      }
      function extractTeam(raw: unknown): AdminLiveTeamStats {
        const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
        return {
          possessionPct: parseVal("possessionPct", r.possessionPct ?? r.possession),
          shots: parseVal("shots", r.shots ?? r.attemptsAtGoal ?? r.attempts),
          shotsOnTarget: parseVal("shotsOnTarget", r.shotsOnTarget ?? r.attemptsOnTarget),
          yellowCards: parseVal("yellowCards", r.yellowCards ?? r.yellow),
          redCards: parseVal("redCards", r.redCards ?? r.red),
          corners: parseVal("corners", r.corners),
          fouls: parseVal("fouls", r.fouls ?? r.foulsCommitted),
          saves: parseVal("saves", r.saves),
          assists: parseVal("assists", r.assists),
          passesCompleted: parseVal("passesCompleted", r.passesCompleted ?? r.passes),
          distanceCovered: parseVal("distanceCovered", r.distanceCovered ?? r.distance),
          topSpeed: parseVal("topSpeed", r.topSpeed ?? r.speed),
          foulsFor: parseVal("foulsFor", r.foulsFor ?? r.foulsDrawn),
        };
      }
      setLiveStats({
        home: homeRaw ? extractTeam(homeRaw) : liveStats.home,
        away: awayRaw ? extractTeam(awayRaw) : liveStats.away,
      });
      setShowStatsJson(false);
      setStatsJsonText("");
    } catch {
      setStatsJsonError("JSON invalido. Revisa la sintaxis.");
    }
  }

  const statusLabel = hasResult
    ? `${match.homeFinalScore}-${match.awayFinalScore}`
    : match.forceClosed ? "Forzado" : match.closed ? "Cerrado" : "Abierto";
  const statusClass = hasResult
    ? "border-[#9dff34]/35 bg-[#10240b] text-[#d5ff3f]"
    : match.forceClosed
      ? "border-white/18 bg-white/10 text-white/65"
      : match.closed
        ? "border-white/12 bg-black/25 text-white/50"
        : "border-[#f0b429]/35 bg-[#211707] text-[#f0b429]";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-[#06140f] shadow-[0_18px_58px_rgba(0,0,0,0.2)]",
        isLiveNow
          ? "border-[#9dff34]/70 ring-2 ring-[#9dff34]/20"
          : isHalftime
            ? "border-[#f0b429]/60 ring-1 ring-[#f0b429]/20"
            : hasResult
              ? "border-white/12"
              : match.forceClosed
                ? "border-white/18"
                : match.closed
                  ? "border-white/12"
                  : "border-[#d5ff3f]/45 ring-1 ring-[#d5ff3f]/15"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg bg-[#f0b429] px-2 py-1 text-xs font-black tabular-nums text-[#06110b]">#{match.number}</span>
            <span className="rounded-lg border border-white/12 bg-black/25 px-2 py-1 text-xs font-black text-white/65">
              {match.group ? `Grupo ${match.group}` : match.stageLabel}
            </span>
            {isLiveNow && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#9dff34]/35 bg-[#10240b] px-2 py-1 text-xs font-black text-[#d5ff3f]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
                EN VIVO{liveMinute ? ` ${liveMinute}'` : ""}
                {homeLiveScore !== "" && awayLiveScore !== "" ? ` - ${homeLiveScore}-${awayLiveScore}` : ""}
              </span>
            )}
            {isHalftime && (
              <span className="rounded-lg border border-[#f0b429]/35 bg-[#211707] px-2 py-1 text-xs font-black text-[#f0b429]">
                DESCANSO{homeLiveScore !== "" && awayLiveScore !== "" ? ` - ${homeLiveScore}-${awayLiveScore}` : ""}
              </span>
            )}
            {match.predictorCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-white/40">
                <Users className="h-3 w-3" />{match.predictorCount}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs font-bold text-white/40">
            {formatKickoff(match.kickoffAt)}{match.venue ? ` - ${match.venue}` : ""}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-lg border px-2.5 py-1 text-xs font-black tabular-nums", statusClass)}>
          {statusLabel}
        </span>
      </div>

      {/* Result panel */}
      {hasResult ? (
        <div className="mx-4 mb-1 overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <Flag team={match.homeTeam} size="lg" />
              <p className="text-center text-[11px] font-black leading-tight text-white/60">{match.homeTeam}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="text-4xl font-black tabular-nums leading-none text-white">
                {match.homeFinalScore} - {match.awayFinalScore}
              </span>
              {match.actualWinner && (
                <span className="mt-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/50">
                  Pasa {match.actualWinner === "home" ? match.homeTeam : match.awayTeam}
                  {match.decisionMethod && match.decisionMethod !== "regular" ? ` - ${DECISION_METHOD_LABELS[match.decisionMethod]}` : ""}
                </span>
              )}
              {match.decisionMethod && match.decisionMethod !== "regular" && match.homeRegulationScore !== null && match.awayRegulationScore !== null && (
                <span className="rounded-md bg-[#d5ff3f]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#d5ff3f]/80">
                  90&apos; {match.homeRegulationScore} - {match.awayRegulationScore}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <Flag team={match.awayTeam} size="lg" />
              <p className="text-center text-[11px] font-black leading-tight text-white/60">{match.awayTeam}</p>
            </div>
          </div>
          {match.predictorCount > 0 && (
            <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-2">
              <StatBar label="Exacto" count={match.exactCount} total={match.predictorCount} barColor="bg-emerald-500" textColor="text-emerald-400" />
              <StatBar label="Resultado" count={match.correctOutcomeCount} total={match.predictorCount} barColor="bg-sky-500" textColor="text-sky-400" />
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-white/30">
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/50">{homeFlag} {match.homeWinPicks}</span>
                <span>-</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/50">Emp {match.drawPicks}</span>
                <span>-</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/50">{awayFlag} {match.awayWinPicks}</span>
              </div>
            </div>
          )}
          {match.predictorCount === 0 && (
            <p className="border-t border-white/10 px-4 py-3 text-xs font-bold text-white/30">Sin predicciones.</p>
          )}
        </div>
      ) : (
        <div className="mx-4 mb-3 flex items-center gap-2">
          <span className="text-xl" aria-hidden>{homeFlag}</span>
          <span className="font-black text-white">{match.homeTeam}</span>
          <span className="font-bold text-white/25">vs</span>
          <span className="font-black text-white">{match.awayTeam}</span>
          <span className="text-xl" aria-hidden>{awayFlag}</span>
        </div>
      )}

      {/* Edit result section */}
      <div className={cn("border-t border-white/10 px-4 pb-4", hasResult ? "pt-0" : "pt-3")}>
        {hasResult && (
          <button
            type="button"
            onClick={() => setShowEdit((v) => !v)}
            className="flex w-full items-center justify-between gap-2 py-3 text-xs font-black text-white/45 transition hover:text-white"
          >
            <span>Editar resultado</span>
            {showEdit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}

        {showEdit && (
          <>
            <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="truncate text-[10px] font-black uppercase text-white/40">{match.homeTeam}</label>
                <ScoreSpinner value={homeScore} onChange={setHomeScore} />
              </div>
              <p className="pb-2 text-center text-xl font-black text-white/25">-</p>
              <div className="flex flex-col items-end gap-1">
                <label className="truncate text-[10px] font-black uppercase text-white/40">{match.awayTeam}</label>
                <ScoreSpinner value={awayScore} onChange={setAwayScore} />
              </div>
            </div>

            {isKnockout && (
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-white/45">
                    {needsWinner ? "Pasa (requerido - empate)" : "Pasa (opcional)"}
                  </span>
                  <select
                    value={actualWinner}
                    onChange={(e) => setActualWinner(e.target.value as "home" | "away" | "")}
                    className={cn("h-10 w-full rounded-lg border bg-black/35 px-3 text-sm font-bold text-white outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100", needsWinner ? "border-amber-400" : "border-white/18")}
                  >
                    <option value="">Sin definir</option>
                    <option value="home">{match.homeTeam}</option>
                    <option value="away">{match.awayTeam}</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase text-white/45">Decision</span>
                  <select
                    value={decisionMethod}
                    onChange={(e) => setDecisionMethod(e.target.value as MatchDecisionMethod | "")}
                    className={cn("h-10 w-full rounded-lg border bg-black/35 px-3 text-sm font-bold text-white outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100", needsWinner ? "border-amber-400" : "border-white/18")}
                  >
                    <option value="">Sin definir</option>
                    <option value="regular">Tiempo regular</option>
                    <option value="extraTime">Tiempos extra</option>
                    <option value="penalties">Penales</option>
                  </select>
                </label>
              </div>
            )}

            {needsRegulationScore && (
              <div className="mb-3 rounded-xl border border-[#d5ff3f]/25 bg-[#10240b]/55 p-3">
                <p className="mb-3 text-xs font-black uppercase text-[#d5ff3f]/80">
                  Marcador 90&apos; para leaderboard
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="truncate text-[10px] font-black uppercase text-white/40">{match.homeTeam}</label>
                    <ScoreSpinner value={homeRegulationScore} onChange={setHomeRegulationScore} />
                  </div>
                  <p className="pb-2 text-center text-xl font-black text-white/25">-</p>
                  <div className="flex flex-col items-end gap-1">
                    <label className="truncate text-[10px] font-black uppercase text-white/40">{match.awayTeam}</label>
                    <ScoreSpinner value={awayRegulationScore} onChange={setAwayRegulationScore} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="mb-3 rounded-lg border border-[#ff6a3d]/50 bg-[#35130d] px-3 py-2 text-xs font-bold text-[#ffd2c2]">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleSaveScore()}
                disabled={isSaving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#d5ff3f]/60 bg-[#d5ff3f] text-[#06110b] px-3 py-2.5 text-sm font-black text-[#06110b] transition hover:bg-[#efff9a] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Guardado" : "Guardar resultado"}
              </button>
              <button
                type="button"
                onClick={() => void handleToggleClose()}
                disabled={isTogglingClose}
                title={match.forceClosed ? "Reabrir partido" : "Forzar cierre"}
                className={cn("inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-black transition disabled:opacity-50", match.forceClosed ? "border-[#9dff34]/35 bg-[#10240b] text-[#d5ff3f] hover:bg-[#12351f]" : "border-white/18 bg-white/5 text-white/65 hover:bg-[#12351f]")}
              >
                {isTogglingClose ? <Loader2 className="h-4 w-4 animate-spin" /> : match.forceClosed ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}

        {hasResult && !showEdit && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleToggleClose()}
              disabled={isTogglingClose}
              className={cn("inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition disabled:opacity-50", match.forceClosed ? "border-[#9dff34]/35 bg-[#10240b] text-[#d5ff3f] hover:bg-[#12351f]" : "border-white/18 bg-white/5 text-white/65 hover:bg-[#12351f]")}
            >
              {isTogglingClose ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : match.forceClosed ? <LockOpen className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {match.forceClosed ? "Reabrir" : "Forzar cierre"}
            </button>
          </div>
        )}
        {hasResult && !showEdit && error && (
          <p className="mt-2 rounded-lg border border-[#ff6a3d]/50 bg-[#35130d] px-3 py-2 text-xs font-bold text-[#ffd2c2]">{error}</p>
        )}
      </div>

      <div className="border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowXFeed((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-black text-white/45 transition hover:text-white"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded-sm bg-white text-[10px] font-black text-black">X</span>
            <span>Noticias X</span>
            {xPosts.length > 0 && (
              <span className="rounded bg-[#1d9bf0]/15 px-1.5 py-0.5 text-[10px] font-black text-[#8ecdf8]">
                {xPosts.length}
              </span>
            )}
          </div>
          {showXFeed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showXFeed && (
          <div className="space-y-3 px-3 pb-4 pt-2 min-[380px]:px-4">
            <div className="overflow-hidden rounded-xl border border-[#2f3336] bg-black text-white">
              <div className="border-b border-[#2f3336] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">Postear noticia</p>
                    <p className="truncate text-[11px] font-bold text-[#71767b]">
                      {match.homeTeam} vs {match.awayTeam}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadXFeed()}
                    disabled={isLoadingXPosts}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#e7e9ea] transition hover:bg-[#181818] disabled:opacity-40"
                    aria-label="Refrescar noticias X"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoadingXPosts && "animate-spin")} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 border-b border-[#2f3336] p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-black">
                  X
                </div>
                <div className="min-w-0 flex-1">
                  <textarea
                    value={xDraft}
                    onChange={(e) => setXDraft(e.target.value.slice(0, 280))}
                    placeholder="Que esta pasando en el partido?"
                    rows={3}
                    className="w-full resize-none border-0 bg-transparent text-[15px] font-medium leading-snug text-[#e7e9ea] outline-none placeholder:text-[#71767b]"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#2f3336] pt-2">
                    <span className={cn("text-xs font-bold", xDraft.length > 260 ? "text-[#ff7a7a]" : "text-[#71767b]")}>
                      {xDraft.length}/280
                    </span>
                    <button
                      type="button"
                      onClick={() => void publishXPost()}
                      disabled={isPublishingXPost || !xDraft.trim()}
                      className="inline-flex h-8 items-center gap-2 rounded-full bg-[#1d9bf0] px-4 text-xs font-black text-white transition hover:bg-[#1a8cd8] disabled:opacity-45"
                    >
                      {isPublishingXPost ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Postear
                    </button>
                  </div>
                </div>
              </div>

              {xFeedError && (
                <p className="border-b border-[#2f3336] px-3 py-2 text-xs font-bold text-[#ff7a7a]">{xFeedError}</p>
              )}

              <div className="max-h-72 overflow-y-auto">
                {isLoadingXPosts && xPosts.length === 0 ? (
                  <div className="grid min-h-24 place-items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1d9bf0]" />
                  </div>
                ) : xPosts.length > 0 ? (
                  xPosts.map((post) => (
                    <article key={post.id} className="border-b border-[#2f3336] px-3 py-3 transition hover:bg-[#080808]">
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-base font-black text-black">
                          X
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <span className="truncate text-sm font-black text-[#e7e9ea]">{post.author.name}</span>
                            {post.author.verified && (
                              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#1d9bf0] text-[10px] font-black leading-none text-white">
                                ✓
                              </span>
                            )}
                            <span className="truncate text-sm font-medium text-[#71767b]">@{post.author.username}</span>
                            <span className="text-sm font-medium text-[#71767b]">·</span>
                            <span className="text-sm font-medium text-[#71767b]">{relativeTime(post.createdAt)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] font-medium leading-snug text-[#e7e9ea]">
                            {post.text}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2 text-[#71767b]">
                            <div className="grid w-full max-w-40 grid-cols-3">
                              <span className="inline-flex items-center gap-1 text-xs font-bold">
                                <MessageCircle className="h-4 w-4" />
                                {compactNumber(post.metrics.replies)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-bold">
                                <Repeat2 className="h-4 w-4" />
                                {compactNumber(post.metrics.reposts)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-bold">
                                <Heart className="h-4 w-4" />
                                {compactNumber(post.metrics.likes)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => void deleteXPost(post.id)}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#71767b] transition hover:bg-[#2a1214] hover:text-[#ff7a7a]"
                              aria-label="Borrar noticia"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm font-black text-[#e7e9ea]">Sin posts todavia</p>
                    <p className="mt-1 text-xs font-bold text-[#71767b]">El primer post aparece en el panel live al instante que refresque.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowLive((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-black transition",
            isLiveNow ? "bg-[#35130d] text-[#ffd2c2] hover:bg-[#4a1d13]" :
            isHalftime ? "bg-[#211707] text-[#f0b429] hover:bg-[#302108]" :
            "text-slate-400 hover:text-white/65"
          )}
        >
          <div className="flex items-center gap-1.5">
            <Tv2 className="h-3.5 w-3.5" />
            <span>Live</span>
            {liveStatus !== "scheduled" && (
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-black uppercase", isLiveNow ? "bg-red-600 text-white" : isHalftime ? "bg-[#211707] text-white" : "bg-white/10 text-white/65")}>
                {LIVE_STATUS_OPTIONS.find((o) => o.value === liveStatus)?.label}
              </span>
            )}
          </div>
          {showLive ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showLive && (
          <div className="space-y-4 px-3 pb-4 pt-2 min-[380px]:px-4">
            <datalist id={homePlayersListId}>
              {match.homeRoster.map((player) => (
                <option key={`${match.id}-home-${player.name}`} value={player.name} label={playerOptionLabel(player)} />
              ))}
            </datalist>
            <datalist id={awayPlayersListId}>
              {match.awayRoster.map((player) => (
                <option key={`${match.id}-away-${player.name}`} value={player.name} label={playerOptionLabel(player)} />
              ))}
            </datalist>

            {/* Status selector */}
            <div className="grid grid-cols-2 gap-1 min-[430px]:grid-cols-4">
              {LIVE_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLiveStatus(opt.value)}
                  className={cn(
                    "h-9 rounded-lg text-xs font-black transition min-[430px]:h-8",
                    liveStatus === opt.value ? opt.color : "border border-white/12 bg-black/35 text-white/65 hover:bg-black/25"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Live scoreboard */}
            <div className="overflow-hidden rounded-xl bg-slate-950">
              <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-2 px-2.5 py-3 min-[380px]:grid-cols-[1fr_auto_1fr] min-[380px]:gap-4 min-[380px]:px-4 min-[380px]:py-4">
                {/* Home */}
                <div className="flex flex-col items-center gap-2">
                  <Flag team={match.homeTeam} size="sm" />
                  <p className="max-w-20 truncate text-center text-[10px] font-black uppercase text-white/50 min-[380px]:max-w-full">{match.homeTeam}</p>
                  <div className="flex items-center gap-0.5 min-[380px]:gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHomeLiveScore((v) => safeDec(v))}
                      className="grid h-7 w-6 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 min-[380px]:w-7"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={homeLiveScore}
                      onChange={(e) => setHomeLiveScore(e.target.value)}
                      placeholder="0"
                      className="h-10 w-10 rounded-lg bg-white/10 text-center text-xl font-black tabular-nums text-white outline-none focus:bg-white/15 min-[380px]:w-12 min-[380px]:text-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => setHomeLiveScore((v) => safeInc(v))}
                      className="grid h-7 w-6 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 min-[380px]:w-7"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Minute */}
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={liveMinute}
                    onChange={(e) => setLiveMinute(e.target.value)}
                    placeholder="-"
                    className="h-9 w-12 rounded-lg bg-white/10 text-center text-sm font-black tabular-nums text-white outline-none focus:bg-white/15 min-[380px]:w-14"
                  />
                  <p className="text-[10px] font-bold text-white/30">min</p>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-2">
                  <Flag team={match.awayTeam} size="sm" />
                  <p className="max-w-20 truncate text-center text-[10px] font-black uppercase text-white/50 min-[380px]:max-w-full">{match.awayTeam}</p>
                  <div className="flex items-center gap-0.5 min-[380px]:gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAwayLiveScore((v) => safeDec(v))}
                      className="grid h-7 w-6 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 min-[380px]:w-7"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={awayLiveScore}
                      onChange={(e) => setAwayLiveScore(e.target.value)}
                      placeholder="0"
                      className="h-10 w-10 rounded-lg bg-white/10 text-center text-xl font-black tabular-nums text-white outline-none focus:bg-white/15 min-[380px]:w-12 min-[380px]:text-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => setAwayLiveScore((v) => safeInc(v))}
                      className="grid h-7 w-6 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 min-[380px]:w-7"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live stats */}
            <div className="overflow-hidden rounded-xl border border-white/12 bg-black/35 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
              <div className="border-b border-white/10 bg-black/25 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Stats del partido
                  </p>
                  <button
                    type="button"
                    onClick={() => { setShowStatsJson((v) => !v); setStatsJsonError(""); }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black transition",
                      showStatsJson
                        ? "border-sky-400 bg-sky-600 text-white"
                        : "border-[#8fd7ff]/30 bg-[#082033] text-[#8fd7ff] hover:bg-[#0c2c45]"
                    )}
                  >
                    <Braces className="h-3 w-3" />
                    JSON
                  </button>
                </div>
              </div>

              {/* JSON import panel */}
              {showStatsJson && (
                <div className="border-b border-white/10 bg-black/25 p-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#8fd7ff]">
                    Pegar JSON de stats (del broadcast / AI)
                  </p>
                  <textarea
                    value={statsJsonText}
                    onChange={(e) => setStatsJsonText(e.target.value)}
                    placeholder={'{ "home": { "shots": 2, "shotsOnTarget": 1, ... }, "away": { ... } }'}
                    rows={6}
                    spellCheck={false}
                    className="w-full resize-none rounded-lg border border-white/12 bg-black/35 px-3 py-2 font-mono text-xs text-white/80 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                  {statsJsonError && (
                    <p className="rounded-md border border-[#ff6a3d]/50 bg-[#35130d] px-2 py-1.5 text-xs font-bold text-[#ffd2c2]">
                      {statsJsonError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={applyStatsJson}
                      disabled={!statsJsonText.trim()}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-black text-white transition hover:bg-sky-700 disabled:opacity-40"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      Aplicar al formulario
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsJsonText(JSON.stringify(STAT_JSON_TEMPLATE, null, 2))}
                      className="rounded-lg border border-[#8fd7ff]/30 bg-[#082033] px-3 py-2 text-xs font-black text-[#8fd7ff] transition hover:bg-[#0c2c45]"
                    >
                      Template
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-2 p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_4.75rem_4.75rem] gap-1.5 px-1 text-[10px] font-black uppercase tracking-wide text-slate-400 min-[430px]:grid-cols-[minmax(0,1fr)_7rem_7rem] min-[430px]:gap-2">
                  <span>Dato</span>
                  <span className="truncate text-center">{match.homeTeam}</span>
                  <span className="truncate text-center">{match.awayTeam}</span>
                </div>
                {LIVE_STATS_FIELDS.map((field) => (
                  <div key={field.key} className="grid grid-cols-[minmax(0,1fr)_4.75rem_4.75rem] items-center gap-1.5 min-[430px]:grid-cols-[minmax(0,1fr)_7rem_7rem] min-[430px]:gap-2">
                    <span className="truncate text-xs font-black text-white/65">{field.label}</span>
                    <LiveStatInput
                      value={liveStats.home[field.key]}
                      max={field.max}
                      suffix={field.suffix}
                      decimal={field.decimal}
                      onChange={(value) => updateLiveStat("home", field.key, value)}
                    />
                    <LiveStatInput
                      value={liveStats.away[field.key]}
                      max={field.max}
                      suffix={field.suffix}
                      decimal={field.decimal}
                      onChange={(value) => updateLiveStat("away", field.key, value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Event composer */}
            <div className="overflow-hidden rounded-xl border border-white/12 bg-black/35 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
              <div className="border-b border-white/10 bg-black/25 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Nuevo evento</p>
                    <p className="text-xs font-bold text-white/50">
                      {teamLabel(match, draftTeam)}{draftRoster.length ? ` - ${draftRoster.length} jugadores` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => selectEventPreset("goal", "home")}
                      className={cn("h-7 rounded-md px-2 text-[11px] font-black transition", draftType === "goal" && draftTeam === "home" ? "bg-emerald-600 text-white" : "bg-[#10240b] text-[#d5ff3f] hover:bg-[#12351f]")}
                    >
                      Gol L
                    </button>
                    <button
                      type="button"
                      onClick={() => selectEventPreset("goal", "away")}
                      className={cn("h-7 rounded-md px-2 text-[11px] font-black transition", draftType === "goal" && draftTeam === "away" ? "bg-emerald-600 text-white" : "bg-[#10240b] text-[#d5ff3f] hover:bg-[#12351f]")}
                    >
                      Gol V
                    </button>
                    <button
                      type="button"
                      onClick={() => selectEventPreset("yellow", "home")}
                      className={cn("h-7 rounded-md px-2 text-[11px] font-black transition", draftType === "yellow" && draftTeam === "home" ? "bg-amber-400 text-white" : "bg-[#211707] text-[#f0b429] hover:bg-[#302108]")}
                    >
                      Amar. L
                    </button>
                    <button
                      type="button"
                      onClick={() => selectEventPreset("yellow", "away")}
                      className={cn("h-7 rounded-md px-2 text-[11px] font-black transition", draftType === "yellow" && draftTeam === "away" ? "bg-amber-400 text-white" : "bg-[#211707] text-[#f0b429] hover:bg-[#302108]")}
                    >
                      Amar. V
                    </button>
                    <button
                      type="button"
                      onClick={() => selectEventPreset("substitution", "home")}
                      className={cn("h-7 rounded-md px-2 text-[11px] font-black transition", draftType === "substitution" && draftTeam === "home" ? "bg-slate-800 text-white" : "bg-white/10 text-white/65 hover:bg-white/15")}
                    >
                      Cambio L
                    </button>
                    <button
                      type="button"
                      onClick={() => selectEventPreset("substitution", "away")}
                      className={cn("h-7 rounded-md px-2 text-[11px] font-black transition", draftType === "substitution" && draftTeam === "away" ? "bg-slate-800 text-white" : "bg-white/10 text-white/65 hover:bg-white/15")}
                    >
                      Cambio V
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 p-3">
                <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-2 sm:grid-cols-[4.75rem_8rem_minmax(0,1fr)]">
                  <label className="grid gap-1">
                    <span className="text-[10px] font-black uppercase text-white/40">Min</span>
                    <input
                      type="number"
                      min={0}
                      max={130}
                      value={draftMinute}
                      onChange={(e) => setDraftMinute(e.target.value)}
                      placeholder="'"
                      className="h-10 rounded-lg border border-white/12 bg-black/25 px-2 text-center text-sm font-black tabular-nums text-white/70 outline-none focus:border-red-300 focus:bg-black/35 focus:ring-2 focus:ring-red-100"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-[10px] font-black uppercase text-white/40">Tipo</span>
                    <select
                      value={draftType}
                      onChange={(e) => setDraftType(e.target.value as LiveEventType)}
                      className="h-10 rounded-lg border border-white/12 bg-black/25 px-2 text-sm font-black text-white/70 outline-none focus:border-red-300 focus:bg-black/35 focus:ring-2 focus:ring-red-100"
                    >
                      {LIVE_EVENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase text-white/40">Jugador</span>
                    <input
                      type="text"
                      list={draftPlayersListId}
                      value={draftPlayer}
                      onChange={(e) => setDraftPlayer(e.target.value)}
                      placeholder={draftRoster.length ? "Elegir jugador..." : "Jugador opcional"}
                      className="h-10 rounded-lg border border-white/12 bg-black/25 px-3 text-sm font-bold text-white/70 outline-none placeholder:text-white/25 focus:border-red-300 focus:bg-black/35 focus:ring-2 focus:ring-red-100"
                    />
                  </label>
                </div>

                <div className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
                  <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/12 bg-black/25 p-1">
                    {(["home", "away", null] as LiveEventTeam[]).map((team) => (
                      <button
                        key={team ?? "general"}
                        type="button"
                        onClick={() => { setDraftTeam(team); setDraftPlayer(""); }}
                        className={cn(
                          "h-8 rounded-md text-[11px] font-black transition",
                          draftTeam === team
                            ? team === "home"
                              ? "bg-blue-600 text-white"
                              : team === "away"
                                ? "bg-red-600 text-white"
                                : "bg-slate-700 text-white"
                            : "text-white/50 hover:bg-white/10"
                        )}
                      >
                        {team === "home" ? "Local" : team === "away" ? "Visita" : "General"}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="Nota corta para el timeline"
                    className="h-10 rounded-lg border border-white/12 bg-black/25 px-3 text-sm font-bold text-white/70 outline-none placeholder:text-white/25 focus:border-red-300 focus:bg-black/35 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={addDraftEvent}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-black text-white transition hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  Agregar evento
                </button>
              </div>
            </div>

            {/* Events list */}
            {liveEvents.length > 0 && (
              <div className="space-y-2 rounded-xl border border-white/12 bg-black/25 p-2">
                <p className="px-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Eventos ({liveEvents.length})</p>
                <div className="max-h-64 space-y-1.5 overflow-y-auto">
                  {liveEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-white/10 bg-black/35 p-2">
                      {/* Row 1: minute + type + team + delete */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={event.minute ?? ""}
                          onChange={(e) => updateLiveEvent(event.id, { minute: e.target.value === "" ? null : Number(e.target.value) })}
                          placeholder="'"
                          className="w-10 rounded border border-white/12 bg-black/25 text-center text-xs font-black tabular-nums text-white/65 outline-none"
                        />
                        <select
                          value={event.type}
                          onChange={(e) => updateLiveEvent(event.id, { type: e.target.value as LiveEventType })}
                          className="h-7 shrink-0 rounded border border-white/12 bg-black/25 px-1.5 text-[11px] font-black text-white/70 outline-none focus:border-slate-400"
                        >
                          {LIVE_EVENT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        {/* Team selector */}
                        <div className="flex gap-0.5">
                          <button
                            type="button"
                            onClick={() => updateLiveEvent(event.id, { team: "home", player: "" })}
                            className={cn("h-5 rounded px-1.5 text-[10px] font-black transition", event.team === "home" ? "bg-blue-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/10/15")}
                          >L</button>
                          <button
                            type="button"
                            onClick={() => updateLiveEvent(event.id, { team: "away", player: "" })}
                            className={cn("h-5 rounded px-1.5 text-[10px] font-black transition", event.team === "away" ? "bg-red-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/10/15")}
                          >V</button>
                          <button
                            type="button"
                            onClick={() => updateLiveEvent(event.id, { team: null, player: "" })}
                            className={cn("h-5 rounded px-1.5 text-[10px] font-black transition", event.team === null ? "bg-slate-600 text-white" : "bg-white/10 text-white/50 hover:bg-white/10/15")}
                          >-</button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLiveEvent(event.id)}
                          className="ml-auto shrink-0 text-slate-300 transition hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {/* Row 2: player + note */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          list={event.team === "home" ? homePlayersListId : event.team === "away" ? awayPlayersListId : undefined}
                          value={event.player}
                          onChange={(e) => updateLiveEvent(event.id, { player: e.target.value })}
                          placeholder={rosterForTeam(match, event.team).length ? "Elegir jugador" : "Jugador"}
                          className="rounded border border-white/12 bg-black/25 px-2 py-1 text-xs font-bold text-white/70 outline-none placeholder:text-white/25 focus:border-slate-400"
                        />
                        <input
                          type="text"
                          value={event.note}
                          onChange={(e) => updateLiveEvent(event.id, { note: e.target.value })}
                          placeholder="Nota"
                          className="rounded border border-white/12 bg-black/25 px-2 py-1 text-xs font-bold text-white/70 outline-none placeholder:text-white/25 focus:border-slate-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note general */}
            <textarea
              value={liveNote}
              onChange={(e) => setLiveNote(e.target.value)}
              placeholder="Nota general del partido (opcional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-white/12 bg-black/35 px-3 py-2 text-xs font-bold text-white/70 outline-none placeholder:text-white/25 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />

            {liveError && (
              <p className="rounded-lg border border-[#ff6a3d]/50 bg-[#35130d] px-3 py-2 text-xs font-bold text-[#ffd2c2]">{liveError}</p>
            )}

            <button
              type="button"
              onClick={() => void handleSaveLive()}
              disabled={isSavingLive}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-black text-white transition disabled:opacity-50",
                isLiveNow ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-800"
              )}
            >
              {isSavingLive ? <Loader2 className="h-4 w-4 animate-spin" /> : liveSaved ? <Check className="h-4 w-4" /> : <Tv2 className="h-4 w-4" />}
              {liveSaved ? "Live guardado OK" : "Guardar live"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function LiveStatInput({
  value,
  onChange,
  max,
  suffix,
  decimal = false,
}: {
  value: number | null;
  onChange: (value: string) => void;
  max?: number;
  suffix?: string;
  decimal?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-lg border border-white/12 bg-black/25 focus-within:border-red-300 focus-within:bg-black/35 focus-within:ring-2 focus-within:ring-red-100">
      <input
        type="number"
        min={0}
        max={max}
        step={decimal ? "0.1" : "1"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-0 bg-transparent px-2 text-center text-sm font-black tabular-nums text-white/80 outline-none"
      />
      {suffix && (
        <span className="grid h-9 w-7 place-items-center border-l border-white/12 text-[10px] font-black text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}
