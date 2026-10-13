// ─────────────────────────────────────────────────────────────
// Certifications & credential-adjacent facts.
//
// No formal certifications are held yet — `certifications` is intentionally
// empty. When one lands (AWS, Microsoft, etc.), add it here and render a
// "Certifications" block in the résumé/sidebar variants that need it.
//
// `complianceExposure` captures regulated-industry and healthcare compliance
// experience. These are NOT certifications.
//
// Keep these values synchronized with the corresponding experience entries
// in jobs.ts, especially MicroVention · Terumo.
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

export type ComplianceExposure = {
  framework: string;
  context: string;
  years: string;
  domain?: string;
};

/**
 * Regulated environments and compliance frameworks worked with.
 *
 * These represent professional exposure / hands-on experience,
 * not certifications.
 */
export const complianceExposure: readonly ComplianceExposure[] = [
  {
    framework: "HIPAA",
    context: "MicroVention · Terumo",
    years: "2+ years",
    domain: "Healthcare / Medical Devices",
  },
  {
    framework: "FDA-regulated medical device environment",
    context: "MicroVention · Terumo",
    years: "2016–2020",
    domain: "Medical Devices",
  },
  {
    framework: "ISO 13485",
    context: "MicroVention · Terumo",
    years: "2016–2020",
    domain: "Medical Device Quality Management",
  },
] as const;

export const graduationProject = {
  title: "Graduation Project",
  host: "iTalent (Google Partner)",
  year: "2015",
} as const;