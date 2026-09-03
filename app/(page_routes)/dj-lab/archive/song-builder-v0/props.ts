/**
 * Prop contracts for every Song Builder component.
 *
 * Handlers here take the id they act on rather than closing over it, so the studio
 * can hand each child a callback whose identity never changes — that is what makes
 * the `React.memo` wrappers actually skip work while the transport is running.
 */

import type React from "react";

import type { GenreId } from "./lib/songForge";
import type { Layer, Sample, SampleMap, Spectral, Spectrogram, TriggerMode } from "./types";

export type LayerPatch = Partial<Layer>;
export type SpectralPatch = Partial<Spectral>;
export type InstrumentPreset = { name: string; color: string };

export type StudioHeaderProps = {
  layerCount: number;
  sampleCount: number;
  masterGain: number;
};

export type InstantStudioPanelProps = {
  genre: GenreId;
  rootPc: number;
  bpm: number;
  generating: boolean;
  hasGenerated: boolean;
  onPickGenre: (id: GenreId) => void;
  onPickRoot: (pitchClass: number) => void;
  onBpm: (bpm: number) => void;
  onGenerate: () => void;
  onSurprise: () => void;
  onRemix: () => void;
};

export type TransportBarProps = {
  playing: boolean;
  canPlay: boolean;
  /** Whole seconds since the transport started. */
  elapsed: number;
  bpm: number;
  masterGain: number;
  onToggle: () => void;
  onBpm: (bpm: number) => void;
  onMasterGain: (gain: number) => void;
};

export type BeatGridPanelProps = {
  layers: Layer[];
  sampleById: SampleMap;
  playing: boolean;
  activeStep: number;
  onToggleStep: (layerId: string, stepIndex: number, value: boolean) => void;
  onSetMode: (layerId: string, mode: TriggerMode) => void;
  onClearSteps: (layerId: string) => void;
};

export type BeatGridRowProps = {
  layer: Layer;
  sample: Sample | null;
  playing: boolean;
  activeStep: number;
  onToggleStep: BeatGridPanelProps["onToggleStep"];
  onSetMode: BeatGridPanelProps["onSetMode"];
  onClearSteps: BeatGridPanelProps["onClearSteps"];
};

export type StepCellProps = {
  layerId: string;
  index: number;
  on: boolean;
  color: string;
  disabled: boolean;
  onToggle: BeatGridPanelProps["onToggleStep"];
};

export type SamplePoolProps = {
  samples: Sample[];
  onAddFiles: (files: FileList | File[] | null) => void;
  onRemove: (sampleId: string) => void;
};

/** Everything a `LayerCard` needs that is not derived from the layer itself. */
export type LayerRackProps = {
  layers: Layer[];
  samples: Sample[];
  sampleById: SampleMap;
  soloActive: boolean;
  playing: boolean;
  projectBpm: number;
  focusedLayerId: string | null;
  bandLevels: number[];
  spectro: Spectrogram | null;
  spectroBusy: boolean;
  onAddLayer: (preset?: InstrumentPreset) => void;
  onToggleFocus: (layerId: string) => void;
  onChange: (layerId: string, patch: LayerPatch) => void;
  onAssign: (layerId: string, sampleId: string) => void;
  onPreview: (layerId: string) => void;
  onRemove: (layerId: string) => void;
};

export type LayerCardProps = Pick<
  LayerRackProps,
  | "samples"
  | "soloActive"
  | "playing"
  | "projectBpm"
  | "bandLevels"
  | "spectro"
  | "spectroBusy"
  | "onToggleFocus"
  | "onChange"
  | "onAssign"
  | "onPreview"
  | "onRemove"
> & {
  layer: Layer;
  /** Already resolved by the rack, so the card never rescans the pool. */
  sample: Sample | null;
  focused: boolean;
};

export type ChopStripProps = {
  sample: Sample;
  layer: Layer;
  onChange: (patch: LayerPatch) => void;
};

export type ChopFieldsProps = ChopStripProps;

export type PlaybackControlsProps = {
  layer: Layer;
  onChange: (patch: LayerPatch) => void;
};

export type BeatMatchControlProps = {
  sourceBpm: number | null;
  speed: number;
  projectBpm: number;
  onMatch: (sourceBpm: number) => void;
};

export type SpectralPanelProps = {
  spectral: Spectral;
  color: string;
  bandLevels: number[];
  spectro: Spectrogram | null;
  spectroBusy: boolean;
  onChange: (patch: SpectralPatch) => void;
};

export type SpectrogramCanvasProps = {
  spectro: Spectrogram | null;
  spectral: Spectral;
  onFocusHz: (hz: number) => void;
};

export type EqCurveCanvasProps = {
  spectral: Spectral;
  centers: number[];
  spectro: Spectrogram | null;
  onBandDb: (index: number, db: number) => void;
  onFocusHz: (hz: number) => void;
};

export type BandMeterProps = {
  centers: number[];
  spectral: Spectral;
  bandLevels: number[];
  color: string;
  onToggleBand: (index: number) => void;
};

export type LayerLoopsProps = {
  layers: Layer[];
  sampleById: SampleMap;
  playing: boolean;
};

export type ExportPanelProps = {
  seconds: number;
  rendering: boolean;
  canExport: boolean;
  onSeconds: (seconds: number) => void;
  onExport: () => void;
};

export type StudioNotesProps = {
  message: string;
};

export type FaderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  accent?: "emerald" | "sky";
  onChange: (value: number) => void;
};

export type StatProps = {
  label: string;
  value: string;
};

export type InfoTileProps = StatProps & {
  icon: React.ReactNode;
};

export type PanelTitleProps = {
  eyebrow: string;
  title: string;
  icon?: React.ReactNode;
};

export type LoopSweepProps = {
  /** Length of one pass, in real seconds. */
  seconds: number;
  loop: boolean;
  playing: boolean;
  /** Any CSS colour — layers pass their own, the rail dims it. */
  background: string;
};
