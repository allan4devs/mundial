import { apiError, streamFile, thumbnailPath } from "@/lib/video-editor/server-media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { return await streamFile(request, await thumbnailPath((await params).id)); } catch (error) { return apiError(error); } }
