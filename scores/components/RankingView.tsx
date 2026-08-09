"use client";

import { useEffect, useState } from "react";
import type { CompetitionInfo, LeaderboardEntry } from "../types";
import { cn, fetchWithTimeout } from "../utils";

type Props = {
  leaderboard: LeaderboardEntry[];
  competitions: CompetitionInfo[];
};

type Period = "all" | "week" | "month";

export function RankingView({ leaderboard: initial, competitions }: Props) {
  const [period, setPeriod] = useState<Period>("all");
  const [sport, setSport] = useState("all");
  const [competitionId, setCompetitionId] = useState("all");
  const [rows, setRows] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (period === "all" && sport === "all" && competitionId === "all") {
        setRows(initial);
        return;
      }
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (period !== "all") q.set("period", period);
        if (sport !== "all") q.set("sport", sport);
        if (competitionId !== "all") q.set("competitionId", competitionId);
        const res = await fetchWithTimeout(`/api/scores/leaderboard?${q}`, { cache: "no-store" });
        if (!res.ok) throw new Error("lb");
        const data = await res.json();
        if (!cancelled) setRows(data.leaderboard ?? []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [period, sport, competitionId, initial]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {([
          ["all", "Todo"],
          ["week", "7d"],
          ["month", "30d"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPeriod(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              period === id ? "border-[#9dff34]/50 text-[#d5ff3f]" : "border-white/10 text-white/55"
            )}
          >
            {label}
          </button>
        ))}
        {(["all", "football", "basketball"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSport(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold",
              sport === id ? "border-cyan-400/40 text-cyan-200" : "border-white/10 text-white/55"
            )}
          >
            {id === "all" ? "Deporte" : id}
          </button>
        ))}
        <select
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-xs font-bold text-white/80"
        >
          <option value="all">Liga</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-sm text-white/45">Cargando ranking…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center text-white/50">
          Ranking vacio para este filtro.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase text-white/40">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Jugador</th>
                <th className="px-3 py-2 text-right">Pts</th>
                <th className="hidden px-3 py-2 text-right sm:table-cell">Exactos</th>
                <th className="hidden px-3 py-2 text-right sm:table-cell">Picks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.userId || row.playerName} className="border-b border-white/5">
                  <td className="px-3 py-2 font-black text-white/40">{i + 1}</td>
                  <td className="px-3 py-2 font-bold">{row.playerName}</td>
                  <td className="px-3 py-2 text-right font-black text-[#d5ff3f]">{row.totalPoints}</td>
                  <td className="hidden px-3 py-2 text-right text-white/60 sm:table-cell">{row.exactScores}</td>
                  <td className="hidden px-3 py-2 text-right text-white/60 sm:table-cell">{row.totalPredictions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
