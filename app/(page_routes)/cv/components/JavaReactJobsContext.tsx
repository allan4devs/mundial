"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ApplicationState } from "../applications";
import { useApplications } from "../useApplications";
import { createDefaultJobs } from "../java-react-jobs-data";
import { calculateJobStats, selectJobRows } from "../java-react-jobs-helpers";
import { readStoredJobs, writeStoredJobs } from "../java-react-jobs-memory";
import type { JobLead, JobLeadPatch, JobRowModel, JobStats, StatusFilter, TrackFilter } from "../java-react-jobs-types";

type JobBoardContextValue = {
  ready: boolean;
  rows: JobRowModel[];
  stats: JobStats;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  statusFilter: StatusFilter;
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
  trackFilter: TrackFilter;
  setTrackFilter: Dispatch<SetStateAction<TrackFilter>>;
  openId: string | null;
  toggleOpen: (id: string) => void;
  updateJob: (id: string, patch: JobLeadPatch) => void;
  updateApplication: (slug: string, patch: Partial<ApplicationState>) => void;
};

const JobBoardContext = createContext<JobBoardContextValue | null>(null);

export function JobBoardProvider({ children }: { children: ReactNode }) {
  const { get: getStoredApplication, raw: storedApplications, update: updateApplication, ready } = useApplications();
  const [jobs, setJobs] = useState<JobLead[]>(createDefaultJobs);
  const [storageReady, setStorageReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setJobs(readStoredJobs(createDefaultJobs()));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (storageReady) writeStoredJobs(jobs);
  }, [jobs, storageReady]);

  const getApplication = useCallback(
    (job: JobLead): ApplicationState => {
      const state = getStoredApplication(job.applicationSlug);
      if (Object.prototype.hasOwnProperty.call(storedApplications, job.applicationSlug)) return state;
      return { ...state, status: job.initialStatus, stage: job.nextStep, priority: job.initialPriority, notes: job.sourceNotes };
    },
    [getStoredApplication, storedApplications],
  );

  const rows = useMemo(
    () => selectJobRows({ jobs, getApplication, query, statusFilter, trackFilter }),
    [getApplication, jobs, query, statusFilter, trackFilter],
  );
  const stats = useMemo(() => calculateJobStats(jobs, getApplication), [getApplication, jobs]);

  const value = useMemo<JobBoardContextValue>(
    () => ({
      ready,
      rows,
      stats,
      query,
      setQuery,
      statusFilter,
      setStatusFilter,
      trackFilter,
      setTrackFilter,
      openId,
      toggleOpen: (id) => setOpenId((current) => (current === id ? null : id)),
      updateJob: (id, patch) =>
        setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job))),
      updateApplication,
    }),
    [openId, query, ready, rows, stats, statusFilter, trackFilter, updateApplication],
  );

  return <JobBoardContext.Provider value={value}>{children}</JobBoardContext.Provider>;
}

export function useJobBoard(): JobBoardContextValue {
  const context = useContext(JobBoardContext);
  if (!context) throw new Error("useJobBoard must be used inside JobBoardProvider");
  return context;
}
