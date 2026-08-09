'use client';
import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OtherPlayerView } from '../types';

const LERP_FACTOR = 0.18;

function GhostAvatar({ player }: { player: OtherPlayerView }) {
  const groupRef = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(player.x, player.y, 0));

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    posRef.current.x = THREE.MathUtils.lerp(posRef.current.x, player.x, LERP_FACTOR);
    posRef.current.y = THREE.MathUtils.lerp(posRef.current.y, player.y, LERP_FACTOR);
    group.position.set(posRef.current.x, posRef.current.y, 0);
  });

  return (
    <group ref={groupRef} position={[player.x, player.y, 0]}>
      <mesh>
        <sphereGeometry args={[0.34, 16, 16]} />
        <meshStandardMaterial
          color={player.color}
          emissive={player.color}
          emissiveIntensity={0.6}
          transparent
          opacity={player.finished ? 0.32 : 0.68}
        />
      </mesh>
      <mesh position={[0, -0.27, 0]}>
        <coneGeometry args={[0.32, 0.4, 8, 1, true]} />
        <meshStandardMaterial
          color={player.color}
          emissive={player.color}
          emissiveIntensity={0.45}
          transparent
          opacity={player.finished ? 0.22 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color={player.color} intensity={1.4} distance={3} decay={2} />
    </group>
  );
}

export const OtherPlayers = memo(function OtherPlayers({ players }: { players: OtherPlayerView[] }) {
  return (
    <>
      {players.map((player) => (
        <GhostAvatar key={player.id} player={player} />
      ))}
    </>
  );
});
