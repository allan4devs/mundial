'use client';
/* eslint-disable react-hooks/immutability */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { LevelData } from '../types';
import { THEMES } from '../constants/themes';
import { FarBackdrop, MidgroundLeaves, RiverLayer } from './EnvironmentLayers';
import { StationScenery } from './StationScenery';
import { getBoxGeometry, getStandardMaterial } from '../lib/renderAssets';

export function Environment({ level }: { level: LevelData }) {
  const { scene } = useThree();
  const theme = THEMES[level.theme];
  const farRef = useRef<THREE.Group>(null);
  const midRef = useRef<THREE.Group>(null);
  const riverRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useEffect(() => {
    scene.background = new THREE.Color(theme.sky);
    scene.fog = new THREE.FogExp2(theme.fog, theme.fogDensity);
    return () => {
      scene.fog = null;
    };
  }, [scene, theme.fog, theme.fogDensity, theme.sky]);

  useFrame((state, delta) => {
    t.current += delta;
    const camX = state.camera.position.x;

    if (farRef.current) farRef.current.position.x = camX * 0.08;
    if (midRef.current) midRef.current.position.x = camX * 0.28;
    if (riverRef.current) {
      (riverRef.current.material as THREE.MeshBasicMaterial).opacity = 0.78 + Math.sin(t.current * 1.4) * 0.04;
    }
  });

  return (
    <>
      <ambientLight color={theme.ambient} intensity={0.85} />
      <directionalLight position={[8, 18, 4]} color={theme.sun} intensity={1.25} />
      <hemisphereLight args={['#1a4a28', '#3a2a14', 0.35]} />

      <FarBackdrop groupRef={farRef} theme={theme} />
      <MidgroundLeaves groupRef={midRef} theme={theme} />
      <RiverLayer riverRef={riverRef} theme={theme} />

      <StationScenery theme={level.theme} />
      <mesh
        position={[22, -5, 0]}
        geometry={getBoxGeometry(70, 3, 2.5)}
        material={getStandardMaterial({ color: theme.floor })}
      >
      </mesh>
    </>
  );
}

