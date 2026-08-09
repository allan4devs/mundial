export type LiveTeamStats = {
  possessionPct: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  yellowCards: number | null;
  redCards: number | null;
  corners: number | null;
  fouls: number | null;
  saves: number | null;
  // Broadcast stats (FIFA WC 2026)
  assists: number | null;
  passesCompleted: number | null;
  distanceCovered: number | null; // decimal km
  topSpeed: number | null;        // decimal km/h
  foulsFor: number | null;
};

export type LiveMatchStats = {
  home: LiveTeamStats;
  away: LiveTeamStats;
};

export const EMPTY_LIVE_TEAM_STATS: LiveTeamStats = {
  possessionPct: null,
  shots: null,
  shotsOnTarget: null,
  yellowCards: null,
  redCards: null,
  corners: null,
  fouls: null,
  saves: null,
  assists: null,
  passesCompleted: null,
  distanceCovered: null,
  topSpeed: null,
  foulsFor: null,
};

export const EMPTY_LIVE_MATCH_STATS: LiveMatchStats = {
  home: EMPTY_LIVE_TEAM_STATS,
  away: EMPTY_LIVE_TEAM_STATS,
};

// These keys store decimals (1 decimal place); all others are integers
export const DECIMAL_STAT_KEYS: ReadonlyArray<keyof LiveTeamStats> = ["distanceCovered", "topSpeed"];

const STAT_KEYS = Object.keys(EMPTY_LIVE_TEAM_STATS) as Array<keyof LiveTeamStats>;

function finiteNumber(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : null;
}

function finiteDecimal(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n * 10) / 10) : null;
}

function readTeamStats(value: unknown): LiveTeamStats {
  const raw = value && typeof value === "object" ? value as Partial<Record<keyof LiveTeamStats, unknown>> : {};
  const stats = { ...EMPTY_LIVE_TEAM_STATS };

  for (const key of STAT_KEYS) {
    if (DECIMAL_STAT_KEYS.includes(key)) {
      stats[key] = finiteDecimal(raw[key]);
    } else {
      const parsed = finiteNumber(raw[key]);
      stats[key] = key === "possessionPct" && parsed !== null ? Math.min(100, parsed) : parsed;
    }
  }

  return stats;
}

export function serializeLiveMatchStats(value: unknown): LiveMatchStats {
  const raw = value && typeof value === "object" ? value as { home?: unknown; away?: unknown } : {};
  return {
    home: readTeamStats(raw.home),
    away: readTeamStats(raw.away),
  };
}

export function hasAnyLiveStats(stats: LiveMatchStats | null | undefined) {
  if (!stats) return false;
  return STAT_KEYS.some((key) => stats.home[key] !== null || stats.away[key] !== null);
}
