import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Senior Software Engineer — Elasticsearch & Node.js",
};

export const contactInfo = buildContactInfo("latam");

export const primarySkills = [
  {
    label: "Search & Elasticsearch",
    items: ["Elasticsearch", "Query DSL", "Aggregations", "Index Lifecycle Management (ILM)", "Performance Tuning"],
  },
  {
    label: "Backend & APIs",
    items: ["Node.js", "REST APIs", "TypeScript", "JavaScript", "GraphQL"],
  },
  {
    label: "Observability & Telemetry",
    items: ["Datadog", "Elasticsearch APM", "Prometheus", "Grafana", "Distributed Tracing"],
  },
  {
    label: "Cloud & Containers",
    items: ["AWS", "Docker", "Kubernetes", "ECS/EKS", "Terraform"],
  },
] as const;

export const secondarySkills = [
  { label: "Databases", items: ["MongoDB", "PostgreSQL", "MySQL", "SQL", "Redis"] },
  { label: "AI-Assisted Development", items: ["GitHub Copilot", "GenAI Workflows", "Prompt Engineering"] },
  { label: "Testing & CI/CD", items: ["Jest", "Playwright", "GitHub Actions", "Jenkins"] },
];

export const languages = buildLanguages("full");

export type SummarySegment = {
  text: string;
  bold?: boolean;
  accent?: boolean;
};

export const summary: SummarySegment[][] = [
  [
    { text: "11+ years", bold: true, accent: true },
    {
      text: " designing and delivering scalable backend systems and search/observability infrastructure across enterprise, healthcare, consumer, and consulting environments.",
    },
  ],
  [
    { text: "Hands-on expertise in " },
    { text: "Node.js", bold: true },
    { text: " and " },
    { text: "Elasticsearch", bold: true },
    { text: " (Query DSL, aggregations, ILM, performance tuning), with production observability via " },
    { text: "Datadog and Elasticsearch APM", bold: true },
    {
      text: ", REST APIs, Docker, AWS, and both SQL and NoSQL databases including MongoDB, PostgreSQL, and MySQL.",
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
      "Build a cloud-native booking platform with Node.js, TypeScript, and REST / GraphQL APIs over MongoDB and MySQL, deployed on AWS with Docker.",
      "Add Elasticsearch indexing, Query DSL, and aggregations for platform search and reporting, instrumented with Datadog and Elasticsearch APM.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management (MCM)",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Delivered and maintained a cloud-based payment control and management platform for client MCM, exposing Node.js REST APIs backed by Elasticsearch-powered search and reporting.",
      "Designed and tuned Elasticsearch indices, Query DSL queries, and aggregations, and managed index lifecycle (ILM) for retention and cost.",
      "Instrumented services with Datadog and Elasticsearch APM for telemetry, distributed tracing, and performance troubleshooting across the platform, as part of an embedded consulting engineering team.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Designed and maintained Spring Boot microservices and event-driven backend services across AWS, Docker, and Kubernetes environments, exposing REST APIs for downstream integrations.",
      "Built and tuned Elasticsearch indices, Query DSL queries, and aggregations to power operational search and real-time dashboards.",
      "Owned search relevance and query performance for operational dashboards, reducing query latency through mapping and aggregation tuning.",
      "Strengthened production observability with Datadog, Elasticsearch APM, Prometheus, and Grafana, improving telemetry and incident troubleshooting across distributed systems.",
    ],
  },

  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Built and maintained Laravel applications with React frontends, including Kaptyn, a luxury ride-hailing platform.",
      "Designed RESTful APIs and integrations for GPS tracking, payments, and real-time mobility, backed by SQL and NoSQL data stores.",
      "Optimized API and database performance through SQL tuning and caching, validated with automated testing.",
    ],
  },

  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Delivered backend integrations for a chemical management system using Node.js and REST APIs.",
      "Worked in a client-facing engineering capacity through Infosys, contracted via Amtek.",
    ],
  },

  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built Java and Python systems supporting FDA-regulated medical-device manufacturing operations and SQL-backed production workflows.",
      "Automated production reporting and equipment-monitoring dashboards using JavaScript and Chart.js within FDA and ISO 13485 quality environments.",
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
