/**
 * Prop types for the studio components.
 *
 * They live apart from the components so the shell can import them without
 * pulling in the render tree, and so the shape of the callback surface — every
 * one of them kind-taking and stable — is visible in one place.
 */

import type { Hit, Sound, Style, StylePack, TrackKind } from "@/lib/song-builder/types";
import type { RecorderState } from "./hooks/useRecorder";
import type { Take } from "./hooks/useVocalTake";

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

export type PatternGridProps = {
  hits: readonly Hit[];
  /** Step the speakers are on, or -1 when stopped. */
  playStep: number;
  color: string;
  /** Loudness of the take behind the grid, one value per step. */
  envelope?: number[];
  /** Shown over the grid only while the row is empty. */
  hint: string;
  onToggle: (step: number) => void;
};

export type TrackRowProps = {
  kind: TrackKind;
  hits: readonly Hit[];
  /** The sound this row is set to, and every sound it could be set to. */
  sound: Sound;
  options: readonly Sound[];
  playStep: number;
  envelope?: number[];
  /** Recorder state while this row is the one recording, otherwise null. */
  recording: RecorderState | null;
  /** Seconds per beat, for turning the count-in countdown into beats. */
  beatSeconds: number;
  /** Length of one take, shown on the record button. */
  takeSeconds: number;
  /** True while another row is recording. */
  busy: boolean;
  /** True when this row is silenced - the name is the switch. */
  muted: boolean;
  onRecord: (kind: TrackKind) => void;
  onCancel: () => void;
  onToggleStep: (kind: TrackKind, step: number) => void;
  onSound: (kind: TrackKind, soundId: string) => void;
  onMute: (kind: TrackKind) => void;
};

export type TransportBarProps = {
  pack: StylePack;
  bpm: number;
  playing: boolean;
  /** True while a new style pack is on its way from Mongo. */
  loading: boolean;
  sensitivity: number;
  /** True while the microphone is open over the playing loop. */
  singing: boolean;
  /** The last finished mix, once there is one to download. */
  take: Take | null;
  onToggle: () => void;
  onSing: () => void;
  onStyle: (style: Style) => void;
  onBpm: (bpm: number) => void;
  onSensitivity: (value: number) => void;
  onDemo: () => void;
  onClear: () => void;
};
