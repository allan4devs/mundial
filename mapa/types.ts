import type { ReactNode } from 'react';

export type MapLayer = 'trail' | 'river' | 'platforms' | 'service' | 'safe';

export type MapPointType = 'service' | 'platform' | 'lookout' | 'trail';

export type PointDifficulty = 'Suave' | 'Media' | 'Alta';

export interface MapPoint {
  id: string;
  name: string;
  type: MapPointType;
  x: number;
  y: number;
  minutes: number;
  difficulty: PointDifficulty;
  description: string;
  align?: 'left' | 'right' | 'center';
  /** Índice del nivel del juego que corresponde a esta zona (0-4). Si undefined, no hay nivel. */
  levelIndex?: number;
}

export interface TourGroup {
  id: string;
  name: string;
  color: string;
  people: number;
  startTime: string;
  progress: number;
}

export interface MapLabel {
  text: string;
  x: number;
  y: number;
  rotate: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ToggleRowProps {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}
