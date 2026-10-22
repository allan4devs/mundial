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
import { HOT_LIMIT } from "../java-react-jobs-constants";
import { calculateJobStats, compareByRating, jobPostingKey, matchesJobFilters, selectJobRows, toJobRows } from "../java-react-jobs-helpers";
import { formatHotIds, loadHotIds, saveHotIds, seedHotIds } from "../java-react-jobs-hot";
import { readStoredJobs, writeStoredJobs } from "../java-react-jobs-memory";
import type {
  JobLead,
  JobLeadPatch,
  JobRowModel,
  JobStats,
  RatingFilter,
  SortMode,
  StatusFilter,
  TrackFilter,
} from "../java-react-jobs-types";

type JobBoardContextValue = {
  ready: boolean;
  rows: JobRowModel[];
  hotRows: JobRowModel[];
  hotIds: string[];
  hotFromSeed: boolean;
  toggleHot: (id: string) => boolean;
  resetHot: () => void;
  hotExport: string;
  stats: JobStats;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  statusFilter: StatusFilter;
  setStatusFilter: Dispatch<SetStateAction<StatusFilter>>;
  trackFilter: TrackFilter;
  setTrackFilter: Dispatch<SetStateAction<TrackFilter>>;
  minRating: RatingFilter;
  setMinRating: Dispatch<SetStateAction<RatingFilter>>;
  sortMode: SortMode;
  setSortMode: Dispatch<SetStateAction<SortMode>>;
  view: "active" | "seen";
  setView: Dispatch<SetStateAction<"active" | "seen">>;
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
  const [view, setView] = useState<"active" | "seen">("active");
  const [minRating, setMinRating] = useState<RatingFilter>(0);
  const [sortMode, setSortMode] = useState<SortMode>("rating");
  const [hotIds, setHotIds] = useState<string[]>(seedHotIds);
  const [hotFromSeed, setHotFromSeed] = useState(true);

  useEffect(() => {
    setJobs(readStoredJobs(createDefaultJobs()));
    const storedHot = loadHotIds();
    if (storedHot) {
      setHotIds(storedHot);
      setHotFromSeed(false);
    }
    setStorageReady(true);
  }, []);

  const toggleHot = useCallback(
    (id: string) => {
      const job = jobs.find((candidate) => candidate.id === id);
      if (!hotIds.includes(id) && job?.listingStatus !== "open") return false;
      const isHot = hotIds.includes(id);
      const targetPostingKey = job ? jobPostingKey(job.url) : null;
      if (!isHot && targetPostingKey && hotIds.some((hotId) => {
        const pinnedJob = jobs.find((candidate) => candidate.id === hotId);
        return pinnedJob && jobPostingKey(pinnedJob.url) === targetPostingKey;
      })) return false;
      if (!isHot && hotIds.length >= HOT_LIMIT) return false;
      const next = isHot ? hotIds.filter((hotId) => hotId !== id) : [...hotIds, id];
      setHotIds(next);
      setHotFromSeed(false);
      saveHotIds(next);
      return true;
    },
    [hotIds, jobs],
  );

  const resetHot = useCallback(() => {
    saveHotIds(null);
    setHotIds(seedHotIds());
    setHotFromSeed(true);
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

  const allRows = useMemo(
    () => toJobRows(jobs, getApplication, new Set(hotIds)),
    [getApplication, hotIds, jobs],
  );
  const rows = useMemo(
    () => selectJobRows({ rows: allRows, query, statusFilter, trackFilter, minRating, sortMode, view }),
    [allRows, minRating, query, sortMode, statusFilter, trackFilter, view],
  );
  const hotRows = useMemo(
    () => hotIds
      .flatMap((id) => allRows.filter((row) => row.job.id === id && row.job.listingStatus === "open" && matchesJobFilters(row, { query, statusFilter, trackFilter, minRating, view })))
      .sort(compareByRating),
    [allRows, hotIds, minRating, query, statusFilter, trackFilter, view],
  );
  const hotExport = useMemo(
    () => formatHotIds(hotIds, new Map(jobs.map((job) => [job.id, `${job.company} - ${job.title} (${job.rating10})`]))),
    [hotIds, jobs],
  );
  const stats = useMemo(() => calculateJobStats(jobs, getApplication), [getApplication, jobs]);

  const value = useMemo<JobBoardContextValue>(
    () => ({
      ready,
      rows,
      hotRows,
      hotIds,
      hotFromSeed,
      toggleHot,
      resetHot,
      hotExport,
      stats,
      query,
      setQuery,
      statusFilter,
      setStatusFilter,
      trackFilter,
      setTrackFilter,
      minRating,
      setMinRating,
      sortMode,
      setSortMode,
      view,
      setView,
      openId,
      toggleOpen: (id) => setOpenId((current) => (current === id ? null : id)),
      updateJob: (id, patch) =>
        setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job))),
      updateApplication,
    }),
    [
      hotExport,
      hotFromSeed,
      hotIds,
      hotRows,
      minRating,
      openId,
      query,
      ready,
      resetHot,
      rows,
      sortMode,
      stats,
      statusFilter,
      toggleHot,
      trackFilter,
      updateApplication,
      view,
    ],
  );

  return <JobBoardContext.Provider value={value}>{children}</JobBoardContext.Provider>;
}

export function useJobBoard(): JobBoardContextValue {
  const context = useContext(JobBoardContext);
  if (!context) throw new Error("useJobBoard must be used inside JobBoardProvider");
  return context;
}
