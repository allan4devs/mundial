import { CheckCircle2, Clock3, Lock, Zap } from "lucide-react";
import type { UfcDraft, UfcFight } from "../types";
import { cn, isFightClosed, isFightLive, predictionLabel, scheduledMs } from "../utils";

type Props = {
  fights: UfcFight[];
  nowMs: number;
  selectedFightId: string | null;
  drafts: Record<string, UfcDraft>;
  onSelectFight: (fight: UfcFight) => void;
};

export function CardPanel({ fights, nowMs, selectedFightId, drafts, onSelectFight }: Props) {
  const prelims = fights.filter((f) => f.section === "prelim");
  const main = fights.filter((f) => f.section === "main");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0a0a0a] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Fight Card</p>

      {prelims.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">Preliminares</p>
          <div className="flex flex-col gap-1.5">
            {prelims.map((fight) => (
              <FightRow
                key={fight.id}
                fight={fight}
                nowMs={nowMs}
                selected={selectedFightId === fight.id}
                draft={drafts[fight.id]}
                onClick={() => onSelectFight(fight)}
              />
            ))}
          </div>
        </div>
      )}

      {main.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">Main Card</p>
          <div className="flex flex-col gap-1.5">
            {[...main].reverse().map((fight) => (
              <FightRow
                key={fight.id}
                fight={fight}
                nowMs={nowMs}
                selected={selectedFightId === fight.id}
                draft={drafts[fight.id]}
                onClick={() => onSelectFight(fight)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FightRow({
  fight,
  nowMs,
  selected,
  draft,
  onClick,
}: {
  fight: UfcFight;
  nowMs: number;
  selected: boolean;
  draft?: UfcDraft;
  onClick: () => void;
}) {
  const isClosed = isFightClosed(fight, nowMs);
  const isLive = isFightLive(fight);
  const hasPick = Boolean(draft?.saved || draft?.dirty);
  const hasResult = fight.winnerCorner != null;

  function StatusIcon() {
    if (isLive) return <Zap className="h-3.5 w-3.5 shrink-0 animate-pulse text-[#f5c518]" />;
    if (hasResult) return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#f5c518]" />;
    if (isClosed) return <Lock className="h-3.5 w-3.5 shrink-0 text-white/30" />;
    return <Clock3 className={cn("h-3.5 w-3.5 shrink-0", hasPick ? "text-[#c8102e]" : "text-white/35")} />;
  }

  const msUntil = scheduledMs(fight) - nowMs;
  const isNext = !isClosed && msUntil < 3 * 60 * 60 * 1000 && msUntil > 0; // within 3h

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition",
        selected
          ? "border-[#c8102e] bg-[#c8102e]/15"
          : isLive
            ? "border-[#f5c518]/45 bg-[#f5c518]/8"
            : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"
      )}
    >
      <StatusIcon />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0 text-[10px] font-black tabular-nums text-white/35">#{fight.number}</span>
          <p className="min-w-0 truncate text-xs font-black text-white">
            {fight.redCorner} <span className="text-white/40">vs</span> {fight.blueCorner}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white/35">{fight.weightClass}</span>
          {fight.titleFight && (
            <span className="text-[10px] font-black text-[#f5c518]">🏆 TITLE</span>
          )}
          {hasPick && draft && (
            <span className="truncate text-[10px] font-black text-[#c8102e]">
              → {predictionLabel(fight, draft)}
            </span>
          )}
        </div>
      </div>

      {isNext && !isClosed && (
        <span className="shrink-0 rounded bg-[#c8102e] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
          Next
        </span>
      )}
    </button>
  );
}
