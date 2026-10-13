// ─────────────────────────────────────────────────────────────
// Job-description keyword audit.
//
// Paste a JD, compare it against a résumé variant's text corpus, and surface
// the skills / tools the JD asks for that the résumé does NOT mention.
//
// Matching is dictionary-driven (curated tech terms + aliases) so generic
// English words don't create noise. A lightweight second pass lists other
// repeated JD terms the résumé misses, in case the dictionary is incomplete.
// ─────────────────────────────────────────────────────────────

import type { CvData } from "./types";

export type DictCategory =
  | "Languages"
  | "Backend & APIs"
  | "Frontend"
  | "Cloud"
  | "DevOps & Infra"
  | "Data & Search"
  | "Testing"
  | "Practices"
  | "AI"
  | "Domain";

type DictEntry = {
  label: string;
  category: DictCategory;
  aliases?: string[];
  /** Override the strings used for matching (default: [label, ...aliases]).
   *  Use when the label itself is an ambiguous English word. */
  match?: string[];
};

export const SKILL_DICTIONARY: DictEntry[] = [
  // Languages
  { label: "JavaScript", category: "Languages", aliases: ["js", "ecmascript"] },
  { label: "TypeScript", category: "Languages", aliases: ["ts"] },
  { label: "Java", category: "Languages" },
  { label: "Python", category: "Languages" },
  { label: "PHP", category: "Languages" },
  // "go" alone collides with the English word — match only the unambiguous forms.
  { label: "Go", category: "Languages", aliases: ["golang"], match: ["golang", "go lang"] },
  { label: "C#", category: "Languages", aliases: ["csharp", "dotnet c#"] },
  { label: "C++", category: "Languages", aliases: ["cpp"] },
  { label: "Ruby", category: "Languages" },
  { label: "Kotlin", category: "Languages" },
  { label: "Scala", category: "Languages" },
  { label: "Rust", category: "Languages" },
  { label: "SQL", category: "Languages" },
  { label: "Bash", category: "Languages", aliases: ["shell scripting", "shell"] },

  // Backend & APIs
  { label: "Spring Boot", category: "Backend & APIs", aliases: ["spring"] },
  { label: "Node.js", category: "Backend & APIs", aliases: ["node", "nodejs"] },
  { label: "Express", category: "Backend & APIs", aliases: ["expressjs"] },
  { label: "NestJS", category: "Backend & APIs", aliases: ["nest.js"] },
  { label: "Laravel", category: "Backend & APIs" },
  { label: "Django", category: "Backend & APIs" },
  { label: "Django REST Framework", category: "Backend & APIs", aliases: ["drf", "django-rest-framework"] },
  { label: "Celery", category: "Backend & APIs" },
  { label: "Flask", category: "Backend & APIs" },
  { label: "FastAPI", category: "Backend & APIs" },
  { label: ".NET", category: "Backend & APIs", aliases: ["asp.net", "asp.net core", ".net core", ".net 8", "dotnet"] },
  { label: "Entity Framework", category: "Backend & APIs", aliases: ["ef core", "entity framework core"] },
  { label: "Dapper", category: "Backend & APIs" },
  { label: "SignalR", category: "Backend & APIs" },
  { label: "Rails", category: "Backend & APIs", aliases: ["ruby on rails"] },
  { label: "REST", category: "Backend & APIs", aliases: ["restful", "rest api", "rest apis"] },
  { label: "GraphQL", category: "Backend & APIs" },
  { label: "gRPC", category: "Backend & APIs" },
  { label: "Microservices", category: "Backend & APIs", aliases: ["micro-services"] },
  { label: "Event-driven", category: "Backend & APIs", aliases: ["event driven", "eventing"] },
  { label: "Kafka", category: "Backend & APIs" },
  { label: "RabbitMQ", category: "Backend & APIs" },
  { label: "WebSockets", category: "Backend & APIs", aliases: ["websocket"] },
  { label: "Hibernate", category: "Backend & APIs" },
  { label: "JPA", category: "Backend & APIs" },
  { label: "ORM", category: "Backend & APIs", aliases: ["eloquent", "prisma", "typeorm", "sequelize"] },
  { label: "OpenAPI", category: "Backend & APIs", aliases: ["swagger"] },
  { label: "API design", category: "Backend & APIs", aliases: ["api-first"] },

  // Frontend
  { label: "React", category: "Frontend", aliases: ["react.js", "reactjs"] },
  { label: "Next.js", category: "Frontend", aliases: ["nextjs"] },
  { label: "Remix", category: "Frontend", aliases: ["remix.run", "react router"] },
  { label: "Redux", category: "Frontend", aliases: ["redux toolkit", "rtk"] },
  { label: "Vue", category: "Frontend", aliases: ["vue.js", "vuejs"] },
  { label: "Angular", category: "Frontend" },
  { label: "Svelte", category: "Frontend", aliases: ["sveltekit"] },
  { label: "Tailwind CSS", category: "Frontend", aliases: ["tailwind"] },
  { label: "HTML", category: "Frontend", aliases: ["html5"] },
  { label: "CSS", category: "Frontend", aliases: ["css3"] },
  { label: "Sass", category: "Frontend", aliases: ["scss"] },
  { label: "Webpack", category: "Frontend" },
  { label: "Vite", category: "Frontend" },
  { label: "React Native", category: "Frontend" },
  { label: "Blazor", category: "Frontend" },

  // Cloud
  { label: "AWS", category: "Cloud", aliases: ["amazon web services"] },
  { label: "GCP", category: "Cloud", aliases: ["google cloud", "google cloud platform"] },
  { label: "Azure", category: "Cloud", aliases: ["microsoft azure"] },
  { label: "Azure Functions", category: "Cloud" },
  { label: "App Service", category: "Cloud", aliases: ["azure app service"] },
  { label: "AKS", category: "Cloud", aliases: ["azure kubernetes service"] },
  { label: "Service Bus", category: "Cloud", aliases: ["azure service bus"] },
  { label: "Lambda", category: "Cloud", aliases: ["aws lambda"] },
  { label: "EC2", category: "Cloud" },
  { label: "S3", category: "Cloud" },
  { label: "RDS", category: "Cloud" },
  { label: "DynamoDB", category: "Cloud", aliases: ["dynamo"] },
  { label: "ECS", category: "Cloud" },
  { label: "EKS", category: "Cloud" },
  { label: "Fargate", category: "Cloud" },
  { label: "CloudFormation", category: "Cloud" },
  { label: "CDK", category: "Cloud", aliases: ["aws cdk"] },
  {
    label: "AWS SAM",
    category: "Cloud",
    match: ["aws sam", "cloudformation/sam", "cloudformation / sam", "sam template", "sam templates", "sam cli", "serverless application model"],
  },
  { label: "AppSync", category: "Cloud", aliases: ["aws appsync"] },
  { label: "Cognito", category: "Cloud", aliases: ["aws cognito", "amazon cognito"] },
  { label: "API Gateway", category: "Cloud" },
  { label: "SQS", category: "Cloud" },
  { label: "SNS", category: "Cloud" },
  { label: "Serverless", category: "Cloud" },
  // "render" alone collides with the English word — match only the unambiguous PaaS forms.
  { label: "Render", category: "Cloud", match: ["render.com", "on render", "render hosting", "deployed to render", "render paas"] },

  // DevOps & Infra
  { label: "Docker", category: "DevOps & Infra", aliases: ["containers", "containerization"] },
  { label: "Kubernetes", category: "DevOps & Infra", aliases: ["k8s"] },
  { label: "Terraform", category: "DevOps & Infra", aliases: ["iac", "infrastructure as code"] },
  { label: "Ansible", category: "DevOps & Infra" },
  { label: "Helm", category: "DevOps & Infra" },
  { label: "Jenkins", category: "DevOps & Infra" },
  { label: "GitHub Actions", category: "DevOps & Infra", aliases: ["gh actions"] },
  { label: "GitLab CI", category: "DevOps & Infra", aliases: ["gitlab ci/cd"] },
  { label: "Azure DevOps", category: "DevOps & Infra", aliases: ["azure pipelines", "azure devops pipelines"] },
  { label: "CircleCI", category: "DevOps & Infra" },
  { label: "CI/CD", category: "DevOps & Infra", aliases: ["ci cd", "continuous integration", "continuous delivery", "continuous deployment"] },
  { label: "Nginx", category: "DevOps & Infra" },
  { label: "Linux", category: "DevOps & Infra", aliases: ["unix"] },
  { label: "Prometheus", category: "DevOps & Infra" },
  { label: "Grafana", category: "DevOps & Infra" },
  { label: "Datadog", category: "DevOps & Infra" },
  { label: "OpenTelemetry", category: "DevOps & Infra", aliases: ["otel"] },
  { label: "APM", category: "DevOps & Infra", aliases: ["application performance monitoring"] },
  { label: "Observability", category: "DevOps & Infra", aliases: ["monitoring", "telemetry"] },

  // Data & Search
  { label: "PostgreSQL", category: "Data & Search", aliases: ["postgres", "psql"] },
  { label: "MySQL", category: "Data & Search" },
  { label: "MongoDB", category: "Data & Search", aliases: ["mongo"] },
  { label: "Redis", category: "Data & Search" },
  { label: "Elasticsearch", category: "Data & Search", aliases: ["elastic search", "elastic stack", "elk"] },
  { label: "OpenSearch", category: "Data & Search" },
  { label: "Kibana", category: "Data & Search" },
  { label: "Cassandra", category: "Data & Search" },
  { label: "SQL Server", category: "Data & Search", aliases: ["mssql", "sqlserver", "t-sql", "tsql"] },
  { label: "Cosmos DB", category: "Data & Search", aliases: ["cosmosdb", "azure cosmos"] },
  { label: "Snowflake", category: "Data & Search" },
  { label: "BigQuery", category: "Data & Search" },
  { label: "Spark", category: "Data & Search", aliases: ["apache spark"] },
  { label: "ETL", category: "Data & Search", aliases: ["elt"] },
  { label: "Query DSL", category: "Data & Search" },
  { label: "Aggregations", category: "Data & Search" },
  { label: "Data modeling", category: "Data & Search", aliases: ["data modelling", "schema design"] },
  { label: "Caching", category: "Data & Search", aliases: ["cache"] },

  // Testing
  { label: "Jest", category: "Testing" },
  { label: "Mocha", category: "Testing" },
  { label: "Pest", category: "Testing" },
  { label: "PHPUnit", category: "Testing" },
  { label: "JUnit", category: "Testing" },
  { label: "xUnit", category: "Testing", aliases: ["nunit"] },
  { label: "Playwright", category: "Testing" },
  { label: "Cypress", category: "Testing" },
  { label: "Selenium", category: "Testing" },
  { label: "TDD", category: "Testing", aliases: ["test-driven development", "test driven development"] },
  { label: "BDD", category: "Testing" },
  { label: "Unit testing", category: "Testing", aliases: ["unit tests"] },
  { label: "Integration testing", category: "Testing", aliases: ["integration tests"] },
  { label: "E2E testing", category: "Testing", aliases: ["end-to-end testing", "e2e"] },

  // Practices
  { label: "Agile", category: "Practices" },
  { label: "Scrum", category: "Practices" },
  { label: "Kanban", category: "Practices" },
  { label: "DDD", category: "Practices", aliases: ["domain-driven design", "domain driven design"] },
  { label: "System design", category: "Practices", aliases: ["software architecture", "architecture"] },
  { label: "Distributed systems", category: "Practices" },
  { label: "OOP", category: "Practices", aliases: ["object-oriented"] },
  { label: "Design patterns", category: "Practices" },
  { label: "SOLID", category: "Practices" },
  { label: "Code review", category: "Practices", aliases: ["code reviews"] },
  { label: "Mentoring", category: "Practices", aliases: ["mentorship", "mentor"] },
  { label: "Scalability", category: "Practices", aliases: ["scalable", "scaling"] },
  { label: "Performance tuning", category: "Practices", aliases: ["performance optimization", "performance optimisation"] },
  { label: "Security", category: "Practices", aliases: ["secure coding"] },
  { label: "OAuth", category: "Practices", aliases: ["oauth2", "oidc"] },
  { label: "JWT", category: "Practices" },
  { label: "OWASP", category: "Practices" },
  { label: "Accessibility", category: "Practices", aliases: ["a11y", "wcag"] },
  { label: "SEO", category: "Practices" },
  { label: "i18n", category: "Practices", aliases: ["internationalization", "localization"] },
  { label: "Message queues", category: "Practices", aliases: ["message queue", "pub/sub", "pubsub"] },

  // AI
  { label: "OpenAI", category: "AI", aliases: ["gpt-4", "gpt-4o", "gpt4"] },
  { label: "Anthropic Claude", category: "AI", aliases: ["anthropic", "claude"] },
  { label: "Gemini", category: "AI", aliases: ["google gemini"] },
  { label: "LLM", category: "AI", aliases: ["large language model", "large language models"] },
  { label: "GenAI", category: "AI", aliases: ["generative ai"] },
  { label: "Prompt engineering", category: "AI", aliases: ["prompting", "prompt design"] },
  { label: "RAG", category: "AI", aliases: ["retrieval augmented generation", "retrieval-augmented generation"] },
  { label: "AI agents", category: "AI", match: ["ai agent", "ai agents", "agentic", "multi-agent", "multi agent", "autonomous agent", "autonomous agents", "agent framework"] },
  { label: "Tool calling", category: "AI", aliases: ["function calling", "tool use", "tool-use"] },
  { label: "MCP", category: "AI", aliases: ["model context protocol"] },
  { label: "LangChain", category: "AI" },
  { label: "LangGraph", category: "AI" },
  { label: "LlamaIndex", category: "AI", aliases: ["llama index"] },
  { label: "Vertex AI", category: "AI", aliases: ["google vertex", "vertex"] },
  { label: "MLOps", category: "AI", aliases: ["ml ops", "llmops", "llm ops"] },
  { label: "Fine-tuning", category: "AI", aliases: ["fine tuning", "finetuning"] },
  { label: "Semantic search", category: "AI", aliases: ["vector search", "similarity search"] },
  { label: "Hugging Face", category: "AI", aliases: ["huggingface", "transformers"] },
  { label: "PyTorch", category: "AI", aliases: ["torch"] },
  { label: "TensorFlow", category: "AI" },
  { label: "Guardrails", category: "AI", match: ["guardrail", "guardrails"] },
  { label: "Evals", category: "AI", match: ["evals", "llm evaluation", "model evaluation", "eval harness"] },
  { label: "GitHub Copilot", category: "AI", aliases: ["copilot"] },
  { label: "Machine learning", category: "AI", aliases: ["ml"] },
  { label: "Vector database", category: "AI", aliases: ["vector db", "embeddings", "pgvector", "pinecone", "weaviate", "qdrant", "chromadb", "faiss"] },

  // Domain
  { label: "FDA", category: "Domain" },
  { label: "ISO 13485", category: "Domain" },
  { label: "HIPAA", category: "Domain" },
  { label: "PCI DSS", category: "Domain", aliases: ["pci-dss", "pci compliance"] },
  { label: "Fintech", category: "Domain", aliases: ["financial services"] },
  { label: "Payments", category: "Domain", aliases: ["payment processing", "billing"] },
  { label: "Healthcare", category: "Domain", aliases: ["healthtech", "medical device", "medical devices"] },
  { label: "E-commerce", category: "Domain", aliases: ["ecommerce"] },
  {
    label: "Climate tech",
    category: "Domain",
    aliases: ["cleantech", "clean tech", "climate technology", "home electrification", "electrification", "built environment", "energy transition"],
  },
];

