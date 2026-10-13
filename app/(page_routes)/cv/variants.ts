// ─────────────────────────────────────────────────────────────

import { JAVA_REACT_CAMPAIGN_JOB_KEYS, JAVA_REACT_CAMPAIGN_JOBS } from "./data/cv-campaign-java-react";
// Résumé variant registry — single source of truth for the sidebar.
//
// To add a new variant:
//   1. Create one flat cv-data-<slug>.ts file (copy an existing data module and
//      adapt the summary + experience bullets + skills to the target role).
//   2. Register its data in cv-data.ts and its navigation metadata below.
// No route folder or page wrapper is needed; [...slug]/page.tsx resolves it.
// The sidebar, the variant switcher and the "active" highlight update from here.
// ─────────────────────────────────────────────────────────────

export type CvVariant = {
  /** URL slug under /cv — empty string for the base résumé. */
  slug: string;
  /** Resolved route. */
  path: string;
  /** Short name shown in the sidebar. */
  name: string;
  /** Headline / target title this variant leads with. */
  role: string;
  /** Company / posting this variant was tailored for — shown as a label in the
   *  sidebar so you can tell which application each CV belongs to. Free text
   *  ("Zazmic", "Acme · Sr FE posting"). Leave unset for general-purpose variants. */
  company?: string;
  /** One line: when to send this one. */
  when: string;
  /** Keywords this variant deliberately leans into (shown as tags). */
  focus: string[];
  /** Hide this legacy variant until "Show archived" is enabled. A locally
   *  saved pipeline state always wins, so it can be unarchived normally. */
  archivedByDefault?: boolean;

  // ── application metadata (optional) — feeds the auto cover letter + tracker ──
  /** Role title exactly as written in the posting (defaults to `role`). */
  postingTitle?: string;
  /** Location line from the posting, e.g. "LATAM · 100% Remote". */
  location?: string;
  /** Recruiter / hiring-manager name for the cover-letter greeting. */
  hiringManager?: string;
  /** Where the application goes — email or link. */
  contactEmail?: string;
  /** URL of the posting. */
  jobUrl?: string;
  /** yyyy-mm-dd this variant was tailored — tiebreaker for the "Recent" sort. */
  tailoredOn?: string;
  /** Verbatim "why this company" paragraph for the auto cover letter (rule 15 / 17). */
  coverLetterNotes?: string;
  /** One specific, true, non-portable thing about the company — leads the letter
   *  when set (rule 2). Left blank, the 50-point review flags it. */
  coverLetterHook?: string;
  /** One human, slightly-unusual detail — a tool, a decision you'd redo, a
   *  moment (rule 39). Left blank, the review flags it. */
  coverLetterDetail?: string;
};

