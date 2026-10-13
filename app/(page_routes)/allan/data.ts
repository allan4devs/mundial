// ───────────────────────────────────────────────
// Allan Rojas — portfolio content + "river" timeline graph
//
// Framework-free on purpose. Edit the CONTENT freely (names, blurbs,
// years, skill notes, prototype links). Positions in 3D space are
// DERIVED at the bottom — you don't touch those.
//
// NOTE: project `blurb` / `highlights` are inferred drafts from the CV.
// Replace them with real copy and fill `prototypeUrl` as each prototype
// gets recreated (leave "#" while it's still pending).
// ───────────────────────────────────────────────

export type Section = "overview" | "timeline" | "skills" | "projects" | "contact";

export type Selection =
  | { type: "era"; id: string }
  | { type: "skill"; id: string }
  | { type: "project"; id: string };

export type Vec3 = [number, number, number];

export type Domain = "Consumer" | "Healthcare" | "Enterprise" | "Consulting" | "Tourism";

export type EraId =
  | "imagineercx"
  | "microvention"
  | "intel"
  | "crss"
  | "windriver"
  | "exq2"
  | "laviej";

export type ProjectStatus = "live" | "prototype" | "planned";

export interface SkillItem {
  name: string;
  eras: EraId[];
  note?: string;
  years: number;
  range: string;
  activeNow: boolean;
}

export interface SkillCluster {
  id: string;
  label: string;
  color: string;
  summary: string;
  items: SkillItem[];
  eraIds: EraId[];
  projectIds: string[];
  spanYears: number;
  range: string;
  activeNow: boolean;
  position: Vec3;
}

export interface Project {
  id: string;
  eraId: EraId;
  name: string;
  year: number;
  blurb: string;
  highlights: string[];
  tech: string[];
  clusters: string[];
  status: ProjectStatus;
  flagship: boolean;
  prototypeUrl: string;
  position: Vec3;
}

export interface Era {
  id: EraId;
  role: string;
  company: string;
  period: string;
  location: string;
  year: number;
  start: number;
  end: number;
  current: boolean;
  domain: Domain;
  bullets: string[];
  stack: string[];
  frac: number;
  position: Vec3;
  projectIds: string[];
  skillClusterIds: string[];
  skillItemCount: number;
}

// ── profile ────────────────────────────────────
export interface ContactLink {
  kind: "email" | "phone" | "github" | "location";
  label: string;
  value: string;
  href?: string;
}

interface Profile {
  name: string;
  firstName: string;
  monogram: string;
  title: string;
  tagline: string;
  location: string;
  available: string;
  summary: string[];
  contact: ContactLink[];
  languages: { language: string; level: string }[];
  education: { degree: string; school: string; period: string; note: string };
}

export const profile: Profile = {
  name: "Allan José Rojas Durán",
  firstName: "Allan",
  monogram: "AJRD",
  title: "Senior Software Engineer",
  tagline: "I architect and ship cloud-native systems end to end",
  location: "Alajuela, Costa Rica · Remote",
  available: "Open to senior / staff full-stack & backend roles",
  summary: [
    "11+ years designing and delivering production software across enterprise, healthcare, consumer and consulting environments.",
    "Full-stack across Java / Spring Boot, PHP / Laravel and TypeScript / React — plus AWS, microservices, REST & GraphQL APIs, cloud infrastructure and CI/CD.",
    "Comfortable owning a system end to end: architecture, delivery, observability and the AI-assisted tooling around it.",
  ],
  contact: [
    { kind: "email", label: "Email", value: "allan4devs@gmail.com", href: "mailto:allan4devs@gmail.com" },
    { kind: "phone", label: "Phone", value: "+506 7225 2296", href: "tel:+50672252296" },
    { kind: "github", label: "GitHub", value: "github.com/emeraldcr", href: "https://github.com/emeraldcr" },
    { kind: "location", label: "Based in", value: "Alajuela, Costa Rica · Remote" },
  ],
  languages: [
    { language: "Spanish", level: "Native" },
    { language: "English", level: "Professional Working Proficiency · C1" },
  ],
  education: {
    degree: "Computer Engineering",
    school: "Instituto Tecnológico de Costa Rica (TEC)",
    period: "2009 – 2015",
    note: "Graduation project: iTalent (Google Partner)",
  },
};

