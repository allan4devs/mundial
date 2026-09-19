'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, MapPin, Mountain, Move, RotateCcw, Trees, Users, X } from 'lucide-react';
import { DEFAULT_LAYERS, MAP_LABELS, MAP_POINTS, TOUR_GROUPS, TREE_POSITIONS, VIEWBOX } from '../data/mapData';
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
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const objectDrag = useRef<{ id: string; x: number; y: number; svg: boolean } | null>(null);

  const editorItems = useMemo(() => [
    { id: 'terrain', name: 'Terreno base', group: 'Paisaje', svg: true },
    ...['area-northwest', 'area-north', 'area-northeast', 'area-west', 'area-center', 'area-east', 'area-southwest', 'area-south', 'area-southeast'].map((id, i) => ({ id, name: `Zona del mapa ${i + 1}`, group: 'Paisaje', svg: true })),
    { id: 'river', name: 'Río', group: 'Rutas', svg: true },
    { id: 'trails', name: 'Senderos', group: 'Rutas', svg: true },
    { id: 'tour-groups', name: 'Grupos en recorrido', group: 'Rutas', svg: true },
    ...MAP_LABELS.map((label, i) => ({ id: `label-${i}`, name: label.text, group: 'Nombres', svg: true })),
    ...TREE_POSITIONS.map((_, i) => ({ id: `tree-${i}`, name: `Árbol ${i + 1}`, group: 'Vegetación', svg: true })),
    ...MAP_POINTS.map((point) => ({ id: point.id, name: point.name, group: 'Puntos', svg: false })),
  ], []);

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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('lva-map-layout-v1');
      if (saved) setOffsets(JSON.parse(saved) as Record<string, { x: number; y: number }>);
    } catch {}
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem('lva-map-layout-v1', JSON.stringify(offsets)); } catch {}
  }, [offsets]);

  const toggleLayer = (layer: MapLayer) => {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setZoom((current) => Math.min(Math.max(current + delta, 0.25), 2.0));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (editMode) {
      const target = e.target as HTMLElement;
      const item = target.closest<HTMLElement>('[data-map-item]');
      if (item) {
        e.preventDefault();
        e.stopPropagation();
        const id = item.dataset.mapItem;
        if (id) {
          setSelectedId(id);
          objectDrag.current = { id, x: e.clientX, y: e.clientY, svg: item.dataset.mapItem !== undefined && !MAP_POINTS.some((point) => point.id === id) };
        }
        return;
      }
    }
    const container = containerRef.current;
    if (!container) return;
    dragStart.current = { x: e.clientX, y: e.clientY, scrollLeft: container.scrollLeft, scrollTop: container.scrollTop };
    setIsDragging(true);
  }, [editMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (objectDrag.current) {
      const drag = objectDrag.current;
      const dx = (e.clientX - drag.x) / zoom;
      const dy = (e.clientY - drag.y) / zoom;
      objectDrag.current = { ...drag, x: e.clientX, y: e.clientY };
      setOffsets((current) => ({ ...current, [drag.id]: { x: (current[drag.id]?.x ?? 0) + dx, y: (current[drag.id]?.y ?? 0) + dy } }));
      return;
    }
    if (!dragStart.current) return;
    const container = containerRef.current;
    if (!container) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    container.scrollLeft = dragStart.current.scrollLeft - dx;
    container.scrollTop = dragStart.current.scrollTop - dy;
  }, [zoom]);

  const stopDrag = useCallback(() => {
    dragStart.current = null;
    objectDrag.current = null;
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
              offsets={offsets}
              editMode={editMode}
              selectedId={selectedId}
            />
          </div>
        </div>

        <LegendPanel layers={layers} onToggleLayer={toggleLayer} />
        <div className="absolute left-4 top-4 z-50 flex gap-2">
          <button type="button" onClick={() => { setEditMode((value) => !value); setSelectedId(null); }} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg ${editMode ? 'bg-stone-900 text-white' : 'bg-white text-stone-800'}`}>
            {editMode ? <Check className="h-4 w-4" /> : <Move className="h-4 w-4" />}{editMode ? 'Terminar edición' : 'Editar mapa'}
          </button>
        </div>
        {editMode && (
          <aside className="absolute bottom-5 right-4 z-50 flex max-h-[68vh] w-72 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white/95 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between border-b border-stone-100 p-4">
              <div><div className="font-black text-stone-900">Elementos del mapa</div><p className="mt-1 text-xs text-stone-500">Arrastrá en el lienzo para acomodarlos.</p></div>
              <button type="button" aria-label="Cerrar editor" onClick={() => setEditMode(false)} className="rounded-lg p-1.5 hover:bg-stone-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-y-auto p-2">
              {['Puntos', 'Nombres', 'Rutas', 'Paisaje', 'Vegetación'].map((group) => (
                <section key={group} className="mb-2">
                  <h2 className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-stone-400">{group}</h2>
                  {editorItems.filter((item) => item.group === group).map((item) => (
                    <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs ${selectedId === item.id ? 'bg-orange-50 font-bold text-orange-800 ring-1 ring-orange-200' : 'text-stone-700 hover:bg-stone-50'}`}>
                      <span className="truncate">{item.name}</span><Move className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </button>
                  ))}
                </section>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 p-3 text-[11px] text-stone-500">
              <span>Se guarda automáticamente</span>
              <button type="button" onClick={() => { setOffsets({}); setSelectedId(null); }} className="flex items-center gap-1 rounded-lg px-2 py-1 font-semibold hover:bg-stone-100"><RotateCcw className="h-3 w-3" />Restablecer</button>
            </div>
          </aside>
        )}
        {!editMode && <ActivePointPanel
          point={activePoint}
          clockIcon={<Clock className="h-3.5 w-3.5" />}
          mapIcon={<MapPin className="h-5 w-5" />}
          mountainIcon={<Mountain className="h-3.5 w-3.5" />}
          unlockedLevel={unlockedLevel}
        />}
        <ZoomControls setZoom={setZoom} />
        {!editMode && <ActiveGroupBadge
          group={activeGroup}
          leadingIcon={<Trees className="h-4 w-4 text-emerald-700" />}
          trailingIcon={<Users className="h-4 w-4 text-sky-700" />}
        />}
      </section>
    </main>
  );
}
