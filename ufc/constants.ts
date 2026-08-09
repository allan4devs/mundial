import type { UfcDraft, UfcViewMode } from "./types";

export const UFC_API_URL = "/api/ufc/predictions";
export const REQUEST_TIMEOUT_MS = 12000;
export const TOTAL_FIGHTS = 7;
export const STORAGE_KEY = "ufc-freedom-250-player-name";
export const EMPTY_DRAFTS: Record<string, UfcDraft> = {};
export const VIEW_OPTIONS: Array<{ id: UfcViewMode; label: string }> = [
  { id: "card", label: "Card" },
  { id: "mine", label: "Mis picks" },
  { id: "players", label: "Jugadores" },
];

export const METHOD_OPTIONS: Array<{ value: string; label: string; short: string }> = [
  { value: "", label: "Cualquier método", short: "—" },
  { value: "ko_tko", label: "KO / TKO", short: "KO/TKO" },
  { value: "submission", label: "Submission", short: "SUB" },
  { value: "decision", label: "Decision", short: "DEC" },
];
