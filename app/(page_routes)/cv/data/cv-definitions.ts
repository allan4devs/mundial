// ─────────────────────────────────────────────────────────────
// Shared résumé definitions — the single source of truth for the facts that
// repeat across every variant. Import from here, not from a sibling variant.
//
//   identity.ts        → name, contact block, languages (+ builders)
//   education.ts        → the one education block
//   certifications.ts   → formal certs (none yet) + compliance exposure
//   jobs.ts             → one record per employer + the full bullet pool ("menu")
//
// Pattern for a flat variant data module:
//   import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";
//   export { education } from "./cv-definition-education";
//   export const personalInfo = { name: NAME, title: "…" };
//   export const contactInfo  = buildContactInfo("latam");
//   export const languages    = buildLanguages("short");
//   // summary + experience stay in cv-data-<slug>.ts — they are tailored.
// ─────────────────────────────────────────────────────────────

export * from "./cv-definition-identity";
export * from "./cv-definition-education";
export * from "./cv-definition-certifications";
export * from "./cv-definition-jobs";
