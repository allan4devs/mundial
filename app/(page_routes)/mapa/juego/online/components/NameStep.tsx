"use client";

import { S } from "../styles";

type NameStepProps = {
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: (name: string) => void;
};

export function NameStep({ name, onNameChange, onSubmit }: NameStepProps) {
  const canSubmit = Boolean(name.trim());

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.title}>CARRERA ONLINE</div>
        <div style={S.subtitle}>FANTASMA DE LA CIUDAD ESMERALDA</div>
        <div style={S.label}>TU NOMBRE</div>
        <input
          style={S.input}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Escribe tu nombre..."
          maxLength={18}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSubmit) onSubmit(name);
          }}
        />
        <button style={S.btn(true)} disabled={!canSubmit} onClick={() => onSubmit(name)}>
          CONTINUAR
        </button>
      </div>
    </div>
  );
}
