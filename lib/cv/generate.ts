import { buildLocalCv, extractLocalJobDescription } from "./engine";
import { finishGeneration, saveJobDescription, saveGenerationProgress } from "./store";
import type { CvSources } from "./types";

/** The production generator is entirely local. No provider key or network call. */
export async function generateCv(id: string, jobDescription: string, sources: CvSources) {
  await saveGenerationProgress(id, "extract");
  const jd = extractLocalJobDescription(jobDescription);
  await saveJobDescription(id, jd);
  await saveGenerationProgress(id, "tailor");
  const result = buildLocalCv(sources, jd);
  await finishGeneration(id, result);
  return result;
}
