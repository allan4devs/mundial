"use client";

import { ChevronDown, ChevronUp, Play, SlidersHorizontal, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";

import { isAudible, loopSeconds, matchSpeed } from "../lib/layer";
import { BeatMatchControl } from "./BeatMatchControl";
import { ChopFields } from "./ChopFields";
import { ChopStrip } from "./ChopStrip";
import { PlaybackControls } from "./PlaybackControls";
import { SpectralPanel } from "./SpectralPanel";
import { LoopSweep } from "./ui";
import type { LayerCardProps, LayerPatch, SpectralPatch } from "../props";

/** One arrangement row: chop, playback, beat match and the spectral engine. */
export const LayerCard = memo(function LayerCard({
  layer,
  sample,
  samples,
  soloActive,
  playing,
  focused,
  bandLevels,
  spectro,
  spectroBusy,
  projectBpm,
  onToggleFocus,
  onChange,
  onAssign,
  onPreview,
  onRemove,
}: LayerCardProps) {
  const { id, spectral } = layer;

  // Bind the layer id once so every child gets a callback that survives re-renders.
  const patch = useCallback((next: LayerPatch) => onChange(id, next), [onChange, id]);
  const patchSpectral = useCallback(
    (next: SpectralPatch) => onChange(id, { spectral: { ...spectral, ...next } }),
    [onChange, id, spectral],
  );
  const toggleFocus = useCallback(() => onToggleFocus(id), [onToggleFocus, id]);
  const preview = useCallback(() => onPreview(id), [onPreview, id]);
  const remove = useCallback(() => onRemove(id), [onRemove, id]);
  const assign = useCallback((sampleId: string) => onAssign(id, sampleId), [onAssign, id]);
  const beatMatch = useCallback(
    (sourceBpm: number) => patch({ speed: matchSpeed(sourceBpm, projectBpm), sourceBpm }),
    [patch, projectBpm],
  );

  const audible = isAudible(layer, soloActive);
  const loopDur = loopSeconds(layer, sample);

  return (
    <article
      className={`grid gap-3 rounded-lg border p-3 transition ${
        audible ? "border-white/12 bg-black/30" : "border-white/8 bg-black/20 opacity-60"
      }`}
      style={{ boxShadow: `inset 3px 0 0 ${layer.color}` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={layer.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-black text-white outline-none focus:border-emerald-300/50"
        />
        <select
          value={layer.sampleId ?? ""}
          onChange={(e) => assign(e.target.value)}
          className="max-w-[45%] rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm font-bold text-slate-100 outline-none"
        >
          <option value="" className="bg-[#10131a]">
            — sample —
          </option>
          {samples.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#10131a]">
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={preview}
          disabled={!sample}
          className="grid h-9 w-9 place-items-center rounded-md border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 transition hover:bg-emerald-300/20 disabled:opacity-40"
          title="Preview slice"
        >
          <Play size={15} />
        </button>
        <button
          type="button"
          onClick={() => patch({ muted: !layer.muted })}
          className={`h-9 w-9 rounded-md border text-xs font-black transition ${
            layer.muted ? "border-red-300 bg-red-400 text-black" : "border-white/10 bg-white/[0.06] text-slate-200"
          }`}
          title="Mute"
        >
          M
        </button>
        <button
          type="button"
          onClick={() => patch({ soloed: !layer.soloed })}
          className={`h-9 w-9 rounded-md border text-xs font-black transition ${
            layer.soloed ? "border-amber-300 bg-amber-300 text-black" : "border-white/10 bg-white/[0.06] text-slate-200"
          }`}
          title="Solo"
        >
          S
        </button>
        <button
          type="button"
          onClick={remove}
          className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-red-300/50 hover:text-red-200"
          title="Delete layer"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {sample ? (
        <>
          <ChopStrip sample={sample} layer={layer} onChange={patch} />
          <ChopFields sample={sample} layer={layer} onChange={patch} />
        </>
      ) : (
        <p className="rounded-md border border-dashed border-white/10 bg-black/30 p-4 text-center text-xs text-slate-500">
          Assign a sample to chop and loop it.
        </p>
      )}

      <PlaybackControls layer={layer} onChange={patch} />

      <BeatMatchControl
        sourceBpm={layer.sourceBpm}
        speed={layer.speed}
        projectBpm={projectBpm}
        onMatch={beatMatch}
      />

      <button
        type="button"
        onClick={toggleFocus}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-xs font-black uppercase transition ${
          focused
            ? "border-emerald-300 bg-emerald-300/15 text-emerald-100"
            : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]"
        }`}
      >
        <SlidersHorizontal size={14} />
        {spectral.enabled ? `Spectral · ${spectral.bands} bands` : "Spectral engine"}
        {focused ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {focused && (
        <SpectralPanel
          spectral={spectral}
          color={layer.color}
          bandLevels={bandLevels}
          spectro={spectro}
          spectroBusy={spectroBusy}
          onChange={patchSpectral}
        />
      )}

      {/* Loop cycle sweep — restarts cleanly when it reaches the end. */}
      {sample && (
        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <LoopSweep seconds={loopDur} loop={layer.loop} playing={playing} background={layer.color} />
        </div>
      )}
    </article>
  );
});
