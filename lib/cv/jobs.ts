import { getDb } from "@/lib/helpers/mongodb";
import { JOB_SEARCH_RECORDS, type JobSearchRecord } from "@/app/(page_routes)/cv/data/job-search-records";

export type CvJob = JobSearchRecord & { updatedAt?: string };

const collectionName = "cv_jobs";

export async function loadCvJobs(): Promise<{ jobs: CvJob[]; seeded: boolean }> {
  const collection = (await getDb()).collection<CvJob>(collectionName);
  const existing = await collection.find({}).sort({ lastSeen: -1, id: 1 }).toArray();
  if (existing.length > 0) return { jobs: existing.map(({ _id, ...job }) => job), seeded: false };

  const now = new Date().toISOString();
  const docs = JOB_SEARCH_RECORDS.map((job) => ({ ...job, updatedAt: now }));
  if (docs.length) await collection.insertMany(docs);
  return { jobs: docs, seeded: true };
}