export const domainColor: Record<Domain, string> = {
  Consumer: "#a78bfa",
  Healthcare: "#2dd4bf",
  Enterprise: "#38bdf8",
  Consulting: "#fbbf24",
  Tourism: "#34d399",
};

export const statusColor: Record<ProjectStatus, string> = {
  live: "#34d399",
  prototype: "#38bdf8",
  planned: "#f59e0b",
};

export const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  prototype: "Prototype",
  planned: "To recreate",
};

// ── time helpers ───────────────────────────────
const NOW_YEAR = 2026.65;
const T0 = 2015;
const T1 = NOW_YEAR;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const yearFrac = (y: number) => clamp01((y - T0) / (T1 - T0));

function riverPos(frac: number): Vec3 {
  const x = -13 + frac * 26;
  const z = Math.sin(frac * Math.PI * 3.05) * 3.7;
  const y = Math.cos(frac * Math.PI * 2.2) * 0.65;
  return [x, y, z];
}

// ── eras (oldest → newest) ─────────────────────
interface EraRaw {
  id: EraId;
  role: string;
  company: string;
  period: string;
  location: string;
  start: number;
  end: number;
  current?: boolean;
  domain: Domain;
  bullets: string[];
  stack: string[];
}

const eraRaw: EraRaw[] = [
  {
    id: "imagineercx",
    role: "Technician II",
    company: "ImagineerCX",
    period: "2015 – 2016",
    location: "Costa Rica",
    start: 2015.5,
    end: 2016.5,
    domain: "Consumer",
    bullets: [
      "Developed customer-facing web applications using PHP, JavaScript and MySQL.",
      "Improved frontend rendering and backend performance across Agile development cycles.",
    ],
    stack: ["PHP", "JavaScript", "MySQL", "Agile"],
  },
  {
    id: "microvention",
    role: "Software Development Engineer I",
    company: "MicroVention · Terumo",
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    start: 2016.5,
    end: 2020.1,
    domain: "Healthcare",
    bullets: [
      "Built Java and Python systems supporting FDA-regulated medical-device manufacturing operations and SQL-backed production workflows.",
      "Automated production reporting and equipment-monitoring dashboards using JavaScript and Chart.js within FDA and ISO 13485 quality environments.",
    ],
    stack: ["Java", "Python", "SQL", "JavaScript", "Chart.js", "FDA / ISO 13485"],
  },
  {
    id: "intel",
    role: "Software Engineer",
    company: "Intel · via Infosys / Amstek",
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    start: 2021.1,
    end: 2022.4,
    domain: "Enterprise",
    bullets: [
      "Delivered backend integrations for a chemical management system using Node.js.",
      "Worked in a client-facing engineering capacity through Infosys, contracted via Amtek.",
    ],
    stack: ["Node.js", "REST", "Integrations"],
  },
  {
    id: "crss",
    role: "Full-Stack Engineer",
    company: "Costa Rica Software Services (CRSS)",
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    start: 2022.7,
    end: 2024.45,
    domain: "Consumer",
    bullets: [
      "Built and maintained Laravel applications with React frontends, including Kaptyn, a luxury ride-hailing platform.",
      "Designed RESTful APIs and integrations for GPS tracking, payments and real-time mobility.",
      "Optimized API and database performance through SQL tuning and caching, validated with automated testing.",
    ],
    stack: ["Laravel", "React", "REST", "SQL tuning", "Caching", "Playwright"],
  },
  {
    id: "windriver",
    role: "Senior Software Engineer",
    company: "Wind River",
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    start: 2024.7,
    end: 2025.8,
    domain: "Enterprise",
    bullets: [
      "Designed and maintained Spring Boot microservices and event-driven backend services across AWS and Kubernetes environments.",
      "Built React and Redux Toolkit dashboards with real-time visualization for operational monitoring and decision support.",
      "Improved deployment consistency through GitHub Actions and Jenkins while strengthening production observability with Prometheus and Grafana.",
    ],
    stack: [
      "Spring Boot",
      "Microservices",
      "AWS",
      "Kubernetes",
      "React",
      "Redux Toolkit",
      "GitHub Actions",
      "Jenkins",
      "Prometheus",
      "Grafana",
    ],
  },
  {
    id: "exq2",
    role: "Cloud Software Engineer",
    company: "EXQ2 · Client: Midland Credit Management",
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    start: 2025.8,
    end: 2026.3,
    domain: "Consulting",
    bullets: [
      "Delivered and maintained a cloud-based payment control and management platform supporting client MCM operations.",
      "Worked as part of an embedded consulting engineering team, contributing to production software delivery and cloud-based systems.",
    ],
    stack: ["Cloud", "Payments", "REST", "Elasticsearch", "Datadog"],
  },
  {
    id: "laviej",
    role: "Senior Full-Stack Engineer",
    company: "La Vieja Adventures",
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica",
    start: 2026.3,
    end: NOW_YEAR,
    current: true,
    domain: "Tourism",
    bullets: [
      "Architect and deliver a cloud-native tourism platform spanning booking, reservations, authentication, payments and operational workflows.",
      "Build end-to-end services with Spring Boot, React, Next.js, TypeScript, GraphQL and MySQL, deployed and monitored on AWS.",
      "Develop AI-assisted tools for reservations, customer communication, internal reporting and business operations.",
    ],
    stack: ["Spring Boot", "React", "Next.js", "TypeScript", "GraphQL", "MySQL", "AWS", "AI tooling"],
  },
];

