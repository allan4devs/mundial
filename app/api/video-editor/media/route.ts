import { apiError, listMedia, uploadMedia } from "@/lib/video-editor/server-media";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { try { return Response.json(await listMedia()); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { return Response.json({ asset: await uploadMedia(request) }, { status: 201 }); } catch (error) { return apiError(error); } }
