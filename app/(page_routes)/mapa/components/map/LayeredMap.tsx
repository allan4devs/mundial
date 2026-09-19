import { Fragment } from 'react';
import { MAP_POINTS, VIEWBOX } from '../../data/mapData';
import type { MapLayer, MapPoint } from '../../types';
import Marker from '../markers/Marker';
import PointCard from '../markers/PointCard';
import BackgroundCanvas from './svg/BackgroundCanvas';

interface LayeredMapProps {
  layers: Record<MapLayer, boolean>;
  activePoint: MapPoint;
  onSelectPoint: (point: MapPoint) => void;
  unlockedLevel: number;
  offsets?: Record<string, { x: number; y: number }>;
  editMode?: boolean;
  selectedId?: string | null;
}

export default function LayeredMap({ layers, activePoint, onSelectPoint, unlockedLevel, offsets = {}, editMode = false, selectedId }: LayeredMapProps) {
  return (
    <div className="relative min-w-[1120px]" style={{ width: VIEWBOX.width, height: VIEWBOX.height }}>
      <BackgroundCanvas layers={layers} offsets={offsets} editMode={editMode} selectedId={selectedId} />
      {MAP_POINTS
        .filter((point) => layers.platforms || point.type !== 'platform')
        .filter((point) => layers.service || point.type !== 'service')
        .map((point) => (
          <Fragment key={point.id}>
            <Marker
              point={point}
              isActive={activePoint.id === point.id}
              onSelect={onSelectPoint}
              unlockedLevel={unlockedLevel}
              editMode={editMode}
              offset={offsets[point.id]}
            />
            {activePoint.id === point.id ? <PointCard point={point} /> : null}
          </Fragment>
        ))}
    </div>
  );
}