const eraBase = eraRaw.map((e, i) => {
  const mid = (e.start + e.end) / 2;
  const frac = 0.5 * (i / (eraRaw.length - 1)) + 0.5 * yearFrac(mid);
  return {
    ...e,
    current: Boolean(e.current),
    year: Math.floor(e.start),
    frac,
    position: riverPos(frac),
  };
});

const eraMapBase: Record<EraId, (typeof eraBase)[number]> = Object.fromEntries(
  eraBase.map((e) => [e.id, e]),
) as Record<EraId, (typeof eraBase)[number]>;

// ── skill clusters ─────────────────────────────
interface SkillItemRaw {
  name: string;
  eras: EraId[];
  note?: string;
}
interface SkillClusterRaw {
  id: string;
  label: string;
  color: string;
  summary: string;
  items: SkillItemRaw[];
}

const skillsRaw: SkillClusterRaw[] = [
  {
    id: "languages",
    label: "Languages",
    color: "#34d399",
    summary: "A decade tuning the same base toolbox — picked per job, not per hype cycle.",
    items: [
      { name: "Java", eras: ["microvention", "windriver", "laviej"], note: "Regulated systems, then Spring Boot microservices" },
      { name: "JavaScript", eras: ["imagineercx", "microvention", "intel", "crss", "windriver", "laviej"] },
      { name: "TypeScript", eras: ["windriver", "exq2", "laviej"], note: "Daily driver in the current stack" },
      { name: "Python", eras: ["microvention"], note: "Reporting automation in FDA manufacturing" },
      { name: "PHP", eras: ["imagineercx", "crss"], note: "Customer apps, then Laravel" },
      { name: "SQL", eras: ["imagineercx", "microvention", "crss", "windriver", "exq2", "laviej"] },
    ],
  },
  {
    id: "backend",
    label: "Backend & APIs",
    color: "#2dd4bf",
    summary: "Services and contracts built to last, from monoliths to event-driven fleets.",
    items: [
      { name: "Spring Boot", eras: ["windriver", "laviej"], note: "Event-driven microservices on AWS / K8s" },
      { name: "Node.js", eras: ["intel", "laviej"], note: "Backend integrations and tooling" },
      { name: "Laravel", eras: ["crss"], note: "Kaptyn ride-hailing + Eloquent ORM" },
      { name: "REST APIs", eras: ["intel", "crss", "windriver", "exq2", "laviej"] },
      { name: "GraphQL", eras: ["laviej"] },
      { name: "Microservices", eras: ["windriver", "laviej"] },
      { name: "Event-driven services", eras: ["windriver"] },
    ],
  },
  {
    id: "frontend",
    label: "Frontend",
    color: "#a78bfa",
    summary: "Interfaces that make the backend make sense — dashboards, portals, booking flows.",
    items: [
      { name: "React", eras: ["crss", "windriver", "laviej"] },
      { name: "Next.js", eras: ["laviej"] },
      { name: "Redux Toolkit", eras: ["windriver"], note: "Real-time operational dashboards" },
      { name: "Tailwind CSS", eras: ["laviej"] },
      { name: "Blade", eras: ["crss"] },
      { name: "Data viz (Chart.js / Recharts)", eras: ["microvention", "windriver", "laviej"] },
    ],
  },
  {
    id: "cloud",
    label: "Cloud & Infra",
    color: "#38bdf8",
    summary: "Ship it, watch it, keep it up — AWS, containers and infrastructure as code.",
    items: [
      { name: "AWS", eras: ["windriver", "exq2", "laviej"] },
      { name: "Docker", eras: ["windriver", "exq2", "laviej"] },
      { name: "Kubernetes", eras: ["windriver"] },
      { name: "Terraform", eras: ["windriver"], note: "IaC for service environments" },
      { name: "Lambda", eras: ["windriver", "laviej"] },
      { name: "ECS / EKS", eras: ["windriver", "exq2"] },
    ],
  },
  {
    id: "data",
    label: "Data & Search",
    color: "#fbbf24",
    summary: "Storage, retrieval and everything between — relational, key-value, document, search.",
    items: [
      { name: "MySQL", eras: ["imagineercx", "crss", "laviej"] },
      { name: "PostgreSQL", eras: ["windriver"] },
      { name: "Redis", eras: ["crss", "windriver"], note: "Caching layer for API tuning" },
      { name: "MongoDB", eras: ["exq2", "laviej"] },
      { name: "Elasticsearch", eras: ["windriver", "exq2"], note: "Query DSL, aggregations, tuning" },
      { name: "Query DSL & aggregations", eras: ["windriver", "exq2"] },
    ],
  },
  {
    id: "delivery",
    label: "Delivery & Observability",
    color: "#fb7185",
    summary: "Confidence on every merge and visibility once it's in production.",
    items: [
      { name: "GitHub Actions", eras: ["windriver", "laviej"] },
      { name: "Jenkins", eras: ["windriver"] },
      { name: "Automated testing (Jest / Pest)", eras: ["crss", "windriver", "laviej"] },
      { name: "E2E (Playwright / Cypress / Dusk)", eras: ["crss", "laviej"] },
      { name: "Prometheus & Grafana", eras: ["windriver"] },
      { name: "Datadog & APM", eras: ["exq2"], note: "Telemetry and distributed tracing" },
    ],
  },
];

