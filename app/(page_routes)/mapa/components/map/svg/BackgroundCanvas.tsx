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
  offsets?: Record<string, { x: number; y: number }>;
  editMode?: boolean;
  selectedId?: string | null;
}

// SVG viewBox is fixed at the original 1280×720 coordinate space.
// The HTML container is 2× larger (2560×1440), so the SVG auto-scales all content 2×.
export default function BackgroundCanvas({ layers, offsets = {}, editMode = false, selectedId }: BackgroundCanvasProps) {
  const movable = (id: string) => ({
    'data-map-item': id,
    transform: `translate(${(offsets[id]?.x ?? 0) / 2} ${(offsets[id]?.y ?? 0) / 2})`,
    style: { cursor: editMode ? 'move' : 'default', outline: selectedId === id ? '1px dashed #f97316' : undefined },
  });
  return (
    <svg viewBox={`0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`} className="absolute inset-0 h-full w-full">
      <MapDefs />
      <g {...movable('terrain')}><TerrainBase /></g>

      {/* ── Top row  (y 0 – 239) ─────────────────────────────────────── */}
      <g {...movable('area-northwest')}><QuadrantTopLeft /></g>
      <g {...movable('area-north')}><QuadrantTopCenter layers={layers} /></g>
      <g {...movable('area-northeast')}><QuadrantTopRight /></g>

      {/* ── Middle row  (y 240 – 479) ────────────────────────────────── */}
      <g {...movable('area-west')}><QuadrantMidLeft /></g>
      <g {...movable('area-center')}><QuadrantMidCenter /></g>
      <g {...movable('area-east')}><QuadrantMidRight /></g>

      {/* ── Bottom row  (y 480 – 720) ────────────────────────────────── */}
      {layers.platforms && <g {...movable('area-southwest')}><QuadrantBotLeft /></g>}
      {layers.platforms && <g {...movable('area-south')}><QuadrantBotCenter /></g>}
      {layers.platforms && <g {...movable('area-southeast')}><QuadrantBotRight /></g>}

      {/* ── Spanning layers (cross multiple quadrants) ───────────────── */}
      {layers.river && <g {...movable('river')}><RiverLayer /></g>}
      {layers.trail && <g {...movable('trails')}><TrailLayer /></g>}
      <TreeLayer offsets={offsets} editMode={editMode} />
      <MapLabels offsets={offsets} editMode={editMode} selectedId={selectedId} />
      <g {...movable('tour-groups')}>{TOUR_GROUPS.map((group) => <TourRunner key={group.id} group={group} />)}</g>
    </svg>
  );
}
