'use client';
import { memo, type RefObject } from 'react';
import * as THREE from 'three';

interface PlayerVisualProps {
  visualRef: RefObject<THREE.Group | null>;
  bodyMatRef: RefObject<THREE.MeshStandardMaterial | null>;
  eyeL: RefObject<THREE.Mesh | null>;
  eyeR: RefObject<THREE.Mesh | null>;
}

export const PlayerVisual = memo(function PlayerVisual({
  visualRef,
  bodyMatRef,
  eyeL,
  eyeR,
}: PlayerVisualProps) {
  return (
    <group ref={visualRef}>
      <mesh>
        <sphereGeometry args={[0.34, 18, 18]} />
        <meshStandardMaterial
          ref={bodyMatRef}
          color="#d4f0ff"
          emissive="#4fc3f7"
          emissiveIntensity={0.65}
          transparent
          opacity={0.87}
        />
      </mesh>

      <mesh position={[0, -0.27, 0]}>
        <coneGeometry args={[0.34, 0.44, 8, 1, true]} />
        <meshStandardMaterial
          color="#c4e8ff"
          emissive="#4fc3f7"
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {[-0.14, 0, 0.14].map((xoff) => (
        <mesh key={xoff} position={[xoff, -0.48, 0]}>
          <sphereGeometry args={[0.087, 8, 8]} />
          <meshStandardMaterial
            color="#c4e8ff"
            emissive="#4fc3f7"
            emissiveIntensity={0.4}
            transparent
            opacity={0.62}
          />
        </mesh>
      ))}

      <mesh ref={eyeL} position={[0.12, 0.08, 0.29]}>
        <sphereGeometry args={[0.062, 8, 8]} />
        <meshStandardMaterial color="#001e3c" emissive="#1565c0" emissiveIntensity={1.8} />
      </mesh>
      <mesh ref={eyeR} position={[-0.12, 0.08, 0.29]}>
        <sphereGeometry args={[0.062, 8, 8]} />
        <meshStandardMaterial color="#001e3c" emissive="#1565c0" emissiveIntensity={1.8} />
      </mesh>

      <pointLight color="#4fc3f7" intensity={2.2} distance={3.8} decay={2} />
    </group>
  );
});
