// app/(page_routes)/mundial/components/PenalitosPanel.tsx
"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Bell, Eye, Trophy, Users, Volume2, Wifi, WifiOff } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "../utils";
import { PENALITOS_ANIM_MS } from "./penalitos/constants";
import { FieldFallback } from "./penalitos/PenalitosField3D";
import type {
  PenalitosDirection,
  PenalitosGame,
  PenalitosQueueEntry,
  PenalitosRoundHistory,
  PenalitosRole,
  MundialMatch,
} from "../types";

const PenalitosField3D = dynamic(
  () => import("./penalitos/PenalitosField3D").then((m) => ({ default: m.PenalitosField3D })),
  { ssr: false, loading: () => <FieldFallback /> },
);

// -------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------
const ANIM_DURATION_MS = PENALITOS_ANIM_MS;
const VISITOR_KEY = "penalitos-vid";
const CHOICES: PenalitosDirection[] = ["left", "center", "right"];

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
type LiveMatchSnapshot = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLiveScore: number | null;
  awayLiveScore: number | null;
  liveMinute: number | null;
  liveStatus: "live" | "halftime" | "fulltime" | "scheduled";
  liveNote: string;
};

type SSEPayload = {
  game: PenalitosGame | null;
  queue: PenalitosQueueEntry[];
  scores: Record<string, number>;
  history?: PenalitosRoundHistory[];
  liveMatch: LiveMatchSnapshot | null;
  viewerCount: number;
  viewers?: PenalitosViewer[];
  recentViewers?: PenalitosViewer[];
  version?: number;
  serverTime?: string;
  updatedAt?: string | null;
};

type PenalitosViewer = {
  visitorId: string;
  name: string;
  connectedAt: string;
  lastSeenAt: string;
};

