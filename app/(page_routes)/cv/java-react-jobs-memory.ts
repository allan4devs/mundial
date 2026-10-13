import { DEFAULT_REMOTE_LOCATION, JOBS_STORAGE_KEY } from "./java-react-jobs-constants";
import type { JobLead } from "./java-react-jobs-types";

const editableKeys = ["company", "title", "location", "url"] as const;

export function readStoredJobs(defaults: JobLead[]): JobLead[] {
  try {
    const raw = window.localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaults;

    const savedById = new Map<string, Partial<JobLead>>();
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const candidate = entry as Partial<JobLead>;
      if (typeof candidate.id === "string") savedById.set(candidate.id, candidate);
    }

    return defaults.map((fallback) => {
      const saved = savedById.get(fallback.id);
      if (!saved) return fallback;
      const savedWasUntouched =
        !saved.company?.trim() &&
        !saved.title?.trim() &&
        !saved.url?.trim() &&
        (!saved.location?.trim() || saved.location === DEFAULT_REMOTE_LOCATION);
      if (savedWasUntouched && (fallback.company || fallback.title || fallback.url)) return fallback;
      const restored = { ...fallback };
      for (const key of editableKeys) {
        if (typeof saved[key] === "string") restored[key] = saved[key];
      }
      return restored;
    });
  } catch {
    return defaults;
  }
}

export function writeStoredJobs(jobs: JobLead[]): void {
  try {
    const editable = jobs.map((job) => ({
      id: job.id,
      company: job.company,
      title: job.title,
      location: job.location,
      url: job.url,
    }));
    window.localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(editable));
  } catch {
    /* localStorage unavailable or full */
  }
}
