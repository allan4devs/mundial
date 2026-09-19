import { apiError, streamFile } from "@/lib/video-editor/server-media";
import { exportDownload } from "@/lib/video-editor/server-export";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const download = await exportDownload((await params).id); return await streamFile(request, download.file, download.name); } catch (error) { return apiError(error); } }
export const HEAD = GET;
