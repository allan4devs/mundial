import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Senior Full Stack Software Engineer",
};

export const contactInfo = buildContactInfo("americas");

export const primarySkills = [
  {
    label: "Full-Stack Web",
    items: ["Python", "Django", "TypeScript", "React", "Remix", "JavaScript", "HTML", "CSS"],
  },
  {
    label: "APIs & Data",
    items: ["Django REST Framework", "REST", "GraphQL", "PostgreSQL", "Redis", "ORM & query tuning"],
  },
  {
    label: "Product Engineering",
    items: [
      "End-to-end ownership",
      "System design",
      "Product scoping",
      "UX collaboration",
      "Code review",
      "Startup / 0→1",
    ],
  },
  {
    label: "Cloud & Deployment",
    items: ["Render", "AWS", "Docker", "CI/CD", "GitHub Actions", "Observability"],
  },
  {
    label: "AI Integration",
    items: ["OpenAI / LLM APIs", "Workflow automation", "RAG", "Prompt engineering", "GitHub Copilot"],
  },
] as const;

export const secondarySkills = [
  {
    label: "Also in the toolbox",
    items: ["Java", "Spring Boot", "Node.js", "Next.js", "PHP", "Laravel", "MySQL"],
  },
  {
    label: "Testing & CI/CD",
    items: ["pytest", "Jest", "Playwright", "Cypress", "GitHub Actions", "Jenkins"],
  },
  {
    label: "Practice",
    items: ["Agile / Scrum", "Domain-Driven Design", "Mentoring", "Web fundamentals"],
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
      text: " designing and shipping production web software across enterprise, healthcare, consumer, and consulting environments.",
    },
  ],
  [
    { text: "Full-stack across " },
    { text: "Python / Django", bold: true },
    { text: " and " },
    { text: "TypeScript / React (Remix)", bold: true },
    {
      text: ", with PostgreSQL, REST and GraphQL APIs, and deployments on Render and AWS.",
    },
  ],
  [
    { text: "Own projects " },
    { text: "end to end", bold: true },
    {
      text: " — architecture, UX collaboration with designers, delivery, and production monitoring — and build ",
    },
    { text: "AI-assisted tools", bold: true },
    {
      text: " that automate quoting, scheduling, and internal operations. Comfortable moving fast and setting scope directly with founders.",
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
      "Own a cloud-native operations platform end to end — customer-facing booking and sales flows plus internal tools for reservations, scheduling, and fulfillment — from architecture through deployment.",
      "Build in Python and TypeScript (Django REST behind React / Next.js on PostgreSQL) and integrate LLM-assisted reservation handling, customer communication, and reporting.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management (MCM)",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Delivered a cloud-based payment control and management platform for client MCM, owning features end to end from data model and Django REST / Node APIs through the React front end.",
      "Automated quoting, scheduling, and internal operations workflows — including AI-assisted flows — that were previously manual, on a fast release cadence.",
      "Worked in an embedded consulting team, collaborating on UX and keeping the codebase maintainable through code review.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Designed and shipped backend services and REST APIs plus React and Redux Toolkit dashboards with real-time visualization for operational monitoring and decision support.",
      "Owned projects end to end — architecture, delivery, and production monitoring — and set technical direction across the team.",
      "Led design discussions, contributed heavily to code review, and mentored engineers to raise consistency across the team.",
      "Strengthened CI/CD with GitHub Actions and Jenkins and production observability with Prometheus and Grafana.",
    ],
  },

  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Built full-stack web applications with React front ends, including Kaptyn, a luxury ride-hailing platform.",
      "Designed RESTful APIs and PostgreSQL / MySQL data models for GPS tracking, payments, and real-time mobility.",
      "Tuned query and API performance with SQL optimization and caching, validated with automated tests.",
    ],
  },

  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Built backend integrations for a chemical management system in Python and Node.js.",
      "Worked in a client-facing engineering capacity through Infosys, contracted via Amtek.",
    ],
  },

  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built Python and Java systems supporting FDA-regulated medical-device manufacturing operations and SQL-backed production workflows.",
      "Automated production reporting and equipment-monitoring dashboards with Python and JavaScript under FDA and ISO 13485 quality controls.",
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
