import { createReadStream } from "node:fs";
import { access, lstat, mkdir, open, readdir, realpath, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import type { Asset } from "./types";

export const MEDIA_ROOT = path.join(process.cwd(), "app", "(page_routes)", "video-generator", "videos-reel1");
export const WORK_ROOT = path.join(process.cwd(), "tmp", "video-editor");
export const UPLOAD_LIMIT = 256 * 1024 * 1024;
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".opus"]);
const MIME: Record<string, string> = { ".mp4": "video/mp4", ".mov": "video/quicktime", ".m4v": "video/mp4", ".webm": "video/webm", ".mkv": "video/x-matroska", ".avi": "video/x-msvideo", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg", ".flac": "audio/flac", ".opus": "audio/ogg", ".jpg": "image/jpeg" };
export class EditorError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function apiError(error: unknown) {
  if (error instanceof EditorError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Video editor:", error);
  return Response.json({ error: "No se pudo completar la operación. Comprueba los archivos y el espacio disponible." }, { status: 500 });
}
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    throw new EditorError("Esta operación solo está disponible desde el editor.", 403);
  }
}
export function assertLocalRuntime() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) throw new EditorError("La exportación y las subidas necesitan ejecutar este editor en tu computadora o en un servidor Node con disco persistente.", 503);
}
export async function binariesAvailable() {
  try { assertLocalRuntime(); if (!ffmpegPath) return false; await Promise.all([access(ffmpegPath), access(ffprobe.path)]); return true; } catch { return false; }
}
export async function runProcess(binary: "ffmpeg" | "ffprobe", args: string[], options: { timeout?: number; onStart?: (process: ChildProcess) => void; onOutput?: (chunk: string) => void } = {}) {
  const executable = binary === "ffmpeg" ? ffmpegPath : ffprobe.path;
  if (!executable) throw new EditorError("No se encontró FFmpeg. Ejecuta npm install y reinicia el servidor.", 503);
  return new Promise<string>((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let errors = "";
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, options.timeout ?? 45_000);
    child.stdout.on("data", (chunk: Buffer) => { const text = chunk.toString(); output = (output + text).slice(-4_000_000); options.onOutput?.(text); });
    child.stderr.on("data", (chunk: Buffer) => { errors = (errors + chunk.toString()).slice(-8_000); });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("close", (code) => { clearTimeout(timer); if (code === 0) resolve(output); else reject(new Error(timedOut ? "FFmpeg excedió el tiempo de procesamiento." : errors.trim() || `FFmpeg terminó con código ${code}.`)); });
    options.onStart?.(child);
  });
}
function validMediaName(id: string) {
  return id.length > 0 && id.length <= 255 && id === path.basename(id) && !/[\\/:\x00-\x1f]/.test(id) && !id.startsWith(".") && (VIDEO_EXTENSIONS.has(path.extname(id).toLowerCase()) || AUDIO_EXTENSIONS.has(path.extname(id).toLowerCase()));
}
export async function mediaPath(id: string) {
  if (!validMediaName(id)) throw new EditorError("Archivo no válido.", 404);
  const root = await realpath(MEDIA_ROOT);
  const file = path.join(root, id);
  try {
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink() || await realpath(file) !== file) throw new Error("Not a regular file");
    return file;
  } catch { throw new EditorError("El archivo ya no está en videos-reel1.", 404); }
}
type Probe = { format?: { duration?: string }; streams?: { codec_type?: string; width?: number; height?: number; duration?: string; sample_aspect_ratio?: string; disposition?: { attached_pic?: number }; tags?: { rotate?: string }; side_data_list?: { rotation?: number }[] }[] };
const globalMedia = globalThis as typeof globalThis & { videoEditorAssets?: Map<string, { signature: string; asset: Asset }>; videoEditorThumbnails?: Map<string, Promise<string>> };
const cache = globalMedia.videoEditorAssets ??= new Map();
const thumbnails = globalMedia.videoEditorThumbnails ??= new Map();
export async function inspectAsset(id: string): Promise<Asset> {
  const file = await mediaPath(id);
  const info = await stat(file);
  const signature = `${info.size}-${info.mtimeMs}`;
  const cached = cache.get(id);
  if (cached?.signature === signature) return cached.asset;
  const data = JSON.parse(await runProcess("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", file])) as Probe;
  const video = data.streams?.find(stream => stream.codec_type === "video" && !stream.disposition?.attached_pic);
  const audio = data.streams?.find(stream => stream.codec_type === "audio");
  const duration = Number(video?.duration ?? data.format?.duration ?? audio?.duration);
  if ((!video && !audio) || !Number.isFinite(duration) || duration <= 0) throw new EditorError(`No se pudo leer la duración de ${id}.`);
  let width = video?.width ?? 0;
  let height = video?.height ?? 0;
  const sar = video?.sample_aspect_ratio?.split(":").map(Number);
  if (sar?.length === 2 && sar[0] > 0 && sar[1] > 0) width = Math.round(width * sar[0] / sar[1]);
  const rotation = video?.side_data_list?.find(side => side.rotation !== undefined)?.rotation ?? Number(video?.tags?.rotate ?? 0);
  if (Math.abs(rotation) % 180 === 90) [width, height] = [height, width];
  const base = `/api/video-editor/media/${encodeURIComponent(id)}`;
  const asset: Asset = { id, name: id, url: `${base}?v=${Math.round(info.mtimeMs)}`, kind: video ? "video" : "audio", duration, width, height, hasAudio: !!audio, ...(video ? { thumbnail: `${base}/thumbnail?v=${Math.round(info.mtimeMs)}` } : {}) };
  cache.set(id, { signature, asset });
  return asset;
}
export async function listMedia() {
  await mkdir(MEDIA_ROOT, { recursive: true });
  const names = (await readdir(MEDIA_ROOT, { withFileTypes: true })).filter(file => file.isFile() && validMediaName(file.name)).map(file => file.name).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const assets: Asset[] = [];
  const errors: string[] = [];
  // Keep probing bounded even when users add hundreds of source files.
  for (let index = 0; index < names.length; index += 4) {
    const results = await Promise.allSettled(names.slice(index, index + 4).map(inspectAsset));
    results.forEach((result, offset) => { if (result.status === "fulfilled") assets.push(result.value); else errors.push(`No se pudo leer ${names[index + offset]}. Comprueba que la descarga terminó y el archivo se reproduce.`); });
  }
  return { assets, errors, exportAvailable: await binariesAvailable() };
}
export async function uploadMedia(request: Request) {
  assertSameOrigin(request); assertLocalRuntime();
  const maxBody = UPLOAD_LIMIT + 1024 * 1024;
  if (Number(request.headers.get("content-length")) > maxBody) throw new EditorError("Cada archivo puede ocupar hasta 256 MB.", 413);
  if (!request.body) throw new EditorError("Selecciona un archivo.");
  let bytes = 0;
  const limitedBody = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) { bytes += chunk.byteLength; if (bytes > maxBody) throw new EditorError("Cada archivo puede ocupar hasta 256 MB.", 413); controller.enqueue(chunk); } }));
  const form = await new Response(limitedBody, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) throw new EditorError("Selecciona un video o audio válido.");
  if (file.size > UPLOAD_LIMIT) throw new EditorError("Cada archivo puede ocupar hasta 256 MB.", 413);
  const extension = path.extname(file.name).toLowerCase();
  if (!VIDEO_EXTENSIONS.has(extension) && !AUDIO_EXTENSIONS.has(extension)) throw new EditorError("Usa MP4, MOV, WebM, MKV, MP3, WAV, M4A, AAC, OGG o FLAC.");
  const stem = path.basename(file.name, path.extname(file.name)).normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "clip";
  const id = `${stem}-${randomUUID().slice(0, 8)}${extension}`;
  await mkdir(MEDIA_ROOT, { recursive: true });
  const target = path.join(await realpath(MEDIA_ROOT), id);
  let created = false;
  try {
    const destination = await open(target, "wx");
    created = true;
    try { await pipeline(Readable.fromWeb(file.stream() as import("node:stream/web").ReadableStream), destination.createWriteStream()); }
    finally { await destination.close().catch(() => undefined); }
    return await inspectAsset(id);
  } catch (error) { if (created) await unlink(target).catch(() => undefined); throw error instanceof EditorError ? error : new EditorError("No pudimos leer este archivo. Comprueba que sea un video o audio completo."); }
}
export async function thumbnailPath(id: string) {
  const asset = await inspectAsset(id);
  if (asset.kind !== "video") throw new EditorError("Este archivo no tiene imagen.", 404);
  const file = await mediaPath(id);
  const info = await stat(file);
  const hash = createHash("sha256").update(`${file}:${info.size}:${info.mtimeMs}`).digest("hex");
  const target = path.join(WORK_ROOT, "thumbs", `${hash}.jpg`);
  try { await access(target); return target; } catch { /* Generate it once. */ }
  let promise = thumbnails.get(hash);
  if (!promise) {
    promise = (async () => { await mkdir(path.dirname(target), { recursive: true }); await runProcess("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(Math.min(0.5, asset.duration / 2)), "-i", file, "-frames:v", "1", "-vf", "scale=320:320:force_original_aspect_ratio=decrease", "-q:v", "3", target]); return target; })().finally(() => thumbnails.delete(hash));
    thumbnails.set(hash, promise);
  }
  return promise;
}
export async function streamFile(request: Request, file: string, downloadName?: string) {
  const info = await stat(file);
  let start = 0;
  let end = info.size - 1;
  const headers = new Headers({ "Accept-Ranges": "bytes", "Content-Type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "private, no-cache", "X-Content-Type-Options": "nosniff" });
  if (downloadName) headers.set("Content-Disposition", `attachment; filename="reel.mp4"; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
  }
  headers.set("Content-Length", String(Math.max(0, end - start + 1)));
  if (request.method === "HEAD") return new Response(null, { status: range ? 206 : 200, headers });
  const stream = createReadStream(file, { start, end });
  const abort = () => { stream.destroy(); };
  request.signal.addEventListener("abort", abort, { once: true });
  stream.once("close", () => request.signal.removeEventListener("abort", abort));
  return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers });
}
