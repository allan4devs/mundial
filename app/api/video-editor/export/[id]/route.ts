import { apiError, assertSameOrigin } from "@/lib/video-editor/server-media";
import { cancelExport, getExport } from "@/lib/video-editor/server-export";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) { try { return Response.json(await getExport((await params).id)); } catch (error) { return apiError(error); } }
export async function DELETE(request: Request, { params }: Context) { try { assertSameOrigin(request); return Response.json(await cancelExport((await params).id)); } catch (error) { return apiError(error); } }
