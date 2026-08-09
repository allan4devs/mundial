import type { MapLayer } from '../../../../types';

interface QuadrantTopCenterProps {
  layers: Record<MapLayer, boolean>;
}

// Q2 — top-center: lookout deck, safe zone overlay (SVG coords 427–853 × 0–239)
export default function QuadrantTopCenter({ layers }: QuadrantTopCenterProps) {
  return (
    <g>
      {/* Lookout deck structure */}
      <g transform="translate(548 118)">
        <rect x="-24" y="-22" width="48" height="12" fill="#8a552e" stroke="#3a2414" strokeWidth="3" />
        <path d="M-18 -10 L-22 44 M18 -10 L22 44 M-22 44 L22 44 M-20 10 L20 10 M-20 28 L20 28" stroke="#4a2b17" strokeWidth="4" />
        <path d="M-30 -22 L30 -22" stroke="#3a2414" strokeWidth="5" strokeLinecap="round" />
        <text x="44" y="22" fill="#2b2118" fontSize="23" fontWeight="900">Mirador</text>
      </g>

      {/* Safe zone overlay (togglable layer) */}
      {layers.safe && (
        <path
          d="M470 226 C590 190 674 226 718 282 C640 324 536 316 458 274Z"
          fill="#fef08a"
          opacity="0.4"
          stroke="#eab308"
          strokeDasharray="8 8"
          strokeWidth="3"
        />
      )}
    </g>
  );
}