// ── matching ────────────────────────────────────────────────

const REGEX_CACHE = new Map<string, RegExp>();

/** Word-ish boundary match that tolerates space / hyphen / slash / underscore
 *  variance inside multi-word terms and keeps `.`, `+`, `#` significant. */
function patternFor(term: string): RegExp {
  const cached = REGEX_CACHE.get(term);
  if (cached) return cached;
  const body = term
    .trim()
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter(Boolean)
    .map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s\\-_/]+");
  const re = new RegExp(`(^|[^a-z0-9+#.])(${body})([^a-z0-9+#]|$)`, "i");
  REGEX_CACHE.set(term, re);
  return re;
}

function anyPresent(text: string, variants: string[]): boolean {
  return variants.some((v) => patternFor(v).test(text));
}

// ── corpus ──────────────────────────────────────────────────

/** Everything an ATS / reader would scan on a variant, flattened + lowercased. */
export function buildCorpus(cv: CvData): string {
  const parts: string[] = [cv.personalInfo.title];
  for (const para of cv.summary) for (const seg of para) parts.push(seg.text);
  for (const h of cv.highlights ?? []) parts.push(h.title, h.detail);
  for (const group of [...cv.primarySkills, ...cv.secondarySkills]) {
    parts.push(group.label, ...group.items);
  }
  for (const job of cv.experience) {
    parts.push(job.role, job.company, ...job.bullets);
  }
  return parts.join("  \n  ").toLowerCase();
}

