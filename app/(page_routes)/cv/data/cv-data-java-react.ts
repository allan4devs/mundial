import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";
import { education } from "./cv-definition-education";
import type { CvData, Highlight, SkillGroup, SummarySegment } from "../types";

export { education };

export const density = "compact" as const;

export const personalInfo = {
  name: NAME,
  title: "Senior Full-Stack Engineer · Java / React",
};

export const contactInfo = buildContactInfo("latamAmericas");

export const backendSkills: SkillGroup = {
  label: "Java & Backend",
  items: [
    "Java",
    "Spring Boot",
    "Microservices",
    "REST",
    "GraphQL",
    "gRPC",
    "JPA / Hibernate",
    "Kafka",
    "RabbitMQ",
  ],
};

export const frontendSkills: SkillGroup = {
  label: "React & Frontend",
  items: ["React", "Next.js", "TypeScript", "Redux Toolkit", "Tailwind CSS", "HTML / CSS"],
};

export const cloudSkills: SkillGroup = {
  label: "Cloud & Delivery",
  items: [
    "AWS",
    "Docker",
    "Kubernetes",
    "Terraform",
    "CloudFormation / CDK",
    "GitHub Actions",
    "Jenkins",
    "CI/CD",
  ],
};

export const dataSkills: SkillGroup = {
  label: "Data & Search",
  items: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQL"],
};

export const aiSkills: SkillGroup = {
  label: "AI-Assisted Engineering",
  items: ["OpenAI / Claude APIs", "RAG", "Tool calling", "LangGraph", "Prompt engineering", "Evals / guardrails"],
};

export const engineeringSkills: SkillGroup = {
  label: "AI & Engineering Leadership",
  items: [
    "System design",
    "Distributed systems",
    "RAG / tool calling",
    "Automated testing",
    "Observability",
    "Code review",
    "Mentoring",
  ],
};

export const primarySkills = [backendSkills, frontendSkills, cloudSkills] as const;
export const secondarySkills = [dataSkills, engineeringSkills] as const;

export const languages = buildLanguages("full");

export const highlights: Highlight[] = [
  {
    title: "Java + React, end to end",
    detail: "Own data models, Spring Boot services, APIs, React interfaces, delivery, and production support.",
  },
  {
    title: "Cloud delivery + technical leadership",
    detail: "AWS, Kubernetes, Kafka, CI/CD, observability, architecture reviews, mentoring, and production ownership.",
  },
  {
    title: "Multi-client consulting delivery",
    detail: "Lead architecture and production delivery across 3+ client brands, from stakeholder discovery through support.",
  },
];

export const summary: SummarySegment[][] = [
  [
    { text: "Senior full-stack engineer and independent contractor with " },
    { text: "11+ years", bold: true, accent: true },
    { text: " delivering production software and leading architecture, delivery, and support across 3+ client brands." },
  ],
  [
    { text: "Strongest across " },
    { text: "Java / Spring Boot", bold: true },
    { text: " backends and " },
    { text: "React / Next.js / TypeScript", bold: true },
    { text: " frontends, backed by AWS, PostgreSQL, Kafka, Kubernetes, CI/CD, and production AI integrations. Hands-on lead and mentor with " },
    { text: "C1", bold: true },
    { text: " English for distributed teams." },
  ],
];

export const experience: CvData["experience"] = [
  {
    role: "Senior Full-Stack Software Engineer · Independent Contractor",
    company: "Independent Consulting · Multiple Clients",
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica / LATAM",
    current: true,
    bullets: [
      "Lead 3+ client brands — La Vieja Adventures, Xtreme Gym, TechnoSolutions, and other web products — owning discovery, architecture, data, security, testing, CI/CD, cloud operations, incidents, and stakeholder delivery.",
      "Built Xtreme Gym's 5 connected surfaces and QR equipment platform for 131 physical assets, integrating identity, inventory, payments, and member operations on MongoDB.",
      "Built La Vieja Adventures' reservation and operations platform across scheduling, fulfillment, communications, and reporting; added guarded OpenAI / Claude workflows with RAG and tool calling.",
    ],
  },
  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management (MCM)",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Owned payment-control features from relational models and Spring Boot services through REST / GraphQL contracts and React / TypeScript workflows; operated them on AWS with Docker and Elasticsearch.",
      "Served as an embedded senior consultant: translated business needs into designs, reviewed code, influenced architecture, troubleshot across layers, and coordinated client releases.",
    ],
  },
  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Designed Spring Boot microservices and event-driven services on AWS / Kubernetes with Kafka, RabbitMQ, and REST / GraphQL; built React / Redux dashboards and tuned Elasticsearch workloads.",
      "Raised reliability with GitHub Actions, Jenkins, Datadog, Prometheus, and Grafana while leading design reviews, incident analysis, code review, and mentoring.",
    ],
  },
  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Delivered React applications and Node.js / Laravel services, including Kaptyn, a luxury ride-hailing platform with GPS tracking, payments, and real-time mobility workflows.",
      "Designed REST APIs and PostgreSQL / MySQL models, optimized queries and caching, and supported features through automated testing and production troubleshooting.",
    ],
  },
  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Built and supported Node.js / Python integrations and REST APIs for Intel's chemical management system, working in a client-facing consulting team across requirements, delivery, and production support.",
    ],
  },
  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built Java, C#, Python, and SQL systems supporting production workflows in an FDA-regulated, ISO 13485 medical-device manufacturing environment.",
      "Replaced manual production reporting and equipment-monitoring steps with automated data pipelines and JavaScript / Chart.js operational dashboards.",
    ],
  },
  {
    role: "Technician II",
    company: "ImagineerCX",
    period: "2015 – 2016",
    location: "Costa Rica",
    bullets: [
      "Developed and supported customer-facing PHP, JavaScript, and MySQL applications, improving frontend rendering and backend performance across Agile release cycles.",
    ],
  },
];
