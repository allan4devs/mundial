import Bridge from '../Bridge';
import PlatformTower from '../PlatformTower';

// Q7 — bot-left: Plataforma 1, left river bridge (SVG coords 0–426 × 480–720)
export default function QuadrantBotLeft() {
  return (
    <g>
      <PlatformTower x={220} y={516} rotate={-8} />
      <Bridge x={220} y={562} rotate={86} />
    </g>
  );
}
