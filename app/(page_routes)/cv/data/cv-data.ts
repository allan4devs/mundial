// ─────────────────────────────────────────────────────────────
// Every variant's résumé data + prebuilt text corpus, in one place.
// Flat cv-data-*.ts modules hold content; routes read this registry instead of
// owning a folder and wrapper for every CV.
//
// The workspace needs all variants for:
//   - VARIANT_CV      → build a cover letter for any variant ("Copy letter")
//   - VARIANT_CORPUS  → score every variant against a pasted JD ("Match" sort)
//
// Add a variant = one flat data module + one entry here + metadata in variants.ts.
// ─────────────────────────────────────────────────────────────

import { buildCorpus } from "../audit";
import type { CvData } from "../types";

import * as legacyGodCv from "./cv-data-legacy";
import * as base from "./cv-data-java-react";
import {
  buildJavaReactCampaignCv,
  JAVA_REACT_CAMPAIGN_JOB_KEYS,
} from "./cv-campaign-java-react";
import * as agenticAi from "./cv-data-agentic-ai";
import * as pythonReactLead from "./cv-data-python-react-lead";
import * as pythonReactAws from "./cv-data-python-react-aws";
import * as pythonDotnet from "./cv-data-python-dotnet";
import * as java from "./cv-data-java";
import * as elasticsearch from "./cv-data-elasticsearch";
import * as electricAir from "./cv-data-electric-air";
import * as designli from "./cv-data-designli";
import * as oscarCocinero from "./cv-data-oscar-cocinero";

type CvDataModule = {
  density?: CvData["density"];
  personalInfo: CvData["personalInfo"];
  contactInfo: CvData["contactInfo"];
  primarySkills: CvData["primarySkills"];
  secondarySkills: CvData["secondarySkills"];
  education: CvData["education"];
  languages: CvData["languages"];
  summary: CvData["summary"];
  highlights?: CvData["highlights"];
  experience: CvData["experience"];
  labels?: CvData["labels"];
};

const asCv = (m: CvDataModule): CvData => ({
  density: m.density,
  personalInfo: m.personalInfo,
  contactInfo: m.contactInfo,
  primarySkills: m.primarySkills,
  secondarySkills: m.secondarySkills,
  education: m.education,
  languages: m.languages,
  summary: m.summary,
  highlights: m.highlights,
  experience: m.experience,
  labels: m.labels,
});

export const VARIANT_CV: Record<string, CvData> = {
  "": asCv(base),
  "legacy-god-cv": asCv(legacyGodCv),
  "agentic-ai": asCv(agenticAi),
  "python-react-lead": asCv(pythonReactLead),
  "python-react-aws": asCv(pythonReactAws),
  "python-dotnet": asCv(pythonDotnet),
  java: asCv(java),
  elasticsearch: asCv(elasticsearch),
  "electric-air": asCv(electricAir),
  designli: asCv(designli),
  "oscar-cocinero": asCv(oscarCocinero),
};

for (const key of JAVA_REACT_CAMPAIGN_JOB_KEYS) {
  VARIANT_CV[`java-react-2026/${key}`] = buildJavaReactCampaignCv(key);
}

export const VARIANT_CORPUS: Record<string, string> = {};
for (const [slug, cv] of Object.entries(VARIANT_CV)) {
  VARIANT_CORPUS[slug] = buildCorpus(cv);
}

export function getCvBySlug(slug: string): CvData | undefined {
  return VARIANT_CV[slug];
}

export function isCvSlug(slug: string): boolean {
  return Object.hasOwn(VARIANT_CV, slug);
}
