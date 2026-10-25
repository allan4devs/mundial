import { HOT_LIMIT } from "./java-react-jobs-constants";
import { jobPostingKey } from "./java-react-jobs-helpers";
import type { JobLead, JobRowModel } from "./java-react-jobs-types";

export const JOB_AUDIT_AS_OF = "2026-10-24";
export const MIN_JOB_FIT = 5;

/** Employer aliases observed in the catalog, without merging unrelated recruiters. */
export function jobCompanyKey(company: string): string {
  const key = company.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  if (/^(encora|coforge)(\b|$)/.test(key)) return "encora coforge";
  if (/^fullstack(?: labs)?$/.test(key)) return "fullstack";
  if (/^bluelight(?: consulting)?$/.test(key)) return "bluelight";
  if (/^(?:we are )?tims$/.test(key)) return "tims";
  if (/^luxoft(?: singapore)?$/.test(key)) return "luxoft";
  if (/^capgemini(?: engineering)?$/.test(key)) return "capgemini";
  if (/^(?:perform|total performance consulting)$/.test(key)) return "perform";
  return key.replace(/\b(?:inc|llc|ltd|limited|corp|corporation)$/, "").trim();
}

export function isOctober2026Posting(job: Pick<JobLead, "postedOn">): boolean {
  const date = job.postedOn ?? "";
  return /^2026-10-\d{2}$/.test(date) && date >= "2026-10-01" && date <= JOB_AUDIT_AS_OF
    && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

/** Fit first; actual publication date, availability and personal priority break ties. */
export function compareAuditCandidates(a: JobRowModel, b: JobRowModel): number {
  return b.job.rating10 - a.job.rating10
    || (b.job.postedOn ?? "").localeCompare(a.job.postedOn ?? "")
    || Number(b.job.listingStatus === "open") - Number(a.job.listingStatus === "open")
    || b.state.priority - a.state.priority
    || a.job.id.localeCompare(b.job.id);
}

export function hasApplicationHistory({ job, state }: Pick<JobRowModel, "job" | "state">): boolean {
  return Boolean(job.seen || state.appliedOn?.trim()) || state.status !== "draft" || job.initialStatus !== "draft";
}

/** Recompute after local history hydrates. Archive membership never erases pipeline history. */
export function auditJobRows(rows: JobRowModel[], dismissedIds: string[] = []): JobRowModel[] {
  const dismissed = new Set(dismissedIds);
  const usedCompanies = new Set<string>();
  const usedPostings = new Set<string>();
  const skippedCompanies = new Set<string>();
  for (const row of rows) {
    const company = jobCompanyKey(row.job.company);
    const posting = jobPostingKey(row.job.url);
    if (hasApplicationHistory(row)) {
      if (company) usedCompanies.add(company);
      if (posting) usedPostings.add(posting);
    }
    if (dismissed.has(row.job.id) && company) skippedCompanies.add(company);
  }

  const audited = rows.map((row): JobRowModel => {
    const { job, state } = row;
    const company = jobCompanyKey(job.company);
    const posting = jobPostingKey(job.url);
    let archiveReason: string | undefined;
    if (job.seen) archiveReason = "Already viewed";
    else if (hasApplicationHistory(row)) archiveReason = `Application history: ${state.status === "draft" ? job.initialStatus : state.status}${state.appliedOn ? ` (${state.appliedOn})` : ""}`;
    else if (usedCompanies.has(company) || (posting && usedPostings.has(posting))) archiveReason = "Company or posting already viewed / contacted";
    else if (!Number.isFinite(job.rating10) || job.rating10 < MIN_JOB_FIT) archiveReason = "Below 50% deterministic fit";
    else if (job.listingStatus === "closed") archiveReason = "Listing closed";
    else if (!company || !posting) archiveReason = "Missing company or posting link";
    else if (!isOctober2026Posting(job)) archiveReason = job.postedOn ? "Outside October 1–24, 2026" : "Publication date unverified";
    else if (skippedCompanies.has(company) || dismissed.has(job.id)) archiveReason = "Skipped from HOT";
    return { ...row, hot: false, archiveReason, auditRank: undefined };
  });

  const selectedCompanies = new Set<string>();
  const selectedPostings = new Set<string>();
  let rank = 0;
  for (const row of audited.filter((row) => !row.archiveReason).sort(compareAuditCandidates)) {
    const company = jobCompanyKey(row.job.company);
    const posting = jobPostingKey(row.job.url)!;
    if (selectedCompanies.has(company)) row.archiveReason = "Duplicate company — higher-ranked job retained";
    else if (selectedPostings.has(posting)) row.archiveReason = "Duplicate posting — higher-ranked job retained";
    else if (rank >= HOT_LIMIT) row.archiveReason = "Outside the top 10 October shortlist";
    else {
      row.auditRank = ++rank;
      selectedCompanies.add(company);
      selectedPostings.add(posting);
    }
  }
  return audited;
}
