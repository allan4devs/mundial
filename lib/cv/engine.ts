import { SKILL_DICTIONARY } from "@/app/(page_routes)/cv/audit";
import { CvInputError, normalizedText } from "./jd";
import { assembleCv, validateJobDescription } from "./validate";
import { createLocalRanker } from "./ranking";
import type { CvResult, CvSources, JobDescription, TailoredDraft } from "./types";

const wordCount = (text: string) => text.trim().split(/\s+/).length;
const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patternCache = new Map<string, RegExp>();
const equivalentTerms: Record<string, string[]> = {
  "gcp": ["Google Cloud", "Google Cloud Platform"], "google cloud": ["GCP", "Google Cloud Platform"],
  "llm": ["LLMs", "Large Language Model", "Large Language Models"], "large language models": ["LLM", "LLMs"],
  "large language model": ["LLM", "LLMs"], "code reviews": ["Code review"], "code review": ["Code reviews"],
  "scalable": ["Scalability"], "scalability": ["Scalable"], "reactjs": ["React"], "react.js": ["React"],
  "nodejs": ["Node.js"], "postgres": ["PostgreSQL"], "postgresql": ["Postgres"],
  "retrieval-augmented generation": ["RAG"], "retrieval augmented generation": ["RAG"],
  "rag": ["Retrieval-augmented generation", "Retrieval augmented generation"],
  "mentorship": ["Mentoring", "Mentor"], "mentor": ["Mentoring", "Mentorship"],
  "k8s": ["Kubernetes"], "kubernetes": ["K8s"], "amazon web services": ["AWS"],
};
export function termPattern(term: string): RegExp {
  const cached = patternCache.get(term);
  if (cached) return cached;
  const body = term.trim().split(/[\s_-]+/).map(escape).join("[\\s_-]+");
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}+#])(${body})(?=$|[^\\p{L}\\p{N}+#])`, "iu");
  if (patternCache.size > 1000) patternCache.clear();
  patternCache.set(term, pattern);
  return pattern;
}
export const containsTerm = (text: string, term: string) => [term, ...(equivalentTerms[normalizedText(term)] ?? [])].some((equivalent) => termPattern(equivalent).test(text));

/** Conservative keyword extraction that never requires a provider connection. */
export function extractLocalJobDescription(text: string): JobDescription {
  const allLines = text.split("\n");
  const titleIndex = allLines.findIndex((line) => line.length <= 180 && !/[.!?]$/.test(line) && /\b(?:engineer|developer|architect|analyst|manager|designer|consultant|specialist|administrator|scientist|ingenier[oa]|desarrollador[ae]?|analista|gerente|diseñador[ae]?)\b/i.test(line));
  const hasRequirements = /\b(?:responsibilit\w*|requirements?|qualifications?|experience|role|position|seeking|skills|requisitos|experiencia|puesto|responsabilidades)\b/i.test(text);
  if (titleIndex < 0 || !hasRequirements) throw new CvInputError("Include the job title, responsibilities, and requirements so we can tailor your CV.");
  // Keep the posted company information for display, but exclude benefits,
  // equal-opportunity notices and form text from keyword scoring.
  const tail = allLines.findIndex((line, index) => index > titleIndex + 4 && /^(?:about (?!the role|this role|the position|the job|you)\S.*|our values|perks\s*(?:&|and)\s*benefits|compliance\s*(?:&|and)\s*privacy.*|equal opportunity.*|apply for this job)$/i.test(line));
  const lines = tail >= 0 ? allLines.slice(0, tail) : allLines;
  const keywords: JobDescription["keywords"] = [];
  const seen = new Set<string>();
  let section: JobDescription["keywords"][number]["priority"] = "context";
  for (const line of lines) {
    if (/^(?:requirements|qualifications|what you (?:bring|need)|your professional qualifications|required skills)/i.test(line)) section = "required";
    if (/^(?:preferred|nice.to.have|bonus)/i.test(line)) section = "preferred";
    for (const entry of SKILL_DICTIONARY) {
      const alternatives = entry.match ?? [entry.label, ...(entry.aliases ?? [])];
      const hit = alternatives.map((term) => termPattern(term).exec(line)?.[1]).find(Boolean);
      if (!hit) continue;
      // Preserve the term that actually occurs, not an inferred related tool.
      const suffix = line.slice(line.indexOf(hit) + hit.length).match(/^\s+(?:v(?:ersion)?\s*)?(\d+(?:\.\d+)*(?:\+)?)(?=$|[\s,;:)])/i);
      const term = suffix ? `${hit} ${suffix[1]}` : hit;
      const key = normalizedText(term);
      if (seen.has(key)) continue;
      seen.add(key);
      const priority = /\b(?:preferred|nice.to.have|bonus|exposure|familiarity)\b/i.test(line) ? "preferred" : /\b(?:required|must|minimum|at least)\b/i.test(line) ? "required" : section;
      keywords.push({ term, quote: line, priority });
    }
  }
  if (!keywords.length) keywords.push({ term: allLines[titleIndex], quote: allLines[titleIndex], priority: "context" });
  const preceding = allLines[titleIndex - 1] ?? (allLines[titleIndex + 1]?.length < 55 ? allLines[titleIndex + 1] : undefined);
  const company = preceding && preceding.length <= 80 && !/^(?:about|job|career|role|position|location|remote|hybrid|on.site|home|search|back)\b/i.test(preceding) ? preceding : null;
  const ordered = keywords.sort((a, b) => ({ required: 0, preferred: 1, context: 2 }[a.priority] - { required: 0, preferred: 1, context: 2 }[b.priority]));
  return validateJobDescription({ isJobDescription: true, title: allLines[titleIndex], company, cleanedText: lines.join("\n"), keywords: ordered.slice(0, 35),
    responsibilities: lines.filter((line) => /^(?:[-•]\s*)?(?:design|build|develop|lead|implement|maintain|collaborate|integrate|architect|deliver|crear|desarrollar|diseñar)\b/i.test(line)).slice(0, 12) }, text);
}

