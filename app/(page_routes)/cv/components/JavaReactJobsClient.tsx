"use client";

import { JobBoardScreen } from "./JobBoardScreen";
import { JobBoardProvider } from "./JavaReactJobsContext";

export function JavaReactJobsClient() {
  return (
    <JobBoardProvider>
      <JobBoardScreen />
    </JobBoardProvider>
  );
}
