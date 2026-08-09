'use client';
import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnemyData, GameState } from '../types';
import { useGameRuntimeContext } from '../context/GameContext';
import { isSideHit, isStomp } from '../lib/enemyCombat';

interface Props {
  data: EnemyData;
  gameStatus: GameState['status'];
}

// Bullet hit tuning (stomp / side-hit live in ../lib/enemyCombat)
const BULLET_HIT_X = 0.55;
const BULLET_HIT_Y = 0.5;

// ── Crawler: ground beetle / prehistoric critter (Goomba-like) ──────────────
export const CrawlerEnemy = memo(function CrawlerEnemy({ data, gameStatus }: Props) {
  const { playerPosRef, playerVelRef, bulletsRef, stompBounceRef, handlePlayerHit } = useGameRuntimeContext();
  const groupRef = useRef<THREE.Group>(null);
  const squashRef = useRef<THREE.Group>(null);
  const defeated = useRef(false);
  const posX = useRef(data.position[0]);
  const dir = useRef(1);
  const hitCd = useRef(false);
  const legT = useRef(0);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);

  const y = data.position[1];
  const SPEED = 2.0;

  const markDefeated = () => {
    defeated.current = true;
    if (groupRef.current) groupRef.current.visible = false;
    if (squashRef.current) {
      squashRef.current.position.set(posX.current, y - 0.16, data.position[2]);
      squashRef.current.visible = true;
    }
  };

  useFrame((_, delta) => {
    if (gameStatus !== 'playing' || !groupRef.current || defeated.current) return;
    legT.current += delta;

    const minX = data.position[0] - data.patrolRange;
    const maxX = data.position[0] + data.patrolRange;
    posX.current += dir.current * SPEED * delta;
    if (posX.current >= maxX) { posX.current = maxX; dir.current = -1; }
    if (posX.current <= minX) { posX.current = minX; dir.current = 1; }

    groupRef.current.position.x = posX.current;
    groupRef.current.scale.x = dir.current;
    const wob = Math.sin(legT.current * 12) * 0.35;
    if (legL.current) legL.current.rotation.x = wob;
    if (legR.current) legR.current.rotation.x = -wob;

    const bullets = bulletsRef.current;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (Math.abs(b.x - posX.current) < BULLET_HIT_X && Math.abs(b.y - y) < BULLET_HIT_Y) {
        bullets.splice(i, 1);
        markDefeated();
        return;
      }
    }

    const dx = playerPosRef.current.x - posX.current;
    const dy = playerPosRef.current.y - y;
    if (isStomp(dx, dy, playerVelRef.current.y)) {
      markDefeated();
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
      <group ref={squashRef} position={data.position} visible={false}>
        <mesh scale={[1.1, 0.2, 0.7]}>
          <sphereGeometry args={[0.4, 10, 8]} />
          <meshStandardMaterial color="#3d5a2a" emissive="#00e676" emissiveIntensity={0.6} transparent opacity={0.6} />
        </mesh>
      </group>

      <group ref={groupRef} position={data.position}>
        {/* armored shell */}
        <mesh position={[0, 0.02, 0]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.4, 12, 10]} />
          <meshStandardMaterial color="#4e6b32" emissive="#1b3a12" emissiveIntensity={0.4} roughness={0.6} />
        </mesh>
        {/* shell ridges */}
        <mesh position={[0, 0.2, 0]} scale={[0.85, 0.4, 0.85]}>
          <sphereGeometry args={[0.4, 10, 8]} />
          <meshStandardMaterial color="#6b8e3f" roughness={0.5} />
        </mesh>
        {/* horn (prehistoric) */}
        <mesh position={[0.28, 0.18, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.07, 0.28, 6]} />
          <meshStandardMaterial color="#d7ccc8" roughness={0.5} />
        </mesh>
        {/* eyes */}
        <mesh position={[0.26, 0.05, 0.16]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#ffeb3b" emissive="#ffc400" emissiveIntensity={1.6} /></mesh>
        <mesh position={[0.26, 0.05, -0.16]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#ffeb3b" emissive="#ffc400" emissiveIntensity={1.6} /></mesh>
        {/* legs */}
        <group ref={legL} position={[-0.1, -0.28, 0.22]}>
          <mesh position={[0, -0.08, 0]}><boxGeometry args={[0.08, 0.22, 0.08]} /><meshStandardMaterial color="#2e3d1c" /></mesh>
        </group>
        <group ref={legR} position={[-0.1, -0.28, -0.22]}>
          <mesh position={[0, -0.08, 0]}><boxGeometry args={[0.08, 0.22, 0.08]} /><meshStandardMaterial color="#2e3d1c" /></mesh>
        </group>
        <mesh position={[0.24, -0.3, 0.2]}><boxGeometry args={[0.07, 0.2, 0.07]} /><meshStandardMaterial color="#2e3d1c" /></mesh>
        <mesh position={[0.24, -0.3, -0.2]}><boxGeometry args={[0.07, 0.2, 0.07]} /><meshStandardMaterial color="#2e3d1c" /></mesh>
      </group>
    </>
  );
});

// ── Charger: raptor that patrols then dashes at the player (prehistoric) ─────
export const ChargerEnemy = memo(function ChargerEnemy({ data, gameStatus }: Props) {
  const { playerPosRef, playerVelRef, bulletsRef, stompBounceRef, handlePlayerHit } = useGameRuntimeContext();
  const groupRef = useRef<THREE.Group>(null);
  const squashRef = useRef<THREE.Group>(null);
  const defeated = useRef(false);
  const posX = useRef(data.position[0]);
  const dir = useRef(1);
  const hitCd = useRef(false);
  const charging = useRef(false);
  const chargeT = useRef(0);
  const cooldown = useRef(0);
  const legT = useRef(0);
  const legRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  const y = data.position[1];
  const PATROL_SPEED = 1.6;
  const CHARGE_SPEED = 7.5;
  const DETECT_X = 5.5;
  const originX = data.position[0];
  const leash = data.patrolRange + 4.5;

  const markDefeated = () => {
    defeated.current = true;
    if (groupRef.current) groupRef.current.visible = false;
    if (squashRef.current) {
      squashRef.current.position.set(posX.current, y - 0.14, data.position[2]);
      squashRef.current.visible = true;
    }
  };

  useFrame((_, delta) => {
    if (gameStatus !== 'playing' || !groupRef.current || defeated.current) return;
    legT.current += delta;
    if (cooldown.current > 0) cooldown.current -= delta;

    const px = playerPosRef.current.x;
    const py = playerPosRef.current.y;
    const dxToPlayer = px - posX.current;

    if (charging.current) {
      chargeT.current -= delta;
      posX.current += dir.current * CHARGE_SPEED * delta;
      if (chargeT.current <= 0 || Math.abs(posX.current - originX) > leash) {
        charging.current = false;
        cooldown.current = 1.3;
      }
    } else {
      const minX = originX - data.patrolRange;
      const maxX = originX + data.patrolRange;
      posX.current += dir.current * PATROL_SPEED * delta;
      if (posX.current >= maxX) { posX.current = maxX; dir.current = -1; }
      if (posX.current <= minX) { posX.current = minX; dir.current = 1; }

      if (cooldown.current <= 0 && Math.abs(dxToPlayer) < DETECT_X && Math.abs(py - y) < 1.6) {
        charging.current = true;
        chargeT.current = 0.9;
        dir.current = dxToPlayer > 0 ? 1 : -1;
      }
    }

    groupRef.current.position.x = posX.current;
    groupRef.current.scale.x = dir.current;
    const runFast = charging.current ? 22 : 10;
    if (legRef.current) legRef.current.rotation.x = Math.sin(legT.current * runFast) * 0.7;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(legT.current * 6) * 0.3;
    // flash red while charging
    groupRef.current.position.y = y + (charging.current ? Math.abs(Math.sin(legT.current * runFast)) * 0.08 : 0);

    const bullets = bulletsRef.current;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (Math.abs(b.x - posX.current) < BULLET_HIT_X && Math.abs(b.y - y) < BULLET_HIT_Y) {
        bullets.splice(i, 1);
        markDefeated();
        return;
      }
    }

    const dx = px - posX.current;
    const dy = py - y;
    if (isStomp(dx, dy, playerVelRef.current.y)) {
      markDefeated();
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
      <group ref={squashRef} position={data.position} visible={false}>
        <mesh scale={[1.3, 0.2, 0.6]}>
          <sphereGeometry args={[0.42, 10, 8]} />
          <meshStandardMaterial color="#8a3b1e" emissive="#00e676" emissiveIntensity={0.6} transparent opacity={0.6} />
        </mesh>
      </group>

      <group ref={groupRef} position={data.position}>
        {/* body */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0.15]} scale={[1.3, 0.75, 0.8]}>
          <sphereGeometry args={[0.36, 12, 10]} />
          <meshStandardMaterial color="#c0562a" emissive="#5a1e08" emissiveIntensity={0.45} roughness={0.6} />
        </mesh>
        {/* head + snout */}
        <mesh position={[0.42, 0.28, 0]} scale={[1.1, 0.7, 0.7]}>
          <sphereGeometry args={[0.2, 10, 8]} />
          <meshStandardMaterial color="#cf6135" roughness={0.6} />
        </mesh>
        <mesh position={[0.62, 0.22, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.11, 0.26, 8]} />
          <meshStandardMaterial color="#b34a24" roughness={0.6} />
        </mesh>
        {/* eye */}
        <mesh position={[0.5, 0.36, 0.14]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ffee58" emissive="#ffab00" emissiveIntensity={2} /></mesh>
        {/* tail */}
        <group ref={tailRef} position={[-0.32, 0.12, 0]}>
          <mesh position={[-0.25, 0, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.14, 0.6, 8]} />
            <meshStandardMaterial color="#b34a24" roughness={0.6} />
          </mesh>
        </group>
        {/* legs */}
        <group ref={legRef} position={[0.05, -0.24, 0]}>
          <mesh position={[0.1, -0.14, 0.14]}><boxGeometry args={[0.1, 0.32, 0.1]} /><meshStandardMaterial color="#8a3b1e" /></mesh>
          <mesh position={[-0.05, -0.14, -0.14]}><boxGeometry args={[0.1, 0.32, 0.1]} /><meshStandardMaterial color="#8a3b1e" /></mesh>
        </group>
        <pointLight color="#ff5722" intensity={0.4} distance={1.6} decay={2} />
      </group>
    </>
  );
});

// ── Spitter: carnivorous plant / totem that fires projectiles (Piranha) ──────
const PROJECTILE_POOL = 4;
const PROJ_SPEED = 5.5;
const PROJ_RANGE = 11;
const FIRE_INTERVAL = 2.1;

interface Projectile { x: number; y: number; dir: number; active: boolean; }

export const SpitterEnemy = memo(function SpitterEnemy({ data, gameStatus }: Props) {
  const { playerPosRef, playerVelRef, bulletsRef, stompBounceRef, handlePlayerHit } = useGameRuntimeContext();
  const groupRef = useRef<THREE.Group>(null);
  const defeated = useRef(false);
  const headRef = useRef<THREE.Group>(null);
  const fireT = useRef(FIRE_INTERVAL * 0.5);
  const hitCd = useRef(false);
  const t = useRef(0);

  const projectiles = useRef<Projectile[]>(
    Array.from({ length: PROJECTILE_POOL }, () => ({ x: 0, y: 0, dir: 1, active: false })),
  );
  const projRefs = useRef<(THREE.Mesh | null)[]>([]);

  const [ex, ey, ez] = data.position;

  const markDefeated = () => {
    defeated.current = true;
    if (groupRef.current) groupRef.current.visible = false;
    for (const p of projectiles.current) p.active = false;
  };

  useFrame((_, delta) => {
    if (gameStatus !== 'playing' || defeated.current) {
      // still hide inactive projectiles
      projRefs.current.forEach((m, i) => { if (m) m.visible = projectiles.current[i]?.active ?? false; });
      return;
    }
    t.current += delta;
    if (headRef.current) headRef.current.rotation.z = Math.sin(t.current * 3) * 0.12;

    // Fire toward the player
    fireT.current -= delta;
    if (fireT.current <= 0) {
      fireT.current = FIRE_INTERVAL;
      const dirToPlayer = playerPosRef.current.x >= ex ? 1 : -1;
      const dist = Math.abs(playerPosRef.current.x - ex);
      if (dist < PROJ_RANGE) {
        const slot = projectiles.current.find((p) => !p.active);
        if (slot) {
          slot.active = true;
          slot.x = ex + dirToPlayer * 0.5;
          slot.y = ey + 0.35;
          slot.dir = dirToPlayer;
        }
      }
    }

    // Move projectiles + collide
    for (let i = 0; i < projectiles.current.length; i++) {
      const proj = projectiles.current[i];
      const mesh = projRefs.current[i];
      if (!proj.active) { if (mesh) mesh.visible = false; continue; }
      proj.x += proj.dir * PROJ_SPEED * delta;
      if (Math.abs(proj.x - ex) > PROJ_RANGE) { proj.active = false; if (mesh) mesh.visible = false; continue; }
      if (mesh) {
        mesh.visible = true;
        mesh.position.set(proj.x, proj.y, ez);
        mesh.rotation.x += delta * 6;
      }
      const dx = playerPosRef.current.x - proj.x;
      const dy = playerPosRef.current.y - proj.y;
      if (dx * dx + dy * dy < 0.42 * 0.42 && !hitCd.current) {
        proj.active = false;
        hitCd.current = true;
        handlePlayerHit();
        setTimeout(() => { hitCd.current = false; }, 2200);
      }
    }

    // Player can stomp / shoot the plant
    const bullets = bulletsRef.current;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (Math.abs(b.x - ex) < BULLET_HIT_X && Math.abs(b.y - (ey + 0.4)) < 0.6) {
        bullets.splice(i, 1);
        markDefeated();
        return;
      }
    }
    const pdx = playerPosRef.current.x - ex;
    const pdy = playerPosRef.current.y - (ey + 0.45);
    if (isStomp(pdx, pdy, playerVelRef.current.y)) {
      markDefeated();
      stompBounceRef.current = true;
      return;
    }
    if (Math.abs(pdx) < 0.5 && Math.abs(playerPosRef.current.y - (ey + 0.4)) < 0.5 && !hitCd.current) {
      hitCd.current = true;
      handlePlayerHit();
      setTimeout(() => { hitCd.current = false; }, 2200);
    }
  });

  return (
    <>
      <group ref={groupRef} position={data.position}>
        {/* pot / rocky base */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.32, 0.4, 0.36, 10]} />
          <meshStandardMaterial color="#5d4037" roughness={0.85} />
        </mesh>
        {/* stem */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 0.6, 8]} />
          <meshStandardMaterial color="#2e7d32" roughness={0.6} />
        </mesh>
        {/* head */}
        <group ref={headRef} position={[0, 0.55, 0]}>
          <mesh>
            <sphereGeometry args={[0.28, 12, 10]} />
            <meshStandardMaterial color="#c62828" emissive="#7f0000" emissiveIntensity={0.5} roughness={0.5} />
          </mesh>
          {/* mouth */}
          <mesh position={[0.18, -0.02, 0]} scale={[0.7, 0.5, 1]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <meshStandardMaterial color="#3e0a0a" />
          </mesh>
          {/* teeth */}
          {[-0.12, 0, 0.12].map((z) => (
            <mesh key={z} position={[0.28, 0.02, z]} rotation={[0, 0, -1.2]}>
              <coneGeometry args={[0.035, 0.12, 5]} />
              <meshStandardMaterial color="#fff8e1" />
            </mesh>
          ))}
          {/* spots */}
          <mesh position={[-0.05, 0.14, 0.18]}><sphereGeometry args={[0.05, 6, 6]} /><meshStandardMaterial color="#fff59d" emissive="#fbc02d" emissiveIntensity={0.8} /></mesh>
          <mesh position={[-0.05, 0.14, -0.18]}><sphereGeometry args={[0.05, 6, 6]} /><meshStandardMaterial color="#fff59d" emissive="#fbc02d" emissiveIntensity={0.8} /></mesh>
        </group>
        {/* leaves */}
        <mesh position={[-0.22, 0.1, 0]} rotation={[0, 0, 0.9]}><boxGeometry args={[0.3, 0.05, 0.16]} /><meshStandardMaterial color="#388e3c" /></mesh>
        <mesh position={[0.22, 0.1, 0]} rotation={[0, 0, -0.9]}><boxGeometry args={[0.3, 0.05, 0.16]} /><meshStandardMaterial color="#388e3c" /></mesh>
      </group>

      {/* projectile pool */}
      {Array.from({ length: PROJECTILE_POOL }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => { projRefs.current[i] = m; }}
          visible={false}
        >
          <icosahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color="#7cb342" emissive="#33691e" emissiveIntensity={1.6} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
});
