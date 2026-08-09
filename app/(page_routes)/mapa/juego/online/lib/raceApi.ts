import type { RaceRoomView } from "../types";

type RaceApiResponse = {
  ok: boolean;
  code?: string;
  room?: RaceRoomView;
  error?: string;
};

const parseRaceResponse = async (res: Response): Promise<RaceApiResponse> => {
  const text = await res.text();

  try {
    const json = JSON.parse(text) as RaceApiResponse;
    return json.ok !== undefined || json.error ? json : { ...json, ok: res.ok };
  } catch {
    return {
      ok: false,
      error: res.ok ? "invalid_response" : "race_server_error",
    };
  }
};

const requestRace = async (url: string, init?: RequestInit): Promise<RaceApiResponse> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    return parseRaceResponse(res);
  } catch {
    return { ok: false, error: "network_unavailable" };
  } finally {
    window.clearTimeout(timeout);
  }
};

const postRace = async (url: string, body: Record<string, unknown>): Promise<RaceApiResponse> => (
  requestRace(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
);

export const createRaceRoom = (hostId: string, name: string) => (
  postRace("/api/race/create", { hostId, name })
);

export const joinRaceRoom = (code: string, playerId: string, name: string) => (
  postRace("/api/race/join", { code, playerId, name })
);

export const setRaceReady = (code: string, playerId: string, ready: boolean) => (
  postRace("/api/race/ready", { code, playerId, ready })
);

export const startRaceRoom = (code: string, hostId: string) => (
  postRace("/api/race/start", { code, hostId })
);

export const updateRaceProgress = (code: string, playerId: string, pct: number, x: number, y: number) => (
  postRace("/api/race/progress", { code, playerId, pct, x, y })
);

export const finishRaceRoom = (code: string, playerId: string) => (
  postRace("/api/race/finish", { code, playerId })
);

export const getRaceRoom = (code: string) => (
  requestRace(`/api/race/room?code=${encodeURIComponent(code)}`)
);
