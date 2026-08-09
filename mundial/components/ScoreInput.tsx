import { clampScore, cn } from "../utils";

type ScoreInputProps = {
  label: string;
  value: number;
  disabled: boolean;
  featured?: boolean;
  onChange: (value: number) => void;
};

const inputBase = cn(
  "min-w-0 rounded-lg border text-center font-black tabular-nums outline-none transition-all",
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
  "border-[#d5ff3f] bg-[#d5ff3f] text-[#06121c] shadow-[inset_0_-6px_0_rgba(0,0,0,0.14),0_10px_24px_rgba(213,255,63,0.14)]",
  "focus:border-white focus:ring-2 focus:ring-[#d5ff3f]/30",
  "disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/35"
);

const btnBase = cn(
  "flex select-none items-center justify-center rounded-lg border font-black transition-all active:scale-95",
  "border-white/15 bg-black/65 text-[#d5ff3f] shadow-[inset_0_-4px_0_rgba(255,255,255,0.06)]",
  "hover:border-[#d5ff3f] hover:bg-[#10240b] hover:text-white",
  "disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:bg-black/65 disabled:hover:text-[#d5ff3f]"
);

export function ScoreInput({ label, value, disabled, featured = false, onChange }: ScoreInputProps) {
  if (featured) {
    return (
      <div className="flex w-16 flex-col items-stretch gap-1 min-[380px]:w-20 sm:w-24">
        <button
          type="button"
          onClick={() => onChange(clampScore(value + 1))}
          disabled={disabled}
          aria-label={`Sumar gol de ${label}`}
          className={cn(btnBase, "h-6 w-full text-sm sm:h-8 sm:text-base")}
        >
          +
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={30}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(clampScore(Number(event.target.value)))}
          aria-label={`Goles de ${label}`}
          className={cn(inputBase, "h-12 w-full text-3xl min-[380px]:h-14 min-[380px]:text-4xl sm:h-16 sm:text-5xl")}
        />
        <button
          type="button"
          onClick={() => onChange(clampScore(value - 1))}
          disabled={disabled || value <= 0}
          aria-label={`Restar gol de ${label}`}
          className={cn(btnBase, "h-6 w-full text-sm sm:h-8 sm:text-base")}
        >
          -
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 min-[380px]:gap-1">
      <button
        type="button"
        onClick={() => onChange(clampScore(value - 1))}
        disabled={disabled || value <= 0}
        aria-label={`Restar gol de ${label}`}
        className={cn(btnBase, "h-11 w-7 shrink-0 text-sm min-[380px]:h-12 min-[380px]:w-8")}
      >
        -
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={30}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(clampScore(Number(event.target.value)))}
        aria-label={`Goles de ${label}`}
        className={cn(inputBase, "h-11 w-11 text-xl min-[380px]:h-12 min-[380px]:w-[52px] min-[380px]:text-2xl")}
      />
      <button
        type="button"
        onClick={() => onChange(clampScore(value + 1))}
        disabled={disabled}
        aria-label={`Sumar gol de ${label}`}
        className={cn(btnBase, "h-11 w-7 shrink-0 text-sm min-[380px]:h-12 min-[380px]:w-8")}
      >
        +
      </button>
    </div>
  );
}
