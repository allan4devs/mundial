import type { Draft, ViewMode } from "./types";

export const API_URL = "/api/mundial/predictions";
export const REQUEST_TIMEOUT_MS = 12000;
export const TOTAL_MATCHES = 104;
export const STORAGE_KEY = "mundial-player-name";
export const TRUSTED_PLAYER_KEY = "mundial-trusted-player-key";
export const SESSION_KEY = "mundial-session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const EMPTY_DRAFTS: Record<string, Draft> = {};
export const VIEW_OPTIONS: Array<{ id: ViewMode; label: string }> = [
  { id: "next", label: "En Vivo" },
  { id: "mine", label: "Predicciones" },
  { id: "players", label: "Tabla de Líderes" },
  { id: "bracket", label: "Bracket" },
];

export const MUNDIAL_PREMIUM_PRICE_USD = 5;
