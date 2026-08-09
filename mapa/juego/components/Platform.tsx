'use client';
import { memo, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GameState, PlatformData } from '../types';
import { getBoxGeometry, getStandardMaterial } from '../lib/renderAssets';
import { P_HALF_H, P_HALF_W } from '../constants/physics';
import { useGameRuntimeContext } from '../context/GameContext';

interface Props {
  data: PlatformData;
  gameStatus: GameState['status'];
}

export const Platform = memo(function Platform({ data, gameStatus }: Props) {
  if (data.behavior === 'collapse') return <CollapsingPlatform data={data} gameStatus={gameStatus} />;
  if (data.behavior === 'moveX' || data.behavior === 'moveY') {
    return <MovingPlatform data={data} gameStatus={gameStatus} />;
  }
  return (
    <group position={data.position} dispose={null}>
      <PlatformVisual data={data} />
    </group>
  );
});

// ── Shared visual ──────────────────────────────────────────────────────────
function PlatformVisual({ data }: { data: PlatformData }) {
  const [pw, ph, pd] = data.size;
  const palette = platformPalette(data.kind);

  return (
    <>
      <mesh geometry={getBoxGeometry(pw, ph, pd)} material={getStandardMaterial({ color: palette.base, roughness: 0.96, metalness: 0.04 })} />
      <mesh
        position={[0, ph / 2 - 0.09, 0]}
        geometry={getBoxGeometry(pw * 0.97, 0.07, pd * 0.97)}
        material={getStandardMaterial({ color: palette.under })}
      />
      <mesh
        position={[0, ph / 2 - 0.03, 0]}
        geometry={getBoxGeometry(pw * 0.96, 0.1, pd * 0.96)}
        material={getStandardMaterial({ color: palette.top, roughness: 0.68 })}
      />
      {data.kind === 'stair' ? (
        <mesh
          position={[0, ph / 2 + 0.07, 0]}
          geometry={getBoxGeometry(pw * 0.78, 0.08, pd * 0.88)}
          material={getStandardMaterial({ color: '#5d4730', roughness: 0.9 })}
        />
      ) : null}
      {(data.kind === 'bridge' || data.behavior === 'collapse') ? (
        <>
          {[-0.33, 0, 0.33].map((offset) => (
            <mesh
              key={offset}
              position={[0, ph / 2 + 0.05, offset * pd]}
              geometry={getBoxGeometry(pw * 0.92, 0.07, 0.08)}
              material={getStandardMaterial({ color: '#6b4a25', roughness: 0.85 })}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

// ── Crash-style collapsing platform ─────────────────────────────────────────
const CollapsingPlatform = memo(function CollapsingPlatform({ data, gameStatus }: Props) {
  const { playerPosRef, platformRegistryRef } = useGameRuntimeContext();
  const groupRef = useRef<THREE.Group>(null);
  const warnMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const triggered = useRef(false);
  const fell = useRef(false);
  const timer = useRef(0);       // countdown before drop / respawn
  const fallVel = useRef(0);
  const spin = useRef(0);

  const [px, py, pz] = data.position;
  const [pw, ph] = data.size;
  const topY = py + ph / 2;
  const delay = data.collapseDelay ?? 0.4;
  const respawn = data.respawnDelay ?? 0;

  useLayoutEffect(() => {
    const reg = platformRegistryRef.current;
    reg.set(data.id, { active: true, dx: 0, dy: 0, frameDx: 0, frameDy: 0 });
    return () => { reg.delete(data.id); };
  }, [data.id, platformRegistryRef]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const live = platformRegistryRef.current.get(data.id);
    if (!live) return;
    if (gameStatus !== 'playing') return;

    // Falling animation
    if (fell.current) {
      fallVel.current += -30 * delta;
      group.position.y += fallVel.current * delta;
      spin.current += delta * 3.2;
      group.rotation.z = spin.current * 0.6;
      group.rotation.x = spin.current * 0.35;
      if (respawn > 0) {
        timer.current -= delta;
        if (timer.current <= 0) {
          // Respawn back at base
          group.position.set(px, py, pz);
          group.rotation.set(0, 0, 0);
          group.scale.set(1, 1, 1);
          fell.current = false;
          triggered.current = false;
          fallVel.current = 0;
          spin.current = 0;
          live.active = true;
          if (warnMatRef.current) warnMatRef.current.emissiveIntensity = 0;
        }
      }
      return;
    }

    // Waiting-to-drop shake
    if (triggered.current) {
      timer.current -= delta;
      const shake = Math.sin(timer.current * 40) * 0.05;
      group.position.x = px + shake;
      if (warnMatRef.current) {
        warnMatRef.current.emissiveIntensity = 0.6 + Math.sin(timer.current * 30) * 0.4;
      }
      if (timer.current <= 0) {
        fell.current = true;
        fallVel.current = 0;
        live.active = false;            // remove collision → player drops through
        timer.current = respawn;        // reuse timer for respawn countdown
      }
      return;
    }

    // Detect the player standing on top
    const p = playerPosRef.current;
    const onX = Math.abs(p.x - px) < pw / 2 + P_HALF_W * 0.6;
    const bottom = p.y - P_HALF_H;
    const onTop = bottom > topY - 0.14 && bottom < topY + 0.4;
    if (onX && onTop) {
      triggered.current = true;
      timer.current = delay;
    }
  });

  return (
    <group ref={groupRef} position={data.position} dispose={null}>
      <PlatformVisual data={data} />
      {/* warning glow strip on top */}
      <mesh position={[0, ph / 2 + 0.02, 0]} geometry={getBoxGeometry(pw * 0.9, 0.05, data.size[2] * 0.9)}>
        <meshStandardMaterial ref={warnMatRef} color="#ff5722" emissive="#ff3d00" emissiveIntensity={0} transparent opacity={0.85} />
      </mesh>
    </group>
  );
});

// ── Donkey Kong / Mario moving platform ─────────────────────────────────────
const MovingPlatform = memo(function MovingPlatform({ data, gameStatus }: Props) {
  const { platformRegistryRef } = useGameRuntimeContext();
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef((data.id.charCodeAt(data.id.length - 1) % 7) * 0.5);

  const [px, py, pz] = data.position;
  const range = data.moveRange ?? 3;
  const speed = data.moveSpeed ?? 1;
  const axisX = data.behavior === 'moveX';

  useLayoutEffect(() => {
    const reg = platformRegistryRef.current;
    reg.set(data.id, { active: true, dx: 0, dy: 0, frameDx: 0, frameDy: 0 });
    return () => { reg.delete(data.id); };
  }, [data.id, platformRegistryRef]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const live = platformRegistryRef.current.get(data.id);
    if (!live) return;

    if (gameStatus !== 'playing') {
      live.frameDx = 0;
      live.frameDy = 0;
      return;
    }

    t.current += delta * speed;
    const offset = Math.sin(t.current) * range;
    const newDx = axisX ? offset : 0;
    const newDy = axisX ? 0 : offset;

    live.frameDx = newDx - live.dx;
    live.frameDy = newDy - live.dy;
    live.dx = newDx;
    live.dy = newDy;

    group.position.set(px + newDx, py + newDy, pz);
  });

  return (
    <group ref={groupRef} position={data.position} dispose={null}>
      <PlatformVisual data={data} />
      {/* runner rails to signal a moving platform */}
      <mesh position={[0, -data.size[1] / 2 - 0.04, 0]} geometry={getBoxGeometry(data.size[0] * 0.4, 0.08, data.size[2] * 0.4)}>
        <meshStandardMaterial color="#b0bec5" emissive="#4dd0e1" emissiveIntensity={0.5} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
});

function platformPalette(kind: PlatformData['kind']) {
  switch (kind) {
    case 'mud':
      return { base: '#302018', under: '#1b110b', top: '#5a3a1e' };
    case 'root':
      return { base: '#342214', under: '#1a1008', top: '#6b3e17' };
    case 'rock':
      return { base: '#363b35', under: '#1d211e', top: '#56615a' };
    case 'stair':
      return { base: '#403226', under: '#22170f', top: '#80613f' };
    case 'bridge':
      return { base: '#3b2715', under: '#1d1208', top: '#7a552b' };
    case 'river':
      return { base: '#263b38', under: '#111d1c', top: '#3f6f67' };
    default:
      return { base: '#352518', under: '#241606', top: '#1a582a' };
  }
}
