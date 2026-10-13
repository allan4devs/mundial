// ─────────────────────────────────────────────────────────────
// Job definitions — one canonical record per employer, plus the full
// "bullet pool": every distinct bullet ever written for that job across all
// résumé variants, deduped and tagged.
//
// This is the MENU. When tailoring a new variant, pick bullets from a job's
// `bulletPool` (filter by `angles`) instead of re-inventing phrasing. The
// canonical `company` / `period` / `location` / `roleTitles` fix the drift
// that crept in across variants (e.g. "… Midland Credit Management" with and
// without "(MCM)", "Amtek" vs "Amstek").
//
// `sources` on each bullet = the variant slugs whose live data module uses
// that exact phrasing today ("base" = the default God CV at /cv). The /cv/stats
// page reconciles this pool against the live variants and flags any drift.
// ─────────────────────────────────────────────────────────────

export type Angle =
  | "generic"
  | "fullstack"
  | "ai"
  | "lead"
  | "self-directed"
  | "java"
  | "dotnet"
  | "django"
  | "react-node"
  | "search"
  | "aws"
  | "testing"
  | "observability"
  | "platform";

export type BulletDef = {
  text: string;
  /** Variant slugs whose live data module currently uses this exact phrasing.
   *  "base" = the default God CV at /cv. */
  sources: readonly string[];
  /** Framings this bullet leans into — filter the pool by these when tailoring. */
  angles: readonly Angle[];
};

export type JobDef = {
  key: string;
  company: string;
  shortName: string;
  /** Other company strings seen across variants — reconcile before sending. */
  companyVariants: readonly string[];
  /** Lowercased substrings that identify this employer in an experience entry. */
  match: readonly string[];
  period: string;
  location: string;
  current?: boolean;
  /** Every role title used for this employer across variants. */
  roleTitles: readonly string[];
  /** The menu — every distinct bullet written for this job, deduped. */
  bulletPool: readonly BulletDef[];
};

