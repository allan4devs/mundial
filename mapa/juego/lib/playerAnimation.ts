import type { MutableRefObject } from 'react';
import * as THREE from 'three';

export const updatePlayerAnimation = ({
  animTime,
  blinkTime,
  eyeL,
  eyeR,
  facingR,
  grounded,
  group,
  moveX,
  velocity,
  visual,
}: {
  animTime: number;
  blinkTime: number;
  eyeL: THREE.Mesh | null;
  eyeR: THREE.Mesh | null;
  facingR: MutableRefObject<boolean>;
  grounded: boolean;
  group: THREE.Group;
  moveX: number;
  velocity: THREE.Vector3;
  visual: THREE.Group | null;
}) => {
  group.scale.x = facingR.current ? 1 : -1;

  if (grounded) {
    if (visual) visual.position.y = Math.sin(animTime * 4.5) * 0.007;
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, -moveX * 0.14, 0.14);
    group.scale.y = THREE.MathUtils.lerp(group.scale.y, 1, 0.18);
  } else {
    if (visual) visual.position.y = 0;
    const stretch = velocity.y > 0 ? 1.28 : 0.84;
    group.scale.y = THREE.MathUtils.lerp(group.scale.y, stretch, 0.14);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.09);
  }

  const eyeScaleY = blinkTime % 3 < 0.1 ? 0.15 : 1;
  if (eyeL) eyeL.scale.y = eyeScaleY;
  if (eyeR) eyeR.scale.y = eyeScaleY;
};
