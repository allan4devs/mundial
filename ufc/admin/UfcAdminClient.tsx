"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Shield, Trophy, Tv2, Users } from "lucide-react";
import { cn } from "../utils";

const ADMIN_API = "/api/ufc/admin";
const FIGHT_API = "/api/ufc/admin/fight";

type CornerPick = "red" | "blue" | null;
type MethodPick = "ko_tko" | "submission" | "decision" | null;

type AdminFight = {
  id: string;
  number: number;
  section: string;
  sectionLabel: string;
  weightClass: string;
  weightLbs: number;
  titleFight: boolean;
  titleLabel: string | null;
  scheduledRounds: number;
  redCorner: string;
  blueCorner: string;
  scheduledAt: string;
  winnerCorner: CornerPick;
  method: MethodPick;
  endRound: number | null;
  endTime: string | null;
  liveStatus: "scheduled" | "live" | "finished";
  liveNote: string;
  forceClosed: boolean;
  closed: boolean;
  predictorCount: number;
  redPicks: number;
  bluePicks: number;
  ko_tkoPicks: number;
  submissionPicks: number;
  decisionPicks: number;
};

type LeaderboardEntry = {
  playerName: string;
  normalizedName: string;
  totalPoints: number;
  totalPredictions: number;
  scoredPredictions: number;
  exactPicks: number;
  correctWinners: number;
};

type AdminData = {
  fights: AdminFight[];
  leaderboard: LeaderboardEntry[];
};

type AdminView = "leaderboard" | "fights";

const VIEW_OPTIONS: Array<{ id: AdminView; label: string; icon: React.ReactNode }> = [
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
  { id: "fights", label: "Peleass", icon: <Tv2 className="h-4 w-4" /> },
];

const CORNER_OPTIONS = [
  { value: "", label: "Sin resultado" },
  { value: "red", label: "Gana Esquina Roja" },
  { value: "blue", label: "Gana Esquina Azul" },
];
const METHOD_OPTIONS = [
  { value: "", label: "Sin método" },
  { value: "ko_tko", label: "KO / TKO" },
  { value: "submission", label: "Submission" },
  { value: "decision", label: "Decision" },
];
const STATUS_OPTIONS = [
  { value: "scheduled", label: "Programada" },
  { value: "live", label: "En vivo" },
  { value: "finished", label: "Finalizada" },
];

