import { Star, Target, TrendingUp } from "lucide-react";
import type { LeaderboardEntry } from "../adminTypes";
import { cn } from "../../utils";

type AdminLeaderboardProps = {
  leaderboard: LeaderboardEntry[];
  onPlayerClick?: (entry: LeaderboardEntry) => void;
};

const PODIUM_COLORS = [
  { card: "border-[#f0b429]/45 bg-[#211707]/80", medal: "1", pts: "text-[#f0b429]", bar: "bg-[#f0b429]" },
  { card: "border-white/18 bg-black/35", medal: "2", pts: "text-white/65", bar: "bg-slate-400" },
  { card: "border-[#ffb15f]/35 bg-[#2a120b]/70", medal: "3", pts: "text-[#ffb15f]", bar: "bg-[#ffb15f]" },
];

export function AdminLeaderboard({ leaderboard, onPlayerClick }: AdminLeaderboardProps) {
  if (!leaderboard.length) {
    return (
      <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/20 bg-black/35 p-8 text-center">
        <p className="text-sm font-black text-white/65">Todavia no hay predicciones guardadas para puntuar.</p>
      </div>
    );
  }

  const maxPts = leaderboard[0].totalPoints;

  return (
    <div className="grid gap-5">
      {/* Podium */}
      <div className="grid gap-3 sm:grid-cols-3">
        {leaderboard.slice(0, 3).map((entry, i) => {
          const color = PODIUM_COLORS[i];
          const barWidth = maxPts > 0 ? Math.round((entry.totalPoints / maxPts) * 100) : 0;
          const accuracy =
            entry.scoredPredictions > 0
              ? Math.round((entry.correctOutcomes / entry.scoredPredictions) * 100)
              : 0;

          return (
            <div
              key={entry.normalizedName}
              onClick={() => onPlayerClick?.(entry)}
              className={cn(
                "rounded-xl border p-4 shadow-[0_16px_46px_rgba(0,0,0,0.18)]",
                color.card,
                i === 0 && "ring-2 ring-[#f0b429]/25",
                onPlayerClick && "cursor-pointer transition hover:border-[#d5ff3f]/50 hover:bg-[#12351f]"
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-3xl leading-none">{color.medal}</span>
                <div className="text-right">
                  <span className={cn("text-2xl font-black tabular-nums", color.pts)}>
                    {entry.totalPoints}
                  </span>
                  <span className="ml-1 text-xs font-bold text-white/40">pts</span>
                </div>
              </div>

              <p className="mb-1 truncate text-base font-black text-white">{entry.playerName}</p>

              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={cn("h-full rounded-full", color.bar)} style={{ width: `${barWidth}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-center">
                  <p className="text-[10px] font-bold text-white/40">Exactos</p>
                  <p className="text-sm font-black text-emerald-700">{entry.exactScores}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-center">
                  <p className="text-[10px] font-bold text-white/40">Resul.</p>
                  <p className="text-sm font-black text-[#8fd7ff]">{entry.correctOutcomes}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-center">
                  <p className="text-[10px] font-bold text-white/40">Prec.</p>
                  <p className="text-sm font-black text-white/65">{accuracy}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div className="overflow-hidden rounded-xl border border-white/12 bg-black/35 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/12 bg-black/35 text-xs">
                <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-white/40">#</th>
                <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-white/40">Jugador</th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-white/40">Total</th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-white/40">
                  <span className="hidden sm:inline">Predicc.</span>
                  <span className="sm:hidden">Pred.</span>
                </th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-white/40">
                  <span className="hidden sm:inline">Stats</span>
                  <span className="sm:hidden">St.</span>
                </th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-emerald-600">
                  <span className="flex items-center justify-end gap-1">
                    <Target className="h-3 w-3" />
                    <span className="hidden sm:inline">Exactos</span>
                  </span>
                </th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-sky-600">
                  <span className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="hidden sm:inline">Result.</span>
                  </span>
                </th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-[#ffb15f]">
                  Fallos
                </th>
                <th className="hidden px-3 py-3 text-right font-black uppercase tracking-wide text-white/40 sm:table-cell">
                  Jugados
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {leaderboard.map((entry, i) => {
                const isFirst = i === 0;
                const isTied = i > 0 && entry.totalPoints === leaderboard[i - 1].totalPoints;
                const barWidth = maxPts > 0 ? Math.round((entry.totalPoints / maxPts) * 100) : 0;
                const medals = ["1", "2", "3"];

                return (
                  <tr
                    key={entry.normalizedName}
                    onClick={() => onPlayerClick?.(entry)}
                    className={cn(
                      "transition-colors",
                      isFirst ? "bg-[#211707]/80" : "hover:bg-white/5",
                      onPlayerClick && "cursor-pointer"
                    )}
                  >
                    {/* Rank */}
                    <td className="px-3 py-3">
                      {medals[i] ? (
                        <span className="text-base leading-none">{medals[i]}</span>
                      ) : (
                        <span className={cn("text-sm font-black tabular-nums", isTied ? "text-white/40" : "text-white/50")}>
                          {isTied ? "=" : i + 1}
                        </span>
                      )}
                    </td>

                    {/* Player */}
                    <td className="px-3 py-3">
                      <div className="min-w-0">
                        <p className={cn("font-black", isFirst ? "text-[#f0b429]" : "text-white")}>
                          {entry.playerName}
                        </p>
                        {/* Mini points bar */}
                        <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn("h-full rounded-full", isFirst ? "bg-[#f0b429]" : "bg-white/35")}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Total pts */}
                    <td className="px-3 py-3 text-right">
                      <span className={cn("text-base font-black tabular-nums", isFirst ? "text-[#f0b429]" : "text-white")}>
                        {entry.totalPoints}
                      </span>
                    </td>

                    {/* Prediction pts */}
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-white/65">
                      {entry.predictionPoints}
                    </td>

                    {/* Stat pts */}
                    <td className="px-3 py-3 text-right">
                      {entry.statPoints > 0 ? (
                        <span className="inline-flex items-center justify-end gap-1 font-bold tabular-nums text-purple-700">
                          <Star className="h-3 w-3 text-purple-400" />
                          {entry.statPoints}
                        </span>
                      ) : (
                        <span className="font-bold text-white/25">-</span>
                      )}
                    </td>

                    {/* Exactos */}
                    <td className="px-3 py-3 text-right">
                      <span className={cn(
                        "font-black tabular-nums",
                        entry.exactScores > 0 ? "text-emerald-700" : "text-white/25"
                      )}>
                        {entry.exactScores}
                      </span>
                    </td>

                    {/* Correctos */}
                    <td className="px-3 py-3 text-right">
                      <span className={cn(
                        "font-black tabular-nums",
                        entry.correctOutcomes > 0 ? "text-[#8fd7ff]" : "text-white/25"
                      )}>
                        {entry.correctOutcomes}
                      </span>
                    </td>

                    {/* Incorrect predictions */}
                    <td className="px-3 py-3 text-right">
                      <span className={cn(
                        "font-black tabular-nums",
                        entry.scoredPredictions - entry.correctOutcomes > 0 ? "text-[#ffb15f]" : "text-white/25"
                      )}>
                        {Math.max(entry.scoredPredictions - entry.correctOutcomes, 0)}
                      </span>
                    </td>

                    {/* Jugados/Scored */}
                    <td className="hidden px-3 py-3 text-right sm:table-cell">
                      <span className="text-xs font-bold tabular-nums text-white/40">
                        {entry.scoredPredictions}/{entry.totalPredictions}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="border-t border-white/10 bg-black/25 px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-white/40">
            <span className="flex items-center gap-1"><Target className="h-3 w-3 text-emerald-500" /> Exacto = 3 pts · empate exacto + pase + método = 4 pts</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-sky-500" /> Resultado = 1 pt · pase por TE = 2 pts · pase por penales = 3 pts</span>
            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-purple-400" /> Mini-apuesta correcta = valor configurado</span>
            <span>Hacé clic en un jugador para auditar cada apuesta y cada punto.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
