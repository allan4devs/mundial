interface PlatformTowerProps {
  x: number;
  y: number;
  rotate?: number;
}

export default function PlatformTower({ x, y, rotate = 0 }: PlatformTowerProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="-13" y="-45" width="26" height="13" fill="#7a4b25" stroke="#3a2414" strokeWidth="3" />
      <path d="M-10 -32 L-18 42 M10 -32 L18 42 M-18 42 L18 42 M-13 -12 L13 -12 M-16 14 L16 14" stroke="#4a2b17" strokeWidth="4" />
      <path d="M-32 42 L32 42" stroke="#4a2b17" strokeWidth="8" strokeLinecap="round" />
    </g>
  );
}
