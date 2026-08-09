import type React from 'react';
import type * as THREE from 'three';
import type { KeyState } from '../hooks/useKeyboard';
import type { BulletState, LivePlatform, OtherPlayerView, PowerUpKind } from './entities';
import type { GameState, LeaderboardEntry } from './game';
import type { LevelData } from './level';

export interface GameProviderProps {
  children: React.ReactNode;
  sharedPosRef?: React.MutableRefObject<THREE.Vector3>;
  onRaceWin?: () => void;
  raceLevelIndex?: number;
  racePlayerName?: string;
  startLevel?: number;
  otherPlayers?: OtherPlayerView[];
}

export interface ActivePowerUps {
  ruby: boolean;
  sapphire: boolean;
  rubyRemaining: number;
  sapphireRemaining: number;
  rubyDuration: number;
  sapphireDuration: number;
}

export interface GameContextValue {
  state: GameState;
  leaderboard: LeaderboardEntry[];
  level: LevelData;
  levelKey: number;
  keys: React.MutableRefObject<KeyState>;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  playerVelRef: React.MutableRefObject<THREE.Vector3>;
  bulletsRef: React.MutableRefObject<BulletState[]>;
  pendingPowerUpRef: React.MutableRefObject<PowerUpKind | null>;
  playerImmuneRef: React.MutableRefObject<boolean>;
  stompBounceRef: React.MutableRefObject<boolean>;
  platformRegistryRef: React.MutableRefObject<Map<string, LivePlatform>>;
  activePowerUps: ActivePowerUps;
  handlePowerUpChange: (ruby: boolean, sapphire: boolean, rubyRemaining?: number, sapphireRemaining?: number) => void;
  handlePlayerHit: () => void;
  handleTrap: () => void;
  handleDie: () => void;
  handleWin: () => void;
  registerPlayer: (name: string) => void;
  clearPlayer: () => void;
  collectCrystal: (id: string) => void;
  respawn: () => void;
  restart: () => void;
  enterLevel: (levelIndex: number) => void;
  resetAdventure: () => void;
}

export type GameRuntimeContextValue = Pick<
  GameContextValue,
  | 'keys'
  | 'playerPosRef'
  | 'playerVelRef'
  | 'bulletsRef'
  | 'pendingPowerUpRef'
  | 'playerImmuneRef'
  | 'stompBounceRef'
  | 'platformRegistryRef'
  | 'handlePowerUpChange'
  | 'handlePlayerHit'
  | 'handleTrap'
  | 'handleDie'
  | 'handleWin'
  | 'collectCrystal'
>;

export interface GameSceneContextValue {
  gameStatus: GameState['status'];
  level: LevelData;
  levelKey: number;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  runtimeValue: GameRuntimeContextValue;
  otherPlayers: OtherPlayerView[];
}
