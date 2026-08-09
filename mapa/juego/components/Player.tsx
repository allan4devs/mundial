'use client';
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameRuntimeContext } from '../context/GameContext';
import { MAX_FRAME_DT, PHYSICS_STEP, STOMP_BOUNCE_VEL } from '../constants/physics';
import { DEATH_Y } from '../constants/world';
import { updatePlayerAnimation } from '../lib/playerAnimation';
import { handleJumpInput, stepPlayerPhysics, updateHorizontalMovement } from '../lib/playerMovement';
import { buildDynamicBounds } from '../lib/playerPhysics';
import { applyPowerUpMaterial, consumePendingPowerUp, tickPowerUps, tryShootSapphire } from '../lib/playerPowerUps';
import { PlayerVisual } from './PlayerVisual';
import type { GameState, LevelData } from '../types';

export function Player({
  level,
  gameStatus,
}: {
  level: LevelData;
  gameStatus: GameState['status'];
}) {
  const {
    keys, playerPosRef, playerVelRef, bulletsRef, platformRegistryRef, stompBounceRef,
    pendingPowerUpRef, playerImmuneRef, handlePowerUpChange, handleDie,
  } = useGameRuntimeContext();
  const platforms = level.platforms;
  const spawnPos = level.spawnPosition;

  const groupRef    = useRef<THREE.Group>(null);
  const visualRef   = useRef<THREE.Group>(null);
  const bodyMatRef  = useRef<THREE.MeshStandardMaterial>(null);
  const vel         = useRef(new THREE.Vector3());
  const grounded    = useRef(false);
  const jumpCount   = useRef(0);
  const jumpWas     = useRef(false);
  const fireWas     = useRef(false);
  const fireCd      = useRef(false);
  const deathFired  = useRef(false);
  const animT       = useRef(0);
  const facingR     = useRef(true);
  const nextBulletId = useRef(0);

  const rubyTimer   = useRef(0);
  const sapphTimer  = useRef(0);

  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const blinkT = useRef(0);

  const groundPlatformId = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (gameStatus === 'playing') {
      if (groupRef.current) groupRef.current.position.set(...spawnPos);
      playerPosRef.current.set(...spawnPos);
      vel.current.set(0, 0, 0);
      jumpCount.current = 0;
      jumpWas.current = false;
      fireWas.current = false;
      deathFired.current = false;
      grounded.current = false;
      groundPlatformId.current = null;
      // Reset powerups on respawn
      rubyTimer.current = 0;
      sapphTimer.current = 0;
      playerImmuneRef.current = false;
      handlePowerUpChange(false, false);
    }
  }, [gameStatus, spawnPos, playerPosRef, playerImmuneRef, handlePowerUpChange]);

  useFrame((_, delta) => {
    if (!groupRef.current || gameStatus !== 'playing') return;

    const pos = groupRef.current.position;
    const k = keys.current;
    const frameDt = Math.min(delta, MAX_FRAME_DT);
    const steps = Math.max(1, Math.ceil(frameDt / PHYSICS_STEP));
    const dt = frameDt / steps;

    animT.current += delta;
    blinkT.current += delta;

    // ── Pending power-up grant ──────────────────────────────────────────────
    const powerTimers = { rubyTimer, sapphTimer };
    consumePendingPowerUp(pendingPowerUpRef, powerTimers, handlePowerUpChange);

    // ── Power-up timers ────────────────────────────────────────────────────
    const { hasSapph } = tickPowerUps(delta, powerTimers, playerImmuneRef, handlePowerUpChange);

    // ── Visual colour update ───────────────────────────────────────────────
    applyPowerUpMaterial(bodyMatRef.current, rubyTimer.current > 0, hasSapph, animT.current);

    // ── Sapphire shooting ─────────────────────────────────────────────────
    const fireNow = k.fire;
    tryShootSapphire({ bulletsRef, facingR, fireCd, fireNow, fireWas, hasSapph, nextBulletId, pos });

    // ── Carry with the moving platform the player is riding ────────────────
    const registry = platformRegistryRef.current;
    const ridingId = groundPlatformId.current;
    if (ridingId) {
      const ride = registry.get(ridingId);
      if (ride && ride.active && (ride.frameDx !== 0 || ride.frameDy !== 0)) {
        pos.x += ride.frameDx;
        pos.y += ride.frameDy;
      }
    }

    // ── Movement ───────────────────────────────────────────────────────────
    const platformBounds = buildDynamicBounds(platforms, registry);
    const moveX = updateHorizontalMovement(k, vel.current, facingR);
    handleJumpInput({ grounded: grounded.current, jumpCount, jumpWas, keys: k, velocity: vel.current });
    const landedId = stepPlayerPhysics({ dt, grounded, jumpCount, keys: k, platformBounds, pos, steps, velocity: vel.current });
    groundPlatformId.current = grounded.current ? landedId : null;

    // ── Stomp bounce (estilo Mario): rebota tras pisar un bicho ────────────
    if (stompBounceRef.current) {
      stompBounceRef.current = false;
      vel.current.y = STOMP_BOUNCE_VEL;
      grounded.current = false;
      jumpCount.current = 1; // permite un salto extra en el aire tras rebotar
      groundPlatformId.current = null;
    }

    // Publica la velocidad para que los enemigos detecten el pisotón con fiabilidad
    playerVelRef.current.copy(vel.current);

    if (pos.y < DEATH_Y && !deathFired.current) {
      deathFired.current = true;
      handleDie();
    }

    playerPosRef.current.copy(pos);

    updatePlayerAnimation({
      animTime: animT.current,
      blinkTime: blinkT.current,
      eyeL: eyeL.current,
      eyeR: eyeR.current,
      facingR,
      grounded: grounded.current,
      group: groupRef.current,
      moveX,
      velocity: vel.current,
      visual: visualRef.current,
    });
  });

  return (
    <group ref={groupRef} position={spawnPos}>
      <PlayerVisual visualRef={visualRef} bodyMatRef={bodyMatRef} eyeL={eyeL} eyeR={eyeR} />
    </group>
  );
}
