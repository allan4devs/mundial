'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, MapPin, Mountain, Trees, Users } from 'lucide-react';
import { DEFAULT_LAYERS, MAP_POINTS, TOUR_GROUPS, VIEWBOX } from '../data/mapData';
import type { MapLayer, MapPoint } from '../types';
import ActiveGroupBadge from './controls/ActiveGroupBadge';
import ActivePointPanel from './controls/ActivePointPanel';
import LegendPanel from './controls/LegendPanel';
import ZoomControls from './controls/ZoomControls';
import LayeredMap from './map/LayeredMap';

// Read progress from the game's localStorage key
function readUnlockedLevel(): number {
  if (typeof window === 'undefined') return 0;
  try {
    // useGameState persists to 'lva-ghost-unlocked' or equivalent —
    // but currently it's only in-memory. We fall back to reading the
    // game state key that stores unlockedStationIndex.
    const raw = window.localStorage.getItem('lva-ghost-unlocked');
    if (raw !== null) return Math.max(0, parseInt(raw, 10));
  } catch {}
  return 0;
}

export default function LaViejaMapClient() {
  const [activePoint, setActivePoint] = useState<MapPoint>(MAP_POINTS[0]);
  const [zoom, setZoom] = useState(0.5);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [isDragging, setIsDragging] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  const activeGroup = useMemo(() => TOUR_GROUPS.find((group) => group.progress > 40) ?? TOUR_GROUPS[0], []);

  // Read unlocked level on mount + listen for storage changes (if player
  // switches tabs between game and map)
  useEffect(() => {
    setUnlockedLevel(readUnlockedLevel());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lva-ghost-unlocked') setUnlockedLevel(readUnlockedLevel());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleLayer = (layer: MapLayer) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setZoom((current) => Math.min(Math.max(current + delta, 0.25), 2.0));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    dragStart.current = { x: e.clientX, y: e.clientY, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const container = containerRef.current;
    if (!container) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    container.scrollLeft = dragStart.current.scrollLeft - dx;
    container.scrollTop = dragStart.current.scrollTop - dy;
  }, []);

  const stopDrag = useCallback(() => {
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#efe4c8] text-stone-900">
      <section className="relative h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_30%_10%,#fff7d8_0,#efe4c8_36%,#ddc79b_100%)]">
        <header className="pointer-events-none absolute left-0 top-0 z-40 w-full px-4 py-4 text-center sm:py-5">
          <h1 className="text-balance text-2xl font-black tracking-normal text-[#3a2112] drop-shadow-sm sm:text-4xl">
            La Vieja Adventures: Tour al Cañón del Río La Vieja
          </h1>
        </header>

        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto pt-20 select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
        >
          <div
            className="origin-top-left transition-transform duration-150"
            style={{ transform: `scale(${zoom})`, width: VIEWBOX.width, height: VIEWBOX.height }}
          >
            <LayeredMap
              layers={layers}
              activePoint={activePoint}
              onSelectPoint={setActivePoint}
              unlockedLevel={unlockedLevel}
            />
          </div>
        </div>

        <LegendPanel layers={layers} onToggleLayer={toggleLayer} />
        <ActivePointPanel
          point={activePoint}
          clockIcon={<Clock className="h-3.5 w-3.5" />}
          mapIcon={<MapPin className="h-5 w-5" />}
          mountainIcon={<Mountain className="h-3.5 w-3.5" />}
          unlockedLevel={unlockedLevel}
        />
        <ZoomControls setZoom={setZoom} />
        <ActiveGroupBadge
          group={activeGroup}
          leadingIcon={<Trees className="h-4 w-4 text-emerald-700" />}
          trailingIcon={<Users className="h-4 w-4 text-sky-700" />}
        />
      </section>
    </main>
  );
}
