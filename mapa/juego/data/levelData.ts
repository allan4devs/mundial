import type { PlatformData, CollectibleData, EnemyData, LevelData, PowerUpData, HazardData } from '../types';
import { getSafeGoalPosition, getSafeSpawnPosition } from '../lib/levelSpawn';
import * as reception from './levels/reception';
import * as cafetales from './levels/cafetales';
import * as montanita from './levels/montanita';
import * as stairs from './levels/stairs';
import * as river from './levels/river';

export { TRAIL_STATIONS, TRAIL_CONNECTIONS } from './stations';

// Legacy exports kept for compatibility
export const PLATFORMS: PlatformData[] = [];
export const COLLECTIBLES: CollectibleData[] = [];
export const ENEMIES: EnemyData[] = [];

const makeLevel = (
  id: string,
  title: string,
  subtitle: string,
  theme: LevelData['theme'],
  stationId: string,
  nextStationId: string | undefined,
  platforms: PlatformData[],
  collectibles: CollectibleData[],
  enemies: EnemyData[],
  powerUps: PowerUpData[] = [],
  hazards: HazardData[] = [],
): LevelData => ({
  id,
  title,
  subtitle,
  theme,
  stationId,
  nextStationId,
  spawnPosition: getSafeSpawnPosition(platforms),
  goalPosition: getSafeGoalPosition(platforms),
  platforms,
  collectibles,
  enemies,
  powerUps,
  hazards,
});

export const GAME_LEVELS: LevelData[] = [
  makeLevel(
    'recepcion-cafetales',
    'Recepción → Cafetales',
    'Baja, sube la loma y cáete al cañón. ¡La loma tiene sorpresas!',
    'reception',
    'recepcion',
    'sendero-cafetales',
    reception.platforms,
    reception.collectibles,
    reception.enemies,
    reception.powerUps,
    reception.hazards,
  ),
  makeLevel(
    'cafetales-montanita',
    'Cafetales → Montañita',
    'Baja al bañadero, sube hasta la cresta y caéte de una vez.',
    'cafetal',
    'sendero-cafetales',
    'montanita',
    cafetales.platforms,
    cafetales.collectibles,
    cafetales.enemies,
    cafetales.powerUps,
    cafetales.hazards,
  ),
  makeLevel(
    'montanita-descenso',
    'Montañita → Descenso',
    'Sube, sube, sube... y luego cáete todo de una.',
    'montanita',
    'montanita',
    'descenso-canon',
    montanita.platforms,
    montanita.collectibles,
    montanita.enemies,
    montanita.powerUps,
    montanita.hazards,
  ),
  makeLevel(
    'escaleras-canon',
    'Las Gargantas del Cañón',
    'Paredes de roca, plataformas angostas y un encierro escondido.',
    'stairs',
    'descenso-canon',
    'plataforma-rio',
    stairs.platforms,
    stairs.collectibles,
    stairs.enemies,
    stairs.powerUps,
    stairs.hazards,
  ),
  makeLevel(
    'descenso-rio',
    'Plataformas del Río',
    'Piedra mojada, pozas verdes y un groto secreto al borde del río.',
    'river',
    'descenso-canon',
    'plataforma-rio',
    river.platforms,
    river.collectibles,
    river.enemies,
    river.powerUps,
    river.hazards,
  ),
];
