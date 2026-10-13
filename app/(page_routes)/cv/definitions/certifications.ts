// ─────────────────────────────────────────────────────────────
// Certifications & credential-adjacent facts.
//
// No formal certifications are held yet — `certifications` is intentionally
// empty. When one lands (AWS, etc.), add it here and render a "Certifications"
// block in the variant sidebar that needs it.
//
// `complianceExposure` and `graduationProject` capture the credential-adjacent
// facts the résumés already lean on — keep them in sync with jobs.ts.
// ─────────────────────────────────────────────────────────────

export type Certification = {
  name: string;
  issuer: string;
  year?: string;
  credentialId?: string;
  url?: string;
  status?: "active" | "expired" | "in-progress";
};

export const certifications: readonly Certification[] = [];


export const complianceExposure = [
  { framework: "FDA (regulated medical device)", context: "MicroVention · Terumo", years: "2016–2020" },
  { framework: "ISO 13485", context: "MicroVention · Terumo", years: "2016–2020" },
] as const;

export const graduationProject = {
  title: "Graduation Project",
  host: "iTalent (Google Partner)",
  year: "2015",
} as const;
