import { Activity, BarChart3, Clock3, LogIn, Save, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AdminAnalyticsEvent, AdminAnalyticsEventName, AdminAnalyticsSummary } from "../adminTypes";
import { cn } from "../../utils";

type AnalyticsFilter = "all" | AdminAnalyticsEventName;

type Props = {
  summary: AdminAnalyticsSummary;
  events: AdminAnalyticsEvent[];
};

const FILTERS: Array<{ id: AnalyticsFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "login", label: "Logins" },
  { id: "pick_saved", label: "Picks" },
  { id: "stat_bet_saved", label: "Apuestas" },
];

function metadataText(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleString("es-CR", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventLabel(event: AdminAnalyticsEventName) {
  if (event === "login") return "Login";
  if (event === "pick_saved") return "Pick";
  return "Apuesta";
}

function eventClass(event: AdminAnalyticsEventName) {
  if (event === "login") return "border-[#62ffe6]/35 bg-[#071d2a] text-[#62ffe6]";
  if (event === "pick_saved") return "border-[#9dff34]/35 bg-[#10240b] text-[#d5ff3f]";
  return "border-[#d5ff3f]/35 bg-[#10240b] text-[#d5ff3f]";
}

function eventIcon(event: AdminAnalyticsEventName) {
  if (event === "login") return <LogIn className="h-3.5 w-3.5" />;
  if (event === "pick_saved") return <Save className="h-3.5 w-3.5" />;
  return <BarChart3 className="h-3.5 w-3.5" />;
}

function eventDetail(event: AdminAnalyticsEvent) {
  const { metadata } = event;

  if (event.event === "login") {
    const method = metadataText(metadata, "loginMethod");
    return method === "pin_created" ? "Creo PIN y entro" : "Entro con PIN";
  }

  if (event.event === "pick_saved") {
    const matchNumber = metadataText(metadata, "matchNumber");
    const matchLabel = metadataText(metadata, "matchLabel");
    const homeScore = metadataText(metadata, "homeScore");
    const awayScore = metadataText(metadata, "awayScore");
    const action = metadataText(metadata, "action");
    const score = homeScore && awayScore ? `${homeScore}-${awayScore}` : "";
    return [`#${matchNumber}`, matchLabel, score, action].filter(Boolean).join(" / ");
  }

  const matchNumber = metadataText(metadata, "matchNumber");
  const question = metadataText(metadata, "questionText");
  const option = metadataText(metadata, "optionText");
  return [`#${matchNumber}`, question, option].filter(Boolean).join(" / ");
}

export function AdminAnalyticsPanel({ summary, events }: Props) {
  const [filter, setFilter] = useState<AnalyticsFilter>("all");

  const filteredEvents = useMemo(
    () => events.filter((event) => filter === "all" || event.event === filter),
    [events, filter]
  );

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-5">
        <SummaryCard label="Eventos" value={summary.totalEvents} icon={<Activity className="h-4 w-4" />} tone="slate" />
        <SummaryCard label="Logins" value={summary.logins} icon={<LogIn className="h-4 w-4" />} tone="sky" />
        <SummaryCard label="Picks" value={summary.picksSaved} icon={<Save className="h-4 w-4" />} tone="emerald" />
        <SummaryCard label="Apuestas" value={summary.statBetsSaved} icon={<BarChart3 className="h-4 w-4" />} tone="purple" />
        <SummaryCard label="Jugadores" value={summary.uniquePlayers} icon={<Users className="h-4 w-4" />} tone="amber" />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/12 bg-black/35 shadow-[0_18px_58px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-3 border-b border-white/12 bg-black/35 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-black text-white">Analytics Mundial</h2>
            <p className="mt-1 text-xs font-bold text-white/50">Ultimos {events.length} eventos guardados en Mongo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={cn(
                  "h-8 rounded-lg border px-3 text-xs font-black transition",
                  filter === option.id
                    ? "border-[#d5ff3f]/60 bg-[#d5ff3f] text-[#06110b]"
                    : "border-white/12 bg-white/5 text-white/55 hover:border-[#d5ff3f]/40 hover:bg-[#12351f] hover:text-white"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/12 bg-black/35 text-xs">
                  <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-white/40">Fecha</th>
                  <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-white/40">Evento</th>
                  <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-white/40">Jugador</th>
                  <th className="px-3 py-3 text-left font-black uppercase tracking-wide text-white/40">Detalle</th>
                  <th className="hidden px-3 py-3 text-left font-black uppercase tracking-wide text-white/40 lg:table-cell">Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-white/5">
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(event.happenedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-black", eventClass(event.event))}>
                        {eventIcon(event.event)}
                        {eventLabel(event.event)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="min-w-0">
                        <p className="font-black text-white">{event.playerName || event.normalizedName || "Sin jugador"}</p>
                        <p className="text-[11px] font-bold text-white/40">{event.normalizedName}</p>
                      </div>
                    </td>
                    <td className="min-w-[18rem] px-3 py-3">
                      <p className="line-clamp-2 font-bold text-white/70">{eventDetail(event) || "-"}</p>
                    </td>
                    <td className="hidden min-w-[16rem] px-3 py-3 lg:table-cell">
                      <p className="text-xs font-bold text-white/50">
                        {[event.request.country, event.request.region, event.request.city].filter(Boolean).join(" / ") || "Sin ubicacion"}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-[11px] font-bold text-white/40">{event.request.userAgent || "-"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center p-8 text-center">
            <div>
              <Activity className="mx-auto h-10 w-10 text-white/25" />
              <p className="mt-3 text-sm font-black text-white/65">No hay eventos para este filtro.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "slate" | "sky" | "emerald" | "purple" | "amber";
}) {
  const toneClass =
    tone === "sky"
      ? "bg-[#071d2a] text-[#62ffe6]"
      : tone === "emerald"
        ? "bg-[#10240b] text-[#d5ff3f]"
        : tone === "purple"
          ? "bg-[#10240b] text-[#d5ff3f]"
          : tone === "amber"
            ? "bg-[#211707] text-[#f0b429]"
            : "bg-white/10 text-white/70";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-black/35 px-4 py-3 shadow-[0_16px_46px_rgba(0,0,0,0.18)]">
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", toneClass)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-white/40">{label}</p>
        <p className="text-xl font-black tabular-nums text-white">{value}</p>
      </div>
    </div>
  );
}
