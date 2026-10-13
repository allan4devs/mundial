import { JAVA_REACT_CAMPAIGN_JOBS } from "./data/cv-campaign-java-react";
import { JOB_SEARCH_RECORDS, type JobSearchRecord } from "./data/job-search-records";
import { DEFAULT_REMOTE_LOCATION } from "./java-react-jobs-constants";
import type { ApplicationStatus } from "./applications";
import type { JobLead } from "./java-react-jobs-types";

type CvMatch = Pick<JobLead, "cvPath" | "cvLabel" | "match" | "matchReason"> & {
  applicationSlug?: string;
};

const campaignJobs = Object.values(JAVA_REACT_CAMPAIGN_JOBS);

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function campaignMatch(job: JobSearchRecord): CvMatch | undefined {
  const company = normalized(job.company);
  const url = job.url.replace(/\/$/, "");
  const campaign = campaignJobs.find((candidate) => {
    const sameUrl = Boolean(url) && candidate.jobUrl.replace(/\/$/, "") === url;
    const candidateCompany = normalized(candidate.company);
    const sameCompany =
      company === candidateCompany || company.includes(candidateCompany) || candidateCompany.includes(company);
    return sameUrl || sameCompany;
  });
  if (!campaign) return undefined;
  return {
    applicationSlug: `java-react-2026/${campaign.key}`,
    cvPath: `/cv/archive/java-react-2026/${campaign.key}`,
    cvLabel: campaign.company,
    match: "tailored",
    matchReason: "Company-specific CV already exists.",
  };
}

function generalCvMatch(job: JobSearchRecord): CvMatch {
  const text = normalized(`${job.track} ${job.title} ${job.stack}`);
  if (/\b(ai|agent|agentic|llm|langchain|langgraph|openai|machine learning)\b/.test(text)) {
    return { cvPath: "/cv/archive/agentic-ai", cvLabel: "Agentic AI", match: "strong", matchReason: "AI and agentic engineering emphasis." };
  }
  if (/\b(c#|dotnet|asp net|net 8|azure)\b/.test(text) || job.track.startsWith(".NET")) {
    return { cvPath: "/cv/archive/python-dotnet", cvLabel: "Python + .NET", match: "strong", matchReason: ".NET, C# or Azure emphasis." };
  }
  if (/\b(elasticsearch|query dsl|search relevance)\b/.test(text)) {
    return { cvPath: "/cv/archive/elasticsearch", cvLabel: "Elasticsearch + Node", match: "strong", matchReason: "Search or Elasticsearch emphasis." };
  }
  if (/\b(django|remix)\b/.test(text)) {
    return { cvPath: "/cv/archive/electric-air", cvLabel: "Django + React", match: "strong", matchReason: "Django, React or Remix stack." };
  }
  if (job.track === "Python + React Full Stack") {
    return { cvPath: "/cv/archive/python-react-aws", cvLabel: "Python + React + AWS", match: "strong", matchReason: "Python and React full-stack track." };
  }
  if (job.track === "Python Backend") {
    return { cvPath: "/cv/archive/python-react-aws", cvLabel: "Python + AWS", match: "general", matchReason: "Closest existing Python-focused CV; backend details require review." };
  }
  if (job.track === "React + Node Full Stack" || /\b(nestjs|node js)\b/.test(text)) {
    return { cvPath: "/cv/archive/designli", cvLabel: "React + Node", match: "strong", matchReason: "React and Node/NestJS emphasis." };
  }
  if (job.track === "React / Frontend") {
    return { cvPath: "/cv/archive/designli", cvLabel: "React + Next.js", match: "strong", matchReason: "React-focused web role." };
  }
  if (job.track === "Java Backend") {
    return { cvPath: "/cv/archive/java", cvLabel: "Java + Spring Boot", match: "strong", matchReason: "Java backend track." };
  }
  if (job.track === "Java + React Full Stack" || (/\bjava\b/.test(text) && /\breact\b/.test(text))) {
    return { cvPath: "/cv/archive/master", cvLabel: "Java + React master", match: "strong", matchReason: "Java and React full-stack track." };
  }
  if (/\bjava\b/.test(text)) {
    return { cvPath: "/cv/archive/java", cvLabel: "Java + Spring Boot", match: "general", matchReason: "Java is present, but the full posting should be reviewed." };
  }
  return { cvPath: "/cv/archive/master", cvLabel: "General full-stack", match: "general", matchReason: "Broadest existing software CV; tailor it before applying." };
}

function mapStatus(status: string): ApplicationStatus {
  if (status === "Interview") return "interviewing";
  if (status === "Recruiter Contact") return "screening";
  if (status === "Applied") return "applied";
  if (status === "Offer") return "offer";
  return "draft";
}

function mapPriority(priority: string, userSignal: string): number {
  if (priority === "Top" || userSignal === "Interview") return 5;
  if (priority === "High" || userSignal) return 4;
  if (priority === "Medium") return 3;
  if (priority === "Low") return 1;
  return 0;
}

function toNumber(value: number | string): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function createDefaultJobs(): JobLead[] {
  return JOB_SEARCH_RECORDS.map((job) => {
    const cv = campaignMatch(job) ?? generalCvMatch(job);
    return {
      id: job.id,
      applicationSlug: cv.applicationSlug ?? `job-search/${job.id}`,
      company: job.company,
      title: job.title,
      location: job.eligibility || job.locationFit || DEFAULT_REMOTE_LOCATION,
      url: job.url,
      postedOn: job.lastSeen || undefined,
      ...cv,
      track: job.track,
      seniority: job.seniority,
      stack: job.stack,
      eligibility: job.eligibility,
      workMode: job.workMode,
      engagement: job.engagement,
      sourcePriority: job.sourcePriority,
      matchScore: toNumber(job.matchScore),
      locationFit: job.locationFit,
      contractorSignal: job.contractorSignal,
      preferenceExclusion: job.preferenceExclusion,
      userSignal: job.userSignal,
      sourceStatus: job.sourceStatus,
      firstSeen: job.firstSeen,
      lastSeen: job.lastSeen,
      seenCount: toNumber(job.seenCount),
      nextStep: job.nextStep,
      recordQuality: job.recordQuality,
      sources: job.sources,
      sourceNotes: job.notes,
      initialStatus: mapStatus(job.sourceStatus),
      initialPriority: mapPriority(job.sourcePriority, job.userSignal),
      seeded: true,
    } satisfies JobLead;
  });
}

export const JOB_TRACKS = [
  ...new Set(JOB_SEARCH_RECORDS.map((job) => job.track).filter(Boolean)),
].sort((a, b) => a.localeCompare(b));
