import { Clock, Mountain } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { MapPoint } from '../../types';

interface PointCardProps {
  point: MapPoint;
}

export default function PointCard({ point }: PointCardProps) {
  const horizontal = point.align === 'right' ? '-translate-x-full -left-4' : point.align === 'center' ? '-translate-x-1/2 left-1/2' : 'left-7';

  return (
    <div
      className={cn(
        'pointer-events-none absolute z-20 hidden w-[min(230px,42vw)] rounded-md border border-stone-200 bg-white/95 p-3 text-stone-800 shadow-xl backdrop-blur md:block',
        horizontal,
      )}
      style={{ top: point.y - 42, left: point.x }}
    >
      <div className="text-sm font-black leading-tight">{point.name}</div>
      <p className="mt-1 text-[11px] leading-snug text-stone-600">{point.description}</p>
      <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-stone-700">
        <span className="inline-flex items-center gap-1">
          <Mountain className="h-3 w-3 text-amber-500" /> {point.difficulty}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {point.minutes} min
        </span>
      </div>
    </div>
  );
}
