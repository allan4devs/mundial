'use client';
import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameState, HazardData } from '../types';
import { P_HALF_H, P_HALF_W } from '../constants/physics';
import { useGameRuntimeContext } from '../context/GameContext';

interface Props {
  data: HazardData;
  gameStatus: GameState['status'];
}

export const Hazard = memo(function Hazard({ data, gameStatus }: Props) {
  switch (data.kind) {
    case 'boulder': return <Boulder data={data} gameStatus={gameStatus} />;
    case 'saw':     return <Saw data={data} gameStatus={gameStatus} />;
    case 'log':     return <SwingLog data={data} gameStatus={gameStatus} />;
    case 'fire':    return <Fire data={data} gameStatus={gameStatus} />;
    default:        return <Spikes data={data} gameStatus={gameStatus} />;
  }
});

// ── Static spikes (prehistoric bone / stone) ────────────────────────────────
const Spikes = memo(function Spikes({ data, gameStatus }: Props) {
  const { playerPosRef, handleTrap } = useGameRuntimeContext();
  const [px, py, pz] = data.position;
  const [w, h, d] = data.size ?? [2, 0.7, 1.6];
  const fired = useRef(false);
  const count = Math.max(2, Math.round(w / 0.45));

  useFrame(() => {
    if (gameStatus !== 'playing' || fired.current) return;
    const p = playerPosRef.current;
    const hitX = Math.abs(p.x - px) < w / 2 + P_HALF_W * 0.4;
    const hitY = p.y - P_HALF_H < py + h - 0.06 && p.y + P_HALF_H > py - 0.1;
    if (hitX && hitY) {
      fired.current = true;
      handleTrap();
    }
  });

  return (
    <group position={[px, py, pz]}>
      {Array.from({ length: count }).map((_, i) => {
        const x = -w / 2 + (i + 0.5) * (w / count);
        return (
          <mesh key={i} position={[x, h / 2, 0]}>
            <coneGeometry args={[w / count / 2 * 0.9, h, 6]} />
            <meshStandardMaterial color="#d7ccc8" emissive="#4e342e" emissiveIntensity={0.25} roughness={0.5} metalness={0.2} />
          </mesh>
        );
      })}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[w, 0.14, d]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
    </group>
  );
});

// ── Static fire / lava jet ──────────────────────────────────────────────────
const Fire = memo(function Fire({ data, gameStatus }: Props) {
  const { playerPosRef, handleTrap } = useGameRuntimeContext();
  const [px, py, pz] = data.position;
  const [w, h, d] = data.size ?? [1.2, 1.4, 1.2];
  const fired = useRef(false);
  const flame = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (flame.current) {
      const s = 1 + Math.sin(t.current * 14) * 0.18;
      flame.current.scale.set(1, s, 1);
    }
    if (light.current) light.current.intensity = 1.4 + Math.sin(t.current * 18) * 0.6;

    if (gameStatus !== 'playing' || fired.current) return;
    const p = playerPosRef.current;
    const hitX = Math.abs(p.x - px) < w / 2 + P_HALF_W * 0.4;
    const hitY = p.y - P_HALF_H < py + h - 0.1 && p.y + P_HALF_H > py - 0.1;
    if (hitX && hitY) {
      fired.current = true;
      handleTrap();
    }
  });

  return (
    <group position={[px, py, pz]}>
      <group ref={flame} position={[0, h / 2, 0]}>
        <mesh>
          <coneGeometry args={[w * 0.42, h, 10]} />
          <meshStandardMaterial color="#ff7043" emissive="#ff3d00" emissiveIntensity={2.4} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, -0.1, 0]} scale={[0.6, 0.75, 0.6]}>
          <coneGeometry args={[w * 0.42, h, 10]} />
          <meshStandardMaterial color="#ffd54f" emissive="#ffab00" emissiveIntensity={2.8} transparent opacity={0.95} />
        </mesh>
      </group>
      <pointLight ref={light} color="#ff6d00" intensity={1.6} distance={4} decay={2} position={[0, h * 0.5, 0]} />
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[w * 0.5, w * 0.55, 0.14, 12]} />
        <meshStandardMaterial color="#37251b" roughness={0.9} />
      </mesh>
    </group>
  );
});

