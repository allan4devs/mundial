import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Senior Full-Stack Engineer — React & Node",
};

export const contactInfo = buildContactInfo("latam");

export const primarySkills = [
  {
    label: "Frontend",
    items: ["React", "Next.js", "TypeScript", "Redux Toolkit", "Tailwind CSS"],
  },
  {
    label: "Backend & APIs",
    items: ["Node.js", "NestJS", "REST", "GraphQL", "Microservices"],
  },
  {
    label: "AI Features",
    items: [
      "OpenAI & Anthropic Claude APIs",
      "RAG & embeddings",
      "Tool / function calling",
      "Agentic workflows",
      "Prompt engineering",
    ],
  },
  {
    label: "Cloud & Delivery",
    items: ["AWS", "Docker", "Kubernetes", "CI/CD (GitHub Actions)", "Observability"],
  },
  {
    label: "Data",
    items: ["PostgreSQL", "Redis", "MySQL", "pgvector"],
  },
] as const;

export const secondarySkills = [
  {
    label: "Testing",
    items: ["Jest", "Vitest", "Supertest", "Playwright", "pytest"],
  },
  {
    label: "Also in the toolbox",
    items: ["Python", "Django REST", "Spring Boot", "Laravel"],
  },
  {
    label: "Practice",
    items: [
      "End-to-end ownership",
      "Clean, layered architecture",
      "SOLID principles",
      "Code review",
      "Mentoring",
      "Agile",
    ],
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
      text: " shipping production web apps end to end — from the data model and API through the React front end and the cloud it runs on.",
    },
  ],
  [
    { text: "Day to day that's " },
    { text: "React and Next.js", bold: true },
    { text: " over " },
    { text: "Node.js and NestJS", bold: true },
    {
      text: " services on PostgreSQL and AWS — a clean, layered architecture with unit and integration tests running in CI. I also build ",
    },
    { text: "LLM-backed features", bold: true },
    {
      text: " with RAG and tool calling, paired with deterministic logic where correctness matters.",
    },
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
    role: "Senior Full-Stack Engineer",
    company: "La Vieja Adventures",
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica",
    current: true,
    bullets: [
      "Own a booking and operations platform end to end — React / Next.js front end, Node.js and NestJS services, PostgreSQL — from data model through deployment on AWS.",
      "Build LLM-backed features for reservations and reporting (RAG plus tool calling) with deterministic checks, guarded by Jest / Supertest and Playwright in CI.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Delivered a cloud-based payment control and management platform for client MCM, owning features from data model through REST API and React UI on a fast release cadence.",
      "Built Node.js / NestJS services in a clean, layered architecture — business rules kept independent of framework and UI, inbound data validated and sanitized at the API boundary — deployed on AWS with Docker.",
      "Added LLM-backed automation over the platform's data (RAG plus tool calling) with deterministic checks where correctness mattered, and held coverage with Jest and Supertest in GitHub Actions CI.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Designed scalable event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
      "Built services in a layered architecture with unit and integration tests, and strengthened CI/CD (GitHub Actions, Jenkins) and automated coverage.",
      "Led design reviews and mentored engineers, raising consistency across the codebase.",
    ],
  },

  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Built full-stack web apps with React front ends — including Kaptyn, a luxury ride-hailing platform — and REST APIs over PostgreSQL / MySQL for GPS tracking, payments, and real-time mobility.",
    ],
  },

  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Built backend integrations for a chemical management system in Node.js and Python, in a client-facing engineering capacity through Infosys.",
    ],
  },

  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built Java and Python systems for FDA-regulated medical-device manufacturing and automated production reporting under ISO 13485 quality controls.",
    ],
  },
];
