import Bridge from '../Bridge';
import PlatformTower from '../PlatformTower';

// Q8 — bot-center: Plataforma 2–3 area, center river bridge (SVG coords 427–853 × 480–720)
export default function QuadrantBotCenter() {
  return (
    <g>
      <PlatformTower x={745} y={612} rotate={6} />
      <Bridge x={720} y={590} rotate={98} />
    </g>
  );
}
