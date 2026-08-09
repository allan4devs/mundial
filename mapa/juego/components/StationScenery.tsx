'use client';
import type { LevelData } from '../types';
import { CAFETAL_TRUNKS, FOREST_TRUNKS, RIVER_ROCKS, STAIRS_STEPS } from '../constants/environment';
import { getBoxGeometry, getSphereGeometry, getStandardMaterial } from '../lib/renderAssets';

export function StationScenery({ theme }: { theme: LevelData['theme'] }) {
  if (theme === 'stairs') {
    return (
      <>
        <CanonWall x={-7} color="#2d241d" />
        <CanonWall x={50} color="#3a2b22" />
        {STAIRS_STEPS.map((i) => (
          <mesh
            key={i}
            position={[9 + i * 4.1, -2.3 + i * 0.28, -0.65]}
            geometry={getBoxGeometry(1.5, 0.22, 0.2)}
            material={getStandardMaterial({ color: '#9c7444', roughness: 0.92 })}
          />
        ))}
      </>
    );
  }

  if (theme === 'river') {
    return (
      <>
        <CanonWall x={-7} color="#25302e" />
        <CanonWall x={50} color="#293b36" />
        {RIVER_ROCKS.map((x, i) => (
          <mesh
            key={x}
            position={[x, -2.25 + (i % 2) * 0.18, 0.35]}
            geometry={getSphereGeometry(1.4 + (i % 2) * 0.5, 12, 8)}
            material={getStandardMaterial({ color: '#566b63' })}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <CanonWall x={-7} color={theme === 'montanita' ? '#2c2f20' : '#281e10'} />
      <CanonWall x={50} color={theme === 'montanita' ? '#343824' : '#281e10'} />
      {(theme === 'cafetal' ? CAFETAL_TRUNKS : FOREST_TRUNKS).map((x, i) => (
        <mesh
          key={x}
          position={[x, -0.8, -0.25]}
          rotation={[0, 0, i % 2 ? -0.08 : 0.08]}
          geometry={getBoxGeometry(0.35, theme === 'cafetal' ? 4.4 : 5.8, 0.25)}
          material={getStandardMaterial({ color: theme === 'cafetal' ? '#355024' : '#3c2b17' })}
        />
      ))}
    </>
  );
}

function CanonWall({ x, color }: { x: number; color: string }) {
  return (
    <mesh
      position={[x, 6, 0]}
      geometry={getBoxGeometry(5, 28, 2.5)}
      material={getStandardMaterial({ color })}
    />
  );
}
