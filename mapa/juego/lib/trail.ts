import { TRAIL_STATIONS } from '../data/stations';

export function getStation(id: string) {
  return TRAIL_STATIONS.find((s) => s.id === id) ?? TRAIL_STATIONS[0];
}

export function stationIndex(id: string) {
  return TRAIL_STATIONS.findIndex((s) => s.id === id);
}

// Curved path string through the 5 stations (Catmull-Rom style smooth path using cubic bezier approximation)
export function buildTrailPath(): string {
  const pts = TRAIL_STATIONS;
  const d: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    if (i === 0) d.push(`M${p1.x} ${p1.y}`);
    d.push(`C${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x} ${p2.y}`);
  }
  return d.join(' ');
}
