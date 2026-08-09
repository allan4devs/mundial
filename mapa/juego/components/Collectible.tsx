'use client';
import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CollectibleData } from '../types';
import { useGameRuntimeContext } from '../context/GameContext';

interface Props {
  data: CollectibleData;
}

const COLLECT_DIST = 0.75;
const COLLECT_DIST_SQ = COLLECT_DIST * COLLECT_DIST;
const _vec = new THREE.Vector3();

export const Collectible = memo(function Collectible({ data }: Props) {
  const { playerPosRef, collectCrystal } = useGameRuntimeContext();
  const collected = useRef(false);
  const groupRef = useRef<THREE.Group>(null);
  const phase = useRef((data.id.charCodeAt(1) || 1) * 0.9);
  const gem = data.kind === 'emerald';

  useFrame((_, delta) => {
    if (collected.current || !groupRef.current) return;
    phase.current += delta;

    groupRef.current.rotation.y += delta * 1.25;
    groupRef.current.position.y = data.position[1] + Math.sin(phase.current * 1.8) * 0.1;

    _vec.set(data.position[0], groupRef.current.position.y, data.position[2]);
    if (playerPosRef.current.distanceToSquared(_vec) < COLLECT_DIST_SQ) {
      collected.current = true;
      groupRef.current.visible = false;
      collectCrystal(data.id);
    }
  });

  return (
    <group ref={groupRef} position={data.position}>
      <mesh>
        <sphereGeometry args={[gem ? 0.26 : 0.2, 18, 18]} />
        <meshStandardMaterial
          color={gem ? '#00ff88' : '#f8fbff'}
          emissive={gem ? '#00c060' : '#b9f7ff'}
          emissiveIntensity={gem ? 1.9 : 1.15}
          roughness={0.06}
          metalness={gem ? 0.3 : 0.12}
        />
      </mesh>
      <mesh scale={[1.25, 0.28, 1.25]} position={[0, -0.03, 0]}>
        <torusGeometry args={[gem ? 0.25 : 0.19, 0.022, 8, 18]} />
        <meshStandardMaterial
          color={gem ? '#00ff99' : '#d8f7ff'}
          emissive={gem ? '#00dd66' : '#7de8ff'}
          emissiveIntensity={gem ? 1.1 : 0.6}
          transparent
          opacity={0.78}
        />
      </mesh>
    </group>
  );
});
