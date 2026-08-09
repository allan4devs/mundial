import { Mountain, Route, Shield, Waves, Wrench } from 'lucide-react';
import type { MapLayer } from '../../types';
import ToggleRow from './ToggleRow';

interface LegendPanelProps {
  layers: Record<MapLayer, boolean>;
  onToggleLayer: (layer: MapLayer) => void;
}

export default function LegendPanel({ layers, onToggleLayer }: LegendPanelProps) {
  return (
    <aside className="absolute right-4 top-4 z-50 w-40 rounded-lg border border-stone-200 bg-white/90 p-3 shadow-xl backdrop-blur">
      <div className="mb-2 text-sm font-black text-stone-900">Leyenda</div>
      <div className="space-y-1">
        <ToggleRow active={layers.trail} icon={<Route className="h-4 w-4" />} label="Sendero" onClick={() => onToggleLayer('trail')} />
        <ToggleRow active={layers.river} icon={<Waves className="h-4 w-4 text-sky-600" />} label="Río/Cañón" onClick={() => onToggleLayer('river')} />
        <ToggleRow active={layers.platforms} icon={<Mountain className="h-4 w-4 text-amber-700" />} label="Plataformas" onClick={() => onToggleLayer('platforms')} />
        <ToggleRow active={layers.service} icon={<Wrench className="h-4 w-4" />} label="Servicios" onClick={() => onToggleLayer('service')} />
        <ToggleRow active={layers.safe} icon={<Shield className="h-4 w-4 text-yellow-500" />} label="Zona segura" onClick={() => onToggleLayer('safe')} />
      </div>
    </aside>
  );
}
