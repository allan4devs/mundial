"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { clamp, dimensions, durationOf, locateClip, type Asset, type Project, type TextLayer } from "@/lib/video-editor/types";
import { clipOpacity, drawTextLayer, drawVideoFrame, textBounds, type TextBounds } from "@/lib/video-editor/render";

export type PreviewProps = {
  project: Project;
  assets: Asset[];
  time: number;
  playing: boolean;
  onTime: (time: number) => void;
  onPlaying: (playing: boolean) => void;
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
  onTextChange: (id: string, patch: Partial<TextLayer>, commit?: boolean) => void;
  onError: (message: string) => void;
  safeArea?: boolean;
};

type Drag = {
  id: string;
  mode: "move" | "resize";
  pointerId: number;
  startX: number;
  startY: number;
  layer: TextLayer;
  patch: Partial<TextLayer>;
};

type VideoRecord = { video: HTMLVideoElement; key: string; pendingPlay: boolean };

export default function Preview(props: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  const clock = useRef(props.time);
  const seekVersion = useRef(0);
  const published = useRef(new Set<number>());
  const drag = useRef<Drag | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bounds, setBounds] = useState<TextBounds | null>(null);
  const { width, height } = dimensions(props.project.aspect, 720);

  useLayoutEffect(() => { latest.current = props; });

  useLayoutEffect(() => {
    // A parent acknowledging our clock is not a seek. Slider and keyboard changes are.
    const acknowledged = published.current.delete(props.time);
    if (!props.playing) published.current.clear();
    if (!acknowledged || (!props.playing && Math.abs(clock.current - props.time) > 0.001)) {
      clock.current = props.time;
      seekVersion.current++;
    }
  }, [props.time, props.playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const cache = new Map<string, VideoRecord>();
    const music = document.createElement("audio");
    music.preload = "auto";
    let audioKey = "";
    let audioPlayPending = false;
    let active: VideoRecord | null = null;
    let signature = "";
    let previousSeek = -1;
    let frame = 0;
    let disposed = false;
    let lastPublish = 0;
    let wasLoading = false;
    let previousFailure = "";
    let previousBounds = "";
    let renderedKey = "";
    let renderedProject: Project | null = null;
    const reported = new Set<string>();

    function report(message: string, key: string) {
      if (disposed) return;
      if (latest.current.playing) latest.current.onPlaying(false);
      if (!reported.has(key)) {
        setFailed(true);
        reported.add(key);
        latest.current.onError(message);
      }
    }

    function publish(time: number, now: number, force = false) {
      if (!force && now - lastPublish < 32) return;
      lastPublish = now;
      published.current.add(time);
      if (published.current.size > 20) published.current.delete(published.current.values().next().value!);
      latest.current.onTime(time);
    }

    function release(record: VideoRecord) {
      record.video.pause();
      record.video.removeAttribute("src");
      record.video.load();
    }

    function getVideo(asset: Asset) {
      const key = `${asset.id}:${asset.url}`;
      let record = cache.get(key);
      if (record) return record;
      const video = document.createElement("video");
      video.preload = "auto";
      video.playsInline = true;
      video.preservesPitch = true;
      video.crossOrigin = "anonymous";
      video.src = asset.url;
      video.addEventListener("error", () => {
        if (active?.video === video) report(`No se pudo reproducir ${asset.name}. Prueba con un MP4 H.264.`, key);
      });
      record = { video, key, pendingPlay: false };
      cache.set(key, record);
      return record;
    }

    music.addEventListener("error", () => report("No se pudo reproducir la música seleccionada.", `audio:${audioKey}`));

    function syncMusic(time: number, total: number, shouldPlay: boolean) {
      const { project, assets } = latest.current;
      const track = project.music;
      const asset = track ? assets.find((item) => item.id === track.assetId) : undefined;
      if (!track || !asset) {
        music.pause();
        if (audioKey) {
          music.removeAttribute("src");
          music.load();
          audioKey = "";
        }
        return;
      }
      const key = `${asset.id}:${asset.url}`;
      if (audioKey !== key) {
        music.pause();
        audioKey = key;
        music.src = asset.url;
        music.load();
      }
      const length = track.out - track.in;
      const end = track.loop ? total : Math.min(total, track.offset + length);
      if (length <= 0 || time < track.offset || time >= end) {
        music.pause();
        return;
      }
      const elapsed = time - track.offset;
      const target = track.in + (elapsed % length);
      const window = end - track.offset;
      const fadeIn = Math.min(track.fadeIn, window / 2);
      const fadeOut = Math.min(track.fadeOut, window / 2);
      const envelope = clamp(Math.min(1, fadeIn > 0 ? elapsed / fadeIn : 1, fadeOut > 0 ? (end - time) / fadeOut : 1), 0, 1);
      music.volume = clamp(track.volume * envelope, 0, 1);
      if (music.readyState >= 1 && Math.abs(music.currentTime - target) > (shouldPlay ? 0.16 : 0.02)) music.currentTime = target;
      if (!shouldPlay) music.pause();
      else if (music.paused && !audioPlayPending && music.readyState >= 2) {
        audioPlayPending = true;
        void music.play().catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          report("No se pudo iniciar el audio. Vuelve a pulsar reproducir.", `audio-play:${audioKey}`);
        }).finally(() => { audioPlayPending = false; });
      }
    }

    function tick(now: number) {
      if (disposed || !canvas || !context) return;
      const state = latest.current;
      const total = durationOf(state.project);
      clock.current = clamp(clock.current, 0, total);
      const located = locateClip(state.project, clock.current);
      const asset = located ? state.assets.find((item) => item.id === located.clip.assetId) : undefined;
      let isLoading = false;
      let musicShouldPlay = false;

      if (located && asset) {
        const { clip, start, duration } = located;
        const record = getVideo(asset);
        const video = record.video;
        const nextSignature = `${clip.id}:${asset.url}:${clip.in}:${clip.out}:${clip.speed}`;
        if (signature !== nextSignature || previousSeek !== seekVersion.current) {
          active?.video.pause();
          active = record;
          signature = nextSignature;
          previousSeek = seekVersion.current;
          // Metadata may not have arrived yet. This marker is consumed below.
          video.dataset.seekTarget = String(Math.min(clip.out - 0.001, clip.in + located.local * clip.speed));
          if (previousFailure !== record.key) {
            previousFailure = record.key;
            setFailed(false);
          }
          if (video.error) report(`No se pudo reproducir ${asset.name}. Prueba con un MP4 H.264.`, record.key);
        }
        if (video.readyState >= 1 && video.dataset.seekTarget !== undefined) {
          const target = Math.max(clip.in, Number(video.dataset.seekTarget));
          if (Math.abs(video.currentTime - target) > 0.005) video.currentTime = target;
          delete video.dataset.seekTarget;
        }
        video.playbackRate = clip.speed;
        video.volume = clamp(clip.volume * clipOpacity(clip, located.local), 0, 1);
        isLoading = video.readyState < 2 || video.seeking || video.dataset.seekTarget !== undefined;
        const reachedEnd = !isLoading && (video.ended || video.currentTime >= clip.out - 0.015);
        if (!state.playing) video.pause();
        else if (reachedEnd) {
          video.pause();
          clock.current = start + duration;
          if (clock.current >= total - 0.001) {
            clock.current = total;
            state.onPlaying(false);
          }
          publish(clock.current, now, true);
        } else if (!isLoading && video.paused && !record.pendingPlay && clock.current < total) {
          record.pendingPlay = true;
          void video.play().then(() => {
            if (!disposed && active === record) setFailed(false);
          }).catch((error: unknown) => {
            if (disposed || active !== record) return;
            if (error instanceof DOMException && error.name === "AbortError") return;
            report("No se pudo iniciar el video. Vuelve a pulsar reproducir.", `play:${record.key}`);
          }).finally(() => { record.pendingPlay = false; });
        }

        if (state.playing && !isLoading && !video.paused && !reachedEnd) {
          const local = clamp((video.currentTime - clip.in) / clip.speed, 0, duration);
          clock.current = start + local;
          musicShouldPlay = video.readyState >= 3;
          publish(clock.current, now);
        }
        // Keep just the current clip and its successor warm; a large folder stays lightweight.
        const nextClip = state.project.clips[located.index + 1];
        const nextAsset = nextClip ? state.assets.find((item) => item.id === nextClip.assetId) : undefined;
        const nextRecord = nextAsset ? getVideo(nextAsset) : undefined;
        if (nextRecord && nextRecord !== record && nextRecord.video.readyState >= 1) {
          const cue = `${nextClip.id}:${nextClip.in}`;
          if (nextRecord.video.dataset.cue !== cue) {
            nextRecord.video.dataset.cue = cue;
            nextRecord.video.currentTime = nextClip.in;
          }
        }
        for (const [key, candidate] of cache) {
          if (candidate !== record && candidate !== nextRecord) {
            release(candidate);
            cache.delete(key);
          }
        }
      } else {
        active = null;
        signature = "";
        for (const record of cache.values()) release(record);
        cache.clear();
        // The library owner reports missing files once loading completes.
      }
      syncMusic(clock.current, total, state.playing && musicShouldPlay);
      const nextRenderedKey = `${signature}:${canvas.width}:${canvas.height}:${clock.current}:${active?.video.currentTime}:${active?.video.readyState}:${active?.video.seeking}:${state.selectedTextId}`;
      // Paused edits only redraw when their image changes, avoiding a permanent GPU workload.
      if (renderedProject !== state.project || renderedKey !== nextRenderedKey) {
        renderedProject = state.project;
        renderedKey = nextRenderedKey;
        if (located && asset && active) {
          drawVideoFrame(context, active.video, located.clip, clamp(clock.current - located.start, 0, located.duration), canvas.width, canvas.height);
        } else {
          context.fillStyle = "#000000";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        for (const layer of state.project.texts) {
          if (clock.current >= layer.start && clock.current < layer.end) drawTextLayer(context, layer, canvas.width, canvas.height);
        }
        const selection = state.project.texts.find((layer) => layer.id === state.selectedTextId && clock.current >= layer.start && clock.current < layer.end);
        const nextBounds = selection ? textBounds(context, selection, canvas.width, canvas.height) : null;
        const boundsKey = JSON.stringify(nextBounds);
        if (boundsKey !== previousBounds) {
          previousBounds = boundsKey;
          setBounds(nextBounds);
        }
      }
      if (isLoading !== wasLoading) { wasLoading = isLoading; setLoading(isLoading); }
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      for (const record of cache.values()) release(record);
      cache.clear();
      music.pause();
      music.removeAttribute("src");
      music.load();
    };
  }, []);

  function point(event: PointerEvent<HTMLElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  }

  function startDrag(event: PointerEvent<HTMLElement>, mode: "move" | "resize" = "move") {
    if (event.button !== 0 || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    const p = point(event);
    const layer = mode === "resize"
      ? props.project.texts.find((item) => item.id === props.selectedTextId)
      : [...props.project.texts].reverse().find((item) => {
        if (props.time < item.start || props.time >= item.end) return false;
        const box = textBounds(context, item, width, height);
        return p.x * width >= box.x && p.x * width <= box.x + box.width && p.y * height >= box.y && p.y * height <= box.y + box.height;
      });
    props.onSelectText(layer?.id ?? null);
    if (!layer) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    props.onPlaying(false);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: layer.id, mode, pointerId: event.pointerId, startX: p.x, startY: p.y, layer: { ...layer }, patch: {} };
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current || !canvasRef.current || event.pointerId !== current.pointerId) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    const p = point(event);
    if (current.mode === "resize") {
      const initialDistance = Math.hypot((current.startX - current.layer.x) * width, (current.startY - current.layer.y) * height);
      const distance = Math.hypot((p.x - current.layer.x) * width, (p.y - current.layer.y) * height);
      current.patch = { size: clamp(current.layer.size * distance / Math.max(1, initialDistance), 0.02, 0.25) };
    } else {
      const box = textBounds(context, current.layer, width, height);
      const marginX = Math.min(0.5, box.width / (2 * width));
      const marginY = Math.min(0.5, box.height / (2 * height));
      current.patch = { x: clamp(current.layer.x + p.x - current.startX, marginX, 1 - marginX), y: clamp(current.layer.y + p.y - current.startY, marginY, 1 - marginY) };
    }
    props.onTextChange(current.id, current.patch, false);
  }

  function finishDrag(event: PointerEvent<HTMLElement>, cancelled = false) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const patch = cancelled ? { x: current.layer.x, y: current.layer.y, size: current.layer.size } : current.patch;
    if (Object.keys(patch).length) props.onTextChange(current.id, patch, true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const layer = props.project.texts.find((item) => item.id === props.selectedTextId);
    if (!layer || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 0.025 : 0.005;
    props.onTextChange(layer.id, {
      x: clamp(layer.x + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0), 0.05, 0.95),
      y: clamp(layer.y + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0), 0.05, 0.95),
    }, true);
  }

  return (
    <div className="vp-preview" data-aspect={props.project.aspect} style={{ aspectRatio: `${width}/${height}`, "--vp-ratio": width / height } as CSSProperties}>
      <canvas ref={canvasRef} width={width} height={height} className="vp-canvas" aria-label="Vista previa de tu video" />
      <div
        className="vp-surface"
        tabIndex={0}
        role="group"
        aria-label="Selecciona y arrastra el texto. Usa las flechas para moverlo."
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => finishDrag(event)}
        onPointerCancel={(event) => finishDrag(event, true)}
        onKeyDown={onKeyDown}
      >
        {props.safeArea && props.project.clips.length > 0 && <div className="vp-safe-area" aria-hidden="true"><span>Área segura</span></div>}
        {bounds && (
          <div className="vp-text-selection" style={{ left: `${bounds.x / width * 100}%`, top: `${bounds.y / height * 100}%`, width: `${bounds.width / width * 100}%`, height: `${bounds.height / height * 100}%` }}>
            <button type="button" className="vp-resize" aria-label="Arrastra para cambiar el tamaño del texto" onPointerDown={(event) => startDrag(event, "resize")} />
          </div>
        )}
      </div>
      {props.project.clips.length === 0 && <div className="vp-empty"><span>Tu próxima gran idea.</span><small>Arrastra clips a la línea de tiempo</small></div>}
      {loading && props.project.clips.length > 0 && !failed && <div className="vp-loading" role="status"><span className="vp-spinner" />Cargando vista previa</div>}
      {failed && <div className="vp-loading" role="status">No se pudo cargar este archivo.</div>}
    </div>
  );
}
