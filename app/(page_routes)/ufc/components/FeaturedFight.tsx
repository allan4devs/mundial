import { CheckCircle2, Clock3, Loader2, Lock, Save, Timer, Zap } from "lucide-react";
import type { CornerPick, MethodPick, UfcDraft, UfcFight } from "../types";
import {
  cn,
  formatCountdown,
  formatScheduled,
  isFightClosed,
  isFightFinished,
  isFightLive,
  methodLabel,
  predictionLabel,
  scheduledMs,
} from "../utils";
import { METHOD_OPTIONS } from "../constants";

type Props = {
  fight: UfcFight;
  draft: UfcDraft;
  savingId: string | null;
  isSavingBulk: boolean;
  nowMs: number;
  onUpdateDraft: (fightId: string, patch: Partial<UfcDraft>) => void;
  onSave: (fight: UfcFight) => Promise<void>;
};

export function FeaturedFight({ fight, draft, savingId, isSavingBulk, nowMs, onUpdateDraft, onSave }: Props) {
  const isClosed = isFightClosed(fight, nowMs);
  const isLive = isFightLive(fight);
  const isFinished = isFightFinished(fight);
  const canEdit = !isClosed;
  const isSaving = savingId === fight.id;
  const disabled = !canEdit || isSaving || isSavingBulk;
  const countdown = !isClosed && nowMs > 0 ? formatCountdown(scheduledMs(fight) - nowMs) : null;
  const hasResult = fight.winnerCorner != null;

  function setCorner(corner: CornerPick) {
    if (disabled) return;
    onUpdateDraft(fight.id, { cornerPick: corner });
  }

  function setMethod(method: MethodPick) {
    if (disabled) return;
    onUpdateDraft(fight.id, { methodPick: method });
  }

  return (
    <section
      className={cn(
        "relative min-w-0 overflow-hidden rounded-xl border bg-[#0a0a0a] shadow-[0_24px_70px_rgba(0,0,0,0.45)]",
        isLive ? "border-[#f5c518]/70" : isClosed ? "border-white/20" : "border-[#c8102e]/55"
      )}
    >
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(135deg,rgba(200,16,46,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(245,197,24,0.10),transparent_45%)]" />

      {/* Header */}
      <div className={cn(
        "relative border-b border-white/10 px-4 py-3",
        isLive ? "bg-[#f5c518]" : isClosed ? "bg-[#1a1a1a]" : "bg-[#c8102e]"
      )}>
        <div className="flex flex-col gap-2 min-[760px]:flex-row min-[760px]:items-center min-[760px]:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
            {isLive ? (
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-black shadow-[0_0_14px_rgba(0,0,0,0.9)]" />
            ) : isClosed ? (
              <Lock className={cn("h-3.5 w-3.5 shrink-0", isFinished ? "text-white/60" : "text-white/40")} />
            ) : (
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]" />
            )}
            <span className={cn("shrink-0 text-[11px] font-black uppercase tracking-[0.22em]", isLive ? "text-black" : "text-white")}>
              {isLive ? "En vivo" : isFinished ? "Finalizado" : isClosed ? "Pelea cerrada" : "Abrir pick"}
            </span>
            <span className={cn("rounded-md border bg-black/25 px-2 py-0.5 text-[11px] font-black", isLive ? "border-black/25 text-black" : "border-white/20 text-white/80")}>
              #{fight.number}
            </span>
            <span className={cn("rounded-md border bg-black/25 px-2 py-0.5 text-[11px] font-black", isLive ? "border-black/25 text-black" : "border-white/20 text-white/80")}>
              {fight.weightClass} · {fight.weightLbs} lbs
            </span>
            {fight.titleFight && (
              <span className="rounded-md border border-[#f5c518]/60 bg-[#f5c518]/15 px-2 py-0.5 text-[11px] font-black text-[#f5c518]">
                🏆 {fight.titleLabel ?? "Title Fight"}
              </span>
            )}
          </div>

          {countdown && !isLive && (
            <div className="rounded-lg border border-white/20 bg-black/30 px-4 py-2.5 text-left sm:min-w-[180px] sm:text-center">
              <div className="mb-1 flex items-center gap-2 sm:justify-center">
                <Timer className="h-4 w-4 text-[#f5c518]" />
                <p className="text-xs font-black uppercase tracking-widest text-[#f5c518]">Cierra en</p>
              </div>
              <p className="text-2xl font-black tabular-nums leading-none text-white sm:text-3xl">{countdown}</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative p-4 sm:p-6">
        {/* Subtitle */}
        <p className="mb-4 text-xs font-bold text-white/45">
          {fight.venue} / {formatScheduled(fight.scheduledAt)} / {fight.scheduledRounds} rounds
        </p>

        {/* Status banner */}
        {isLive ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#f5c518]/45 bg-[#f5c518]/10 px-3 py-2 text-[#f5c518]">
            <Zap className="h-4 w-4 shrink-0" />
            <p className="text-sm font-bold">{fight.liveNote || "Pelea en curso."}</p>
          </div>
        ) : isFinished && hasResult ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#f5c518]" />
            <p className="text-sm font-bold">
              Ganó{" "}
              <span className="font-black text-[#f5c518]">
                {fight.winnerCorner === "red" ? fight.redCorner : fight.blueCorner}
              </span>
              {fight.method && <span className="text-white/60"> · {methodLabel(fight.method)}</span>}
              {fight.endRound && <span className="text-white/60"> · R{fight.endRound}{fight.endTime ? ` (${fight.endTime})` : ""}</span>}
            </p>
          </div>
        ) : isClosed ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white/70">
            <Lock className="h-4 w-4 shrink-0" />
            <p className="text-sm font-bold">Pelea en curso; resultado pendiente.</p>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#c8102e]/35 bg-[#c8102e]/10 px-3 py-2 text-white/80">
            <Clock3 className="h-4 w-4 shrink-0 text-[#c8102e]" />
            <p className="text-sm font-bold">El pick se bloquea cuando empieza la pelea.</p>
          </div>
        )}

        {/* Corner pick */}
        <div className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-stretch gap-3">
          <CornerCard
            corner="red"
            fighter={fight.redCorner}
            record={fight.redRecord}
            selected={draft.cornerPick === "red"}
            disabled={disabled}
            winner={hasResult ? fight.winnerCorner === "red" : null}
            onSelect={() => setCorner(draft.cornerPick === "red" ? null : "red")}
          />

          <div className="grid place-items-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-black text-sm font-black text-[#f5c518]">
              VS
            </div>
          </div>

          <CornerCard
            corner="blue"
            fighter={fight.blueCorner}
            record={fight.blueRecord}
            selected={draft.cornerPick === "blue"}
            disabled={disabled}
            winner={hasResult ? fight.winnerCorner === "blue" : null}
            onSelect={() => setCorner(draft.cornerPick === "blue" ? null : "blue")}
          />
        </div>

        {/* Method pick */}
        {!isClosed && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#f5c518]">
              Método de victoria (bonus)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "none"}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMethod((opt.value || null) as MethodPick)}
                  className={cn(
                    "h-10 rounded-lg border text-xs font-black transition",
                    draft.methodPick === (opt.value || null)
                      ? "border-[#f5c518] bg-[#f5c518] text-black"
                      : "border-white/15 bg-white/5 text-white/70 hover:border-[#f5c518]/50 hover:text-white disabled:opacity-40"
                  )}
                >
                  {opt.short}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result + save */}
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/35 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f5c518]">
              {isClosed ? "Tu pick" : "Pick elegido"}
            </p>
            <p className="mt-1 break-words text-xl font-black text-white sm:text-2xl">
              {predictionLabel(fight, draft)}
            </p>
          </div>
          {!isClosed && (
            <button
              type="button"
              onClick={() => void onSave(fight)}
              disabled={disabled || !draft.dirty || !draft.cornerPick}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#f5c518] bg-[#f5c518] px-6 text-base font-black text-black transition-all hover:bg-yellow-400 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/35 sm:w-auto sm:min-w-[11rem]"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Guardar pick
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function CornerCard({
  corner,
  fighter,
  record,
  selected,
  disabled,
  winner,
  onSelect,
}: {
  corner: "red" | "blue";
  fighter: string;
  record: string | null;
  selected: boolean;
  disabled: boolean;
  winner: boolean | null;
  onSelect: () => void;
}) {
  const isRed = corner === "red";
  const accentColor = isRed ? "#c8102e" : "#1e90ff";
  const label = isRed ? "Esquina Roja" : "Esquina Azul";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 rounded-xl border p-3 transition-all sm:p-4",
        selected
          ? isRed
            ? "border-[#c8102e] bg-[#c8102e]/20 ring-2 ring-[#c8102e]/30"
            : "border-[#1e90ff] bg-[#1e90ff]/20 ring-2 ring-[#1e90ff]/30"
          : winner === true
            ? isRed
              ? "border-[#f5c518]/60 bg-[#1a1500]"
              : "border-[#f5c518]/60 bg-[#1a1500]"
            : "border-white/10 bg-white/5 hover:border-white/25",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 text-lg font-black text-white sm:h-14 sm:w-14"
        style={{ borderColor: accentColor, backgroundColor: `${accentColor}22` }}
      >
        {fighter.charAt(0)}
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accentColor }}>
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-black text-white sm:text-base">{fighter}</p>
        {record && <p className="mt-0.5 text-xs font-bold text-white/50">{record}</p>}
        {winner === true && (
          <span className="mt-1 inline-block rounded bg-[#f5c518] px-2 py-0.5 text-[10px] font-black text-black">
            GANADOR
          </span>
        )}
      </div>
    </button>
  );
}
