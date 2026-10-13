import { buildContactInfo, buildLanguages, NAME } from "./cv-definition-identity";

export { education } from "./cv-definition-education";

export const personalInfo = {
  name: NAME,
  title: "Senior Full-Stack Software Engineer",
};

export const contactInfo = buildContactInfo("americas");

export const primarySkills = [
  {
    label: "Languages",
    items: ["Python", "C#", "TypeScript", "JavaScript", "Java", "SQL"],
  },
  {
    label: "Backend & APIs",
    items: ["FastAPI", ".NET 8", "ASP.NET Core", "REST", "GraphQL", "Microservices"],
  },
  {
    label: "Frontend",
    items: ["React 19", "Next.js", "Redux Toolkit", "TypeScript", "Tailwind CSS"],
  },
  {
    label: "Cloud & DevOps",
    items: ["Azure", "App Service", "Azure Functions", "AKS", "Docker", "Kubernetes", "CI/CD", "Azure DevOps"],
  },
  {
    label: "Data",
    items: ["PostgreSQL", "Redis", "Entity Framework (EF Core)", "MySQL"],
  },
] as const;

export const secondarySkills = [
  {
    label: "Also in the toolbox",
    items: ["Spring Boot", "Node.js", "AWS", "Laravel", "PHP"],
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
    { text: "Full-stack engineer who ships production software " },
    { text: "end to end", bold: true, accent: true },
    {
      text: " — data model, API, the front end, and the cloud it runs on. Equally at home in the ",
    },
    { text: "Python", bold: true },
    { text: " and " },
    { text: ".NET", bold: true },
    {
      text: " ecosystems, and used to reaching for whatever fits the problem instead of forcing a single stack.",
    },
  ],
  [
    { text: "Lately that has meant " },
    { text: "FastAPI", bold: true },
    { text: " and " },
    { text: "ASP.NET Core", bold: true },
    { text: " services behind " },
    { text: "React", bold: true },
    { text: " apps on " },
    { text: "PostgreSQL", bold: true },
    { text: ", deployed to " },
    { text: "Azure", bold: true },
    {
      text: " (and AWS), with AI-assisted features layered into the product. I ship fast, own scope directly with founders or inside a client team, and keep the codebase clean as it grows.",
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
      "Own a cloud-native operations platform end to end — customer booking and sales plus internal tools for reservations, scheduling, and fulfillment.",
      "Back it with FastAPI services and a React 19 / Next.js front end on PostgreSQL, containerized with Docker on Azure, with AI-assisted features layered into the product.",
    ],
  },

  {
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    bullets: [
      "Built C# / .NET 8 (ASP.NET Core) services and REST APIs for a cloud-based payment control and management platform (client MCM), on PostgreSQL with Entity Framework Core and deployed to Azure.",
      "Owned features from data model through API and React front end on a fast release cadence, working inside the client's team.",
      "Ran CI/CD on Azure DevOps and hardened the platform with structured logging and monitoring.",
    ],
  },

  {
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    bullets: [
      "Built microservices and REST APIs in .NET 8 and Java across Azure and Kubernetes, with React / Redux Toolkit dashboards for real-time operational monitoring.",
      "Ran CI/CD on Azure DevOps and GitHub Actions and hardened observability with Prometheus and Grafana.",
      "Led design reviews and mentored engineers, raising consistency across the backend.",
    ],
  },

  {
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    bullets: [
      "Delivered full-stack web apps with React front ends — including Kaptyn, a luxury ride-hailing platform — over PostgreSQL and MySQL, with REST APIs for GPS, payments, and real-time mobility.",
    ],
  },

  {
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    bullets: [
      "Built Python backend integrations and internal APIs for a chemical management system, in a client-facing engineering capacity through Infosys.",
    ],
  },

  {
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    bullets: [
      "Built C#, Python, and Java systems for FDA-regulated medical-device manufacturing, with automated production reporting under ISO 13485 quality controls.",
    ],
  },
];