function spanFor(eraIds: EraId[]) {
  const es = eraIds.map((id) => eraMapBase[id]).filter(Boolean);
  if (!es.length) return { years: 0, range: "", activeNow: false };
  const first = Math.min(...es.map((e) => e.start));
  const last = es.reduce((a, b) => (b.end > a.end ? b : a));
  return {
    years: Math.max(1, Math.round(last.end - first)),
    range: `${Math.floor(first)} → ${last.current ? "now" : Math.floor(last.end)}`,
    activeNow: last.current,
  };
}

// ── projects (2–4 per era) ─────────────────────
interface ProjectRaw {
  id: string;
  eraId: EraId;
  name: string;
  blurb: string;
  highlights: string[];
  tech: string[];
  clusters: string[];
  status?: ProjectStatus;
  flagship?: boolean;
  prototypeUrl?: string;
}

const projectsRaw: ProjectRaw[] = [
  // ImagineerCX
  {
    id: "imag-web",
    eraId: "imagineercx",
    name: "Customer web applications",
    blurb: "Customer-facing web apps in PHP, JavaScript and MySQL, iterated in Agile cycles.",
    highlights: ["Full frontend + backend in PHP / JS / MySQL", "Shipped across short Agile iterations"],
    tech: ["PHP", "JavaScript", "MySQL"],
    clusters: ["languages", "frontend", "data"],
  },
  {
    id: "imag-perf",
    eraId: "imagineercx",
    name: "Rendering & backend perf pass",
    blurb: "Optimization of frontend rendering and backend response times across sprints.",
    highlights: ["Reduced page load times", "MySQL query tuning"],
    tech: ["JavaScript", "PHP", "MySQL"],
    clusters: ["frontend", "languages", "data"],
  },

  // MicroVention · Terumo
  {
    id: "mv-mfg-reporting",
    eraId: "microvention",
    name: "Manufacturing reporting automation",
    blurb:
      "Automated production reporting for FDA / ISO 13485-regulated medical-device manufacturing, in Java and Python.",
    highlights: ["Java + Python over SQL workflows", "FDA / ISO 13485 compliant"],
    tech: ["Java", "Python", "SQL"],
    clusters: ["languages", "data"],
    flagship: true,
  },
  {
    id: "mv-equipment-dash",
    eraId: "microvention",
    name: "Equipment monitoring dashboards",
    blurb: "Real-time equipment and production monitoring dashboards with JavaScript and Chart.js.",
    highlights: ["Live view of production lines", "Chart.js over SQL data"],
    tech: ["JavaScript", "Chart.js", "SQL"],
    clusters: ["frontend", "languages", "data"],
  },
  {
    id: "mv-prod-workflows",
    eraId: "microvention",
    name: "SQL production workflows",
    blurb: "Manufacturing-operations support systems backed by SQL databases.",
    highlights: ["Java production workflows", "SQL data model"],
    tech: ["Java", "SQL"],
    clusters: ["languages", "data"],
  },

  // Intel
  {
    id: "intel-chem-mgmt",
    eraId: "intel",
    name: "Chemical management integrations",
    blurb:
      "Backend integrations in Node.js for a chemical management system, in a client-facing role via Infosys.",
    highlights: ["Node.js backend integrations", "Delivered in a consulting context"],
    tech: ["Node.js", "REST"],
    clusters: ["languages", "backend"],
    flagship: true,
  },
  {
    id: "intel-api-layer",
    eraId: "intel",
    name: "Service integration layer",
    blurb: "REST integration endpoints between enterprise systems.",
    highlights: ["REST contracts between services", "Node.js"],
    tech: ["Node.js", "REST"],
    clusters: ["backend", "languages"],
  },

  // CRSS
  {
    id: "crss-kaptyn",
    eraId: "crss",
    name: "Kaptyn — luxury ride-hailing",
    blurb:
      "Luxury ride-hailing platform built with Laravel and React: GPS tracking, payments and real-time mobility.",
    highlights: ["Laravel + React end to end", "GPS, payments and real-time mobility"],
    tech: ["Laravel", "React", "REST", "MySQL", "Redis"],
    clusters: ["backend", "frontend", "data", "languages"],
    flagship: true,
  },
  {
    id: "crss-mobility-apis",
    eraId: "crss",
    name: "GPS & payments APIs",
    blurb: "RESTful APIs and integrations for GPS tracking, payments and real-time mobility.",
    highlights: ["REST API design", "Payments and GPS integrations"],
    tech: ["Laravel", "REST", "MySQL"],
    clusters: ["backend", "data"],
  },
  {
    id: "crss-perf",
    eraId: "crss",
    name: "API & DB performance tuning",
    blurb:
      "API and database performance optimization through SQL tuning and caching, validated with automated tests.",
    highlights: ["SQL tuning + Redis cache", "Validated with Pest / Dusk"],
    tech: ["SQL", "Redis", "Pest", "Dusk"],
    clusters: ["data", "delivery"],
  },

  // Wind River
  {
    id: "wr-ops-suite",
    eraId: "windriver",
    name: "Operational monitoring dashboards",
    blurb:
      "React + Redux Toolkit dashboards with real-time visualization for operational monitoring and decision support.",
    highlights: ["React + Redux Toolkit", "Real-time visualization"],
    tech: ["React", "Redux Toolkit", "Recharts", "TypeScript"],
    clusters: ["frontend", "languages"],
    flagship: true,
  },
  {
    id: "wr-microservices",
    eraId: "windriver",
    name: "Spring Boot microservices platform",
    blurb: "Spring Boot microservices and event-driven backend services across AWS and Kubernetes.",
    highlights: ["Event-driven services", "AWS + Kubernetes"],
    tech: ["Spring Boot", "AWS", "Kubernetes", "Java"],
    clusters: ["backend", "cloud", "languages"],
  },
  {
    id: "wr-observability",
    eraId: "windriver",
    name: "Delivery & observability pipeline",
    blurb:
      "GitHub Actions and Jenkins pipelines with production observability via Prometheus, Grafana and Elasticsearch APM.",
    highlights: ["CI/CD with GitHub Actions + Jenkins", "Prometheus + Grafana + APM"],
    tech: ["GitHub Actions", "Jenkins", "Prometheus", "Grafana", "Elasticsearch"],
    clusters: ["delivery", "cloud"],
  },

  // EXQ2 · MCM
  {
    id: "exq2-payments-platform",
    eraId: "exq2",
    name: "Payment control & management platform",
    blurb:
      "Cloud-based payment control and management platform supporting Midland Credit Management operations.",
    highlights: ["Cloud payments platform", "Embedded consulting team"],
    tech: ["Cloud", "REST", "Elasticsearch", "Datadog"],
    clusters: ["cloud", "backend", "delivery"],
    flagship: true,
  },
  {
    id: "exq2-search-reporting",
    eraId: "exq2",
    name: "Search & reporting layer",
    blurb: "Search and reporting over Elasticsearch with Query DSL and aggregations.",
    highlights: ["Query DSL + aggregations", "Operational reporting"],
    tech: ["Elasticsearch", "Query DSL", "REST"],
    clusters: ["data", "backend"],
  },
  {
    id: "exq2-telemetry",
    eraId: "exq2",
    name: "Telemetry & distributed tracing",
    blurb: "Instrumentation with Datadog and Elasticsearch APM for telemetry and distributed tracing.",
    highlights: ["Datadog + Elasticsearch APM", "Performance troubleshooting"],
    tech: ["Datadog", "Elasticsearch APM"],
    clusters: ["delivery"],
  },

  // La Vieja Adventures
  {
    id: "lva-platform",
    eraId: "laviej",
    name: "Tourism platform",
    blurb:
      "Cloud-native tourism platform: bookings, reservations, authentication, payments and operational workflows.",
    highlights: ["Spring Boot + React + Next.js + GraphQL", "Deployed and monitored on AWS"],
    tech: ["Spring Boot", "React", "Next.js", "TypeScript", "GraphQL", "MySQL", "AWS"],
    clusters: ["backend", "frontend", "cloud", "data", "languages"],
    flagship: true,
  },
  {
    id: "lva-ai-tooling",
    eraId: "laviej",
    name: "AI-assisted ops tooling",
    blurb: "AI-assisted tools for reservations, customer communication and internal reporting.",
    highlights: ["AI tooling over real operations", "Reservations, comms and reporting"],
    tech: ["TypeScript", "OpenAI", "Next.js"],
    clusters: ["languages", "backend"],
  },
  {
    id: "lva-booking-engine",
    eraId: "laviej",
    name: "Booking & reservations engine",
    blurb: "Booking and reservations engine: capacity, quotes, calendar availability and payments.",
    highlights: ["Capacity + quotes + calendar", "Payment integration (PayPal)"],
    tech: ["Next.js", "MySQL", "PayPal"],
    clusters: ["backend", "frontend", "data"],
  },
  {
    id: "lva-b2b",
    eraId: "laviej",
    name: "B2B partner portal",
    blurb: "Partner portal: bookings, dashboard and administration.",
    highlights: ["Partner bookings and dashboard", "Admin panel"],
    tech: ["Next.js", "Auth", "MySQL"],
    clusters: ["frontend", "backend", "data"],
  },
];

