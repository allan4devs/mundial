import { TREE_POSITIONS } from '../../../data/mapData';
import TreeIcon from './TreeIcon';

export default function TreeLayer({ offsets = {}, editMode = false }: { offsets?: Record<string, { x: number; y: number }>; editMode?: boolean }) {
  return (
    <>
      {TREE_POSITIONS.map(({ x, y }, index) => (
        <g key={`${x}-${y}`} data-map-item={`tree-${index}`} transform={`translate(${(offsets[`tree-${index}`]?.x ?? 0) / 2} ${(offsets[`tree-${index}`]?.y ?? 0) / 2})`} style={{ cursor: editMode ? 'move' : 'default' }}>
          <TreeIcon x={x} y={y} scale={index % 3 === 0 ? 0.78 : 0.62} />
        </g>
      ))}
    </>
  );
}
