"use client";

import { useMemo, useState } from "react";
import { Calendar, MapPin, Trophy, Users, X } from "lucide-react";
import type { LeaderboardEntry, MundialMatch, Prediction } from "../types";
import { cn, formatKickoff, normalizeKey } from "../utils";
import { teamCode } from "../flags";
import { computePredictionResult, matchWinnerSide } from "@/lib/mundial/prediction-scoring";
import { Flag } from "./Flag";

// ─── Bracket layout ───────────────────────────────────────────────────────────

const DEG = 360 / 32; // 11.25° per outer slot

// 32 outer slots: [matchNumber, side] clockwise from top
// Arranged so bracket pairs are adjacent (→ clean connecting lines)
const R32_SLOTS: [number, "home" | "away"][] = [
  // RIGHT half — SF102 side (slots 0-15)
  [76, "home"], [76, "away"], [73, "home"], [73, "away"],   // → R16_91
  [79, "home"], [79, "away"], [80, "home"], [80, "away"],   // → R16_92
  [86, "home"], [86, "away"], [88, "home"], [88, "away"],   // → R16_95
  [85, "home"], [85, "away"], [87, "home"], [87, "away"],   // → R16_96
  // LEFT half — SF101 side (slots 16-31)
  [84, "home"], [84, "away"], [83, "home"], [83, "away"],   // → R16_93
  [82, "home"], [82, "away"], [81, "home"], [81, "away"],   // → R16_94
  [74, "home"], [74, "away"], [77, "home"], [77, "away"],   // → R16_89
  [75, "home"], [75, "away"], [78, "home"], [78, "away"],   // → R16_90
];

const slotDeg = (i: number) => (i + 0.5) * DEG;

// R32 match center angles
const R32_A: Record<number, number> = {};
const _seen = new Set<number>();
R32_SLOTS.forEach(([m], i) => {
  if (!_seen.has(m)) { R32_A[m] = (slotDeg(i) + slotDeg(i + 1)) / 2; _seen.add(m); }
});

// R16: [matchNum, r32a, r32b]
const R16_DEF: [number, number, number][] = [
  [91, 76, 73], [92, 79, 80], [95, 86, 88], [96, 85, 87],
  [93, 84, 83], [94, 82, 81], [89, 74, 77], [90, 75, 78],
];
const R16_A: Record<number, number> = {};
R16_DEF.forEach(([n, a, b]) => { R16_A[n] = (R32_A[a] + R32_A[b]) / 2; });

// QF: [matchNum, r16a, r16b]
const QF_DEF: [number, number, number][] = [
  [99, 91, 92], [100, 95, 96], [98, 93, 94], [97, 89, 90],
];
const QF_A: Record<number, number> = {};
QF_DEF.forEach(([n, a, b]) => { QF_A[n] = (R16_A[a] + R16_A[b]) / 2; });

// SF: [matchNum, qfa, qfb]
const SF_DEF: [number, number, number][] = [
  [102, 99, 100], [101, 97, 98],
];
const SF_A: Record<number, number> = {};
SF_DEF.forEach(([n, a, b]) => { SF_A[n] = (QF_A[a] + QF_A[b]) / 2; });
// SF102 = 90° (right), SF101 = 270° (left)

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const CX = 350, CY = 350;

