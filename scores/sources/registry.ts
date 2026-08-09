/**
 * Legacy thin registry kept for UI filters.
 * Prefer competitions collection; this maps enabled competition ids.
 */
import type { ScoreSource } from "./types";

const ALL_SOURCES: ScoreSource[] = [
  { id: "manual", name: "Manual / Admin", sport: "other", enabled: true },
  { id: "fcl", name: "FCL Demo", sport: "football", enabled: true },
  { id: "premier-league", name: "Premier League", sport: "football", enabled: true },
  { id: "serie-a", name: "Serie A", sport: "football", enabled: true },
  { id: "nba", name: "NBA Demo", sport: "basketball", enabled: true },
  { id: "nbl", name: "NBL", sport: "basketball", enabled: true },
];

export function listSources(includeDisabled = false): ScoreSource[] {
  return includeDisabled ? [...ALL_SOURCES] : ALL_SOURCES.filter((s) => s.enabled);
}

export function getSource(id: string): ScoreSource | undefined {
  return ALL_SOURCES.find((s) => s.id === id);
}

export function isSourceEnabled(id: string): boolean {
  return getSource(id)?.enabled === true;
}
