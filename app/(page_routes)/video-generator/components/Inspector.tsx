"use client";

import { AlignCenter, AlignLeft, AlignRight, AudioLines, Crop, SlidersHorizontal, Type } from "lucide-react";
import { clamp, clipDuration, type Asset, type Clip, type Look, type Music, type Project, type TextLayer } from "@/lib/video-editor/types";

export function Slider({ label, value, min = 0, max = 1, step = 0.01, suffix = "", onChange }: { label: string; value: number; min?: number; max?: number; step?: number; suffix?: string; onChange(value: number, commit?: boolean): void }) {
  return <label className="rs-control"><span>{label}<output>{Number(value.toFixed(2))}{suffix}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={clamp(value, min, max)} onChange={e => onChange(Number(e.target.value), false)} onPointerUp={e => onChange(Number(e.currentTarget.value), true)} onKeyUp={e => onChange(Number(e.currentTarget.value), true)} onBlur={e => onChange(Number(e.currentTarget.value), true)} /></label>;
}

function Seconds({ label, value, max, min = 0, onChange }: { label: string; value: number; min?: number; max: number; onChange(value: number): void }) {
  return <label className="rs-number"><span>{label}</span><div><input aria-label={label} type="number" min={min} max={max} step={0.1} value={Number(value.toFixed(2))} onChange={e => { if (e.target.value !== "" && Number.isFinite(e.target.valueAsNumber)) onChange(clamp(e.target.valueAsNumber, min, max)); }} /><span>s</span></div></label>;
}

const LOOKS: { value: Look; label: string; color: string }[] = [
  { value: "original", label: "Natural", color: "linear-gradient(140deg,#738e73,#cedcab)" },
  { value: "vivid", label: "Vivo", color: "linear-gradient(140deg,#425f9c,#df6588,#eac579)" },
  { value: "warm", label: "Cálido", color: "linear-gradient(140deg,#b86651,#f2ce8f)" },
  { value: "mono", label: "B&N", color: "linear-gradient(140deg,#333,#ddd)" },
  { value: "cinema", label: "Cine", color: "linear-gradient(140deg,#29534e,#ab9c67)" },
];

