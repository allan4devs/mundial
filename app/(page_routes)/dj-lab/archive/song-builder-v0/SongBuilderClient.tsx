"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BeatGridPanel } from "./components/BeatGridPanel";
import { ExportPanel } from "./components/ExportPanel";
import { InstantStudioPanel } from "./components/InstantStudioPanel";
import { LayerLoops } from "./components/LayerLoops";
import { LayerRack } from "./components/LayerRack";
import { SamplePool } from "./components/SamplePool";
import { StudioHeader } from "./components/StudioHeader";
import { StudioNotes } from "./components/StudioNotes";
import { TransportBar } from "./components/TransportBar";
import { useInstantStudio } from "./hooks/useInstantStudio";
import { useLatest } from "./hooks/useLatest";
import { useSongEngine } from "./hooks/useSongEngine";
import { useSpectrogram } from "./hooks/useSpectrogram";
import { AUDIO_FILE_RE, WELCOME_MESSAGE } from "./lib/constants";
import { buildPeaks } from "./lib/dsp";
import { shortName, uid } from "./lib/format";
import { createLayer, defaultClip, hasSolo, makeSteps, paletteColor } from "./lib/layer";
import type { InstrumentPreset, LayerPatch } from "./props";
import type { Layer, Sample, TriggerMode } from "./types";

/**
 * The studio shell. It owns the document — samples, layers and the project settings —
 * and hands stable, id-taking callbacks down to the panels. Everything that touches
 * Web Audio lives in `useSongEngine`; everything procedural in `useInstantStudio`.
 */
