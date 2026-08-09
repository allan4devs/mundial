'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameRuntimeContext } from '../context/GameContext';

const BULLET_SPEED = 16;
const BULLET_MAX_X = 70;

const bulletGeo = new THREE.OctahedronGeometry(0.13, 0);
const bulletMat = new THREE.MeshStandardMaterial({
  color: '#1e88e5',
  emissive: '#0d47a1',
  emissiveIntensity: 3,
  roughness: 0.1,
});

export function Bullets() {
  const { bulletsRef } = useGameRuntimeContext();
  const groupRef = useRef<THREE.Group>(null);
  const meshPool = useRef<Map<number, THREE.Mesh>>(new Map());

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const bullets = bulletsRef.current;

    // Move bullets and remove out-of-bounds
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].x += bullets[i].dir * BULLET_SPEED * delta;
      if (Math.abs(bullets[i].x) > BULLET_MAX_X) {
        const mesh = meshPool.current.get(bullets[i].id);
        if (mesh) {
          group.remove(mesh);
          meshPool.current.delete(bullets[i].id);
        }
        bullets.splice(i, 1);
      }
    }

    const activeIds = new Set(bullets.map(b => b.id));

    // Remove stale meshes
    for (const [id, mesh] of meshPool.current) {
      if (!activeIds.has(id)) {
        group.remove(mesh);
        meshPool.current.delete(id);
      }
    }

    // Add new meshes and update positions
    for (const bullet of bullets) {
      let mesh = meshPool.current.get(bullet.id);
      if (!mesh) {
        mesh = new THREE.Mesh(bulletGeo, bulletMat);
        group.add(mesh);
        meshPool.current.set(bullet.id, mesh);
      }
      mesh.position.set(bullet.x, bullet.y, 0);
      mesh.rotation.y += delta * 4;
    }
  });

  return <group ref={groupRef} />;
}
