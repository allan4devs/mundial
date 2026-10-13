import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Senior Full-Stack Engineer",
};

export const contactInfo = buildContactInfo("latamAmericas");

export const primarySkills = [
  {
    label: "Ways of working",
    items: [
      "Self-directed",
      "Owns tasks end to end",
      "Adapts to existing codebases and conventions",
      "Ships with minimal oversight",
    ],
  },
  {
    label: "Frontend",
    items: ["React", "Next.js", "TypeScript", "JavaScript"],
  },
  {
    label: "AI & LLM",
    items: [
      "LangGraph",
      "OpenAI APIs",
      "Anthropic Claude",
      "Autonomous agents",
      "Agent orchestration",
      "Multi-agent architectures",
      "Tool / function calling",
      "RAG",
      "Prompt engineering",
    ],
  },
  {
    label: "Backend & APIs",
    items: [
      "Python",
      "FastAPI",
      "Django REST",
      "Node.js",
      "REST",
      "GraphQL",
      "SQLAlchemy",
      "Event-driven microservices",
    ],
  },
  {
    label: "AWS & Infra",
    items: [
      "Lambda",
      "AppSync",
      "Cognito",
      "API Gateway",
      "IaC: CloudFormation / SAM",
      "S3",
      "DynamoDB",
      "SQS",
      "Docker",
    ],
  },
] as const;

export const secondarySkills = [
  {
    label: "Data",
    items: ["PostgreSQL", "Redis", "MySQL"],
  },
  {
    label: "Delivery & Observability",
    items: ["GitHub Actions", "Jenkins", "Prometheus", "Grafana", "pytest", "Jest"],
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
    { text: "Self-directed senior full-stack engineer", bold: true, accent: true },
    {
      text: " with ",
    },
    { text: "11+ years", bold: true },
    { text: " shipping production software and owning delivery from system design through release, with minimal oversight." },
  ],
  [
    { text: "Full-stack across " },
    { text: "Python", bold: true },
    { text: " and " },
    { text: "React / TypeScript", bold: true },
    { text: " on " },
    { text: "AWS", bold: true },
    {
      text: " — Lambda, AppSync (GraphQL), Cognito, and API Gateway — using ",
    },
    { text: "SQLAlchemy", bold: true },
    { text: ", PostgreSQL, and infrastructure as code in " },
    { text: "CloudFormation / SAM", bold: true },
    { text: "." },
  ],
  [
    { text: "Build and manage autonomous " },
    { text: "LangGraph / OpenAI agents", bold: true },
    {
      text: " with orchestration, RAG, prompt engineering, and tool calling, pairing model calls with deterministic logic where reliability matters.",
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
      "Own a cloud-native operations platform end to end — customer booking plus internal tools for reservations, scheduling, and fulfillment — shipping from architecture through deployment with minimal oversight.",
      "Build on Python (FastAPI / Django REST) and React / TypeScript on AWS serverless, with autonomous LangGraph / OpenAI agents for reservations and reporting.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Delivered a cloud-based payment control and management platform for client MCM — dropped into the client's existing repository, picked up its conventions, and owned the data model, REST APIs, and UI on a fast release cadence with minimal oversight.",
      "Built Python (FastAPI) services and a React / TypeScript front end on AWS serverless — Lambda, API Gateway, AppSync (GraphQL), Cognito — with infrastructure as code in CloudFormation / SAM and SQLAlchemy over PostgreSQL.",
      "Took features from initial ask to shipped solution independently, pairing with the client team through code review.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Contributed to event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
      "Worked independently inside an established codebase — picked up its conventions quickly, owned features end to end, and contributed heavily to code review.",
      "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Prometheus, Grafana).",
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
      "Built Python and Node.js REST APIs and backend integrations for a chemical management system, in a client-facing engineering capacity through Infosys.",
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