export default function SongBuilderClient() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [masterGain, setMasterGain] = useState(0.9);
  const [exportSeconds, setExportSeconds] = useState(16);
  const [bpm, setBpm] = useState(78);
  const [focusedLayerId, setFocusedLayerId] = useState<string | null>(null);
  const [message, setMessage] = useState(WELCOME_MESSAGE);

  const sampleColorIdxRef = useRef(0);
  const autoPlayRef = useRef(false);

  const sampleById = useMemo(() => new Map(samples.map((s) => [s.id, s])), [samples]);
  // Mirrors for callbacks that must stay referentially stable for the memoised panels.
  const samplesRef = useLatest(samples);
  const sampleByIdRef = useLatest(sampleById);
  const soloActive = useMemo(() => hasSolo(layers), [layers]);
  const canPlay = useMemo(() => layers.some((l) => l.sampleId), [layers]);

  const focusedLayer = useMemo(
    () => layers.find((l) => l.id === focusedLayerId) ?? null,
    [layers, focusedLayerId],
  );
  const focusedSample = focusedLayer?.sampleId ? sampleById.get(focusedLayer.sampleId) ?? null : null;

  const { spectro, spectroBusy } = useSpectrogram(focusedLayer, focusedSample);

  const engine = useSongEngine({
    layers,
    sampleById,
    masterGain,
    bpm,
    focusedLayerId,
    onMessage: setMessage,
  });
  const { getCtx, start, stop, previewLayer, bounce, forgetSample } = engine;

  // ---------------------------------------------------------------------------
  // Samples
  // ---------------------------------------------------------------------------

  const addFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("audio") || AUDIO_FILE_RE.test(f.name));
      if (!list.length) {
        setMessage("Those files are not audio. Drop an MP3, WAV, or M4A.");
        return;
      }
      try {
        const ctx = await getCtx();
        const added: Sample[] = [];
        for (const file of list) {
          try {
            const data = await file.arrayBuffer();
            const buffer = await ctx.decodeAudioData(data.slice(0));
            added.push({
              id: uid("sample"),
              name: shortName(file.name),
              buffer,
              peaks: buildPeaks(buffer),
              color: paletteColor(sampleColorIdxRef.current++),
              duration: buffer.duration,
            });
          } catch {
            setMessage(`Could not decode ${file.name}.`);
          }
        }
        if (added.length) {
          setSamples((cur) => [...cur, ...added]);
          setMessage(`${added.length} sample(s) ready. Add a layer and chop a slice.`);
        }
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Could not read those files.");
      }
    },
    [getCtx],
  );

  const removeSample = useCallback(
    (id: string) => {
      setSamples((cur) => cur.filter((s) => s.id !== id));
      setLayers((cur) => cur.map((l) => (l.sampleId === id ? { ...l, sampleId: null } : l)));
      forgetSample(id);
    },
    [forgetSample],
  );

  // ---------------------------------------------------------------------------
  // Layers
  // ---------------------------------------------------------------------------

  const addLayer = useCallback(
    (preset?: InstrumentPreset) => {
      // A fresh layer starts on the most recently added sample, as before.
      const pool = samplesRef.current;
      setLayers((cur) => [...cur, createLayer(cur.length, { ...preset, sample: pool[pool.length - 1] ?? null })]);
    },
    [samplesRef],
  );

  const updateLayer = useCallback((id: string, patch: LayerPatch) => {
    setLayers((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((cur) => cur.filter((l) => l.id !== id));
    setFocusedLayerId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleFocus = useCallback((id: string) => {
    setFocusedLayerId((cur) => (cur === id ? null : id));
  }, []);

  const assignSample = useCallback(
    (layerId: string, sampleId: string) => {
      const sample = sampleByIdRef.current.get(sampleId) ?? null;
      setLayers((cur) =>
        cur.map((l) =>
          l.id === layerId
            ? { ...l, sampleId: sample?.id ?? null, sourceBpm: null, ...defaultClip(sample) }
            : l,
        ),
      );
    },
    [sampleByIdRef],
  );

  const setLayerMode = useCallback(
    (layerId: string, mode: TriggerMode) => updateLayer(layerId, { triggerMode: mode }),
    [updateLayer],
  );

  const toggleStep = useCallback((layerId: string, stepIndex: number, value: boolean) => {
    setLayers((cur) =>
      cur.map((l) => {
        if (l.id !== layerId || l.steps[stepIndex] === value) return l;
        const steps = l.steps.slice();
        steps[stepIndex] = value;
        return { ...l, steps };
      }),
    );
  }, []);

  const clearSteps = useCallback((layerId: string) => {
    setLayers((cur) => cur.map((l) => (l.id === layerId ? { ...l, steps: makeSteps() } : l)));
  }, []);

  // ---------------------------------------------------------------------------
  // Instant Studio
  // ---------------------------------------------------------------------------

  /** Replace any previously generated content, keep the user's own uploads, then auto-play. */
  const applyTrack = useCallback(
    (newSamples: Sample[], newLayers: Layer[]) => {
      stop();
      setSamples((cur) => [...cur.filter((s) => !s.generated), ...newSamples]);
      setLayers(newLayers);
      autoPlayRef.current = true;
    },
    [stop],
  );

  const studio = useInstantStudio({
    bpm,
    setBpm,
    getCtx,
    onTrack: applyTrack,
    onMessage: setMessage,
  });

  // After Instant Studio drops in a fresh track, start it playing automatically.
  useEffect(() => {
    if (!autoPlayRef.current || !layers.length) return;
    autoPlayRef.current = false;
    void start();
  }, [layers, start]);

  const { generate: runGenerate } = studio;
  const generate = useCallback(() => void runGenerate(), [runGenerate]);
  const exportWav = useCallback(() => void bounce(exportSeconds), [bounce, exportSeconds]);

  return (
    <main className="min-h-screen bg-[#080a0d] text-slate-100">
      <section className="min-h-screen border-b border-white/10 bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_34%),radial-gradient(circle_at_84%_8%,rgba(56,189,248,0.18),transparent_32%),linear-gradient(180deg,#10131a,#080a0d)]">
        <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <StudioHeader layerCount={layers.length} sampleCount={samples.length} masterGain={masterGain} />

          <InstantStudioPanel
            genre={studio.genre}
            rootPc={studio.rootPc}
            bpm={bpm}
            generating={studio.generating}
            hasGenerated={studio.hasGenerated}
            onPickGenre={studio.pickGenre}
            onPickRoot={studio.setRootPc}
            onBpm={setBpm}
            onGenerate={generate}
            onSurprise={studio.surprise}
            onRemix={studio.remix}
          />

          <TransportBar
            playing={engine.playing}
            canPlay={canPlay}
            elapsed={engine.elapsed}
            bpm={bpm}
            masterGain={masterGain}
            onToggle={engine.toggleTransport}
            onBpm={setBpm}
            onMasterGain={setMasterGain}
          />

          <BeatGridPanel
            layers={layers}
            sampleById={sampleById}
            playing={engine.playing}
            activeStep={engine.activeStep}
            onToggleStep={toggleStep}
            onSetMode={setLayerMode}
            onClearSteps={clearSteps}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid content-start gap-4">
              <SamplePool samples={samples} onAddFiles={addFiles} onRemove={removeSample} />

              <LayerRack
                layers={layers}
                samples={samples}
                sampleById={sampleById}
                soloActive={soloActive}
                playing={engine.playing}
                projectBpm={bpm}
                focusedLayerId={focusedLayerId}
                bandLevels={engine.bandLevels}
                spectro={spectro}
                spectroBusy={spectroBusy}
                onAddLayer={addLayer}
                onToggleFocus={toggleFocus}
                onChange={updateLayer}
                onAssign={assignSample}
                onPreview={previewLayer}
                onRemove={removeLayer}
              />
            </div>

            <aside className="grid content-start gap-4">
              <LayerLoops layers={layers} sampleById={sampleById} playing={engine.playing} />

              <ExportPanel
                seconds={exportSeconds}
                rendering={engine.rendering}
                canExport={canPlay}
                onSeconds={setExportSeconds}
                onExport={exportWav}
              />

              <StudioNotes message={message} />
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
