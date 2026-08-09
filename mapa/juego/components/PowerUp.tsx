'use client';
import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PowerUpData } from '../types';
import { useGameRuntimeContext } from '../context/GameContext';

interface Props {
  data: PowerUpData;
}

const COLLECT_DIST = 0.9;
const PICKUP_ANIM_DURATION = 0.22;

const RUBY_COLOR    = '#ff1744';
const RUBY_EMISSIVE = '#b71c1c';
const SAPPH_COLOR    = '#1e88e5';
const SAPPH_EMISSIVE = '#0d47a1';

export const PowerUp = memo(function PowerUp({ data }: Props) {
  const { playerPosRef, pendingPowerUpRef } = useGameRuntimeContext();
  const groupRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const gemMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  const pickupT = useRef<number | null>(null);
  const granted = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    phase.current += delta * 2;

    const group = groupRef.current;
    group.rotation.y += delta * (pickupT.current === null ? 2 : 10);
    group.position.y = data.position[1] + Math.sin(phase.current) * 0.14;

    if (pickupT.current !== null) {
      pickupT.current += delta;
      const progress = Math.min(pickupT.current / PICKUP_ANIM_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const scale = Math.max(0.04, 1 - eased * 0.9);
      const opacity = Math.max(0, 1 - eased);

      group.position.y += eased * 0.42;
      group.scale.setScalar(scale);

      if (ringMatRef.current) ringMatRef.current.opacity = 0.5 * opacity;
      if (gemMatRef.current) gemMatRef.current.opacity = opacity;
      if (coreMatRef.current) coreMatRef.current.opacity = 0.7 * opacity;
      if (lightRef.current) lightRef.current.intensity = 1.8 * opacity;

      if (progress >= 1) {
        group.visible = false;
      }
      return;
    }

    const dx = Math.abs(playerPosRef.current.x - data.position[0]);
    const dy = Math.abs(playerPosRef.current.y - group.position.y);
    if (dx < COLLECT_DIST && dy < COLLECT_DIST) {
      if (!granted.current) {
        granted.current = true;
        pendingPowerUpRef.current = data.kind;
        pickupT.current = 0;
      }
    }
  });

  const isRuby = data.kind === 'ruby';
  const color    = isRuby ? RUBY_COLOR    : SAPPH_COLOR;
  const emissive = isRuby ? RUBY_EMISSIVE : SAPPH_EMISSIVE;
  const lightColor = isRuby ? '#ff1744' : '#1e88e5';

  return (
    <group ref={groupRef} position={data.position}>
      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.04, 8, 24]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={1.5}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Main gem */}
      <mesh>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          ref={gemMatRef}
          color={color}
          emissive={emissive}
          emissiveIntensity={2.2}
          roughness={0.1}
          metalness={0.4}
          transparent
          opacity={1}
        />
      </mesh>

      {/* Inner smaller gem */}
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color="#ffffff"
          emissive={color}
          emissiveIntensity={3}
          transparent
          opacity={0.7}
        />
      </mesh>

      <pointLight ref={lightRef} color={lightColor} intensity={1.8} distance={2.5} decay={2} />
    </group>
  );
});
