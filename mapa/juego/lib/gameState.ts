import type { DeathCause, GameState } from '../types';
import { GAME_LEVELS } from '../data/levelData';
import { DEV_UNLOCK_ALL_LEVELS } from '../constants/storage';

export const PLAYER_NAME_MAX_LENGTH = 24;
export const DEATH_MESSAGE_COUNT = 4;

export const normalizePlayerName = (name: string) => (
  name.trim().slice(0, PLAYER_NAME_MAX_LENGTH)
);

export const randomDeathMessageIndex = () => (
  Math.floor(Math.random() * DEATH_MESSAGE_COUNT)
);

export const clampLevelIndex = (levelIndex: number) => (
  Math.max(0, Math.min(levelIndex, GAME_LEVELS.length - 1))
);

export const makeInitialState = (levelIndex = 0): GameState => ({
  lives: 3,
  score: 0,
  crystals: 0,
  lifetimeCrystals: 0,
  totalCrystals: GAME_LEVELS[levelIndex]?.collectibles.length ?? 0,
  status: 'map',
  currentLevelIndex: levelIndex,
  unlockedStationIndex: DEV_UNLOCK_ALL_LEVELS ? GAME_LEVELS.length : 0,
  restartKey: 0,
  playerName: null,
  deathCause: null,
  deathMessageIdx: 0,
});

export const applyDeath = (state: GameState, deathCause: DeathCause): GameState => {
  const lives = state.lives - 1;
  return {
    ...state,
    lives,
    status: lives <= 0 ? 'gameover' : 'dead',
    deathCause,
    deathMessageIdx: randomDeathMessageIndex(),
  };
};

export const applyStoredPlayer = (
  state: GameState,
  safeName: string,
  entry?: { crystals: number; bestScore: number },
): GameState => ({
  ...state,
  playerName: safeName || null,
  lifetimeCrystals: entry?.crystals ?? state.lifetimeCrystals,
  score: Math.max(state.score, entry?.bestScore ?? 0),
});

export const applyRegisteredPlayer = (
  state: GameState,
  safeName: string,
  entry?: { crystals: number; bestScore: number },
): GameState => ({
  ...state,
  playerName: safeName,
  lifetimeCrystals: entry?.crystals ?? 0,
  score: Math.max(state.score, entry?.bestScore ?? 0),
});

export const applyCrystalCollect = (state: GameState): GameState => ({
  ...state,
  crystals: state.crystals + 1,
  lifetimeCrystals: state.lifetimeCrystals + 1,
  score: state.score + 100,
});

export const getWinState = (state: GameState) => {
  const nextStationIndex = Math.min(state.currentLevelIndex + 1, GAME_LEVELS.length);
  const isComplete = state.currentLevelIndex >= GAME_LEVELS.length - 1;
  const newUnlocked = Math.max(state.unlockedStationIndex, nextStationIndex);

  return {
    newUnlocked,
    nextState: {
      ...state,
      status: isComplete ? 'complete' : 'map',
      score: state.score + 500,
      crystals: 0,
      totalCrystals: GAME_LEVELS[Math.min(state.currentLevelIndex + 1, GAME_LEVELS.length - 1)]?.collectibles.length ?? state.totalCrystals,
      unlockedStationIndex: newUnlocked,
      currentLevelIndex: isComplete ? state.currentLevelIndex : state.currentLevelIndex + 1,
    } satisfies GameState,
  };
};

export const applyRestart = (state: GameState): GameState => ({
  ...state,
  lives: 3,
  crystals: 0,
  totalCrystals: GAME_LEVELS[state.currentLevelIndex]?.collectibles.length ?? state.totalCrystals,
  status: 'playing',
  restartKey: state.restartKey + 1,
  deathCause: null,
});

export const applyEnterLevel = (state: GameState, levelIndex: number): GameState => {
  const clamped = clampLevelIndex(levelIndex);
  const level = GAME_LEVELS[clamped];
  const unlockedStationIndex = DEV_UNLOCK_ALL_LEVELS
    ? GAME_LEVELS.length
    : Math.max(state.unlockedStationIndex, clamped);

  return {
    ...state,
    lives: 3,
    crystals: 0,
    totalCrystals: level.collectibles.length,
    status: 'playing',
    currentLevelIndex: clamped,
    unlockedStationIndex,
    restartKey: state.restartKey + 1,
    deathCause: null,
  };
};

export const applyResetAdventure = (state: GameState): GameState => ({
  ...makeInitialState(),
  playerName: state.playerName,
  restartKey: state.restartKey + 1,
});
