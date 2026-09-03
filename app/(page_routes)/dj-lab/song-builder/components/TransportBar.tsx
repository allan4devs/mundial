"use client";

import { Pause, Play, Sparkles } from "lucide-react";
import { memo } from "react";

import {
  MAX_BPM,
  MAX_ROOT,
  MIN_BPM,
  MIN_ROOT,
  SCALES,
  STEPS_PER_BEAT,
} from "@/lib/song-builder/types";
import { midiToName } from "../lib/music";
import { percent, seconds } from "../lib/format";
import type { TransportBarProps } from "../props";
import { Fader, Stat } from "./ui";

/** Grid lengths on offer, in sixteenths — one, one-and-a-half, two, three and four bars. */
const STEP_CHOICES = [16, 24, 32, 48, 64] as const;

const SCALE_LABELS: Record<(typeof SCALES)[number], string> = {
  minor: "Minor",
  major: "Major",
  pentatonic: "Pentatonic",
};

/**
 * Transport and the song-wide settings.
 *
 * Tempo and grid length change what a take is: the microphone stays open for
 * exactly one loop, so the record button and the count-in follow whatever is set
 * here. That is why the loop length is shown as plainly as the BPM.
 */
export const TransportBar = memo(function TransportBar({
  song,
  playing,
  master,
  sensitivity,
  loopSeconds,
  onToggle,
  onSong,
  onMaster,
  onSensitivity,
}: TransportBarProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/30 p-4">
      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex min-h-12 items-center gap-2 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-5 text-base font-black text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/15"
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
            {playing ? "Stop" : "Play loop"}
          </button>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Loop" value={seconds(loopSeconds)} />
            <Stat label="Bars" value={String(song.steps / STEPS_PER_BEAT / 4)} />
            <Stat label="Key" value={`${midiToName(song.root)} ${SCALE_LABELS[song.scale]}`} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Fader
            label="Tempo"
            value={song.bpm}
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            display={`${song.bpm} bpm`}
            onChange={(bpm) => onSong({ bpm })}
          />
          <Fader
            label="Root"
            value={song.root}
            min={MIN_ROOT}
            max={MAX_ROOT}
            step={1}
            display={midiToName(song.root)}
            onChange={(root) => onSong({ root })}
          />
          <Fader
            label="Master"
            value={master}
            min={0}
            max={1}
            step={0.01}
            display={percent(master)}
            onChange={onMaster}
          />
          <Fader
            label="Sensitivity"
            value={sensitivity}
            min={0}
            max={1}
            step={0.01}
            display={percent(sensitivity)}
            accent="sky"
            onChange={onSensitivity}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[140px]">
          <span className="text-[0.68rem] font-black uppercase text-slate-500">Grid</span>
          <select
            className="mt-1 w-full rounded-md border border-white/10 bg-black/50 px-2 py-2 text-sm font-black text-white"
            value={song.steps}
            onChange={(event) => onSong({ steps: Number(event.target.value) })}
          >
            {STEP_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice} steps
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[140px]">
          <span className="text-[0.68rem] font-black uppercase text-slate-500">Scale</span>
          <select
            className="mt-1 w-full rounded-md border border-white/10 bg-black/50 px-2 py-2 text-sm font-black text-white"
            value={song.scale}
            onChange={(event) => onSong({ scale: event.target.value as typeof song.scale })}
          >
            {SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {SCALE_LABELS[scale]}
              </option>
            ))}
          </select>
        </label>

        <p className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles size={14} className="text-emerald-200" />
          Sensitivity re-reads a take without re-recording it — hit the refresh icon on a row.
        </p>
      </div>
    </section>
  );
});
