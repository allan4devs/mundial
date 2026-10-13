import { getDb } from "@/lib/helpers/mongodb";
import { buildCvSources } from "./sources";
import { CvInputError, normalizedText } from "./jd";
import type { CvProfile, CvSources } from "./types";

type ProfileRecord = { _id: string; profile: CvProfile; updatedAt: Date };
const wordCount = (text: string) => text.trim().split(/\s+/).length;
const text = (value: unknown, max: number, label: string): string => {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new CvInputError(`Check ${label}: it must contain text and stay within ${max} characters.`);
  return value.trim();
};

export function defaultCvProfile(sources = buildCvSources()): CvProfile {
  const groups = new Map<string, string[]>();
  for (const skill of sources.skills) groups.set(skill.label, [...(groups.get(skill.label) ?? []), skill.text]);
  return { summary: sources.base.summary, skillGroups: [...groups].map(([label, items]) => ({ label, items })),
    experience: sources.jobs.map((job) => ({ jobId: job.id, bullets: sources.evidence.filter((proof) => proof.jobId === job.id && wordCount(proof.text) <= 40).map((proof) => proof.text) })) };
}

export function validateCvProfile(value: unknown, sources = buildCvSources()): CvProfile {
  if (!value || typeof value !== "object") throw new CvInputError("Send your profile, skills, and experience.");
  const data = value as Partial<CvProfile>;
  if (!Array.isArray(data.summary) || data.summary.length < 1 || data.summary.length > 4) throw new CvInputError("Use one to four short profile paragraphs.");
  const summary = data.summary.map((item) => text(item, 1000, "your profile"));
  if (summary.some((item) => wordCount(item) < 5 || wordCount(item) > 85)) throw new CvInputError("Keep each profile paragraph between 5 and 85 words.");
  if (!Array.isArray(data.skillGroups) || data.skillGroups.length < 1 || data.skillGroups.length > 40) throw new CvInputError("Use between 1 and 40 skill groups.");
  const skillGroups = data.skillGroups.map((group) => {
    if (!group || !Array.isArray(group.items) || !group.items.length) throw new CvInputError("Each skill group needs at least one skill.");
    return { label: text(group.label, 60, "a skill group title"), items: [...new Set(group.items.map((item) => text(item, 300, "a skill")))] };
  });
  const shortSkills = new Set(skillGroups.flatMap((group) => group.items).filter((item) => item.length <= 145).map(normalizedText));
  if (shortSkills.size < 2 || skillGroups.flatMap((group) => group.items).length > 300) throw new CvInputError("Include at least two different concise skills and no more than 300 total skills.");
  if (!Array.isArray(data.experience) || data.experience.length !== sources.jobs.length) throw new CvInputError("Keep every employer in your employment history.");
  const validJobs = new Set(sources.jobs.map((job) => job.id));
  const seen = new Set<string>();
  const experience = data.experience.map((job) => {
    if (!job || !validJobs.has(job.jobId) || seen.has(job.jobId)) throw new CvInputError("The job history contains an unknown or duplicate employer.");
    seen.add(job.jobId);
    if (!Array.isArray(job.bullets) || !job.bullets.length || job.bullets.length > 60) throw new CvInputError("Each employer needs 1 to 60 evidence bullets.");
    const bullets = [...new Set(job.bullets.map((item) => text(item, 1000, "an experience bullet")))];
    if (bullets.some((item) => wordCount(item) > 40)) throw new CvInputError("Keep each experience bullet under 41 words so it fits the generated CV.");
    return { jobId: job.jobId, bullets };
  });
  return { summary, skillGroups, experience };
}

export async function getCvProfile(ownerId: string): Promise<CvProfile | null> {
  return (await (await getDb()).collection<ProfileRecord>("cv_profiles").findOne({ _id: ownerId }))?.profile ?? null;
}
export async function saveCvProfile(ownerId: string, profile: CvProfile): Promise<void> {
  await (await getDb()).collection<ProfileRecord>("cv_profiles").updateOne({ _id: ownerId }, { $set: { profile, updatedAt: new Date() } }, { upsert: true });
}
export async function loadCvSources(ownerId: string): Promise<CvSources> {
  return buildCvSources(await getCvProfile(ownerId) ?? undefined);
}
