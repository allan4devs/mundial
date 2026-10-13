import type { ApplicationState, ApplicationStatus } from "./applications";

export type JobLead = {
  id: string;
  applicationSlug: string;
  company: string;
  title: string;
  location: string;
  url: string;
  postedOn?: string;
  match: "tailored" | "strong" | "general";
  cvPath?: string;
  cvLabel?: string;
  matchReason: string;
  track: string;
  seniority: string;
  stack: string;
  eligibility: string;
  workMode: string;
  engagement: string;
  sourcePriority: string;
  matchScore?: number;
  locationFit: string;
  contractorSignal: string;
  preferenceExclusion: string;
  userSignal: string;
  sourceStatus: string;
  firstSeen: string;
  lastSeen: string;
  seenCount?: number;
  nextStep: string;
  recordQuality: string;
  sources: string;
  sourceNotes: string;
  initialStatus: ApplicationStatus;
  initialPriority: number;
  seeded: boolean;
};

export type JobLeadPatch = Partial<Pick<JobLead, "company" | "title" | "location" | "url">>;
export type StatusFilter = ApplicationStatus | "all";
export type TrackFilter = string | "all";

export type JobRowModel = {
  job: JobLead;
  index: number;
  state: ApplicationState;
};

export type JobStats = {
  filled: number;
  matched: number;
  applied: number;
  active: number;
  offers: number;
};