// ── extra (non-dictionary) terms ────────────────────────────

const STOPWORDS = new Set<string>(
  (
    "the and for with you our your will are have has had this that from was were they " +
    "their them but not all any can may must should would could who what when where which " +
    "into out over under more most than then some such been being about across also per via etc " +
    "using use used uses work works working team teams role roles job jobs candidate candidates " +
    "experience years year strong ability able help helps join joining looking seeking ideal plus " +
    "nice must responsibilities requirements qualifications skills skill knowledge understanding " +
    "familiarity proficiency proficient hands environment environments systems system software " +
    "engineer engineers engineering developer developers development develop building builds " +
    "designing designed code coding technical technologies technology solutions solution product " +
    "products business company companies opportunity benefits salary remote hybrid onsite office " +
    "time contract position positions apply application please including include includes well good " +
    "great excellent high quality best practices practice new other others within while both each " +
    "one two three four five many various related relevant required require requires preferred bonus " +
    "degree computer science field equivalent communication communicate collaborate collaboration " +
    "partner partners stakeholders functional paced dynamic passionate starter detail oriented " +
    "problem solving mindset culture values mission impact scale world global customers customer " +
    "users user data web applications application services service level senior junior lead staff " +
    "principal manager management working ownership own end deep across build make made get set run " +
    "like want need needs day days week weeks month months you'll we're we'll our who're don't " +
    "design designs designing designed implement implementing implementation maintain maintaining " +
    "ensure ensuring deliver delivering delivery drive driving support supporting create creating " +
    "as at be by in is it of on or to up we he she his her its"
  ).split(/\s+/),
);

