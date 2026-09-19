"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent, KeyboardEvent, PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Film, GripVertical, Music2, Type, ZoomIn, ZoomOut } from "lucide-react";
import { clamp, clipDuration, durationOf, timeLabel } from "@/lib/video-editor/types";
import type { Asset, Project } from "@/lib/video-editor/types";
import "./timeline.css";

export type TimelineProps = {
  project: Project;
  assets: Asset[];
  time: number;
  onSeek: (time: number) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (project: Project, commit?: boolean) => void;
  onAddAsset: (assetId: string, index?: number) => void;
  disabled?: boolean;
};

type GestureKind = "clip-in" | "clip-out" | "text-start" | "text-end" | "text-move" | "music-in" | "music-out" | "music-move";
type Gesture = {
  kind: GestureKind;
  id: string;
  x: number;
  scroll: number;
  base: Project;
  latest: Project;
  changed: boolean;
};

const ASSET_MIME = "application/x-reel-asset";
const CLIP_MIME = "application/x-reel-clip";
const MIN_LENGTH = 0.1;

function rulerLabel(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

/** All pointer edits derive from the project at pointer-down, then commit once. */
export function Timeline({ project, assets, time, onSeek, selectedId, onSelect, onChange, onAddAsset, disabled = false }: TimelineProps) {
  const [zoom, setZoom] = useState(42);
  const [viewportWidth, setViewportWidth] = useState(700);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const seeking = useRef(false);
  const didFit = useRef(false);
  const assetMap = useMemo(() => new Map(assets.map(asset => [asset.id, asset])), [assets]);
  const duration = durationOf(project);
  const clipLayout = useMemo(() => {
    let start = 0;
    return project.clips.map((clip, index) => {
      const length = clipDuration(clip);
      const item = { clip, index, start, length };
      start += length;
      return item;
    });
  }, [project.clips]);
  const trackWidth = Math.max(viewportWidth, duration * zoom + 100);
  const visibleDuration = trackWidth / zoom;
  const tickStep = zoom < 20 ? 5 : zoom < 38 ? 2 : 1;
  const ticks = Array.from({ length: Math.floor(visibleDuration / tickStep) + 1 }, (_, i) => i * tickStep);
  const musicAsset = project.music ? assetMap.get(project.music.assetId) : undefined;
  const musicLength = project.music ? (project.music.loop ? Math.max(0, duration - project.music.offset) : Math.min(project.music.out - project.music.in, Math.max(0, duration - project.music.offset))) : 0;
  const dropPosition = dropIndex === null ? 0 : (clipLayout[dropIndex]?.start ?? duration) * zoom;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!duration || didFit.current) return;
    didFit.current = true;
    setZoom(clamp((viewportWidth - 72) / duration, 12, 64));
  }, [duration, viewportWidth]);

  function seekAt(clientX: number) {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const seconds = (clientX - scroll.getBoundingClientRect().left + scroll.scrollLeft) / zoom;
    onSeek(clamp(seconds, 0, duration));
  }

  function beginSeek(event: PointerEvent<HTMLElement>) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    seeking.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekAt(event.clientX);
  }

  function moveSeek(event: PointerEvent<HTMLElement>) {
    if (seeking.current) seekAt(event.clientX);
  }

  function endSeek(event: PointerEvent<HTMLElement>) {
    if (!seeking.current) return;
    seeking.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function beginGesture(event: PointerEvent<HTMLElement>, kind: GestureKind, id: string) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(id);
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { kind, id, x: event.clientX, scroll: scrollRef.current?.scrollLeft ?? 0, base: project, latest: project, changed: false };
  }

  function applyGesture(base: Project, kind: GestureKind, id: string, delta: number): Project {
    if (kind.startsWith("clip-")) {
      return { ...base, clips: base.clips.map(clip => {
        if (clip.id !== id) return clip;
        const maximum = assetMap.get(clip.assetId)?.duration ?? clip.out;
        const minLength = Math.min(Math.max(0.05, MIN_LENGTH * clip.speed), maximum);
        return kind === "clip-in"
          ? { ...clip, in: clamp(clip.in + delta * clip.speed, 0, clip.out - minLength) }
          : { ...clip, out: clamp(clip.out + delta * clip.speed, clip.in + minLength, maximum) };
      }) };
    }
    if (kind.startsWith("text-")) {
      const total = durationOf(base);
      return { ...base, texts: base.texts.map(text => {
        if (text.id !== id) return text;
        if (kind === "text-start") return { ...text, start: clamp(text.start + delta, 0, text.end - MIN_LENGTH) };
        if (kind === "text-end") return { ...text, end: clamp(text.end + delta, text.start + MIN_LENGTH, Math.max(total, text.start + MIN_LENGTH)) };
        const length = text.end - text.start;
        const start = clamp(text.start + delta, 0, Math.max(0, total - length));
        return { ...text, start, end: start + length };
      }) };
    }
    if (!base.music) return base;
    const music = base.music;
    if (kind === "music-in") return { ...base, music: { ...music, in: clamp(music.in + delta, 0, music.out - MIN_LENGTH) } };
    if (kind === "music-out") return { ...base, music: { ...music, out: clamp(music.out + delta, music.in + MIN_LENGTH, musicAsset?.duration ?? music.out) } };
    return { ...base, music: { ...music, offset: clamp(music.offset + delta, 0, Math.max(0, durationOf(base) - MIN_LENGTH)) } };
  }

  function moveGesture(event: PointerEvent<HTMLElement>) {
    const edit = gesture.current;
    if (!edit) return;
    event.stopPropagation();
    const delta = (event.clientX - edit.x + (scrollRef.current?.scrollLeft ?? 0) - edit.scroll) / zoom;
    const next = applyGesture(edit.base, edit.kind, edit.id, delta);
    const before = edit.kind.startsWith("clip-") ? edit.latest.clips.find(clip => clip.id === edit.id) : edit.kind.startsWith("text-") ? edit.latest.texts.find(text => text.id === edit.id) : edit.latest.music;
    const after = edit.kind.startsWith("clip-") ? next.clips.find(clip => clip.id === edit.id) : edit.kind.startsWith("text-") ? next.texts.find(text => text.id === edit.id) : next.music;
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    edit.latest = next;
    edit.changed = true;
    onChange(next, false);
  }

  function endGesture(event: PointerEvent<HTMLElement>, cancel = false) {
    const edit = gesture.current;
    if (!edit) return;
    event.stopPropagation();
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    // Committing the unchanged base also closes the parent's pending gesture.
    if (edit.changed) onChange(cancel ? edit.base : edit.latest, true);
  }

  function keyboardTrim(event: KeyboardEvent<HTMLElement>, kind: GestureKind, id: string) {
    if (disabled || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    onChange(applyGesture(project, kind, id, (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 1 : 0.1)), true);
  }

  function handleProps(kind: GestureKind, id: string, label: string, value: number, max: number, min = 0) {
    return {
      role: "slider" as const,
      tabIndex: disabled ? -1 : 0,
      "aria-label": label,
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": value,
      "aria-valuetext": timeLabel(value),
      "aria-orientation": "horizontal" as const,
      "aria-disabled": disabled,
      title: `${label} · arrastra o usa ← →`,
      onPointerDown: (event: PointerEvent<HTMLElement>) => beginGesture(event, kind, id),
      onPointerMove: moveGesture,
      onPointerUp: (event: PointerEvent<HTMLElement>) => endGesture(event),
      onPointerCancel: (event: PointerEvent<HTMLElement>) => endGesture(event, true),
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => keyboardTrim(event, kind, id),
      onClick: (event: React.MouseEvent) => event.stopPropagation(),
      onDragStart: (event: DragEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); },
      draggable: false,
    };
  }

  function reorder(id: string, targetIndex: number) {
    const oldIndex = project.clips.findIndex(clip => clip.id === id);
    if (oldIndex < 0) return;
    const clips = [...project.clips];
    const [clip] = clips.splice(oldIndex, 1);
    clips.splice(clamp(targetIndex, 0, clips.length), 0, clip);
    if (clips.every((item, index) => item.id === project.clips[index].id)) return;
    onChange({ ...project, clips }, true);
    onSelect(id);
  }

  function insertionAt(clientX: number) {
    const scroll = scrollRef.current;
    if (!scroll) return project.clips.length;
    const seconds = (clientX - scroll.getBoundingClientRect().left + scroll.scrollLeft) / zoom;
    const index = clipLayout.findIndex(item => seconds < item.start + item.length / 2);
    return index < 0 ? project.clips.length : index;
  }

  function dragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled || ![ASSET_MIME, CLIP_MIME].some(type => event.dataTransfer.types.includes(type))) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(CLIP_MIME) ? "move" : "copy";
    setDropIndex(insertionAt(event.clientX));
    const scroll = scrollRef.current;
    if (scroll) {
      const rect = scroll.getBoundingClientRect();
      if (event.clientX > rect.right - 36) scroll.scrollLeft += 18;
      else if (event.clientX < rect.left + 36) scroll.scrollLeft -= 18;
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDropIndex(null);
    setDragging(null);
    if (disabled) return;
    const index = insertionAt(event.clientX);
    const clipId = event.dataTransfer.getData(CLIP_MIME);
    const assetId = event.dataTransfer.getData(ASSET_MIME);
    if (clipId) {
      const sourceIndex = project.clips.findIndex(clip => clip.id === clipId);
      reorder(clipId, sourceIndex < index ? index - 1 : index);
    } else if (assetId) onAddAsset(assetId, index);
  }

  return (
    <section className="ve-timeline" aria-label="Línea de tiempo" data-testid="reel-timeline">
      <div className="ve-timeline-heading">
        <div className="ve-timeline-heading-title"><span>Línea de tiempo</span><span className="ve-timeline-count">{project.clips.length} clips · {timeLabel(duration)}</span></div>
        <div className="ve-timeline-zoom">
          <button type="button" aria-label="Alejar línea de tiempo" disabled={zoom <= 12} onClick={() => setZoom(value => Math.max(12, value - 8))}><ZoomOut size={14} /></button>
          <input aria-label="Zoom de la línea de tiempo" type="range" min="12" max="100" step="1" value={zoom} onChange={event => setZoom(Number(event.target.value))} />
          <button type="button" aria-label="Acercar línea de tiempo" disabled={zoom >= 100} onClick={() => setZoom(value => Math.min(100, value + 8))}><ZoomIn size={14} /></button>
          <button type="button" className="ve-timeline-fit" onClick={() => setZoom(clamp((viewportWidth - 72) / Math.max(duration, 1), 12, 100))}>Ajustar</button>
        </div>
      </div>
      <div className="ve-timeline-body">
        <div className="ve-timeline-labels" aria-hidden="true">
          <div className="ve-timeline-label-spacer" />
          <div className="ve-timeline-label ve-timeline-video-label"><Film size={15} /><span>Video</span></div>
          <div className="ve-timeline-label"><Type size={14} /><span>Texto</span></div>
          <div className="ve-timeline-label"><Music2 size={14} /><span>Audio</span></div>
        </div>
        <div className="ve-timeline-scroll" ref={scrollRef}>
          <div className="ve-timeline-tracks" style={{ width: trackWidth }}>
            <div className="ve-timeline-ruler" role="slider" tabIndex={disabled ? -1 : 0} aria-label="Posición de reproducción" aria-valuemin={0} aria-valuemax={duration} aria-valuenow={clamp(time, 0, duration)} aria-valuetext={timeLabel(time)} aria-disabled={disabled} onPointerDown={beginSeek} onPointerMove={moveSeek} onPointerUp={endSeek} onPointerCancel={endSeek} onKeyDown={event => {
              if (disabled) return;
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                onSeek(event.key === "Home" ? 0 : event.key === "End" ? duration : clamp(time + (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1 : 0.1), 0, duration));
              }
            }}>
              {ticks.map(tick => <span key={tick} className="ve-timeline-tick" style={{ left: tick * zoom }}>{rulerLabel(tick)}</span>)}
            </div>
            <div className={`ve-timeline-track ve-timeline-video-track${dropIndex !== null ? " is-dropping" : ""}`} onDragOver={dragOver} onDrop={drop} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropIndex(null); }} onPointerDown={event => { if (event.target === event.currentTarget) { onSelect(null); beginSeek(event); } }} onPointerMove={moveSeek} onPointerUp={endSeek} onPointerCancel={endSeek}>
              {!project.clips.length ? <div className="ve-timeline-empty"><Film size={18} /><span>Arrastra tus videos aquí para empezar</span></div> : null}
              {clipLayout.map(({ clip, index, start, length }) => {
                const asset = assetMap.get(clip.assetId);
                const selected = selectedId === clip.id;
                const width = Math.max(2, length * zoom - 3);
                const thumbnailStyle: CSSProperties = asset?.thumbnail ? { backgroundImage: `url(${JSON.stringify(asset.thumbnail)})` } : {};
                return (
                  <div key={clip.id} role="button" tabIndex={disabled ? -1 : 0} aria-label={`Clip ${index + 1}: ${asset?.name ?? "Video"}, ${timeLabel(length)}. Alt y flechas para reordenar.`} aria-pressed={selected} aria-disabled={disabled} data-testid={`timeline-clip-${clip.id}`} className={`ve-timeline-clip${selected ? " is-selected" : ""}${dragging === clip.id ? " is-dragging" : ""}`} style={{ left: start * zoom, width }} draggable={!disabled} onDragStart={event => { event.dataTransfer.setData(CLIP_MIME, clip.id); event.dataTransfer.effectAllowed = "move"; setDragging(clip.id); onSelect(clip.id); }} onDragEnd={() => { setDragging(null); setDropIndex(null); }} onClick={() => { if (!disabled) onSelect(clip.id); }} onDoubleClick={() => { if (!disabled) { onSelect(clip.id); onSeek(start); } }} onKeyDown={event => {
                    if (disabled || event.target !== event.currentTarget) return;
                    if (event.altKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); reorder(clip.id, index + (event.key === "ArrowLeft" ? -1 : 1)); }
                    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect(clip.id); onSeek(start); }
                  }}>
                    <div className={`ve-timeline-clip-image${asset?.thumbnail ? " has-image" : ""}`} style={thumbnailStyle} />
                    <span className="ve-timeline-clip-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="ve-timeline-clip-caption"><span>{asset?.name ?? "Video"}</span><small>{timeLabel(length)}{clip.speed !== 1 ? ` · ${clip.speed}×` : ""}</small></div>
                    {selected && width > 95 ? <div className="ve-timeline-order"><button type="button" disabled={disabled || index === 0} aria-label="Mover clip antes" onClick={event => { event.stopPropagation(); reorder(clip.id, index - 1); }}><ChevronLeft size={12} /></button><GripVertical size={10} /><button type="button" disabled={disabled || index === project.clips.length - 1} aria-label="Mover clip después" onClick={event => { event.stopPropagation(); reorder(clip.id, index + 1); }}><ChevronRight size={12} /></button></div> : null}
                    <span className="ve-timeline-handle ve-timeline-handle-start" {...handleProps("clip-in", clip.id, `Inicio del clip ${index + 1}`, clip.in, clip.out - Math.max(0.05, MIN_LENGTH * clip.speed))} />
                    <span className="ve-timeline-handle ve-timeline-handle-end" {...handleProps("clip-out", clip.id, `Final del clip ${index + 1}`, clip.out, asset?.duration ?? clip.out, clip.in + Math.max(0.05, MIN_LENGTH * clip.speed))} />
                  </div>
                );
              })}
              {dropIndex !== null ? <div className="ve-timeline-insertion" style={{ left: dropPosition }}><span>Insertar</span></div> : null}
            </div>
            <div className="ve-timeline-track ve-timeline-text-track">
              {!project.texts.length ? <span className="ve-timeline-track-hint">Tus títulos aparecerán aquí</span> : null}
              {project.texts.map((text, index) => (
                <div key={text.id} className={`ve-timeline-text${selectedId === text.id ? " is-selected" : ""}`} style={{ left: text.start * zoom, width: Math.max(8, (text.end - text.start) * zoom - 2), top: index % 2 ? 8 : 3 }} role="button" tabIndex={disabled ? -1 : 0} aria-label={`Texto: ${text.text}. Flechas para mover.`} aria-pressed={selectedId === text.id} onPointerDown={event => beginGesture(event, "text-move", text.id)} onPointerMove={moveGesture} onPointerUp={event => endGesture(event)} onPointerCancel={event => endGesture(event, true)} onClick={() => { if (!disabled) onSelect(text.id); }} onDoubleClick={() => { if (!disabled) onSeek(text.start); }} onKeyDown={event => { if (disabled || event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect(text.id); } else keyboardTrim(event, "text-move", text.id); }}>
                  <Type size={12} /><span>{text.text || "Texto"}</span>
                  <span className="ve-timeline-handle ve-timeline-handle-start" {...handleProps("text-start", text.id, "Inicio del texto", text.start, text.end - MIN_LENGTH)} />
                  <span className="ve-timeline-handle ve-timeline-handle-end" {...handleProps("text-end", text.id, "Final del texto", text.end, Math.max(duration, text.end), text.start + MIN_LENGTH)} />
                </div>
              ))}
            </div>
            <div className="ve-timeline-track ve-timeline-music-track" onDragOver={event => { if (!disabled && event.dataTransfer.types.includes(ASSET_MIME)) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } }} onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData(ASSET_MIME); if (!disabled && assetMap.get(id)?.kind === "audio") onAddAsset(id); }}>
              {project.music ? (
                <div className={`ve-timeline-music${selectedId === "music" ? " is-selected" : ""}`} style={{ left: project.music.offset * zoom, width: Math.max(12, musicLength * zoom - 2) }} role="button" tabIndex={disabled ? -1 : 0} aria-label={`Música: ${musicAsset?.name ?? "Audio"}. Flechas para mover.`} aria-pressed={selectedId === "music"} onPointerDown={event => beginGesture(event, "music-move", "music")} onPointerMove={moveGesture} onPointerUp={event => endGesture(event)} onPointerCancel={event => endGesture(event, true)} onClick={() => { if (!disabled) onSelect("music"); }} onKeyDown={event => { if (disabled || event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect("music"); } else keyboardTrim(event, "music-move", "music"); }}>
                  <div className="ve-timeline-audio-pattern" aria-hidden="true" />
                  <Music2 size={12} /><span>{musicAsset?.name ?? "Audio"}{project.music.loop ? " · Repetir" : ""}</span>
                  <span className="ve-timeline-handle ve-timeline-handle-start" {...handleProps("music-in", "music", "Inicio del audio original", project.music.in, project.music.out - MIN_LENGTH)} />
                  {!project.music.loop ? <span className="ve-timeline-handle ve-timeline-handle-end" {...handleProps("music-out", "music", "Final del audio original", project.music.out, musicAsset?.duration ?? project.music.out, project.music.in + MIN_LENGTH)} /> : null}
                </div>
              ) : <span className="ve-timeline-track-hint">Arrastra música para darle ritmo</span>}
            </div>
            <div className="ve-timeline-playhead" style={{ left: clamp(time, 0, duration) * zoom }} aria-hidden="true"><span onPointerDown={beginSeek} onPointerMove={moveSeek} onPointerUp={endSeek} onPointerCancel={endSeek} /></div>
          </div>
        </div>
      </div>
      <div className="ve-timeline-footer"><span>Arrastra para ordenar · bordes para recortar</span><span>← → precisión de 0.1 s · Shift: 1 s</span></div>
    </section>
  );
}

export default Timeline;
