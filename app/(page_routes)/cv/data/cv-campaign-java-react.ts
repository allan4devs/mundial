import type { CvData, Highlight, SkillGroup, SummarySegment } from "../types";
import {
  aiSkills,
  backendSkills,
  cloudSkills,
  contactInfo,
  dataSkills,
  density,
  education,
  engineeringSkills,
  experience,
  frontendSkills,
  languages,
  personalInfo,
} from "./cv-data-java-react";

export type CampaignJob = {
  key: string;
  order: number;
  company: string;
  name: string;
  postingTitle: string;
  resumeTitle: string;
  location: string;
  jobUrl: string;
  when: string;
  focus: string[];
  emphasis: "backend" | "frontend" | "cloud" | "ai" | "integration";
  summaryFocus: string;
  proof: string;
};

export const JAVA_REACT_CAMPAIGN_JOBS = {
  newfire: {
    key: "newfire",
    order: 1,
    company: "Newfire Global Partners",
    name: "01 · Newfire",
    postingTitle: "Senior Full-Stack (Java/React)",
    resumeTitle: "Senior Full-Stack Engineer · Java / React",
    location: "Costa Rica · Fully Remote",
    jobUrl: "https://jobs.newfireglobal.com/careers/senior-full-stack-java-react/",
    when: "Apply first — exact Java / Spring Boot + React / Next.js match with modernization, mentoring, testing, and AI-assisted delivery.",
    focus: ["Java · Spring Boot", "React · Next.js", "PostgreSQL", "AI-assisted delivery"],
    emphasis: "ai",
    summaryFocus: "modernizing and extending production platforms with disciplined testing, small reviewable changes, and AI-assisted engineering",
    proof: "Owns production systems end to end and has led architecture, code reviews, mentoring, and LLM-enabled product delivery.",
  },
  abstra: {
    key: "abstra",
    order: 2,
    company: "Abstra",
    name: "02 · Abstra",
    postingTitle: "Senior Java / React Full Stack Engineer",
    resumeTitle: "Senior Java / React Full-Stack Engineer",
    location: "LATAM · 100% Remote · Contract",
    jobUrl: "https://withmira.dev/jobs/abstra-senior-java-react-full-stack-engineer",
    when: "Apply second — strongest distributed-systems match: Java, React / Next.js, PostgreSQL, Kafka, gRPC, AWS, and mentoring.",
    focus: ["Java · microservices", "React · Next.js", "Kafka · gRPC", "AWS · PostgreSQL"],
    emphasis: "backend",
    summaryFocus: "owning distributed features from relational data models and contract-driven services through React interfaces and production operations",
    proof: "Production experience spans Spring Boot microservices, Kafka, RabbitMQ, REST, GraphQL, gRPC, AWS, Kubernetes, and React dashboards.",
  },
  "fpt-quarkus": {
    key: "fpt-quarkus",
    order: 3,
    company: "FPT Latin America",
    name: "03 · FPT · Quarkus / React",
    postingTitle: "Senior Full Stack Engineer – Java / Quarkus / React",
    resumeTitle: "Senior Full-Stack Engineer · Java / React",
    location: "Costa Rica / Mexico / Colombia · Remote",
    jobUrl: "https://www.linkedin.com/jobs/view/4452693485/",
    when: "Apply third — Java/JVM backend ownership, React / Next.js, PostgreSQL, event-driven systems, testing, CI/CD, and customer-facing delivery.",
    focus: ["Java · REST APIs", "React · Next.js", "PostgreSQL", "Kafka · Docker · CI/CD"],
    emphasis: "backend",
    summaryFocus: "turning customer requirements into production-ready Java services, data models, APIs, and React experiences",
    proof: "Has repeatedly owned features across backend, frontend, databases, testing, cloud delivery, production support, and technical reviews.",
  },
  athenaworks: {
    key: "athenaworks",
    order: 4,
    company: "Athenaworks",
    name: "04 · Athenaworks",
    postingTitle: "Mid-Senior Full-Stack Engineer (Java/Python + React, TypeScript, AWS)",
    resumeTitle: "Senior Full-Stack Engineer · Java / Python / React",
    location: "Costa Rica / LATAM · Remote Contract",
    jobUrl: "https://recruiterflow.com/db_84d9b0015205ce7ab8380a53a0ac4024/jobs",
    when: "Apply fourth — broadest direct match across Java, Python, React, TypeScript, AWS, APIs, AI tools, and end-to-end ownership.",
    focus: ["Java · Python", "React · TypeScript", "AWS", "AI-assisted engineering"],
    emphasis: "cloud",
    summaryFocus: "shipping full-stack client work across Java and Python services, React / TypeScript interfaces, and AWS delivery",
    proof: "Current and prior roles combine Java, Python, React, APIs, AWS, infrastructure, AI integrations, and independent feature ownership.",
  },
  zarego: {
    key: "zarego",
    order: 5,
    company: "Zarego",
    name: "05 · Zarego",
    postingTitle: "Full Stack Developer (Java, React) - Remote LATAM",
    resumeTitle: "Senior Full-Stack Developer · Java / React",
    location: "LATAM · Remote",
    jobUrl: "https://careers-page.com/zarego/job/RY65W696",
    when: "Apply fifth — clean Java / Spring Boot, React / TypeScript, AWS, Docker, CI/CD, and English match.",
    focus: ["Java · Spring Boot", "React · TypeScript", "AWS", "Docker · CI/CD"],
    emphasis: "cloud",
    summaryFocus: "building maintainable Java / Spring Boot APIs and React / TypeScript products on AWS with reliable delivery practices",
    proof: "Brings C1 English plus production experience with Spring Boot, React, TypeScript, AWS, Docker, testing, and CI/CD.",
  },
  rimutee: {
    key: "rimutee",
    order: 6,
    company: "Rimutee",
    name: "06 · Rimutee",
    postingTitle: "Senior Full Stack Developer – Java, React",
    resumeTitle: "Senior Full-Stack Developer · Java / React",
    location: "LATAM · Remote · Contractor",
    jobUrl: "https://www.remotery.co/job/remote-senior-full-stack-developer-java-react-at-rimutee-in-latin-america-freelance-ae42db",
    when: "Apply sixth — fintech-oriented REST / GraphQL, Java, React, PostgreSQL, Kafka, AWS, and resilient event-driven delivery.",
    focus: ["Java · APIs", "React · TypeScript", "Kafka", "AWS · PostgreSQL"],
    emphasis: "backend",
    summaryFocus: "building financial and operational workflows on event-driven Java services, PostgreSQL, AWS, and React interfaces",
    proof: "Delivered a cloud payment-control platform and has hands-on Spring Boot, React, Kafka, PostgreSQL, AWS, API, and consulting experience.",
  },
  "we-built-it": {
    key: "we-built-it",
    order: 7,
    company: "We Built It",
    name: "07 · We Built It",
    postingTitle: "Senior Full-Stack Engineer",
    resumeTitle: "Senior Full-Stack Engineer · React / Java",
    location: "Worldwide · Fully Remote",
    jobUrl: "https://www.getonbrd.com/jobs/programacion/senior-full-stack-engineer-we-built-it-remote",
    when: "Apply seventh — React / TypeScript-led full stack role with Java / Spring Boot, REST APIs, automated testing, and agile delivery.",
    focus: ["React · TypeScript", "Java · Spring Boot", "REST APIs", "Automated testing"],
    emphasis: "frontend",
    summaryFocus: "delivering accessible, production-ready React / TypeScript features backed by Java services and well-designed APIs",
    proof: "Has built customer and operational React products, Java services, API integrations, automated delivery pipelines, and production monitoring.",
  },
  velozient: {
    key: "velozient",
    order: 8,
    company: "Velozient",
    name: "08 · Velozient",
    postingTitle: "Senior Full Stack Software Engineer",
    resumeTitle: "Senior Full-Stack Software Engineer",
    location: "Remote · LATAM eligibility to confirm",
    jobUrl: "https://velozient.com/senior-full-stack-software-engineer-2/",
    when: "Apply eighth after confirming Costa Rica eligibility — strong React plus Java / Spring Boot, architecture, cloud, mentoring, and modernization fit.",
    focus: ["React", "Java · Spring Boot", "Architecture", "Cloud · CI/CD"],
    emphasis: "integration",
    summaryFocus: "modernizing full-stack platforms across services, APIs, data architecture, React applications, cloud delivery, and technical leadership",
    proof: "Has led architecture and reviews while building distributed services, modern web interfaces, integrations, CI/CD, observability, and cloud deployments.",
  },
  launchpad: {
    key: "launchpad",
    order: 9,
    company: "Launchpad Technologies",
    name: "09 · Launchpad",
    postingTitle: "Senior Full-Stack Developer – Java & Integrations",
    resumeTitle: "Senior Java Full-Stack Developer",
    location: "Worldwide · Remote Contractor",
    jobUrl: "https://www.getonbrd.com/jobs/programacion/senior-full-stack-developer-java-integrations-launchpad-technologies-remote",
    when: "Apply ninth — backend-heavy Java / Spring Boot integration role; React is useful but secondary. Confirm PST schedule fit.",
    focus: ["Java · Spring Boot", "REST · GraphQL", "Distributed systems", "PostgreSQL · messaging"],
    emphasis: "integration",
    summaryFocus: "designing reliable Java services and integrations across APIs, messaging, relational data, distributed systems, and production operations",
    proof: "Brings deep API and integration work across Spring Boot, REST, GraphQL, Kafka, RabbitMQ, PostgreSQL, cloud platforms, and production support.",
  },
  "factor-it": {
    key: "factor-it",
    order: 10,
    company: "Factor IT",
    name: "10 · Factor IT",
    postingTitle: "Desarrollador Full-Stack Java + React + Modyo",
    resumeTitle: "Senior Full-Stack Developer · Java / React",
    location: "Worldwide · Fully Remote",
    jobUrl: "https://www.getonbrd.com/jobs/desarrollador-full-stack-java-react-factor-it-remote",
    when: "Apply tenth — exact Java / React base match; keep Modyo as a learning gap rather than claiming experience.",
    focus: ["Java", "React · TypeScript", "Docker", "SQL · APIs"],
    emphasis: "frontend",
    summaryFocus: "building end-to-end Java and React platforms with strong API design, data handling, Docker-based delivery, and product ownership",
    proof: "Production background covers Java, React, TypeScript, SQL, Docker, APIs, cloud delivery, and complex operational workflows.",
  },
} as const satisfies Record<string, CampaignJob>;

