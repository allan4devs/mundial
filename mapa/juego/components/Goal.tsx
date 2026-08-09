'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameRuntimeContext } from '../context/GameContext';
import type { GameState } from '../types';

interface Props {
  position: [number, number, number];
  gameStatus: GameState['status'];
}

const WIN_X = 1.05;
const WIN_Y_MIN = -0.15;
const WIN_Y_MAX = 1.65;
const ARCH_STONES = [-0.82, -0.52, -0.22, 0.12, 0.46, 0.76];

export function Goal({ position, gameStatus }: Props) {
  const { playerPosRef, handleWin } = useGameRuntimeContext();
  const winFired = useRef(false);
  const glowRef  = useRef<THREE.PointLight>(null);
  const crystalRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;

    if (crystalRef.current) crystalRef.current.rotation.y += delta * 1.2;
    if (glowRef.current) glowRef.current.intensity = 1.8 + Math.sin(t.current * 2.5) * 0.55;

    if (gameStatus !== 'playing' || winFired.current) return;

    const dx = Math.abs(playerPosRef.current.x - position[0]);
    const dy = playerPosRef.current.y - position[1];
    if (dx < WIN_X && dy > WIN_Y_MIN && dy < WIN_Y_MAX) {
      winFired.current = true;
      handleWin();
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.78, -0.05]} scale={[1.05, 1.18, 0.18]}>
        <sphereGeometry args={[0.82, 18, 14]} />
        <meshStandardMaterial color="#090b0b" emissive="#00351f" emissiveIntensity={0.65} roughness={0.98} />
      </mesh>

      <mesh position={[0, 0.18, 0.04]} scale={[0.92, 0.24, 0.18]}>
        <sphereGeometry args={[0.82, 18, 8]} />
        <meshStandardMaterial color="#060606" emissive="#001a10" emissiveIntensity={0.8} roughness={1} />
      </mesh>

      {ARCH_STONES.map((x, index) => {
        const y = index < 2 || index > 3 ? 0.55 : 1.34;
        const scale = index < 2 || index > 3 ? [0.34, 0.46, 0.28] : [0.42, 0.3, 0.28];
        return (
          <mesh key={x} position={[x, y, 0.08]} scale={scale as [number, number, number]}>
            <sphereGeometry args={[0.72, 10, 8]} />
            <meshStandardMaterial color={index % 2 ? '#3b3329' : '#4a4235'} roughness={0.95} />
          </mesh>
        );
      })}

      <mesh position={[0, -0.06, 0.1]}>
        <boxGeometry args={[2.1, 0.18, 0.34]} />
        <meshStandardMaterial color="#352518" roughness={0.95} />
      </mesh>

      <mesh ref={crystalRef} position={[0, 0.82, 0.16]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color="#00e676"
          emissive="#00e676"
          emissiveIntensity={1.6}
          transparent
          opacity={0.72}
        />
      </mesh>

      <pointLight ref={glowRef} color="#00e676" intensity={1.8} distance={4.5} decay={2} position={[0, 0.78, 0.35]} />
      <pointLight color="#0e7490" intensity={0.9} distance={3} decay={2} position={[0, 0.2, 0.2]} />
    </group>
  );
}
