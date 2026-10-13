// ─────────────────────────────────────────────────────────────
// Education — one canonical block, identical across every résumé variant.
// Variants re-export this instead of re-declaring it:
//     export { education } from "./cv-definition-education";
// ─────────────────────────────────────────────────────────────

import type { CvData } from "../types";

export const education = {
  degree: "Computer Engineering",
  school: "Instituto Tecnológico de Costa Rica (TEC)",
  period: "2009–2015",
  internshipLabel: "Graduation Project:",
  internship: "iTalent (Google Partner)",
} satisfies CvData["education"];

/** Alternate phrasings kept on hand for JDs that ask for the degree differently. */
export const degreeAliases = ["Computer Engineering", "B.Sc. Computer Engineering", "Ingeniería en Computación"] as const;
