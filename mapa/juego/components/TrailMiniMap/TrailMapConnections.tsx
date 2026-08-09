'use client';
import { memo } from 'react';
import { TRAIL_CONNECTIONS } from '../../data/stations';
import { TRAIL_PATH } from '../../constants/trailMap';
import { getStation, stationIndex } from '../../lib/trail';

export const TrailMapConnections = memo(function TrailMapConnections({ unlockedStationIndex }: { unlockedStationIndex: number }) {
  return (
    <>
      {TRAIL_CONNECTIONS.map((conn) => {
        const from = getStation(conn.from);
        const to = getStation(conn.to);
        const fromIdx = stationIndex(conn.from);
        const isUnlocked = fromIdx <= unlockedStationIndex;
        return (
          <line
            key={`${conn.from}-${conn.to}`}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            stroke={isUnlocked ? '#c8922a' : '#3d3018'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray={isUnlocked ? undefined : '3.5 2.5'}
            opacity={isUnlocked ? 0.9 : 0.4}
          />
        );
      })}

      <path
        d={TRAIL_PATH}
        fill="none"
        stroke="#8b6a2a"
        strokeWidth="1"
        opacity="0.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
});
