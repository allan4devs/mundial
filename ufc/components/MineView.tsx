import { CheckCircle2, ListChecks, Lock, MinusCircle, Target } from "lucide-react";
import type { UfcDraft, UfcFight, UfcPrediction } from "../types";
import { cn, formatScheduled, isFightClosed, methodLabel, predictionLabel, scorePickPoints } from "../utils";
import { FeaturedFight } from "./FeaturedFight";

type Props = {
  orderedFights: UfcFight[];
  drafts: Record<string, UfcDraft>;
  savingId: string | null;
  isSavingBulk: boolean;
  nowMs: number;
  savedCount: number;
  lockedCount: number;
  predictions: UfcPrediction[];
  playerName: string;
  onUpdateDraft: (fightId: string, patch: Partial<UfcDraft>) => void;
  onSave: (fight: UfcFight) => Promise<void>;
};

export function MineView({
  orderedFights,
  drafts,
  savingId,
  isSavingBulk,
  nowMs,
  savedCount,
  lockedCount,
  predictions,
  playerName,
  onUpdateDraft,
  onSave,
}: Props) {
  const openFights = orderedFights.filter((f) => !isFightClosed(f, nowMs));
  const closedFights = orderedFights.filter((f) => isFightClosed(f, nowMs));
  const myPreds = new Map(predictions.map((p) => [p.fightId, p]));

  return (
    <div className="grid gap-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
          <ListChecks className="h-5 w-5 shrink-0 text-[#f5c518]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Guardados</p>
            <p className="text-xl font-black text-white">{savedCount}<span className="text-sm text-white/40">/{orderedFights.length}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
          <Lock className="h-5 w-5 shrink-0 text-white/40" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Cerrados</p>
            <p className="text-xl font-black text-white">{lockedCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/40">Abiertos</p>
            <p className="text-xl font-black text-white">{openFights.length}</p>
          </div>
        </div>
      </div>

      {/* Open fights to pick */}
      {openFights.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/40">Peleass abiertas</p>
          <div className="grid gap-4">
            {openFights.map((fight) => (
              <FeaturedFight
                key={fight.id}
                fight={fight}
                draft={drafts[fight.id] ?? { cornerPick: null, methodPick: null, locked: false, dirty: false, saved: false, updatedAt: null }}
                savingId={savingId}
                isSavingBulk={isSavingBulk}
                nowMs={nowMs}
                onUpdateDraft={onUpdateDraft}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed fights with results */}
      {closedFights.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-white/40">Peleass cerradas</p>
          <div className="grid gap-2">
            {closedFights.map((fight) => {
              const pred = myPreds.get(fight.id);
              const pts = pred ? scorePickPoints(fight, pred) : null;

              return (
                <ClosedFightRow key={fight.id} fight={fight} pred={pred ?? null} pts={pts} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ClosedFightRow({
  fight,
  pred,
  pts,
}: {
  fight: UfcFight;
  pred: UfcPrediction | null;
  pts: number | null;
}) {
  const hasResult = fight.winnerCorner != null;
  const correct = pts !== null && pts > 0;
  const wrong = pts === 0;
  const myFighter = pred?.cornerPick === "red" ? fight.redCorner : pred?.cornerPick === "blue" ? fight.blueCorner : null;
  const winnerName = fight.winnerCorner === "red" ? fight.redCorner : fight.winnerCorner === "blue" ? fight.blueCorner : null;

  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        correct ? "border-emerald-500/35 bg-emerald-950/25"
        : wrong ? "border-[#c8102e]/25 bg-[#c8102e]/5"
        : "border-white/10 bg-[#0a0a0a]"
      )}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-xs font-black text-white/60">
        #{fight.number}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-white">
          {fight.redCorner} <span className="text-white/40">vs</span> {fight.blueCorner}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-bold text-white/40">{fight.weightClass}</span>
          {myFighter && (
            <span className="font-bold text-white/60">
              Tu pick: <span className="font-black text-white">{myFighter}</span>
              {pred?.methodPick && <span className="text-white/40"> · {methodLabel(pred.methodPick)}</span>}
            </span>
          )}
          {!pred && <span className="font-bold text-white/35">Sin pick</span>}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {hasResult && winnerName && (
          <p className="text-xs font-bold text-[#f5c518]">
            Ganó: <span className="font-black">{winnerName}</span>
          </p>
        )}
        {pts !== null ? (
          <div className={cn(
            "mt-0.5 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-black",
            correct ? "border-emerald-500/45 text-emerald-400" : "border-[#c8102e]/45 text-[#c8102e]/80"
          )}>
            {correct ? <Target className="h-3 w-3" /> : <MinusCircle className="h-3 w-3" />}
            {correct ? `+${pts}` : "0"}
          </div>
        ) : !pred ? null : (
          <span className="text-[10px] font-black text-white/30">Pendiente</span>
        )}
      </div>
    </article>
  );
}
