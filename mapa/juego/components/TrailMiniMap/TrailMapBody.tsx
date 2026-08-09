'use client';
import { memo } from 'react';
import { GAME_LEVELS } from '../../data/levelData';
import { TRAIL_STATIONS } from '../../data/stations';
import { DEV_UNLOCK_ALL_LEVELS } from '../../constants/storage';
import type { GameState, LevelData, TrailStation } from '../../types';
import {
  completeTextStyle, devStyle, fullBodyStyle, hintTextStyle, miniFooterStyle,
  routeTextStyle, stageButtonStyle, stageGridStyle, stationDescStyle,
} from './styles';

interface TrailMapBodyProps {
  activeStation: TrailStation | undefined;
  activeStationIndex: number;
  handleEnterLevel: (levelIndex: number) => void;
  isFull: boolean;
  level: LevelData;
  status: GameState['status'];
  unlockedStationIndex: number;
}

export const TrailMapBody = memo(function TrailMapBody({
  activeStation,
  activeStationIndex,
  handleEnterLevel,
  isFull,
  level,
  status,
  unlockedStationIndex,
}: TrailMapBodyProps) {
  if (!isFull) return <div style={miniFooterStyle}>{level.title}</div>;

  return (
    <div style={fullBodyStyle}>
      <p style={stationDescStyle}>{activeStation?.description}</p>
      <p style={routeTextStyle}>{level.title}</p>
      <p style={hintTextStyle}>{level.subtitle}</p>

      <div style={stageGridStyle}>
        {GAME_LEVELS.map((gl, index) => {
          const isUnlocked = DEV_UNLOCK_ALL_LEVELS || index <= unlockedStationIndex;
          const isCurrent = index === activeStationIndex;
          const st = TRAIL_STATIONS[index];
          return (
            <button
              key={gl.id}
              type="button"
              onClick={() => isUnlocked && handleEnterLevel(index)}
              disabled={!isUnlocked}
              style={stageButtonStyle(isCurrent, isUnlocked)}
              title={gl.title}
            >
              <span style={{ fontSize: 16 }}>
                {!isUnlocked ? '🔒' : isCurrent ? '👻' : '✓'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: isUnlocked ? '#e8d090' : '#4a6050' }}>
                {st?.shortName ?? `Zona ${index + 1}`}
              </span>
            </button>
          );
        })}
      </div>

      {status === 'complete' ? (
        <p style={completeTextStyle}>¡Aventura completada! El fantasma llegó al río. Pura vida 🌿</p>
      ) : null}

      {DEV_UNLOCK_ALL_LEVELS && (
        <p style={devStyle}>DEV: todos los tramos desbloqueados</p>
      )}
    </div>
  );
});
