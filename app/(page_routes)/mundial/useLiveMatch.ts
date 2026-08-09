"use client";

// useLiveMatch — SSE hook for real-time live match data.
// Mirrors the pattern used in PenalitosPanel / ProximoEnAnotarPanel.
import { useCallback, useEffect, useState } from "react";
import { EMPTY_LIVE_MATCH_STATS, type LiveMatchStats } from "@/lib/mundial/live-stats";
import type { LiveMatchEvent, LiveMatchStatus } from "./types";

export type LiveMatchSSE = {
  matchId: string | null;
  homeTeam: string;
  awayTeam: string;
  liveStatus: LiveMatchStatus;
  homeLiveScore: number | null;
  awayLiveScore: number | null;
  liveMinute: number | null;
  liveMinuteUpdatedAt: string | null;
  liveNote: string;
  liveEvents: LiveMatchEvent[];
  liveStats: LiveMatchStats;
  liveUpdatedAt: string | null;
  viewerCount: number;
};

const DEFAULT_SSE: LiveMatchSSE = {
  matchId: null,
  homeTeam: "",
  awayTeam: "",
  liveStatus: "scheduled",
  homeLiveScore: null,
  awayLiveScore: null,
  liveMinute: null,
  liveMinuteUpdatedAt: null,
  liveNote: "",
  liveEvents: [],
  liveStats: EMPTY_LIVE_MATCH_STATS,
  liveUpdatedAt: null,
  viewerCount: 0,
};

const MAX_RETRIES = 8;

export function useLiveMatch(): {
  data: LiveMatchSSE;
  connected: boolean;
  reconnecting: boolean;
} {
  const [data, setData] = useState<LiveMatchSSE>(DEFAULT_SSE);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const applyData = useCallback((raw: unknown) => {
    if (!raw || typeof raw !== "object") return;
    setData((prev) => ({ ...DEFAULT_SSE, ...prev, ...(raw as Partial<LiveMatchSSE>) }));
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let attempt = 0;

    const connect = () => {
      if (attempt >= MAX_RETRIES) {
        setConnected(false);
        setReconnecting(false);
        return;
      }

      setReconnecting(attempt > 0);
      es = new EventSource("/api/mundial/matches/live");

      es.onopen = () => {
        attempt = 0;
        setConnected(true);
        setReconnecting(false);
      };

      es.onmessage = (e) => {
        try {
          applyData(JSON.parse(e.data as string));
        } catch (err) {
          console.error("[matches/live] SSE parse error", err);
        }
      };

      es.onerror = () => {
        setConnected(false);
        setReconnecting(true);
        es?.close();
        attempt++;
        const delay = Math.min(30_000, 2_000 * 2 ** (attempt - 1));
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
    };
  }, [applyData]);

  return { data, connected, reconnecting };
}