export const cvVariants: CvVariant[] = [
  {
    slug: "",
    path: "/cv",
    name: "Java + React · 2026 master",
    role: "Senior Full-Stack Engineer · Java / React",
    when: "One clean master résumé for the 10-role Java + React campaign. Use it when an application does not need a company-specific version.",
    focus: ["Java · Spring Boot", "React · Next.js · TypeScript", "AWS · Kafka · PostgreSQL", "11+ years · C1 English"],
    tailoredOn: "2026-09-20",
  },
  ...JAVA_REACT_CAMPAIGN_JOB_KEYS.map((key): CvVariant => {
    const job = JAVA_REACT_CAMPAIGN_JOBS[key];
    return {
      slug: `java-react-2026/${job.key}`,
      path: `/cv/java-react-2026/${job.key}`,
      name: job.name,
      role: job.resumeTitle,
      company: job.company,
      when: job.when,
      focus: [...job.focus],
      postingTitle: job.postingTitle,
      location: job.location,
      jobUrl: job.jobUrl,
      tailoredOn: "2026-09-20",
    };
  }),
  {
    slug: "legacy-god-cv",
    path: "/cv/legacy-god-cv",
    name: "Archived · Full-Stack God CV",
    role: "Senior Full-Stack Software Engineer",
    when: "Archived snapshot of the previous broad, every-stack résumé.",
    focus: ["Java · TS/React · Python · C# · PHP", "AI / LLM", "AWS · Azure · GCP", "Legacy"],
    archivedByDefault: true,
  },
  {
    slug: "agentic-ai",
    path: "/cv/agentic-ai",
    name: "Agentic AI Engineer",
    role: "Agentic AI Engineer",
    when: "AI / agentic engineering roles — LLM apps, RAG, and tool-calling systems in production.",
    focus: ["LLMs (OpenAI / Claude)", "RAG", "Agents / tool-calling", "Python · AWS · TS"],
    archivedByDefault: true,
  },
  {
    slug: "python-react-lead",
    path: "/cv/python-react-lead",
    name: "Tech Lead · Python / React",
    role: "Tech Lead · Full-Stack Engineer",
    company: "Zazmic",
    when: "Tech Lead / senior full-stack roles on a Python + React + AWS serverless stack, with LangGraph / OpenAI agents.",
    focus: ["Python · React / TS", "AWS serverless", "LangGraph · OpenAI agents", "Tech lead · ownership"],
    postingTitle: "Tech Lead — Full Stack (Python / React)",
    location: "LATAM · 100% Remote",
    contactEmail: "cristina.caetano@zazmic.ai",
    tailoredOn: "2026-08-30",
    archivedByDefault: true,
  },
  {
    slug: "python-react-aws",
    path: "/cv/python-react-aws",
    name: "Full-Stack · Python / React / AWS",
    role: "Senior Full-Stack Engineer",
    company: "Zazmic",
    when: "Self-directed IC full-stack roles — drop into an existing AWS / Python / React codebase and ship with minimal oversight.",
    focus: ["Python · React / TS", "AWS serverless", "LangGraph · OpenAI agents", "Self-directed IC"],
    postingTitle: "Full Stack Developer — Python / React (AWS Cloud)",
    location: "Remote",
    tailoredOn: "2026-08-30",
    archivedByDefault: true,
  },
  {
    slug: "python-dotnet",
    path: "/cv/python-dotnet",
    name: "Python + .NET / Azure",
    role: "Senior Full-Stack Software Engineer",
    when: "Full-stack roles on a Python/FastAPI + C#/.NET 8 stack with React 19 and Azure.",
    focus: ["Python / FastAPI", "C# / .NET 8", "React 19 · PostgreSQL", "Azure"],
    archivedByDefault: true,
  },
  {
    slug: "java",
    path: "/cv/java",
    name: "Java / Spring Boot",
    role: "Java Backend Engineer",
    when: "Backend-heavy Core Java roles — internal developer platforms, JVM performance tuning, and large-scale distributed systems.",
    focus: ["Core Java / JVM", "Concurrency", "Spring Boot · gRPC", "AWS · Kubernetes"],
    archivedByDefault: true,
  },
  {
    slug: "elasticsearch",
    path: "/cv/elasticsearch",
    name: "Elasticsearch / Node.js",
    role: "Elasticsearch & Node.js Engineer",
    when: "Search, observability and Node backend roles.",
    focus: ["Elasticsearch", "Query DSL", "Node.js", "Datadog / APM"],
    archivedByDefault: true,
  },
  {
    slug: "electric-air",
    path: "/cv/electric-air",
    name: "Django + React (Remix)",
    role: "Senior Full Stack Software Engineer",
    company: "Electric Air",
    when: "Product full-stack roles on a Python/Django + React (Remix) stack — startup, end-to-end ownership.",
    focus: ["Python / Django", "React / Remix", "PostgreSQL", "AI integration"],
    archivedByDefault: true,
  },
  {
    slug: "designli",
    path: "/cv/designli",
    name: "React + Node (NestJS)",
    role: "Senior Full-Stack Engineer",
    company: "Designli",
    when: "Full-stack web roles on a React/Next + Node/NestJS stack — testing, clean architecture, and AI features.",
    focus: ["React / Next.js", "Node.js / NestJS", "Testing + CI/CD", "LLM / agentic features"],
    archivedByDefault: true,
  },
  {
    slug: "oscar-cocinero",
    path: "/cv/oscar-cocinero",
    name: "Oscar Vindas · Cocinero",
    role: "Cocinero · Gastronomía",
    when: "CV en español para Oscar Steve Vindas Campos — puesto de cocinero / asistente de cocina en hotelería y restaurantes.",
    focus: ["Cocina", "Manipulación de Alimentos", "Higiene alimentaria", "Inglés básico"],
    archivedByDefault: true,
  },
];

// The registry remains intact as source material; the generator owns /cv now.
for (const variant of cvVariants) {
  variant.path = `/cv/cv-archive/${variant.slug || "master"}`;
  variant.archivedByDefault = true;
}

export const cvVariantBySlug = (slug: string): CvVariant | undefined =>
  cvVariants.find((v) => v.slug === slug);
