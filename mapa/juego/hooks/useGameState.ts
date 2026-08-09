'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, LeaderboardEntry } from '../types';
import { PLAYER_KEY, UNLOCKED_STATION_KEY } from '../constants/storage';
import { readLeaderboard, upsertLeaderboard } from '../lib/leaderboard';
import {
  applyCrystalCollect,
  applyDeath,
  applyEnterLevel,
  applyRegisteredPlayer,
  applyResetAdventure,
  applyRestart,
  applyStoredPlayer,
  clampLevelIndex,
  getWinState,
  makeInitialState,
  normalizePlayerName,
} from '../lib/gameState';

export function useGameState() {
  const [state, setState] = useState<GameState>(() => makeInitialState());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const collectedRef = useRef(new Set<string>());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const storedName = window.localStorage.getItem(PLAYER_KEY);
    const entries = readLeaderboard();
    setLeaderboard(entries);
    if (storedName) {
      const safeName = normalizePlayerName(storedName);
      const entry = entries.find((item) => item.name.toLowerCase() === safeName.toLowerCase());
      setState((s) => applyStoredPlayer(s, safeName, entry));
    }
  }, []);

  const registerPlayer = useCallback((name: string) => {
    const safeName = normalizePlayerName(name);
    if (!safeName) return;
    window.localStorage.setItem(PLAYER_KEY, safeName);
    const entries = upsertLeaderboard(safeName, 0, 0);
    const entry = entries.find((item) => item.name.toLowerCase() === safeName.toLowerCase());
    setLeaderboard(entries);
    setState((s) => applyRegisteredPlayer(s, safeName, entry));
  }, []);

  const clearPlayer = useCallback(() => {
    window.localStorage.removeItem(PLAYER_KEY);
    setState((s) => ({ ...s, playerName: null, status: 'map' }));
  }, []);

  const collectCrystal = useCallback((id: string) => {
    if (collectedRef.current.has(id)) return;
    collectedRef.current.add(id);
    const currentState = stateRef.current;
    const nextScore = currentState.score + 100;
    if (currentState.playerName) {
      setLeaderboard(upsertLeaderboard(currentState.playerName, 1, nextScore));
    }
    setState(applyCrystalCollect);
  }, []);

  const dieFromFall = useCallback(() => {
    setState(s => applyDeath(s, 'fall'));
  }, []);

  const dieFromEnemy = useCallback(() => {
    setState(s => applyDeath(s, 'enemy'));
  }, []);

  const dieFromTrap = useCallback(() => {
    setState(s => applyDeath(s, 'trap'));
  }, []);

  const respawn = useCallback(() => {
    setState(s => ({ ...s, status: 'playing' }));
  }, []);

  const win = useCallback(() => {
    collectedRef.current.clear();
    setState(s => {
      const { newUnlocked, nextState } = getWinState(s);

      try { window.localStorage.setItem(UNLOCKED_STATION_KEY, String(newUnlocked)); } catch {}
      return nextState;
    });
  }, []);

  const restart = useCallback(() => {
    collectedRef.current.clear();
    setState(applyRestart);
  }, []);

  const enterLevel = useCallback((levelIndex: number) => {
    collectedRef.current.clear();
    setState(s => applyEnterLevel(s, levelIndex));
  }, []);

  const resetAdventure = useCallback(() => {
    collectedRef.current.clear();
    setState(applyResetAdventure);
  }, []);

  const preSelectLevel = useCallback((levelIndex: number) => {
    const clamped = clampLevelIndex(levelIndex);
    setState(s => ({ ...s, currentLevelIndex: clamped }));
  }, []);

  return { state, leaderboard, registerPlayer, clearPlayer, collectCrystal, dieFromFall, dieFromEnemy, dieFromTrap, respawn, win, restart, enterLevel, preSelectLevel, resetAdventure };
}
