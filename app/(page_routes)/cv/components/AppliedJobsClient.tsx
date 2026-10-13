"use client";

import { JobBoardProvider } from "./JavaReactJobsContext";
import { AppliedJobsTable } from "./AppliedJobsTable";

export function AppliedJobsClient() {
  return (
    <JobBoardProvider>
      <AppliedJobsTable />
    </JobBoardProvider>
  );
}
