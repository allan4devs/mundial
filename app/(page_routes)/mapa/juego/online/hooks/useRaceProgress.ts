'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GAME_LEVELS } from '../../data/levelData';
import { updateRaceProgress } from '../lib/raceApi';

export function useRaceProgress(playerId: string) {
  const [myPct, setMyPct] = useState(0);
  const sharedPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopProgressPolling = useCallback(() => {
    if (!progressIntervalRef.current) return;
    clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = null;
  }, []);

  const startProgressPolling = useCallback((code: string, levelIndex: number) => {
    stopProgressPolling();

    const level = GAME_LEVELS[levelIndex] ?? GAME_LEVELS[0];
    const spawnX = level.spawnPosition[0];
    const goalX = level.goalPosition[0];
    const span = goalX - spawnX;

    progressIntervalRef.current = setInterval(async () => {
      const px = sharedPosRef.current.x;
      const py = sharedPosRef.current.y;
      const pct = Math.min(100, Math.max(0, ((px - spawnX) / span) * 100));
      setMyPct(Math.round(pct));

      if (pct >= 100) return;

      try {
        await updateRaceProgress(code, playerId, pct, px, py);
      } catch {}
    }, 250);
  }, [playerId, stopProgressPolling]);

  const resetProgress = useCallback(() => {
    stopProgressPolling();
    setMyPct(0);
  }, [stopProgressPolling]);

  useEffect(() => stopProgressPolling, [stopProgressPolling]);

  return {
    myPct,
    resetProgress,
    setMyPct,
    sharedPosRef,
    startProgressPolling,
    stopProgressPolling,
  };
}