export default function Inspector({ project, assets, selectedId, onClip, onText, onMusic }: {
  project: Project; assets: Asset[]; selectedId: string | null;
  onClip(id: string, patch: Partial<Clip>, commit?: boolean): void;
  onText(id: string, patch: Partial<TextLayer>, commit?: boolean): void;
  onMusic(patch: Partial<Music>, commit?: boolean): void;
}) {
  const clip = project.clips.find(c => c.id === selectedId);
  const text = project.texts.find(t => t.id === selectedId);
  const music = selectedId === "music" ? project.music : null;
  const source = assets.find(a => a.id === (clip?.assetId ?? music?.assetId));
  const duration = project.clips.reduce((sum, c) => sum + clipDuration(c), 0);

  return <aside className="rs-inspector">
    <div className="rs-panel-title"><span>{text ? <Type size={15} /> : music ? <AudioLines size={15} /> : <SlidersHorizontal size={15} />}{text ? "Tu mensaje" : music ? "Tu sonido" : "Dale tu estilo"}</span><span className="rs-pill">{text ? "TEXTO" : music ? "AUDIO" : "CLIP"}</span></div>
    {clip && <div className="rs-inspector-content">
      <div className="rs-selected-name">{source?.name ?? "Archivo no disponible"}<span>{clipDuration(clip).toFixed(1)} s en tu reel</span></div>
      <section><h3>Recorte</h3><div className="rs-two"><Seconds label="Entrada" value={clip.in} max={clip.out - 0.1} onChange={value => onClip(clip.id, { in: value })} /><Seconds label="Salida" value={clip.out} min={clip.in + 0.1} max={source?.duration ?? clip.out} onChange={value => onClip(clip.id, { out: value })} /></div><p className="rs-hint">También puedes arrastrar los bordes del clip.</p></section>
      <section><h3><Crop size={13} /> Encuadre</h3><div className="rs-segmented"><button className={clip.fit === "cover" ? "is-active" : ""} onClick={() => onClip(clip.id, { fit: "cover" })}>Rellenar</button><button className={clip.fit === "contain" ? "is-active" : ""} onClick={() => onClip(clip.id, { fit: "contain" })}>Completo</button></div>
        <Slider label="Zoom" value={clip.zoom} min={1} max={3} suffix="×" onChange={(zoom, commit) => onClip(clip.id, { zoom }, commit)} />
        <Slider label="Horizontal" value={Math.round(clip.x * 100)} max={100} step={1} suffix="%" onChange={(x, commit) => onClip(clip.id, { x: x / 100 }, commit)} />
        <Slider label="Vertical" value={Math.round(clip.y * 100)} max={100} step={1} suffix="%" onChange={(y, commit) => onClip(clip.id, { y: y / 100 }, commit)} />
        <button className="rs-text-button" onClick={() => onClip(clip.id, { x: 0.5, y: 0.5, zoom: 1 })}>Centrar encuadre</button>
      </section>
      <section><h3>Color</h3><div className="rs-looks">{LOOKS.map(look => <button key={look.value} className={clip.look === look.value ? "is-active" : ""} onClick={() => onClip(clip.id, { look: look.value })}><span style={{ background: look.color }} />{look.label}</button>)}</div></section>
      <section><h3>Ritmo</h3><div className="rs-speeds">{[0.5, 1, 1.5, 2].map(speed => <button key={speed} className={clip.speed === speed ? "is-active" : ""} onClick={() => onClip(clip.id, { speed })}>{speed}×</button>)}</div><Slider label="Fundido a negro" value={clip.fade} max={Math.min(2, clipDuration(clip) / 2)} step={0.05} suffix=" s" onChange={(fade, commit) => onClip(clip.id, { fade }, commit)} /></section>
      <section><h3>Audio original</h3><Slider label="Volumen del clip" value={Math.round(clip.volume * 100)} max={100} step={1} suffix="%" onChange={(volume, commit) => onClip(clip.id, { volume: volume / 100 }, commit)} />{!source?.hasAudio && <p className="rs-hint">Este video no contiene una pista de audio.</p>}</section>
    </div>}
    {text && <div className="rs-inspector-content">
      <section><label className="rs-field">Texto<textarea aria-label="Contenido del texto" rows={4} maxLength={500} value={text.text} onChange={e => onText(text.id, { text: e.target.value }, false)} onBlur={e => onText(text.id, { text: e.target.value }, true)} /></label><p className="rs-hint">Arrastra el texto sobre el video para colocarlo.</p></section>
      <section><h3>Estilo</h3><Slider label="Tamaño del texto" value={Math.round(text.size * 100)} min={2} max={25} step={1} suffix="%" onChange={(size, commit) => onText(text.id, { size: size / 100 }, commit)} /><div className="rs-two"><label className="rs-color">Color<input aria-label="Color del texto" type="color" value={text.color} onChange={e => onText(text.id, { color: e.target.value }, false)} onBlur={e => onText(text.id, { color: e.target.value }, true)} /></label><label className="rs-color">Fondo<input aria-label="Color de fondo del texto" type="color" value={text.background === "transparent" ? "#111111" : text.background} onChange={e => onText(text.id, { background: e.target.value }, false)} onBlur={e => { if (text.background !== "transparent") onText(text.id, { background: e.target.value }, true); }} /></label></div><label className="rs-check"><input type="checkbox" checked={text.background !== "transparent"} onChange={e => onText(text.id, { background: e.target.checked ? "#111111" : "transparent" })} />Fondo de texto</label><div className="rs-segmented">{([{ value: "left", icon: AlignLeft }, { value: "center", icon: AlignCenter }, { value: "right", icon: AlignRight }] as const).map(({value, icon: Icon}) => <button key={value} aria-label={`Alinear texto ${value}`} className={text.align === value ? "is-active" : ""} onClick={() => onText(text.id, { align: value })}><Icon size={16} /></button>)}</div></section>
      <section><h3>Cuándo aparece</h3><div className="rs-two"><Seconds label="Desde" value={text.start} max={text.end - 0.1} onChange={start => onText(text.id, { start })} /><Seconds label="Hasta" value={text.end} min={text.start + 0.1} max={Math.max(duration, text.start + 0.1)} onChange={end => onText(text.id, { end })} /></div><button className="rs-text-button" onClick={() => onText(text.id, { start: 0, end: Math.max(duration, 0.1) })}>Mostrar durante todo el reel</button></section>
      <section><h3>Posición</h3><Slider label="Texto horizontal" value={Math.round(text.x * 100)} max={100} step={1} suffix="%" onChange={(x, commit) => onText(text.id, { x: x / 100 }, commit)} /><Slider label="Texto vertical" value={Math.round(text.y * 100)} max={100} step={1} suffix="%" onChange={(y, commit) => onText(text.id, { y: y / 100 }, commit)} /></section>
    </div>}
    {music && <div className="rs-inspector-content"><div className="rs-selected-name">{source?.name ?? "Archivo no disponible"}<span>Banda sonora</span></div><section><h3>Fragmento de audio</h3><div className="rs-two"><Seconds label="Audio desde" value={music.in} max={music.out - 0.1} onChange={value => onMusic({ in: value })} /><Seconds label="Audio hasta" value={music.out} min={music.in + 0.1} max={source?.duration ?? music.out} onChange={value => onMusic({ out: value })} /></div><Slider label="Empieza en el reel" value={music.offset} max={Math.max(0, duration - 0.1)} step={0.1} suffix=" s" onChange={(offset, commit) => onMusic({ offset }, commit)} /><label className="rs-check"><input type="checkbox" checked={music.loop} onChange={e => onMusic({ loop: e.target.checked })} />Repetir hasta el final</label></section><section><h3>Mezcla</h3><Slider label="Volumen de música" value={Math.round(music.volume * 100)} max={100} step={1} suffix="%" onChange={(volume, commit) => onMusic({ volume: volume / 100 }, commit)} /><Slider label="Entrada suave" value={music.fadeIn} max={5} step={0.1} suffix=" s" onChange={(fadeIn, commit) => onMusic({ fadeIn }, commit)} /><Slider label="Salida suave" value={music.fadeOut} max={5} step={0.1} suffix=" s" onChange={(fadeOut, commit) => onMusic({ fadeOut }, commit)} /></section></div>}
    {!clip && !text && !music && <div className="rs-inspector-empty"><SlidersHorizontal size={28} /><h3>El detalle hace la diferencia.</h3><p>Selecciona un clip, un texto o la música para ajustar cada detalle.</p><div className="rs-shortcuts"><span>Reproducir / pausar<kbd>Espacio</kbd></span><span>Cortar en el cabezal<kbd>S</kbd></span><span>Deshacer<kbd>Ctrl Z</kbd></span><span>Eliminar selección<kbd>Supr</kbd></span></div></div>}
  </aside>;
}
