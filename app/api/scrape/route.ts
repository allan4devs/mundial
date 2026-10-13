import { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { extractScrapeResult } from "@/lib/cv/scraper/extract";
import { fetchPublicHtml, ScrapeError } from "@/lib/cv/scraper/fetch";
import type { ScrapeErrorResponse } from "@/lib/cv/scraper/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };
const MAX_REQUEST_BYTES = 8 * 1024;

function errorResponse(error: string, code: string, status: number): Response {
  const body: ScrapeErrorResponse = { error, code };
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

function accessError(request: NextRequest): Response | null {
  if (!getAdminFromRequest(request)) {
    return errorResponse("Sign in with your admin account to scan a website.", "ADMIN_REQUIRED", 401);
  }
  const origin = request.headers.get("origin");
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return errorResponse("Invalid request origin.", "INVALID_ORIGIN", 403);
  }
  return null;
}

async function scan(value: unknown, request: NextRequest): Promise<Response> {
  if (typeof value !== "string" || !value.trim()) {
    return errorResponse("Enter a website URL to scan.", "URL_REQUIRED", 400);
  }
  try {
    const { html, url } = await fetchPublicHtml(value, request.signal);
    return Response.json(extractScrapeResult(html, url), { headers: RESPONSE_HEADERS });
  } catch (error) {
    if (error instanceof ScrapeError) return errorResponse(error.message, error.code, error.status);
    return errorResponse("The webpage could not be processed. Try a direct job or application URL.", "SCAN_FAILED", 502);
  }
}

/** Legacy URL-query contract; POST keeps target URLs out of browser history. */
export async function GET(request: NextRequest): Promise<Response> {
  const denied = accessError(request);
  if (denied) return denied;
  return scan(request.nextUrl.searchParams.get("url"), request);
}

async function readBody(request: NextRequest): Promise<unknown> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
    throw new ScrapeError("Send a JSON body containing a website URL.", 415, "INVALID_CONTENT_TYPE");
  }
  if (Number(request.headers.get("content-length") || 0) > MAX_REQUEST_BYTES) {
    throw new ScrapeError("The scan request is too large.", 413, "REQUEST_TOO_LARGE");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ScrapeError("Send a JSON body containing a website URL.", 400, "INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => {});
        throw new ScrapeError("The scan request is too large.", 413, "REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch {
    throw new ScrapeError("Send a valid JSON body containing a website URL.", 400, "INVALID_BODY");
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const denied = accessError(request);
  if (denied) return denied;
  try {
    const body = await readBody(request);
    return scan(body && typeof body === "object" && "url" in body ? body.url : undefined, request);
  } catch (error) {
    if (error instanceof ScrapeError) return errorResponse(error.message, error.code, error.status);
    if (request.signal.aborted) return errorResponse("The scan was cancelled.", "SCAN_CANCELLED", 408);
    return errorResponse("The scan request could not be read.", "INVALID_BODY", 400);
  }
}
