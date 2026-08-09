"use client";

import { S } from "../styles";

type MainMenuProps = {
  name: string;
  joinCode: string;
  error: string;
  loading: boolean;
  onJoinCodeChange: (code: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  onEditName: () => void;
};

export function MainMenu({
  name,
  joinCode,
  error,
  loading,
  onJoinCodeChange,
  onCreate,
  onJoin,
  onEditName,
}: MainMenuProps) {
  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.title}>CARRERA ONLINE</div>
        <div style={S.subtitle}>HOLA, {name.toUpperCase()}</div>

        {error && <div style={S.error}>! {error}</div>}

        <button style={S.btn(true)} onClick={onCreate} disabled={loading}>
          {loading ? "..." : "+ CREAR SALA"}
        </button>

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <div style={S.dividerText}>O</div>
          <div style={S.dividerLine} />
        </div>

        <div style={S.label}>CODIGO DE SALA</div>
        <input
          style={{ ...S.input, textTransform: "uppercase", letterSpacing: 6, textAlign: "center" }}
          value={joinCode}
          onChange={(event) => onJoinCodeChange(event.target.value.toUpperCase().slice(0, 4))}
          placeholder="XXXX"
          maxLength={4}
          onKeyDown={(event) => {
            if (event.key === "Enter") onJoin();
          }}
        />
        <button style={S.btn(false)} onClick={onJoin} disabled={loading || !joinCode.trim()}>
          {loading ? "..." : "UNIRSE A SALA"}
        </button>

        <div style={S.hint}>
          <span style={{ cursor: "pointer", color: "#2a5a30" }} onClick={onEditName}>
            cambiar nombre
          </span>
        </div>
      </div>
    </div>
  );
}
