export type UfcFightStatus = "scheduled" | "live" | "finished";
export type CornerPick = "red" | "blue" | null;
export type MethodPick = "ko_tko" | "submission" | "decision" | null;
export type UfcViewMode = "card" | "mine" | "players";

export type UfcFight = {
  id: string;
  number: number;
  section: "prelim" | "main";
  sectionLabel: string;
  weightClass: string;
  weightLbs: number;
  titleFight: boolean;
  titleLabel: string | null;
  scheduledRounds: number;
  redCorner: string;
  blueCorner: string;
  redRecord: string | null;
  blueRecord: string | null;
  scheduledAt: string;
  venue: string;
  winnerCorner: CornerPick;
  method: MethodPick;
  endRound: number | null;
  endTime: string | null;
  liveStatus: UfcFightStatus;
  liveNote: string;
  closed: boolean;
  sortOrder: number;
};

export type UfcPrediction = {
  id: string;
  fightId: string;
  fightNumber: number | null;
  playerName: string;
  cornerPick: CornerPick;
  methodPick: MethodPick;
  locked: boolean;
  lockedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UfcPlayerProgress = {
  key: string;
  playerName: string;
  totalPredictions: number;
  lockedPredictions: number;
  updatedAt: string | null;
};

export type UfcPredictionsResponse = {
  fights: UfcFight[];
  predictions: UfcPrediction[];
  players: UfcPlayerProgress[];
};

export type UfcLeaderboardEntry = {
  playerName: string;
  normalizedName: string;
  totalPoints: number;
  totalPredictions: number;
  scoredPredictions: number;
  exactPicks: number;
  correctWinners: number;
};

export type UfcDraft = {
  cornerPick: CornerPick;
  methodPick: MethodPick;
  locked: boolean;
  dirty: boolean;
  saved: boolean;
  updatedAt: string | null;
};