export type ExtraTerm = { term: string; count: number };

function extraTerms(jd: string, corpus: string, known: Set<string>): ExtraTerm[] {
  const counts = new Map<string, number>();
  const tokens = jd.toLowerCase().match(/[a-z][a-z0-9]*(?:[.+#][a-z0-9]+)*/g) ?? [];
  for (const raw of tokens) {
    const w = raw.replace(/[.]+$/, "");
    if (w.length < 3 || /^\d+$/.test(w)) continue;
    if (STOPWORDS.has(w) || known.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const out: ExtraTerm[] = [];
  for (const [term, count] of counts) {
    if (count < 2) continue;
    if (patternFor(term).test(corpus)) continue;
    out.push({ term, count });
  }
  return out.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term)).slice(0, 12);
}

// ── public API ──────────────────────────────────────────────

export type DictHit = { label: string; category: DictCategory };

export type AuditResult = {
  covered: DictHit[];
  missing: DictHit[];
  extra: ExtraTerm[];
  /** 0–100: dictionary terms in the JD that the résumé also mentions. */
  score: number;
  matched: number;
  total: number;
};

export function auditJd(jd: string, corpus: string): AuditResult {
  const covered: DictHit[] = [];
  const missing: DictHit[] = [];
  const known = new Set<string>();

  for (const entry of SKILL_DICTIONARY) {
    const variants = entry.match ?? [entry.label, ...(entry.aliases ?? [])];
    if (!anyPresent(jd, variants)) continue;
    known.add(entry.label.toLowerCase());
    for (const a of entry.aliases ?? []) known.add(a.toLowerCase());
    (anyPresent(corpus, variants) ? covered : missing).push({
      label: entry.label,
      category: entry.category,
    });
  }

  const total = covered.length + missing.length;
  const score = total === 0 ? 0 : Math.round((covered.length / total) * 100);

  return {
    covered,
    missing,
    extra: extraTerms(jd, corpus, known),
    score,
    matched: covered.length,
    total,
  };
}

export const DICT_CATEGORY_ORDER: DictCategory[] = [
  "Languages",
  "Backend & APIs",
  "Frontend",
  "Cloud",
  "DevOps & Infra",
  "Data & Search",
  "Testing",
  "Practices",
  "AI",
  "Domain",
];
