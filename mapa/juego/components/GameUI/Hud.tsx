'use client';
import { memo } from 'react';
import type { ActivePowerUps, GameState } from '../../types';
import { helpStyle, hudStyle, titleStyle } from './styles';

interface HudProps {
  activePowerUps: ActivePowerUps;
  levelTitle: string;
  state: GameState;
}

export const Hud = memo(function Hud({ activePowerUps, levelTitle, state }: HudProps) {
  const { crystals, lifetimeCrystals, lives, playerName, score, status, totalCrystals } = state;

  return (
    <>
      <div style={hudStyle}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ fontSize: 22, opacity: i < lives ? 1 : 0.2, filter: i < lives ? 'drop-shadow(0 0 6px #4fc3f7)' : 'none' }}>
              👻
            </span>
          ))}
        </div>
        <div style={{ color: '#00e676', fontSize: 13, textShadow: '0 0 8px #00e67699' }}>
          ⚪ {crystals} / {totalCrystals}
        </div>
        <div style={{ color: '#ffd700', fontSize: 13, textShadow: '0 0 8px #ffd70099' }}>
          ⭐ {score.toString().padStart(5, '0')}
        </div>
        {playerName ? (
          <div style={{ color: '#ffffff80', fontSize: 11 }}>
            {playerName} · ⚪ {lifetimeCrystals}
          </div>
        ) : null}
      </div>

      {activePowerUps.ruby || activePowerUps.sapphire ? null : (
        <div style={titleStyle}>
          <div style={{ color: '#4fc3f7', fontSize: 11, letterSpacing: 3, textShadow: '0 0 12px #4fc3f7' }}>
            FANTASMA DE LA CIUDAD ESMERALDA
          </div>
          <div style={{ color: '#ffffff78', fontSize: 10, marginTop: 4 }}>
            {levelTitle}
          </div>
        </div>
      )}

      {status === 'playing' ? (
        <div style={helpStyle}>
          ← → / A D — mover<br />
          ESPACIO / ↑ — saltar · planear<br />
          {activePowerUps.sapphire
            ? <span style={{ color: '#90caf9' }}>🔵 CONTROL — disparar zafiro</span>
            : <span>🔴 Rubí=inmune · 🔵 Zafiro=disparar</span>
          }
        </div>
      ) : null}
    </>
  );
});
