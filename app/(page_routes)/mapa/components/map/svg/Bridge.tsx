interface BridgeProps {
  x: number;
  y: number;
  rotate?: number;
}

export default function Bridge({ x, y, rotate = 0 }: BridgeProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d="M-36 0 C-15 -12 15 -12 36 0" fill="none" stroke="#5a341d" strokeWidth="7" strokeLinecap="round" />
      {[-28, -14, 0, 14, 28].map((line) => (
        <path key={line} d={`M${line} -8 L${line} 7`} stroke="#2e1d12" strokeWidth="2" />
      ))}
    </g>
  );
}
