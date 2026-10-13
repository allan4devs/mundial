// ─────────────────────────────────────────────────────────────
// CV Express — data model for the résumé + cover-letter builder.
//
// One flat `ResumeData` object drives every template. `ResumeSettings`
// carries presentation choices (template, accent, label language, size).
// Everything is plain JSON so it round-trips through localStorage / export.
// ─────────────────────────────────────────────────────────────

export type CvLang = "es" | "en";

export type TemplateId = "clasico" | "moderno" | "minimal" | "ejecutivo" | "compacto";

export type ResumeLink = {
  id: string;
  label: string;
  url: string;
};

export type ResumeExperience = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
};

export type ResumeEducation = {
  id: string;
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
  note: string;
};

export type ResumeSkillGroup = {
  id: string;
  label: string;
  items: string[];
};

export type ResumeLanguage = {
  id: string;
  name: string;
  level: string;
};

export type ResumeProject = {
  id: string;
  name: string;
  description: string;
  url: string;
};

export type ResumeData = {
  fullName: string;
  /** Target role / professional title shown under the name. */
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  links: ResumeLink[];
  /** Free text. Blank lines split paragraphs. */
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkillGroup[];
  languages: ResumeLanguage[];
  projects: ResumeProject[];
  /** e.g. "Disponibles a solicitud" — optional free text. */
  references: string;
};

export type ResumeSettings = {
  template: TemplateId;
  /** Accent colour, hex. */
  accent: string;
  /** Language the section headings render in. */
  cvLang: CvLang;
  /** Type-scale multiplier, 0.9 – 1.15. */
  fontScale: number;
  /** Paper size for print. */
  paper: "a4" | "letter";
};

export type CoverLetterData = {
  company: string;
  role: string;
  recipient: string;
  /** "email" | "LinkedIn" | "portal" … free text. */
  channel: string;
  /** "Why this company" — used verbatim as one paragraph. */
  hook: string;
  /** When set, the user has hand-edited the letter; render this instead. */
  override: string | null;
};

export type BuilderState = {
  data: ResumeData;
  settings: ResumeSettings;
  cover: CoverLetterData;
};

/** Props every template component receives. */
export type TemplateProps = {
  data: ResumeData;
  settings: ResumeSettings;
  labels: SectionLabels;
};

export type SectionLabels = {
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  projects: string;
  references: string;
  present: string;
  contact: string;
};
