import { SVG_VIEWBOX, TOUR_GROUPS } from '../../../data/mapData';
import type { MapLayer } from '../../../types';
import MapDefs from './MapDefs';
import MapLabels from './MapLabels';
import RiverLayer from './RiverLayer';
import TerrainBase from './TerrainBase';
import TrailLayer from './TrailLayer';
import TourRunner from './TourRunner';
import TreeLayer from './TreeLayer';
import QuadrantTopLeft from './quadrants/QuadrantTopLeft';
import QuadrantTopCenter from './quadrants/QuadrantTopCenter';
import QuadrantTopRight from './quadrants/QuadrantTopRight';
import QuadrantMidLeft from './quadrants/QuadrantMidLeft';
import QuadrantMidCenter from './quadrants/QuadrantMidCenter';
import QuadrantMidRight from './quadrants/QuadrantMidRight';
import QuadrantBotLeft from './quadrants/QuadrantBotLeft';
import QuadrantBotCenter from './quadrants/QuadrantBotCenter';
import QuadrantBotRight from './quadrants/QuadrantBotRight';

interface BackgroundCanvasProps {
  layers: Record<MapLayer, boolean>;
}

// SVG viewBox is fixed at the original 1280×720 coordinate space.
// The HTML container is 2× larger (2560×1440), so the SVG auto-scales all content 2×.
export default function BackgroundCanvas({ layers }: BackgroundCanvasProps) {
  return (
    <svg viewBox={`0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`} className="absolute inset-0 h-full w-full">
      <MapDefs />
      <TerrainBase />

      {/* ── Top row  (y 0 – 239) ─────────────────────────────────────── */}
      <QuadrantTopLeft />
      <QuadrantTopCenter layers={layers} />
      <QuadrantTopRight />

      {/* ── Middle row  (y 240 – 479) ────────────────────────────────── */}
      <QuadrantMidLeft />
      <QuadrantMidCenter />
      <QuadrantMidRight />

      {/* ── Bottom row  (y 480 – 720) ────────────────────────────────── */}
      {layers.platforms && <QuadrantBotLeft />}
      {layers.platforms && <QuadrantBotCenter />}
      {layers.platforms && <QuadrantBotRight />}

      {/* ── Spanning layers (cross multiple quadrants) ───────────────── */}
      {layers.river && <RiverLayer />}
      {layers.trail && <TrailLayer />}
      <TreeLayer />
      <MapLabels />
      {TOUR_GROUPS.map((group) => (
        <TourRunner key={group.id} group={group} />
      ))}
    </svg>
  );
}
