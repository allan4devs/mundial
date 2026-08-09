'use client';
import type { FormEvent } from 'react';
import type { GameState, LeaderboardEntry } from '../../types';
import { TrailMiniMap } from '../TrailMiniMap/TrailMiniMap';
import {
  btnStyle, dashboardStyle, eyebrowStyle, inputStyle, mapOverlayStyle, mutedTextStyle,
  panelStyle, panelTitleStyle, rankNameStyle, rankRowStyle, smallBtnStyle,
} from './styles';

interface MapOverlayProps {
  canPlay: boolean;
  clearPlayer: () => void;
  enterLevel: (levelIndex: number) => void;
  leaderboard: LeaderboardEntry[];
  nameInput: string;
  registerPlayer: (name: string) => void;
  resetAdventure: () => void;
  setNameInput: (name: string) => void;
  state: GameState;
}

export function MapOverlay({
  canPlay,
  clearPlayer,
  enterLevel,
  leaderboard,
  nameInput,
  registerPlayer,
  resetAdventure,
  setNameInput,
  state,
}: MapOverlayProps) {
  const { lifetimeCrystals, playerName, score, status } = state;

  const handleSubmitName = (event: FormEvent) => {
    event.preventDefault();
    registerPlayer(nameInput);
  };

  const guardedEnterLevel = (levelIndex: number) => {
    if (!canPlay) return;
    enterLevel(levelIndex);
  };

  return (
    <div style={mapOverlayStyle}>
      <div style={dashboardStyle}>
        <section style={panelStyle}>
          <p style={eyebrowStyle}>Jugador</p>
          {playerName ? (
            <>
              <h2 style={panelTitleStyle}>{playerName}</h2>
              <p style={mutedTextStyle}>
                Perlas secretas: <b>{lifetimeCrystals}</b><br />
                Puntaje actual: <b>{score}</b>
              </p>
              <button onClick={clearPlayer} style={{ ...smallBtnStyle, marginTop: 14 }}>
                CAMBIAR NOMBRE
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmitName}>
              <h2 style={panelTitleStyle}>Ponga su nombre</h2>
              <p style={{ ...mutedTextStyle, marginBottom: 12 }}>
                Así guardamos quién encuentra más esmeraldas secretas.
              </p>
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                maxLength={24}
                placeholder="Nombre del jugador"
                style={inputStyle}
              />
              <button type="submit" style={{ ...btnStyle('#00e676'), width: '100%', marginTop: 12, padding: '11px 12px' }}>
                REGISTRAR
              </button>
            </form>
          )}
        </section>

        <TrailMiniMap variant="full" onEnterLevel={guardedEnterLevel} />

        <section style={panelStyle}>
          <p style={eyebrowStyle}>Ranking</p>
          <h2 style={panelTitleStyle}>💎 Más esmeraldas</h2>
          {leaderboard.length ? (
            <div style={{ display: 'grid', gap: 8 }}>
              {leaderboard.slice(0, 6).map((entry, index) => (
                <div key={entry.name} style={rankRowStyle(index === 0)}>
                  <b style={{ color: index === 0 ? '#00e676' : '#ffffff7a' }}>{index + 1}</b>
                  <span style={rankNameStyle}>{entry.name}</span>
                  <span style={{ color: '#b9f7ff', fontWeight: 900 }}>⚪ {entry.crystals}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={mutedTextStyle}>
              Todavía no hay jugadores. Sea el primero en encontrar esmeraldas secretas, mae.
            </p>
          )}
        </section>
      </div>

      {!canPlay ? (
        <p style={{ margin: 0, color: '#ffd166', fontSize: 12, textAlign: 'center' }}>
          Registrá un nombre para entrar a los tramos.
        </p>
      ) : null}

      {status === 'complete' ? (
        <button onClick={resetAdventure} style={btnStyle('#00e676')}>REINICIAR AVENTURA</button>
      ) : null}
    </div>
  );
}
