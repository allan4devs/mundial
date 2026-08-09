"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, SmilePlus, Wifi, WifiOff, X } from "lucide-react";
import { cn } from "../utils";
import type { MundialMatch } from "../types";

const VISITOR_KEY = "mundial-live-chat-vid";
const QUICK_EMOJIS = ["⚽", "🔥", "😂", "😱", "👏", "💚", "🏆", "😤"];
const MAX_MESSAGE_LENGTH = 180;

type LiveChatMessage = {
  id: string;
  matchId: string;
  visitorId: string;
  playerName: string;
  text: string;
  createdAt: string;
  pending?: boolean;
};

type ChatPayload = { messages: LiveChatMessage[] };
type SendPayload = Partial<ChatPayload> & { message?: LiveChatMessage; error?: string };

type Props = {
  liveMatch: MundialMatch;
  playerName: string;
  onOpenPlayerPicker: () => void;
  variant?: "floating" | "panel";
};

// ── Audio ─────────────────────────────────────────────────────────────────────

function playMessageSound() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.11, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // not available
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `chat-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function cleanDraft(value: string): string {
  return value.replace(/\s+/g, " ").slice(0, MAX_MESSAGE_LENGTH);
}

function chatTime(iso: string): string {
  return iso.slice(11, 16);
}

function mergeMessages(
  current: LiveChatMessage[],
  incoming: LiveChatMessage[]
): LiveChatMessage[] {
  const byId = new Map<string, LiveChatMessage>();
  for (const m of current) if (m.pending) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, { ...m, pending: false });
  return Array.from(byId.values())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-80);
}

// ── Bubble ────────────────────────────────────────────────────────────────────

const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  mine,
}: {
  message: LiveChatMessage;
  mine: boolean;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-xl px-3 py-2 shadow-sm sm:max-w-[75%]",
          mine
            ? "bg-[#f0b429] text-black"
            : "border border-white/10 bg-black/35 text-white"
        )}
      >
        <div className="mb-0.5 flex items-baseline gap-2">
          <span
            className={cn(
              "truncate text-[11px] font-black uppercase",
              mine ? "text-black/60" : "text-[#d5ff3f]"
            )}
          >
            {mine ? "Vos" : message.playerName}
          </span>
          <span
            className={cn(
              "shrink-0 font-mono text-[10px]",
              mine ? "text-black/40" : "text-white/30"
            )}
          >
            {chatTime(message.createdAt)}
          </span>
        </div>
        <p className="break-words text-sm font-bold leading-snug">{message.text}</p>
      </div>
    </div>
  );
});

// ── Toast notification ────────────────────────────────────────────────────────

function ChatToast({
  message,
  onClick,
}: {
  message: LiveChatMessage;
  onClick: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-[5.5rem] right-4 z-[60] w-64 overflow-hidden rounded-xl border border-[#f0b429]/40 bg-[#07110b]/95 shadow-[0_8px_32px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f0b429] text-black">
          <MessageCircle className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#f0b429]">
            {message.playerName}
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-white">{message.text}</p>
        </div>
      </div>
      <div className="h-0.5 w-full origin-left bg-[#f0b429]/60 [animation:shrink_3.5s_linear_forwards]" />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LiveMatchChat({ liveMatch, playerName, onOpenPlayerPicker, variant = "floating" }: Props) {
  const isPanel = variant === "panel";
  const [isOpen, setIsOpen] = useState(isPanel);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [connected, setConnected] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState<LiveChatMessage | null>(null);

  const lastPayloadRef = useRef("");
  const listRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef(new Set<string>());
  const isFirstPayloadRef = useRef(true);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const matchLabel = `${liveMatch.homeTeam} vs ${liveMatch.awayTeam}`;
  const canSend =
    Boolean(playerName.trim()) && Boolean(visitorId) && draft.trim().length > 0;

  useEffect(() => {
    if (isPanel) setIsOpen(true);
  }, [isPanel]);

  const applyPayload = useCallback((payload: ChatPayload) => {
    const signature = JSON.stringify(payload.messages);
    if (signature === lastPayloadRef.current) return;
    lastPayloadRef.current = signature;
    setMessages((current) => mergeMessages(current, payload.messages));
  }, []);

  // Visitor ID
  useEffect(() => {
    queueMicrotask(() => setVisitorId(getOrCreateVisitorId()));
  }, []);

  // SSE
  useEffect(() => {
    const url = `/api/mundial/chat/live?matchId=${encodeURIComponent(liveMatch.id)}`;
    let es: EventSource | null = null;
    let reconnect: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource(url);
      es.onopen = () => {
        setConnected(true);
        setError("");
      };
      es.onmessage = (event) => {
        try {
          applyPayload(JSON.parse(event.data) as ChatPayload);
        } catch (err) {
          console.error("[mundial/chat] SSE parse error", err);
        }
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        reconnect = setTimeout(connect, 2_500);
      };
    };

    connect();
    return () => {
      es?.close();
      clearTimeout(reconnect);
    };
  }, [applyPayload, liveMatch.id]);

  // Auto-scroll when open
  useEffect(() => {
    if (isOpen) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, isOpen]);

  // Detect new messages for notifications
  const confirmedMessages = useMemo(() => messages.filter((m) => !m.pending), [messages]);

  useEffect(() => {
    if (confirmedMessages.length === 0) return;

    const newFromOthers: LiveChatMessage[] = [];
    for (const msg of confirmedMessages) {
      if (!seenIdsRef.current.has(msg.id)) {
        seenIdsRef.current.add(msg.id);
        if (!isFirstPayloadRef.current && msg.visitorId !== visitorId) {
          newFromOthers.push(msg);
        }
      }
    }

    if (isFirstPayloadRef.current) {
      isFirstPayloadRef.current = false;
      return;
    }

    if (newFromOthers.length === 0) return;

    if (!isOpen && !isPanel) {
      queueMicrotask(() => {
        setUnreadCount((prev) => prev + newFromOthers.length);
        playMessageSound();

        // Shake button
        setShaking(true);
        clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => setShaking(false), 650);

        // Toast with latest message
        const latest = newFromOthers[newFromOthers.length - 1];
        setToast(latest);
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 3_500);
      });
    }
  }, [confirmedMessages, isOpen, isPanel, visitorId]);

  // Reset unread when opened
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setUnreadCount(0);
        setToast(null);
      });
    }
  }, [isOpen]);

  const appendEmoji = useCallback((emoji: string) => {
    setDraft((current) =>
      cleanDraft(
        `${current}${current.endsWith(" ") || current.length === 0 ? "" : " "}${emoji}`
      )
    );
  }, []);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!canSend || !text) {
      if (!playerName.trim()) onOpenPlayerPicker();
      return;
    }

    const tempMessage: LiveChatMessage = {
      id: `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      matchId: liveMatch.id,
      visitorId,
      playerName,
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((current) => mergeMessages(current, [tempMessage]));
    setDraft("");
    setIsSending(true);
    setError("");

    try {
      const res = await fetch("/api/mundial/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: liveMatch.id, visitorId, playerName, text }),
      });
      const payload = (await res.json()) as SendPayload;
      if (!res.ok) {
        setError(payload.error ?? "No se pudo enviar.");
        setMessages((current) => current.filter((m) => m.id !== tempMessage.id));
        return;
      }
      if (payload.message) {
        setMessages((current) =>
          mergeMessages(
            current.filter((m) => m.id !== tempMessage.id),
            [payload.message as LiveChatMessage]
          )
        );
      } else {
        applyPayload({ messages: payload.messages ?? [] });
      }
    } catch {
      setError("No se pudo enviar.");
      setMessages((current) => current.filter((m) => m.id !== tempMessage.id));
      setDraft(text);
    } finally {
      setIsSending(false);
    }
  }, [applyPayload, canSend, draft, liveMatch.id, onOpenPlayerPicker, playerName, visitorId]);

  const visibleMessages = useMemo(() => messages.slice(-80), [messages]);

  return (
    <>
      {/* ── Toast notification (chat closed) ── */}
      {toast && !isOpen && !isPanel && (
        <ChatToast message={toast} onClick={() => setIsOpen(true)} />
      )}

      {/* ── Floating chat panel ── */}
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl border border-[#f0b429]/30 bg-[#06140f]/97 shadow-[0_24px_64px_rgba(0,0,0,0.75)] backdrop-blur-md transition-all duration-300",
          isPanel ? "relative w-full" : "fixed bottom-[4.75rem] right-4 z-[55] w-[22rem] sm:w-96",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0d2818]/90 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f0b429] text-black">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black text-white">Chat live</h2>
              <p className="truncate text-[11px] font-bold text-white/40">{matchLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase text-white/50">
              {connected ? (
                <Wifi className="h-3 w-3 text-emerald-400" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-400" />
              )}
              {connected ? "Live" : "..."}
            </span>
            {!isPanel && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/15 bg-black/20 text-white/50 transition hover:border-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className={cn("space-y-2 overflow-y-auto px-4 py-3", isPanel ? "max-h-80 min-h-56" : "max-h-72 min-h-40")}
        >
          {visibleMessages.length > 0 ? (
            visibleMessages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                mine={message.visitorId === visitorId}
              />
            ))
          ) : (
            <div className="grid min-h-32 place-items-center text-center">
              <div>
                <SmilePlus className="mx-auto h-7 w-7 text-[#f0b429]/60" />
                <p className="mt-2 text-sm font-black text-white/50">
                  Sé el primero en reaccionar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/10 bg-black/20 px-3 py-3">
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => appendEmoji(emoji)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/6 text-base transition hover:border-[#f0b429]/50 hover:bg-[#f0b429]/10"
              >
                {emoji}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <input
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => setDraft(cleanDraft(e.target.value))}
              placeholder={
                playerName ? "Escribí al chat..." : "Elegí tu jugador para chatear"
              }
              className="min-w-0 flex-1 rounded-lg border border-white/12 bg-black/35 px-3 py-2.5 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-[#f0b429]/60"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Enviar"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#f0b429] text-black transition hover:bg-[#ffd36b] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className={cn("h-4 w-4", isSending && "animate-pulse")} />
            </button>
          </form>
          {error && <p className="mt-1.5 text-xs font-bold text-red-300">{error}</p>}
        </div>
      </div>

      {/* ── Floating trigger button ── */}
      {!isPanel && (
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat live"}
        className={cn(
          "fixed bottom-4 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-200",
          isOpen
            ? "bg-[#f0b429] text-black hover:bg-[#ffd36b]"
            : "bg-[#0d2818] border-2 border-[#f0b429]/60 text-white hover:border-[#f0b429] hover:bg-[#12351f]",
          shaking && "[animation:chat-shake_0.5s_ease-in-out]"
        )}
      >
        {/* Pulse ring when unread */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute inset-0 rounded-full border-2 border-[#f0b429] [animation:chat-ping_1.2s_ease-out_infinite]" />
        )}

        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6 text-[#f0b429]" />
        )}

        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      )}

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes chat-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes chat-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          15% { transform: translateX(-4px) rotate(-6deg); }
          30% { transform: translateX(4px) rotate(6deg); }
          45% { transform: translateX(-3px) rotate(-4deg); }
          60% { transform: translateX(3px) rotate(4deg); }
          75% { transform: translateX(-2px) rotate(-2deg); }
          90% { transform: translateX(2px) rotate(2deg); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </>
  );
}