const projectsByEra = eraRaw.reduce<Record<string, ProjectRaw[]>>((acc, e) => {
  acc[e.id] = projectsRaw.filter((p) => p.eraId === e.id);
  return acc;
}, {});

function projectPos(p: ProjectRaw): Vec3 {
  const era = eraMapBase[p.eraId];
  const sibs = projectsByEra[p.eraId];
  const j = sibs.findIndex((x) => x.id === p.id);
  const k = sibs.length;
  return [
    era.position[0] + (j - (k - 1) / 2) * 1.9,
    era.position[1] - 2.9 - (j % 2) * 1.25,
    era.position[2] + 2.8 + j * 0.55,
  ];
}

export const projects: Project[] = projectsRaw.map((p) => ({
  id: p.id,
  eraId: p.eraId,
  name: p.name,
  year: eraMapBase[p.eraId].year,
  blurb: p.blurb,
  highlights: p.highlights,
  tech: p.tech,
  clusters: p.clusters,
  status: p.status ?? "planned",
  flagship: Boolean(p.flagship),
  prototypeUrl: p.prototypeUrl ?? "#",
  position: projectPos(p),
}));

// ── skill clusters (derived) ───────────────────
export const skills: SkillCluster[] = skillsRaw.map((c, index) => {
  const items: SkillItem[] = c.items.map((it) => {
    const s = spanFor(it.eras);
    return { name: it.name, eras: it.eras, note: it.note, years: s.years, range: s.range, activeNow: s.activeNow };
  });
  const eraIds = Array.from(new Set(c.items.flatMap((it) => it.eras))) as EraId[];
  const span = spanFor(eraIds);
  const avgFrac =
    eraIds.reduce((sum, id) => sum + eraMapBase[id].frac, 0) / Math.max(1, eraIds.length);
  const position: Vec3 = [
    -13 + avgFrac * 26 + (index - 2.5) * 0.4,
    5.6 + (index % 3) * 1.0,
    -3.0 - (index % 2) * 1.4,
  ];
  return {
    id: c.id,
    label: c.label,
    color: c.color,
    summary: c.summary,
    items,
    eraIds,
    projectIds: projects.filter((p) => p.clusters.includes(c.id)).map((p) => p.id),
    spanYears: span.years,
    range: span.range,
    activeNow: span.activeNow,
    position,
  };
});

// ── eras (derived links) ───────────────────────
export const eras: Era[] = eraBase.map((e) => ({
  ...e,
  projectIds: projects.filter((p) => p.eraId === e.id).map((p) => p.id),
  skillClusterIds: skills.filter((s) => s.eraIds.includes(e.id)).map((s) => s.id),
  skillItemCount: skills.reduce(
    (n, s) => n + s.items.filter((it) => it.eras.includes(e.id)).length,
    0,
  ),
}));

// ── lookups + stats ────────────────────────────
export const eraMap: Record<string, Era> = Object.fromEntries(eras.map((e) => [e.id, e]));
export const skillMap: Record<string, SkillCluster> = Object.fromEntries(
  skills.map((s) => [s.id, s]),
);
export const projectMap: Record<string, Project> = Object.fromEntries(
  projects.map((p) => [p.id, p]),
);

export const stats: { value: string; label: string }[] = [
  { value: "11+", label: "Years shipping" },
  { value: String(eras.length), label: "Companies" },
  { value: String(projects.length), label: "Projects" },
  { value: "5", label: "Domains" },
];
