import type { MutableRefObject } from 'react';
import type * as THREE from 'three';
import { FIRE_COOLDOWN, RUBY_DURATION, SAPPH_DURATION } from '../constants/physics';
import type { BulletState, PowerUpKind } from '../types';

interface PowerUpTimerRefs {
  rubyTimer: MutableRefObject<number>;
  sapphTimer: MutableRefObject<number>;
}

type HandlePowerUpChange = (
  ruby: boolean,
  sapphire: boolean,
  rubyRemaining?: number,
  sapphireRemaining?: number,
) => void;

export const consumePendingPowerUp = (
  pendingPowerUpRef: MutableRefObject<PowerUpKind | null>,
  timers: PowerUpTimerRefs,
  handlePowerUpChange: HandlePowerUpChange,
) => {
  const pending = pendingPowerUpRef.current;
  if (!pending) return;

  pendingPowerUpRef.current = null;
  if (pending === 'ruby') timers.rubyTimer.current = RUBY_DURATION;
  else timers.sapphTimer.current = SAPPH_DURATION;
  handlePowerUpChange(
    timers.rubyTimer.current > 0,
    timers.sapphTimer.current > 0,
    timers.rubyTimer.current,
    timers.sapphTimer.current,
  );
};

export const tickPowerUps = (
  delta: number,
  timers: PowerUpTimerRefs,
  playerImmuneRef: MutableRefObject<boolean>,
  handlePowerUpChange: HandlePowerUpChange,
) => {
  if (timers.rubyTimer.current > 0) timers.rubyTimer.current -= delta;
  if (timers.sapphTimer.current > 0) timers.sapphTimer.current -= delta;

  const hasRuby = timers.rubyTimer.current > 0;
  const hasSapph = timers.sapphTimer.current > 0;
  handlePowerUpChange(hasRuby, hasSapph, timers.rubyTimer.current, timers.sapphTimer.current);
  playerImmuneRef.current = hasRuby;

  return { hasRuby, hasSapph };
};

export const applyPowerUpMaterial = (
  mat: THREE.MeshStandardMaterial | null,
  hasRuby: boolean,
  hasSapph: boolean,
  animTime: number,
) => {
  if (!mat) return;

  if (hasRuby) {
    const flash = Math.sin(animTime * 10) > 0;
    mat.emissive.set(flash ? '#ff1744' : '#ff6b6b');
    mat.emissiveIntensity = flash ? 2.8 : 1.0;
    mat.color.set(flash ? '#ffcdd2' : '#ff8a80');
  } else if (hasSapph) {
    mat.emissive.set('#0d47a1');
    mat.emissiveIntensity = 2.0;
    mat.color.set('#bbdefb');
  } else {
    mat.emissive.set('#4fc3f7');
    mat.emissiveIntensity = 0.65;
    mat.color.set('#d4f0ff');
  }
};

export const tryShootSapphire = ({
  bulletsRef,
  facingR,
  fireCd,
  fireNow,
  fireWas,
  hasSapph,
  nextBulletId,
  pos,
}: {
  bulletsRef: MutableRefObject<BulletState[]>;
  facingR: MutableRefObject<boolean>;
  fireCd: MutableRefObject<boolean>;
  fireNow: boolean;
  fireWas: MutableRefObject<boolean>;
  hasSapph: boolean;
  nextBulletId: MutableRefObject<number>;
  pos: THREE.Vector3;
}) => {
  if (hasSapph && fireNow && !fireWas.current && !fireCd.current) {
    fireCd.current = true;
    const bx = pos.x + (facingR.current ? 0.55 : -0.55);
    bulletsRef.current.push({ id: nextBulletId.current++, x: bx, y: pos.y, dir: facingR.current ? 1 : -1 });
    setTimeout(() => { fireCd.current = false; }, FIRE_COOLDOWN * 1000);
  }
  fireWas.current = fireNow;
};
