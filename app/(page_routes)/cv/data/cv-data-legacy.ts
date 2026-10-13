import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

// ─────────────────────────────────────────────────────────────
// Archived combined "everything" résumé — every stack and tool from the
// tailored variants surfaced in one sheet, laid out feature-first. It remains
// available at /cv/legacy-god-cv, but is hidden by default in the workspace.
//
// Shared facts (name, contact block, education, languages) come from
// flat cv-definition-* modules — only summary + experience are tailored here.
// ─────────────────────────────────────────────────────────────

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Senior Full-Stack Software Engineer",
};

export const contactInfo = buildContactInfo("latamAmericas");

export const primarySkills = [
  {
    label: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "Java", "C#", "PHP", "SQL", "Bash"],
  },
  {
    label: "Backend & APIs",
    items: [
      "Spring Boot",
      "Node.js",
      "NestJS",
      "Express",
      "FastAPI",
      "Django REST",
      "Flask",
      "Laravel",
      ".NET 8 / ASP.NET Core",
      "REST",
      "GraphQL",
      "gRPC",
      "WebSockets",
      "Microservices",
      "Event-driven (Kafka, RabbitMQ)",
    ],
  },
  {
    label: "Frontend",
    items: ["React", "Next.js", "Remix", "Redux Toolkit", "TypeScript", "Tailwind CSS", "HTML / CSS", "Blade"],
  },
  {
    label: "AI & LLM Engineering",
    items: [
      "OpenAI & Anthropic Claude APIs",
      "RAG",
      "Embeddings & vector search",
      "pgvector",
      "LangGraph",
      "LangChain",
      "Agents & tool / function calling",
      "Prompt engineering",
      "Evals & guardrails",
      "MCP",
    ],
  },
  {
    label: "Cloud & DevOps",
    items: [
      "AWS (Lambda, AppSync, Cognito, API Gateway, ECS/EKS, S3, RDS, DynamoDB, SQS/SNS, CloudFormation/SAM, CDK)",
      "Azure (Functions, App Service, AKS, DevOps)",
      "GCP",
      "Docker",
      "Kubernetes",
      "Terraform",
      "GitHub Actions",
      "Jenkins",
      "CI/CD",
    ],
  },
] as const;

export const secondarySkills = [
  {
    label: "Data & Search",
    items: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "Elasticsearch (Query DSL, aggregations, ILM)",
      "SQLAlchemy",
      "Entity Framework Core",
      "Hibernate / JPA",
      "Eloquent ORM",
    ],
  },
  {
    label: "Observability",
    items: ["Datadog", "Prometheus", "Grafana", "OpenTelemetry", "APM", "Distributed tracing"],
  },
  {
    label: "Testing & CI/CD",
    items: ["Jest", "Vitest", "pytest", "Pest", "JUnit", "Playwright", "Cypress", "Supertest", "GitHub Actions", "Jenkins"],
  },
  {
    label: "Practice",
    items: [
      "System design",
      "Distributed systems",
      "DDD",
      "SOLID",
      "Clean, layered architecture",
      "Tech lead",
      "Code review",
      "Mentoring",
      "Agile / Scrum",
    ],
  },
];

export const languages = buildLanguages("full");

export type SummarySegment = {
  text: string;
  bold?: boolean;
  accent?: boolean;
};

export const highlights: { title: string; detail: string }[] = [
  {
    title: "Full-stack, scope → production",
    detail:
      "Own the data model, the APIs, the front end, and the cloud it runs on — currently the sole engineer on a cloud-native platform, shipping from architecture to deploy.",
  },
  {
    title: "AI / LLM features in production",
    detail:
      "OpenAI and Claude with RAG, tool / function calling, and LangGraph agents — paired with deterministic logic where correctness matters.",
  },
  {
    title: "Cloud-native across three clouds",
    detail:
      "AWS serverless (Lambda, AppSync, Cognito, API Gateway), plus Azure and GCP; Docker, Kubernetes, and IaC with Terraform / CloudFormation.",
  },
  {
    title: "Tech lead & mentor",
    detail:
      "Own architecture and technical decisions, run design reviews, and raise the bar through code review — 11+ years, enterprise to startup.",
  },
];

