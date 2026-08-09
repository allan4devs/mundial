'use client';
import type { RefObject } from 'react';
import * as THREE from 'three';
import { FAR_BLOCKS, FAR_TRUNKS, MID_LEAVES } from '../constants/environment';
import type { THEMES } from '../constants/themes';
import { getBasicMaterial, getBoxGeometry, getPlaneGeometry } from '../lib/renderAssets';

type Theme = (typeof THEMES)[keyof typeof THEMES];

export function FarBackdrop({
  groupRef,
  theme,
}: {
  groupRef: RefObject<THREE.Group | null>;
  theme: Theme;
}) {
  return (
    <group ref={groupRef} position={[20, 0, -22]} dispose={null}>
      <mesh geometry={getPlaneGeometry(150, 58)} material={getBasicMaterial({ color: theme.backdrop })} />

      {FAR_BLOCKS.map((x, i) => (
        <mesh
          key={x}
          position={[x, 7 + (i % 3) * 1.5, 0.12]}
          geometry={getBoxGeometry(18 + (i % 2) * 6, 22 + (i % 3) * 4, 0.1)}
          material={getBasicMaterial({ color: i % 2 === 0 ? theme.farA : theme.farB })}
        />
      ))}

      {FAR_TRUNKS.map((x, i) => (
        <mesh
          key={x}
          position={[x, 13 - i * 0.5, 0.22]}
          geometry={getBoxGeometry(0.12, 13 + i, 0.04)}
          material={getBasicMaterial({ color: theme.trunks })}
        />
      ))}
    </group>
  );
}

export function MidgroundLeaves({
  groupRef,
  theme,
}: {
  groupRef: RefObject<THREE.Group | null>;
  theme: Theme;
}) {
  return (
    <group ref={groupRef} position={[20, 0, -11]} dispose={null}>
      {MID_LEAVES.map((i) => (
        <mesh
          key={i}
          position={[-22 + i * 8, -2.7 + (i % 2) * 0.45, 0]}
          rotation={[0, 0, i % 2 ? -0.14 : 0.14]}
          geometry={getPlaneGeometry(3.4, 4.4)}
          material={getBasicMaterial({ color: theme.leaves, side: THREE.DoubleSide })}
        />
      ))}
    </group>
  );
}

export function RiverLayer({
  riverRef,
  theme,
}: {
  riverRef: RefObject<THREE.Mesh | null>;
  theme: Theme;
}) {
  return (
    <>
      <mesh ref={riverRef} position={[22, -3.1, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive attach="geometry" object={getPlaneGeometry(100, 7)} />
        <meshBasicMaterial color={theme.water} transparent opacity={theme.waterOpacity} />
      </mesh>
      <mesh
        position={[22, -2.86, -0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={getPlaneGeometry(100, 4)}
        material={getBasicMaterial({ color: theme.waterGlow, transparent: true, opacity: 0.38 })}
      />
    </>
  );
}
