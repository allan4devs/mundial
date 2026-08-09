import { Users } from "lucide-react";
import type { UfcFight, UfcPrediction } from "../types";
import { cn, methodLabel, normalizeKey } from "../utils";

type Props = {
  fight: UfcFight;
  predictions: UfcPrediction[];
  playerName: string;
};

export function OtherPicksPanel({ fight, predictions, playerName }: Props) {
  const fightPicks = predictions.filter((p) => p.fightId === fight.id);
  const myKey = normalizeKey(playerName);

  if (!fightPicks.length) {
    return (
      <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-white/15 bg-black/25 p-6 text-center">
        <div>
          <Users className="mx-auto h-8 w-8 text-white/30" />
          <p className="mt-3 text-sm font-black text-white/55">Sin picks aún para esta pelea.</p>
        </div>
      </div>
    );
  }

  const redPicks = fightPicks.filter((p) => p.cornerPick === "red");
  const bluePicks = fightPicks.filter((p) => p.cornerPick === "blue");
  const total = fightPicks.length;
  const redPct = total > 0 ? Math.round((redPicks.length / total) * 100) : 0;
  const bluePct = total > 0 ? Math.round((bluePicks.length / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Consensus bar */}
      <div className="rounded-xl border border-white/10 bg-black/35 p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-wider text-white/50">Consenso · {total} picks</p>
        <div className="mb-2 flex items-center justify-between text-xs font-black">
          <span className="text-[#c8102e]">{fight.redCorner} ({redPct}%)</span>
          <span className="text-[#1e90ff]">({bluePct}%) {fight.blueCorner}</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full">
          <div className="bg-[#c8102e] transition-all" style={{ width: `${redPct}%` }} />
          <div className="bg-[#1e90ff] transition-all" style={{ width: `${bluePct}%` }} />
        </div>
      </div>

      {/* Individual picks */}
      <div className="grid gap-2 sm:grid-cols-2">
        {fightPicks.map((pick) => {
          const isMe = normalizeKey(pick.playerName) === myKey;
          const isRed = pick.cornerPick === "red";
          const fighter = isRed ? fight.redCorner : fight.blueCorner;
          const correct = fight.winnerCorner != null && pick.cornerPick === fight.winnerCorner;
          const wrong = fight.winnerCorner != null && pick.cornerPick !== fight.winnerCorner;

          return (
            <div
              key={pick.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                isMe ? "border-[#f5c518]/45 bg-[#f5c518]/8" : "border-white/8 bg-white/3",
                correct && "border-emerald-500/45 bg-emerald-950/35",
                wrong && "border-white/8 opacity-55"
              )}
            >
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-black text-white",
                  isRed ? "border-[#c8102e] bg-[#c8102e]/20" : "border-[#1e90ff] bg-[#1e90ff]/20"
                )}
              >
                {pick.playerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-black", isMe ? "text-[#f5c518]" : "text-white")}>
                  {pick.playerName} {isMe && "(vos)"}
                </p>
                <p className={cn("text-xs font-bold", isRed ? "text-[#c8102e]" : "text-[#1e90ff]")}>
                  {fighter}
                  {pick.methodPick && <span className="text-white/45"> · {methodLabel(pick.methodPick)}</span>}
                </p>
              </div>
              {correct && <span className="shrink-0 text-[10px] font-black text-emerald-400">✓</span>}
              {wrong && <span className="shrink-0 text-[10px] font-black text-white/30">✗</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