export const JOBS: readonly JobDef[] = [
  {
    key: "la-vieja",
    company: "La Vieja Adventures",
    shortName: "La Vieja",
    companyVariants: [],
    match: ["la vieja"],
    period: "Apr 2026 – Present",
    location: "Remote · Costa Rica",
    current: true,
    roleTitles: [
      "Senior Full-Stack Engineer",
      "Tech Lead · Full-Stack Engineer",
      "Senior Software Engineer · AI Features",
      "Senior Backend Engineer · Java Platform",
    ],
    bulletPool: [
      {
        text: "Own a cloud-native booking and operations platform end to end as the sole engineer — customer booking plus internal tools for reservations, scheduling, and fulfillment — from architecture through deployment.",
        sources: ["base"],
        angles: ["fullstack", "self-directed", "platform"],
      },
      {
        text: "Build on Spring Boot, FastAPI / Django REST, and Node.js behind React / Next.js on AWS (PostgreSQL / MySQL, Docker, GraphQL / REST), and add LLM-assisted tools — OpenAI and Claude with RAG and tool calling — for reservations, customer communication, and reporting.",
        sources: ["base"],
        angles: ["fullstack", "ai", "aws"],
      },
      {
        text: "Build LLM-powered product features end to end — reservation handling, customer communication, and internal reporting — turning manual workflows into model-driven flows.",
        sources: ["agentic-ai"],
        angles: ["ai"],
      },
      {
        text: "Integrate OpenAI and Anthropic Claude APIs into a Python + TypeScript stack with RAG and tool / function calling, paired with deterministic logic where correctness matters.",
        sources: ["agentic-ai"],
        angles: ["ai"],
      },
      {
        text: "Technical lead on a cloud-native operations platform — own the architecture, set the stack, and make the design calls while staying hands-on across the codebase.",
        sources: ["python-react-lead"],
        angles: ["lead", "platform"],
      },
      {
        text: "Ship Python (FastAPI / Django REST) and React / TypeScript on AWS — Lambda, AppSync, Cognito — with LangGraph and OpenAI agents for reservations and reporting.",
        sources: ["python-react-lead"],
        angles: ["fullstack", "ai", "aws", "lead"],
      },
      {
        text: "Own a cloud-native operations platform end to end — customer booking plus internal tools for reservations, scheduling, and fulfillment — shipping from architecture through deployment with minimal oversight.",
        sources: ["python-react-aws"],
        angles: ["fullstack", "self-directed", "platform"],
      },
      {
        text: "Build on Python (FastAPI / Django REST) and React / TypeScript on AWS serverless, with autonomous LangGraph / OpenAI agents for reservations and reporting.",
        sources: ["python-react-aws"],
        angles: ["fullstack", "ai", "aws"],
      },
      {
        text: "Own a cloud-native operations platform end to end — customer booking and sales plus internal tools for reservations, scheduling, and fulfillment.",
        sources: ["python-dotnet"],
        angles: ["fullstack", "platform"],
      },
      {
        text: "Back it with FastAPI services and a React 19 / Next.js front end on PostgreSQL, containerized with Docker on Azure, with AI-assisted features layered into the product.",
        sources: ["python-dotnet"],
        angles: ["fullstack", "dotnet", "ai"],
      },
      {
        text: "Design and operate Spring Boot services for a cloud-native booking and payments platform, applying Core Java, object-oriented design, and domain-driven boundaries as the sole engineer.",
        sources: ["java"],
        angles: ["java", "self-directed", "platform"],
      },
      {
        text: "Expose REST and gRPC APIs over AWS SNS/SQS and add AI-driven automation for reservations, customer communication, and reporting.",
        sources: ["java"],
        angles: ["java", "ai", "aws"],
      },
      {
        text: "Build a cloud-native booking platform with Node.js, TypeScript, and REST / GraphQL APIs over MongoDB and MySQL, deployed on AWS with Docker.",
        sources: ["elasticsearch"],
        angles: ["react-node", "aws"],
      },
      {
        text: "Add Elasticsearch indexing, Query DSL, and aggregations for platform search and reporting, instrumented with Datadog and Elasticsearch APM.",
        sources: ["elasticsearch"],
        angles: ["search", "observability"],
      },
      {
        text: "Own a cloud-native operations platform end to end — customer-facing booking and sales flows plus internal tools for reservations, scheduling, and fulfillment — from architecture through deployment.",
        sources: ["electric-air"],
        angles: ["fullstack", "self-directed", "platform"],
      },
      {
        text: "Build in Python and TypeScript (Django REST behind React / Next.js on PostgreSQL) and integrate LLM-assisted reservation handling, customer communication, and reporting.",
        sources: ["electric-air"],
        angles: ["django", "ai"],
      },
      {
        text: "Own a booking and operations platform end to end — React / Next.js front end, Node.js and NestJS services, PostgreSQL — from data model through deployment on AWS.",
        sources: ["designli"],
        angles: ["react-node", "fullstack", "aws"],
      },
      {
        text: "Build LLM-backed features for reservations and reporting (RAG plus tool calling) with deterministic checks, guarded by Jest / Supertest and Playwright in CI.",
        sources: ["designli"],
        angles: ["ai", "react-node", "testing"],
      },
    ],
  },

  {
    key: "exq2-mcm",
    company: "EXQ2 · Client: Midland Credit Management (MCM)",
    shortName: "EXQ2 · MCM",
    companyVariants: ["EXQ2 · Client: Midland Credit Management"],
    match: ["exq2", "midland credit"],
    period: "Oct 2025 – Apr 2026",
    location: "Costa Rica",
    roleTitles: ["Cloud Software Engineer"],
    bulletPool: [
      {
        text: "Delivered and operated a cloud-based payment control and management platform for client MCM, owning services end to end from data model through REST and GraphQL APIs on a fast release cadence.",
        sources: ["base"],
        angles: ["fullstack", "platform"],
      },
      {
        text: "Built the backend in Spring Boot with a React / TypeScript front end, deployed and monitored on AWS with Docker; added Elasticsearch-powered search and reporting and LLM-assisted automation over platform data.",
        sources: ["base"],
        angles: ["java", "search", "ai", "aws"],
      },
      {
        text: "Worked as an embedded consulting engineer inside the client's team, influencing technical decisions and setting standards through code and design reviews.",
        sources: ["base"],
        angles: ["lead", "generic"],
      },
      {
        text: "Delivered a cloud-based payment control and management platform for client MCM, owning features from data model through API and UI on a fast release cadence.",
        sources: ["agentic-ai"],
        angles: ["fullstack", "platform"],
      },
      {
        text: "Added LLM-assisted automation over the platform's business data — retrieval (RAG), prompt engineering, and tool / function calling so the model could take actions across services — on a Python + TypeScript / Node stack.",
        sources: ["agentic-ai"],
        angles: ["ai"],
      },
      {
        text: "Ran the surrounding platform: Django REST / Node behind React, PostgreSQL, Docker, deployed on AWS with SQS for event-driven workflows.",
        sources: ["agentic-ai"],
        angles: ["django", "react-node", "aws"],
      },
      {
        text: "Led delivery of a cloud-based payment control and management platform for client MCM — owned the architecture, data model, APIs, and UI, making the technical calls while working independently inside the client's existing repository.",
        sources: ["python-react-lead"],
        angles: ["lead", "self-directed", "platform"],
      },
      {
        text: "Built Python (FastAPI) services and a React / TypeScript front end on AWS serverless — Lambda, API Gateway, Cognito — with infrastructure as CloudFormation / SAM and PostgreSQL for data.",
        sources: ["python-react-lead"],
        angles: ["fullstack", "aws"],
      },
      {
        text: "Set standards through code review and design reviews on a fast release cadence, keeping the codebase clean as scope grew.",
        sources: ["python-react-lead"],
        angles: ["lead", "generic"],
      },
      {
        text: "Delivered a cloud-based payment control and management platform for client MCM — dropped into the client's existing repository, picked up its conventions, and owned the data model, REST APIs, and UI on a fast release cadence with minimal oversight.",
        sources: ["python-react-aws"],
        angles: ["self-directed", "platform"],
      },
      {
        text: "Built Python (FastAPI) services and a React / TypeScript front end on AWS serverless — Lambda, API Gateway, AppSync (GraphQL), Cognito — with infrastructure as code in CloudFormation / SAM and SQLAlchemy over PostgreSQL.",
        sources: ["python-react-aws"],
        angles: ["fullstack", "aws"],
      },
      {
        text: "Took features from initial ask to shipped solution independently, pairing with the client team through code review.",
        sources: ["python-react-aws"],
        angles: ["self-directed", "generic"],
      },
      {
        text: "Built C# / .NET 8 (ASP.NET Core) services and REST APIs for a cloud-based payment control and management platform (client MCM), on PostgreSQL with Entity Framework Core and deployed to Azure.",
        sources: ["python-dotnet"],
        angles: ["dotnet", "platform"],
      },
      {
        text: "Owned features from data model through API and React front end on a fast release cadence, working inside the client's team.",
        sources: ["python-dotnet"],
        angles: ["fullstack", "generic"],
      },
      {
        text: "Ran CI/CD on Azure DevOps and hardened the platform with structured logging and monitoring.",
        sources: ["python-dotnet"],
        angles: ["dotnet", "observability"],
      },
      {
        text: "Delivered and maintained a cloud-based payment control platform for client MCM, owning service boundaries, data models, and JVM performance for reliability at scale.",
        sources: ["java"],
        angles: ["java", "platform"],
      },
      {
        text: "Built Spring Boot microservices and REST / gRPC APIs on AWS, tuned garbage collection and thread pools under load, and held coverage with JUnit.",
        sources: ["java"],
        angles: ["java", "aws", "testing"],
      },
      {
        text: "Owned the build and release path — Maven / Gradle, GitHub Actions CI/CD, Docker on Kubernetes — inside an embedded consulting team, influencing technical decisions across the engineering group.",
        sources: ["java"],
        angles: ["java", "observability", "lead"],
      },
      {
        text: "Delivered and maintained a cloud-based payment control and management platform for client MCM, exposing Node.js REST APIs backed by Elasticsearch-powered search and reporting.",
        sources: ["elasticsearch"],
        angles: ["react-node", "search", "platform"],
      },
      {
        text: "Designed and tuned Elasticsearch indices, Query DSL queries, and aggregations, and managed index lifecycle (ILM) for retention and cost.",
        sources: ["elasticsearch"],
        angles: ["search"],
      },
      {
        text: "Instrumented services with Datadog and Elasticsearch APM for telemetry, distributed tracing, and performance troubleshooting across the platform, as part of an embedded consulting engineering team.",
        sources: ["elasticsearch"],
        angles: ["search", "observability"],
      },
      {
        text: "Delivered a cloud-based payment control and management platform for client MCM, owning features end to end from data model and Django REST / Node APIs through the React front end.",
        sources: ["electric-air"],
        angles: ["django", "react-node", "platform"],
      },
      {
        text: "Automated quoting, scheduling, and internal operations workflows — including AI-assisted flows — that were previously manual, on a fast release cadence.",
        sources: ["electric-air"],
        angles: ["ai", "generic"],
      },
      {
        text: "Worked in an embedded consulting team, collaborating on UX and keeping the codebase maintainable through code review.",
        sources: ["electric-air"],
        angles: ["generic"],
      },
      {
        text: "Delivered a cloud-based payment control and management platform for client MCM, owning features from data model through REST API and React UI on a fast release cadence.",
        sources: ["designli"],
        angles: ["fullstack", "platform"],
      },
      {
        text: "Built Node.js / NestJS services in a clean, layered architecture — business rules kept independent of framework and UI, inbound data validated and sanitized at the API boundary — deployed on AWS with Docker.",
        sources: ["designli"],
        angles: ["react-node", "aws"],
      },
      {
        text: "Added LLM-backed automation over the platform's data (RAG plus tool calling) with deterministic checks where correctness mattered, and held coverage with Jest and Supertest in GitHub Actions CI.",
        sources: ["designli"],
        angles: ["ai", "testing"],
      },
    ],
  },

  {
    key: "wind-river",
    company: "Wind River",
    shortName: "Wind River",
    companyVariants: [],
    match: ["wind river"],
    period: "Sept 2024 – Oct 2025",
    location: "Remote · Costa Rica",
    roleTitles: ["Senior Software Engineer", "Senior Software Engineer · Tech Lead"],
    bulletPool: [
      {
        text: "Designed and operated Spring Boot microservices and event-driven services across AWS and Kubernetes, using Kafka and RabbitMQ for streaming, exposing REST and GraphQL APIs for downstream teams.",
        sources: ["base"],
        angles: ["java", "aws"],
      },
      {
        text: "Built React and Redux Toolkit dashboards with real-time visualization for operational monitoring, and tuned Elasticsearch indices and queries for operational search.",
        sources: ["base"],
        angles: ["react-node", "search"],
      },
      {
        text: "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Datadog, Prometheus, Grafana); led design reviews and mentored engineers, raising consistency across the backend team.",
        sources: ["base"],
        angles: ["observability", "lead"],
      },
      {
        text: "Designed event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
        sources: ["agentic-ai"],
        angles: ["aws", "react-node"],
      },
      {
        text: "Built internal tooling and APIs that automated manual operations work, and prototyped LLM-assisted features for triage and reporting.",
        sources: ["agentic-ai"],
        angles: ["ai", "platform"],
      },
      {
        text: "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Prometheus, Grafana); led design reviews and mentored engineers.",
        sources: ["agentic-ai"],
        angles: ["observability", "lead"],
      },
      {
        text: "Tech lead for event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
        sources: ["python-react-lead"],
        angles: ["lead", "aws", "react-node"],
      },
      {
        text: "Owned architecture and the technical roadmap, ran design reviews, and mentored engineers through code review.",
        sources: ["python-react-lead"],
        angles: ["lead"],
      },
      {
        text: "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Prometheus, Grafana), and set SLAs / SLOs for the backend.",
        sources: ["python-react-lead"],
        angles: ["observability", "lead"],
      },
      {
        text: "Contributed to event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
        sources: ["python-react-aws"],
        angles: ["aws", "react-node"],
      },
      {
        text: "Worked independently inside an established codebase — picked up its conventions quickly, owned features end to end, and contributed heavily to code review.",
        sources: ["python-react-aws"],
        angles: ["self-directed"],
      },
      {
        text: "Strengthened CI/CD (GitHub Actions, Jenkins) and observability (Prometheus, Grafana).",
        sources: ["python-react-aws"],
        angles: ["observability"],
      },
      {
        text: "Built microservices and REST APIs in .NET 8 and Java across Azure and Kubernetes, with React / Redux Toolkit dashboards for real-time operational monitoring.",
        sources: ["python-dotnet"],
        angles: ["dotnet", "java", "react-node"],
      },
      {
        text: "Ran CI/CD on Azure DevOps and GitHub Actions and hardened observability with Prometheus and Grafana.",
        sources: ["python-dotnet"],
        angles: ["dotnet", "observability"],
      },
      {
        text: "Led design reviews and mentored engineers, raising consistency across the backend.",
        sources: ["python-dotnet"],
        angles: ["lead"],
      },
      {
        text: "Designed and operated Spring Boot microservices and event-driven services on AWS and Kubernetes, using Kafka and RabbitMQ for streaming and inter-service messaging with concurrent, high-throughput consumers.",
        sources: ["java"],
        angles: ["java", "aws"],
      },
      {
        text: "Built internal developer-platform capabilities — CI/CD (GitHub Actions, Jenkins), monorepo workflows, feature flags, and observability with Datadog, Prometheus, and Grafana — plus internal tools and APIs that improved developer productivity, and set SLAs/SLOs, coding standards, and performance benchmarks for the backend.",
        sources: ["java"],
        angles: ["java", "platform", "observability"],
      },
      {
        text: "Drove JVM profiling, benchmarking, and garbage-collection tuning to hold latency targets as traffic grew.",
        sources: ["java"],
        angles: ["java"],
      },
      {
        text: "Led system-design reviews, championed Java best practices, and mentored engineers through code review, raising consistency across the team.",
        sources: ["java"],
        angles: ["java", "lead"],
      },
      {
        text: "Designed and maintained Spring Boot microservices and event-driven backend services across AWS, Docker, and Kubernetes environments, exposing REST APIs for downstream integrations.",
        sources: ["elasticsearch"],
        angles: ["java", "aws"],
      },
      {
        text: "Built and tuned Elasticsearch indices, Query DSL queries, and aggregations to power operational search and real-time dashboards.",
        sources: ["elasticsearch"],
        angles: ["search"],
      },
      {
        text: "Owned search relevance and query performance for operational dashboards, reducing query latency through mapping and aggregation tuning.",
        sources: ["elasticsearch"],
        angles: ["search"],
      },
      {
        text: "Strengthened production observability with Datadog, Elasticsearch APM, Prometheus, and Grafana, improving telemetry and incident troubleshooting across distributed systems.",
        sources: ["elasticsearch"],
        angles: ["observability", "search"],
      },
      {
        text: "Designed and shipped backend services and REST APIs plus React and Redux Toolkit dashboards with real-time visualization for operational monitoring and decision support.",
        sources: ["electric-air"],
        angles: ["react-node", "fullstack"],
      },
      {
        text: "Owned projects end to end — architecture, delivery, and production monitoring — and set technical direction across the team.",
        sources: ["electric-air"],
        angles: ["lead", "self-directed"],
      },
      {
        text: "Led design discussions, contributed heavily to code review, and mentored engineers to raise consistency across the team.",
        sources: ["electric-air"],
        angles: ["lead"],
      },
      {
        text: "Strengthened CI/CD with GitHub Actions and Jenkins and production observability with Prometheus and Grafana.",
        sources: ["electric-air"],
        angles: ["observability"],
      },
      {
        text: "Designed scalable event-driven microservices across AWS and Kubernetes, plus React / Redux dashboards with real-time visualization for operational monitoring.",
        sources: ["designli"],
        angles: ["aws", "react-node"],
      },
      {
        text: "Built services in a layered architecture with unit and integration tests, and strengthened CI/CD (GitHub Actions, Jenkins) and automated coverage.",
        sources: ["designli"],
        angles: ["testing", "observability"],
      },
      {
        text: "Led design reviews and mentored engineers, raising consistency across the codebase.",
        sources: ["designli"],
        angles: ["lead"],
      },
    ],
  },

  {
    key: "crss",
    company: "Costa Rica Software Services (CRSS)",
    shortName: "CRSS",
    companyVariants: [],
    match: ["costa rica software services", "crss"],
    period: "Sept 2022 – Jun 2024",
    location: "Costa Rica",
    roleTitles: ["Full-Stack Engineer"],
    bulletPool: [
      {
        text: "Built and maintained Laravel and Node.js applications with React frontends, including Kaptyn, a luxury ride-hailing platform.",
        sources: ["base"],
        angles: ["fullstack", "react-node"],
      },
      {
        text: "Designed RESTful APIs and PostgreSQL / MySQL data models for GPS tracking, payments, and real-time mobility, tuning queries and caching for scale and validating with automated testing.",
        sources: ["base"],
        angles: ["fullstack", "testing"],
      },
      {
        text: "Built full-stack web apps with React front ends — including Kaptyn, a luxury ride-hailing platform — and RESTful APIs over PostgreSQL / MySQL for GPS tracking, payments, and real-time mobility.",
        sources: ["agentic-ai", "python-react-lead", "python-react-aws"],
        angles: ["fullstack", "react-node"],
      },
      {
        text: "Built full-stack web apps with React front ends — including Kaptyn, a luxury ride-hailing platform — and REST APIs over PostgreSQL / MySQL for GPS tracking, payments, and real-time mobility.",
        sources: ["designli"],
        angles: ["fullstack", "react-node"],
      },
      {
        text: "Built and maintained backend services with React front ends, including Kaptyn, a luxury ride-hailing platform.",
        sources: ["java"],
        angles: ["fullstack", "react-node"],
      },
      {
        text: "Designed RESTful APIs, relational data models, and integrations for GPS tracking, payments, and real-time mobility, tuning queries, caching, and connection pools for scale.",
        sources: ["java"],
        angles: ["java", "fullstack"],
      },
      {
        text: "Delivered full-stack web apps with React front ends — including Kaptyn, a luxury ride-hailing platform — over PostgreSQL and MySQL, with REST APIs for GPS, payments, and real-time mobility.",
        sources: ["python-dotnet"],
        angles: ["fullstack", "react-node"],
      },
      {
        text: "Built and maintained Laravel applications with React frontends, including Kaptyn, a luxury ride-hailing platform.",
        sources: ["elasticsearch"],
        angles: ["fullstack", "react-node"],
      },
      {
        text: "Designed RESTful APIs and integrations for GPS tracking, payments, and real-time mobility, backed by SQL and NoSQL data stores.",
        sources: ["elasticsearch"],
        angles: ["fullstack"],
      },
      {
        text: "Optimized API and database performance through SQL tuning and caching, validated with automated testing.",
        sources: ["elasticsearch"],
        angles: ["testing"],
      },
      {
        text: "Built full-stack web applications with React front ends, including Kaptyn, a luxury ride-hailing platform.",
        sources: ["electric-air"],
        angles: ["fullstack", "react-node"],
      },
      {
        text: "Designed RESTful APIs and PostgreSQL / MySQL data models for GPS tracking, payments, and real-time mobility.",
        sources: ["electric-air"],
        angles: ["fullstack"],
      },
      {
        text: "Tuned query and API performance with SQL optimization and caching, validated with automated tests.",
        sources: ["electric-air"],
        angles: ["testing"],
      },
    ],
  },

  {
    key: "intel",
    company: "Intel · via Infosys / Amstek",
    shortName: "Intel",
    companyVariants: [],
    match: ["intel"],
    period: "Feb 2021 – May 2022",
    location: "Costa Rica",
    roleTitles: ["Software Engineer"],
    bulletPool: [
      {
        text: "Built backend integrations and REST APIs for a chemical management system in Node.js and Python, in a client-facing engineering capacity through Infosys (contracted via Amtek).",
        sources: ["base"],
        angles: ["react-node", "generic"],
      },
      {
        text: "Built backend integrations for a chemical management system in Python and Node.js, in a client-facing engineering capacity through Infosys.",
        sources: ["agentic-ai", "python-react-lead"],
        angles: ["react-node", "generic"],
      },
      {
        text: "Built Python and Node.js REST APIs and backend integrations for a chemical management system, in a client-facing engineering capacity through Infosys.",
        sources: ["python-react-aws"],
        angles: ["react-node", "generic"],
      },
      {
        text: "Built Python backend integrations and internal APIs for a chemical management system, in a client-facing engineering capacity through Infosys.",
        sources: ["python-dotnet"],
        angles: ["django", "generic"],
      },
      {
        text: "Delivered backend integrations for a chemical management system using Node.js, in a client-facing engineering capacity through Infosys (contracted via Amtek).",
        sources: ["java"],
        angles: ["react-node", "generic"],
      },
      {
        text: "Delivered backend integrations for a chemical management system using Node.js and REST APIs.",
        sources: ["elasticsearch"],
        angles: ["react-node"],
      },
      {
        text: "Built backend integrations for a chemical management system in Python and Node.js.",
        sources: ["electric-air"],
        angles: ["react-node"],
      },
      {
        text: "Worked in a client-facing engineering capacity through Infosys, contracted via Amtek.",
        sources: ["elasticsearch", "electric-air"],
        angles: ["generic"],
      },
      {
        text: "Built backend integrations for a chemical management system in Node.js and Python, in a client-facing engineering capacity through Infosys.",
        sources: ["designli"],
        angles: ["react-node", "generic"],
      },
    ],
  },

  {
    key: "microvention",
    company: "MicroVention · Terumo",
    shortName: "MicroVention",
    companyVariants: [],
    match: ["microvention"],
    period: "2016 – Feb 2020",
    location: "Costa Rica",
    roleTitles: ["Software Development Engineer I"],
    bulletPool: [
      {
        text: "Built Java, C#, and Python systems supporting FDA-regulated medical-device manufacturing operations and SQL-backed production workflows under FDA and ISO 13485 quality controls.",
        sources: ["base"],
        angles: ["java", "generic"],
      },
      {
        text: "Automated production reporting and equipment-monitoring dashboards using JavaScript and Chart.js.",
        sources: ["base"],
        angles: ["generic"],
      },
      {
        text: "Built Python and Java systems for FDA-regulated medical-device manufacturing and automated production reporting under ISO 13485 quality controls.",
        sources: ["agentic-ai", "python-react-lead", "python-react-aws"],
        angles: ["generic"],
      },
      {
        text: "Built Java and Python systems for FDA-regulated medical-device manufacturing and automated production reporting under ISO 13485 quality controls.",
        sources: ["designli"],
        angles: ["generic"],
      },
      {
        text: "Built C#, Python, and Java systems for FDA-regulated medical-device manufacturing, with automated production reporting under ISO 13485 quality controls.",
        sources: ["python-dotnet"],
        angles: ["dotnet", "generic"],
      },
      {
        text: "Built Core Java systems supporting FDA-regulated medical-device manufacturing, backed by SQL databases, under FDA and ISO 13485 quality controls.",
        sources: ["java"],
        angles: ["java"],
      },
      {
        text: "Automated production reporting and equipment-monitoring dashboards with Java, Python, and JavaScript.",
        sources: ["java"],
        angles: ["java", "generic"],
      },
      {
        text: "Built Java and Python systems supporting FDA-regulated medical-device manufacturing operations and SQL-backed production workflows.",
        sources: ["elasticsearch"],
        angles: ["java", "generic"],
      },
      {
        text: "Automated production reporting and equipment-monitoring dashboards using JavaScript and Chart.js within FDA and ISO 13485 quality environments.",
        sources: ["elasticsearch"],
        angles: ["generic"],
      },
      {
        text: "Built Python and Java systems supporting FDA-regulated medical-device manufacturing operations and SQL-backed production workflows.",
        sources: ["electric-air"],
        angles: ["generic"],
      },
      {
        text: "Automated production reporting and equipment-monitoring dashboards with Python and JavaScript under FDA and ISO 13485 quality controls.",
        sources: ["electric-air"],
        angles: ["generic"],
      },
    ],
  },

  {
    key: "imagineercx",
    company: "ImagineerCX",
    shortName: "ImagineerCX",
    companyVariants: [],
    match: ["imagineercx"],
    period: "2015 – 2016",
    location: "Costa Rica",
    roleTitles: ["Technician II"],
    bulletPool: [
      {
        text: "Developed customer-facing web applications using PHP, JavaScript, and MySQL.",
        sources: ["base", "java", "elasticsearch", "electric-air"],
        angles: ["fullstack", "generic"],
      },
      {
        text: "Improved frontend rendering and backend performance across Agile development cycles.",
        sources: ["base", "java", "elasticsearch", "electric-air"],
        angles: ["generic"],
      },
    ],
  },
];

export function jobByKey(key: string): JobDef | undefined {
  return JOBS.find((j) => j.key === key);
}

/** Resolve an experience entry's `company` string to a canonical job key. */
export function resolveJobKey(company: string): string | undefined {
  const c = company.toLowerCase();
  for (const job of JOBS) {
    if (job.company.toLowerCase() === c) return job.key;
    if (job.companyVariants.some((v) => v.toLowerCase() === c)) return job.key;
    if (job.match.some((m) => c.includes(m))) return job.key;
  }
  return undefined;
}
