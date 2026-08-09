export type MatchStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled"
  | "fulltime";

export type ViewMode = "live" | "next" | "finished" | "mine" | "ranking";

export type ScoreMatch = {
  id: string;
  competitionId: string;
  sourceId: string;
  league: string;
  sport: string;
  number: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  startsAt: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  homeLiveScore: number | null;
  awayLiveScore: number | null;
  liveStatus: MatchStatus;
  status: MatchStatus;
  liveMinute: number | null;
  liveNote: string;
  forceClosed: boolean;
  closed: boolean;
  predictionClosesAt?: string;
  sortOrder: number;
};

export type ScorePrediction = {
  id: string;
  matchId: string;
  userId?: string;
  playerName: string;
  homeScore: number;
  awayScore: number;
  locked: boolean;
  lockedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  scoring?: { points: number; exact: boolean; correctOutcome: boolean } | null;
};

export type LeaderboardEntry = {
  userId?: string;
  playerName: string;
  totalPoints: number;
  totalPredictions: number;
  exactScores: number;
  correctOutcomes: number;
  hitRate?: number;
};

export type CompetitionInfo = {
  id: string;
  name: string;
  sport: string;
  syncHealth?: string;
  enabled?: boolean;
};

export type Viewer = { userId: string; displayName: string } | null;

export type Draft = {
  homeScore: number;
  awayScore: number;
  dirty: boolean;
  saved: boolean;
  updatedAt: string | null;
};

export type BootstrapResponse = {
  viewer: Viewer;
  competitions: CompetitionInfo[];
  matches: ScoreMatch[];
  myPredictions: ScorePrediction[];
  publicPredictions: ScorePrediction[];
  leaderboard: LeaderboardEntry[];
  serverTime: string;
};
