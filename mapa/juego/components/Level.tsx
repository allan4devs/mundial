'use client';
import { memo } from 'react';
import { Platform } from './Platform';
import { Collectible } from './Collectible';
import { Enemy } from './Enemy';
import { Hazard } from './Hazard';
import { Goal } from './Goal';
import { PowerUp } from './PowerUp';
import type { GameState, LevelData } from '../types';

export const Level = memo(function Level({
  level,
  gameStatus,
}: {
  level: LevelData;
  gameStatus: GameState['status'];
}) {
  return (
    <>
      <LevelPlatforms level={level} gameStatus={gameStatus} />
      <StaticLevelItems level={level} />
      <LevelHazards level={level} gameStatus={gameStatus} />
      <LevelEnemies level={level} gameStatus={gameStatus} />
      <Goal position={level.goalPosition} gameStatus={gameStatus} />
    </>
  );
});

const LevelPlatforms = memo(function LevelPlatforms({
  level,
  gameStatus,
}: {
  level: LevelData;
  gameStatus: GameState['status'];
}) {
  return (
    <>
      {level.platforms.map(p => <Platform key={p.id} data={p} gameStatus={gameStatus} />)}
    </>
  );
});

const StaticLevelItems = memo(function StaticLevelItems({ level }: { level: LevelData }) {
  return (
    <>
      {level.collectibles.map(c => <Collectible key={c.id} data={c} />)}
      {level.powerUps.map(pu => <PowerUp key={pu.id} data={pu} />)}
    </>
  );
});

const LevelHazards = memo(function LevelHazards({
  level,
  gameStatus,
}: {
  level: LevelData;
  gameStatus: GameState['status'];
}) {
  return (
    <>
      {level.hazards.map(h => <Hazard key={h.id} data={h} gameStatus={gameStatus} />)}
    </>
  );
});

const LevelEnemies = memo(function LevelEnemies({
  level,
  gameStatus,
}: {
  level: LevelData;
  gameStatus: GameState['status'];
}) {
  return (
    <>
      {level.enemies.map(e => <Enemy key={e.id} data={e} gameStatus={gameStatus} />)}
    </>
  );
});
