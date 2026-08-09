import type { MutableRefObject } from 'react';
import type * as THREE from 'three';
import { GLIDE_FALL, GRAVITY, JUMP2_VEL, JUMP_VEL, MAX_JUMPS, SPEED } from '../constants/physics';
import type { KeyState } from '../hooks/useKeyboard';
import type { PlatformBounds } from './playerPhysics';
import { resolveHorizontalCollisions, resolveVerticalCollisions } from './playerPhysics';

export const updateHorizontalMovement = (
  keys: KeyState,
  velocity: THREE.Vector3,
  facingR: MutableRefObject<boolean>,
) => {
  const moveX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  velocity.x = moveX * SPEED;
  if (moveX !== 0) facingR.current = moveX > 0;
  return moveX;
};

export const handleJumpInput = ({
  grounded,
  jumpCount,
  jumpWas,
  keys,
  velocity,
}: {
  grounded: boolean;
  jumpCount: MutableRefObject<number>;
  jumpWas: MutableRefObject<boolean>;
  keys: KeyState;
  velocity: THREE.Vector3;
}) => {
  const jumpNow = keys.jump;
  if (jumpNow && !jumpWas.current) {
    if (grounded) {
      velocity.y = JUMP_VEL;
      jumpCount.current = 1;
    } else if (jumpCount.current < MAX_JUMPS) {
      velocity.y = JUMP2_VEL;
      jumpCount.current++;
    }
  }
  jumpWas.current = jumpNow;
};

export const stepPlayerPhysics = ({
  dt,
  grounded,
  jumpCount,
  keys,
  platformBounds,
  pos,
  steps,
  velocity,
}: {
  dt: number;
  grounded: MutableRefObject<boolean>;
  jumpCount: MutableRefObject<number>;
  keys: KeyState;
  platformBounds: PlatformBounds[];
  pos: THREE.Vector3;
  steps: number;
  velocity: THREE.Vector3;
}): string | null => {
  grounded.current = false;
  let landedId: string | null = null;

  for (let step = 0; step < steps; step++) {
    velocity.y += GRAVITY * dt;
    if (keys.jump && velocity.y < GLIDE_FALL && jumpCount.current >= 1) {
      velocity.y = GLIDE_FALL;
    }

    pos.x += velocity.x * dt;
    resolveHorizontalCollisions(pos, velocity, platformBounds);

    const prevY = pos.y;
    pos.y += velocity.y * dt;
    const hitId = resolveVerticalCollisions(pos, velocity, platformBounds, prevY);
    if (hitId !== null) {
      grounded.current = true;
      jumpCount.current = 0;
      landedId = hitId;
    }
  }

  return landedId;
};