export type JavaReactCampaignJobKey = keyof typeof JAVA_REACT_CAMPAIGN_JOBS;
export const JAVA_REACT_CAMPAIGN_JOB_KEYS = Object.keys(
  JAVA_REACT_CAMPAIGN_JOBS,
) as JavaReactCampaignJobKey[];

const skillGroups: Record<CampaignJob["emphasis"], readonly SkillGroup[]> = {
  backend: [backendSkills, dataSkills, frontendSkills, cloudSkills],
  frontend: [frontendSkills, backendSkills, cloudSkills, dataSkills],
  cloud: [cloudSkills, backendSkills, frontendSkills, dataSkills],
  ai: [backendSkills, frontendSkills, aiSkills, cloudSkills],
  integration: [backendSkills, dataSkills, cloudSkills, frontendSkills],
};

export function isJavaReactCampaignJobKey(value: string): value is JavaReactCampaignJobKey {
  return value in JAVA_REACT_CAMPAIGN_JOBS;
}

export function buildJavaReactCampaignCv(key: JavaReactCampaignJobKey): CvData {
  const job = JAVA_REACT_CAMPAIGN_JOBS[key];
  const ordered = skillGroups[job.emphasis];
  const summary: SummarySegment[][] = [
    [
      { text: "Senior full-stack engineer and independent contractor with " },
      { text: "11+ years", bold: true, accent: true },
      {
        text: ` delivering production software, currently leading 3+ client brands while focused on ${job.summaryFocus}.`,
      },
    ],
    [
      { text: "Hands-on across " },
      { text: "Java / Spring Boot", bold: true },
      { text: ", " },
      { text: "React / Next.js / TypeScript", bold: true },
      { text: ", AWS, PostgreSQL, event-driven systems, testing, CI/CD, and production support. Technical lead and mentor with " },
      { text: "C1 English", bold: true },
      { text: " for distributed product and engineering teams." },
    ],
  ];
  const highlights: Highlight[] = [
    {
      title: `${job.company} fit`,
      detail: job.proof,
    },
    {
      title: "Java + React, end to end",
      detail: "Own data models, services, APIs, UI delivery, cloud deployment, observability, and production support.",
    },
    {
      title: "Cloud delivery + hands-on leadership",
      detail: "AWS, Kubernetes, Kafka, CI/CD, observability, architecture reviews, mentoring, and troubleshooting.",
    },
  ];

  return {
    density,
    personalInfo: { ...personalInfo, title: job.resumeTitle },
    contactInfo,
    primarySkills: ordered.slice(0, 3),
    secondarySkills: [ordered[3], engineeringSkills],
    education,
    languages,
    summary,
    highlights,
    experience,
  };
}
