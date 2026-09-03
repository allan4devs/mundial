"use client";

import { Layers, Plus } from "lucide-react";
import { memo } from "react";

import { EMPTY_LEVELS, INSTRUMENT_PRESETS } from "../lib/constants";
import { sampleOf } from "../lib/layer";
import { LayerCard } from "./LayerCard";
import { PanelTitle } from "./ui";
import type { LayerRackProps } from "../props";

/** The arrangement: preset buttons on top, one `LayerCard` per row below. */
export const LayerRack = memo(function LayerRack({
  layers,
  samples,
  sampleById,
  soloActive,
  playing,
  projectBpm,
  focusedLayerId,
  bandLevels,
  spectro,
  spectroBusy,
  onAddLayer,
  onToggleFocus,
  onChange,
  onAssign,
  onPreview,
  onRemove,
}: LayerRackProps) {
  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
      <PanelTitle eyebrow="Arrangement" title="Layers" icon={<Layers className="text-sky-200" size={26} />} />

      <div className="flex flex-wrap gap-2">
        {INSTRUMENT_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onAddLayer(preset)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-slate-100 transition hover:bg-white/[0.12]"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: preset.color }} />
            {preset.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onAddLayer()}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-300/35 bg-emerald-300/10 px-3 text-xs font-black text-emerald-100 transition hover:bg-emerald-300/20"
        >
          <Plus size={15} /> Layer
        </button>
      </div>

      {layers.length === 0 ? (
        <p className="rounded-md border border-white/10 bg-black/30 p-6 text-center text-sm text-slate-500">
          No layers yet. Add one per instrument, then chop the slice it should loop.
        </p>
      ) : (
        <div className="grid gap-3">
          {layers.map((layer) => {
            const focused = focusedLayerId === layer.id;
            return (
              <LayerCard
                key={layer.id}
                layer={layer}
                sample={sampleOf(layer, sampleById)}
                samples={samples}
                soloActive={soloActive}
                playing={playing}
                focused={focused}
                projectBpm={projectBpm}
                // Meters and the spectrogram only exist for the open card — everyone
                // else gets stable empty values and stays memoised.
                bandLevels={focused ? bandLevels : EMPTY_LEVELS}
                spectro={focused ? spectro : null}
                spectroBusy={focused ? spectroBusy : false}
                onToggleFocus={onToggleFocus}
                onChange={onChange}
                onAssign={onAssign}
                onPreview={onPreview}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      )}
    </section>
  );
});
