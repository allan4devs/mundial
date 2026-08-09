import type { PlatformData, CollectibleData, EnemyData, PowerUpData, HazardData } from './entities';

export interface LevelData {
  id: string;
  title: string;
  subtitle: string;
  theme: 'reception' | 'cafetal' | 'montanita' | 'stairs' | 'river';
  stationId: string;
  nextStationId?: string;
  spawnPosition: [number, number, number];
  goalPosition: [number, number, number];
  platforms: PlatformData[];
  collectibles: CollectibleData[];
  enemies: EnemyData[];
  powerUps: PowerUpData[];
  hazards: HazardData[];
}

export interface TrailStation {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  description: string;
}
