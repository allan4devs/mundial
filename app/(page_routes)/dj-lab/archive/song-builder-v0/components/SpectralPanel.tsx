"use client";

import { memo, useCallback, useMemo } from "react";

import { DB_MAX, DB_MIN, MAX_BANDS, MIN_BANDS } from "../lib/constants";
import { bandFrequencies, freqToUnit, unitToFreq } from "../lib/dsp";
import { clamp, fmtHz, signedDb } from "../lib/format";
import { flattenSpectral, resizeSpectral, withBandDb, withBandToggled } from "../lib/spectral";
import { BandMeters } from "./BandMeters";
import { EqCurveCanvas } from "./EqCurveCanvas";
import { SpectrogramCanvas } from "./SpectrogramCanvas";
import { Fader } from "./ui";
import type { SpectralPanelProps } from "../props";

/** The lens frequency slider works in 0..1000 units mapped log-wise onto the bank. */
const LENS_STEPS = 1000;

/** Fans one layer into N Linkwitz-Riley bands, each metered, mutable and trimmable. */
export const SpectralPanel = memo(function SpectralPanel({
  spectral,
  color,
  bandLevels,
  spectro,
  spectroBusy,
  onChange,
}: SpectralPanelProps) {
  const { centers } = useMemo(() => bandFrequencies(spectral.bands), [spectral.bands]);

  const setBand = useCallback(
    (i: number, db: number) => onChange(withBandDb(spectral, i, clamp(db, DB_MIN, DB_MAX))),
    [onChange, spectral],
  );
  const toggleBand = useCallback((i: number) => onChange(withBandToggled(spectral, i)), [onChange, spectral]);
  const setFocusHz = useCallback((focusHz: number) => onChange({ focusHz }), [onChange]);
  const setBands = (bands: number) => onChange(resizeSpectral(spectral, clamp(bands, MIN_BANDS, MAX_BANDS)));

  return (
    <div className="grid gap-3 rounded-lg border border-emerald-300/20 bg-black/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ enabled: !spectral.enabled })}
          className={`inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-xs font-black uppercase transition ${
            spectral.enabled
              ? "border-emerald-300 bg-emerald-300 text-black"
              : "border-white/10 bg-white/[0.06] text-slate-200"
          }`}
        >
          {spectral.enabled ? "Bank on" : "Bank off"}
        </button>

        <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-black text-slate-300">
          <span className="text-slate-500">bands</span>
          <button
            type="button"
            onClick={() => setBands(spectral.bands - 1)}
            className="grid h-6 w-6 place-items-center rounded bg-white/[0.06] hover:bg-white/[0.14]"
          >
            −
          </button>
          <span className="w-6 text-center text-white">{spectral.bands}</span>
          <button
            type="button"
            onClick={() => setBands(spectral.bands + 1)}
            className="grid h-6 w-6 place-items-center rounded bg-white/[0.06] hover:bg-white/[0.14]"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => onChange(flattenSpectral(spectral))}
          className="min-h-9 rounded-md border border-white/10 bg-white/[0.06] px-3 text-xs font-black uppercase text-slate-200 transition hover:bg-white/[0.12]"
        >
          Flatten
        </button>

        {spectroBusy && <span className="text-[11px] font-black uppercase text-slate-500">analysing…</span>}
      </div>

      {!spectral.enabled ? (
        <p className="rounded-md border border-dashed border-white/10 bg-black/30 p-4 text-center text-xs text-slate-500">
          Turn the bank on to fan this layer into {spectral.bands} Linkwitz-Riley bands — each one metered, mutable,
          and trimmable on its own.
        </p>
      ) : (
        <>
          <SpectrogramCanvas spectro={spectro} spectral={spectral} onFocusHz={setFocusHz} />

          <EqCurveCanvas
            spectral={spectral}
            centers={centers}
            spectro={spectro}
            onBandDb={setBand}
            onFocusHz={setFocusHz}
          />

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Fader
              label="Tilt"
              value={spectral.tiltDb}
              min={-12}
              max={12}
              step={0.5}
              display={`${signedDb(spectral.tiltDb)} dB/oct`}
              onChange={(tiltDb) => onChange({ tiltDb })}
            />
            <Fader
              label="Lens gain"
              value={spectral.focusAmtDb}
              min={-24}
              max={24}
              step={0.5}
              display={`${signedDb(spectral.focusAmtDb)} dB`}
              onChange={(focusAmtDb) => onChange({ focusAmtDb })}
            />
            <Fader
              label="Lens width"
              value={spectral.focusWidthOct}
              min={0.15}
              max={4}
              step={0.05}
              display={`${spectral.focusWidthOct.toFixed(2)} oct`}
              onChange={(focusWidthOct) => onChange({ focusWidthOct })}
            />
            <label className="rounded-md border border-white/10 bg-black/30 p-3">
              <span className="mb-2 flex items-center justify-between text-[0.68rem] font-black uppercase text-slate-500">
                <span>Lens freq</span>
                <span className="text-slate-300">{fmtHz(spectral.focusHz)} Hz</span>
              </span>
              <input
                className="w-full accent-emerald-300"
                type="range"
                min={0}
                max={LENS_STEPS}
                step={1}
                value={Math.round(freqToUnit(spectral.focusHz) * LENS_STEPS)}
                onChange={(e) => setFocusHz(Math.round(unitToFreq(Number(e.target.value) / LENS_STEPS)))}
              />
            </label>
          </div>

          <BandMeters
            centers={centers}
            spectral={spectral}
            bandLevels={bandLevels}
            color={color}
            onToggleBand={toggleBand}
          />
        </>
      )}
    </div>
  );
});
