import { mkdir, readFile, readdir, rename, unlink, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ChildProcess } from "node:child_process";
import { type Asset, type Clip, type ExportJob, type ExportPayload, type Look, type Project, type TextLayer, clamp, clipDuration, dimensions, durationOf } from "./types";
import { EditorError, WORK_ROOT, assertLocalRuntime, binariesAvailable, inspectAsset, mediaPath, runProcess } from "./server-media";

type RunningJob = { job: ExportJob; process?: ChildProcess; cancelled: boolean; name: string; persistence?: Promise<void> };
const globalJobs = globalThis as typeof globalThis & { videoEditorJobs?: { jobs: Map<string, RunningJob>; active: string | null } };
const state = globalJobs.videoEditorJobs ??= { jobs: new Map(), active: null };
const JOBS_ROOT = path.join(WORK_ROOT, "jobs");
const ASPECTS = new Set(["9:16", "1:1", "16:9", "4:5"]);
const LOOKS = new Set<Look>(["original", "vivid", "warm", "mono", "cinema"]);
const n = (value: number) => Number(value.toFixed(6)).toString();
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EditorError("El proyecto no tiene un formato válido.");
  return value as Record<string, unknown>;
}
function finite(value: unknown, minimum: number, maximum: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new EditorError("El proyecto contiene tiempos o ajustes no válidos.");
  return clamp(value, minimum, maximum);
}
function identifier(value: unknown) {
  if (typeof value !== "string" || value.length < 1 || value.length > 255) throw new EditorError("El proyecto contiene una referencia no válida.");
  return value;
}
function jobDirectory(id: string) {
  if (!/^[a-f\d-]{36}$/.test(id)) throw new EditorError("Exportación no encontrada.", 404);
  return path.join(JOBS_ROOT, id);
}
export async function readExportPayload(request: Request): Promise<unknown> {
  const maximum = 36 * 1024 * 1024;
  if (!request.body || Number(request.headers.get("content-length")) > maximum) throw new EditorError("El proyecto es demasiado grande.", 413);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > maximum) { await reader.cancel(); throw new EditorError("El proyecto es demasiado grande.", 413); }
    chunks.push(result.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new EditorError("El proyecto no contiene JSON válido."); }
}
export async function validateExport(input: unknown) {
  const payload = object(input);
  const raw = object(payload.project);
  if (raw.version !== 1 || typeof raw.aspect !== "string" || !ASPECTS.has(raw.aspect)) throw new EditorError("Formato de proyecto no compatible.");
  if (!Array.isArray(raw.clips) || !raw.clips.length || raw.clips.length > 100) throw new EditorError("Añade entre 1 y 100 clips para exportar.");
  if (!Array.isArray(raw.texts) || raw.texts.length > 30) throw new EditorError("Puedes incluir hasta 30 textos por reel.");
  if (payload.resolution !== 720 && payload.resolution !== 1080) throw new EditorError("Selecciona resolución 720p o 1080p.");
  const assets = new Map<string, Asset>();
  const load = async (id: string) => { const existing = assets.get(id); if (existing) return existing; const asset = await inspectAsset(id); assets.set(id, asset); return asset; };
  const clips: Clip[] = [];
  const ids = new Set<string>();
  for (const entry of raw.clips) {
    const clip = object(entry);
    const id = identifier(clip.id);
    if (ids.has(id)) throw new EditorError("Los clips necesitan identificadores únicos.");
    ids.add(id);
    const asset = await load(identifier(clip.assetId));
    if (asset.kind !== "video" || asset.width < 2 || asset.height < 2 || asset.width > 16384 || asset.height > 16384) throw new EditorError(`${asset.name} no es un video compatible.`);
    const start = finite(clip.in, 0, asset.duration);
    const end = finite(clip.out, 0, asset.duration);
    if (end - start < 0.04) throw new EditorError("Cada clip necesita al menos 0.04 segundos de video.");
    const speed = finite(clip.speed, 0.25, 4);
    if ((end - start) / speed < 1 / 30) throw new EditorError("Un clip queda más corto que un fotograma. Amplía su recorte o reduce su velocidad.");
    clips.push({ id, assetId: asset.id, in: start, out: end, speed, volume: finite(clip.volume, 0, 2), fit: clip.fit === "contain" ? "contain" : "cover", x: finite(clip.x, 0, 1), y: finite(clip.y, 0, 1), zoom: finite(clip.zoom, 1, 3), look: LOOKS.has(clip.look as Look) ? clip.look as Look : "original", fade: finite(clip.fade, 0, (end - start) / speed / 2) });
  }
  const duration = clips.reduce((sum, clip) => sum + clipDuration(clip), 0);
  if (duration > 600 || duration < 1 / 30) throw new EditorError("El reel debe durar entre un fotograma y 10 minutos.");
  const texts: TextLayer[] = [];
  const textIds = new Set<string>();
  for (const entry of raw.texts) {
    const text = object(entry);
    const id = identifier(text.id);
    if (textIds.has(id)) throw new EditorError("Los textos necesitan identificadores únicos.");
    textIds.add(id);
    const start = finite(text.start, 0, duration);
    const end = finite(text.end, 0, duration);
    if (end <= start) continue;
    texts.push({ id, text: typeof text.text === "string" ? text.text.slice(0, 2000) : "", start, end, x: finite(text.x, 0, 1), y: finite(text.y, 0, 1), size: finite(text.size, 0.01, 1), color: typeof text.color === "string" ? text.color : "#ffffff", background: typeof text.background === "string" ? text.background : "transparent", align: text.align === "left" || text.align === "right" ? text.align : "center" });
  }
  let music: Project["music"] = null;
  if (raw.music !== null && raw.music !== undefined) {
    const track = object(raw.music);
    const asset = await load(identifier(track.assetId));
    if (!asset.hasAudio) throw new EditorError("El archivo de música no contiene audio.");
    const start = finite(track.in, 0, asset.duration);
    const end = finite(track.out, 0, asset.duration);
    if (end - start < 0.04) throw new EditorError("El recorte de música está vacío.");
    const offset = finite(track.offset, 0, duration);
    const loop = track.loop === true;
    const window = Math.max(0, Math.min(duration - offset, loop ? duration : end - start));
    music = { assetId: asset.id, in: start, out: end, offset, loop, volume: finite(track.volume, 0, 2), fadeIn: finite(track.fadeIn, 0, window / 2), fadeOut: finite(track.fadeOut, 0, window / 2) };
  }
  const project: Project = { version: 1, name: typeof raw.name === "string" ? raw.name.slice(0, 100) : "Mi reel", aspect: raw.aspect as Project["aspect"], clips, texts, music };
  if (!Array.isArray(payload.textImages) || payload.textImages.length > 30) throw new EditorError("No se pudieron preparar los textos.");
  const size = dimensions(project.aspect, payload.resolution);
  const textImages: ExportPayload["textImages"] = [];
  let imageBytes = 0;
  for (const text of texts) {
    const image = payload.textImages.map(object).find(entry => entry.id === text.id);
    if (!image || typeof image.data !== "string" || !/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(image.data)) throw new EditorError("Falta la imagen de un texto. Vuelve a exportar desde el editor.");
    const bytes = Buffer.from(image.data.slice("data:image/png;base64,".length), "base64");
    imageBytes += bytes.length;
    if (bytes.length < 24 || bytes.length > 4 * 1024 * 1024 || imageBytes > 24 * 1024 * 1024 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.readUInt32BE(16) !== size.width || bytes.readUInt32BE(20) !== size.height) throw new EditorError("La imagen de texto no coincide con la resolución de exportación.");
    textImages.push({ id: text.id, data: image.data });
  }
  return { project, resolution: payload.resolution, textImages, assets } as ExportPayload & { assets: Map<string, Asset> };
}
async function persist(running: RunningJob) {
  running.persistence = (running.persistence ?? Promise.resolve()).catch(() => undefined).then(async () => {
    const directory = jobDirectory(running.job.id);
    const temporary = path.join(directory, "job.json.tmp");
    await writeFile(temporary, JSON.stringify({ ...running.job, name: running.name }), "utf8");
    await rename(temporary, path.join(directory, "job.json"));
  });
  await running.persistence;
}
function saturation(amount: number) {
  const weights = [0.213, 0.715, 0.072];
  return weights.map((_, row) => weights.map((weight, column) => weight * (1 - amount) + (row === column ? amount : 0)));
}
function matrixFilter(matrix: number[][]) {
  const channels = ["r", "g", "b"];
  return `colorchannelmixer=${matrix.flatMap((row, r) => row.map((value, c) => `${channels[r]}${channels[c]}=${n(value)}`)).join(":")}`;
}
function lookFilters(look: Look) {
  if (look === "original") return [];
  const filters = ["format=gbrp"];
  if (look === "warm") {
    const sepia = [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]].map((row, r) => row.map((value, c) => value * 0.18 + (r === c ? 0.82 : 0)));
    filters.push(matrixFilter(sepia), matrixFilter(saturation(1.1)));
  } else filters.push(matrixFilter(saturation(look === "mono" ? 0 : look === "vivid" ? 1.2 : 0.8)));
  const contrast = look === "vivid" ? 1.08 : look === "cinema" ? 1.12 : 1;
  if (contrast !== 1) filters.push(`lutrgb=r='(val-127.5)*${contrast}+127.5':g='(val-127.5)*${contrast}+127.5':b='(val-127.5)*${contrast}+127.5'`);
  return filters;
}
function tempoFilters(speed: number) {
  const filters: string[] = [];
  while (speed > 2) { filters.push("atempo=2"); speed /= 2; }
  while (speed < 0.5) { filters.push("atempo=0.5"); speed /= 0.5; }
  filters.push(`atempo=${n(speed)}`);
  return filters;
}
export function clipFilters(clip: Clip, asset: Asset, width: number, height: number, duration: number) {
  const scale = (clip.fit === "contain" ? Math.min : Math.max)(width / asset.width, height / asset.height) * clip.zoom;
  // Crop before scaling so zoomed 4K sources never create enormous intermediate frames.
  const cropWidth = Math.max(2, Math.floor(Math.min(asset.width, width / scale) / 2) * 2);
  const cropHeight = Math.max(2, Math.floor(Math.min(asset.height, height / scale) / 2) * 2);
  const drawnWidth = Math.min(width, Math.max(2, Math.round(Math.min(asset.width * scale, width) / 2) * 2));
  const drawnHeight = Math.min(height, Math.max(2, Math.round(Math.min(asset.height * scale, height) / 2) * 2));
  const video = [`setpts=(PTS-STARTPTS)/${n(clip.speed)}`, "fps=30", "scale=trunc(iw*sar/2)*2:ih", "setsar=1", `crop=${cropWidth}:${cropHeight}:(iw-ow)*${n(clip.x)}:(ih-oh)*${n(clip.y)}`, `scale=${drawnWidth}:${drawnHeight}:flags=lanczos`, `pad=${width}:${height}:(ow-iw)*${n(clip.x)}:(oh-ih)*${n(clip.y)}:black`, ...lookFilters(clip.look), "format=yuv420p", "tpad=stop_mode=clone:stop_duration=1", `trim=duration=${n(duration)}`];
  const audio = ["asetpts=PTS-STARTPTS", ...tempoFilters(clip.speed), "aresample=48000", "aformat=sample_fmts=fltp:channel_layouts=stereo", `volume=${n(clip.volume)}`, "apad", `atrim=duration=${n(duration)}`];
  const fade = Math.min(clip.fade, duration / 2);
  if (fade > 0) {
    video.push(`fade=t=in:st=0:d=${n(fade)}`, `fade=t=out:st=${n(duration - fade)}:d=${n(fade)}`);
    audio.push(`afade=t=in:st=0:d=${n(fade)}`, `afade=t=out:st=${n(duration - fade)}:d=${n(fade)}`);
  }
  return { video: video.join(","), audio: audio.join(",") };
}
async function render(running: RunningJob, payload: Awaited<ReturnType<typeof validateExport>>) {
  const directory = jobDirectory(running.job.id);
  const { project, resolution, assets } = payload;
  const size = dimensions(project.aspect, resolution);
  const total = durationOf(project);
  const execute = async (args: string[], progress?: (seconds: number) => number) => {
    if (running.cancelled) throw new Error("cancelled");
    let pending = "";
    try {
      await runProcess("ffmpeg", ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-threads", "2", "-filter_threads", "2", "-filter_complex_threads", "2", "-progress", "pipe:1", ...args], {
        timeout: 30 * 60 * 1000,
        onStart: child => { running.process = child; if (running.cancelled) child.kill("SIGKILL"); },
        onOutput: chunk => { pending += chunk; const lines = pending.split(/\r?\n/); pending = lines.pop() ?? ""; for (const line of lines) { const match = /^out_time_us=(\d+)$/.exec(line); if (match && progress) running.job.progress = Math.min(99, Math.max(running.job.progress, progress(Number(match[1]) / 1_000_000))); } },
      });
    } finally { running.process = undefined; }
    if (running.cancelled) throw new Error("cancelled");
  };
  try {
    running.job.status = "rendering";
    let elapsed = 0;
    let frames = 0;
    const parts: string[] = [];
    for (let index = 0; index < project.clips.length; index++) {
      const clip = project.clips[index];
      const asset = assets.get(clip.assetId)!;
      const sourceDuration = clipDuration(clip);
      const nextFrames = Math.max(frames + 1, Math.round((elapsed + sourceDuration) * 30));
      const duration = (nextFrames - frames) / 30;
      running.job.message = `Preparando clip ${index + 1} de ${project.clips.length}`;
      await persist(running);
      const output = path.join(directory, `clip-${index}.mkv`);
      const filters = clipFilters(clip, asset, size.width, size.height, duration);
      const inputs = ["-ss", n(clip.in), "-t", n(clip.out - clip.in), "-i", await mediaPath(clip.assetId)];
      if (!asset.hasAudio) inputs.push("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo");
      const graph = `[0:v:0]${filters.video}[v];[${asset.hasAudio ? "0:a:0" : "1:a:0"}]${filters.audio}[a]`;
      await execute([...inputs, "-filter_complex", graph, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", "-t", n(duration), output], seconds => ((elapsed + Math.min(seconds, sourceDuration)) / total) * 70);
      elapsed += sourceDuration;
      frames = nextFrames;
      parts.push(`file 'clip-${index}.mkv'`);
    }
    await writeFile(path.join(directory, "concat.txt"), parts.join("\n"));
    running.job.message = "Mezclando música y preparando los textos";
    running.job.progress = 70;
    await persist(running);
    let musicFile: string | null = null;
    if (project.music && project.music.offset < total) {
      musicFile = path.join(directory, "music.wav");
      await execute(["-ss", n(project.music.in), "-t", n(project.music.out - project.music.in), "-i", await mediaPath(project.music.assetId), "-vn", "-map", "0:a:0", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", musicFile]);
    }
    const args = ["-f", "concat", "-safe", "1", "-i", path.join(directory, "concat.txt")];
    let inputIndex = 1;
    let musicIndex = -1;
    if (musicFile) { musicIndex = inputIndex++; if (project.music!.loop) args.push("-stream_loop", "-1"); args.push("-i", musicFile); }
    for (let index = 0; index < payload.textImages.length; index++) {
      const file = path.join(directory, `text-${index}.png`);
      await writeFile(file, Buffer.from(payload.textImages[index].data.split(",")[1], "base64"));
      args.push("-loop", "1", "-framerate", "30", "-i", file);
    }
    const graph: string[] = [];
    let videoLabel = "0:v:0";
    project.texts.forEach((text, index) => { const next = `text${index}`; graph.push(`[${videoLabel}][${inputIndex + index}:v:0]overlay=0:0:enable='gte(t,${n(text.start)})*lt(t,${n(text.end)})':eof_action=repeat:shortest=1[${next}]`); videoLabel = next; });
    let audioLabel = "0:a:0";
    if (musicIndex >= 0 && project.music) {
      const music = project.music;
      const active = Math.min(total - music.offset, music.loop ? total : music.out - music.in);
      const filters = [`atrim=duration=${n(active)}`, "asetpts=PTS-STARTPTS", `volume=${n(music.volume)}`];
      if (music.fadeIn > 0) filters.push(`afade=t=in:st=0:d=${n(music.fadeIn)}`);
      if (music.fadeOut > 0) filters.push(`afade=t=out:st=${n(active - music.fadeOut)}:d=${n(music.fadeOut)}`);
      filters.push(`adelay=${Math.round(music.offset * 1000)}:all=1`, "apad");
      graph.push(`[${musicIndex}:a:0]${filters.join(",")}[music]`, "[0:a:0][music]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.98:level=0:latency=1[mixed]");
      audioLabel = "mixed";
    }
    if (graph.length) args.push("-filter_complex", graph.join(";"));
    args.push("-map", videoLabel === "0:v:0" ? videoLabel : `[${videoLabel}]`, "-map", audioLabel === "0:a:0" ? audioLabel : `[${audioLabel}]`, "-c:v", project.texts.length ? "libx264" : "copy");
    if (project.texts.length) args.push("-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p");
    args.push("-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-t", n(frames / 30), "-movflags", "+faststart", path.join(directory, "reel.mp4"));
    running.job.message = "Creando tu MP4";
    await execute(args, seconds => 70 + Math.min(seconds / total, 1) * 29);
    running.job = { ...running.job, status: "done", progress: 100, message: "Tu reel está listo", downloadUrl: `/api/video-editor/export/${running.job.id}/download` };
  } catch (error) {
    if (!running.cancelled) console.error("Video export failed:", error);
    running.job = { ...running.job, status: running.cancelled ? "cancelled" : "error", message: running.cancelled ? "Exportación cancelada" : "No se pudo exportar. Comprueba los archivos de origen y vuelve a intentarlo." };
  } finally {
    // Only remove generated intermediate files in this verified job directory.
    const resolved = path.resolve(directory);
    if (resolved.startsWith(path.resolve(JOBS_ROOT) + path.sep)) {
      for (const file of await readdir(directory).catch(() => [])) {
        if (/^(clip-\d+\.mkv|text-\d+\.png|concat\.txt|music\.wav)$/.test(file) || (file === "reel.mp4" && running.job.status !== "done")) await unlink(path.join(directory, file)).catch(() => undefined);
      }
    }
    await persist(running).catch(console.error);
    if (state.active === running.job.id) state.active = null;
  }
}
export async function startExport(input: unknown) {
  assertLocalRuntime();
  if (state.active) throw new EditorError("Ya hay una exportación en curso. Espera a que termine o cancélala.", 409);
  const id = randomUUID();
  state.active = id;
  try {
    if (!await binariesAvailable()) throw new EditorError("FFmpeg no está disponible. Ejecuta npm install y reinicia el servidor.", 503);
    const payload = await validateExport(input);
    await mkdir(jobDirectory(id), { recursive: true });
    const running: RunningJob = { job: { id, status: "queued", progress: 0, message: "Preparando exportación" }, cancelled: false, name: payload.project.name };
    state.jobs.set(id, running);
    await persist(running);
    void render(running, payload);
    return { ...running.job };
  } catch (error) { if (state.active === id) state.active = null; throw error; }
}
export async function getExport(id: string): Promise<ExportJob> {
  const directory = jobDirectory(id);
  const running = state.jobs.get(id);
  if (running) return { ...running.job };
  try {
    const saved = JSON.parse(await readFile(path.join(directory, "job.json"), "utf8")) as ExportJob & { name: string };
    if (saved.status === "queued" || saved.status === "rendering") return { id, status: "error", progress: saved.progress, message: "El servidor se reinició. Vuelve a exportar tu proyecto." };
    return { id, status: saved.status, progress: saved.progress, message: saved.message, ...(saved.downloadUrl ? { downloadUrl: saved.downloadUrl } : {}) };
  } catch { throw new EditorError("Exportación no encontrada.", 404); }
}
export async function cancelExport(id: string) {
  const job = await getExport(id);
  const running = state.jobs.get(id);
  if (running && (job.status === "queued" || job.status === "rendering")) { running.cancelled = true; running.job.status = "cancelled"; running.job.message = "Exportación cancelada"; running.process?.kill("SIGKILL"); await persist(running); return { ...running.job }; }
  return job;
}
export async function exportDownload(id: string) {
  const job = await getExport(id);
  if (job.status !== "done") throw new EditorError("La exportación todavía no está lista.", 409);
  const directory = jobDirectory(id);
  const file = path.join(directory, "reel.mp4");
  try { await access(file); } catch { throw new EditorError("El archivo exportado ya no está disponible. Vuelve a exportar.", 404); }
  const saved = JSON.parse(await readFile(path.join(directory, "job.json"), "utf8")) as { name?: string };
  const name = (saved.name || "Mi reel").replace(/[\\/:*?"<>|\x00-\x1f]/g, "-").slice(0, 100);
  return { file, name: `${name}.mp4` };
}
