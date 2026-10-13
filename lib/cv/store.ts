import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/helpers/mongodb";
import type { CvResult, CvSources, GenerationProgress, GenerationSummary, GenerationView, JobDescription } from "./types";

type GenerationRecord = {
  _id: string; ownerId: string; createdAt: Date; updatedAt: Date;
  status: GenerationSummary["status"]; title: string; company: string | null;
  jobDescription: string; model: string; promptVersion: string; sourceSnapshot: CvSources;
  jd: JobDescription | null; result: CvResult | null; error: string | null;
  progress?: GenerationProgress;
  // Retained to read historical provider-backed records; local generations keep this empty.
  calls: { stage: string; responseId: string; model: string; output: string; usage: { input_tokens: number; output_tokens: number; total_tokens: number } | null; estimatedCostUsd: number | null; createdAt: Date }[];
};
type GenerationLock = { _id: string; generationId: string; expiresAt: Date };
const collection = async () => (await getDb()).collection<GenerationRecord>("cv_generations");

export async function createGeneration(ownerId: string, jobDescription: string, model: string, sourceSnapshot: CvSources): Promise<string | null> {
  const db = await getDb();
  const id = randomUUID();
  const locks = db.collection<GenerationLock>("cv_generation_locks");
  const now = new Date();
  try {
    await locks.findOneAndUpdate({ _id: ownerId, expiresAt: { $lte: now } },
      { $set: { generationId: id, expiresAt: new Date(now.getTime() + 240_000) } }, { upsert: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) return null;
    throw error;
  }
  try {
    await db.collection<GenerationRecord>("cv_generations").insertOne({ _id: id, ownerId, createdAt: now, updatedAt: now,
      status: "pending", progress: "extract", title: "Generating CV", company: null, jobDescription, model, promptVersion: "cv-local-v2",
      sourceSnapshot, jd: null, result: null, error: null, calls: [] });
    return id;
  } catch (error) {
    await releaseGeneration(ownerId, id);
    throw error;
  }
}

export async function releaseGeneration(ownerId: string, id: string) {
  await (await getDb()).collection<GenerationLock>("cv_generation_locks").deleteOne({ _id: ownerId, generationId: id });
}

export async function saveJobDescription(id: string, jd: JobDescription) {
  await (await collection()).updateOne({ _id: id }, { $set: { jd, title: jd.title, company: jd.company, updatedAt: new Date() } });
}
export async function saveGenerationProgress(id: string, progress: GenerationProgress) {
  await (await collection()).updateOne({ _id: id }, { $set: { progress, updatedAt: new Date() } });
}
export async function finishGeneration(id: string, result: CvResult) {
  await (await collection()).updateOne({ _id: id }, { $set: { status: "complete", progress: "complete", result, error: null, updatedAt: new Date() } });
}
export async function failGeneration(id: string, error: string) {
  await (await collection()).updateOne({ _id: id }, { $set: { status: "error", error, updatedAt: new Date() } });
}
const isInterrupted = (record: GenerationRecord) => record.status === "pending" && Date.now() - record.updatedAt.getTime() > 240_000;
const summary = (record: GenerationRecord): GenerationSummary => ({ id: record._id, title: record.title, company: record.company, status: isInterrupted(record) ? "error" : record.status, createdAt: record.createdAt.toISOString() });

export async function listGenerations(ownerId: string): Promise<GenerationSummary[]> {
  const records = await (await collection()).find({ ownerId }, { projection: { _id: 1, title: 1, company: 1, status: 1, createdAt: 1, updatedAt: 1 } }).sort({ createdAt: -1 }).limit(30).toArray();
  return records.map(summary);
}
export async function getGeneration(ownerId: string, id: string): Promise<GenerationView | null> {
  const record = await (await collection()).findOne({ _id: id, ownerId });
  if (!record) return null;
  const stale = isInterrupted(record);
  return { ...summary(record), status: stale ? "error" : record.status, result: record.result,
    error: stale ? "Generation was interrupted. Return to the generator and try again." : record.error, jobDescription: record.jobDescription, progress: record.progress };
}
