"use client";

type Props = {
  value: number;
  disabled?: boolean;
  max?: number;
  onChange: (n: number) => void;
};

export function ScoreInput({ value, disabled, max = 200, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="h-9 w-9 rounded-md border border-white/20 text-lg font-black disabled:opacity-30"
        aria-label="Menos"
      >
        –
      </button>
      <input
        type="number"
        min={0}
        max={max}
        inputMode="numeric"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(Math.max(0, Math.min(max, Math.trunc(n))));
        }}
        className="w-14 rounded-md border border-white/20 bg-black/40 px-2 py-2 text-center text-lg font-black tabular-nums text-white disabled:opacity-40"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-9 w-9 rounded-md border border-white/20 text-lg font-black disabled:opacity-30"
        aria-label="Mas"
      >
        +
      </button>
    </div>
  );
}