export const summary: SummarySegment[][] = [
  [
    { text: "11+ years", bold: true, accent: true },
    {
      text: " shipping production software across enterprise, healthcare, fintech, consumer, and consulting environments — full-stack, end to end.",
    },
  ],
  [
    { text: "Full-stack across " },
    { text: "Java / Spring Boot", bold: true },
    { text: ", " },
    { text: "TypeScript / React / Next.js", bold: true },
    { text: ", " },
    { text: "Python / FastAPI / Django", bold: true },
    { text: ", " },
    { text: "C# / .NET 8", bold: true },
    { text: ", and " },
    { text: "PHP / Laravel", bold: true },
    { text: " — on " },
    { text: "AWS, Azure, and GCP", bold: true },
    { text: " with Docker, Kubernetes, Elasticsearch, PostgreSQL, and CI/CD." },
  ],
  [
    { text: "Build " },
    { text: "LLM-powered, agentic product features", bold: true },
    {
      text: " — OpenAI and Claude with RAG, tool calling, and LangGraph — pairing model calls with deterministic logic where reliability matters. English at ",
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
    role: "Senior Full-Stack Engineer",
    company: "La Vieja Adventures",
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica",
    current: true,
    bullets: [
      "Own a cloud-native booking and operations platform end to end as the sole engineer — customer booking plus internal tools for reservations, scheduling, and fulfillment — from architecture through deployment.",
      "Build on Spring Boot, FastAPI / Django REST, and Node.js behind React / Next.js on AWS (PostgreSQL / MySQL, Docker, GraphQL / REST), and add LLM-assisted tools — OpenAI and Claude with RAG and tool calling — for reservations, customer communication, and reporting.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management (MCM)",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Delivered and operated a cloud-based payment control and management platform for client MCM, owning services end to end from data model through REST and GraphQL APIs on a fast release cadence.",
      "Built the backend in Spring Boot with a React / TypeScript front end, deployed and monitored on AWS with Docker; added Elasticsearch-powered search and reporting and LLM-assisted automation over platform data.",
      "Worked as an embedded consulting engineer inside the client's team, influencing technical decisions and setting standards through code and design reviews.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Designed and operated Spring Boot microservices and event-driven services across AWS and Kubernetes, using Kafka and RabbitMQ for streaming, exposing REST and GraphQL APIs for downstream teams.",
      "Built React and Redux Toolkit dashboards with real-time visualization for operational monitoring, and tuned Elasticsearch indices and queries for operational search.",
      "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Datadog, Prometheus, Grafana); led design reviews and mentored engineers, raising consistency across the backend team.",
    ],
  },

  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Built and maintained Laravel and Node.js applications with React frontends, including Kaptyn, a luxury ride-hailing platform.",
      "Designed RESTful APIs and PostgreSQL / MySQL data models for GPS tracking, payments, and real-time mobility, tuning queries and caching for scale and validating with automated testing.",
    ],
  },

  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Built backend integrations and REST APIs for a chemical management system in Node.js and Python, in a client-facing engineering capacity through Infosys (contracted via Amtek).",
    ],
  },

  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built Java, C#, and Python systems supporting FDA-regulated medical-device manufacturing operations and SQL-backed production workflows under FDA and ISO 13485 quality controls.",
      "Automated production reporting and equipment-monitoring dashboards using JavaScript and Chart.js.",
    ],
  },

  {
    role: "Technician II",
    company: "ImagineerCX",
    period: "2015 – 2016",
    location: "Costa Rica",
    bullets: [
      "Developed customer-facing web applications using PHP, JavaScript, and MySQL.",
      "Improved frontend rendering and backend performance across Agile development cycles.",
    ],
  },
];
