import { ChevronRight, Target, TrendingUp, Trophy, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { UfcFight, UfcLeaderboardEntry, UfcPrediction } from "../types";
import { accuracyPct, cn, methodLabel, normalizeKey, scorePickPoints } from "../utils";

type Props = {
  leaderboard: UfcLeaderboardEntry[];
  fights: UfcFight[];
  predictions: UfcPrediction[];
};

const PODIUM_STYLES = [
  { card: "border-[#f5c518]/70 bg-[#1a1400]", rank: "bg-[#f5c518] text-black", pts: "text-[#f5c518]", bar: "bg-[#f5c518]" },
  { card: "border-white/40 bg-[#111]", rank: "bg-white text-black", pts: "text-white", bar: "bg-white" },
  { card: "border-[#c8102e]/50 bg-[#1a0308]", rank: "bg-[#c8102e] text-white", pts: "text-[#c8102e]", bar: "bg-[#c8102e]" },
];

export function PlayersView({ leaderboard, fights, predictions }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const fightById = useMemo(() => new Map(fights.map((f) => [f.id, f])), [fights]);
  const selectedEntry = leaderboard.find((e) => e.normalizedName === selectedKey) ?? null;

  if (!leaderboard.length) {
    return (
      <section className="grid min-h-56 place-items-center rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] p-6 text-center">
        <div>
          <Users className="mx-auto h-12 w-12 text-white/30" />
          <p className="mt-4 text-xl font-black text-white">Sin jugadores todavía</p>
          <p className="mt-2 text-base font-bold text-white/50">Sé el primero en guardar un pick.</p>
        </div>
      </section>
    );
  }

  const maxPts = leaderboard[0].totalPoints;

  return (
    <section className="grid gap-4">
      {/* Header */}
      <div className="overflow-hidden rounded-xl border border-[#f5c518]/35 bg-[#0a0a0a]">
        <div className="bg-[#c8102e] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#f5c518]" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f5c518]">Tabla de posiciones</p>
              </div>
              <h2 className="mt-1 text-2xl font-black uppercase text-white">
                {leaderboard.length} <span className="text-white/65">jugadores</span>
              </h2>
            </div>
            <div className="grid gap-2 min-[520px]:grid-cols-3">
              <StatChip label="Líder" value={leaderboard[0].playerName} />
              <StatChip label="Precisión" value={`${accuracyPct(leaderboard[0])}%`} />
              <StatChip label="Picks totales" value={leaderboard.reduce((s, e) => s + e.totalPredictions, 0)} />
            </div>
          </div>
        </div>
      </div>

      {/* Podium */}
      <div className="grid gap-3 sm:grid-cols-3">
        {leaderboard.slice(0, 3).map((entry, i) => {
          const style = PODIUM_STYLES[i];
          const barWidth = maxPts > 0 ? Math.round((entry.totalPoints / maxPts) * 100) : 0;

          return (
            <button
              type="button"
              key={entry.normalizedName}
              onClick={() => setSelectedKey(entry.normalizedName)}
              className={cn(
                "rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:ring-2 hover:ring-white/20",
                style.card,
                i === 0 && "ring-1 ring-[#f5c518]/35"
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className={cn("grid h-10 w-10 place-items-center rounded-lg text-xl font-black", style.rank)}>
                  {i + 1}
                </span>
                <div className="text-right">
                  <span className={cn("text-2xl font-black tabular-nums", style.pts)}>{entry.totalPoints}</span>
                  <span className="ml-1 text-xs font-bold text-white/55">pts</span>
                </div>
              </div>
              <p className="mb-1 truncate text-base font-black text-white">{entry.playerName}</p>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/55">
                <div className={cn("h-full rounded-full", style.bar)} style={{ width: `${barWidth}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <MiniStat label="Exactos" value={entry.exactPicks} />
                <MiniStat label="Ganadores" value={entry.correctWinners} />
                <MiniStat label="Prec." value={`${accuracyPct(entry)}%`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Full table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#c8102e] text-xs">
                <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-[#f5c518]">#</th>
                <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-white">Jugador</th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-white">Pts</th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-[#f5c518]">Exactos</th>
                <th className="hidden px-3 py-3 text-right font-black uppercase tracking-wide text-white/70 sm:table-cell">Ganadores</th>
                <th className="hidden px-3 py-3 text-right font-black uppercase tracking-wide text-white/70 md:table-cell">Prec.</th>
                <th className="px-3 py-3 text-right font-black uppercase tracking-wide text-white/50">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {leaderboard.map((entry, i) => {
                const isFirst = i === 0;
                const isTied = i > 0 && entry.totalPoints === leaderboard[i - 1].totalPoints;
                const barWidth = maxPts > 0 ? Math.round((entry.totalPoints / maxPts) * 100) : 0;

                return (
                  <tr
                    key={entry.normalizedName}
                    onClick={() => setSelectedKey(entry.normalizedName)}
                    className={cn("cursor-pointer transition-colors", isFirst ? "bg-[#1a1400]/65 hover:bg-[#1a1400]/90" : "hover:bg-white/4")}
                  >
                    <td className="px-3 py-3">
                      <span className={cn("text-sm font-black tabular-nums", isTied ? "text-white/40" : "text-white")}>
                        {isTied ? "=" : i + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className={cn("font-black", isFirst ? "text-[#f5c518]" : "text-white")}>{entry.playerName}</p>
                      <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-black/55">
                        <div className={cn("h-full rounded-full", isFirst ? "bg-[#f5c518]" : "bg-[#c8102e]")} style={{ width: `${barWidth}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={cn("text-base font-black tabular-nums", isFirst ? "text-[#f5c518]" : "text-white")}>
                        {entry.totalPoints}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={cn("font-black tabular-nums", entry.exactPicks > 0 ? "text-[#f5c518]" : "text-white/25")}>
                        {entry.exactPicks}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-right sm:table-cell">
                      <span className={cn("font-black tabular-nums", entry.correctWinners > 0 ? "text-emerald-400" : "text-white/25")}>
                        {entry.correctWinners}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-right md:table-cell">
                      <span className="text-xs font-black tabular-nums text-white/60">{accuracyPct(entry)}%</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-white/35" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/10 bg-black/35 px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-white/50">
            <span className="flex items-center gap-1"><Target className="h-3 w-3 text-[#f5c518]" /> Ganador + Método = 2 pts</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-400" /> Solo Ganador = 1 pt</span>
          </div>
        </div>
      </div>

      {selectedEntry && (
        <PlayerDetailModal
          entry={selectedEntry}
          predictions={predictions.filter((p) => normalizeKey(p.playerName) === selectedEntry.normalizedName)}
          fightById={fightById}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </section>
  );
}

function PlayerDetailModal({
  entry,
  predictions,
  fightById,
  onClose,
}: {
  entry: UfcLeaderboardEntry;
  predictions: UfcPrediction[];
  fightById: Map<string, UfcFight>;
  onClose: () => void;
}) {
  const sorted = [...predictions].sort((a, b) => {
    const af = fightById.get(a.fightId);
    const bf = fightById.get(b.fightId);
    return (af?.sortOrder ?? 9999) - (bf?.sortOrder ?? 9999);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#f5c518]/35 bg-[#0a0a0a] shadow-[0_24px_90px_rgba(0,0,0,0.85)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#c8102e] px-4 py-3">
          <div>
            <p className="text-base font-black uppercase text-white">{entry.playerName}</p>
            <p className="text-xs font-black text-[#f5c518]">
              {entry.totalPoints} pts · {entry.totalPredictions} picks · {accuracyPct(entry)}% precisión
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/20 bg-black/20 text-white/75 transition hover:border-[#f5c518] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {sorted.length ? (
            <div className="grid gap-2">
              {sorted.map((pred) => {
                const fight = fightById.get(pred.fightId);
                const pts = fight ? scorePickPoints(fight, pred) : null;
                const fighter = pred.cornerPick === "red" ? fight?.redCorner : fight?.blueCorner;
                const correct = pts !== null && pts > 0;
                const wrong = pts === 0;

                return (
                  <div key={pred.id} className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    correct ? "border-emerald-500/35 bg-emerald-950/25"
                    : wrong ? "border-[#c8102e]/25 bg-[#c8102e]/5"
                    : "border-white/8 bg-white/3"
                  )}>
                    <span className="shrink-0 text-[10px] font-black text-white/35">#{fight?.number ?? "?"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">
                        {fight ? `${fight.redCorner} vs ${fight.blueCorner}` : pred.fightId}
                      </p>
                      <p className="text-xs font-bold text-white/55">
                        Pick: <span className="text-white">{fighter ?? "—"}</span>
                        {pred.methodPick && <span> · {methodLabel(pred.methodPick)}</span>}
                      </p>
                    </div>
                    {pts !== null && (
                      <span className={cn(
                        "shrink-0 rounded-md border px-2 py-1 text-xs font-black",
                        correct ? "border-emerald-500/45 text-emerald-400" : "border-[#c8102e]/45 text-[#c8102e]/80"
                      )}>
                        {correct ? `+${pts}` : "0"}
                      </span>
                    )}
                    {pts === null && <span className="shrink-0 text-[10px] font-black text-white/30">pend.</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid place-items-center p-6 text-center">
              <Users className="h-10 w-10 text-white/25" />
              <p className="mt-3 text-sm font-black text-white/55">Sin picks guardados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-white/8 bg-black/45 px-2 py-1.5 text-center">
      <p className="text-[9px] font-black uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  );
}