function pt(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function mwinner(m: MundialMatch | undefined): "home" | "away" | null {
  return m ? matchWinnerSide(m) : null;
}

function winnerTeam(m: MundialMatch | undefined): string | null {
  const w = mwinner(m);
  if (!m || !w) return null;
  return w === "home" ? m.homeTeam : m.awayTeam;
}

function decisionSuffix(method: MundialMatch["decisionMethod"] | Prediction["winnerPickMethod"] | undefined) {
  if (method === "extraTime") return " TE";
  if (method === "penalties") return " Pen";
  return "";
}

function decisionLong(method: MundialMatch["decisionMethod"] | Prediction["winnerPickMethod"] | undefined) {
  if (method === "extraTime") return "tiempos extra";
  if (method === "penalties") return "penales";
  return "regular";
}

function isReal(name: string) {
  return !!name && !/^(Ganador|Perdedor|1ro|2do|3ro|TBD|$)/.test(name.trim());
}

function SvgFlag({
  team,
  x,
  y,
  size = "xs",
}: {
  team: string;
  x: number;
  y: number;
  size?: "xs" | "sm";
}) {
  const box = size === "sm" ? { width: 24, height: 18 } : { width: 20, height: 15 };

  return (
    <foreignObject
      x={x - box.width / 2}
      y={y - box.height / 2}
      width={box.width}
      height={box.height}
      style={{ overflow: "visible", pointerEvents: "none" }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <Flag team={team} size={size} className="rounded-[2px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]" />
      </div>
    </foreignObject>
  );
}

function accuracyPct(e: LeaderboardEntry) {
  return e.scoredPredictions > 0
    ? Math.round((e.correctOutcomes / e.scoredPredictions) * 100)
    : 0;
}

// Radii tuned for the poster-style circular bracket.
const RA = { outer: 274, label: 309, r32: 236, r16: 184, qf: 128, sf: 74, finalPt: 52 };

const TEAM_ACCENTS = ["#ff3156", "#ffffff", "#315dff", "#f0b429", "#d5ff3f", "#62ffe6"];

function teamAccent(team: string | null | undefined) {
  if (!team || !isReal(team)) return "rgba(255,255,255,0.22)";
  let hash = 0;
  for (let i = 0; i < team.length; i++) hash = (hash * 31 + team.charCodeAt(i)) >>> 0;
  return TEAM_ACCENTS[hash % TEAM_ACCENTS.length];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function BracketView({
  matches,
  predictions,
  playerName,
}: {
  matches: MundialMatch[];
  predictions: Prediction[];
  playerName: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const byNum = useMemo(() => new Map(matches.map((m) => [m.number, m])), [matches]);
  const selectedMatch = selected != null ? byNum.get(selected) ?? null : null;

  return (
    <section className="grid gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#f0b429]/20 bg-[#0d0d0b] shadow-[0_32px_90px_rgba(0,0,0,0.68)]">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:8px_8px]" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_50%,rgba(240,180,41,0.18),transparent_25%),radial-gradient(circle_at_50%_50%,rgba(240,180,41,0.10),transparent_42%),radial-gradient(circle_at_50%_50%,transparent_50%,rgba(0,0,0,0.78)_100%)]" />

        <div className="relative flex items-center gap-3 border-b border-white/10 bg-black/25 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#f0b429]/45 bg-[#f0b429] text-[#07110b] shadow-[0_0_18px_rgba(240,180,41,0.26)]">
            <Trophy className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d5ff3f]">Quiniela · Mundial 2026</p>
            <p className="truncate text-base font-black uppercase text-white">Bracket Eliminatorias</p>
          </div>
          <p className="ml-auto hidden text-xs font-bold text-white/40 sm:block">Bracket gráfico de eliminatorias</p>
        </div>

        <div className="p-2 sm:p-4">
          <div className="mx-auto w-full overflow-hidden rounded-[1.25rem] border border-white/8 bg-[#11110f] p-0 shadow-[inset_0_0_70px_rgba(0,0,0,0.62)]" style={{ maxWidth: 700, aspectRatio: "1 / 1" }}>
            <BracketSVG
              byNum={byNum}
              predictions={predictions}
              playerName={playerName}
              selectedMatch={selectedMatch}
              selected={selected}
              onSelect={(n) => setSelected((prev) => (prev === n ? null : n))}
              onClear={() => setSelected(null)}
            />
          </div>
        </div>

        {/* legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 bg-black/25 px-4 py-2.5">
          <LegendDot color="#f0b429" label="Ganador avanza" />
          <LegendDot color="rgba(255,255,255,0.45)" label="Definido" />
          <LegendDot color="rgba(255,255,255,0.18)" label="Pendiente" />
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {selected != null ? `Partido seleccionado ${selected}` : "Ningun partido seleccionado"}
      </div>
    </section>
  );
}

// ─── SVG Bracket ─────────────────────────────────────────────────────────────

function LatestBracketRail({
  matches,
  onSelect,
}: {
  matches: MundialMatch[];
  onSelect: (matchNumber: number) => void;
}) {
  const completed = matches
    .filter((match) => match.homeFinalScore != null && match.awayFinalScore != null)
    .slice(-4)
    .reverse();
  const upcoming = matches
    .filter((match) => match.homeFinalScore == null || match.awayFinalScore == null)
    .slice(0, 3);

  if (completed.length === 0 && upcoming.length === 0) return null;

  return (
    <div className="relative border-b border-white/10 bg-black/18 px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Resultados recientes</p>
        {upcoming[0] && (
          <button
            type="button"
            onClick={() => onSelect(upcoming[0].number)}
            className="hidden rounded-md border border-[#d5ff3f]/25 bg-[#1a2206]/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#d5ff3f] transition hover:border-[#d5ff3f]/55 sm:inline-flex"
          >
            Siguiente #{upcoming[0].number}
          </button>
        )}
      </div>
      <div className="grid gap-2 min-[560px]:grid-cols-2 lg:grid-cols-4">
        {completed.map((match) => (
          <BracketRailCard key={match.id} match={match} mode="result" onSelect={onSelect} />
        ))}
        {upcoming.slice(0, Math.max(0, 4 - completed.length)).map((match) => (
          <BracketRailCard key={match.id} match={match} mode="upcoming" onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function BracketRailCard({
  match,
  mode,
  onSelect,
}: {
  match: MundialMatch;
  mode: "result" | "upcoming";
  onSelect: (matchNumber: number) => void;
}) {
  const winner = mwinner(match);
  const score = match.homeFinalScore != null && match.awayFinalScore != null
    ? `${match.homeFinalScore}-${match.awayFinalScore}`
    : formatKickoff(match.kickoffAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(match.number)}
      className="group min-w-0 rounded-lg border border-white/10 bg-[#06140f]/86 p-2.5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition hover:border-[#f0b429]/45 hover:bg-[#10240b]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={cn(
          "rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide",
          mode === "result"
            ? "border-[#f0b429]/30 bg-[#f0b429]/10 text-[#f0b429]"
            : "border-white/12 bg-white/5 text-white/38",
        )}>
          {mode === "result" ? "Final" : "Por jugar"} #{match.number}
        </span>
        <span className="truncate text-[9px] font-bold uppercase tracking-wide text-white/30">{match.stageLabel}</span>
      </div>

      <RailTeam team={match.homeTeam} score={match.homeFinalScore} isWinner={winner === "home"} />
      <RailTeam team={match.awayTeam} score={match.awayFinalScore} isWinner={winner === "away"} />

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/8 pt-2">
        <span className="truncate text-[10px] font-bold text-white/30">{mode === "result" ? "Marcador" : "Inicio"}</span>
        <span className="text-xs font-black tabular-nums text-white/70 group-hover:text-[#d5ff3f]">{score}</span>
      </div>
    </button>
  );
}

function RailTeam({
  team,
  score,
  isWinner,
}: {
  team: string;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 py-0.5">
      <Flag team={team} size="sm" className="shrink-0 rounded-[2px]" />
      <span className={cn("min-w-0 flex-1 truncate text-xs font-black", isWinner ? "text-[#f0b429]" : "text-white/75")}>
        {team}
      </span>
      {score != null && (
        <span className={cn("text-sm font-black tabular-nums", isWinner ? "text-[#f0b429]" : "text-white/45")}>
          {score}
        </span>
      )}
    </div>
  );
}

function BracketSVG({
  byNum,
  predictions,
  playerName,
  selectedMatch,
  selected,
  onSelect,
  onClear,
}: {
  byNum: Map<number, MundialMatch>;
  predictions: Prediction[];
  playerName: string;
  selectedMatch: MundialMatch | null;
  selected: number | null;
  onSelect: (n: number) => void;
  onClear: () => void;
}) {
  const gm = (n: number) => byNum.get(n);
  const hasRes = (n: number) => gm(n)?.homeFinalScore != null;
  const lineC = (n: number) => {
    if (selected === n) return "rgba(213,255,63,0.95)";
    return hasRes(n) ? teamAccent(winnerTeam(gm(n))) : "rgba(255,255,255,0.12)";
  };
  const lineW = (n: number) => selected === n ? 2.6 : hasRes(n) ? 2.15 : 0.9;

  function connLine(r1: number, a1: number, r2: number, a2: number, matchNum: number) {
    const [x1, y1] = pt(r1, a1);
    const [x2, y2] = pt(r2, a2);
    const pending = !hasRes(matchNum);
    return (
      <line
        key={`${r1}-${a1}-${r2}-${a2}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={lineC(matchNum)} strokeWidth={lineW(matchNum)}
        strokeLinecap="round"
        opacity={pending ? 0.58 : 0.9}
        strokeDasharray={pending ? "3 4" : undefined}
      />
    );
  }

  // Lines light up when the SOURCE match is decided (the winner's path forward)
  const r32EntryLines = R32_SLOTS.map(([matchNum], i) => {
    const angle = slotDeg(i);
    const [x1, y1] = pt(RA.outer - 5, angle);
    const [x2, y2] = pt(RA.r32, R32_A[matchNum]);
    const match = gm(matchNum);
    const side = R32_SLOTS[i][1];
    const won = mwinner(match) === side;

    return (
      <line
        key={`entry-${matchNum}-${side}`}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={selected === matchNum ? "rgba(213,255,63,0.95)" : won ? teamAccent(side === "home" ? match?.homeTeam : match?.awayTeam) : "rgba(255,255,255,0.12)"}
        strokeWidth={selected === matchNum ? 2.2 : won ? 1.8 : 0.72}
        opacity={won || selected === matchNum ? 0.9 : 0.5}
        strokeLinecap="round"
      />
    );
  });

  const r32r16Lines = R16_DEF.flatMap(([n, a, b]) => [
    connLine(RA.r32, R32_A[a], RA.r16, R16_A[n], a),
    connLine(RA.r32, R32_A[b], RA.r16, R16_A[n], b),
  ]);

  const r16qfLines = QF_DEF.flatMap(([n, a, b]) => [
    connLine(RA.r16, R16_A[a], RA.qf, QF_A[n], a),
    connLine(RA.r16, R16_A[b], RA.qf, QF_A[n], b),
  ]);

  const qfsfLines = SF_DEF.flatMap(([n, a, b]) => [
    connLine(RA.qf, QF_A[a], RA.sf, SF_A[n], a),
    connLine(RA.qf, QF_A[b], RA.sf, SF_A[n], b),
  ]);

  const sfFinalLines = [101, 102].map((sfN) => {
    const [x1, y1] = pt(RA.sf, SF_A[sfN]);
    return (
      <line key={sfN} x1={x1} y1={y1} x2={CX} y2={CY}
        stroke={lineC(sfN)} strokeWidth={lineW(sfN) + 0.4}
        strokeLinecap="round" strokeDasharray={!hasRes(sfN) ? "3 4" : undefined} />
    );
  });

  // 3rd place lines from SF losers
  const [x3p, y3p] = pt(RA.finalPt, 180); // bottom-center
  const thirdLines = [101, 102].map((sfN) => {
    const [x1, y1] = pt(RA.sf, SF_A[sfN]);
    return (
      <line key={`3p-${sfN}`} x1={x1} y1={y1} x2={x3p} y2={y3p}
        stroke={lineC(sfN)} strokeWidth={0.8} strokeDasharray="3 3"
        strokeLinecap="round" />
    );
  });

  return (
    <svg viewBox="0 0 700 700" className="h-full w-full">
      <defs>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0b429" stopOpacity="0.46" />
          <stop offset="52%" stopColor="#f0b429" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#f0b429" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bgv" cx="50%" cy="50%" r="61%">
          <stop offset="0%" stopColor="#242017" />
          <stop offset="42%" stopColor="#151512" />
          <stop offset="100%" stopColor="#080908" />
        </radialGradient>
        <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="sglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect width={700} height={700} fill="url(#bgv)" />
      <circle cx={CX} cy={CY} r={328} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth={1} />
      {Array.from({ length: 64 }, (_, i) => {
        const angle = (i + 0.5) * (360 / 64);
        const [x1, y1] = pt(118, angle);
        const [x2, y2] = pt(338, angle);
        return (
          <line
            key={`ray-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.045)"
            strokeWidth={i % 4 === 0 ? 0.8 : 0.45}
          />
        );
      })}

      {/* center ambient */}
      <circle cx={CX} cy={CY} r={120} fill="url(#cg)" />
      <circle cx={CX} cy={CY} r={68} fill="none" stroke="rgba(240,180,41,0.32)" strokeWidth={1.2} />
      <circle cx={CX} cy={CY} r={106} fill="none" stroke="rgba(240,180,41,0.16)" strokeWidth={0.9} />

      {/* guide rings */}
      {[RA.outer, RA.r32, RA.r16, RA.qf, RA.sf].map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r}
          fill="none" stroke={r === RA.outer ? "rgba(255,255,255,0.08)" : "rgba(240,180,41,0.12)"}
          strokeWidth={r === RA.outer ? 1 : 0.8} strokeDasharray={r === RA.outer ? "1 11" : "2 12"} />
      ))}

      {/* connectors */}
      {r32EntryLines}
      {r32r16Lines}
      {r16qfLines}
      {qfsfLines}
      {sfFinalLines}
      {thirdLines}

      {/* R32 match nodes: keep the outer lines visually anchored */}
      {Object.keys(R32_A).map((n) => {
        const matchNum = Number(n);
        return (
          <MatchKnot
            key={matchNum}
            r={RA.r32}
            angle={R32_A[matchNum]}
            match={gm(matchNum)}
            isSelected={selected === matchNum}
            onClick={() => onSelect(matchNum)}
          />
        );
      })}

      {/* separator arcs between each pair of R32 teams (show match groupings) */}
      {Array.from({ length: 16 }, (_, i) => {
        const sepAngle = (i * 2 + 2) * DEG; // boundary between pairs
        const [x1, y1] = pt(RA.outer - 8, sepAngle);
        const [x2, y2] = pt(RA.outer + 14, sepAngle);
        return (
          <line key={`sep-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(255,255,255,0.12)" strokeWidth={0.7} />
        );
      })}

      {/* R32 outer slots */}
      {R32_SLOTS.map(([matchNum, side], i) => {
        const angle = slotDeg(i);
        const match = gm(matchNum);
        const team = side === "home" ? match?.homeTeam : match?.awayTeam;
        const wr = mwinner(match);
        const won = wr === side;
        const lost = match?.homeFinalScore != null && wr !== null && wr !== side;
        return (
          <OuterSlot key={`${matchNum}-${side}`}
            angle={angle} team={team ?? ""} won={won} lost={lost}
            isSelected={selected === matchNum}
            onClick={() => onSelect(matchNum)} />
        );
      })}

      {/* R16 dots */}
      {R16_DEF.map(([n]) => (
        <InnerDot key={n} r={RA.r16} angle={R16_A[n]} match={gm(n)}
          isSelected={selected === n} size={10} onClick={() => onSelect(n)} />
      ))}

      {/* QF dots */}
      {QF_DEF.map(([n]) => (
        <InnerDot key={n} r={RA.qf} angle={QF_A[n]} match={gm(n)}
          isSelected={selected === n} size={12} onClick={() => onSelect(n)} />
      ))}

      {/* SF dots */}
      {SF_DEF.map(([n]) => (
        <InnerDot key={n} r={RA.sf} angle={SF_A[n]} match={gm(n)}
          isSelected={selected === n} size={14} onClick={() => onSelect(n)} />
      ))}

      {/* 3rd place dot at bottom */}
      <InnerDot r={RA.finalPt} angle={180} match={gm(103)}
        isSelected={selected === 103} size={9} onClick={() => onSelect(103)} />

      {/* Final / trophy center */}
      <FinalCenter match={gm(104)} isSelected={selected === 104} onClick={() => onSelect(104)} />

      {selectedMatch && (
        <SelectedMatchCallout
          match={selectedMatch}
          predictions={predictions}
          playerName={playerName}
          onClose={onClear}
        />
      )}
    </svg>
  );
}

// ─── OuterSlot: team dot + abbreviation at outer ring ────────────────────────

function SelectedMatchCallout({
  match,
  predictions,
  playerName,
  onClose,
}: {
  match: MundialMatch;
  predictions: Prediction[];
  playerName: string;
  onClose: () => void;
}) {
  const winner = mwinner(match);
  const hasResult = match.homeFinalScore != null && match.awayFinalScore != null;
  const matchPicks = predictions.filter((prediction) => prediction.matchId === match.id);
  const myKey = normalizeKey(playerName);
  const myPick = matchPicks.find((prediction) => normalizeKey(prediction.playerName) === myKey) ?? null;
  const scoreCounts = new Map<string, number>();
  for (const pick of matchPicks) {
    const key = `${pick.homeScore}-${pick.awayScore}`;
    scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1);
  }
  const popular = [...scoreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const predText = myPick ? `${myPick.homeScore}-${myPick.awayScore}` : "Sin pick";

  let myPoints: number | null = null;
  let myStatus = hasResult ? "Sin pick" : "Pendiente";
  if (myPick && hasResult) {
    const result = computePredictionResult(
      {
        stage: match.stage,
        homeFinalScore: match.homeFinalScore!,
        awayFinalScore: match.awayFinalScore!,
        homeRegulationScore: match.homeRegulationScore,
        awayRegulationScore: match.awayRegulationScore,
        actualWinner: match.actualWinner,
        decisionMethod: match.decisionMethod ?? undefined,
      },
      {
        homeScore: myPick.homeScore,
        awayScore: myPick.awayScore,
        winnerPick: myPick.winnerPick,
        winnerPickMethod: myPick.winnerPickMethod,
      },
    );
    myPoints = result.points;
    myStatus = result.kind === "exact"
      ? "Exacto"
      : result.kind === "outcome"
        ? "Resultado"
        : result.kind === "bonus"
          ? "Bonus"
          : "Fallo";
  } else if (myPick) {
    myStatus = myPick.winnerPick
      ? `Pasa ${teamCode(myPick.winnerPick === "home" ? match.homeTeam : match.awayTeam)}`
      : "Guardado";
  }

  const resultText = hasResult
    ? `${match.homeFinalScore}-${match.awayFinalScore}${match.homeFinalScore === match.awayFinalScore ? decisionSuffix(match.decisionMethod) : ""}`
    : formatKickoff(match.kickoffAt);

  return (
    <foreignObject x={216} y={244} width={268} height={214} style={{ overflow: "visible" }}>
      <div className="pointer-events-auto h-full rounded-xl border border-[#f0b429]/50 bg-[#030806]/94 p-2.5 text-white shadow-[0_18px_46px_rgba(0,0,0,0.70),0_0_30px_rgba(240,180,41,0.16)] backdrop-blur-md">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#d5ff3f]">
              {match.stageLabel} #{match.number}
            </p>
            <p className="truncate text-[10px] font-bold text-white/45">
              {hasResult ? `Resultado por ${decisionLong(match.decisionMethod)}` : "Por jugar"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-white/15 bg-white/5 text-xs font-black text-white/55 transition hover:border-[#f0b429]/50 hover:text-white"
            aria-label="Cerrar detalle"
          >
            X
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <CalloutTeam team={match.homeTeam} score={match.homeFinalScore} active={winner === "home"} align="right" />
          <div className="rounded-lg border border-white/10 bg-black/45 px-2 py-1 text-center">
            <p className="text-[8px] font-bold uppercase text-white/35">{hasResult ? "marcador" : "inicio"}</p>
            <p className="text-xs font-black tabular-nums text-[#f0b429]">{resultText}</p>
          </div>
          <CalloutTeam team={match.awayTeam} score={match.awayFinalScore} active={winner === "away"} align="left" />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <MiniInfoStat label="Mi pick" value={predText} tone="cyan" />
          <MiniInfoStat label="Como voy" value={myPoints != null ? `${myStatus} +${myPoints}` : myStatus} tone={myPoints && myPoints > 0 ? "lime" : myStatus === "Fallo" ? "orange" : "muted"} />
        </div>

        <div className="mt-2 rounded-lg border border-white/10 bg-black/35 p-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.16em] text-white/45">
              <Users className="h-2.5 w-2.5 text-[#f0b429]" />
              Amigos
            </p>
            <span className="text-[9px] font-black text-[#d5ff3f]">{matchPicks.length} picks</span>
          </div>
          <div className="grid gap-1">
            {popular.length > 0 ? popular.map(([score, count]) => (
              <div key={score} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5">
                <span className="text-[10px] font-black tabular-nums text-white">{score}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-[#f0b429]"
                    style={{ width: `${Math.max(10, Math.round((count / Math.max(1, matchPicks.length)) * 100))}%` }}
                  />
                </span>
                <span className="text-[9px] font-bold text-white/45">{count}</span>
              </div>
            )) : (
              <p className="text-[10px] font-bold text-white/35">Todavia nadie se ha mandado con este.</p>
            )}
          </div>
        </div>
      </div>
    </foreignObject>
  );
}

function MiniInfoStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "lime" | "orange" | "muted";
}) {
  const toneClass = {
    cyan: "text-[#62ffe6]",
    lime: "text-[#d5ff3f]",
    orange: "text-[#ffb15f]",
    muted: "text-white/65",
  }[tone];

  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 px-2 py-1.5">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35">{label}</p>
      <p className={cn("mt-0.5 truncate text-[10px] font-black", toneClass)}>{value}</p>
    </div>
  );
}

function CalloutTeam({
  team,
  score,
  active,
  align,
}: {
  team: string;
  score: number | null;
  active: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", align === "right" && "flex-row-reverse text-right")}>
      <Flag team={team} size="sm" className={cn("shrink-0 rounded-[2px]", active && "ring-1 ring-[#f0b429]")} />
      <div className="min-w-0">
        <p className={cn("truncate text-[10px] font-black", active ? "text-[#f0b429]" : "text-white/75")}>
          {teamCode(team)}
        </p>
        <p className="text-[11px] font-black tabular-nums text-white/70">{score ?? "-"}</p>
      </div>
    </div>
  );
}

function MatchKnot({
  r,
  angle,
  match,
  isSelected,
  onClick,
}: {
  r: number;
  angle: number;
  match: MundialMatch | undefined;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [x, y] = pt(r, angle);
  const winner = winnerTeam(match);
  const hasResult = match?.homeFinalScore != null;
  const hasTeams = match && isReal(match.homeTeam) && isReal(match.awayTeam);
  const clipId = `knotclip-${match?.number ?? `${Math.round(r)}-${Math.round(angle)}`}`;
  const nodeR = hasResult ? 7.2 : hasTeams ? 5.6 : 4.4;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} role="button" aria-label={`Partido ${match?.number ?? ""}`}>
      <circle cx={x} cy={y} r={15} fill="transparent" />
      <circle
        cx={x}
        cy={y}
        r={nodeR}
        fill={hasResult ? "rgba(255,255,255,0.9)" : hasTeams ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.14)"}
        stroke={isSelected ? "#d5ff3f" : hasResult ? teamAccent(winner) : "rgba(255,255,255,0.14)"}
        strokeWidth={isSelected ? 2 : 1}
        filter={hasResult ? "url(#sglow)" : undefined}
      />
      {!hasResult && hasTeams && match && (
        <>
          <clipPath id={clipId}>
            <circle cx={x} cy={y} r={nodeR - 0.8} />
          </clipPath>
          <g clipPath={`url(#${clipId})`} opacity={0.52} style={{ filter: "grayscale(1)" }}>
            <SvgFlag team={match.homeTeam} x={x - 4.2} y={y} size="xs" />
            <SvgFlag team={match.awayTeam} x={x + 4.2} y={y} size="xs" />
          </g>
          <line
            x1={x}
            y1={y - nodeR + 1}
            x2={x}
            y2={y + nodeR - 1}
            stroke="rgba(0,0,0,0.45)"
            strokeWidth={0.8}
          />
        </>
      )}
      {hasResult && winner && isReal(winner) && (
        <>
          <clipPath id={clipId}>
            <circle cx={x} cy={y} r={nodeR - 1.1} />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            <SvgFlag team={winner} x={x} y={y} size="xs" />
          </g>
          <circle cx={x} cy={y} r={nodeR} fill="none" stroke={teamAccent(winner)} strokeWidth={1.15} />
        </>
      )}
      {isSelected && (
        <circle cx={x} cy={y} r={nodeR + 4} fill="none" stroke="rgba(213,255,63,0.7)" strokeWidth={1.2} />
      )}
    </g>
  );
}

function OuterSlot({
  angle, team, won, lost, isSelected, onClick,
}: {
  angle: number; team: string; won: boolean; lost: boolean;
  isSelected: boolean; onClick: () => void;
}) {
  const real = isReal(team);
  const [dx, dy] = pt(RA.outer, angle);
  const [fx, fy] = pt(RA.label - 4, angle);

  const dotR = real ? 4.8 : 3.4;
  const dotFill = !real ? "rgba(255,255,255,0.1)"
    : won ? teamAccent(team)
    : isSelected ? "#d5ff3f"
    : lost ? "rgba(255,255,255,0.18)"
    : "rgba(255,255,255,0.52)";

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} role="button" aria-label={team}>
      {/* larger hit area */}
      <circle cx={fx} cy={fy} r={20} fill="transparent" />

      {/* dot */}
      <circle cx={dx} cy={dy} r={dotR}
        fill={dotFill}
        stroke={won ? teamAccent(team) : isSelected ? "rgba(213,255,63,0.75)" : "rgba(255,255,255,0.08)"}
        strokeWidth={won || isSelected ? 1.8 : 0.8}
        filter={won ? "url(#sglow)" : undefined} />

      {real && (
        <g opacity={lost ? 0.34 : 1} style={{ filter: lost ? "grayscale(1)" : undefined }}>
          <circle
            cx={fx}
            cy={fy}
            r={won || isSelected ? 16 : 14}
            fill={won ? "rgba(255,255,255,0.92)" : isSelected ? "rgba(213,255,63,0.18)" : "rgba(0,0,0,0.58)"}
            stroke={won ? teamAccent(team) : isSelected ? "rgba(213,255,63,0.72)" : "rgba(255,255,255,0.18)"}
            strokeWidth={won || isSelected ? 1.8 : 0.95}
            filter={won ? "url(#sglow)" : undefined}
          />
          <SvgFlag team={team} x={fx} y={fy} size="sm" />
        </g>
      )}
    </g>
  );
}

// ─── InnerDot: match node on inner rings ──────────────────────────────────────

function InnerDot({
  r, angle, match, isSelected, size = 7, onClick,
}: {
  r: number; angle: number; match: MundialMatch | undefined;
  isSelected: boolean; size?: number; onClick: () => void;
}) {
  const [x, y] = pt(r, angle);
  const wt = winnerTeam(match);
  const hasResult = match?.homeFinalScore != null;
  const hasTeams = match && isReal(match.homeTeam) && isReal(match.awayTeam);
  const decided = Boolean(hasResult && wt && isReal(wt));

  const fill = decided ? "rgba(255,255,255,0.92)"
    : isSelected ? "#d5ff3f"
    : hasTeams ? "rgba(255,255,255,0.28)"
    : "rgba(255,255,255,0.12)";

  const stroke = isSelected ? "#d5ff3f"
    : decided ? teamAccent(wt)
    : hasResult ? "rgba(240,180,41,0.45)"
    : "rgba(255,255,255,0.12)";

  const clipId = `dotclip-${match?.number ?? `${Math.round(r)}-${Math.round(angle)}`}`;

  // score chip: raw score, plus decision method for tied knockouts
  const score = hasResult && match
    ? `${match.homeFinalScore}-${match.awayFinalScore}${
        match.homeFinalScore === match.awayFinalScore ? decisionSuffix(match.decisionMethod) : ""
      }`
    : null;

  // label position: outward from dot; bottom slot (3er lugar) stacks below
  const isBottom = angle > 170 && angle < 190;
  const [lx, ly] = pt(r + size + 9, angle);
  const isLeft = angle >= 180;
  const anchor = isLeft ? "end" : "start";
  const showLabel = false;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      <circle cx={x} cy={y} r={size + 9} fill="transparent" />
      <circle cx={x} cy={y} r={size}
        fill={fill} stroke={stroke} strokeWidth={isSelected ? 2.3 : decided ? 1.5 : 1}
        filter={decided ? "url(#sglow)" : undefined} />

      {!decided && hasTeams && match && (
        <>
          <clipPath id={clipId}>
            <circle cx={x} cy={y} r={size - 1.1} />
          </clipPath>
          <g clipPath={`url(#${clipId})`} opacity={0.54} style={{ filter: "grayscale(1)" }}>
            <SvgFlag team={match.homeTeam} x={x - size * 0.38} y={y} size={size > 10 ? "sm" : "xs"} />
            <SvgFlag team={match.awayTeam} x={x + size * 0.38} y={y} size={size > 10 ? "sm" : "xs"} />
          </g>
          <line
            x1={x}
            y1={y - size + 1.5}
            x2={x}
            y2={y + size - 1.5}
            stroke="rgba(0,0,0,0.52)"
            strokeWidth={0.9}
          />
          <circle cx={x} cy={y} r={size} fill="none" stroke={stroke} strokeWidth={isSelected ? 2 : 1} />
        </>
      )}

      {/* winner flag clipped inside the node */}
      {decided && wt && (
        <>
          <clipPath id={clipId}>
            <circle cx={x} cy={y} r={size - 1.2} />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            <SvgFlag team={wt} x={x} y={y} size={size > 8 ? "sm" : "xs"} />
          </g>
          <circle cx={x} cy={y} r={size} fill="none"
            stroke={isSelected ? "#d5ff3f" : teamAccent(wt)} strokeWidth={1.6} />
        </>
      )}

      {showLabel && wt && (isBottom ? (
        <g>
          <text x={x} y={y + size + 15}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={7.5} fontWeight="800" fontFamily="Arial, Helvetica, sans-serif"
            fill="rgba(240,180,41,0.95)"
            style={{ userSelect: "none", pointerEvents: "none" }}>
            {teamCode(wt)}{score ? ` · ${score}` : ""}
          </text>
        </g>
      ) : (
        <g>
          <text x={isLeft ? lx - 4 : lx + 4} y={ly}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize={7.5} fontWeight="800" fontFamily="Arial, Helvetica, sans-serif"
            fill={decided ? "rgba(240,180,41,0.95)" : "rgba(255,255,255,0.58)"}
            style={{ userSelect: "none", pointerEvents: "none" }}>
            {teamCode(wt)}
          </text>
          {score && (
            <text x={isLeft ? lx - 4 : lx + 4} y={ly + 9}
              textAnchor={anchor} dominantBaseline="middle"
              fontSize={6.4} fontWeight="700" fontFamily="Arial, Helvetica, sans-serif"
              fill="rgba(255,255,255,0.5)"
              style={{ userSelect: "none", pointerEvents: "none" }}>
              {score}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

// ─── Final center: trophy + final match ──────────────────────────────────────

function FinalCenter({
  match, isSelected, onClick,
}: {
  match: MundialMatch | undefined; isSelected: boolean; onClick: () => void;
}) {
  const wt = winnerTeam(match);
  const hasResult = match?.homeFinalScore != null;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} role="button" aria-label="Final">
      {/* Hit area */}
      <circle cx={CX} cy={CY} r={52} fill="transparent" />

      {/* Outer ring */}
      <circle cx={CX} cy={CY} r={48}
        fill="rgba(0,0,0,0.28)"
        stroke={isSelected ? "#d5ff3f" : hasResult ? "#f0b429" : "rgba(240,180,41,0.35)"}
        strokeWidth={isSelected ? 2.5 : 1.2}
        filter={hasResult ? "url(#glow)" : undefined} />
      <circle cx={CX} cy={CY} r={66} fill="none" stroke="rgba(240,180,41,0.25)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={28} fill="rgba(240,180,41,0.10)" filter="url(#glow)" />

      {/* Trophy SVG (scaled inline) */}
      <g transform={`translate(${CX - 19}, ${CY - 32})`}>
        <svg width={38} height={64} viewBox="0 0 48 72">
          <ellipse cx="24" cy="66" rx="16" ry="4.5" fill="rgba(0,0,0,0.55)" />
          <path d="M10 52h28v8H10z" fill="#7a4d08" />
          <path d="M10 52h28v4H10z" fill="#a06610" />
          <path d="M14 52h20l-3-14H17z" fill="#c17912" />
          <path d="M8 52L15 31l8 10L24 7l2 34 8-10 6 21z"
            fill={hasResult ? "#f0b429" : "rgba(240,180,41,0.82)"}
            stroke="#9a5e0a" strokeWidth="2" strokeLinejoin="round" />
          <path d="M20 12c-6 4-8 12-7 19 2-2 4-5 6-7 0 9 1 16 5 21 4-5 5-12 5-21 2 2 4 5 6 7 1-7-1-15-7-19-1 7-2 13-4 19-2-6-3-12-4-19z"
            fill="#ffd36a" opacity="0.56" />
          <circle cx="16" cy="30" r="4" fill={hasResult ? "#fff0a8" : "rgba(255,240,168,0.78)"} stroke="#9a5e0a" strokeWidth="1.2" />
          <circle cx="24" cy="8" r="4" fill={hasResult ? "#fff0a8" : "rgba(255,240,168,0.78)"} stroke="#9a5e0a" strokeWidth="1.2" />
          <circle cx="32" cy="30" r="4" fill={hasResult ? "#fff0a8" : "rgba(255,240,168,0.78)"} stroke="#9a5e0a" strokeWidth="1.2" />
        </svg>
      </g>

      {/* Winner label below trophy */}
      {wt && isReal(wt) && (
        <>
          <SvgFlag team={wt} x={CX} y={CY + 31} size="sm" />
          <text x={CX} y={CY + 45}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={7.2} fontWeight="900" fontFamily="Arial, Helvetica, sans-serif"
            fill="#f0b429" style={{ userSelect: "none", pointerEvents: "none" }}>
            {teamCode(wt)}
          </text>
        </>
      )}

      {/* "FINAL" label if no result yet */}
      {!hasResult && (
        <text x={CX} y={CY + 48}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={6.5} fontWeight="700" fontFamily="Arial, Helvetica, sans-serif"
          fill="rgba(240,180,41,0.5)" style={{ userSelect: "none", pointerEvents: "none" }}>
          FINAL
        </text>
      )}
    </g>
  );
}

// ─── Stage ring labels ────────────────────────────────────────────────────────

function StageRingLabels({ showThirdCaption }: { showThirdCaption: boolean }) {
  const labels: [number, string][] = [
    [RA.r16, "Octavos"],
    [RA.qf, "Cuartos"],
    [RA.sf, "Semis"],
  ];
  const tagLabels = [
    { r: RA.r32 + 18, angle: 46, label: "Octavos" },
    { r: RA.qf + 18, angle: -8, label: "Cuartos" },
    { r: RA.sf + 18, angle: 94, label: "Semis" },
  ];

  return (
    <>
      {labels.map(([r, label]) => (
        <text key={label}
          x={CX} y={CY - r - 5}
          textAnchor="middle" dominantBaseline="auto"
          fontSize={6.5} fontWeight="700" fontFamily="Arial, Helvetica, sans-serif"
          fill="rgba(255,255,255,0.28)" letterSpacing="0.08em"
          style={{ userSelect: "none", pointerEvents: "none", textTransform: "uppercase" }}>
          {label}
        </text>
      ))}
      {tagLabels.map(({ r, angle, label }) => {
        const [x, y] = pt(r, angle);
        return (
          <text key={label}
            x={x} y={y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={6.2} fontWeight="700" fontFamily="Arial, Helvetica, sans-serif"
            fill="rgba(255,255,255,0.18)" letterSpacing="0.08em"
            style={{ userSelect: "none", pointerEvents: "none", textTransform: "uppercase" }}>
            {label}
          </text>
        );
      })}
      {/* 3rd place caption (hidden once a winner flag+code takes its place) */}
      {showThirdCaption && (
        <text x={CX} y={CY + RA.finalPt + 16}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={6.5} fontWeight="700" fontFamily="Arial, Helvetica, sans-serif"
          fill="rgba(255,255,255,0.28)" letterSpacing="0.08em"
          style={{ userSelect: "none", pointerEvents: "none" }}>
          3ER LUGAR
        </text>
      )}
    </>
  );
}

// ─── Mini Podium (top 3 leaderboard) ─────────────────────────────────────────

const PODIUM_STYLES = [
  {
    wrap: "border-[#f0b429]/45 bg-[#211707]/80 ring-1 ring-[#f0b429]/20",
    rank: "text-[#f0b429] border-[#f0b429]/50 bg-[#f0b429]/15 shadow-[0_0_12px_rgba(240,180,41,0.2)]",
    pts: "text-[#f0b429]",
    bar: "bg-[#f0b429]",
    badge: "border-[#f0b429]/30 bg-[#f0b429]/12 text-[#d5ff3f]",
    accent: "text-[#d5ff3f]",
  },
  {
    wrap: "border-white/18 bg-black/35",
    rank: "text-[#62ffe6] border-[#62ffe6]/45 bg-[#071d2a] shadow-[0_0_10px_rgba(98,255,230,0.15)]",
    pts: "text-[#62ffe6]",
    bar: "bg-[#62ffe6]/70",
    badge: "bg-black/40 text-[#d5ff3f]",
    accent: "text-[#62ffe6]",
  },
  {
    wrap: "border-[#ffb15f]/35 bg-[#2a120b]/70",
    rank: "text-[#ffb15f] border-[#ffb15f]/50 bg-[#200d03] shadow-[0_0_8px_rgba(255,177,95,0.15)]",
    pts: "text-[#ffb15f]",
    bar: "bg-[#ffb15f]/70",
    badge: "bg-black/40 text-[#d5ff3f]",
    accent: "text-[#ffb15f]",
  },
];

function MiniPodium({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="flex items-center justify-center gap-6">
      {top3.map((entry, i) => (
        <div key={entry.normalizedName} className="flex flex-col items-center gap-2">
          <div className={cn(
            "grid place-items-center rounded-full border-2 shadow-lg",
            "w-20 h-20 sm:w-28 sm:h-28"
          )}>
            <span className="text-xl font-black sm:text-2xl text-white">{i + 1}</span>
          </div>
          <p className="max-w-[10rem] truncate text-xs font-black text-white/80 text-center">{entry.playerName}</p>
        </div>
      ))}
    </div>
  );
}

function PodiumStat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-black/25 px-1 py-1 text-center">
      <p className="text-[8px] font-bold uppercase text-white/35 sm:text-[9px]">{label}</p>
      <p className={cn("text-xs font-black leading-none sm:text-sm", accent)}>{value}</p>
    </div>
  );
}

// ─── Match detail card ────────────────────────────────────────────────────────

function MatchCard({
  match, pred, onClose,
}: {
  match: MundialMatch; pred: Prediction | null; onClose: () => void;
}) {
  const w = mwinner(match);
  const hasResult = match.homeFinalScore != null;
  const hasPred = pred != null;

  const score = (side: "home" | "away") => {
    const fs = side === "home" ? match.homeFinalScore : match.awayFinalScore;
    return fs != null ? fs : "–";
  };

  const predScore = hasPred ? `${pred.homeScore}-${pred.awayScore}` : null;

  let predKind: "exact" | "outcome" | "bonus" | "miss" | "pending" = "pending";
  let predPoints: number | null = null;
  if (hasPred && hasResult) {
    const result = computePredictionResult(
      {
        stage: match.stage,
        homeFinalScore: match.homeFinalScore!,
        awayFinalScore: match.awayFinalScore!,
        homeRegulationScore: match.homeRegulationScore,
        awayRegulationScore: match.awayRegulationScore,
        actualWinner: match.actualWinner,
        decisionMethod: match.decisionMethod ?? undefined,
      },
      { homeScore: pred.homeScore, awayScore: pred.awayScore, winnerPick: pred.winnerPick, winnerPickMethod: pred.winnerPickMethod },
    );
    predPoints = result.points;
    predKind = result.kind;
  }

  const kindStyle = {
    exact: "border-[#d5ff3f]/55 bg-[#1a2206] text-[#d5ff3f]",
    outcome: "border-[#62ffe6]/55 bg-[#071d2a] text-[#62ffe6]",
    bonus: "border-[#f0b429]/55 bg-[#211707] text-[#f0b429]",
    miss: "border-[#ff6a3d]/55 bg-[#2a120b] text-[#ffb15f]",
    pending: "border-white/15 bg-white/5 text-white/45",
  }[predKind];

  const kindLabel =
    predPoints === null
      ? "Pendiente"
      : predPoints > 0
        ? `${predKind === "exact" ? "Exacto" : "Resultado"} +${predPoints}`
        : "Fallo";

  return (
    <div className="overflow-hidden rounded-xl border border-[#f0b429]/30 bg-[#06140f] shadow-[0_24px_70px_rgba(0,0,0,0.50)]">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#12351f] px-4 py-3 [background-image:linear-gradient(135deg,rgba(240,180,41,0.16),transparent_55%)]">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#f0b429]">
            {match.group ? `Grupo ${match.group} ·` : ""} {match.stageLabel} · Partido #{match.number}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/45">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatKickoff(match.kickoffAt)}</span>
            {match.venue && (
              <>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{match.venue}</span>
              </>
            )}
          </div>
        </div>
        <button
          type="button" onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/18 bg-black/20 text-white/60 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* score row */}
      <div className="flex items-center justify-center gap-4 px-4 py-5">
        {/* home */}
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <Flag team={match.homeTeam} size="lg" />
          <p className={cn("text-center text-sm font-black",
            w === "home" ? "text-[#f0b429]" : "text-white")}>
            {match.homeTeam}
          </p>
        </div>

        {/* score */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-4xl font-black tabular-nums sm:text-5xl",
              w === "home" ? "text-[#f0b429]" : "text-white")}>
              {score("home")}
            </span>
            <span className="text-2xl font-black text-white/30">:</span>
            <span className={cn("text-4xl font-black tabular-nums sm:text-5xl",
              w === "away" ? "text-[#f0b429]" : "text-white")}>
              {score("away")}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
            {!hasResult ? "Por jugar" : w ? `Gana ${teamCode(w === "home" ? match.homeTeam : match.awayTeam)}` : "Empate"}
          </span>
        </div>

        {/* away */}
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <Flag team={match.awayTeam} size="lg" />
          <p className={cn("text-center text-sm font-black",
            w === "away" ? "text-[#f0b429]" : "text-white")}>
            {match.awayTeam}
          </p>
        </div>
      </div>

      {/* prediction row */}
      {hasPred && (
        <div className="flex items-center justify-between gap-3 border-t border-white/8 bg-black/25 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-white/45">Tu pick:</span>
            <span className="rounded-md border border-[#62ffe6]/40 bg-[#071d2a] px-2.5 py-1 text-sm font-black tabular-nums text-[#62ffe6]">
              {predScore}
            </span>
            {pred.winnerPick && (
              <span className="rounded-md border border-[#d5ff3f]/35 bg-[#1a2206] px-2 py-1 text-xs font-black text-[#d5ff3f]">
                {teamCode(pred.winnerPick === "home" ? match.homeTeam : match.awayTeam)}{decisionSuffix(pred.winnerPickMethod)}
              </span>
            )}
          </div>
          {hasResult && (
            <span className={cn("rounded-md border px-2.5 py-1 text-xs font-black", kindStyle)}>
              {kindLabel}
            </span>
          )}
        </div>
      )}

      {!hasPred && (
        <div className="border-t border-white/8 bg-black/20 px-4 py-2.5">
          <p className="text-xs font-bold text-white/35">Sin predicción guardada en este partido</p>
        </div>
      )}
    </div>
  );
}

// ─── Legend dot ───────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/45">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
