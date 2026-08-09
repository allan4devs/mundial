import { ZoomIn, ZoomOut } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface ZoomControlsProps {
  setZoom: Dispatch<SetStateAction<number>>;
}

export default function ZoomControls({ setZoom }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-5 right-4 z-50 grid gap-2">
      <button
        type="button"
        aria-label="Acercar mapa"
        onClick={() => setZoom((value) => Math.min(value + 0.1, 2.0))}
        className="grid h-11 w-11 place-items-center rounded-md border border-stone-200 bg-white text-stone-800 shadow-lg transition hover:bg-stone-100"
      >
        <ZoomIn className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Alejar mapa"
        onClick={() => setZoom((value) => Math.max(value - 0.1, 0.25))}
        className="grid h-11 w-11 place-items-center rounded-md border border-stone-200 bg-white text-stone-800 shadow-lg transition hover:bg-stone-100"
      >
        <ZoomOut className="h-5 w-5" />
      </button>
    </div>
  );
}
