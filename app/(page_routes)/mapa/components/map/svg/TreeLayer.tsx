import { TREE_POSITIONS } from '../../../data/mapData';
import TreeIcon from './TreeIcon';

export default function TreeLayer() {
  return (
    <>
      {TREE_POSITIONS.map(({ x, y }, index) => (
        <TreeIcon key={`${x}-${y}`} x={x} y={y} scale={index % 3 === 0 ? 0.78 : 0.62} />
      ))}
    </>
  );
}
