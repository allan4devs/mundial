export type PlatformBehavior = 'collapse' | 'moveX' | 'moveY';

export interface PlatformData {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  kind?: 'trail' | 'mud' | 'root' | 'rock' | 'stair' | 'bridge' | 'river';
  /** Special dynamic behaviour (Crash-style collapse, DK/Mario movers). */
  behavior?: PlatformBehavior;
  /** Travel amplitude for moveX / moveY platforms (world units). */
  moveRange?: number;
  /** Cycle speed multiplier for moving platforms. */
  moveSpeed?: number;
  /** Seconds a collapsing platform holds before it drops after being stepped on. */
  collapseDelay?: number;
  /** Seconds before a collapsed platform re-appears (0 / undefined = never). */
  respawnDelay?: number;
}

/** Live, mutable state for a dynamic platform, shared via the registry ref. */
export interface LivePlatform {
  active: boolean;
  dx: number;
  dy: number;
  frameDx: number;
  frameDy: number;
}

export interface CollectibleData {
  id: string;
  position: [number, number, number];
  kind?: 'emerald';
}

export type PowerUpKind = 'ruby' | 'sapphire';

export interface PowerUpData {
  id: string;
  position: [number, number, number];
  kind: PowerUpKind;
}

export interface BulletState {
  id: number;
  x: number;
  y: number;
  dir: number;
}

export type HazardKind = 'spikes' | 'fire' | 'boulder' | 'saw' | 'log';

export interface HazardData {
  id: string;
  kind: HazardKind;
  position: [number, number, number];
  /** Footprint for static hazards (spikes / fire). */
  size?: [number, number, number];
  /** Travel range (boulder) or swing amplitude (saw / log). */
  range?: number;
  /** Movement speed multiplier. */
  speed?: number;
}

export type EnemyKind = 'bat' | 'crawler' | 'charger' | 'spitter';

export interface EnemyData {
  id: string;
  position: [number, number, number];
  patrolRange: number;
  /** Monster archetype. Defaults to the classic flying 'bat'. */
  kind?: EnemyKind;
}

export interface OtherPlayerView {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  finished: boolean;
}
