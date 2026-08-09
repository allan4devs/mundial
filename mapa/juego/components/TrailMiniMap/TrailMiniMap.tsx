'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { GAME_LEVELS } from '../../data/levelData';
import { TRAIL_STATIONS } from '../../data/stations';
import { getStation, stationIndex } from '../../lib/trail';
import { DEV_UNLOCK_ALL_LEVELS } from '../../constants/storage';
import { TrailMapBody } from './TrailMapBody';
import { TrailMapConnections } from './TrailMapConnections';
import { TrailMapStations } from './TrailMapStations';
import { TrailMapTerrain } from './TrailMapTerrain';
import {
  fullHeaderStyle, fullSvgStyle, fullWrapStyle, miniHeaderStyle, miniSvgStyle, miniWrapStyle,
} from './styles';

interface Props {
  variant?: 'mini' | 'full';
  onEnterLevel?: (levelIndex: number) => void;
}

export const TrailMiniMap = memo(function TrailMiniMap({ variant = 'mini', onEnterLevel }: Props) {
  const { state, level, playerPosRef, enterLevel } = useGameContext();
  const ghostRef = useRef<SVGCircleElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleEnterLevel = onEnterLevel ?? enterLevel;
  const isFull = variant === 'full';
  const levelStationIndex = Math.max(0, stationIndex(level.stationId));
  const activeStationIndex = Math.min(
    state.status === 'complete' ? state.unlockedStationIndex : levelStationIndex,
    TRAIL_STATIONS.length - 1,
  );
  const activeStation = TRAIL_STATIONS[activeStationIndex];
  const nextStation = level.nextStationId
    ? getStation(level.nextStationId)
    : TRAIL_STATIONS[Math.min(activeStationIndex + 1, TRAIL_STATIONS.length - 1)];
  const unlockedStationIndex = DEV_UNLOCK_ALL_LEVELS ? GAME_LEVELS.length : state.unlockedStationIndex;
  const ghostStart = useMemo(() => activeStation ?? TRAIL_STATIONS[0], [activeStation]);

  useEffect(() => {
    const el = ghostRef.current;
    if (!el || !activeStation || !nextStation) return;

    if (state.status !== 'playing') {
      el.setAttribute('cx', String(activeStation.x));
      el.setAttribute('cy', String(activeStation.y));
      return;
    }

    let frame = 0;
    let lastProgress = -1;
    const tick = () => {
      const dx = level.goalPosition[0] - level.spawnPosition[0];
      const dy = level.goalPosition[1] - level.spawnPosition[1];
      const lenSq = dx * dx + dy * dy;
      const raw = lenSq === 0
        ? 0
        : ((playerPosRef.current.x - level.spawnPosition[0]) * dx +
           (playerPosRef.current.y - level.spawnPosition[1]) * dy) / lenSq;
      const progress = Math.max(0, Math.min(1, raw));
      if (Math.abs(progress - lastProgress) > 0.006) {
        lastProgress = progress;
        const x = activeStation.x + (nextStation.x - activeStation.x) * progress;
        const y = activeStation.y + (nextStation.y - activeStation.y) * progress;
        el.setAttribute('cx', x.toFixed(2));
        el.setAttribute('cy', y.toFixed(2));
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [activeStation, level.goalPosition, level.spawnPosition, nextStation, playerPosRef, state.status]);

  const handleStationClick = useCallback((index: number) => {
    if (!isFull) return;
    if (index <= unlockedStationIndex) handleEnterLevel(index);
  }, [handleEnterLevel, isFull, unlockedStationIndex]);

  return (
    <div style={isFull ? fullWrapStyle : miniWrapStyle}>
      <div style={isFull ? fullHeaderStyle : miniHeaderStyle}>
        <span style={{ opacity: 0.7 }}>{isFull ? 'Mapa del sendero' : 'Sendero'}</span>
        <strong style={{ color: '#00e676' }}>{activeStation?.shortName ?? 'Inicio'}</strong>
      </div>

      <svg
        viewBox="0 0 100 100"
        style={isFull ? fullSvgStyle : miniSvgStyle}
        aria-label="Mapa del sendero"
      >
        <TrailMapTerrain />
        <TrailMapConnections unlockedStationIndex={unlockedStationIndex} />
        <TrailMapStations
          activeStationIndex={activeStationIndex}
          hoveredIdx={hoveredIdx}
          isFull={isFull}
          onHover={setHoveredIdx}
          onStationClick={handleStationClick}
          unlockedStationIndex={unlockedStationIndex}
        />

        {(state.status === 'playing' || state.status === 'map' || state.status === 'complete') && (
          <circle
            ref={ghostRef}
            cx={ghostStart.x} cy={ghostStart.y}
            r={isFull ? 3.2 : 2.6}
            fill="#d4f0ff"
            opacity="0.95"
            style={{ filter: 'drop-shadow(0 0 2px #4fc3f7)' }}
          />
        )}

        {!isFull && (
          <text x="50" y="97" textAnchor="middle" fill="#ffffff30" fontSize="3.2">
            {activeStation?.shortName ?? ''}
          </text>
        )}
      </svg>

      <TrailMapBody
        activeStation={activeStation}
        activeStationIndex={activeStationIndex}
        handleEnterLevel={handleEnterLevel}
        isFull={isFull}
        level={level}
        status={state.status}
        unlockedStationIndex={unlockedStationIndex}
      />
    </div>
  );
});