// ── Rolling boulder (Indiana Jones / DK) ────────────────────────────────────
const Boulder = memo(function Boulder({ data, gameStatus }: Props) {
  const { playerPosRef, handleTrap } = useGameRuntimeContext();
  const [px, py, pz] = data.position;
  const r = (data.size?.[0] ?? 1.1) / 2;
  const range = data.range ?? 5;
  const speed = data.speed ?? 3;
  const fired = useRef(false);
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (gameStatus !== 'playing') return;
    t.current += delta;
    const offset = Math.sin(t.current * (speed / Math.max(range, 0.5))) * range;
    const x = px + offset;
    if (ref.current) {
      ref.current.position.x = x;
      ref.current.rotation.z -= (Math.cos(t.current * (speed / Math.max(range, 0.5))) * speed * delta) / r;
    }
    if (fired.current) return;
    const p = playerPosRef.current;
    const dx = p.x - x;
    const dy = p.y - py;
    if (dx * dx + dy * dy < (r + 0.34) * (r + 0.34)) {
      fired.current = true;
      handleTrap();
    }
  });

  return (
    <mesh ref={ref} position={[px, py, pz]}>
      <dodecahedronGeometry args={[r, 0]} />
      <meshStandardMaterial color="#6d6259" emissive="#2e2621" emissiveIntensity={0.25} roughness={0.95} metalness={0.1} />
    </mesh>
  );
});

// ── Spinning saw blade (DK / factory) ───────────────────────────────────────
const Saw = memo(function Saw({ data, gameStatus }: Props) {
  const { playerPosRef, handleTrap } = useGameRuntimeContext();
  const [px, py, pz] = data.position;
  const r = (data.size?.[0] ?? 1.0) / 2;
  const range = data.range ?? 0;
  const speed = data.speed ?? 4;
  const fired = useRef(false);
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (gameStatus !== 'playing') return;
    t.current += delta;
    const x = range > 0 ? px + Math.sin(t.current * speed * 0.4) * range : px;
    if (ref.current) {
      ref.current.position.x = x;
      ref.current.rotation.z += delta * 12;
    }
    if (fired.current) return;
    const p = playerPosRef.current;
    const dx = p.x - x;
    const dy = p.y - py;
    if (dx * dx + dy * dy < (r + 0.22) * (r + 0.22)) {
      fired.current = true;
      handleTrap();
    }
  });

  return (
    <group ref={ref} position={[px, py, pz]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.12, 20]} />
        <meshStandardMaterial color="#90a4ae" emissive="#37474f" emissiveIntensity={0.3} metalness={0.85} roughness={0.25} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} rotation={[0, 0, a]}>
            <coneGeometry args={[0.12, 0.28, 4]} />
            <meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.2} />
          </mesh>
        );
      })}
      <mesh>
        <sphereGeometry args={[r * 0.28, 8, 8]} />
        <meshStandardMaterial color="#455a64" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
});

// ── Swinging log pendulum (DK / prehistoric) ────────────────────────────────
const SwingLog = memo(function SwingLog({ data, gameStatus }: Props) {
  const { playerPosRef, handleTrap } = useGameRuntimeContext();
  const [px, py, pz] = data.position;   // pivot point (top)
  const len = data.range ?? 3;          // rope + log length
  const speed = data.speed ?? 2;
  const amp = 0.9;                       // max swing angle (rad)
  const fired = useRef(false);
  const pivot = useRef<THREE.Group>(null);
  const t = useRef((data.id.charCodeAt(data.id.length - 1) % 6) * 0.4);

  useFrame((_, delta) => {
    if (gameStatus !== 'playing') return;
    t.current += delta * speed;
    const angle = Math.sin(t.current) * amp;
    if (pivot.current) pivot.current.rotation.z = angle;

    if (fired.current) return;
    // Log lower end world position
    const tipX = px + Math.sin(angle) * len;
    const tipY = py - Math.cos(angle) * len;
    const p = playerPosRef.current;
    const dx = p.x - tipX;
    const dy = p.y - tipY;
    if (dx * dx + dy * dy < 0.75 * 0.75) {
      fired.current = true;
      handleTrap();
    }
  });

  return (
    <group position={[px, py, pz]}>
      <group ref={pivot}>
        <mesh position={[0, -len * 0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, len * 0.7, 6]} />
          <meshStandardMaterial color="#5d4037" roughness={0.8} />
        </mesh>
        <mesh position={[0, -len, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 1.5, 10]} />
          <meshStandardMaterial color="#4e342e" emissive="#3e2723" emissiveIntensity={0.2} roughness={0.85} />
        </mesh>
        {/* spikes on the log */}
        {[-0.5, 0, 0.5].map((o) => (
          <mesh key={o} position={[o, -len - 0.28, 0]}>
            <coneGeometry args={[0.08, 0.24, 5]} />
            <meshStandardMaterial color="#d7ccc8" roughness={0.5} />
          </mesh>
        ))}
      </group>
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#8d6e63" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
});
