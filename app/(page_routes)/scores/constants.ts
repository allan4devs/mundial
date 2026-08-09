export const BOOTSTRAP_API = "/api/scores/bootstrap";
export const PREDICTIONS_API = "/api/scores/predictions";
export const AUTH_API = "/api/scores/auth";
export const POLL_MS = 20_000;
export const REQUEST_TIMEOUT_MS = 12_000;

export const VIEW_OPTIONS: Array<{ id: "live" | "next" | "finished" | "mine" | "ranking"; label: string }> = [
  { id: "live", label: "En vivo" },
  { id: "next", label: "Proximos" },
  { id: "finished", label: "Finalizados" },
  { id: "mine", label: "Mis picks" },
  { id: "ranking", label: "Ranking" },
];
