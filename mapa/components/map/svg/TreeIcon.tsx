interface TreeIconProps {
  x: number;
  y: number;
  scale?: number;
}

export default function TreeIcon({ x, y, scale = 1 }: TreeIconProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 18 L0 30" stroke="#5b3b22" strokeWidth="4" strokeLinecap="round" />
      <path d="M0 -20 C18 -8 21 13 1 20 C-18 16 -18 -8 0 -20Z" fill="#3f7f3c" stroke="#24552a" strokeWidth="2" />
      <path d="M-10 8 C-5 0 2 0 9 7" fill="none" stroke="#2f6b32" strokeWidth="2" />
    </g>
  );
}
