"use client";

import { PLAYER_COLORS } from "../../constants/online";
import { S } from "../styles";
import type { RaceRoomView } from "../types";

type LobbyViewProps = {
  room: RaceRoomView;
  playerId: string;
  error: string;
  loading: boolean;
  onToggleReady: () => void;
  onStart: () => void;
  onLeave: () => void;
};

export function LobbyView({
  room,
  playerId,
  error,
  loading,
  onToggleReady,
  onStart,
  onLeave,
}: LobbyViewProps) {
  const isHost = room.hostId === playerId;
  const me = room.players.find((player) => player.id === playerId);
  const allReady = room.players.length >= 2 && room.players.every((player) => player.ready);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/mapa/juego/online?code=${room.code}`
    : "";

  return (
    <div style={S.root}>
      <div style={{ ...S.card, maxWidth: 520 }}>
        <div style={S.title}>SALA DE CARRERA</div>

        <div style={S.codeBox}>
          <div style={S.codeNum}>{room.code}</div>
          <div style={S.codeHint}>Comparte este codigo para que otros se unan</div>
          {shareUrl && (
            <div
              style={{ fontSize: 10, color: "#2a5a30", marginTop: 8, cursor: "pointer" }}
              onClick={() => { navigator.clipboard?.writeText(shareUrl); }}
              title="Clic para copiar link"
            >
              Copiar link: {shareUrl}
            </div>
          )}
        </div>

        {error && <div style={S.error}>! {error}</div>}

        <div style={{ fontSize: 11, color: "#4caf50", letterSpacing: 1, marginBottom: 10 }}>
          JUGADORES ({room.players.length}/8)
        </div>

        {room.players.map((player, index) => (
          <div key={player.id} style={S.playerRow}>
            <div style={S.playerDot(PLAYER_COLORS[index % PLAYER_COLORS.length])} />
            <span style={{ fontSize: 13, flex: 1 }}>
              {player.name}
              {player.id === room.hostId && <span style={{ color: "#ffd700", fontSize: 10, marginLeft: 6 }}>HOST</span>}
              {player.id === playerId && <span style={{ color: "#4fc3f7", fontSize: 10, marginLeft: 6 }}>TU</span>}
            </span>
            <div style={S.badge(player.ready)}>
              {player.ready ? "LISTO" : "ESPERANDO"}
            </div>
          </div>
        ))}

        {room.players.length < 2 && (
          <div style={{ ...S.hint, marginTop: 16 }}>
            Esperando mas jugadores... comparte el codigo <strong style={{ color: "#00e676" }}>{room.code}</strong>
          </div>
        )}

        <div style={{ height: 20 }} />

        <button style={S.btn(!me?.ready)} onClick={onToggleReady} disabled={loading}>
          {loading ? "..." : me?.ready ? "LISTO - click para cancelar" : "MARCAR COMO LISTO"}
        </button>

        {isHost && (
          <button
            style={{
              ...S.btn(true),
              opacity: allReady ? 1 : 0.45,
              cursor: allReady ? "pointer" : "not-allowed",
            }}
            onClick={onStart}
            disabled={loading || !allReady}
            title={!allReady ? "Todos los jugadores deben estar listos" : ""}
          >
            {loading ? "..." : allReady ? "INICIAR CARRERA" : "INICIAR (esperando listos)"}
          </button>
        )}

        <button style={{ ...S.btn(false), marginTop: 4 }} onClick={onLeave}>
          SALIR DE SALA
        </button>
      </div>
    </div>
  );
}
