'use client';
import { memo } from 'react';
import { TRAIL_STATIONS } from '../../data/stations';

interface TrailMapStationsProps {
  activeStationIndex: number;
  hoveredIdx: number | null;
  isFull: boolean;
  onHover: (index: number | null) => void;
  onStationClick: (index: number) => void;
  unlockedStationIndex: number;
}

export const TrailMapStations = memo(function TrailMapStations({
  activeStationIndex,
  hoveredIdx,
  isFull,
  onHover,
  onStationClick,
  unlockedStationIndex,
}: TrailMapStationsProps) {
  return (
    <>
      {isFull && TRAIL_STATIONS.map((station, index) => {
        const isUnlocked = index <= unlockedStationIndex;
        const isCurrent = index === activeStationIndex;
        const isHovered = hoveredIdx === index;
        return (
          <circle
            key={`zone-${station.id}`}
            cx={station.x}
            cy={station.y}
            r={12}
            fill={isHovered && isUnlocked ? 'rgba(0,230,118,0.12)' : 'transparent'}
            stroke={isCurrent ? 'rgba(0,230,118,0.3)' : isUnlocked && isHovered ? 'rgba(0,230,118,0.2)' : 'none'}
            strokeWidth="1"
            style={{ cursor: isUnlocked ? 'pointer' : 'default', transition: 'fill 0.15s' }}
            onClick={() => onStationClick(index)}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}

      {TRAIL_STATIONS.map((station, index) => {
        const isUnlocked = index <= unlockedStationIndex;
        const isCurrent = index === activeStationIndex;
        const isHovered = hoveredIdx === index && isFull;
        const nodeR = isFull ? 3.6 : 2.8;
        return (
          <g
            key={station.id}
            style={{ cursor: isFull && isUnlocked ? 'pointer' : 'default' }}
            onClick={() => onStationClick(index)}
            onMouseEnter={() => isFull && onHover(index)}
            onMouseLeave={() => isFull && onHover(null)}
          >
            {isCurrent && (
              <circle cx={station.x} cy={station.y} r={nodeR + 3}
                fill="none" stroke="#00e676" strokeWidth="0.8" opacity="0.4" />
            )}
            <circle
              cx={station.x} cy={station.y} r={nodeR}
              fill={
                !isUnlocked ? '#2a3830' :
                isCurrent ? '#00e676' :
                isHovered ? '#80ffb8' :
                '#ffd166'
              }
              stroke={isCurrent ? '#eafff4' : isUnlocked ? '#a08040' : '#1a2820'}
              strokeWidth="1"
            />
            {!isUnlocked && (
              <text x={station.x} y={station.y + 1} textAnchor="middle" dominantBaseline="middle"
                fill="#4a6050" fontSize="3" fontWeight="bold">🔒</text>
            )}
            {isFull && (
              <>
                <text
                  x={station.x}
                  y={station.y - (nodeR + 3.5)}
                  textAnchor="middle"
                  fill={isUnlocked ? (isCurrent ? '#00e676' : isHovered ? '#c0ffd8' : '#e8d090') : '#4a6050'}
                  fontSize={isCurrent ? '3.8' : '3.2'}
                  fontWeight={isCurrent ? '900' : '700'}
                  style={{ pointerEvents: 'none' }}
                >
                  {station.shortName}
                </text>
                {isUnlocked && isHovered && (
                  <text
                    x={station.x}
                    y={station.y + nodeR + 5}
                    textAnchor="middle"
                    fill="#00e676"
                    fontSize="2.8"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    ▶ JUGAR
                  </text>
                )}
              </>
            )}
            {!isFull && isUnlocked && (
              <text x={station.x} y={station.y + 0.9} textAnchor="middle" dominantBaseline="middle"
                fill="#04110e" fontSize="2.2" fontWeight="900"
                style={{ pointerEvents: 'none' }}>
                {index + 1}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
});
