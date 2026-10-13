import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Tech Lead · Full-Stack (Python / React / AWS)",
};

export const contactInfo = buildContactInfo("latamAmericas");

export const primarySkills = [
  {
    label: "Leadership",
    items: [
      "Tech lead",
      "Architecture & technical decisions",
      "End-to-end ownership",
      "Independent in an existing codebase",
      "Code review",
      "Mentoring",
    ],
  },
  {
    label: "Languages & Frontend",
    items: ["Python", "TypeScript", "React", "Next.js", "JavaScript", "SQL"],
  },
  {
    label: "AI & LLM",
    items: [
      "LangGraph",
      "OpenAI APIs",
      "Anthropic Claude",
      "AI agents",
      "Tool / function calling",
      "RAG",
    ],
  },
  {
    label: "Backend & APIs",
    items: ["FastAPI", "Django REST", "Node.js", "REST", "GraphQL", "AppSync", "SQLAlchemy", "Microservices"],
  },
  {
    label: "AWS & Infra",
    items: [
      "Lambda",
      "AppSync",
      "Cognito",
      "API Gateway",
      "CloudFormation / SAM",
      "S3",
      "DynamoDB",
      "SQS",
      "Docker",
      "CI/CD",
    ],
  },
] as const;

export const secondarySkills = [
  {
    label: "Data",
    items: ["PostgreSQL", "Redis", "MySQL"],
  },
  {
    label: "Practice",
    items: ["Event-driven", "System design", "Agile / Scrum", "pytest", "Jest", "GitHub Actions"],
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
      text: " shipping production software, the last several as the ",
    },
    { text: "technical lead", bold: true },
    {
      text: " on the team — owning architecture, making the calls, and staying hands-on in the code.",
    },
  ],
  [
    { text: "Full-stack across " },
    { text: "Python", bold: true },
    { text: " and " },
    { text: "React / TypeScript", bold: true },
    { text: " on " },
    { text: "AWS", bold: true },
    {
      text: " — Lambda, AppSync, Cognito, and API Gateway, with infrastructure as ",
    },
    { text: "CloudFormation / SAM", bold: true },
    { text: " and PostgreSQL behind it." },
  ],
  [
    { text: "Build " },
    { text: "LangGraph", bold: true },
    { text: " and " },
    { text: "OpenAI", bold: true },
    {
      text: " agents into the product, pairing model calls with deterministic logic where reliability matters. Comfortable dropping into an existing repository, working independently, and taking a problem from “here’s the ask” to “here’s the solution.” English at ",
    },
    { text: "C1", bold: true },
    { text: "." },
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
    role: "Tech Lead · Full-Stack Engineer",
    company: "La Vieja Adventures",
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica",
    current: true,
    bullets: [
      "Technical lead on a cloud-native operations platform — own the architecture, set the stack, and make the design calls while staying hands-on across the codebase.",
      "Ship Python (FastAPI / Django REST) and React / TypeScript on AWS — Lambda, AppSync, Cognito — with LangGraph and OpenAI agents for reservations and reporting.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Led delivery of a cloud-based payment control and management platform for client MCM — owned the architecture, data model, APIs, and UI, making the technical calls while working independently inside the client's existing repository.",
      "Built Python (FastAPI) services and a React / TypeScript front end on AWS serverless — Lambda, API Gateway, Cognito — with infrastructure as CloudFormation / SAM and PostgreSQL for data.",
      "Set standards through code review and design reviews on a fast release cadence, keeping the codebase clean as scope grew.",
    ],
  },

  {
    role: "Senior Software Engineer · Tech Lead",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Tech lead for event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
      "Owned architecture and the technical roadmap, ran design reviews, and mentored engineers through code review.",
      "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Prometheus, Grafana), and set SLAs / SLOs for the backend.",
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
