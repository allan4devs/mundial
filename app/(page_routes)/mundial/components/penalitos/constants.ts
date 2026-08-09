import type { PenalitosDirection } from "../../types";

export const PENALITOS_ANIM_MS = 2_200;

export const DIR_X: Record<PenalitosDirection, number> = {
  left: -1.15,
  center: 0,
  right: 1.15,
};

export const BALL_TARGET_Y: Record<PenalitosDirection, number> = {
  left: 1.05,
  center: 0.55,
  right: 1.05,
};

export const BALL_START = { x: 0, y: 0.11, z: 5.2 } as const;
export const GK_IDLE = { x: 0, y: 0, z: 0.55 } as const;

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}