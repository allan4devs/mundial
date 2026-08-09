import { CheckCircle2, Clock3, Loader2, Lock, PencilLine, Save, Users } from "lucide-react";
import type { Draft, MundialMatch } from "../types";
import {
  cn,
  finalScoreText,
  formatKickoff,
  formatUpdatedAt,
  isMatchClosed,
  isMatchLive,
  livePickStatus,
  liveStatusLabel,
  predictionResult,

} from "../utils";
import { Flag } from "./Flag";
import { teamCode } from "../flags";
import { ScoreInput } from "./ScoreInput";

type MatchStatus = {
  label: string;
  className: string;
  icon: "lock" | "edit" | "saved" | "open" | "queue";
};

function getMatchStatus(draft: Draft, canEdit: boolean, closed: boolean, live: boolean): MatchStatus {
  if (live) {
    return {
      label: "En vivo",
      className: "border-[#9dff34]/60 bg-[#10240b] text-[#d5ff3f]",
      icon: "open",
    };
  }
  if (closed) {
    return {
      label: "Cerrado",
      className: "border-[#ffb15f]/55 bg-[#2a120b] text-[#ffb15f]",
      icon: "lock",
    };
  }
  if (canEdit && draft.dirty) {
    return {
      label: "Sin guardar",
      className: "border-[#ff6a3d]/60 bg-[#2a120b] text-[#ffb15f]",
      icon: "edit",
    };
  }
  if (canEdit && draft.saved) {
    return {
      label: "Guardado",
      className: "border-[#9dff34]/60 bg-[#10240b] text-[#d5ff3f]",
      icon: "saved",
    };
  }
  if (canEdit) {
    return {
      label: "Abierto",
      className: "border-[#62ffe6]/60 bg-[#071d2a] text-[#62ffe6]",
      icon: "open",
    };
  }
  return {
    label: "En cola",
    className: "border-white/15 bg-black/35 text-white/60",
    icon: "queue",
  };
}

function StatusIcon({ icon }: { icon: MatchStatus["icon"] }) {
  const className = "h-3.5 w-3.5 shrink-0";

  if (icon === "lock") return <Lock className={className} />;
  if (icon === "edit") return <PencilLine className={className} />;
  if (icon === "saved") return <CheckCircle2 className={className} />;
  return <Clock3 className={className} />;
}

type MatchCardProps = {
  match: MundialMatch;
  draft: Draft;
  savingId: string | null;
  isSavingBulk: boolean;
  todayEditableMatchIds: Set<string>;
  nowMs: number;
  onUpdateDraft: (matchId: string, patch: Partial<Draft>) => void;
  onSave: (match: MundialMatch) => Promise<void>;
  onViewPicks?: () => void;
  isViewingPicks?: boolean;
};