/** Every candidate sentence/skill is copied from the archive, never invented. */
export function buildLocalCv(sources: CvSources, jd: JobDescription): CvResult {
  const learnedRank = createLocalRanker([...sources.evidence.map((proof) => proof.text), ...sources.skills.map((skill) => skill.text)], jd.cleanedText);
  const keywordScore = (text: string) => jd.keywords.reduce((sum, keyword) => sum + (containsTerm(text, keyword.term) ? keyword.priority === "required" ? 6 : keyword.priority === "preferred" ? 3 : 2 : 0), 0);
  const roleFocus = /\bAI\b|artificial intelligence|agentic/i.test(jd.title) ? /\bAI\b|\bLLMs?\b|\bRAG\b|LangGraph|LangChain|OpenAI|tool calling/i : /frontend|front.end|React/i.test(jd.title) ? /React|TypeScript|frontend|front.end|Next\.js/i : /backend|Java\b/i.test(jd.title) ? /Java\b|Spring Boot|backend|microservices/i : null;
  const score = (text: string) => keywordScore(text) + learnedRank(text) * 2 + (roleFocus?.test(text) ? 8 : 0);
  const ranked = <T extends { text: string }>(items: T[]) => [...items].sort((a, b) => score(b.text) - score(a.text) || wordCount(a.text) - wordCount(b.text));
  const summaries = ranked(sources.evidence.filter((item) => item.zone === "summary" && !item.text.includes(": ") && wordCount(item.text) >= 5 && wordCount(item.text) <= 85));
  const summary: TailoredDraft["summary"] = [];
  let profileWords = 0;
  for (const proof of summaries) {
    if (profileWords + wordCount(proof.text) > 95) continue;
    // Do not fill the profile with several near-identical variant paragraphs.
    if (summary.length && (score(proof.text) === 0 || summary[0].text.includes(proof.text.slice(0, 45)))) continue;
    summary.push({ text: proof.text, evidenceIds: [proof.id] }); profileWords += wordCount(proof.text);
    if (summary.length === 1) break;
  }
  if (!summary.length) throw new Error("Archived CV profile evidence is unavailable.");
  const buckets = new Map<string, { label: string; skillIds: string[] }>();
  let skillChars = 0;
  const candidates = ranked(sources.skills).filter((skill) => skill.text.length <= 145);
  const selected: CvSources["skills"] = [];
  const coveredBySkills = new Set<string>();
  // Greedy set coverage first; corpus relevance breaks ties. This keeps a long
  // list of repeated soft skills from crowding out a requested technology.
  while (selected.length < 22) {
    const available = candidates.filter((skill) => !selected.some((item) => item.id === skill.id) && skillChars + skill.text.length + 1 <= 1_100);
    if (!available.length) break;
    const coverage = (text: string) => jd.keywords.reduce((sum, keyword) => sum + (!coveredBySkills.has(keyword.term) && containsTerm(text, keyword.term) ? keyword.priority === "required" ? 6 : keyword.priority === "preferred" ? 3 : 2 : 0), 0);
    const skill = available.sort((a, b) => coverage(b.text) - coverage(a.text) || score(b.text) - score(a.text) || a.text.length - b.text.length)[0];
    selected.push(skill); skillChars += skill.text.length + 1;
    for (const keyword of jd.keywords) if (containsTerm(skill.text, keyword.term)) coveredBySkills.add(keyword.term);
  }
  for (const skill of selected) {
    const label = /ai|llm|agent/i.test(skill.label) ? "AI & Automation" : /front|react|ui/i.test(skill.label) ? "Frontend" : /cloud|devops|delivery|infra/i.test(skill.label) ? "Cloud & Delivery" : /language|backend|api|java|python/i.test(skill.label) ? "Languages & Backend" : "Data & Engineering";
    const group = buckets.get(label) ?? { label, skillIds: [] };
    group.skillIds.push(skill.id); buckets.set(label, group);
  }
  const groups = [...buckets.values()];
  if (groups.length === 1) {
    const extra = groups[0].skillIds.splice(Math.ceil(groups[0].skillIds.length / 2));
    groups.push({ label: "Additional Skills", skillIds: extra });
  }
  const focusSkills = [...selected].filter((skill) => keywordScore(skill.text) > 0 && skill.text.length <= 45).sort((a, b) => score(b.text) - score(a.text) || a.text.length - b.text.length).slice(0, 4);
  const focus = `Relevant technical strengths: ${focusSkills.map((skill) => skill.text).join(", ")}.`;
  const focusProofs = focusSkills.map((skill) => sources.evidence.find((proof) => proof.text === `Skills: ${skill.text}`)?.id).filter((id): id is string => Boolean(id));
  if (focusSkills.length && focusProofs.length === focusSkills.length && profileWords + wordCount(focus) <= 100) summary.push({ text: focus, evidenceIds: focusProofs });
  let bulletWords = 0;
  const experience = sources.jobs.map((job) => {
    const candidates = ranked(sources.evidence.filter((item) => item.jobId === job.id && wordCount(item.text) <= 40));
    const proof = candidates[0];
    if (!proof) throw new Error("Archived employment evidence is unavailable.");
    const bullets = [{ text: proof.text, evidenceIds: [proof.id] }];
    bulletWords += wordCount(proof.text);
    return { jobId: job.id, bullets };
  });
  // Reserve a bullet for every employer before allocating extra space to recent work.
  for (const job of sources.jobs.slice(0, 3)) {
    const entry = experience[job.index];
    const proof = ranked(sources.evidence.filter((item) => item.jobId === job.id && wordCount(item.text) <= 40 && item.text !== entry.bullets[0].text))[0];
    if (!proof || bulletWords + wordCount(proof.text) > 310) continue;
    entry.bullets.push({ text: proof.text, evidenceIds: [proof.id] }); bulletWords += wordCount(proof.text);
  }
  // Gaps describe absent source facts, not facts dropped to keep a CV concise.
  // The preview separately shows which supported terms fit in this document.
  const keywordMatches = jd.keywords.flatMap((keyword) => {
    const evidenceIds = sources.evidence.filter((item) => containsTerm(item.text, keyword.term)).map((item) => item.id).slice(0, 4);
    const skillIds = sources.skills.filter((skill) => containsTerm(skill.text, keyword.term)).map((skill) => skill.id).slice(0, 4);
    return evidenceIds.length + skillIds.length ? [{ term: keyword.term, evidenceIds, skillIds }] : [];
  });
  const baseHeadline = sources.base.personalInfo.title.split(" · ")[0];
  const headlineSkills = focusSkills.filter((skill) => skill.text.length <= 28);
  const roleSkills = headlineSkills.filter((skill) => roleFocus?.test(skill.text));
  const headlineFocus = (roleSkills.length ? roleSkills : headlineSkills).slice(0, 2).map((skill) => skill.text).join(" / ");
  const headline = headlineFocus && `${baseHeadline} · ${headlineFocus}`.length <= 100 ? `${baseHeadline} · ${headlineFocus}` : baseHeadline;
  const result = assembleCv(sources, jd, { headline, summary, skillGroups: groups, experience, keywordMatches });
  const documentText = [headline, ...summary.map((paragraph) => paragraph.text), ...selected.map((skill) => skill.text), ...experience.flatMap((job) => job.bullets.map((bullet) => bullet.text))].join("\n");
  const omittedKeywords = keywordMatches.filter((match) => !containsTerm(documentText, match.term)).map((match) => match.term);
  return { ...result, omittedKeywords, method: "local", notices: ["Prepared locally from your saved experience. Review requirements such as years, versions, and certifications before applying."] };
}
