import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Agentic AI Engineer",
};

export const contactInfo = buildContactInfo("americas");

export const primarySkills = [
  {
    label: "AI & LLM Engineering",
    items: [
      "OpenAI & Anthropic Claude APIs",
      "RAG",
      "Embeddings & vector search",
      "Prompt engineering",
      "Tool / function calling",
      "Agentic workflows",
    ],
  },
  {
    label: "Languages",
    items: ["Python", "TypeScript", "JavaScript", "Java", "SQL"],
  },
  {
    label: "Backend & APIs",
    items: ["Django REST", "Node.js", "REST", "GraphQL", "Microservices", "Event-driven"],
  },
  {
    label: "Cloud & Infra",
    items: ["AWS", "Lambda", "SQS", "ECS / EKS", "Docker", "Kubernetes", "CI/CD"],
  },
  {
    label: "Data & Vector",
    items: ["PostgreSQL", "Redis", "MySQL", "pgvector"],
  },
] as const;

export const secondarySkills = [
  {
    label: "Also in the toolbox",
    items: ["Spring Boot", "Next.js", "React", "Tailwind CSS", "Laravel"],
  },
  {
    label: "Practice",
    items: ["End-to-end ownership", "System design", "Code review", "Mentoring", "Agile"],
  },
];

export const languages = buildLanguages("short");

export type SummarySegment = {
  text: string;
  bold?: boolean;
  accent?: boolean;
};

export const summary: SummarySegment[][] = [
  [
    { text: "11+ years", bold: true, accent: true },
    {
      text: " shipping production software — now building LLM-powered, agentic product features across enterprise, healthcare, and consumer environments.",
    },
  ],
  [
    { text: "Work across " },
    { text: "Python", bold: true },
    { text: " and " },
    { text: "TypeScript / Node", bold: true },
    { text: ", integrating " },
    { text: "OpenAI and Claude", bold: true },
    {
      text: " APIs with RAG, prompt engineering, and tool / function calling on REST and event-driven services on AWS. Ship end to end and pair model calls with ",
    },
    { text: "deterministic logic", bold: true },
    { text: " where reliability matters." },
  ],
];

export const experience: {
  role: string;
  company: string;
  period: string;
  location: string;
  current?: boolean;
  bullets: string[];
}[] = [
  {
    role: "Senior Software Engineer · AI Features",
    company: "La Vieja Adventures",
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica",
    current: true,
    bullets: [
      "Build LLM-powered product features end to end — reservation handling, customer communication, and internal reporting — turning manual workflows into model-driven flows.",
      "Integrate OpenAI and Anthropic Claude APIs into a Python + TypeScript stack with RAG and tool / function calling, paired with deterministic logic where correctness matters.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Delivered a cloud-based payment control and management platform for client MCM, owning features from data model through API and UI on a fast release cadence.",
      "Added LLM-assisted automation over the platform's business data — retrieval (RAG), prompt engineering, and tool / function calling so the model could take actions across services — on a Python + TypeScript / Node stack.",
      "Ran the surrounding platform: Django REST / Node behind React, PostgreSQL, Docker, deployed on AWS with SQS for event-driven workflows.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Designed event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
      "Built internal tooling and APIs that automated manual operations work, and prototyped LLM-assisted features for triage and reporting.",
      "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Prometheus, Grafana); led design reviews and mentored engineers.",
    ],
  },

  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Built full-stack web apps with React front ends — including Kaptyn, a luxury ride-hailing platform — and RESTful APIs over PostgreSQL / MySQL for GPS tracking, payments, and real-time mobility.",
    ],
  },

  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Built backend integrations for a chemical management system in Python and Node.js, in a client-facing engineering capacity through Infosys.",
    ],
  },

  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built Python and Java systems for FDA-regulated medical-device manufacturing and automated production reporting under ISO 13485 quality controls.",
    ],
  },
];
