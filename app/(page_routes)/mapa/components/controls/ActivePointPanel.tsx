import type { ReactNode } from 'react';
import type { MapPoint } from '../../types';

interface ActivePointPanelProps {
  point: MapPoint;
  clockIcon: ReactNode;
  mapIcon: ReactNode;
  mountainIcon: ReactNode;
  unlockedLevel: number;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Suave: 'bg-green-100 text-green-800',
  Media: 'bg-amber-100 text-amber-800',
  Alta: 'bg-red-100 text-red-800',
};

export default function ActivePointPanel({ point, clockIcon, mapIcon, mountainIcon, unlockedLevel }: ActivePointPanelProps) {
  const hasLevel = point.levelIndex !== undefined;
  const isUnlocked = hasLevel && point.levelIndex! <= unlockedLevel;
  const isLocked = hasLevel && !isUnlocked;

  const gameUrl = hasLevel
    ? `/mapa/juego?level=${point.levelIndex}`
    : '/mapa/juego';

  return (
    <div className="absolute bottom-5 left-4 z-50 w-[min(340px,calc(100vw-2rem))] rounded-xl border border-stone-200 bg-white/95 p-4 shadow-xl backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-500 text-white">
          {mapIcon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black leading-tight text-stone-950">{point.name}</h2>
          <p className="mt-1 text-sm leading-snug text-stone-600">{point.description}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${DIFFICULTY_COLORS[point.difficulty] ?? 'bg-stone-100 text-stone-700'}`}>
              {mountainIcon} {point.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-1 text-sky-800">
              {clockIcon} {point.minutes} min
            </span>
            {hasLevel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-emerald-800">
                Zona {point.levelIndex! + 1}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Play button */}
      {hasLevel && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          {isUnlocked ? (
            <a
              href={gameUrl}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
            >
              <span>▶</span>
              <span>JUGAR ESTE TRAMO</span>
            </a>
          ) : (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-100 px-4 py-2.5 text-sm font-bold text-stone-400">
              <span>🔒</span>
              <span>Tramo bloqueado — completa el anterior</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
