"use client";

import { CalendarDays, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { MundialMatch } from "../types";
import {
  cn,
  isSameMatchDayInCR,
  isMatchClosed,
  isMatchLive,
  kickoffMs,
  liveStatusLabel,
} from "../utils";
import { Flag } from "./Flag";

type SelectorTab = "live" | "today" | "upcoming";

type MatchSelectorProps = {
  matches: MundialMatch[];
  nowMs: number;
  activeMatchId: string | null;
  selectedMatchId: string | null;
  onSelectMatch: (match: MundialMatch) => void;
};

export function MatchSelector({
  matches,
  nowMs,
  activeMatchId,
  selectedMatchId,
  onSelectMatch,
}: MatchSelectorProps) {
  const sorted = useMemo(
    () => [...matches].sort((a, b) => kickoffMs(a) - kickoffMs(b) || a.number - b.number),
    [matches]
  );

  const liveMatches = useMemo(() => sorted.filter(isMatchLive), [sorted]);

  const todayMatches = useMemo(
    () => sorted.filter((m) => nowMs > 0 && isSameMatchDayInCR(kickoffMs(m), nowMs)),
    [sorted, nowMs]
  );

  const upcomingMatches = useMemo(
    () =>
      sorted.filter(
        (m) => !isMatchClosed(m, nowMs) && !(nowMs > 0 && isSameMatchDayInCR(kickoffMs(m), nowMs))
      ),
    [sorted, nowMs]
  );

  const defaultTab: SelectorTab =
    liveMatches.length > 0 ? "live" : todayMatches.length > 0 ? "today" : "upcoming";
  const [tab, setTab] = useState<SelectorTab | null>(null);
  const effectiveTab = tab ?? defaultTab;

  const upcomingByDate = useMemo(() => {
    const groups: Array<{ label: string; dateKey: string; matches: MundialMatch[] }> = [];
    for (const m of upcomingMatches) {
      const ms = kickoffMs(m);
      const dateKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Costa_Rica",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(ms);
      const label = new Intl.DateTimeFormat("es-CR", {
        timeZone: "America/Costa_Rica",
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(ms);
      let group = groups.find((g) => g.dateKey === dateKey);
      if (!group) {
        group = { label, dateKey, matches: [] };
        groups.push(group);
      }
      group.matches.push(m);
    }
    return groups;
  }, [upcomingMatches]);

  const tabMatches = effectiveTab === "live" ? liveMatches : effectiveTab === "today" ? todayMatches : [];

  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedMatchId || selectedMatchId === prevSelectedIdRef.current) return;
    prevSelectedIdRef.current = selectedMatchId;
    requestAnimationFrame(() => {
      document.getElementById(`selector-match-${selectedMatchId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
  }, [selectedMatchId]);

  return (
    <div className="overflow-hidden rounded-lg border border-[#f0b429]/20 bg-[#06140f] shadow-[0_4px_20px_rgba(0,0,0,0.22)]">
      <div className="flex border-b border-white/10 bg-black/40">
        <TabButton
          active={effectiveTab === "live"}
          onClick={() => setTab("live")}
          label="Live"
          count={liveMatches.length}
          live
        />
        <TabButton
          active={effectiveTab === "today"}
          onClick={() => setTab("today")}
          label="Hoy"
          count={todayMatches.length}
          icon={<CalendarDays className="h-3 w-3" />}
        />
        <TabButton
          active={effectiveTab === "upcoming"}
          onClick={() => setTab("upcoming")}
          label="Próximos"
          count={upcomingMatches.length}
          icon={<Timer className="h-3 w-3" />}
        />
      </div>

      <div className="p-3">
        {effectiveTab !== "upcoming" ? (
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {tabMatches.map((m) => (
              <CompactMatchCard
                key={m.id}
                match={m}
                nowMs={nowMs}
                selected={selectedMatchId === m.id}
                active={m.id === activeMatchId}
                onClick={() => onSelectMatch(m)}
              />
            ))}
            {tabMatches.length === 0 && (
              <p className="py-4 text-sm font-bold text-white/40 min-[420px]:col-span-2">
                {effectiveTab === "live" ? "No hay partido en vivo ahora." : "No hay partidos hoy."}
              </p>
            )}
          </div>
        ) : (
          <div className="max-h-[44vh] space-y-4 overflow-y-auto pr-0.5">
            {upcomingByDate.map((group) => (
              <div key={group.dateKey}>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#f0b429]">
                  {group.label}
                </p>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {group.matches.map((m) => (
                    <CompactMatchCard
                      key={m.id}
                      match={m}
                      nowMs={nowMs}
                      selected={selectedMatchId === m.id}
                      active={m.id === activeMatchId}
                      onClick={() => onSelectMatch(m)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {upcomingByDate.length === 0 && (
              <p className="py-3 text-sm font-bold text-white/50">No hay más partidos pendientes.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  live,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  live?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-1 px-1.5 py-3 text-[10px] font-black uppercase tracking-wide transition-all min-[380px]:gap-1.5 min-[380px]:px-2 min-[380px]:text-[11px]",
        active
          ? live
            ? "bg-[#9dff34]/8 text-[#9dff34]"
            : "bg-[#f0b429]/8 text-[#f0b429]"
          : "text-white/40 hover:text-white/65"
      )}
    >
      {active && (
        <span
          className={cn(
            "absolute bottom-0 left-0 right-0 h-[2px]",
            live ? "bg-[#9dff34]" : "bg-[#f0b429]"
          )}
        />
      )}
      {live ? (
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            count > 0
              ? "animate-pulse bg-[#9dff34] shadow-[0_0_8px_rgba(157,255,52,0.9)]"
              : "bg-white/25"
          )}
        />
      ) : (
        icon && <span className="shrink-0 opacity-75">{icon}</span>
      )}
      <span>{label}</span>
      <span
        className={cn(
          "rounded px-1 py-0.5 text-[10px] tabular-nums",
          active
            ? live
              ? "bg-[#9dff34]/20 text-[#9dff34]"
              : "bg-[#f0b429]/20 text-[#f0b429]"
            : "bg-black/40 text-white/35"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CompactMatchCard({
  match,
  nowMs,
  selected,
  active,
  onClick,
}: {
  match: MundialMatch;
  nowMs: number;
  selected: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const live = isMatchLive(match);
  const closed = isMatchClosed(match, nowMs);

  const centerDisplay = live
    ? `${match.homeLiveScore ?? 0}-${match.awayLiveScore ?? 0}`
    : closed && match.homeFinalScore !== null
      ? `${match.homeFinalScore}-${match.awayFinalScore}`
      : formatTime(match.kickoffAt);

  const statusColor = live
    ? "text-[#9dff34]"
    : closed
      ? "text-[#ffb15f]"
      : active
        ? "text-[#f0b429]"
        : "text-white/40";

  const statusLabel = live
    ? liveStatusLabel(match)
    : closed
      ? "FT"
      : active
        ? "Abierto"
        : match.group
          ? `G ${match.group}`
          : (match.stageLabel?.slice(0, 6) ?? "");

  return (
    <button
      type="button"
      id={`selector-match-${match.id}`}
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-lg border p-2 text-left transition-all active:scale-95 min-[420px]:p-2.5",
        selected
          ? live
            ? "border-[#9dff34] bg-[#0d2209] shadow-[0_0_22px_rgba(157,255,52,0.22)]"
            : "border-[#f0b429] bg-[#1f2a0b] shadow-[0_0_22px_rgba(240,180,41,0.28)]"
          : live
            ? "border-[#9dff34]/40 bg-[#10240b] hover:border-[#9dff34]/70"
            : active
              ? "border-[#f0b429]/50 bg-[#1a2206] hover:border-[#f0b429]/80"
              : closed
                ? "border-white/8 bg-black/20 opacity-55"
                : "border-white/10 bg-black/35 hover:border-[#f0b429]/50 hover:bg-black/50"
      )}
    >
      {/* Top selection bar */}
      {selected && (
        <span
          className={cn(
            "absolute left-0 right-0 top-0 h-[3px] rounded-t-lg",
            live ? "bg-[#9dff34]" : "bg-[#f0b429]"
          )}
        />
      )}

      {/* Status row */}
      <div className="mb-2 flex items-center gap-1">
        {live && (
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#9dff34] shadow-[0_0_6px_rgba(157,255,52,0.9)]" />
        )}
        <span className={cn("truncate text-[9px] font-black uppercase tracking-wide", statusColor)}>
          {statusLabel}
        </span>
        {selected && !live && (
          <span className="ml-auto shrink-0 text-[8px] font-black uppercase tracking-widest text-white/40">
            viendo
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
        <div className="flex min-w-0 flex-col items-center gap-1">
          <Flag team={match.homeTeam} size="xs" />
          <span className="w-full truncate text-center text-[9px] font-black uppercase leading-tight text-white">
            {match.homeTeam}
          </span>
        </div>

        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-1 text-center text-xs font-black tabular-nums leading-none",
            live
              ? "bg-[#9dff34]/15 text-[#9dff34]"
              : closed
                ? "bg-[#ffb15f]/10 text-[#ffb15f]/75"
                : "bg-black/40 text-white/55"
          )}
        >
          {centerDisplay}
        </span>

        <div className="flex min-w-0 flex-col items-center gap-1">
          <Flag team={match.awayTeam} size="xs" />
          <span className="w-full truncate text-center text-[9px] font-black uppercase leading-tight text-white">
            {match.awayTeam}
          </span>
        </div>
      </div>
    </button>
  );
}

function formatTime(kickoffAt: string) {
  const d = new Date(kickoffAt);
  if (Number.isNaN(d.getTime())) return "?:??";
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
