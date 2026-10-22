"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Download, ImagePlus, LoaderCircle, Play, RotateCcw, Sparkles, Upload, Video } from "lucide-react";
import "./auto-ad.css";

const WIDTH = 720;
const HEIGHT = 1280;
const MOVEMENTS = ["Fade", "Deslizar izquierda", "Deslizar derecha", "Subir", "Bajar", "Zoom in", "Zoom out", "Giro", "Rebote", "Desenfoque"];

type Media = { file: File; url: string; kind: "image" | "video" };

function ease(value: number) { return 1 - (1 - value) ** 3; }

function wrap(context: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= width) line = candidate;
      else { if (line) lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

function getScenes(copy: string) {
  return copy.split(/\n+/).flatMap(line => line.match(/[^.!?]+[.!?]?/g) ?? []).map(line => line.trim()).filter(Boolean);
}

export default function AutoAd() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const mediaRef = useRef<Media | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clockRef = useRef(0);
  const [media, setMedia] = useState<Media | null>(null);
  const [copy, setCopy] = useState("Tu marca merece destacar.\nDescubre algo extraordinario.");
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const scenes = getScenes(copy);
  const sceneTexts = scenes.length ? scenes : ["Escribe tu anuncio aquí"];
  const duration = Math.min(30, Math.max(10, sceneTexts.length * 3.5));
  const sceneDuration = duration / sceneTexts.length;

  useEffect(() => {
    mediaRef.current = media;
    return () => { if (media?.url) URL.revokeObjectURL(media.url); };
  }, [media]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0;
    let last = performance.now();
    let clock = clockRef.current;
    const draw = (now: number) => {
      if (playing) {
        clock += Math.min(0.08, (now - last) / 1000);
        if (clock >= duration) clock = 0;
        clockRef.current = clock;
        setTime(value => Math.floor(value) === Math.floor(clock) && Math.floor(value / sceneDuration) === Math.floor(clock / sceneDuration) ? value : clock);
      } else clock = clockRef.current;
      last = now;
      context.clearRect(0, 0, WIDTH, HEIGHT);
      const loaded = mediaRef.current?.kind === "video" ? videoRef.current : imageRef.current;
      if (loaded instanceof HTMLVideoElement && loaded.readyState >= 2) {
        const naturalWidth = loaded.videoWidth;
        const naturalHeight = loaded.videoHeight;
        const scale = Math.max(WIDTH / naturalWidth, HEIGHT / naturalHeight);
        const width = naturalWidth * scale;
        const height = naturalHeight * scale;
        context.drawImage(loaded, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
      } else if (loaded instanceof HTMLImageElement && loaded.complete && loaded.naturalWidth > 0) {
        const scale = Math.max(WIDTH / loaded.naturalWidth, HEIGHT / loaded.naturalHeight);
        const width = loaded.naturalWidth * scale;
        const height = loaded.naturalHeight * scale;
        context.drawImage(loaded, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
      } else {
        const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
        gradient.addColorStop(0, "#163b3b"); gradient.addColorStop(1, "#80613e");
        context.fillStyle = gradient; context.fillRect(0, 0, WIDTH, HEIGHT);
      }
      const shade = context.createLinearGradient(0, 0, 0, HEIGHT);
      shade.addColorStop(0, "rgba(6,12,16,.18)"); shade.addColorStop(.48, "rgba(6,12,16,.42)"); shade.addColorStop(1, "rgba(6,12,16,.78)");
      context.fillStyle = shade; context.fillRect(0, 0, WIDTH, HEIGHT);

      const sceneIndex = Math.min(sceneTexts.length - 1, Math.floor(clock / sceneDuration));
      const sceneTime = clock - sceneIndex * sceneDuration;
      const entrance = ease(Math.min(1, sceneTime / 0.55));
      const exit = Math.min(1, (sceneDuration - sceneTime) / 0.18);
      const movement = sceneIndex % MOVEMENTS.length;
      const distance = 86 * (1 - entrance);
      let x = 0; let y = 0; let scale = 1; let rotation = 0; let alpha = 1; let blur = 0;
      alpha = exit;
      if (movement === 0) alpha *= entrance;
      if (movement === 1) x = -distance;
      if (movement === 2) x = distance;
      if (movement === 3) y = distance;
      if (movement === 4) y = -distance;
      if (movement === 5) scale = .78 + .22 * entrance;
      if (movement === 6) scale = 1.2 - .2 * entrance;
      if (movement === 7) rotation = (1 - entrance) * -.12;
      if (movement === 8) y = -Math.sin(entrance * Math.PI) * 46 * (1 - entrance);
      if (movement === 9) blur = Math.round((1 - entrance) * 12);

      context.save(); context.translate(WIDTH / 2 + x, HEIGHT * .58 + y); context.rotate(rotation); context.scale(scale, scale); context.globalAlpha = alpha;
      context.filter = `blur(${blur}px)`;
      context.font = "800 72px Arial, sans-serif"; context.textAlign = "center"; context.textBaseline = "middle";
      context.shadowColor = "rgba(0,0,0,.34)"; context.shadowBlur = 28; context.shadowOffsetY = 6;
      const lines = wrap(context, sceneTexts[sceneIndex], WIDTH * .82);
      const lineHeight = 86;
      lines.forEach((line, index) => context.fillText(line, 0, (index - (lines.length - 1) / 2) * lineHeight, WIDTH * .82));
      context.restore();

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [copy, duration, playing, sceneDuration, sceneTexts.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [media, playing]);

  function importMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) { setError("Elige una imagen o un video."); return; }
    setError(""); setPlaying(true); clockRef.current = 0; setTime(0);
    setMedia({ file, url: URL.createObjectURL(file), kind: file.type.startsWith("video/") ? "video" : "image" });
  }

  async function exportMp4() {
    const canvas = canvasRef.current;
    if (!canvas || exporting) return;
    if (typeof MediaRecorder === "undefined" || (!MediaRecorder.isTypeSupported("video/webm;codecs=vp9") && !MediaRecorder.isTypeSupported("video/webm;codecs=vp8"))) { setError("Este navegador no puede grabar el anuncio. Prueba Chrome o Edge actualizado."); return; }
    setError(""); setExporting(true); setPlaying(false); clockRef.current = 0; setTime(0);
    try {
      await new Promise(resolve => window.setTimeout(resolve, 100));
      setPlaying(true);
      await new Promise(resolve => window.setTimeout(resolve, 150));
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm;codecs=vp8";
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
      const chunks: BlobPart[] = [];
      const stopped = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => reject(new Error("No se pudo grabar el anuncio."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      });
      recorder.start(250);
      await new Promise(resolve => window.setTimeout(resolve, duration * 1000 + 250));
      recorder.stop();
      const webm = await stopped;
      stream.getTracks().forEach(track => track.stop());
      const data = new FormData(); data.set("video", webm, "auto-ad.webm");
      data.set("duration", String(duration));
      const response = await fetch("/api/video-editor/quick-ad", { method: "POST", body: data });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "No se pudo crear el MP4."); }
      const mp4 = await response.blob();
      const url = URL.createObjectURL(mp4); const link = document.createElement("a");
      link.href = url; link.download = "mi-anuncio.mp4"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo exportar el MP4."); }
    finally { setExporting(false); }
  }

  const currentScene = Math.min(sceneTexts.length - 1, Math.floor(time / sceneDuration));
  const movementIndex = currentScene % MOVEMENTS.length;
  return <main className="aa-page">
    <header className="aa-header"><a href="/video-generator"><ArrowLeft size={17} /> Reel Studio</a><span className="aa-brand"><Sparkles size={16} /> AUTO AD</span><a href="/video-generator" className="aa-editor-link">Abrir editor completo <span>↗</span></a></header>
    <div className="aa-layout">
      <section className="aa-copy-panel"><div className="aa-kicker">CREA EN SEGUNDOS</div><h1>Tu idea,<br /><em>en movimiento.</em></h1><p className="aa-intro">Escribe una frase por línea. Cada una aparece con su efecto y luego entra la siguiente.</p>
        <label className="aa-label" htmlFor="aa-copy">Texto de tu anuncio</label><textarea id="aa-copy" value={copy} maxLength={240} onChange={event => setCopy(event.target.value)} placeholder="Una frase por línea…" /><div className="aa-counter">{copy.length}/240 · Una frase por escena · 10 efectos que se asignan en orden</div>
        <button className="aa-upload" onClick={() => inputRef.current?.click()}><span className="aa-upload-icon">{media?.kind === "video" ? <Video size={19} /> : <ImagePlus size={19} />}</span><span><strong>{media ? media.file.name : "Añade una imagen o video"}</strong><small>{media ? "Cambiar archivo" : "JPG, PNG, MP4, MOV y más"}</small></span><Upload size={17} /></button>
        <input ref={inputRef} type="file" hidden accept="image/*,video/*" onChange={importMedia} />
        <button className="aa-export" disabled={exporting} onClick={() => void exportMp4()}>{exporting ? <><LoaderCircle className="aa-spin" size={18} /> Creando video · {duration} segundos</> : <><Download size={18} /> Descargar MP4 <span>H.264 · 9:16</span></>}</button>
        <div className="aa-export-note">La exportación se graba en tiempo real y luego se convierte a MP4.</div>
        {error && <p className="aa-error" role="alert">{error}</p>}
      </section>
      <section className="aa-preview-column"><div className="aa-preview-head"><span><i /> VISTA PREVIA · FRASE {currentScene + 1} / {sceneTexts.length}</span><span>9:16 · {duration} s</span></div><div className="aa-device"><canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Vista previa del anuncio animado" />{media?.kind === "video" && <video ref={videoRef} src={media.url} muted loop playsInline autoPlay />}{media?.kind === "image" && <img ref={imageRef} src={media.url} alt="Fondo del anuncio" />}</div><div className="aa-playbar"><button aria-label={playing ? "Pausar vista previa" : "Reproducir vista previa"} onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : <Play size={15} fill="currentColor" />}</button><div className="aa-track"><span style={{ width: `${time / duration * 100}%` }} /></div><span>00:{Math.floor(time).toString().padStart(2, "0")} / {Math.floor(duration / 60).toString().padStart(2, "0")}:{Math.floor(duration % 60).toString().padStart(2, "0")}</span><button aria-label="Reiniciar vista previa" onClick={() => { clockRef.current = 0; setTime(0); setPlaying(true); }}><RotateCcw size={15} /></button></div>
        <div className="aa-motions"><div className="aa-motions-title"><span>10 MOVIMIENTOS · UNA FRASE POR ESCENA</span><span>{movementIndex + 1} / 10</span></div><div className="aa-motion-list">{MOVEMENTS.map((name, index) => <span key={name} className={movementIndex === index ? "is-active" : ""}><i>{String(index + 1).padStart(2, "0")}</i>{name}</span>)}</div></div>
      </section>
    </div>
    <footer className="aa-footer"><span>Una idea simple. Diez formas de llamar la atención.</span><span>Hecho para compartir ↗</span></footer>
  </main>;
}
