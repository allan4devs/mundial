export type JobAvailabilityStatus = "open" | "closed" | "blocked" | "unknown";

export type JobAvailabilityResult = {
  status: JobAvailabilityStatus;
  url: string;
  checkedAt: string;
  httpStatus: number | null;
  pageTitle: string;
  reason: string;
  evidence: string[];
  pageText: string;
};
