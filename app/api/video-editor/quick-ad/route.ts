import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { apiError, assertLocalRuntime, assertSameOrigin, EditorError, runProcess, WORK_ROOT } from "@/lib/video-editor/server-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_SIZE = 120 * 1024 * 1024;

export async function POST(request: Request) {
  let directory = "";
  try {
    assertSameOrigin(request);
    assertLocalRuntime();
    const form = await request.formData();
    const video = form.get("video");
    const duration = Number(form.get("duration"));
    if (!(video instanceof File)) throw new EditorError("No se recibió la grabación del anuncio.");
    if (video.size < 1 || video.size > MAX_SIZE) throw new EditorError("La grabación supera el límite de 120 MB.", 413);
    if (video.type !== "video/webm") throw new EditorError("La grabación debe estar en formato WebM.");
    if (!Number.isFinite(duration) || duration < 10 || duration > 30) throw new EditorError("La duración del anuncio debe estar entre 10 y 30 segundos.");
    directory = path.join(WORK_ROOT, "quick-ad", randomUUID());
    await mkdir(directory, { recursive: true });
    const input = path.join(directory, "ad.webm");
    const output = path.join(directory, "ad.mp4");
    await writeFile(input, Buffer.from(await video.arrayBuffer()));
    await runProcess("ffmpeg", ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-i", input, "-map", "0:v:0", "-map", "0:a?", "-t", String(duration), "-r", "30", "-c:v", "libx264", "-preset", "fast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", output], { timeout: 120_000 });
    const bytes = await readFile(output);
    return new Response(bytes, { headers: { "Content-Type": "video/mp4", "Content-Disposition": 'attachment; filename="mi-anuncio.mp4"', "Content-Length": String(bytes.byteLength), "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
  finally { if (directory) await rm(directory, { recursive: true, force: true }).catch(() => undefined); }
}
