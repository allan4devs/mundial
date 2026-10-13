import { createHash } from "node:crypto";
import { VARIANT_CV } from "@/app/(page_routes)/cv/data/cv-data";
import { toEditable } from "@/app/(page_routes)/cv/editableCv";
import { normalizedText } from "./jd";
import type { CvProfile, CvSources, Evidence, SourceSkill } from "./types";

const sourceId = (prefix: string, value: string) => `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
const employerKey = (name: string) => normalizedText(name).split(" · ")[0];

export function buildCvSources(profile?: CvProfile): CvSources {
  const master = VARIANT_CV[""];
  const base = { ...toEditable(master), density: "compact" as const, highlights: [] };
  const evidence = new Map<string, Evidence>();
  const skills = new Map<string, SourceSkill>();
  const archiveSlugs: string[] = [];
  const jobs = master.experience.map((job, index) => ({ id: sourceId("job", `${job.company}|${job.period}`), index }));
  const addEvidence = (text: string, zone: Evidence["zone"], jobId: string | null, archive: string) => {
    const id = sourceId("proof", `${zone}|${jobId}|${text}`);
    const item = evidence.get(id) ?? { id, text, zone, jobId, archives: [] };
    if (!item.archives.includes(archive)) item.archives.push(archive);
    evidence.set(id, item);
  };
  for (const [slug, cv] of Object.entries(VARIANT_CV)) {
    // Never combine the other person's hospitality CV with Allan's evidence.
    if (cv.personalInfo.name !== master.personalInfo.name) continue;
    archiveSlugs.push(slug);
    for (const paragraph of cv.summary) addEvidence(paragraph.map((segment) => segment.text).join(""), "summary", null, slug);
    for (const highlight of cv.highlights ?? []) addEvidence(`${highlight.title}: ${highlight.detail}`, "summary", null, slug);
    for (const group of [...cv.primarySkills, ...cv.secondarySkills]) {
      for (const text of group.items) {
        const id = sourceId("skill", normalizedText(text));
        const item = skills.get(id) ?? { id, label: group.label, text, archives: [] };
        if (!item.archives.includes(slug)) item.archives.push(slug);
        skills.set(id, item);
      }
    }
    for (const job of cv.experience) {
      const index = master.experience.findIndex((canonical) => canonical.period === job.period && (
        employerKey(canonical.company) === employerKey(job.company)
        || (canonical.current && employerKey(job.company) === "la vieja adventures")
      ));
      if (index < 0) continue;
      for (const bullet of job.bullets) addEvidence(bullet, "experience", jobs[index].id, slug);
    }
  }
  if (profile) {
    // A saved correction replaces the archive's facts, so deleted/changed claims
    // cannot silently reappear in a later CV.
    evidence.clear(); skills.clear();
    base.summary = [...profile.summary];
    for (const paragraph of profile.summary) addEvidence(paragraph, "summary", null, "profile");
    for (const group of profile.skillGroups) for (const skill of group.items) {
      const id = sourceId("skill", normalizedText(skill));
      if (!skills.has(id)) skills.set(id, { id, label: group.label, text: skill, archives: ["profile"] });
    }
    for (const entry of profile.experience) {
      const job = jobs.find((item) => item.id === entry.jobId);
      if (!job) continue;
      base.experience[job.index].bullets = [...entry.bullets];
      for (const bullet of entry.bullets) addEvidence(bullet, "experience", job.id, "profile");
    }
  }
  for (const skill of skills.values()) for (const archive of skill.archives) addEvidence(`Skills: ${skill.text}`, "summary", null, archive);
  const source = { base, evidence: [...evidence.values()], skills: [...skills.values()], jobs, archiveSlugs };
  return { ...source, version: createHash("sha256").update(JSON.stringify(source)).digest("hex") };
}