// -------------------------------------------------------------------
// Visitor ID (UUID generated once per browser)
// -------------------------------------------------------------------
function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getDisplayName(playerName: string): string {
  if (playerName.trim()) return playerName.trim().slice(0, 20);
  try {
    const stored = localStorage.getItem("mundial-player-name");
    if (stored?.trim()) return stored.trim().slice(0, 20);
  } catch {}
  return `Jugador-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function playTone(sequence: Array<[number, number, number]>) {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const start = ctx.currentTime;
  sequence.forEach(([frequency, offsetMs, durationMs]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start + offsetMs / 1000);
    gain.gain.exponentialRampToValueAtTime(0.12, start + offsetMs / 1000 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + (offsetMs + durationMs) / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start + offsetMs / 1000);
    osc.stop(start + (offsetMs + durationMs + 40) / 1000);
  });
  window.setTimeout(() => void ctx.close().catch(() => {}), 1200);
}

// -------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------
const DirectionButton = memo(function DirectionButton({
  dir,
  chosen,
  disabled,
  onChoose,
  compact = false,
}: {
  dir: PenalitosDirection;
  chosen: PenalitosDirection | null;
  disabled: boolean;
  onChoose: (d: PenalitosDirection) => void;
  compact?: boolean;
}) {
  const isSelected = chosen === dir;
  return (
    <button
      onClick={() => onChoose(dir)}
      disabled={disabled}
      className={cn(
        "rounded-2xl font-black transition-all active:scale-95 select-none",
        compact ? "h-12 text-xs sm:h-14 sm:text-sm" : "h-16 text-base sm:h-20 sm:text-xl",
        isSelected
          ? "bg-[#f0b429] text-black shadow-lg shadow-[#f0b429]/40 scale-105"
          : "bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {dir === "left" && "← IZQDA"}
      {dir === "center" && "CENTRO"}
      {dir === "right" && "DERECHA →"}
    </button>
  );
});

const PlayerCard = memo(function PlayerCard({
  emoji,
  label,
  labelColor,
  name,
  isMe,
  choice,
  revealed,
  compact = false,
}: {
  emoji: string;
  label: string;
  labelColor: string;
  name: string | null;
  isMe: boolean;
  choice: PenalitosDirection | null;
  revealed: boolean;
  compact?: boolean;
}) {
  const choiceLabel = choice
    ? choice === "left" ? "← IZQ" : choice === "center" ? "CENTRO" : "DER →"
    : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl bg-black/50 transition-all",
        compact ? "p-2.5" : "p-4",
        isMe && "ring-2 ring-[#f0b429]"
      )}
    >
      <div className={cn("mb-1", compact ? "text-2xl" : "text-4xl")}>{emoji}</div>
      <p className={cn("truncate font-black", compact ? "max-w-[96px] text-xs" : "max-w-[120px] text-base")}>{name || "—"}</p>
      <p className={cn("font-bold uppercase tracking-widest", compact ? "text-[10px]" : "text-xs", labelColor)}>{label}</p>
      {isMe && <p className="text-[10px] text-[#f0b429] mt-1">TÚ</p>}
      {revealed && choiceLabel && (
        <p className="mt-2 text-xs font-mono bg-white/10 rounded px-2 py-0.5">{choiceLabel}</p>
      )}
    </div>
  );
});

// Compact live scoreboard shown inside the panel header
const LiveScoreChip = memo(function LiveScoreChip({
  match,
}: {
  match: LiveMatchSnapshot | MundialMatch;
}) {
  const home = match.homeLiveScore;
  const away = match.awayLiveScore;
  const minute = match.liveMinute;
  const status = match.liveStatus;

  if (home === null && away === null) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#9dff34]/30 bg-[#0a2410]/80 px-3 py-1">
      <span className="text-xs font-black text-white tabular-nums">
        {home ?? 0}
        <span className="mx-1 text-white/30">–</span>
        {away ?? 0}
      </span>
      {status === "halftime" ? (
        <span className="text-[10px] font-black text-[#f0b429] uppercase">HT</span>
      ) : minute !== null ? (
        <span className="text-[10px] font-black text-[#9dff34]">{minute}&apos;</span>
      ) : null}
    </div>
  );
});

// -------------------------------------------------------------------
// Main Panel
// -------------------------------------------------------------------
type Props = {
  liveMatch: MundialMatch | null;
  playerName: string;
  compact?: boolean;
};

export function PenalitosPanel({ liveMatch, playerName, compact = false }: Props) {
  const [game, setGame] = useState<PenalitosGame | null>(null);
  const [queue, setQueue] = useState<PenalitosQueueEntry[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [sseLiveMatch, setSseLiveMatch] = useState<LiveMatchSnapshot | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<PenalitosViewer[]>([]);
  const [recentViewers, setRecentViewers] = useState<PenalitosViewer[]>([]);
  const [connected, setConnected] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  const [visitorId, setVisitorId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [myChoice, setMyChoice] = useState<PenalitosDirection | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Local clock for timer countdown
  const [nowMs, setNowMs] = useState(() => Date.now());

  const confettiFiredRef = useRef<string | null>(null);
  const lastPayloadRef = useRef<string>("");
  const lastSoundEventRef = useRef<string | null>(null);
  const lastTimerSoundRef = useRef<number | null>(null);
  const serverClockOffsetRef = useRef(0);

  const applyPayload = useCallback((data: SSEPayload) => {
    const signature = JSON.stringify(data);
    if (signature === lastPayloadRef.current) return;
    lastPayloadRef.current = signature;
    if (data.serverTime) {
      const serverTimeMs = new Date(data.serverTime).getTime();
      if (Number.isFinite(serverTimeMs)) {
        serverClockOffsetRef.current = serverTimeMs - Date.now();
        setNowMs(serverTimeMs);
      }
    }
    setGame(data.game ?? null);
    setQueue(data.queue ?? []);
    setScores(data.scores ?? {});
    setSseLiveMatch(data.liveMatch ?? null);
    setViewerCount(data.viewerCount ?? 0);
    setViewers(data.viewers ?? []);
    setRecentViewers(data.recentViewers ?? []);
  }, []);

  // Init visitor identity once
  useEffect(() => {
    queueMicrotask(() => {
      setVisitorId(getOrCreateVisitorId());
      setDisplayName(getDisplayName(playerName));
    });
  }, [playerName]);

  // Local clock only ticks while countdown/result animation needs it
  useEffect(() => {
    const needsClock = game?.status === "choosing" || game?.status === "finished";
    if (!needsClock) return;
    const id = setInterval(() => setNowMs(Date.now() + serverClockOffsetRef.current), 200);
    return () => clearInterval(id);
  }, [game?.chooseDeadline, game?.resolvedAt, game?.status]);

  // SSE connection with auto-reconnect
  useEffect(() => {
    if (!visitorId || !displayName) return;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let reconnectDelay = 800;

    const connect = () => {
      setReconnecting(false);
      const params = new URLSearchParams({ visitorId, name: displayName });
      es = new EventSource(`/api/mundial/penalitos/live?${params.toString()}`);
      es.onopen = () => {
        setConnected(true);
        setReconnecting(false);
        reconnectDelay = 800;
      };
      const onState = (e: MessageEvent) => {
        try {
          applyPayload(JSON.parse(e.data) as SSEPayload);
        } catch (err) {
          console.error("[penalitos] SSE parse error", err);
        }
      };
      es.onmessage = onState;
      es.addEventListener("state", onState);
      es.onerror = () => {
        setConnected(false);
        setReconnecting(true);
        es?.close();
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(5_000, Math.round(reconnectDelay * 1.6));
      };
    };

    connect();
    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
    };
  }, [applyPayload, displayName, visitorId]);

  // Reset myChoice when a new round starts
  const prevGameIdRef = useRef<string | null>(null);
  const gameId = game?.id ?? null;
  useEffect(() => {
    if (!gameId) return;
    if (gameId !== prevGameIdRef.current) {
      prevGameIdRef.current = gameId;
      queueMicrotask(() => setMyChoice(null));
    }
  }, [gameId]);

  // ------- Derived state -------
  const isGoalkeeper = !!visitorId && game?.goalkeeper?.visitorId === visitorId;
  const isShooter = !!visitorId && game?.shooter?.visitorId === visitorId;
  const isPlaying = isGoalkeeper || isShooter;
  const myRole: PenalitosRole | null = isGoalkeeper ? "goalkeeper" : isShooter ? "shooter" : null;

  const queuePosition = useMemo(
    () => (visitorId ? queue.findIndex((e) => e.visitorId === visitorId) + 1 : 0),
    [queue, visitorId]
  );
  const isInQueue = queuePosition > 0;

  const chooseDeadlineMs = game?.chooseDeadline ? new Date(game.chooseDeadline).getTime() : null;
  const timerSec = chooseDeadlineMs
    ? Math.max(0, Math.ceil((chooseDeadlineMs - nowMs) / 1000))
    : 0;
  const timerPct = chooseDeadlineMs
    ? Math.max(0, Math.min(100, ((chooseDeadlineMs - nowMs) / 10_000) * 100))
    : 0;

  const serverChoice =
    myRole === "goalkeeper"
      ? game?.goalkeeperChoice ?? null
      : myRole === "shooter"
      ? game?.shooterChoice ?? null
      : null;
  const selectedChoice = myChoice ?? serverChoice;
  const needsMyChoice =
    game?.status === "choosing" && isPlaying && selectedChoice === null;

  // Confetti on goal
  useEffect(() => {
    if (game?.status !== "finished" || !game.outcome || !game.resolvedAt) return;
    const key = `${game.id}-${game.resolvedAt}`;
    if (confettiFiredRef.current === key) return;
    confettiFiredRef.current = key;
    if (game.outcome === "goal") {
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
    }
  }, [game?.status, game?.outcome, game?.resolvedAt, game?.id]);

  useEffect(() => {
    if (!soundEnabled || game?.status !== "choosing") return;
    if (timerSec > 3 || timerSec < 1) return;
    if (lastTimerSoundRef.current === timerSec) return;
    lastTimerSoundRef.current = timerSec;
    playTone([[timerSec === 1 ? 880 : 620, 0, 110]]);
  }, [game?.status, soundEnabled, timerSec]);

  useEffect(() => {
    if (!soundEnabled || !game) return;
    const eventKey = `${game.id}-${game.status}-${game.goalkeeperChoice ?? "x"}-${game.shooterChoice ?? "x"}-${game.outcome ?? "x"}`;
    if (lastSoundEventRef.current === eventKey) return;
    lastSoundEventRef.current = eventKey;

    if (game.status === "choosing") playTone([[440, 0, 90], [660, 110, 120]]);
    if (game.status === "finished" && game.outcome === "goal") playTone([[660, 0, 120], [880, 130, 160], [1040, 310, 220]]);
    if (game.status === "finished" && game.outcome === "save") playTone([[260, 0, 160], [180, 180, 220]]);
  }, [game, soundEnabled]);

  useEffect(() => {
    if (!notificationsEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!game || !visitorId) return;

    if (needsMyChoice) {
      const key = `penalitos-turn-${game.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        new Notification("Penalitos: es su turno", {
          body: "Tenés 10 segundos para elegir dirección.",
          tag: `penalitos-turn-${game.id}`,
        });
      }
    }

    if (game.status === "finished" && game.resolvedAt && isPlaying) {
      const key = `penalitos-result-${game.id}-${game.resolvedAt}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        const won =
          (game.outcome === "goal" && isShooter) ||
          (game.outcome === "save" && isGoalkeeper);
        new Notification(won ? "Penalitos: ¡ganaste!" : "Penalitos: perdiste", {
          body: game.outcome === "goal"
            ? `${game.shooter?.name ?? "Lanzador"} anotó`
            : `${game.goalkeeper?.name ?? "Portero"} la atajó`,
          tag: `penalitos-result-${game.id}`,
        });
      }
    }
  }, [game, isGoalkeeper, isPlaying, isShooter, needsMyChoice, notificationsEnabled, visitorId]);

  useEffect(() => {
    if (!notificationsEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (!visitorId || !isInQueue || queuePosition > 2) return;
    const key = `penalitos-queue-${queuePosition}-${queue[queuePosition - 1]?.visitorId ?? ""}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    new Notification(
      queuePosition === 1 ? "Penalitos: sos el siguiente" : "Penalitos: casi te toca",
      {
        body: queuePosition === 1
          ? "Quedás primero en la cola. Preparate."
          : `Estás #${queuePosition} en la cola.`,
        tag: "penalitos-queue",
      }
    );
  }, [isInQueue, notificationsEnabled, queue, queuePosition, visitorId]);

  const resolvedAtMs = game?.resolvedAt ? new Date(game.resolvedAt).getTime() : null;
  const isAnimating =
    game?.status === "finished" && resolvedAtMs !== null && nowMs - resolvedAtMs < ANIM_DURATION_MS;
  const showResult =
    game?.status === "finished" && resolvedAtMs !== null && nowMs - resolvedAtMs >= ANIM_DURATION_MS;

  const canChoose = needsMyChoice;
  const alreadyChose = isPlaying && selectedChoice !== null;

  const showJoinGoalkeeper = !isPlaying && !isInQueue && (!game || game.status === "waiting") && !game?.goalkeeper;
  const showJoinShooter = !isPlaying && !isInQueue && (!game || game.status === "waiting") && !game?.shooter;
  const showQueue = !isPlaying && !isInQueue && !showJoinGoalkeeper && !showJoinShooter;

  const scenePhase =
    isAnimating ? "animating" as const
    : showResult ? "result" as const
    : "idle" as const;

  const topScorers = useMemo(
    () => Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 5),
    [scores]
  );

  const activePlayers = useMemo(() => {
    const playing = new Map<string, { name: string; status: "playing" | "queued" | "online"; role?: PenalitosRole }>();

    if (game?.goalkeeper) {
      playing.set(game.goalkeeper.visitorId, {
        name: game.goalkeeper.name,
        status: "playing",
        role: "goalkeeper",
      });
    }
    if (game?.shooter) {
      playing.set(game.shooter.visitorId, {
        name: game.shooter.name,
        status: "playing",
        role: "shooter",
      });
    }
    for (const entry of queue) {
      if (playing.has(entry.visitorId)) continue;
      playing.set(entry.visitorId, {
        name: entry.name,
        status: "queued",
        role: entry.preferredRole,
      });
    }
    for (const viewer of viewers) {
      if (playing.has(viewer.visitorId)) continue;
      playing.set(viewer.visitorId, { name: viewer.name, status: "online" });
    }

    const order = { playing: 0, queued: 1, online: 2 } as const;
    return [...playing.entries()]
      .map(([id, info]) => ({ id, ...info, isMe: id === visitorId }))
      .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name))
      .slice(0, compact ? 8 : 14);
  }, [compact, game, queue, visitorId, viewers]);

  // Use SSE liveMatch for real-time score; fall back to prop
  const displayMatch: LiveMatchSnapshot | MundialMatch | null = sseLiveMatch ?? liveMatch;

  // ------- Handlers -------
  const enableGameFeedback = useCallback(async () => {
    if (soundEnabled || notificationsEnabled) {
      setSoundEnabled(false);
      setNotificationsEnabled(false);
      return;
    }
    setSoundEnabled(true);
    playTone([[520, 0, 90], [760, 120, 120]]);
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === "granted");
      }
    }
  }, [notificationsEnabled, soundEnabled]);

  const joinAs = useCallback(async (role: PenalitosRole) => {
    if (!visitorId || isPlaying || isInQueue) return;
    if (!soundEnabled) void enableGameFeedback();
    try {
      await fetch("/api/mundial/penalitos/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, name: displayName, role }),
      });
    } catch (err) {
      console.error("[penalitos] join error", err);
    }
  }, [displayName, enableGameFeedback, isInQueue, isPlaying, soundEnabled, visitorId]);

  const joinQueue = useCallback(async (role: PenalitosRole) => {
    if (!visitorId || isPlaying || isInQueue) return;
    if (!soundEnabled) void enableGameFeedback();
    try {
      await fetch("/api/mundial/penalitos/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, name: displayName, role }),
      });
    } catch (err) {
      console.error("[penalitos] queue error", err);
    }
  }, [displayName, enableGameFeedback, isInQueue, isPlaying, soundEnabled, visitorId]);

  const leaveQueue = useCallback(async () => {
    if (!visitorId) return;
    try {
      await fetch("/api/mundial/penalitos/join", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
    } catch {}
  }, [visitorId]);

  const makeChoice = useCallback(async (choice: PenalitosDirection) => {
    if (!canChoose || !visitorId) return;
    if (soundEnabled) playTone([[720, 0, 80], [360, 90, 80]]);
    setMyChoice(choice);
    try {
      const res = await fetch("/api/mundial/penalitos/choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, choice }),
      });
      if (!res.ok) {
        setMyChoice(null);
        return;
      }
      const data = await res.json() as Partial<SSEPayload>;
      if (data.game !== undefined || data.queue !== undefined || data.scores !== undefined) {
        applyPayload({
          game: data.game ?? null,
          queue: data.queue ?? [],
          scores: data.scores ?? {},
          liveMatch: data.liveMatch ?? sseLiveMatch,
          viewerCount: data.viewerCount ?? viewerCount,
          viewers: data.viewers ?? viewers,
          recentViewers: data.recentViewers ?? recentViewers,
        });
      }
    } catch {
      setMyChoice(null);
    }
  }, [applyPayload, canChoose, recentViewers, sseLiveMatch, viewerCount, viewers, visitorId]);

  // ------- Empty state -------
  if (!liveMatch && !sseLiveMatch) {
    return (
      <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-8 text-center">
        <p className="font-black text-white/50 text-lg">
          Penalitos se activa cuando empiece un partido en vivo ⚽
        </p>
      </div>
    );
  }

  // ------- Status badge -------
  const statusBadge = game?.status === "waiting"
    ? { text: "ESPERANDO JUGADORES", color: "text-white/50 bg-white/5" }
    : game?.status === "choosing"
    ? { text: `ELIGIENDO • ${timerSec}s`, color: "text-[#f0b429] bg-[#f0b429]/10 animate-pulse" }
    : game?.status === "finished" && isAnimating
    ? { text: "EN VUELO...", color: "text-blue-300 bg-blue-900/20" }
    : game?.status === "finished"
    ? {
        text: game.outcome === "goal" ? "¡GOL! ⚽" : "¡PARADA! 🧤",
        color: game.outcome === "goal"
          ? "text-emerald-300 bg-emerald-900/30"
          : "text-orange-300 bg-orange-900/30",
      }
    : { text: "EN ESPERA", color: "text-white/30 bg-white/5" };

  return (
    <div className={compact ? "" : "mt-6 md:mt-10 px-1 sm:px-2"}>
      <div className="rounded-3xl border border-[#f0b429]/20 bg-gradient-to-br from-[#091a0f] via-black/95 to-black shadow-2xl overflow-hidden">

        {/* ═══ HEADER ═══ */}
        <div className={cn("border-b border-white/5", compact ? "px-3 pt-3 pb-2" : "px-5 sm:px-8 pt-6 pb-4")}>
          {compact ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">⚽</span>
                <span className="text-sm font-black tracking-tight">PENALITOS</span>
                {game && <span className="text-[10px] text-white/30 font-mono">#{game.roundNumber}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={enableGameFeedback}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full border transition",
                    soundEnabled
                      ? "border-[#f0b429]/70 bg-[#f0b429]/15 text-[#f0b429]"
                      : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                  )}
                  aria-label={soundEnabled || notificationsEnabled ? "Desactivar sonidos y notificaciones" : "Activar sonidos y notificaciones"}
                  title={soundEnabled || notificationsEnabled ? "Sonido y alertas ON" : "Activar sonido y alertas"}
                >
                  {notificationsEnabled ? <Bell className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider", statusBadge.color)}>
                  {statusBadge.text}
                </span>
                {reconnecting ? (
                  <WifiOff className="h-3 w-3 text-orange-400 animate-pulse" />
                ) : connected ? (
                  <Wifi className="h-3 w-3 text-emerald-400" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-400" />
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Row 1: title + round + status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#f0b429] p-2.5 text-black text-2xl leading-none">⚽</div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none">
                      PENALITOS
                    </h2>
                    <p className="text-white/40 text-xs mt-0.5 font-bold uppercase tracking-widest">
                      Mini-partido en vivo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {game && (
                    <span className="text-xs text-white/40 font-mono">
                      Ronda {game.roundNumber}
                    </span>
                  )}
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                    statusBadge.color
                  )}>
                    {statusBadge.text}
                  </span>
                </div>
              </div>

              {/* Row 2: live score chip + viewers + connection */}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                {displayMatch && (
                  <LiveScoreChip match={displayMatch} />
                )}

                <span className="text-white/30 text-xs">
                  {displayMatch
                    ? `${displayMatch.homeTeam} vs ${displayMatch.awayTeam}`
                    : (liveMatch?.homeTeam ?? "") + " vs " + (liveMatch?.awayTeam ?? "")}
                </span>

                <div className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={enableGameFeedback}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition",
                      soundEnabled
                        ? "border-[#f0b429]/60 bg-[#f0b429]/12 text-[#f0b429]"
                        : "border-white/10 bg-white/5 text-white/45 hover:border-white/25 hover:text-white"
                    )}
                  >
                    {notificationsEnabled ? <Bell className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    {soundEnabled || notificationsEnabled ? "Alertas ON" : "Activar alertas"}
                  </button>
                  {viewerCount > 1 && (
                    <div className="flex items-center gap-1 text-white/35 text-[11px] font-bold">
                      <Eye className="h-3 w-3" />
                      <span>{viewerCount}</span>
                    </div>
                  )}

                  {reconnecting ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-orange-400 animate-pulse">
                      <WifiOff className="h-3.5 w-3.5" />
                      RECONECTANDO
                    </span>
                  ) : connected ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                      <Wifi className="h-3.5 w-3.5" />
                      LIVE
                    </span>
                  ) : (
                    <WifiOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={cn(compact ? "px-3 py-3 space-y-3" : "px-5 sm:px-8 py-5 space-y-5")}>

          {/* ═══ TIMER BAR ═══ */}
          {game?.status === "choosing" && (
            <div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${timerPct}%`,
                    background: timerPct > 40
                      ? "linear-gradient(90deg,#f0b429,#fde68a)"
                      : timerPct > 15
                      ? "linear-gradient(90deg,#f97316,#fbbf24)"
                      : "linear-gradient(90deg,#ef4444,#f97316)",
                  }}
                />
              </div>
            </div>
          )}

          {/* ═══ SOCCER FIELD (3D) ═══ */}
          <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-[#04070f]">
            <PenalitosField3D
              phase={scenePhase}
              shooterChoice={game?.shooterChoice ?? null}
              goalkeeperChoice={game?.goalkeeperChoice ?? null}
              outcome={game?.outcome ?? null}
              animStartMs={resolvedAtMs}
              nowMs={nowMs}
              compact={compact}
            />

            {/* Result overlay */}
            {showResult && game?.outcome && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] pointer-events-none">
                {game.outcome === "goal" ? (
                  <>
                    <p className="text-5xl sm:text-6xl font-black text-emerald-300 drop-shadow-2xl tracking-tight animate-bounce">
                      ¡GOL!
                    </p>
                    <p className="text-white/80 text-sm mt-2 font-bold">
                      🥾 {game.shooter?.name} anotó
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl sm:text-5xl font-black text-orange-300 drop-shadow-2xl tracking-tight">
                      ¡PARADA!
                    </p>
                    <p className="text-white/80 text-sm mt-2 font-bold">
                      🧤 {game.goalkeeper?.name} lo atajó
                    </p>
                  </>
                )}
                <div className="mt-3 flex gap-6 text-xs font-mono text-white/60">
                  {game.goalkeeperChoice && (
                    <span>🧤 {game.goalkeeperChoice === "left" ? "←" : game.goalkeeperChoice === "center" ? "↑" : "→"}</span>
                  )}
                  {game.shooterChoice && (
                    <span>🥾 {game.shooterChoice === "left" ? "←" : game.shooterChoice === "center" ? "↑" : "→"}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ PLAYER CARDS ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <PlayerCard
              emoji="🧤"
              label="Portero"
              labelColor="text-emerald-400"
              name={game?.goalkeeper?.name ?? null}
              isMe={isGoalkeeper}
              choice={game?.goalkeeperChoice ?? null}
              revealed={showResult}
              compact={compact}
            />
            <PlayerCard
              emoji="🥾"
              label="Lanzador"
              labelColor="text-orange-400"
              name={game?.shooter?.name ?? null}
              isMe={isShooter}
              choice={game?.shooterChoice ?? null}
              revealed={showResult}
              compact={compact}
            />
          </div>

          {/* ═══ DIRECTION BUTTONS ═══ */}
          {(game?.status === "choosing" || alreadyChose) && isPlaying && (
            <div>
              <p className="text-center mb-3 font-black text-sm uppercase tracking-widest text-white/60">
                {myRole === "goalkeeper" ? "🧤 ¿A dónde te tiras?" : "🥾 ¿A dónde disparas?"}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {CHOICES.map((dir) => (
                  <DirectionButton
                    key={dir}
                    dir={dir}
                    chosen={selectedChoice}
                    disabled={!!selectedChoice}
                    onChoose={makeChoice}
                    compact={compact}
                  />
                ))}
              </div>
              {alreadyChose && (
                <p className="text-center mt-3 text-[#f0b429] text-sm font-bold animate-pulse">
                  ✓ Elegiste. Esperando al contrincante...
                </p>
              )}
            </div>
          )}

          {/* ═══ SPECTATOR MESSAGE ═══ */}
          {game?.status === "choosing" && !isPlaying && (
            <p className="text-center text-white/40 text-sm italic">
              Ronda en curso — únete a la cola para jugar.
            </p>
          )}

          {/* ═══ JOIN / QUEUE BUTTONS ═══ */}
          {(showJoinGoalkeeper || showJoinShooter) && (
            <div className={cn("grid gap-3", showJoinGoalkeeper && showJoinShooter ? "grid-cols-2" : "grid-cols-1")}>
              {showJoinGoalkeeper && (
                <button
                  onClick={() => joinAs("goalkeeper")}
                  className={cn("rounded-2xl bg-emerald-700 font-black transition hover:bg-emerald-600 active:scale-95", compact ? "py-3 text-sm" : "py-5 text-lg")}
                >
                  🧤 SER PORTERO
                </button>
              )}
              {showJoinShooter && (
                <button
                  onClick={() => joinAs("shooter")}
                  className={cn("rounded-2xl bg-orange-700 font-black transition hover:bg-orange-600 active:scale-95", compact ? "py-3 text-sm" : "py-5 text-lg")}
                >
                  🥾 SER LANZADOR
                </button>
              )}
            </div>
          )}

          {showQueue && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => joinQueue("goalkeeper")}
                className={cn("rounded-2xl border border-emerald-700/30 bg-emerald-900/60 font-bold transition hover:bg-emerald-800/60 active:scale-95", compact ? "py-3 text-xs" : "py-4 text-sm")}
              >
                🧤 Cola portero
              </button>
              <button
                onClick={() => joinQueue("shooter")}
                className={cn("rounded-2xl border border-orange-700/30 bg-orange-900/60 font-bold transition hover:bg-orange-800/60 active:scale-95", compact ? "py-3 text-xs" : "py-4 text-sm")}
              >
                🥾 Cola lanzador
              </button>
            </div>
          )}

          {isInQueue && (
            <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
              <p className="text-sm font-bold text-white/70">
                Estás <span className="text-[#f0b429] font-black">#{queuePosition}</span> en la cola
              </p>
              <button
                onClick={leaveQueue}
                className="text-xs text-white/40 hover:text-white/70 transition"
              >
                Salir
              </button>
            </div>
          )}

          {isPlaying && game?.status === "waiting" && (
            <p className="text-center text-white/50 text-sm animate-pulse">
              Esperando al otro jugador...
            </p>
          )}

          {/* ═══ ACTIVE PLAYERS + QUEUE ═══ */}
          {(activePlayers.length > 0 || queue.length > 0) && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 sm:p-3">
              {activePlayers.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#9dff34]" />
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9dff34]">
                        Activos ahora
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-black tabular-nums text-white/55">
                      {viewerCount}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activePlayers.map((player) => (
                      <span
                        key={player.id}
                        className={cn(
                          "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
                          player.isMe
                            ? "border-[#f0b429]/50 bg-[#f0b429]/12 text-[#f0b429]"
                            : player.status === "playing"
                              ? "border-[#62ffe6]/40 bg-[#071d2a]/80 text-[#62ffe6]"
                              : player.status === "queued"
                                ? "border-[#f0b429]/30 bg-[#211706]/70 text-[#f0b429]"
                                : "border-white/10 bg-white/5 text-white/65"
                        )}
                        title={player.isMe ? "Vos" : player.name}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            player.status === "playing"
                              ? "bg-[#62ffe6] animate-pulse"
                              : player.status === "queued"
                                ? "bg-[#f0b429]"
                                : "bg-white/35"
                          )}
                        />
                        <span className="truncate">{player.isMe ? "Vos" : player.name}</span>
                        {player.role === "goalkeeper" ? "🧤" : player.role === "shooter" ? "🥾" : null}
                        {player.status === "playing" && (
                          <span className="text-[9px] font-black uppercase tracking-wide text-white/45">Jugando</span>
                        )}
                        {player.status === "queued" && (
                          <span className="text-[9px] font-black uppercase tracking-wide text-white/45">
                            #{queue.findIndex((entry) => entry.visitorId === player.id) + 1}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {queue.length > 0 && (
                <div className={activePlayers.length > 0 ? "mt-3 border-t border-white/8 pt-3" : ""}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    Cola ({queue.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {queue.map((p, i) => (
                      <div
                        key={p.visitorId + i}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                          p.visitorId === visitorId
                            ? "bg-[#f0b429]/20 text-[#f0b429] ring-1 ring-[#f0b429]/40"
                            : "bg-white/8 text-white/60"
                        )}
                      >
                        <span className="tabular-nums text-white/30">#{i + 1}</span>
                        {p.name}
                        {p.preferredRole === "goalkeeper" ? " 🧤" : " 🥾"}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ SCOREBOARD ═══ */}
          {!compact && topScorers.length > 0 && (
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-3.5 w-3.5 text-[#f0b429]" />
                <p className="text-xs uppercase tracking-widest text-white/40">
                  Goleadores de la sesión
                </p>
              </div>
              <div className="space-y-1.5">
                {topScorers.map(([name, goals], i) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs text-white/30 tabular-nums w-4">{i + 1}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#f0b429]/70 to-[#f0b429]/40 rounded-full flex items-center px-2"
                        style={{
                          width: `${Math.min(100, (goals / (topScorers[0][1] || 1)) * 100)}%`,
                          minWidth: "2rem",
                        }}
                      >
                        <span className="text-[10px] font-black text-black/80 truncate">{name}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#f0b429] tabular-nums w-8 text-right">
                      {goals}⚽
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
