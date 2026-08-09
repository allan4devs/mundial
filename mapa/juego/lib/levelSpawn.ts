import { P_HALF_H } from '../constants/physics';
import type { PlatformData } from '../types';

const SPAWN_Y_PAD = 0.04;
const GOAL_EDGE_INSET = 0.72;
const GOAL_Y_PAD = 0.04;

export const getPlatformTopY = (platform: PlatformData) => (
  platform.position[1] + platform.size[1] * 0.5
);

export const getSafeSpawnPosition = (platforms: PlatformData[]): [number, number, number] => {
  const firstPlatform = platforms[0];
  if (!firstPlatform) return [0, 6.42, 0];

  const [x, , z] = firstPlatform.position;
  return [x, getPlatformTopY(firstPlatform) + P_HALF_H + SPAWN_Y_PAD, z];
};

export const getSafeGoalPosition = (platforms: PlatformData[]): [number, number, number] => {
  const goalPlatform = platforms.reduce<PlatformData | null>((rightmost, platform) => {
    if (!rightmost) return platform;
    const platformRightEdge = platform.position[0] + platform.size[0] * 0.5;
    const rightmostEdge = rightmost.position[0] + rightmost.size[0] * 0.5;
    return platformRightEdge > rightmostEdge ? platform : rightmost;
  }, null);

  if (!goalPlatform) return [47, -3.65, 0];

  const [x, , z] = goalPlatform.position;
  const rightEdge = x + goalPlatform.size[0] * 0.5;
  return [rightEdge - GOAL_EDGE_INSET, getPlatformTopY(goalPlatform) + GOAL_Y_PAD, z];
};
