import { Binoculars, Footprints, Home, Route } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { MapPoint } from '../../types';

interface MarkerProps {
  point: MapPoint;
  isActive: boolean;
  onSelect: (point: MapPoint) => void;
  unlockedLevel: number;
}

export default function Marker({ point, isActive, onSelect, unlockedLevel }: MarkerProps) {
  const Icon = point.type === 'service' ? Home
    : point.type === 'lookout' ? Binoculars
    : point.type === 'trail' ? Footprints
    : Route;

  const hasLevel = point.levelIndex !== undefined;
  const isUnlocked = hasLevel && point.levelIndex! <= unlockedLevel;
  const isLocked = hasLevel && !isUnlocked;

  return (
    <button
      type="button"
      aria-label={point.name}
      onClick={() => onSelect(point)}
      className={cn(
        'absolute z-30 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white text-white shadow-lg transition hover:scale-110',
        isActive ? 'scale-125' : '',
        hasLevel
          ? isUnlocked
            ? 'h-10 w-10 bg-emerald-600 hover:bg-emerald-500'
            : 'h-9 w-9 bg-stone-400 opacity-60 hover:opacity-80'
          : 'h-9 w-9 bg-sky-500',
        isActive && hasLevel && isUnlocked && 'bg-orange-500 hover:bg-orange-400',
        isActive && (!hasLevel || isLocked) && 'bg-orange-500',
      )}
      style={{ left: point.x, top: point.y }}
    >
      {isLocked ? (
        <span className="text-xs">🔒</span>
      ) : (
        <Icon className={cn('h-4 w-4', hasLevel && isUnlocked && !isActive && 'text-emerald-100')} />
      )}

      {/* Pulse ring for unlocked game levels */}
      {hasLevel && isUnlocked && !isActive && (
        <span
          className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60"
          aria-hidden
        />
      )}

      {/* "▶" badge for levels with game */}
      {hasLevel && isUnlocked && (
        <span
          className="absolute -bottom-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[8px] font-black text-emerald-950 shadow"
          aria-hidden
        >
          {isActive ? '●' : '▶'}
        </span>
      )}
    </button>
  );
}
