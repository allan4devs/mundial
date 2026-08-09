export type DeathCause = 'fall' | 'enemy' | 'trap';

export type GameStatus = 'map' | 'playing' | 'dead' | 'gameover' | 'win' | 'complete';

export interface GameState {
  lives: number;
  score: number;
  crystals: number;
  lifetimeCrystals: number;
  totalCrystals: number;
  status: GameStatus;
  currentLevelIndex: number;
  unlockedStationIndex: number;
  restartKey: number;
  playerName: string | null;
  deathCause: DeathCause | null;
  deathMessageIdx: number;
}

export interface LeaderboardEntry {
  name: string;
  crystals: number;
  bestScore: number;
  lastPlayedAt: number;
}
