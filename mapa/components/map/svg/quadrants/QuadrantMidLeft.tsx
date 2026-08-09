import Cabin from '../Cabin';

// Q4 — mid-left: left forest, Casa Colibrí cabin, trail junction marker (SVG coords 0–426 × 240–479)
export default function QuadrantMidLeft() {
  return (
    <g>
      {/* Left forest patch */}
      <path
        d="M156 263 C225 205 320 220 360 289 C326 344 209 354 158 312 C143 299 143 279 156 263Z"
        fill="#4f8b41"
        opacity="0.74"
      />

      {/* Casa Colibrí cabin */}
      <Cabin x={352} y={306} />

      {/* Trail junction danger marker */}
      <path d="M360 356 L418 356 M390 330 L438 380 M410 330 L362 380" stroke="#3d3329" strokeWidth="3" strokeDasharray="6 5" />
    </g>
  );
}
