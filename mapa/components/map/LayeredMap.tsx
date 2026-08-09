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
}

export default function LayeredMap({ layers, activePoint, onSelectPoint, unlockedLevel }: LayeredMapProps) {
  return (
    <div className="relative min-w-[1120px]" style={{ width: VIEWBOX.width, height: VIEWBOX.height }}>
      <BackgroundCanvas layers={layers} />
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
            />
            {activePoint.id === point.id ? <PointCard point={point} /> : null}
          </Fragment>
        ))}
    </div>
  );
}
