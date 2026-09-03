/**
 * Prop types for the studio components.
 *
 * They live apart from the components so the shell can import them without
 * pulling in the render tree, and so the shape of the callback surface — every
 * one of them id-taking and stable — is visible in one place.
 */

import type { ReactNode } from "react";

import type { Hit, Song, SongWire, Track, TrackKind } from "@/lib/song-builder/types";
import type { RecorderState } from "./hooks/useRecorder";
import type { Library } from "./hooks/useSongLibrary";

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

export type StatProps = { label: string; value: string };

export type PanelTitleProps = { eyebrow: string; title: string; icon?: ReactNode };

export type PatternGridProps = {
  hits: readonly Hit[];
  steps: number;
  /** Step the speakers are on, or -1 when stopped. */
  playStep: number;
  color: string;
  /** Loudness of the take behind the grid, one value per step. */
  envelope?: number[];
  onToggle: (step: number) => void;
};

export type TrackRowProps = {
  track: Track;
  steps: number;
  playStep: number;
  envelope?: number[];
  /** Recorder state while this row is the one recording, otherwise null. */
  recording: RecorderState | null;
  /** Seconds per beat, for turning the count-in countdown into beats. */
  beatSeconds: number;
  /** Length of one take, shown on the record button. */
  takeSeconds: number;
  /** True once a take exists for this row and can be decoded again. */
  hasTake: boolean;
  busy: boolean;
  onRecord: (kind: TrackKind) => void;
  onCancel: () => void;
  onRedecode: (kind: TrackKind) => void;
  onToggleStep: (kind: TrackKind, step: number) => void;
  onPatch: (kind: TrackKind, patch: Partial<Track>) => void;
  onAudition: (kind: TrackKind) => void;
  onClear: (kind: TrackKind) => void;
};

export type TransportBarProps = {
  song: Song;
  playing: boolean;
  master: number;
  sensitivity: number;
  loopSeconds: number;
  onToggle: () => void;
  onSong: (patch: Partial<Song>) => void;
  onMaster: (value: number) => void;
  onSensitivity: (value: number) => void;
};

export type SongLibraryPanelProps = {
  library: Library;
  song: Song;
  onSong: (patch: Partial<Song>) => void;
  onNew: () => void;
  onDemo: () => void;
};

export type SongCardProps = {
  entry: SongWire;
  active: boolean;
  /** Only this browser's own songs can be deleted, so only they show the button. */
  removable: boolean;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
};
