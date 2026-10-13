import type { ApplicationState } from "./applications";
import type { JobLead, JobRowModel, JobStats, StatusFilter, TrackFilter } from "./java-react-jobs-types";

type GetApplication = (job: JobLead) => ApplicationState;

export function isFilledJob(job: JobLead): boolean {
  return Boolean(job.company.trim() || job.title.trim() || job.url.trim());
}

export function selectJobRows({
  jobs,
  getApplication,
  query,
  statusFilter,
  trackFilter,
}: {
  jobs: JobLead[];
  getApplication: GetApplication;
  query: string;
  statusFilter: StatusFilter;
  trackFilter: TrackFilter;
}): JobRowModel[] {
  const normalizedQuery = query.trim().toLowerCase();
  return jobs
    .map((job, index) => ({ job, index, state: getApplication(job) }))
    .filter(({ job, state }) => {
      if (statusFilter !== "all" && state.status !== statusFilter) return false;
      if (trackFilter !== "all" && job.track !== trackFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = `${job.company} ${job.title} ${job.location} ${job.track} ${job.stack} ${job.eligibility} ${job.engagement} ${job.userSignal} ${state.stage} ${state.notes}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
}

export function calculateJobStats(jobs: JobLead[], getApplication: GetApplication): JobStats {
  const stats: JobStats = { filled: 0, matched: 0, applied: 0, active: 0, offers: 0 };
  for (const job of jobs) {
    if (isFilledJob(job)) stats.filled += 1;
    if (job.match !== "general") stats.matched += 1;
    const status = getApplication(job).status;
    if (status !== "draft" && status !== "archived") stats.applied += 1;
    if (status === "screening" || status === "interviewing" || status === "assessment") stats.active += 1;
    if (status === "offer") stats.offers += 1;
  }
  return stats;
}
