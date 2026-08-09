"use client";

import dynamic from "next/dynamic";
import type * as THREE from "three";
import { PLAYER_COLORS } from "../../constants/online";
import { GAME_LEVELS } from "../../data/levelData";
import { S } from "../styles";
import type { RaceRoomView } from "../types";

const Game = dynamic(() => import("../../components/Game"), { ssr: false });

type RaceViewProps = {
  room: RaceRoomView;
  playerId: string;
  name: string;
  myPct: number;
  sharedPosRef: React.MutableRefObject<THREE.Vector3>;
  onFinish: () => void;
};

export function RaceView({ room, playerId, name, myPct, sharedPosRef, onFinish }: RaceViewProps) {
  const me = room.players.find((player) => player.id === playerId);
  const myFinished = me?.finished ?? false;
  const level = GAME_LEVELS[room.levelIndex] ?? GAME_LEVELS[0];

  const otherPlayers = room.players
    .filter((player) => player.id !== playerId)
    .map((player) => ({
      id: player.id,
      name: player.name,
      color: PLAYER_COLORS[room.players.indexOf(player) % PLAYER_COLORS.length],
      x: player.x ?? level.spawnPosition[0],
      y: player.y ?? level.spawnPosition[1],
      finished: player.finished,
    }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#060c10" }}>
      <Game
        sharedPosRef={sharedPosRef}
        onRaceWin={onFinish}
        raceLevelIndex={room.levelIndex}
        racePlayerName={name}
        otherPlayers={otherPlayers}
      />

      <div style={S.raceOverlay}>
        <div style={S.racePanel}>
          <div style={S.raceTitle}>CARRERA EN VIVO</div>
          {room.players
            .slice()
            .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
            .map((player, index) => {
              const color = PLAYER_COLORS[room.players.indexOf(player) % PLAYER_COLORS.length];
              const isMe = player.id === playerId;
              const displayedPct = isMe ? myPct : (player.pct ?? 0);

              return (
                <div key={player.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: isMe ? "#00e676" : "#aaa", fontWeight: isMe ? 700 : 400 }}>
                      {index + 1}. {player.name.slice(0, 12)}{isMe ? " *" : ""}
                    </span>
                    <span style={{ fontSize: 10, color: player.finished ? "#ffd700" : "#555" }}>
                      {player.finished ? `#${player.rank}` : `${Math.round(displayedPct)}%`}
                    </span>
                  </div>
                  <div style={S.progressBar(player.pct, color)}>
                    <div style={S.progressFill(displayedPct, color)} />
                  </div>
                </div>
              );
            })}

          {myFinished && (
            <div style={{ textAlign: "center", color: "#ffd700", fontSize: 11, marginTop: 8 }}>
              Terminaste! Posicion #{me?.rank}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
