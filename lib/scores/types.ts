/**
 * Domain types for the scores backend.
 *
 * The client-side view models (ScoreMatch, BootstrapResponse, …) live in
 * app/(page_routes)/scores/types.ts — these are the shapes the store, the
 * scoring engine and the league sources agree on.
 */

/** "other" scores like basketball (see maxScoreForSport). */
export type Sport = "football" | "basketball" | "other";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled";

/** Status as reported by a live provider before normalization. */
export type LiveStatus = MatchStatus | "fulltime";

export type WinnerSide = "home" | "away" | "draw";

export type SyncMode = "manual" | "provider";

export type SyncHealth = "healthy" | "stale" | "failing" | "error" | "never_synced";

export type Competition = {
  id: string;
  name: string;
  sport: Sport;
  enabled: boolean;
  syncMode: SyncMode;
  provider: string;
  providerCompetitionId?: string;
  syncHealth: SyncHealth;
  lastSyncedAt?: Date | string | null;
};

export type Match = {
  id: string;
  competitionId: string;
  sourceId: string;
  league: string;
  sport: Sport;
  number: number;
  homeTeam: string;
  awayTeam: string;
  /** ISO string on the wire, Date inside MatchDoc. */
  startsAt: string;
  kickoffAt: string;
  predictionClosesAt: string;
  venue?: string;
  timezone?: string;
  status: MatchStatus;
  liveStatus: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeLiveScore: number | null;
  awayLiveScore: number | null;
  liveMinute: number | null;
  liveNote: string;
  /** Basketball period / football half indicator. */
  period?: string | null;
  clock?: string | null;
  forceClosed: boolean;
  resultVersion?: number;
  provider?: string | null;
  providerMatchId?: string | null;
  sortOrder?: number;
};

export type Prediction = {
  id: string;
  matchId: string;
  userId?: string;
  playerName: string;
  displayNameSnapshot?: string;
  homeScore: number;
  awayScore: number;
  locked: boolean;
  lockedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  scoring?: {
    points: number;
    exact: boolean;
    correctOutcome: boolean;
    ruleVersion: string;
  } | null;
};

export type LeaderboardEntry = {
  userId?: string;
  playerName: string;
  totalPoints: number;
  totalPredictions: number;
  exactScores: number;
  correctOutcomes: number;
  /** 0 until the player reaches the minimum number of picks. */
  hitRate: number;
};

export type Draft = {
  homeScore: number;
  awayScore: number;
  dirty: boolean;
  saved: boolean;
  updatedAt: string | null;
};
