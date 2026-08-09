'use client';
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import type {
  BulletState,
  GameContextValue,
  GameProviderProps,
  GameRuntimeContextValue,
  GameSceneContextValue,
  LivePlatform,
  OtherPlayerView,
  PowerUpKind,
} from '../types';
import { useGameState } from '../hooks/useGameState';
import { useKeyboard } from '../hooks/useKeyboard';
import { GAME_LEVELS } from '../data/levelData';
import { RUBY_DURATION, SAPPH_DURATION } from '../constants/physics';

const GameContext = createContext<GameContextValue | null>(null);
const GameRuntimeContext = createContext<GameRuntimeContextValue | null>(null);
const GameSceneContext = createContext<GameSceneContextValue | null>(null);

const NO_OTHER_PLAYERS: OtherPlayerView[] = [];

export function GameProvider({
  children,
  sharedPosRef,
  onRaceWin,
  raceLevelIndex,
  racePlayerName,
  startLevel,
  otherPlayers = NO_OTHER_PLAYERS,
}: GameProviderProps) {
  const {
    state,
    leaderboard,
    registerPlayer,
    clearPlayer,
    collectCrystal,
    dieFromFall,
    dieFromEnemy,
    dieFromTrap,
    respawn,
    win,
    restart,
    enterLevel,
    preSelectLevel,
    resetAdventure,
  } = useGameState();

  const effectiveLevelIndex = raceLevelIndex ?? state.currentLevelIndex;
  const level = GAME_LEVELS[effectiveLevelIndex] ?? GAME_LEVELS[0];

  const keys = useKeyboard();
  const internalPosRef = useRef(new THREE.Vector3(...level.spawnPosition));
  const playerPosRef = sharedPosRef ?? internalPosRef;
  const playerVelRef = useRef(new THREE.Vector3());
  const bulletsRef = useRef<BulletState[]>([]);
  const pendingPowerUpRef = useRef<PowerUpKind | null>(null);
  const playerImmuneRef = useRef(false);
  const stompBounceRef = useRef(false);
  const platformRegistryRef = useRef<Map<string, LivePlatform>>(new Map());

  const [activePowerUps, setActivePowerUps] = useState({
    ruby: false,
    sapphire: false,
    rubyRemaining: 0,
    sapphireRemaining: 0,
    rubyDuration: RUBY_DURATION,
    sapphireDuration: SAPPH_DURATION,
  });

  const handlePowerUpChange = useCallback((
    ruby: boolean,
    sapphire: boolean,
    rubyRemaining = 0,
    sapphireRemaining = 0,
  ) => {
    const nextRubyRemaining = ruby ? Math.max(0, rubyRemaining) : 0;
    const nextSapphireRemaining = sapphire ? Math.max(0, sapphireRemaining) : 0;
    const roundedRuby = Math.ceil(nextRubyRemaining * 10) / 10;
    const roundedSapphire = Math.ceil(nextSapphireRemaining * 10) / 10;

    startTransition(() => {
      setActivePowerUps((current) => (
        current.ruby === ruby &&
        current.sapphire === sapphire &&
        current.rubyRemaining === roundedRuby &&
        current.sapphireRemaining === roundedSapphire
          ? current
          : {
              ruby,
              sapphire,
              rubyRemaining: roundedRuby,
              sapphireRemaining: roundedSapphire,
              rubyDuration: RUBY_DURATION,
              sapphireDuration: SAPPH_DURATION,
            }
      ));
    });
  }, []);

  const handlePlayerHit = useCallback(() => {
    if (!playerImmuneRef.current) dieFromEnemy();
  }, [dieFromEnemy]);

  const handleTrap = useCallback(() => {
    if (!playerImmuneRef.current) dieFromTrap();
  }, [dieFromTrap]);

  const handleWin = useCallback(() => {
    win();
    onRaceWin?.();
  }, [win, onRaceWin]);

  // In race mode: auto-register with race name and enter the level immediately
  useEffect(() => {
    if (raceLevelIndex == null || state.status !== 'map') return;
    registerPlayer(racePlayerName ?? 'Fantasma');
    enterLevel(raceLevelIndex);
  }, [raceLevelIndex, state.status, registerPlayer, enterLevel, racePlayerName]);

  // Deep-link from /mapa: pre-select the level on the map screen without starting
  useEffect(() => {
    if (startLevel == null || raceLevelIndex != null || state.status !== 'map') return;
    preSelectLevel(startLevel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startLevel, state.status]);

  // Auto-respawn 2s after death (not game over)
  useEffect(() => {
    if (state.status !== 'dead') return;
    const id = setTimeout(respawn, 2000);
    return () => clearTimeout(id);
  }, [state.status, respawn]);

  // Snap player position and clear bullets on respawn. Dynamic platforms
  // self-manage their registry entries via mount/unmount (Level is keyed by
  // restartKey), so we must NOT clear the registry here — a passive effect
  // would race with and wipe the children's layout-effect registration.
  useEffect(() => {
    if (state.status === 'playing') {
      playerPosRef.current.set(...level.spawnPosition);
      bulletsRef.current = [];
    }
  }, [level.spawnPosition, state.restartKey, state.status]);

  const value = useMemo<GameContextValue>(() => ({
    state,
    leaderboard,
    level,
    levelKey: state.restartKey,
    keys,
    playerPosRef,
    playerVelRef,
    bulletsRef,
    pendingPowerUpRef,
    playerImmuneRef,
    stompBounceRef,
    platformRegistryRef,
    activePowerUps,
    handlePowerUpChange,
    handlePlayerHit,
    handleTrap,
    handleDie: dieFromFall,
    handleWin,
    registerPlayer,
    clearPlayer,
    collectCrystal,
    respawn,
    restart,
    enterLevel,
    resetAdventure,
  }), [
    state, leaderboard, level, keys, playerPosRef, playerVelRef, bulletsRef, pendingPowerUpRef, playerImmuneRef,
    stompBounceRef, activePowerUps, handlePowerUpChange, handlePlayerHit, handleTrap, dieFromFall, handleWin,
    registerPlayer, clearPlayer, collectCrystal, respawn, restart, enterLevel, resetAdventure,
  ]);

  const runtimeValue = useMemo<GameRuntimeContextValue>(() => ({
    keys,
    playerPosRef,
    playerVelRef,
    bulletsRef,
    pendingPowerUpRef,
    playerImmuneRef,
    stompBounceRef,
    platformRegistryRef,
    handlePowerUpChange,
    handlePlayerHit,
    handleTrap,
    handleDie: dieFromFall,
    handleWin,
    collectCrystal,
  }), [
    keys,
    playerPosRef,
    playerVelRef,
    bulletsRef,
    pendingPowerUpRef,
    playerImmuneRef,
    stompBounceRef,
    handlePowerUpChange,
    handlePlayerHit,
    handleTrap,
    dieFromFall,
    handleWin,
    collectCrystal,
  ]);

  const sceneValue = useMemo<GameSceneContextValue>(() => ({
    gameStatus: state.status,
    level,
    levelKey: state.restartKey,
    playerPosRef,
    runtimeValue,
    otherPlayers,
  }), [
    level,
    playerPosRef,
    runtimeValue,
    state.restartKey,
    state.status,
    otherPlayers,
  ]);

  return (
    <GameRuntimeContext.Provider value={runtimeValue}>
      <GameSceneContext.Provider value={sceneValue}>
        <GameContext.Provider value={value}>{children}</GameContext.Provider>
      </GameSceneContext.Provider>
    </GameRuntimeContext.Provider>
  );
}

export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within a GameProvider');
  return ctx;
}

export function GameRuntimeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: GameRuntimeContextValue;
}) {
  return (
    <GameRuntimeContext.Provider value={value}>
      {children}
    </GameRuntimeContext.Provider>
  );
}

export function useGameSceneContext(): GameSceneContextValue {
  const ctx = useContext(GameSceneContext);
  if (!ctx) throw new Error('useGameSceneContext must be used within a GameProvider');
  return ctx;
}

export function useGameRuntimeContext(): GameRuntimeContextValue {
  const ctx = useContext(GameRuntimeContext);
  if (!ctx) throw new Error('useGameRuntimeContext must be used within a GameProvider');
  return ctx;
}
