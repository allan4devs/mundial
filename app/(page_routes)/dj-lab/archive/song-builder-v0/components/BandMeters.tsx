"use client";

import { memo } from "react";

import { clamp, fmtHz } from "../lib/format";
import type { BandMeterProps } from "../props";

/** One clickable strip per band: live level behind, centre frequency and trim in front. */
export const BandMeters = memo(function BandMeters({
  centers,
  spectral,
  bandLevels,
  color,
  onToggleBand,
}: BandMeterProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {centers.map((fc, i) => {
        const level = clamp(bandLevels[i] ?? 0, 0, 1);
        const on = spectral.bandOn[i];
        const trim = spectral.bandDb[i] ?? 0;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onToggleBand(i)}
            title={`${Math.round(fc)} Hz — click to ${on ? "mute" : "unmute"}`}
            className={`relative h-14 flex-1 basis-[52px] overflow-hidden rounded-sm border text-center text-[10px] font-black leading-tight transition ${
              on ? "border-white/15 text-white" : "border-white/[0.06] text-slate-600"
            }`}
          >
            <span
              className="absolute inset-x-0 bottom-0"
              style={{
                height: `${level * 100}%`,
                background: on ? `${color}aa` : "rgba(148,163,184,0.15)",
              }}
            />
            <span className="relative block pt-1">{fmtHz(fc)}</span>
            <span className="relative block text-slate-400">
              {trim > 0 ? "+" : ""}
              {Math.round(trim)}
            </span>
          </button>
        );
      })}
    </div>
  );
});
