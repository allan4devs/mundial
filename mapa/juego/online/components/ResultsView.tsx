"use client";

import { PLAYER_COLORS } from "../../constants/online";
import { S } from "../styles";
import type { RaceRoomView } from "../types";

type ResultsViewProps = {
  room: RaceRoomView;
  playerId: string;
  onLeave: () => void;
};

export function ResultsView({ room, playerId, onLeave }: ResultsViewProps) {
  const sortedPlayers = [...room.players].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const medals = ["1.", "2.", "3."];

  return (
    <div style={S.root}>
      <div style={{ ...S.card, maxWidth: 460 }}>
        <div style={S.title}>CARRERA TERMINADA</div>
        <div style={S.subtitle}>RESULTADOS FINALES</div>

        <div style={{ marginBottom: 24 }}>
          {sortedPlayers.map((player, index) => {
            const color = PLAYER_COLORS[room.players.indexOf(player) % PLAYER_COLORS.length];
            const isMe = player.id === playerId;

            return (
              <div
                key={player.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: isMe ? "rgba(0,230,118,0.07)" : "transparent",
                  border: isMe ? "1px solid #1a3a20" : "1px solid transparent",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 22, minWidth: 30 }}>{medals[index] ?? `${index + 1}.`}</span>
                <div style={S.playerDot(color)} />
                <span style={{ flex: 1, fontSize: 14, color: isMe ? "#00e676" : "#e0e0e0", fontWeight: isMe ? 700 : 400 }}>
                  {player.name}{isMe ? " (TU)" : ""}
                </span>
                {player.finishedAt && room.startedAt && (
                  <span style={{ fontSize: 11, color: "#4caf50" }}>
                    {((player.finishedAt - new Date(room.startedAt).getTime()) / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button style={S.btn(true)} onClick={onLeave}>
          VOLVER AL MENU
        </button>
      </div>
    </div>
  );
}
