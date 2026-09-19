import { MAP_LABELS } from '../../../data/mapData';

interface MapLabelsProps {
  offsets?: Record<string, { x: number; y: number }>;
  editMode?: boolean;
  selectedId?: string | null;
}

export default function MapLabels({ offsets = {}, editMode = false, selectedId }: MapLabelsProps) {
  return (
    <>
      {MAP_LABELS.map((label, i) => (
        <text
          key={`${label.text}-${i}`}
          data-map-item={`label-${i}`}
          x={label.x + (offsets[`label-${i}`]?.x ?? 0) / 2}
          y={label.y + (offsets[`label-${i}`]?.y ?? 0) / 2}
          transform={`rotate(${label.rotate} ${label.x + (offsets[`label-${i}`]?.x ?? 0) / 2} ${label.y + (offsets[`label-${i}`]?.y ?? 0) / 2})`}
          fill="#2d2117"
          fontSize="18"
          fontWeight="800"
          style={{ cursor: editMode ? 'move' : 'default', outline: selectedId === `label-${i}` ? '1px dashed #f97316' : undefined }}
        >
          {label.text}
        </text>
      ))}
    </>
  );
}
