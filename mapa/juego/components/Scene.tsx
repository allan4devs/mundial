'use client';
/* eslint-disable react-hooks/immutability */
import { memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Player } from './Player';
import { Level } from './Level';
import { Environment } from './Environment';
import { Bullets } from './Bullets';
import { OtherPlayers } from './OtherPlayers';
import type { GameState, LevelData, OtherPlayerView } from '../types';

function CameraRig({ targetRef }: { targetRef: React.MutableRefObject<THREE.Vector3> }) {
  const { camera } = useThree();

  useFrame(() => {
    const t = targetRef.current;
    const lerp = THREE.MathUtils.lerp;
    camera.position.x = lerp(camera.position.x, t.x,                     0.075);
    camera.position.y = lerp(camera.position.y, Math.max(t.y + 2.8, 1.5), 0.075);
    camera.lookAt(camera.position.x, camera.position.y - 2.8, 0);
  });

  return null;
}

export const Scene = memo(function Scene({
  level,
  levelKey,
  playerPosRef,
  gameStatus,
  otherPlayers,
}: {
  level: LevelData;
  levelKey: number;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  gameStatus: GameState['status'];
  otherPlayers?: OtherPlayerView[];
}) {
  return (
    <>
      <CameraRig targetRef={playerPosRef} />
      <Environment level={level} />
      <Player level={level} gameStatus={gameStatus} />
      <Bullets />
      {otherPlayers && otherPlayers.length > 0 && <OtherPlayers players={otherPlayers} />}
      {/* key forces a full remount of Level (and children) on restart */}
      <Level key={levelKey} level={level} gameStatus={gameStatus} />
    </>
  );
});
