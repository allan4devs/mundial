"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Aperture, ArrowDownToLine, ArrowLeft, ArrowRight, AudioLines, Check, ChevronDown, Copy, Download, Film, FolderOpen, Grid2X2, LayoutTemplate, LoaderCircle, Maximize, Music2, Pause, Play, Plus, Redo2, RefreshCw, Scissors, Search, ShieldCheck, SkipBack, Sparkles, Trash2, Type, Undo2, Upload, X } from "lucide-react";
import { clamp, clipDuration, dimensions, durationOf, EMPTY_PROJECT, locateClip, newClip, timeLabel, uid, type Aspect, type Asset, type Clip, type ExportJob, type Music, type Project, type TextLayer } from "@/lib/video-editor/types";
import { renderTextImages } from "@/lib/video-editor/render";
import { parseProject, useProject } from "./hooks/useProject";
import Inspector from "./components/Inspector";
import Preview from "./components/Preview";
import Timeline from "./components/Timeline";
import "./editor.css";
import "./auto-ad-link.css";

type Tab = "media" | "text" | "music" | "templates";
const TABS = [{ id: "media", label: "Archivos", icon: FolderOpen }, { id: "text", label: "Texto", icon: Type }, { id: "music", label: "Audio", icon: AudioLines }, { id: "templates", label: "Ideas", icon: LayoutTemplate }] as const;
const ASPECTS: { value: Aspect; label: string }[] = [{ value: "9:16", label: "9:16 · Reel / Story" }, { value: "1:1", label: "1:1 · Cuadrado" }, { value: "4:5", label: "4:5 · Feed" }, { value: "16:9", label: "16:9 · Horizontal" }];

async function jsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? body.message ?? "No se pudo completar la operación.");
  return body as T;
}

