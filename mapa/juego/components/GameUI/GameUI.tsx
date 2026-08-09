'use client';
import { memo, useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { TrailMiniMap } from '../TrailMiniMap/TrailMiniMap';
import { GameMusic } from './GameMusic';
import { Hud } from './Hud';
import { MapOverlay } from './MapOverlay';
import { MobileTouchControls } from './MobileTouchControls';
import { PowerUpBadges } from './PowerUpBadges';
import { StatusOverlays } from './StatusOverlays';
import { rootStyle } from './styles';

export const GameUI = memo(function GameUI() {
  const {
    state, level, leaderboard, activePowerUps, keys,
    registerPlayer, clearPlayer, restart, enterLevel, resetAdventure,
  } = useGameContext();
  const [nameInput, setNameInput] = useState(state.playerName ?? '');
  const canPlay = Boolean(state.playerName);

  return (
    <div style={rootStyle}>
      <Hud activePowerUps={activePowerUps} levelTitle={level.title} state={state} />
      <GameMusic />
      <PowerUpBadges activePowerUps={activePowerUps} />
      <MobileTouchControls keys={keys} status={state.status} />

      {state.status === 'playing' || state.status === 'dead' ? (
        <TrailMiniMap />
      ) : null}

      {(state.status === 'map' || state.status === 'complete') && (
        <MapOverlay
          canPlay={canPlay}
          clearPlayer={clearPlayer}
          enterLevel={enterLevel}
          leaderboard={leaderboard}
          nameInput={nameInput}
          registerPlayer={registerPlayer}
          resetAdventure={resetAdventure}
          setNameInput={setNameInput}
          state={state}
        />
      )}

      <StatusOverlays restart={restart} state={state} />
    </div>
  );
});
