'use client';
import * as THREE from 'three';
import { GameProvider } from '../context/GameContext';
import { GameCanvas } from './GameCanvas';
import type { OtherPlayerView } from '../types';

export default function Game({
  sharedPosRef,
  onRaceWin,
  raceLevelIndex,
  racePlayerName,
  startLevel,
  otherPlayers,
}: {
  sharedPosRef?:    React.MutableRefObject<THREE.Vector3>;
  onRaceWin?:       () => void;
  raceLevelIndex?:  number;
  racePlayerName?:  string;
  startLevel?:      number;
  otherPlayers?:    OtherPlayerView[];
} = {}) {
  return (
    <GameProvider
      sharedPosRef={sharedPosRef}
      onRaceWin={onRaceWin}
      raceLevelIndex={raceLevelIndex}
      racePlayerName={racePlayerName}
      startLevel={startLevel}
      otherPlayers={otherPlayers}
    >
      <GameCanvas />
    </GameProvider>
  );
}
