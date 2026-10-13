import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Senior Java Backend Engineer",
};

export const contactInfo = buildContactInfo("remote");

export const primarySkills = [
  {
    label: "Core Java",
    items: [
      "Core Java (17 / 21)",
      "Concurrency & multi-threading",
      "JVM internals & memory management",
      "Garbage-collection tuning",
      "Object-oriented design",
      "SOLID & design patterns",
    ],
  },
  {
    label: "Frameworks & APIs",
    items: ["Spring Boot", "REST", "gRPC", "GraphQL", "Microservices", "JPA / Hibernate"],
  },
  {
    label: "Build, CI/CD & Observability",
    items: [
      "Maven",
      "Gradle",
      "JUnit",
      "GitHub Actions",
      "Jenkins",
      "Monorepos",
      "Feature flags / experimentation",
      "Datadog",
      "Prometheus",
      "Grafana",
    ],
  },
  {
    label: "Cloud & Containers",
    items: ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Lambda", "ECS / EKS"],
  },
  {
    label: "Reliability & Scale",
    items: [
      "Performance tuning",
      "JVM profiling",
      "Benchmarking",
      "SLAs / SLOs",
      "Distributed systems",
      "System design",
      "Kafka",
      "RabbitMQ",
      "PostgreSQL",
      "Redis",
    ],
  },
] as const;

export const secondarySkills = [
  {
    label: "Other Languages & Frameworks",
    items: ["TypeScript", "JavaScript", "Python", "PHP", "Node.js", "Laravel", "React", "Next.js"],
  },
  {
    label: "Practice",
    items: [
      "Technical roadmap & decision-making",
      "Code review",
      "Mentoring",
      "Cross-functional collaboration",
      "Agile",
    ],
  },
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
      text: " building and operating large-scale, production Java systems across enterprise, healthcare, consumer, and consulting environments — with deep, hands-on focus on ",
    },
    { text: "Core Java", bold: true },
    { text: "." },
  ],
  [
    { text: "Expert-level in " },
    { text: "concurrency and multi-threading", bold: true },
    { text: ", " },
    { text: "JVM internals, memory management, and garbage-collection tuning", bold: true },
    { text: ", " },
    { text: "object-oriented design", bold: true },
    { text: ", and " },
    { text: "Maven / Gradle", bold: true },
    { text: " build tooling — applied to " },
    { text: "Spring Boot microservices", bold: true },
    { text: " and " },
    { text: "REST / gRPC APIs", bold: true },
    { text: " on AWS, GCP, and Azure with Docker and Kubernetes." },
  ],
  [
    { text: "Build " },
    { text: "internal developer-platform features", bold: true },
    {
      text: " — CI/CD, monorepos, feature flags / experimentation, and observability — that guide engineers along the ",
    },
    { text: "golden path", bold: true },
    { text: ", and drive " },
    { text: "operational excellence", bold: true },
    { text: " through SLAs / SLOs, JVM profiling, benchmarking, and performance tuning." },
  ],
  [
    { text: "Influence technical roadmap and decision-making, design " },
    { text: "AI-driven automation", bold: true },
    { text: " in Java, and mentor engineers through code review and design reviews." },
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
    role: "Senior Backend Engineer · Java Platform",
    company: "La Vieja Adventures",
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica",
    current: true,
    bullets: [
      "Design and operate Spring Boot services for a cloud-native booking and payments platform, applying Core Java, object-oriented design, and domain-driven boundaries as the sole engineer.",
      "Expose REST and gRPC APIs over AWS SNS/SQS and add AI-driven automation for reservations, customer communication, and reporting.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management (MCM)",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Delivered and maintained a cloud-based payment control platform for client MCM, owning service boundaries, data models, and JVM performance for reliability at scale.",
      "Built Spring Boot microservices and REST / gRPC APIs on AWS, tuned garbage collection and thread pools under load, and held coverage with JUnit.",
      "Owned the build and release path — Maven / Gradle, GitHub Actions CI/CD, Docker on Kubernetes — inside an embedded consulting team, influencing technical decisions across the engineering group.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Designed and operated Spring Boot microservices and event-driven services on AWS and Kubernetes, using Kafka and RabbitMQ for streaming and inter-service messaging with concurrent, high-throughput consumers.",
      "Built internal developer-platform capabilities — CI/CD (GitHub Actions, Jenkins), monorepo workflows, feature flags, and observability with Datadog, Prometheus, and Grafana — plus internal tools and APIs that improved developer productivity, and set SLAs/SLOs, coding standards, and performance benchmarks for the backend.",
      "Drove JVM profiling, benchmarking, and garbage-collection tuning to hold latency targets as traffic grew.",
      "Led system-design reviews, championed Java best practices, and mentored engineers through code review, raising consistency across the team.",
    ],
  },

  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Built and maintained backend services with React front ends, including Kaptyn, a luxury ride-hailing platform.",
      "Designed RESTful APIs, relational data models, and integrations for GPS tracking, payments, and real-time mobility, tuning queries, caching, and connection pools for scale.",
    ],
  },

  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Delivered backend integrations for a chemical management system using Node.js, in a client-facing engineering capacity through Infosys (contracted via Amtek).",
    ],
  },

  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built Core Java systems supporting FDA-regulated medical-device manufacturing, backed by SQL databases, under FDA and ISO 13485 quality controls.",
      "Automated production reporting and equipment-monitoring dashboards with Java, Python, and JavaScript.",
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
