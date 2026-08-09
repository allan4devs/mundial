"use client";

import { useMemo, useState } from "react";
import { Crown, Search, Trophy } from "lucide-react";
import type { AdminPremiumPlayer, AdminPremiumPrediction } from "../adminTypes";
import { cn } from "../../utils";

type Props = {
  players: AdminPremiumPlayer[];
  predictions: AdminPremiumPrediction[];
};

const STAGE_LABELS: Record<string, string> = {
  round16: "Octavos",
  quarterfinal: "Cuartos",
  semifinal: "Semis",
  thirdPlace: "Tercer Lugar",
  final: "Final",
};

const TOTAL_PICKS = 16;

export function AdminPremiumPredictionsPanel({ players, predictions }: Props) {
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(players[0]?.playerKey ?? null);

  const filteredPlayers = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return players;
    return players.filter((player) =>
      player.playerName.toUpperCase().includes(q) ||
      player.playerKey.toUpperCase().includes(q) ||
      (player.payer ?? "").toUpperCase().includes(q)
    );
  }, [players, query]);

  const selectedPlayer = players.find((player) => player.playerKey === selectedKey) ?? filteredPlayers[0] ?? null;
  const selectedPredictions = selectedPlayer
    ? predictions
        .filter((prediction) => prediction.playerKey === selectedPlayer.playerKey)
        .sort((a, b) => stageOrder(a.stage) - stageOrder(b.stage) || a.slot - b.slot)
    : [];

  const totalRevenue = players.reduce((sum, player) => sum + (player.amountPaid ?? 0), 0);
  const completedPlayers = players.filter((player) => player.completedCount >= TOTAL_PICKS).length;

  if (!players.length) {
    return (
      <section className="grid min-h-56 place-items-center rounded-xl border border-dashed border-[#f0b429]/30 bg-black/35 p-8 text-center">
        <div>
          <Crown className="mx-auto h-10 w-10 text-[#f0b429]" />
          <p className="mt-3 text-sm font-black text-white/65">Todavia no hay compras premium.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Compras" value={players.length} />
          <Stat label="Completos" value={completedPlayers} />
          <Stat label="Ingresos" value={`$${totalRevenue.toFixed(0)}`} />
        </div>

        <label className="flex h-10 items-center gap-2 rounded-xl border border-white/12 bg-black/35 px-3">
          <Search className="h-4 w-4 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador, correo..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
          />
        </label>

        <div className="overflow-hidden rounded-xl border border-white/12 bg-black/35">
          {filteredPlayers.map((player) => {
            const selected = selectedPlayer?.playerKey === player.playerKey;
            const pct = Math.round((player.completedCount / TOTAL_PICKS) * 100);
            return (
              <button
                key={player.playerKey}
                type="button"
                onClick={() => setSelectedKey(player.playerKey)}
                className={cn(
                  "block w-full border-b border-white/10 px-4 py-3 text-left transition last:border-0",
                  selected ? "bg-[#d5ff3f] text-[#06110b]" : "text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{player.playerName}</p>
                    <p className={cn("mt-0.5 truncate text-[11px] font-bold", selected ? "text-[#06110b]/60" : "text-white/40")}>
                      {player.payer ?? player.playerKey}
                    </p>
                  </div>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums", selected ? "bg-[#06110b]/15" : "bg-white/10 text-white/60")}>
                    {player.completedCount}/{TOTAL_PICKS}
                  </span>
                </div>
                <div className={cn("mt-2 h-1.5 overflow-hidden rounded-full", selected ? "bg-[#06110b]/15" : "bg-white/10")}>
                  <div className={cn("h-full rounded-full", selected ? "bg-[#06110b]" : "bg-[#d5ff3f]")} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-white/12 bg-[#06140f] shadow-[0_18px_58px_rgba(0,0,0,0.2)]">
        {selectedPlayer ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 bg-black/30 px-4 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#d5ff3f]">Premium Final</p>
                <h2 className="mt-1 truncate text-xl font-black text-white">{selectedPlayer.playerName}</h2>
                <p className="mt-1 text-xs font-bold text-white/45">
                  Pago {selectedPlayer.amountPaid !== null ? `$${selectedPlayer.amountPaid} ${selectedPlayer.currency}` : "registrado"}
                  {selectedPlayer.paidAt ? ` - ${new Date(selectedPlayer.paidAt).toLocaleDateString("es-CR")}` : ""}
                </p>
              </div>
              <div className="rounded-xl border border-[#f0b429]/25 bg-[#211707]/70 px-3 py-2 text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#f0b429]">Progreso</p>
                <p className="text-lg font-black tabular-nums text-white">{selectedPlayer.completedCount}/{TOTAL_PICKS}</p>
              </div>
            </div>

            <div className="grid gap-3 p-3">
              {selectedPredictions.length ? (
                selectedPredictions.map((prediction) => (
                  <PredictionCard key={prediction.id} prediction={prediction} />
                ))
              ) : (
                <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/12 bg-black/35 p-6 text-center">
                  <p className="text-sm font-black text-white/50">Este jugador pago, pero aun no guardo predicciones finales.</p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function PredictionCard({ prediction }: { prediction: AdminPremiumPrediction }) {
  const winnerLabel =
    prediction.winner === "teamA" ? prediction.teamA :
    prediction.winner === "teamB" ? prediction.teamB :
    "Pendiente";
  const complete = Boolean(prediction.teamA && prediction.teamB && prediction.scoreA !== null && prediction.scoreB !== null && prediction.winner);

  return (
    <article className={cn(
      "rounded-xl border p-3",
      complete ? "border-[#9dff34]/25 bg-[#10240b]/60" : "border-white/10 bg-black/30"
    )}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-white/12 bg-black/35 px-2 py-1 text-[11px] font-black text-white/55">
          {STAGE_LABELS[prediction.stage] ?? prediction.stage} #{prediction.slot}
        </span>
        <span className={cn("rounded-md px-2 py-1 text-[11px] font-black", complete ? "bg-[#9dff34]/15 text-[#d5ff3f]" : "bg-white/10 text-white/45")}>
          {complete ? "Completo" : "Pendiente"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
        <TeamPick name={prediction.teamA || "Equipo A"} score={prediction.scoreA} active={prediction.winner === "teamA"} />
        <span className="text-center text-xs font-black text-white/30">VS</span>
        <TeamPick name={prediction.teamB || "Equipo B"} score={prediction.scoreB} active={prediction.winner === "teamB"} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/45">
        <span>Clasifica: <b className="text-white">{winnerLabel}</b></span>
        {prediction.confidence !== null && <span>Confianza: <b className="text-[#f0b429]">{prediction.confidence}/5</b></span>}
        {prediction.updatedAt && <span>Actualizado: {new Date(prediction.updatedAt).toLocaleString("es-CR")}</span>}
      </div>
      {prediction.note && <p className="mt-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-white/60">{prediction.note}</p>}
    </article>
  );
}

function TeamPick({ name, score, active }: { name: string; score: number | null; active: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-lg border px-3 py-2", active ? "border-[#d5ff3f]/40 bg-[#d5ff3f]/10" : "border-white/10 bg-black/25")}>
      <span className={cn("min-w-0 truncate text-sm font-black", active ? "text-[#d5ff3f]" : "text-white")}>{name}</span>
      <span className="text-lg font-black tabular-nums text-white">{score ?? "-"}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/12 bg-black/35 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-0.5 truncate text-lg font-black text-white">{value}</p>
    </div>
  );
}

function stageOrder(stage: string) {
  return ["round16", "quarterfinal", "semifinal", "thirdPlace", "final"].indexOf(stage);
}
