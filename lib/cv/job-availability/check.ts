import { fetchPublicHtml, ScrapeError } from "../scraper/fetch";
import { analyzeJobAvailability } from "./analyze";
import type { JobAvailabilityResult } from "./types";

export async function checkJobAvailability(url: string, title: string, signal?: AbortSignal): Promise<JobAvailabilityResult> {
  try {
    const page = await fetchPublicHtml(url, signal);
    return { ...analyzeJobAvailability(page.html, page.url, title), httpStatus: page.status };
  } catch (error) {
    if (!(error instanceof ScrapeError) || ["INVALID_URL", "INVALID_PROTOCOL", "UNSAFE_URL", "UNSAFE_ADDRESS", "SCAN_CANCELLED"].includes(error.code)) throw error;
    const status = error.upstreamStatus ?? null;
    const blocked = error.code === "WEBSITE_BLOCKED";
    const missing = status === 404 || status === 410;
    return {
      status: blocked ? "blocked" : missing ? "closed" : "unknown",
      url, checkedAt: new Date().toISOString(), httpStatus: status,
      pageTitle: "", pageText: "", evidence: status ? [`HTTP ${status}`] : [error.code],
      reason: blocked ? `The website blocked the check (HTTP ${status}). Open the Job link to verify manually.`
        : missing ? `The job URL returned HTTP ${status}; this posting is no longer available at that address.` : error.message,
    };
  }
}
