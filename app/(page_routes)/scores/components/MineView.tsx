"use client";

import type { Draft, LeaderboardEntry, ScoreMatch, ScorePrediction } from "../types";
import { emptyDraft } from "../utils";
import { MatchCard } from "./MatchCard";

type Props = {
  matches: ScoreMatch[];
  drafts: Record<string, Draft>;
  leaderboard: LeaderboardEntry[];
  predictions: ScorePrediction[];
  viewerName: string;
  nowMs: number;
  savingId: string | null;
  onUpdate: (matchId: string, patch: Partial<Draft>) => void;
  onSave: (match: ScoreMatch) => void;
};

export function MineView({
  matches,
  drafts,
  leaderboard,
  predictions,
  viewerName,
  nowMs,
  savingId,
  onUpdate,
  onSave,
}: Props) {
  const top = leaderboard.slice(0, 10);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="grid gap-3">
        {matches.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-white/50">
            {viewerName ? "Sin picks ni partidos abiertos." : "Inicia sesion para ver tus picks."}
          </div>
        ) : (
          matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              draft={drafts[m.id] ?? emptyDraft()}
              nowMs={nowMs}
              saving={savingId === m.id}
              community={predictions.filter((p) => p.matchId === m.id)}
              onUpdate={(patch) => onUpdate(m.id, patch)}
              onSave={() => onSave(m)}
            />
          ))
        )}
      </div>
      <aside className="h-fit rounded-xl border border-white/10 bg-black/30 p-4">
        <h3 className="text-sm font-black text-white">Top 10</h3>
        {top.length === 0 ? (
          <p className="mt-3 text-xs text-white/45">Sin puntos todavia.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {top.map((row, i) => (
              <li key={row.userId || row.playerName} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-white/80">
                  <span className="mr-2 font-black text-white/40">{i + 1}.</span>
                  {row.playerName}
                </span>
                <span className="shrink-0 font-black tabular-nums text-[#d5ff3f]">{row.totalPoints} pts</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}