export default function UfcAdminClient() {
  const [data, setData] = useState<AdminData | null>(null);
  const [view, setView] = useState<AdminView>("leaderboard");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [patchingId, setPatchingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(ADMIN_API, { cache: "no-store" });
      if (!res.ok) throw new Error("Error cargando datos.");
      setData(await res.json());
    } catch {
      setError("No se pudo cargar el panel.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function patchFight(fightId: string, patch: Record<string, unknown>) {
    setPatchingId(fightId);
    try {
      const res = await fetch(FIGHT_API, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fightId, ...patch }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Error actualizando.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error.");
    } finally {
      setPatchingId(null);
    }
  }

  const scoredCount = data?.fights.filter((f) => f.winnerCorner).length ?? 0;
  const openCount = data?.fights.filter((f) => !f.closed).length ?? 0;
  const playerCount = data?.leaderboard.length ?? 0;
  const leader = data?.leaderboard[0] ?? null;

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50">
              <Shield className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Admin</p>
              <h1 className="text-lg font-black leading-tight text-slate-950">UFC Freedom 250</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6">
        {data && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Users className="h-4 w-4 text-slate-600" />} bg="bg-slate-100" label="Jugadores" value={playerCount} />
            <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} bg="bg-emerald-50" label="Con resultado" value={`${scoredCount}/${data.fights.length}`} />
            <StatCard icon={<Tv2 className="h-4 w-4 text-amber-600" />} bg="bg-amber-50" label="Abiertas" value={openCount} valueClass="text-amber-700" />
            <StatCard icon={<Trophy className="h-4 w-4 text-amber-500" />} bg="bg-amber-50" label="Líder" value={leader ? `${leader.playerName} · ${leader.totalPoints}pts` : "—"} small />
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-black transition",
                view === option.id
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>
        )}

        {isLoading && !data ? (
          <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-500" />
              <p className="mt-3 text-sm font-black text-slate-600">Cargando...</p>
            </div>
          </div>
        ) : data ? (
          <>
            {view === "leaderboard" && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs">
                      <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-slate-500">#</th>
                      <th className="px-4 py-3 text-left font-black uppercase tracking-wide text-slate-950">Jugador</th>
                      <th className="px-4 py-3 text-right font-black uppercase tracking-wide text-slate-950">Pts</th>
                      <th className="hidden px-4 py-3 text-right font-black uppercase tracking-wide text-slate-500 sm:table-cell">Exactos</th>
                      <th className="hidden px-4 py-3 text-right font-black uppercase tracking-wide text-slate-500 md:table-cell">Ganadores</th>
                      <th className="hidden px-4 py-3 text-right font-black uppercase tracking-wide text-slate-500 lg:table-cell">Picks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.leaderboard.map((entry, i) => (
                      <tr key={entry.normalizedName} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-black text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-black text-slate-950">{entry.playerName}</td>
                        <td className="px-4 py-3 text-right text-base font-black text-red-700">{entry.totalPoints}</td>
                        <td className="hidden px-4 py-3 text-right font-black text-slate-600 sm:table-cell">{entry.exactPicks}</td>
                        <td className="hidden px-4 py-3 text-right font-black text-slate-600 md:table-cell">{entry.correctWinners}</td>
                        <td className="hidden px-4 py-3 text-right text-xs font-bold text-slate-400 lg:table-cell">{entry.scoredPredictions}/{entry.totalPredictions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.leaderboard.length && (
                  <div className="p-8 text-center text-sm font-black text-slate-400">Sin picks todavía.</div>
                )}
              </div>
            )}

            {view === "fights" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.fights.map((fight) => (
                  <FightAdminCard
                    key={fight.id}
                    fight={fight}
                    isPatching={patchingId === fight.id}
                    onPatch={(patch) => void patchFight(fight.id, patch)}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}

function StatCard({
  icon,
  bg,
  label,
  value,
  valueClass,
  small,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: number | string;
  valueClass?: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", bg)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
        <p className={cn("truncate font-black text-slate-950", small ? "text-sm" : "text-xl", valueClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}

function FightAdminCard({
  fight,
  isPatching,
  onPatch,
}: {
  fight: AdminFight;
  isPatching: boolean;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className={cn(
      "rounded-xl border bg-white p-4 shadow-sm",
      fight.winnerCorner ? "border-emerald-200" : fight.closed ? "border-slate-200" : "border-amber-200"
    )}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400">#{fight.number}</span>
            <span className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-black",
              fight.liveStatus === "live" ? "bg-amber-100 text-amber-700"
              : fight.liveStatus === "finished" ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
            )}>
              {fight.liveStatus === "live" ? "🔴 LIVE" : fight.liveStatus === "finished" ? "✓ FIN" : "🕐 SCHED"}
            </span>
            {fight.titleFight && <span className="text-[10px] font-black text-amber-600">🏆 TITLE</span>}
          </div>
          <p className="mt-1 font-black text-slate-950">
            <span className="text-red-700">{fight.redCorner}</span> <span className="text-slate-400">vs</span> <span className="text-blue-700">{fight.blueCorner}</span>
          </p>
          <p className="text-xs font-bold text-slate-500">{fight.weightClass} · {fight.weightLbs} lbs</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400">{fight.predictorCount} picks</p>
          {fight.predictorCount > 0 && (
            <p className="text-[10px] text-slate-400">
              🔴{fight.redPicks} / 🔵{fight.bluePicks}
            </p>
          )}
        </div>
      </div>

      {isPatching ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="grid gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Ganador</label>
            <select
              value={fight.winnerCorner ?? ""}
              onChange={(e) => onPatch({ winnerCorner: e.target.value || null })}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-black text-slate-950 outline-none focus:border-slate-950"
            >
              {CORNER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Método</label>
            <select
              value={fight.method ?? ""}
              onChange={(e) => onPatch({ method: e.target.value || null })}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-black text-slate-950 outline-none focus:border-slate-950"
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Round</label>
              <input
                type="number"
                min={1}
                max={5}
                value={fight.endRound ?? ""}
                onChange={(e) => onPatch({ endRound: e.target.value ? Number(e.target.value) : null })}
                placeholder="—"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-black outline-none focus:border-slate-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Tiempo</label>
              <input
                type="text"
                value={fight.endTime ?? ""}
                onChange={(e) => onPatch({ endTime: e.target.value || null })}
                placeholder="4:32"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-black outline-none focus:border-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Estado live</label>
            <select
              value={fight.liveStatus}
              onChange={(e) => onPatch({ liveStatus: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-black text-slate-950 outline-none focus:border-slate-950"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase text-slate-500">Nota live</label>
            <input
              type="text"
              value={fight.liveNote}
              onChange={(e) => onPatch({ liveNote: e.target.value })}
              placeholder="Nota para mostrar en vivo..."
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`force-${fight.id}`}
              checked={fight.forceClosed}
              onChange={(e) => onPatch({ forceClosed: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-red-600"
            />
            <label htmlFor={`force-${fight.id}`} className="text-xs font-black text-slate-600 cursor-pointer">
              Forzar cierre
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
