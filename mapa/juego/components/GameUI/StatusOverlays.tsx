'use client';
import type { GameState } from '../../types';
import { ENEMY_GAMEOVER, ENEMY_MESSAGES, FALL_GAMEOVER, FALL_MESSAGES, TRAP_GAMEOVER, TRAP_MESSAGES } from '../../constants/messages';
import { btnStyle } from './styles';
import { CenteredOverlay } from './CenteredOverlay';

interface StatusOverlaysProps {
  restart: () => void;
  state: GameState;
}

export function StatusOverlays({ restart, state }: StatusOverlaysProps) {
  const { crystals, deathCause, deathMessageIdx, score, status, totalCrystals } = state;
  const deadMsg = deathCause === 'enemy'
    ? ENEMY_MESSAGES[deathMessageIdx % ENEMY_MESSAGES.length]
    : deathCause === 'trap'
    ? TRAP_MESSAGES[deathMessageIdx % TRAP_MESSAGES.length]
    : FALL_MESSAGES[deathMessageIdx % FALL_MESSAGES.length];

  const gameoverSubMsg = deathCause === 'enemy'
    ? ENEMY_GAMEOVER[deathMessageIdx % ENEMY_GAMEOVER.length]
    : deathCause === 'trap'
    ? TRAP_GAMEOVER[deathMessageIdx % TRAP_GAMEOVER.length]
    : FALL_GAMEOVER[deathMessageIdx % FALL_GAMEOVER.length];

  if (status === 'dead') {
    return (
      <CenteredOverlay background={deathCause === 'enemy' ? 'rgba(80,0,20,0.75)' : deathCause === 'trap' ? 'rgba(70,30,0,0.78)' : 'rgba(0,10,30,0.75)'}>
        <p style={{ color: '#ff4444', fontSize: 24, margin: 0, textShadow: '0 0 24px #ff4444', textAlign: 'center', padding: '0 24px' }}>
          {deadMsg}
        </p>
        <p style={{ color: '#888', fontSize: 13, marginTop: 10 }}>Reapareciendo...</p>
      </CenteredOverlay>
    );
  }

  if (status === 'gameover') {
    return (
      <CenteredOverlay background="rgba(5,0,15,0.92)" pointer>
        <p style={{ color: '#ff4444', fontSize: 34, margin: 0, textShadow: '0 0 30px #ff4444' }}>
          FIN DEL JUEGO
        </p>
        <p style={{ color: '#ff8a80', fontSize: 15, margin: 0, textAlign: 'center', padding: '0 24px' }}>
          {gameoverSubMsg}
        </p>
        <p style={{ color: '#ffd700', fontSize: 15, margin: 0 }}>
          💎 {crystals}/{totalCrystals} · ⭐ {score} pts
        </p>
        <button onClick={restart} style={btnStyle('#ff4444')}>REINTENTAR TRAMO</button>
      </CenteredOverlay>
    );
  }

  if (status === 'win') {
    return (
      <CenteredOverlay background="rgba(0,15,8,0.88)" pointer>
        <p style={{ color: '#00e676', fontSize: 32, margin: 0, textShadow: '0 0 30px #00e676', letterSpacing: 2 }}>
          NIVEL COMPLETO
        </p>
        <p style={{ color: '#ffd700', fontSize: 16, margin: 0 }}>
          💎 {crystals}/{totalCrystals} · ⭐ {score} pts
        </p>
        <button onClick={restart} style={btnStyle('#00e676')}>SEGUIR</button>
      </CenteredOverlay>
    );
  }

  return null;
}