export function MatchCard({ match, draft, savingId, isSavingBulk, todayEditableMatchIds, nowMs, onUpdateDraft, onSave, onViewPicks, isViewingPicks }: MatchCardProps) {
  const closed = isMatchClosed(match, nowMs);
  const live = isMatchLive(match);
  const canEdit = todayEditableMatchIds.has(match.id) && !closed;
  const isSaving = savingId === match.id;
  const disabled = !canEdit || isSaving || isSavingBulk;
  const isKnockoutTie = match.stage !== "group" && draft.homeScore === draft.awayScore;
  const status = getMatchStatus(draft, canEdit, closed, live);
  const pickLiveStatus = livePickStatus(match, draft);

  return (
    <article
      className={cn(
        "relative min-w-0 overflow-hidden rounded-lg border bg-[#071018] p-3 transition-all duration-200 shadow-[0_18px_52px_rgba(0,0,0,0.22)] min-[380px]:p-4",
        canEdit ? "border-[#62ffe6]/65" : "border-white/15"
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f0b429] via-[#d5ff3f] to-[#174826]" />
      <div className="mb-3 flex items-start justify-between gap-2 min-[380px]:gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/15 bg-black/35 px-1.5 py-1 text-[11px] font-black tabular-nums text-white min-[380px]:px-2 min-[380px]:text-xs">
              #{match.number}
            </span>
            <span className="rounded-md border border-white/15 bg-black/35 px-1.5 py-1 text-[11px] font-black text-white/65 min-[380px]:px-2 min-[380px]:text-xs">
              {match.group ? `Grupo ${match.group}` : match.stageLabel}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold text-white/60">{formatKickoff(match.kickoffAt)}</p>
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-black min-[380px]:gap-1.5 min-[380px]:px-2.5 min-[380px]:text-xs", status.className)}>
          <StatusIcon icon={status.icon} />
          {status.label}
        </span>
      </div>

      <div className="grid gap-2.5">
        <TeamScoreRow
          team={match.homeTeam}
          value={draft.homeScore}
          disabled={disabled}
          onChange={(value) => onUpdateDraft(match.id, { homeScore: value })}
        />
        <TeamScoreRow
          team={match.awayTeam}
          value={draft.awayScore}
          disabled={disabled}
          onChange={(value) => onUpdateDraft(match.id, { awayScore: value })}
        />
      </div>

      {isKnockoutTie && canEdit && (
        <div className="mt-3 grid gap-3">
          <div>
            <label className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-white/70">
              Quién avanza
            </label>
            <select
              value={draft.winnerPick ?? ""}
              onChange={(event) =>
                onUpdateDraft(match.id, {
                  winnerPick: event.target.value === "home" || event.target.value === "away" ? event.target.value : null,
                  winnerPickMethod: event.target.value ? draft.winnerPickMethod : null,
                })
              }
              className="h-11 w-full rounded-lg border border-[#d5ff3f]/45 bg-black/55 px-3 text-sm font-black text-[#d5ff3f] outline-none focus:border-white focus:ring-2 focus:ring-[#d5ff3f]/20"
              aria-label={`Quien pasa del partido ${match.number}`}
            >
              <option value="" className="bg-[#071018] text-white">
                Elige quién pasa
              </option>
              <option value="home" className="bg-[#071018] text-white">
                {match.homeTeam}
              </option>
              <option value="away" className="bg-[#071018] text-white">
                {match.awayTeam}
              </option>
            </select>
          </div>

          {draft.winnerPick && (
            <div>
              <label className="mb-2 block text-sm font-black uppercase tracking-[0.14em] text-white/70">
                Método de definición
              </label>
              <select
                value={draft.winnerPickMethod ?? ""}
                onChange={(event) =>
                  onUpdateDraft(match.id, {
                    winnerPickMethod:
                      event.target.value === "extraTime" || event.target.value === "penalties"
                        ? event.target.value
                        : null,
                  })
                }
                className="h-11 w-full rounded-lg border border-[#d5ff3f]/45 bg-black/55 px-3 text-sm font-black text-[#d5ff3f] outline-none focus:border-white focus:ring-2 focus:ring-[#d5ff3f]/20"
                aria-label={`Método de definición del partido ${match.number}`}
              >
                <option value="" className="bg-[#071018] text-white">
                  Seleccioná tiempos extra o penales
                </option>
                <option value="extraTime" className="bg-[#071018] text-white">
                  Tiempos extra
                </option>
                <option value="penalties" className="bg-[#071018] text-white">
                  Penales
                </option>
              </select>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-white/10 bg-black/35 p-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#62ffe6]">
            {live ? `Live · ${liveStatusLabel(match)}` : closed ? "Resultado final" : "Tu pick"}
          </p>
          {live ? (
            <p className="mt-0.5 text-2xl font-black tabular-nums text-[#9dff34]">
              {match.homeLiveScore ?? 0} – {match.awayLiveScore ?? 0}
            </p>
          ) : (
            <p
              className={cn(
                "mt-1 min-w-0 break-words text-base font-black",
                closed ? "text-[#d5ff3f]" : draft.saved ? "text-[#62ffe6]" : "text-white"
              )}
            >
              {closed ? finalScoreText(match) : predictionResult(match, draft)}
            </p>
          )}
        </div>
        <div className={cn("grid shrink-0 gap-2 min-[380px]:flex min-[380px]:items-center", onViewPicks ? "grid-cols-2" : "grid-cols-1")}>
          {onViewPicks && (
            <button
              type="button"
              onClick={onViewPicks}
              title="Ver picks de otros jugadores"
              aria-label={`Ver picks del partido ${match.number}`}
              className={cn(
                "grid h-11 w-full shrink-0 place-items-center rounded-lg border transition min-[380px]:h-12 min-[380px]:w-12",
                isViewingPicks
                  ? "border-[#d5ff3f] bg-[#1a2206] text-[#d5ff3f]"
                  : "border-white/15 bg-black/45 text-white/55 hover:border-[#62ffe6] hover:text-white"
              )}
            >
              <Users className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => void onSave(match)}
            disabled={disabled || !draft.dirty}
            title="Guardar"
            aria-label={`Guardar partido ${match.number}`}
            className="grid h-11 w-full shrink-0 place-items-center rounded-lg border border-[#d5ff3f] bg-[#9dff34] text-[#06121c] transition hover:border-white hover:bg-[#d5ff3f] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/35 min-[380px]:h-12 min-[380px]:w-12"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {pickLiveStatus && (
        <div
          className={cn(
            "mt-3 rounded-lg border px-3 py-2.5",
            pickLiveStatus.tone === "lost"
              ? "border-[#ff6a3d]/55 bg-[#35130d]/85 text-[#ffd2c2]"
              : "border-[#9dff34]/45 bg-[#10240b]/85 text-[#e7ffc0]"
          )}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.16em]">
            {pickLiveStatus.title}
          </p>
          <p className="mt-1 text-sm font-bold leading-snug">{pickLiveStatus.message}</p>
        </div>
      )}
      {draft.updatedAt && (
        <p className="mt-2 text-xs font-bold text-white/45">{formatUpdatedAt(draft.updatedAt)}</p>
      )}
    </article>
  );
}

function TeamScoreRow({
  team,
  value,
  disabled,
  onChange,
}: {
  team: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 p-2 min-[380px]:grid-cols-[2.75rem_minmax(0,1fr)_auto] min-[380px]:gap-2 min-[380px]:p-2.5">
      <span className="grid h-8 w-9 place-items-center rounded-md bg-white min-[380px]:h-9 min-[380px]:w-11">
        <Flag team={team} size="sm" />
      </span>
      <div className="min-w-0">
        <span className="block truncate text-xs font-black leading-tight text-white min-[380px]:text-sm">{team}</span>
        <span className="mt-0.5 inline-block rounded border border-[#f0b429]/25 bg-[#12351f] px-1.5 py-0.5 text-[10px] font-black text-[#d5ff3f]">
          {teamCode(team)}
        </span>
      </div>
      <ScoreInput label={team} value={value} disabled={disabled} onChange={onChange} />
    </div>
  );
}
