"use client";

import type { Draft, ScoreMatch, ScorePrediction } from "../types";
import { emptyDraft } from "../utils";
import { MatchCard } from "./MatchCard";

type Props = {
  matches: ScoreMatch[];
  drafts: Record<string, Draft>;
  predictions: ScorePrediction[];
  nowMs: number;
  savingId: string | null;
  onUpdate: (matchId: string, patch: Partial<Draft>) => void;
  onSave: (match: ScoreMatch) => void;
};

export function LiveView({ matches, drafts, predictions, nowMs, savingId, onUpdate, onSave }: Props) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-white/50">
        No hay partidos en vivo. Mira Proximos.
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {matches.map((m) => (
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
      ))}
    </div>
  );
}
