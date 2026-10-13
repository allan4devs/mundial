import { CvInputError, normalizedText } from "./jd";
import type { CvResult, CvSources, GroundedText, JobDescription, TailoredDraft } from "./types";

export class CvGroundingError extends Error {}
const assert = (condition: unknown, message: string): void => { if (!condition) throw new CvGroundingError(message); };
const words = (text: string) => text.trim().split(/\s+/).length;

export function validateJobDescription(jd: JobDescription, original: string): JobDescription {
  if (!jd.isJobDescription) throw new CvInputError("This text does not contain a clear job description. Include the role and its requirements.");
  assert(typeof jd.title === "string" && jd.title.trim().length > 0 && jd.title.length <= 180, "Invalid job title.");
  assert(typeof jd.cleanedText === "string" && jd.cleanedText.length >= 100 && jd.cleanedText.length <= original.length + 500, "Invalid cleaned job description.");
  assert(Array.isArray(jd.keywords) && jd.keywords.length > 0 && jd.keywords.length <= 35, "Invalid keyword extraction.");
  const originalText = normalizedText(original);
  const seen = new Set<string>();
  const keywords = jd.keywords.filter((keyword) => {
    assert(typeof keyword.term === "string" && keyword.term.trim().length > 0 && keyword.term.length <= 100, "Invalid keyword.");
    assert(typeof keyword.quote === "string" && keyword.quote.trim().length > 0 && originalText.includes(normalizedText(keyword.quote)), "A keyword quote was not found in the pasted description.");
    assert(["required", "preferred", "context"].includes(keyword.priority), "Invalid keyword priority.");
    const key = normalizedText(keyword.term);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { ...jd, keywords };
}

export function assembleCv(sources: CvSources, jd: JobDescription, draft: TailoredDraft): CvResult {
  const evidence = new Map(sources.evidence.map((item) => [item.id, item]));
  const skills = new Map(sources.skills.map((item) => [item.id, item]));
  const validateText = (claim: GroundedText, jobId?: string) => {
    assert(typeof claim.text === "string" && claim.text.trim().length > 0, "Empty CV claim.");
    assert(Array.isArray(claim.evidenceIds) && claim.evidenceIds.length > 0 && claim.evidenceIds.length <= 8, "Every claim needs source evidence.");
    for (const id of claim.evidenceIds) {
      const proof = evidence.get(id);
      assert(proof && (!jobId || proof.jobId === jobId), "Experience evidence belongs to a different job or does not exist.");
    }
    const proofText = claim.evidenceIds.map((id) => evidence.get(id)!.text).join(" ");
    const numbers = claim.text.match(/\d+(?:[.,]\d+)?(?:\+|%)?/g) ?? [];
    const proofNumbers: string[] = proofText.match(/\d+(?:[.,]\d+)?(?:\+|%)?/g) ?? [];
    for (const number of numbers) assert(proofNumbers.includes(number), "A generated metric is missing from its cited evidence.");
  };
  assert(typeof draft.headline === "string" && draft.headline.trim().length > 0 && draft.headline.length <= 100, "Invalid CV headline.");
  assert(Array.isArray(draft.summary) && draft.summary.length >= 1 && draft.summary.length <= 2, "Use one or two profile paragraphs.");
  for (const paragraph of draft.summary) validateText(paragraph);
  assert(words(draft.summary.map((item) => item.text).join(" ")) <= 100, "The profile is too long.");
  assert(Array.isArray(draft.skillGroups) && draft.skillGroups.length >= 2 && draft.skillGroups.length <= 5, "Invalid skill groups.");
  const selectedSkills = new Set<string>();
  const groups = draft.skillGroups.map((group) => {
    assert(typeof group.label === "string" && group.label.trim().length > 0 && group.label.length <= 45 && group.skillIds.length > 0, "Invalid skill group.");
    const items = group.skillIds.map((id) => {
      assert(skills.has(id) && !selectedSkills.has(id), "An unknown or duplicate skill was selected.");
      selectedSkills.add(id);
      return skills.get(id)!.text;
    });
    return { label: group.label, items };
  });
  assert(selectedSkills.size <= 28 && groups.flatMap((group) => group.items).join(" ").length <= 1_300, "Too many skills for one page.");
  assert(Array.isArray(draft.experience) && draft.experience.length === sources.jobs.length, "Preserve the complete employment chronology.");
  const byJob = new Map(draft.experience.map((entry) => [entry.jobId, entry]));
  assert(byJob.size === sources.jobs.length, "Duplicate job selection.");
  let bulletWords = 0;
  const experience = sources.jobs.map((job) => {
    const entry = byJob.get(job.id);
    assert(entry && entry.bullets.length >= 1 && entry.bullets.length <= (job.index < 3 ? 3 : 2), "Missing job or too many bullets.");
    for (const bullet of entry!.bullets) {
      validateText(bullet, job.id);
      assert(words(bullet.text) <= 40, "An experience bullet is too long.");
      bulletWords += words(bullet.text);
    }
    return { ...sources.base.experience[job.index], bullets: entry!.bullets.map((bullet) => bullet.text) };
  });
  assert(bulletWords <= 330, "The experience section is too long for one page.");
  const keywordTerms = new Set(jd.keywords.map((keyword) => normalizedText(keyword.term)));
  const matched = new Set<string>();
  for (const match of draft.keywordMatches) {
    const term = normalizedText(match.term);
    assert(keywordTerms.has(term) && !matched.has(term), "Invalid keyword match.");
    assert(match.evidenceIds.length + match.skillIds.length > 0, "A keyword match needs evidence.");
    assert(match.evidenceIds.every((id) => evidence.has(id)) && match.skillIds.every((id) => skills.has(id)), "Invalid keyword evidence.");
    matched.add(term);
  }
  const usedEvidence = new Set([
    ...draft.summary.flatMap((paragraph) => paragraph.evidenceIds),
    ...draft.experience.flatMap((job) => job.bullets.flatMap((bullet) => bullet.evidenceIds)),
    ...draft.keywordMatches.flatMap((match) => match.evidenceIds),
  ]);
  return {
    cv: { ...structuredClone(sources.base), personalInfo: { ...sources.base.personalInfo, title: draft.headline },
      summary: draft.summary.map((paragraph) => paragraph.text), primarySkills: groups.slice(0, 3), secondarySkills: groups.slice(3), experience },
    draft, jd, gaps: jd.keywords.filter((keyword) => !matched.has(normalizedText(keyword.term))).map((keyword) => keyword.term),
    evidence: sources.evidence.filter((item) => usedEvidence.has(item.id)),
    sourceVersion: sources.version, archiveSlugs: sources.archiveSlugs,
  };
}