function downloadProject(project: Project) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = `${project.name || "mi-reel"}.reel.json`; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ReelEditor() {
  const history = useProject();
  const { project, current, change, ready, restored } = history;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("media");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [safeArea, setSafeArea] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportAvailable, setExportAvailable] = useState(false);
  const [resolution, setResolution] = useState<720 | 1080>(1080);
  const [job, setJob] = useState<ExportJob | null>(null);
  const [startingExport, setStartingExport] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportAspect, setExportAspect] = useState<Aspect>("9:16");
  const [projectMenu, setProjectMenu] = useState(false);
  const seeded = useRef(false);
  const importRef = useRef<HTMLInputElement>(null);
  const projectRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const total = durationOf(project);
  const selectedClip = project.clips.find(c => c.id === selectedId);
  const selectedText = project.texts.find(t => t.id === selectedId);
  const active = locateClip(project, time);
  const isRendering = startingExport || job?.status === "queued" || job?.status === "rendering";
  const videos = assets.filter(a => a.kind === "video");

  const loadLibrary = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await jsonResponse<{ assets: Asset[]; errors?: string[]; exportAvailable: boolean }>(await fetch("/api/video-editor/media", { cache: "no-store", signal }));
      if (signal?.aborted) return;
      setAssets(data.assets); setExportAvailable(data.exportAvailable);
      if (data.errors?.length) setError(data.errors.join(" · "));
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "No se pudo leer videos-reel1."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadLibrary(controller.signal);
    const refresh = () => { if (document.visibilityState === "visible") void loadLibrary(controller.signal); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [loadLibrary]);

  useEffect(() => {
    if (!ready || loading || seeded.current) return;
    seeded.current = true;
    if (!restored.current && !current.current.clips.length) {
      const clips = assets.filter(a => a.kind === "video").slice(0, 3).map(a => ({ ...newClip(a), out: Math.min(a.duration, 4) }));
      if (clips.length) { change({ ...EMPTY_PROJECT, clips }); setSelectedId(clips[0].id); }
    }
  }, [ready, loading, assets, restored, current, change]);

  useEffect(() => { if (time > total) { setTime(total); setPlaying(false); } }, [time, total]);

  useEffect(() => {
    try { const raw = sessionStorage.getItem("reel-studio-export"); if (raw) setJob(JSON.parse(raw) as ExportJob); } catch { /* An unavailable session store does not block editing. */ }
  }, []);

  useEffect(() => {
    if (!job) return;
    try { sessionStorage.setItem("reel-studio-export", JSON.stringify(job)); } catch { /* Progress still remains in memory. */ }
    if (!["queued", "rendering"].includes(job.status)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try { setJob(await jsonResponse<ExportJob>(await fetch(`/api/video-editor/export/${encodeURIComponent(job.id)}`, { cache: "no-store", signal: controller.signal }))); }
      catch (e) { if (!controller.signal.aborted) { setJob({ ...job, status: "error", message: e instanceof Error ? e.message : "No se pudo consultar la exportación." }); } }
    }, 900);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [job]);

  const edit = useCallback((next: Project, commit = true) => { setPlaying(false); change(next, commit); }, [change]);
  const updateClip = (id: string, patch: Partial<Clip>, commit = true) => edit({ ...current.current, clips: current.current.clips.map(c => c.id === id ? { ...c, ...patch } : c) }, commit);
  const updateText = (id: string, patch: Partial<TextLayer>, commit = true) => edit({ ...current.current, texts: current.current.texts.map(t => t.id === id ? { ...t, ...patch } : t) }, commit);
  const updateMusic = (patch: Partial<Music>, commit = true) => { if (current.current.music) edit({ ...current.current, music: { ...current.current.music, ...patch } }, commit); };
  const seek = (value: number) => { setPlaying(false); setTime(clamp(value, 0, total)); };
  const togglePlaying = () => { if (!total) return; if (time >= total - 0.02) setTime(0); setPlaying(v => !v); };

  function addAsset(id: string, index?: number) {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    if (asset.kind === "audio") {
      edit({ ...current.current, music: { assetId: id, in: 0, out: asset.duration, offset: 0, volume: 0.35, fadeIn: 0.4, fadeOut: 1, loop: true } });
      setSelectedId("music"); return;
    }
    if (project.clips.length >= 100) { setError("El proyecto admite hasta 100 clips."); return; }
    const clip = newClip(asset);
    const clips = [...current.current.clips]; clips.splice(index ?? clips.length, 0, clip);
    edit({ ...current.current, clips }); setSelectedId(clip.id);
    setTime(clips.slice(0, clips.indexOf(clip)).reduce((sum, c) => sum + clipDuration(c), 0));
  }

  async function importFiles(files: FileList | File[]) {
    if (uploading) return;
    const incoming = Array.from(files);
    setError("");
    for (const file of incoming) {
      setUploading(file.name);
      try {
        const data = new FormData(); data.set("file", file);
        const { asset } = await jsonResponse<{ asset: Asset }>(await fetch("/api/video-editor/media", { method: "POST", body: data }));
        setAssets(existing => [...existing.filter(a => a.id !== asset.id), asset]);
      } catch (e) { setError(e instanceof Error ? e.message : `No se pudo importar ${file.name}.`); }
    }
    setUploading("");
  }

  function addText(style: "title" | "caption" | "cta") {
    if (!total) { setError("Añade un video antes de colocar texto."); return; }
    if (project.texts.length >= 30) { setError("El proyecto admite hasta 30 textos."); return; }
    const start = Math.min(time, Math.max(0, total - 0.2));
    const layer: TextLayer = { id: uid(), text: style === "title" ? "Algo extraordinario." : style === "cta" ? "Descubre más →" : "Tu historia empieza aquí", start, end: Math.min(total, start + 4), x: 0.5, y: style === "title" ? 0.32 : 0.74, size: style === "title" ? 0.1 : 0.055, color: style === "cta" ? "#151914" : "#ffffff", background: style === "cta" ? "#c7f36b" : style === "caption" ? "#17191d" : "transparent", align: "center" };
    edit({ ...current.current, texts: [...current.current.texts, layer] }); setSelectedId(layer.id); setTime(start);
  }

  function removeSelection() {
    if (!selectedId) return;
    edit({ ...current.current, clips: current.current.clips.filter(c => c.id !== selectedId), texts: current.current.texts.filter(t => t.id !== selectedId), music: selectedId === "music" ? null : current.current.music });
    setSelectedId(null);
  }

  function duplicateSelection() {
    const p = current.current;
    if (selectedClip && p.clips.length < 100) { const clip = { ...selectedClip, id: uid() }; const clips = [...p.clips]; clips.splice(clips.findIndex(c => c.id === selectedId) + 1, 0, clip); edit({ ...p, clips }); setSelectedId(clip.id); }
    if (selectedText && p.texts.length < 30) { const text = { ...selectedText, id: uid(), y: clamp(selectedText.y + 0.08, 0, 1) }; edit({ ...p, texts: [...p.texts, text] }); setSelectedId(text.id); }
  }

  function split() {
    const location = locateClip(current.current, time);
    if (!location || location.local < 0.1 || location.duration - location.local < 0.1) return;
    const { clip, index, local } = location;
    const cut = clip.in + local * clip.speed;
    const right = { ...clip, id: uid(), in: cut };
    const clips = [...current.current.clips]; clips.splice(index, 1, { ...clip, out: cut }, right);
    edit({ ...current.current, clips }); setSelectedId(right.id);
  }

  function template(kind: "cinema" | "punch" | "story") {
    if (!videos.length) { setError("Importa videos para crear tu primer montaje."); return; }
    const length = kind === "punch" ? 2 : kind === "cinema" ? 5 : 3.5;
    const clips = videos.slice(0, 8).map(a => ({ ...newClip(a), out: Math.min(a.duration, length), look: kind === "cinema" ? "cinema" as const : kind === "punch" ? "vivid" as const : "original" as const, fade: kind === "cinema" ? 0.35 : 0 }));
    const totalTime = clips.reduce((sum, c) => sum + clipDuration(c), 0);
    const headline: TextLayer = { id: uid(), text: kind === "cinema" ? "Hay momentos\nque se quedan." : kind === "punch" ? "No pasa\ndesapercibido." : "Una historia\npor descubrir.", start: 0, end: Math.min(length, totalTime), x: 0.5, y: 0.32, size: 0.09, color: "#ffffff", background: "transparent", align: "center" };
    const cta: TextLayer = { ...headline, id: uid(), text: "Descubre más →", start: Math.max(0, totalTime - length), end: totalTime, y: 0.73, size: 0.055, color: "#161a13", background: "#c7f36b" };
    edit({ ...project, aspect: "9:16", clips, texts: [headline, cta] }); setTime(0); setSelectedId(headline.id);
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (element.isContentEditable || element.closest("input,textarea,select,button,[role=dialog]")) return;
      if (event.code === "Space") { event.preventDefault(); togglePlaying(); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); setPlaying(false); if (event.shiftKey) history.redo(); else history.undo(); }
      else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") { event.preventDefault(); duplicateSelection(); }
      else if (event.key.toLowerCase() === "s" && !event.ctrlKey && !event.metaKey) { event.preventDefault(); split(); }
      else if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); removeSelection(); }
      else if (event.key === "ArrowRight") { event.preventDefault(); seek(time + (event.shiftKey ? 1 : 1 / 30)); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); seek(time - (event.shiftKey ? 1 : 1 / 30)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  async function startExport() {
    setPlaying(false); setExportError("");
    if (total > 600) { setExportError("Recorta el reel a un máximo de 10 minutos para exportarlo."); return; }
    setStartingExport(true); setExportAspect(project.aspect);
    try {
      const textImages = renderTextImages(project, resolution);
      setJob(await jsonResponse<ExportJob>(await fetch("/api/video-editor/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project, resolution, textImages }) })));
    } catch (e) { setExportError(e instanceof Error ? e.message : "No se pudo iniciar la exportación."); }
    finally { setStartingExport(false); }
  }

  async function openProject(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    try { if (file.size > 1024 * 1024) throw new Error("El archivo de proyecto es demasiado grande."); const parsed = parseProject(JSON.parse(await file.text())); edit(parsed); setTime(0); setSelectedId(null); setProjectMenu(false); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo abrir el proyecto."); }
  }

  const missing = project.clips.some(c => !assets.some(a => a.id === c.assetId)) || Boolean(project.music && !assets.some(a => a.id === project.music?.assetId));
  const viewAssets = assets.filter(a => (tab === "music" ? a.kind === "audio" : a.kind === "video") && a.name.toLowerCase().includes(query.toLowerCase()));
  const exportSize = dimensions(isRendering || job?.status === "done" ? exportAspect : project.aspect, resolution);

  return <main className="reel-studio" onDragOver={e => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }} onDrop={e => { if (e.dataTransfer.files.length) { e.preventDefault(); void importFiles(e.dataTransfer.files); } }}>
    <input ref={importRef} type="file" hidden multiple accept="video/*,audio/*,.mp4,.mov,.webm,.mkv,.mp3,.wav,.m4a" onChange={e => { if (e.target.files) void importFiles(e.target.files); e.target.value = ""; }} />
    <input ref={projectRef} type="file" hidden accept=".json" onChange={e => void openProject(e)} />
    <header className="rs-header">
      <a className="rs-brand" href="/video-generator" aria-label="Reel Studio"><span><Aperture size={24} strokeWidth={1.7} /></span><strong>reel<span>studio</span><i>BETA</i></strong></a>
      <div className="rs-project-name"><input aria-label="Nombre del proyecto" value={project.name} maxLength={120} onChange={e => edit({ ...project, name: e.target.value }, false)} onBlur={e => edit({ ...current.current, name: e.target.value.trim() || "Mi primer reel" }, true)} /><button aria-label="Opciones del proyecto" onClick={() => setProjectMenu(!projectMenu)}><ChevronDown size={15} /></button>{projectMenu && <div className="rs-menu"><button onClick={() => { downloadProject(project); setProjectMenu(false); }}><Download size={14} />Guardar proyecto JSON</button><button onClick={() => projectRef.current?.click()}><FolderOpen size={14} />Abrir proyecto JSON</button><button onClick={() => { edit({ ...EMPTY_PROJECT }); setTime(0); setSelectedId(null); setProjectMenu(false); }}><Plus size={14} />Nuevo proyecto</button></div>}</div>
      <div className="rs-saved" title="Borrador guardado en este navegador">{history.saved ? <Check size={13} /> : <span className="rs-status-dot" />}{history.saved ? "Guardado aquí" : "Guardando"}</div>
      <div className="rs-header-actions"><a className="rs-auto-ad-link" href="/video-generator/auto-ad"><Sparkles size={15} /> Auto Ad</a><button className="rs-icon" title="Deshacer · Ctrl Z" aria-label="Deshacer" disabled={!history.canUndo} onClick={() => { setPlaying(false); history.undo(); }}><Undo2 size={17} /></button><button className="rs-icon" title="Rehacer · Ctrl Shift Z" aria-label="Rehacer" disabled={!history.canRedo} onClick={() => { setPlaying(false); history.redo(); }}><Redo2 size={17} /></button><span className="rs-divider" /><button className="rs-primary" onClick={() => setExportOpen(true)} disabled={!total}><ArrowDownToLine size={16} />{isRendering ? `${Math.round(job?.progress ?? 0)}% exportando` : "Exportar"}<ArrowRight size={15} /></button></div>
    </header>

    {(error || history.storageError) && <div className="rs-notice" role="alert"><span>{error || history.storageError}</span><button aria-label="Cerrar aviso" onClick={() => setError("")}><X size={15} /></button></div>}
    {!loading && missing && <div className="rs-notice" role="alert">Faltan archivos de este proyecto. Vuelve a colocarlos en videos-reel1 y pulsa actualizar.</div>}

    <div className="rs-workspace">
      <aside className="rs-library">
        <nav className="rs-tabs" aria-label="Herramientas">{TABS.map(({id,label,icon:Icon}) => <button key={id} onClick={() => { setTab(id); setQuery(""); }} className={tab === id ? "is-active" : ""}><Icon size={19} /><span>{label}</span></button>)}</nav>
        <div className="rs-library-content">
          {(tab === "media" || tab === "music") && <>
            <div className="rs-section-heading"><h2>{tab === "media" ? "Tu material" : "Encuentra tu ritmo"}</h2><button className="rs-icon" aria-label="Actualizar carpeta" title="Actualizar carpeta" onClick={() => { setLoading(true); void loadLibrary(); }}><RefreshCw size={14} className={loading ? "rs-spin" : ""} /></button></div>
            <p className="rs-subtitle">{tab === "media" ? "Todo empieza con una buena toma." : "La música cambia todo."}</p>
            <button className="rs-import" disabled={Boolean(uploading)} onClick={() => importRef.current?.click()}>{uploading ? <LoaderCircle className="rs-spin" size={16} /> : <Upload size={16} />}<span>{uploading ? "Importando…" : "Importar archivos"}</span><Plus size={15} /></button>
            <label className="rs-search"><Search size={14} /><input aria-label="Buscar archivos" placeholder="Buscar en tus archivos" value={query} onChange={e => setQuery(e.target.value)} /></label>
            <div className="rs-folder"><span><span className="rs-status-dot" />videos-reel1</span><span>{viewAssets.length} {tab === "music" ? "audios" : "videos"}</span></div>
            {loading && !assets.length ? <div className="rs-loading"><LoaderCircle className="rs-spin" size={20} /><p>Preparando tus videos…</p></div> : <div className={tab === "music" ? "rs-audio-list" : "rs-asset-grid"}>{viewAssets.map(asset => <button className={`rs-asset ${asset.kind === "audio" ? "rs-audio-asset" : ""}`} key={asset.id} draggable onDragStart={e => { e.dataTransfer.setData("application/x-reel-asset", asset.id); e.dataTransfer.effectAllowed = "copy"; }} onClick={() => addAsset(asset.id)} title={`Añadir ${asset.name}`} aria-label={`Añadir ${asset.name}`}><div className="rs-asset-image">{asset.kind === "video" ? asset.thumbnail ? <img src={asset.thumbnail} alt="" loading="lazy" draggable={false} /> : <Film size={24} /> : <Music2 size={23} />}<span className="rs-asset-duration">{timeLabel(asset.duration)}</span><span className="rs-asset-plus"><Plus size={15} /></span></div><span className="rs-asset-name">{asset.name}</span><span className="rs-asset-meta">{asset.kind === "video" ? `${asset.width} × ${asset.height}` : "Pista de audio"}</span></button>)}</div>}
            {!loading && !viewAssets.length && <div className="rs-empty-library"><Music2 size={24} /><p>{tab === "music" ? "Dale una banda sonora." : query ? "Sin coincidencias." : "Tu próxima historia empieza aquí."}</p><span>{tab === "music" ? "Importa MP3, WAV o M4A, o añade el audio a tu carpeta." : "Arrastra archivos aquí o agrégalos a videos-reel1."}</span></div>}
            {uploading && <p className="rs-hint rs-upload-name">{uploading}</p>}
            {tab === "media" && videos.length > 0 && <button className="rs-auto-edit" onClick={() => setTab("templates")}><Sparkles size={15} /><span>¿Un punto de partida?<small>Arma un reel con tus clips</small></span><ArrowRight size={14} /></button>}
            {tab === "music" && project.music && <button className="rs-outline rs-wide" onClick={() => setSelectedId("music")}><AudioLines size={15} />Editar banda sonora</button>}
          </>}
          {tab === "text" && <><h2>Haz que se lea.</h2><p className="rs-subtitle">Un buen mensaje detiene el scroll.</p><button className="rs-text-preset rs-title-preset" onClick={() => addText("title")}><span>Un gran<br />titular.</span><Plus size={18} /></button><button className="rs-text-preset rs-caption-preset" onClick={() => addText("caption")}><span>Algo que contar</span><Plus size={16} /></button><button className="rs-text-preset rs-cta-preset" onClick={() => addText("cta")}><span>Descubre más ↗</span><Plus size={16} /></button><p className="rs-tip">Añade un texto, arrástralo sobre el video y decide cuándo aparece en la línea de tiempo.</p><h3 className="rs-small-title">EN TU REEL</h3>{project.texts.map(t => <button key={t.id} className={`rs-layer-list ${selectedId === t.id ? "is-active" : ""}`} onClick={() => { setSelectedId(t.id); seek(t.start); }}><Type size={15} /><span>{t.text || "Texto vacío"}</span><small>{timeLabel(t.start)}</small></button>)}</>}
          {tab === "templates" && <><h2>Del clip a la idea.</h2><p className="rs-subtitle">Tres formas de empezar con tus videos.</p><button className="rs-template rs-template-cinema" onClick={() => template("cinema")}><span className="rs-template-tag">LENTO · ATMOSFÉRICO</span><strong>Pequeños<br />momentos.<i>Grandes historias.</i></strong><span className="rs-template-footer">Cinemático <ArrowRight size={16} /></span></button><button className="rs-template rs-template-punch" onClick={() => template("punch")}><span className="rs-template-tag">CORTES RÁPIDOS · COLOR</span><strong>MAKE<br />IT POP<span>↗</span></strong><span className="rs-template-footer">Impacto <ArrowRight size={16} /></span></button><button className="rs-template rs-template-story" onClick={() => template("story")}><span className="rs-template-tag">NATURAL · DIRECTO</span><strong>Tu historia.<br />A tu manera.</strong><span className="rs-template-footer">Diario visual <ArrowRight size={16} /></span></button><p className="rs-tip">Cada idea crea un montaje nuevo con los primeros 8 videos de tu carpeta. Puedes deshacerlo y cambiar cada detalle.</p></>}
        </div>
        <div className="rs-library-bottom"><ShieldCheck size={13} /><span>Tus archivos. Tu creatividad.</span></div>
      </aside>

      <section className="rs-stage" ref={stageRef}>
        <div className="rs-stage-toolbar"><label className="rs-aspect"><Grid2X2 size={14} /><select aria-label="Formato del video" value={project.aspect} onChange={e => edit({ ...project, aspect: e.target.value as Aspect })}>{ASPECTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label><div><button className={`rs-icon ${safeArea ? "is-active" : ""}`} title="Mostrar área segura" aria-label="Mostrar área segura" aria-pressed={safeArea} onClick={() => setSafeArea(v => !v)}><ShieldCheck size={16} /></button><button className="rs-icon" title="Pantalla completa" aria-label="Pantalla completa" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void stageRef.current?.requestFullscreen().catch(() => setError("Tu navegador no permite pantalla completa.")); }}><Maximize size={16} /></button></div></div>
        <div className="rs-stage-canvas" onDragOver={e => { if (e.dataTransfer.types.includes("application/x-reel-asset")) e.preventDefault(); }} onDrop={e => { const id = e.dataTransfer.getData("application/x-reel-asset"); if (id) { e.preventDefault(); addAsset(id); } }}>
          <div className="rs-preview-wrap" style={{ aspectRatio: project.aspect.replace(":", "/"), height: project.aspect === "9:16" || project.aspect === "4:5" ? "100%" : undefined, width: project.aspect === "16:9" ? "100%" : undefined }}>
            <Preview project={project} assets={assets} time={time} playing={playing} onTime={setTime} onPlaying={setPlaying} selectedTextId={selectedText?.id ?? null} onSelectText={setSelectedId} onTextChange={updateText} onError={setError} safeArea={safeArea} />
          </div>
          {!total && <div className="rs-empty-stage"><Aperture size={35} /><h2>Crea algo<br /><em>que se sienta.</em></h2><p>Arrastra tus videos aquí.<br />Tu próxima historia está a un clip.</p><button className="rs-primary" onClick={() => importRef.current?.click()}><Plus size={16} />Añadir videos</button></div>}
        </div>
        <div className="rs-stage-footer"><span className="rs-preview-label"><span className="rs-status-dot" />VISTA PREVIA</span><div className="rs-transport"><button className="rs-icon" aria-label="Volver al inicio" onClick={() => seek(0)}><SkipBack size={16} /></button><button className="rs-play" aria-label={playing ? "Pausar" : "Reproducir"} disabled={!total || missing} onClick={togglePlaying}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button><span>{timeLabel(time)}<i>/ {timeLabel(total)}</i></span></div><span className="rs-format-label">{project.aspect}<span>30 FPS</span></span></div>
      </section>

      <Inspector project={project} assets={assets} selectedId={selectedId} onClip={updateClip} onText={updateText} onMusic={updateMusic} />
    </div>

    <div className="rs-timeline-toolbar"><div><span className="rs-timeline-title">Tu historia <span>{project.clips.length} clips</span></span><span className="rs-divider" /><button className="rs-tool" disabled={!active || active.local < 0.1 || active.duration - active.local < 0.1} onClick={split} title="Cortar en el cabezal · S"><Scissors size={15} /><span>Cortar</span><kbd>S</kbd></button><button className="rs-icon" aria-label="Duplicar selección" title="Duplicar · Ctrl D" disabled={!selectedClip && !selectedText} onClick={duplicateSelection}><Copy size={15} /></button><button className="rs-icon" aria-label="Eliminar selección" title="Eliminar selección" disabled={!selectedId} onClick={removeSelection}><Trash2 size={15} /></button></div><span className="rs-timeline-tip">Arrastra para ordenar. Tira de los bordes para recortar.</span></div>
    <Timeline project={project} assets={assets} time={time} onSeek={seek} selectedId={selectedId} onSelect={setSelectedId} onChange={edit} onAddAsset={addAsset} />
    <footer className="rs-statusbar"><span><span className="rs-status-dot" />{loading ? "Leyendo carpeta" : `${assets.length} archivos disponibles`}</span><span>Hecho para tus ideas. Listo para tu audiencia.</span><span>{history.saved ? "Borrador guardado en este navegador" : "Guardando borrador…"}</span></footer>

    {exportOpen && <div className="rs-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setExportOpen(false); }}><section className="rs-export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title" onKeyDown={e => { if (e.key === "Escape") setExportOpen(false); }}><button className="rs-modal-close rs-icon" aria-label="Cerrar exportación" onClick={() => setExportOpen(false)}><X size={18} /></button><span className="rs-export-icon"><Download size={25} /></span><p className="rs-eyebrow">DE TU IDEA AL MUNDO</p><h2 id="export-title">Listo para compartir.</h2><p className="rs-subtitle">Tu reel, con cada corte, texto y sonido.</p>
      {job?.status === "done" ? <div className="rs-export-complete"><Check size={26} /><h3>Tu MP4 está listo.</h3><p>La exportación conserva los ajustes que tenías al iniciarla.</p><a className="rs-primary rs-wide" href={job.downloadUrl ?? `/api/video-editor/export/${encodeURIComponent(job.id)}/download`} download><Download size={16} />Descargar MP4</a><button className="rs-text-button" onClick={() => setJob(null)}>Exportar la edición actual</button></div> : <><div className="rs-export-spec"><span>MP4<small>H.264 + AAC</small></span><span>{exportSize.width} × {exportSize.height}<small>{project.aspect} · 30 fps</small></span><span>{timeLabel(total)}<small>Duración</small></span></div><label className="rs-field">Calidad<select aria-label="Calidad de exportación" disabled={Boolean(isRendering)} value={resolution} onChange={e => setResolution(Number(e.target.value) as 720 | 1080)}><option value={1080}>1080p · Máxima calidad</option><option value={720}>720p · Archivo ligero</option></select></label>
      {isRendering ? <div className="rs-export-progress"><div><span>{startingExport ? "Preparando tu reel…" : job?.message}</span><strong>{Math.round(job?.progress ?? 0)}%</strong></div><progress max={100} value={job?.progress ?? 0} /><p>Puedes seguir editando mientras se prepara el video.</p>{job?.id && <button className="rs-text-button" onClick={async () => { try { setJob(await jsonResponse<ExportJob>(await fetch(`/api/video-editor/export/${encodeURIComponent(job.id)}`, { method: "DELETE" }))); } catch (e) { setExportError(e instanceof Error ? e.message : "No se pudo cancelar."); } }}>Cancelar exportación</button>}</div> : <><button className="rs-primary rs-wide" disabled={!total || missing || !exportAvailable} onClick={() => void startExport()}><ArrowDownToLine size={17} />Crear mi MP4<ArrowRight size={16} /></button>{!exportAvailable && <p className="rs-hint">La exportación necesita el motor de video en el servidor local. Revisa la configuración del proyecto.</p>}</>}
      {(exportError || job?.status === "error") && <p className="rs-export-error" role="alert">{exportError || job?.message}</p>}{job?.status === "cancelled" && <p className="rs-hint">Exportación cancelada. Tu edición sigue guardada.</p>}</>}
      <p className="rs-export-note">Sin marca de agua. Con todo tu estilo.</p>
    </section></div>}
  </main>;
}
