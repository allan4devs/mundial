import { Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Draft, MundialMatch, Prediction } from "../types";
import { emptyDraft } from "../utils";
import { FeaturedMatch } from "./FeaturedMatch";
import { MatchSelector } from "./MatchSelector";
import { OtherPicksPanel } from "./OtherPicksPanel";
import { PenalitosPanel } from "./PenalitosPanel";

type NextViewProps = {
  activeMatch: MundialMatch | null;
  activeLiveMatch: MundialMatch | null;
  selectedInfoMatch: MundialMatch | null;
  featuredMatch: MundialMatch | null;
  matches: MundialMatch[];
  predictions: Prediction[];
  drafts: Record<string, Draft>;
  activeMatchId: string | null;
  nowMs: number;
  activeCountdown: string;
  playerName: string;
  todayEditableMatchIds: Set<string>;
  onGoToMine: (matchId?: string) => void;
  onSelectMatch: (match: MundialMatch) => void;
  onOpenPlayerPicker: () => void;
};

export function NextView({
  activeMatch,
  activeLiveMatch,
  selectedInfoMatch,
  featuredMatch,
  matches,
  predictions,
  drafts,
  activeMatchId,
  nowMs,
  activeCountdown,
  playerName,
  todayEditableMatchIds,
  onGoToMine,
  onSelectMatch,
  onOpenPlayerPicker,
}: NextViewProps) {
  const detailRef = useRef<HTMLDivElement>(null);
  const skipDetailScrollRef = useRef(true);

  useEffect(() => {
    if (!selectedInfoMatch) return;
    if (skipDetailScrollRef.current) {
      skipDetailScrollRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [selectedInfoMatch?.id]);

  function handleSelectMatch(match: MundialMatch) {
    onSelectMatch(match);
  }

  return (
    <div className="grid min-w-0 gap-3">
      {/* Match selector */}
      <MatchSelector
        matches={matches}
        nowMs={nowMs}
        activeMatchId={activeMatchId}
        selectedMatchId={selectedInfoMatch?.id ?? null}
        onSelectMatch={handleSelectMatch}
      />

      {/* Selected match detail */}
      {featuredMatch ? (
        <div ref={detailRef} className="grid min-w-0 scroll-mt-20 gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(430px,0.7fr)] xl:items-start">
          <div className="min-w-0">
            <FeaturedMatch
              match={featuredMatch}
              draft={drafts[featuredMatch.id] ?? emptyDraft()}
              _predictions={predictions}
              nowMs={nowMs}
              activeCountdown={featuredMatch.id === activeMatch?.id ? activeCountdown : undefined}
              playerName={playerName}
              canPredict={todayEditableMatchIds.has(featuredMatch.id)}
              onGoToMine={onGoToMine}
              onOpenPlayerPicker={onOpenPlayerPicker}
            />
          </div>
          <div className="grid min-w-0 gap-3 xl:sticky xl:top-20">
            {activeLiveMatch && (
              <PenalitosPanel liveMatch={activeLiveMatch} playerName={playerName} compact />
            )}
            <OtherPicksPanel
              match={featuredMatch}
              predictions={predictions}
              playerName={playerName}
            />
          </div>
        </div>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-lg border border-dashed border-white/20 bg-black/35 p-8 text-center">
          <div>
            <Trophy className="mx-auto h-14 w-14 text-[#d5ff3f]" />
            <h2 className="mt-5 text-3xl font-black text-white">Quiniela completa</h2>
            <p className="mt-3 text-lg font-bold text-white/70">
              Has predicho todos los partidos del Mundial.
            </p>
            <p className="mt-2 text-base font-bold text-white/60">
              Ahora solo queda esperar los resultados.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
