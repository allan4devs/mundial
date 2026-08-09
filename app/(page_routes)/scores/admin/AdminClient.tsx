"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, RefreshCw, Save, CloudDownload } from "lucide-react";
import type { CompetitionInfo, LeaderboardEntry, ScoreMatch } from "../types";
import { cn, formatKickoff, liveLabel, matchStatus } from "../utils";

type AdminData = {
  competitions: CompetitionInfo[];
  matches: ScoreMatch[];
  predictionCount: number;
  leaderboard: LeaderboardEntry[];
};

const ADMIN_API = "/api/scores/admin";
const MATCH_API = "/api/scores/admin/match";
const SYNC_API = "/api/scores/admin/sync";

export default function AdminClient() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [sourceId, setSourceId] = useState("fcl");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [kickoffAt, setKickoffAt] = useState("");
  const [venue, setVenue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(ADMIN_API, { cache: "no-store", credentials: "same-origin" });
      if (res.status === 401) {
        throw new Error("No autorizado. Entra como admin de la plataforma (cookie admin JWT) y recarga.");
      }
      if (!res.ok) throw new Error("fail");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const matches = useMemo(() => {
    const list = data?.matches ?? [];
    if (filter === "all") return list;
    if (filter === "live") return list.filter((m) => m.liveStatus === "live" || m.liveStatus === "halftime");
    return list.filter((m) => m.competitionId === filter || m.sourceId === filter);
  }, [data, filter]);

  async function patch(matchId: string, body: Record<string, unknown>) {
    setBusyId(matchId);
    setMsg("");
    setError("");
    try {
      const res = await fetch(MATCH_API, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, ...body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Error");
      setMsg("Actualizado.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setBusyId(null);
    }
  }

  async function createMatch() {
    setBusyId("create");
    setError("");
    setMsg("");
    try {
      const res = await fetch(MATCH_API, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: sourceId,
          homeTeam,
          awayTeam,
          kickoffAt: kickoffAt ? new Date(kickoffAt).toISOString() : "",
          venue,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Error al crear");
      setMsg(`Creado: ${j.id}`);
      setHomeTeam("");
      setAwayTeam("");
      setKickoffAt("");
      setVenue("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusyId(null);
    }
  }

  async function syncComp(competitionId: string) {
    setBusyId(`sync-${competitionId}`);
    setError("");
    setMsg("");
    try {
      const res = await fetch(SYNC_API, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Sync fallido");
      setMsg(`Sync ${competitionId}: ${j.upserted ?? 0} fixtures (${j.provider})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050a08] text-white">
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/scores" className="rounded-lg border border-white/15 p-2 text-white/70">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9dff34]/80">Admin</p>
              <h1 className="text-lg font-black">Scores · Mongo go</h1>
            </div>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-lg border border-white/15 p-2">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-5">
        {error ? <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm">{error}</p> : null}
        {msg ? <p className="rounded-lg border border-[#9dff34]/30 bg-[#10240b] px-3 py-2 text-sm text-[#d5ff3f]">{msg}</p> : null}

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="mb-3 text-sm font-black">Competitions / sync</h2>
          <div className="flex flex-wrap gap-2">
            {(data?.competitions ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={busyId === `sync-${c.id}`}
                onClick={() => void syncComp(c.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold"
              >
                <CloudDownload className="h-3.5 w-3.5" />
                {c.name}
                <span className="text-white/40">({c.syncHealth || "—"})</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black">
            <Plus className="h-4 w-4" /> Nuevo partido
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            >
              {(data?.competitions ?? [{ id: "fcl", name: "FCL" }]).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={kickoffAt}
              onChange={(e) => setKickoffAt(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              placeholder="Local"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              placeholder="Visita"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              placeholder="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <button
            type="button"
            disabled={busyId === "create" || !homeTeam || !awayTeam || !kickoffAt}
            onClick={() => void createMatch()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#9dff34] px-4 py-2 text-sm font-black text-black disabled:opacity-40"
          >
            {busyId === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Crear
          </button>
        </section>

        <div className="flex flex-wrap gap-1.5">
          {[{ id: "all", label: "Todos" }, { id: "live", label: "Live" }, ...(data?.competitions ?? []).map((s) => ({ id: s.id, label: s.name }))].map(
            (f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-bold",
                  filter === f.id ? "border-[#9dff34]/50 bg-[#9dff34]/15 text-[#d5ff3f]" : "border-white/10 text-white/55"
                )}
              >
                {f.label}
              </button>
            )
          )}
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#9dff34]" />
          </div>
        ) : (
          <div className="grid gap-3">
            {matches.map((m) => (
              <MatchAdminRow key={m.id} match={m} busy={busyId === m.id} onPatch={(body) => void patch(m.id, body)} />
            ))}
            {matches.length === 0 ? <p className="text-center text-sm text-white/45">Sin partidos.</p> : null}
          </div>
        )}

        {data?.leaderboard?.length ? (
          <section className="rounded-xl border border-white/10 bg-black/30 p-4">
            <h2 className="text-sm font-black">Leaderboard · {data.predictionCount} picks</h2>
            <ol className="mt-3 space-y-1.5">
              {data.leaderboard.slice(0, 15).map((row, i) => (
                <li key={row.userId || row.playerName} className="flex justify-between text-sm">
                  <span>
                    {i + 1}. {row.playerName}
                  </span>
                  <span className="font-black text-[#d5ff3f]">{row.totalPoints} pts</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function MatchAdminRow({
  match,
  busy,
  onPatch,
}: {
  match: ScoreMatch;
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => void;
}) {
  const [homeLive, setHomeLive] = useState(String(match.homeLiveScore ?? match.homeScore ?? 0));
  const [awayLive, setAwayLive] = useState(String(match.awayLiveScore ?? match.awayScore ?? 0));
  const [minute, setMinute] = useState(String(match.liveMinute ?? ""));

  useEffect(() => {
    setHomeLive(String(match.homeLiveScore ?? match.homeScore ?? 0));
    setAwayLive(String(match.awayLiveScore ?? match.awayScore ?? 0));
    setMinute(String(match.liveMinute ?? ""));
  }, [match]);

  const st = matchStatus(match);

  return (
    <article className="rounded-xl border border-white/10 bg-[#071018] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-white/45">
            {match.league} · {match.competitionId || match.sourceId} · #{match.number}
          </p>
          <p className="font-black">
            {match.homeTeam} vs {match.awayTeam}
          </p>
          <p className="text-xs text-white/50">{formatKickoff(match.startsAt || match.kickoffAt)}</p>
        </div>
        <span className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-black">{liveLabel(st)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-white/50">
          Local
          <input
            value={homeLive}
            onChange={(e) => setHomeLive(e.target.value)}
            className="mt-1 block w-16 rounded border border-white/15 bg-black/40 px-2 py-1.5 text-center font-black"
          />
        </label>
        <label className="text-xs text-white/50">
          Visita
          <input
            value={awayLive}
            onChange={(e) => setAwayLive(e.target.value)}
            className="mt-1 block w-16 rounded border border-white/15 bg-black/40 px-2 py-1.5 text-center font-black"
          />
        </label>
        <label className="text-xs text-white/50">
          Min
          <input
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="mt-1 block w-14 rounded border border-white/15 bg-black/40 px-2 py-1.5 text-center"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onPatch({
              homeLiveScore: Number(homeLive) || 0,
              awayLiveScore: Number(awayLive) || 0,
              liveMinute: minute === "" ? null : Number(minute),
            })
          }
          className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Score live
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(["scheduled", "live", "halftime", "finished", "postponed", "cancelled"] as const).map((status) => (
          <button
            key={status}
            type="button"
            disabled={busy}
            onClick={() => onPatch({ status })}
            className={cn(
              "rounded-md border px-2 py-1 text-[10px] font-black uppercase",
              st === status ? "border-[#9dff34]/50 bg-[#9dff34]/15 text-[#d5ff3f]" : "border-white/10 text-white/50"
            )}
          >
            {status}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            onPatch({
              homeScore: Number(homeLive) || 0,
              awayScore: Number(awayLive) || 0,
              status: "finished",
              forceClosed: true,
            })
          }
          className="rounded-md border border-amber-400/40 px-2 py-1 text-[10px] font-black text-amber-200"
        >
          Cerrar + final
        </button>
      </div>
    </article>
  );
}
