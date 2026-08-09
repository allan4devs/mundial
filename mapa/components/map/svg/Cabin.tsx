interface CabinProps {
  x: number;
  y: number;
  label?: string;
}

export default function Cabin({ x, y, label }: CabinProps) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-22 13 L-22 -8 L0 -25 L22 -8 L22 13 Z" fill="#b7793f" stroke="#4a2d17" strokeWidth="3" />
      <path d="M-28 -7 L0 -30 L28 -7" fill="none" stroke="#4a2d17" strokeWidth="5" strokeLinecap="round" />
      <rect x="-8" y="-2" width="12" height="15" fill="#275d43" />
      <rect x="8" y="-3" width="8" height="8" fill="#9ad5e8" />
      {label ? (
        <text x="34" y="2" fill="#2b2118" fontSize="16" fontWeight="700">
          {label}
        </text>
      ) : null}
    </g>
  );
}
