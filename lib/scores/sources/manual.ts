import type { ScoreSource } from "./types";

/** Admin-created matches with no external feed. Always on. */
export const manualSource: ScoreSource = {
  id: "manual",
  name: "Manual / Admin",
  sport: "other",
  enabled: true,
};
