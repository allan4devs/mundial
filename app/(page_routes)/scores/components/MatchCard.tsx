"use client";

import { Loader2, Save } from "lucide-react";
import type { Draft, ScoreMatch, ScorePrediction } from "../types";
import {
  cn,
  displayScore,
  formatCountdown,
  formatKickoff,
  isMatchClosed,
  isMatchLive,
  liveLabel,
  matchStatus,
} from "../utils";
import { ScoreInput } from "./ScoreInput";

type Props = {
  match: ScoreMatch;
  draft: Draft;
  nowMs: number;
  saving: boolean;
  community?: ScorePrediction[];
  onUpdate: (patch: Partial<Draft>) => void;
  onSave: () => void;
};

export function MatchCard({ match, draft, nowMs, saving, community, onUpdate, onSave }: Props) {
  const closed = isMatchClosed(match, nowMs);
  const live = isMatchLive(match);
  const status = matchStatus(match);
  const max = match.sport === "football" ? 30 : 200;

  return (
    <article
      className={cn(
        "rounded-xl border bg-[#071018] p-4",
        live ? "border-[#9dff34]/50" : closed ? "border-white/10" : "border-white/15"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-white/45">
            {match.league} · {match.sport} · #{match.number}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{formatKickoff(match.startsAt || match.kickoffAt)}</p>
          {!closed && !live ? (
            <p className="mt-0.5 text-[11px] font-bold tabular-nums text-cyan-300/90">
              Cierra en {formatCountdown(match.predictionClosesAt || match.startsAt || match.kickoffAt, nowMs)}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "rounded-md border px-2 py-1 text-[10px] font-black",
            live
              ? "border-[#9dff34]/50 bg-[#10240b] text-[#d5ff3f]"
              : closed
                ? "border-white/15 text-white/50"
                : "border-cyan-400/40 text-cyan-300"
          )}
        >
          {live && match.liveMinute != null
            ? `${liveLabel(status)} ${match.liveMinute}'`
            : liveLabel(status)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="flex-1 text-right text-base font-black text-white">{match.homeTeam}</p>
        <p className="shrink-0 text-xl font-black tabular-nums text-[#d5ff3f]">{displayScore(match)}</p>
        <p className="flex-1 text-left text-base font-black text-white">{match.awayTeam}</p>
      </div>

      {match.liveNote ? <p className="mt-2 text-center text-xs text-white/45">{match.liveNote}</p> : null}

      {!closed && status !== "cancelled" ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-4">
          <ScoreInput value={draft.homeScore} disabled={saving} max={max} onChange={(n) => onUpdate({ homeScore: n })} />
          <span className="text-white/40">–</span>
          <ScoreInput value={draft.awayScore} disabled={saving} max={max} onChange={(n) => onUpdate({ awayScore: n })} />
          <button
            type="button"
            disabled={saving || !draft.dirty}
            onClick={onSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#9dff34] px-3 py-2 text-sm font-black text-black disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-1 text-center text-sm text-white/50">
          {draft.saved || draft.homeScore || draft.awayScore ? (
            <p>
              Tu pick: {draft.homeScore} – {draft.awayScore}
              {draft.saved && match.homeScore != null
                ? ` · Resultado: ${match.homeScore} – ${match.awayScore}`
                : ""}
            </p>
          ) : null}
          {closed && community && community.length > 0 ? (
            <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2 text-left">
              <p className="mb-1 text-[10px] font-black uppercase text-white/40">
                Picks de la comunidad · {community.length}
              </p>
              <div className="mb-2 flex flex-wrap gap-1">
                {Object.entries(
                  community.reduce<Record<string, number>>((acc, p) => {
                    const k = `${p.homeScore}-${p.awayScore}`;
                    acc[k] = (acc[k] ?? 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([score, n]) => (
                    <span
                      key={score}
                      className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] tabular-nums text-white/70"
                    >
                      {score} ×{n}
                    </span>
                  ))}
              </div>
              <ul className="max-h-28 space-y-0.5 overflow-y-auto text-xs">
                {community.slice(0, 12).map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span className="truncate">{p.playerName}</span>
                    <span className="tabular-nums text-white/70">
                      {p.homeScore}-{p.awayScore}
                      {p.scoring ? ` · ${p.scoring.points}pts` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              {draft.saved || draft.homeScore || draft.awayScore ? (
                <button
                  type="button"
                  className="mt-2 w-full rounded-md border border-white/15 py-1 text-[11px] font-bold text-white/70"
                  onClick={() => {
                    const text = `Mi pick ${match.homeTeam} ${draft.homeScore}-${draft.awayScore} ${match.awayTeam} · Scores`;
                    void navigator.clipboard?.writeText(text);
                    void fetch("/api/scores/analytics", {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ event: "share_pick", matchId: match.id }),
                    }).catch(() => {});
                  }}
                >
                  Copiar mi pick
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
