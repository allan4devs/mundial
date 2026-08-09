import { CalendarDays, Flame, History, ListChecks, Lock, Target } from "lucide-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { TOTAL_MATCHES } from "../constants";
import type { Draft, MundialMatch } from "../types";
import { cn, emptyDraft, isMatchClosed, isMatchLive, kickoffMs } from "../utils";
import { MatchCard } from "./MatchCard";

type MineViewProps = {
  savedCount: number;
  lockedCount: number;
  mineMatches: MundialMatch[];
  drafts: Record<string, Draft>;
  savingId: string | null;
  isSavingBulk: boolean;
  todayEditableMatchIds: Set<string>;
  nowMs: number;
  focusMatchId: string | null;
  onUpdateDraft: (matchId: string, patch: Partial<Draft>) => void;
  onSave: (match: MundialMatch) => Promise<void>;
};

type MatchSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  matches: MundialMatch[];
  tone: "today" | "upcoming" | "recent";
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function MineView({
  savedCount,
  lockedCount,
  mineMatches,
  drafts,
  savingId,
  isSavingBulk,
  todayEditableMatchIds,
  nowMs,
  focusMatchId,
  onUpdateDraft,
  onSave,
}: MineViewProps) {
  const lastScrolledFocusIdRef = useRef<string | null>(null);
  const pct = Math.round((savedCount / TOTAL_MATCHES) * 100);
  const sections = useMemo(() => {
    const clockMs = nowMs > 0 ? nowMs : (typeof window !== "undefined" ? Date.now() : 0);
    const todayKey = crDateKey(clockMs);
    const tomorrowKey = crDateKey(clockMs + DAY_MS);
    const openMatches = [...mineMatches]
      .filter((match) => !isMatchClosed(match, clockMs))
      .sort((a, b) => compareUpcomingMatches(a, b, drafts, todayEditableMatchIds, clockMs));
    const recentMatches = [...mineMatches]
      .filter((match) => isMatchClosed(match, clockMs))
      .sort((a, b) => kickoffMs(b) - kickoffMs(a) || b.number - a.number);

    const nextSections: MatchSection[] = [];
    const matchesByDate = new Map<string, MundialMatch[]>();

    for (const match of openMatches) {
      const key = crDateKey(kickoffMs(match));
      matchesByDate.set(key, [...(matchesByDate.get(key) ?? []), match]);
    }

    for (const [dateKey, matches] of matchesByDate) {
      nextSections.push({
        id: `date-${dateKey}`,
        eyebrow: dateKey === todayKey ? "Primero" : "Por dia",
        title: daySectionTitle(dateKey, todayKey, tomorrowKey),
        description: daySectionDescription(dateKey, todayKey, tomorrowKey, matches),
        matches,
        tone: dateKey === todayKey ? "today" : "upcoming",
      });
    }

    if (recentMatches.length) {
      nextSections.push({
        id: "recent",
        eyebrow: "Cerrados",
        title: "Recientes",
        description: "Tus picks ya cerrados, del mas nuevo al mas viejo.",
        matches: recentMatches,
        tone: "recent",
      });
    }

    return nextSections;
  }, [drafts, mineMatches, nowMs, todayEditableMatchIds]);

  useEffect(() => {
    if (!focusMatchId) {
      lastScrolledFocusIdRef.current = null;
      return;
    }
    if (lastScrolledFocusIdRef.current === focusMatchId) return;
    lastScrolledFocusIdRef.current = focusMatchId;

    const id = window.setTimeout(() => {
      document.getElementById(`mine-match-${focusMatchId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
    return () => window.clearTimeout(id);
  }, [focusMatchId]);

  return (
    <section className="grid gap-4">
      <div className="relative overflow-hidden rounded-xl border border-[#f0b429]/30 bg-[#06140f] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(90deg,rgba(240,180,41,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="relative border-b border-white/12 bg-black/35 px-3 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-2 min-[380px]:gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#f0b429]/40 bg-[#f0b429] text-[#07110b] shadow-[0_0_18px_rgba(240,180,41,0.22)]">
                <ListChecks className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d5ff3f]">Mi quiniela</p>
                <h2 className="mt-1 text-2xl font-black uppercase leading-tight text-white min-[380px]:text-3xl sm:text-5xl">
                  {savedCount}
                  <span className="text-white/35">/{TOTAL_MATCHES}</span>
                  <span className="ml-2 text-base font-black text-white/75 min-[380px]:ml-3 min-[380px]:text-xl sm:text-2xl">guardados</span>
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-bold text-white/62">
                  Prioriza los partidos abiertos y guarda cualquier cambio antes del cierre.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 min-[380px]:gap-2 lg:min-w-[440px] lg:gap-3">
              <StatPlate label="Guardados" value={savedCount} tone="lime" icon={<Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} />
              <StatPlate label="Cerrados" value={lockedCount} tone="orange" icon={<Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />} />
              <StatPlate label="Progreso" value={`${pct}%`} tone="cyan" />
            </div>
          </div>
        </div>

        <div className="relative px-3 py-4 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Avance total</p>
            <span className="rounded-md border border-white/15 bg-black/35 px-2 py-1 text-xs font-black tabular-nums text-[#d5ff3f]">
              {pct}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-white/15 bg-black/45">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f0b429] via-[#d5ff3f] to-[#9dff34] transition-all shadow-[0_0_16px_rgba(213,255,63,0.55)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {mineMatches.length ? (
        <div className="grid gap-5">
          {sections.map((section) => (
            <PickSection
              key={section.id}
              section={section}
              drafts={drafts}
              savingId={savingId}
              isSavingBulk={isSavingBulk}
              todayEditableMatchIds={todayEditableMatchIds}
              nowMs={nowMs}
              focusMatchId={focusMatchId}
              onUpdateDraft={onUpdateDraft}
              onSave={onSave}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-[#f0b429]/30 bg-black/35 p-6 text-center sm:p-8">
          <div>
            <ListChecks className="mx-auto h-12 w-12 text-[#f0b429]" />
            <p className="mt-4 text-xl font-black text-white">Todavia no hay picks guardados</p>
            <p className="mt-2 text-base font-bold text-white/60">Ve a Ahora para empezar a predecir.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function compareUpcomingMatches(
  a: MundialMatch,
  b: MundialMatch,
  drafts: Record<string, Draft>,
  todayEditableMatchIds: Set<string>,
  nowMs: number
) {
  return dayPriority(a, nowMs) - dayPriority(b, nowMs)
    || matchPriority(a, drafts, todayEditableMatchIds, nowMs) - matchPriority(b, drafts, todayEditableMatchIds, nowMs)
    || kickoffMs(a) - kickoffMs(b)
    || a.number - b.number;
}

function dayPriority(match: MundialMatch, nowMs: number) {
  const todayKey = crDateKey(nowMs);
  const tomorrowKey = crDateKey(nowMs + DAY_MS);
  const matchKey = crDateKey(kickoffMs(match));

  if (matchKey === todayKey) return 0;
  if (matchKey === tomorrowKey) return 1;
  return 2;
}

function matchPriority(
  match: MundialMatch,
  drafts: Record<string, Draft>,
  todayEditableMatchIds: Set<string>,
  nowMs: number
) {
  const draft = drafts[match.id] ?? emptyDraft();
  const closed = isMatchClosed(match, nowMs);
  const editable = todayEditableMatchIds.has(match.id) && !closed;

  if (isMatchLive(match)) return 0;
  if (draft.dirty && editable) return 1;
  if (editable && !draft.saved) return 2;
  if (editable) return 3;
  if (draft.saved && !closed) return 4;
  return 5;
}

function crDateKey(ms: number) {
  if (!Number.isFinite(ms)) return "sin-fecha";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
}

function daySectionTitle(dateKey: string, todayKey: string, tomorrowKey: string) {
  if (dateKey === todayKey) return "Hoy";
  if (dateKey === tomorrowKey) return "Manana";

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function daySectionDescription(dateKey: string, todayKey: string, tomorrowKey: string, matches: MundialMatch[]) {
  const groups = groupSummary(matches);
  if (dateKey === todayKey) return `Los partidos de hoy primero${groups ? ` (${groups})` : ""}.`;
  if (dateKey === tomorrowKey) return `Luego vienen los de manana${groups ? ` (${groups})` : ""}.`;
  return `Proximos partidos en orden de hora${groups ? ` (${groups})` : ""}.`;
}

function groupSummary(matches: MundialMatch[]) {
  const labels = Array.from(
    new Set(matches.map((match) => (match.group ? `Grupo ${match.group}` : match.stageLabel)).filter(Boolean))
  );

  if (!labels.length) return "";
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} +${labels.length - 3}`;
}

function PickSection({
  section,
  drafts,
  savingId,
  isSavingBulk,
  todayEditableMatchIds,
  nowMs,
  focusMatchId,
  onUpdateDraft,
  onSave,
}: {
  section: MatchSection;
  drafts: Record<string, Draft>;
  savingId: string | null;
  isSavingBulk: boolean;
  todayEditableMatchIds: Set<string>;
  nowMs: number;
  focusMatchId: string | null;
  onUpdateDraft: (matchId: string, patch: Partial<Draft>) => void;
  onSave: (match: MundialMatch) => Promise<void>;
}) {
  const saved = section.matches.filter((match) => drafts[match.id]?.saved).length;
  const pending = section.matches.filter((match) => {
    const draft = drafts[match.id] ?? emptyDraft();
    const closed = isMatchClosed(match, nowMs);
    return todayEditableMatchIds.has(match.id) && !closed && (!draft.saved || draft.dirty);
  }).length;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-black/25",
        section.tone === "today"
          ? "border-[#d5ff3f]/45 shadow-[0_18px_58px_rgba(157,255,52,0.12)]"
          : section.tone === "recent"
            ? "border-[#f0b429]/35"
            : "border-white/12"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5",
          section.tone === "today"
            ? "border-[#d5ff3f]/25 bg-[#10240b]/80"
            : section.tone === "recent"
              ? "border-[#f0b429]/20 bg-[#211707]/70"
              : "border-white/10 bg-black/35"
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
                section.tone === "today"
                  ? "border-[#d5ff3f]/45 bg-[#9dff34] text-[#06110b]"
                  : section.tone === "recent"
                    ? "border-[#f0b429]/45 bg-[#f0b429] text-[#06110b]"
                    : "border-[#62ffe6]/35 bg-[#071d2a] text-[#62ffe6]"
              )}
            >
              {section.tone === "today" ? (
                <Flame className="h-4 w-4" />
              ) : section.tone === "recent" ? (
                <History className="h-4 w-4" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">{section.eyebrow}</p>
              <h3 className="truncate text-2xl font-black uppercase text-white">{section.title}</h3>
            </div>
          </div>
          <p className="mt-2 text-sm font-bold text-white/58">{section.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 min-[380px]:gap-2 sm:min-w-72">
          <MiniStat label="Total" value={section.matches.length} />
          <MiniStat label="Listos" value={saved} />
          <MiniStat label="Pend." value={pending} highlight={pending > 0} />
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {section.matches.map((match) => (
          <div
            key={match.id}
            id={`mine-match-${match.id}`}
            className={cn(
              "scroll-mt-24 rounded-xl transition",
              focusMatchId === match.id && "ring-4 ring-[#d5ff3f]/70 ring-offset-4 ring-offset-[#06140f]"
            )}
          >
            <MatchCard
              match={match}
              draft={drafts[match.id] ?? emptyDraft()}
              savingId={savingId}
              isSavingBulk={isSavingBulk}
              todayEditableMatchIds={todayEditableMatchIds}
              nowMs={nowMs}
              onUpdateDraft={onUpdateDraft}
              onSave={onSave}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-1.5 py-2 text-center min-[380px]:px-2.5",
        highlight
          ? "border-[#ffb15f]/45 bg-[#2a120b]/75 text-[#ffb15f]"
          : "border-white/12 bg-black/30 text-white"
      )}
    >
      <p className="text-[9px] font-black uppercase tracking-wider text-white/45 min-[380px]:text-[10px]">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums min-[380px]:text-xl">{value}</p>
    </div>
  );
}

function StatPlate({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number | string;
  tone: "lime" | "orange" | "cyan";
  icon?: ReactNode;
}) {
  const color =
    tone === "lime"
      ? "border-[#d5ff3f]/35 bg-black/35 text-[#d5ff3f]"
      : tone === "orange"
        ? "border-[#ffb15f]/35 bg-[#2a120b]/65 text-[#ffb15f]"
        : "border-[#62ffe6]/35 bg-[#071d2a]/65 text-[#62ffe6]";

  return (
    <div className={`rounded-lg border px-2 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.14)] min-[380px]:px-3 sm:px-4 sm:py-3 ${color}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[9px] font-black uppercase tracking-wider text-white/70 min-[380px]:text-[10px] sm:text-[11px]">{label}</p>
      </div>
      <p className="mt-1.5 text-xl font-black tabular-nums text-current min-[380px]:text-2xl sm:mt-2 sm:text-3xl">{value}</p>
    </div>
  );
}
