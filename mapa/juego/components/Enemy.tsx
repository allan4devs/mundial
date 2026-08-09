'use client';
import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyData, GameState } from '../types';
import { useGameRuntimeContext } from '../context/GameContext';
import { CrawlerEnemy, ChargerEnemy, SpitterEnemy } from './EnemyVariants';
import { isSideHit, isStomp } from '../lib/enemyCombat';

interface Props {
  data: EnemyData;
  gameStatus: GameState['status'];
}

export const Enemy = memo(function Enemy({ data, gameStatus }: Props) {
  switch (data.kind) {
    case 'crawler': return <CrawlerEnemy data={data} gameStatus={gameStatus} />;
    case 'charger': return <ChargerEnemy data={data} gameStatus={gameStatus} />;
    case 'spitter': return <SpitterEnemy data={data} gameStatus={gameStatus} />;
    default:        return <BatEnemy data={data} gameStatus={gameStatus} />;
  }
});

const PATROL_SPEED = 2.4;
const BULLET_HIT_X = 0.52;
const BULLET_HIT_Y = 0.38;

const BatEnemy = memo(function BatEnemy({ data, gameStatus }: Props) {
  const { playerPosRef, playerVelRef, bulletsRef, stompBounceRef, handlePlayerHit } = useGameRuntimeContext();
  const defeated = useRef(false);
  const groupRef  = useRef<THREE.Group>(null);
  const defeatedRef = useRef<THREE.Group>(null);
  const posX      = useRef(data.position[0]);
  const dir       = useRef(1);
  const hitCd     = useRef(false);
  const stomped   = useRef(false);
  const leftWing  = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);
  const t         = useRef(0);

  const markDefeated = (enemyY: number) => {
    defeated.current = true;
    if (groupRef.current) groupRef.current.visible = false;
    if (defeatedRef.current) {
      defeatedRef.current.position.set(posX.current, enemyY, data.position[2]);
      defeatedRef.current.visible = true;
    }
  };

  useFrame((_, delta) => {
    if (gameStatus !== 'playing' || !groupRef.current || defeated.current) return;
    t.current += delta;

    const minX = data.position[0] - data.patrolRange;
    const maxX = data.position[0] + data.patrolRange;

    posX.current += dir.current * PATROL_SPEED * delta;
    if (posX.current >= maxX) { posX.current = maxX; dir.current = -1; }
    if (posX.current <= minX) { posX.current = minX; dir.current =  1; }

    groupRef.current.position.x = posX.current;
    const enemyY = data.position[1] + Math.sin(t.current * 3.5) * 0.18;
    groupRef.current.position.y = enemyY;
    groupRef.current.scale.x = dir.current;

    const flapAngle = 0.4 + Math.sin(t.current * 9) * 0.5;
    if (leftWing.current)  leftWing.current.rotation.z  =  flapAngle;
    if (rightWing.current) rightWing.current.rotation.z = -flapAngle;

    // ── Bullet collision ───────────────────────────────────────────────────
    const bullets = bulletsRef.current;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (Math.abs(b.x - posX.current) < BULLET_HIT_X && Math.abs(b.y - enemyY) < BULLET_HIT_Y) {
        bullets.splice(i, 1);
        markDefeated(enemyY);
        return;
      }
    }

    // ── Player collision ───────────────────────────────────────────────────
    const dx = playerPosRef.current.x - posX.current;
    const dy = playerPosRef.current.y - enemyY;

    if (isStomp(dx, dy, playerVelRef.current.y) && !stomped.current) {
      stomped.current = true;
      markDefeated(enemyY);
      stompBounceRef.current = true;
      return;
    }

    if (isSideHit(dx, dy) && !hitCd.current) {
      hitCd.current = true;
      handlePlayerHit();
      setTimeout(() => { hitCd.current = false; }, 2200);
    }
  });

  return (
    <>
      <group ref={defeatedRef} position={data.position} visible={false}>
        <mesh scale={[0.9, 0.18, 0.5]}>
          <sphereGeometry args={[0.42, 10, 8]} />
          <meshStandardMaterial color="#7a2fa8" emissive="#00e676" emissiveIntensity={0.7} transparent opacity={0.55} />
        </mesh>
        <pointLight color="#00e676" intensity={0.6} distance={1.5} decay={2} />
      </group>

      <group ref={groupRef} position={data.position}>
        <mesh>
          <boxGeometry args={[0.52, 0.44, 0.32]} />
          <meshStandardMaterial color="#4a0e78" emissive="#7a2fa8" emissiveIntensity={0.55} />
        </mesh>
        <mesh ref={leftWing} position={[-0.48, 0.06, 0]}>
          <boxGeometry args={[0.52, 0.11, 0.05]} />
          <meshStandardMaterial color="#6a1b9a" transparent opacity={0.72} />
        </mesh>
        <mesh ref={rightWing} position={[0.48, 0.06, 0]}>
          <boxGeometry args={[0.52, 0.11, 0.05]} />
          <meshStandardMaterial color="#6a1b9a" transparent opacity={0.72} />
        </mesh>
        <mesh position={[ 0.13, 0.09, 0.17]}>
          <sphereGeometry args={[0.058, 6, 6]} />
          <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[-0.13, 0.09, 0.17]}>
          <sphereGeometry args={[0.058, 6, 6]} />
          <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={2.5} />
        </mesh>
        <pointLight color="#8b00ff" intensity={0.7} distance={2} decay={2} />
      </group>
    </>
  );
});
