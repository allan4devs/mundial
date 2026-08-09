import type * as THREE from 'three';
import { COLLISION_EPS, P_HALF_H, P_HALF_W } from '../constants/physics';
import type { LivePlatform, PlatformData } from '../types';

export type PlatformBounds = {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
};

export type PlatformRegistry = Map<string, LivePlatform>;

export const buildPlatformBounds = (platforms: PlatformData[]): PlatformBounds[] => (
  platforms.map((platform) => {
    const [px, py] = platform.position;
    const [pw, ph] = platform.size;
    return {
      id: platform.id,
      minX: px - pw * 0.5,
      maxX: px + pw * 0.5,
      minY: py - ph * 0.5,
      maxY: py + ph * 0.5,
      centerX: px,
    };
  })
);

/**
 * Build collision bounds each frame, honouring the live registry:
 * collapsed platforms (active === false) drop out of collision, and
 * moving platforms apply their current dx/dy offset.
 */
export const buildDynamicBounds = (
  platforms: PlatformData[],
  registry: PlatformRegistry,
): PlatformBounds[] => {
  const out: PlatformBounds[] = [];
  for (const platform of platforms) {
    const live = registry.get(platform.id);
    if (live && !live.active) continue;
    const dx = live?.dx ?? 0;
    const dy = live?.dy ?? 0;
    const [px, py] = platform.position;
    const [pw, ph] = platform.size;
    out.push({
      id: platform.id,
      minX: px + dx - pw * 0.5,
      maxX: px + dx + pw * 0.5,
      minY: py + dy - ph * 0.5,
      maxY: py + dy + ph * 0.5,
      centerX: px + dx,
    });
  }
  return out;
};

export const resolveHorizontalCollisions = (
  pos: THREE.Vector3,
  velocity: THREE.Vector3,
  platformBounds: PlatformBounds[],
) => {
  for (const platform of platformBounds) {
    const overlapsX = pos.x + P_HALF_W > platform.minX && pos.x - P_HALF_W < platform.maxX;
    const overlapsY = pos.y + P_HALF_H > platform.minY && pos.y - P_HALF_H < platform.maxY;
    const standingOnTop = pos.y - P_HALF_H >= platform.maxY - COLLISION_EPS;
    if (overlapsX && overlapsY && !standingOnTop) {
      const pushLeft = platform.minX - P_HALF_W;
      const pushRight = platform.maxX + P_HALF_W;
      pos.x = pos.x < platform.centerX ? pushLeft : pushRight;
      velocity.x = 0;
    }
  }
};

/** Returns the id of the platform landed on this step, or null. */
export const resolveVerticalCollisions = (
  pos: THREE.Vector3,
  velocity: THREE.Vector3,
  platformBounds: PlatformBounds[],
  prevY: number,
): string | null => {
  let landedId: string | null = null;

  for (const platform of platformBounds) {
    const overlapsX = pos.x + P_HALF_W > platform.minX && pos.x - P_HALF_W < platform.maxX;
    const overlapsY = pos.y + P_HALF_H > platform.minY && pos.y - P_HALF_H < platform.maxY;
    if (!overlapsX) continue;

    const prevBottom = prevY - P_HALF_H;
    const nextBottom = pos.y - P_HALF_H;
    const crossedTop = prevBottom >= platform.maxY - COLLISION_EPS
      && nextBottom <= platform.maxY + COLLISION_EPS
      && pos.y + P_HALF_H >= platform.minY;

    if ((overlapsY || crossedTop) && crossedTop && velocity.y <= 0) {
      pos.y = platform.maxY + P_HALF_H;
      velocity.y = 0;
      landedId = platform.id;
    } else if (overlapsY && prevY + P_HALF_H <= platform.minY + COLLISION_EPS && velocity.y > 0) {
      pos.y = platform.minY - P_HALF_H;
      velocity.y = 0;
    }
  }

  return landedId;
};
