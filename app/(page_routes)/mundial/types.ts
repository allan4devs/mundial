import type { BettingFavorite } from "@/lib/mundial/betting";
import type { LiveMatchStats } from "@/lib/mundial/live-stats";

export type MundialStage = "group" | "round32" | "round16" | "quarterfinal" | "semifinal" | "thirdPlace" | "final";
export type WinnerPick = "home" | "away" | null;
export type WinnerPickMethod = "extraTime" | "penalties" | null;
export type MatchDecisionMethod = "regular" | "extraTime" | "penalties";
export type ViewMode = "next" | "mine" | "players" | "bracket";
export type LiveMatchStatus = "scheduled" | "live" | "halftime" | "fulltime";
export type LiveEventType = "goal" | "penalty" | "yellow" | "red" | "var" | "substitution" | "note";
export type LiveEventTeam = "home" | "away" | null;

export type LiveMatchEvent = {
  id: string;
  type: LiveEventType;
  team: LiveEventTeam;
  minute: number | null;
  player: string;
  note: string;
  createdAt: string | null;
};

export type MundialMatch = {
  id: string;
  number: number;
  stage: MundialStage;
  stageLabel: string;
  group: string | null;
  date: string;
  kickoffAt: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeSeed: string | null;
  awaySeed: string | null;
  homeFinalScore: number | null;
  awayFinalScore: number | null;
  homeRegulationScore: number | null;
  awayRegulationScore: number | null;
  actualWinner: WinnerPick;
  decisionMethod?: MatchDecisionMethod | null;
  liveStatus: LiveMatchStatus;
  liveMinute: number | null;
  homeLiveScore: number | null;
  awayLiveScore: number | null;
  liveNote: string;
  liveEvents: LiveMatchEvent[];
  liveStats: LiveMatchStats;
  liveUpdatedAt: string | null;
  liveMinuteUpdatedAt: string | null;
  bettingFavorite: BettingFavorite | null;
  closed: boolean;
  sortOrder: number;
};

export type PenalitosRole = "goalkeeper" | "shooter";
export type PenalitosDirection = "left" | "center" | "right";
export type PenalitosStatus = "waiting" | "choosing" | "finished";

export type PenalitosPlayer = {
  visitorId: string;
  name: string;
};

export type PenalitosGame = {
  id: string;
  status: PenalitosStatus;
  goalkeeper: PenalitosPlayer | null;
  shooter: PenalitosPlayer | null;
  goalkeeperChoice: PenalitosDirection | null;
  shooterChoice: PenalitosDirection | null;
  winner: PenalitosRole | null;
  outcome: "goal" | "save" | null;
  chooseDeadline: string | null;   // ISO string
  resolvedAt: string | null;       // ISO string
  finishedUntil: string | null;    // ISO string
  roundNumber: number;
  startedAt: string;               // ISO string
};

export type PenalitosQueueEntry = {
  visitorId: string;
  name: string;
  joinedAt: string;
  preferredRole: PenalitosRole;
};

export type PenalitosRoundHistory = {
  gameId: string;
  roundNumber: number;
  goalkeeper: PenalitosPlayer | null;
  shooter: PenalitosPlayer | null;
  goalkeeperChoice: PenalitosDirection;
  shooterChoice: PenalitosDirection;
  winner: PenalitosRole;
  outcome: "goal" | "save";
  resolvedAt: string;
};

export type Prediction = {
  id: string;
  matchId: string;
  matchNumber: number | null;
  playerName: string;
  homeScore: number;
  awayScore: number;
  winnerPick: WinnerPick;
  winnerPickMethod: WinnerPickMethod;
  locked: boolean;
  lockedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PlayerProgress = {
  key: string;
  playerName: string;
  totalPredictions: number;
  lockedPredictions: number;
  updatedAt: string | null;
};

export type PredictionsResponse = {
  matches: MundialMatch[];
  predictions: Prediction[];
  players: PlayerProgress[];
  leaderboard?: LeaderboardEntry[];
};

export type LeaderboardEntry = {
  playerName: string;
  normalizedName: string;
  totalPoints: number;
  totalPredictions: number;
  scoredPredictions: number;
  exactScores: number;
  correctOutcomes: number;
};

export type Draft = {
  homeScore: number;
  awayScore: number;
  winnerPick: WinnerPick;
  winnerPickMethod: WinnerPickMethod;
  locked: boolean;
  dirty: boolean;
  saved: boolean;
  updatedAt: string | null;
};
