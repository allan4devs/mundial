import { apiError, assertSameOrigin } from "@/lib/video-editor/server-media";
import { readExportPayload, startExport } from "@/lib/video-editor/server-export";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { assertSameOrigin(request); return Response.json(await startExport(await readExportPayload(request)), { status: 202 }); } catch (error) { return apiError(error); } }
