// =============================================================================
// FORGE - Advanced Skill Extraction + Intelligent Weighting + JD Critique
// =============================================================================

export type SkillConfidence = "high" | "medium" | "low"
export type SkillCategory = "frontend" | "backend" | "infra" | "data" | "process" | "soft" | "design" | "product" | "ai"
export type SkillImportance = "core" | "required" | "preferred" | "bonus"

export type ExtractedSkill = {
  name: string
  weight: number
  confidence: SkillConfidence
  category?: SkillCategory
  importance?: SkillImportance
  yearsRequired?: number
  context?: string // Why this weight
  isRequired?: boolean // Non-negotiable skill (affects gate, not just ranking)
}

export type JDCritiqueIssue = {
  type: "vague" | "missing" | "bias" | "unrealistic" | "contradiction"
  text: string
  severity: "low" | "medium" | "high"
}

export type JDCritique = {
  score: number // 0-100
  issues: JDCritiqueIssue[]
  suggestions: string[]
}

// =============================================================================
// ENHANCED SKILL DICTIONARY with relationships, prerequisites, and weights
// =============================================================================

type SkillEntry = {
  name: string
  aliases: string[]
  category: SkillCategory
  baseWeight: number // 1-10 base importance
  prerequisites?: string[] // Skills that often come with this
  related?: string[] // Skills that boost each other
  antiPatterns?: string[] // Unusual to require both
  modernSince?: number // Year skill became relevant (for unrealistic YoE detection)
}

export const SKILL_DICTIONARY: SkillEntry[] = [
  // === FRONTEND ===
  {
    name: "React",
    aliases: ["react", "reactjs", "react.js", "react js"],
    category: "frontend",
    baseWeight: 8,
    prerequisites: ["JavaScript"],
    related: ["TypeScript", "Next.js", "Redux", "React Query"],
    modernSince: 2015,
  },
  {
    name: "Next.js",
    aliases: ["next.js", "nextjs", "next"],
    category: "frontend",
    baseWeight: 7,
    prerequisites: ["React"],
    related: ["TypeScript", "Vercel", "React"],
    modernSince: 2016,
  },
  {
    name: "TypeScript",
    aliases: ["typescript", "ts", "typed javascript"],
    category: "frontend",
    baseWeight: 7,
    related: ["JavaScript", "React", "Node.js"],
    modernSince: 2014,
  },
  {
    name: "JavaScript",
    aliases: ["javascript", "js", "es6", "es2015", "ecmascript", "vanilla js"],
    category: "frontend",
    baseWeight: 6,
    related: ["TypeScript", "React", "Node.js"],
  },
  {
    name: "Vue.js",
    aliases: ["vue", "vuejs", "vue.js", "vue 3", "nuxt", "nuxtjs", "nuxt.js"],
    category: "frontend",
    baseWeight: 7,
    prerequisites: ["JavaScript"],
    related: ["TypeScript", "Vuex", "Pinia"],
    antiPatterns: ["React", "Angular"],
    modernSince: 2015,
  },
  {
    name: "Angular",
    aliases: ["angular", "angularjs", "angular 2", "angular 15", "angular 16", "angular 17"],
    category: "frontend",
    baseWeight: 7,
    prerequisites: ["TypeScript"],
    related: ["RxJS", "NgRx"],
    antiPatterns: ["React", "Vue.js"],
    modernSince: 2016,
  },
  {
    name: "Svelte",
    aliases: ["svelte", "sveltekit", "svelte kit"],
    category: "frontend",
    baseWeight: 6,
    prerequisites: ["JavaScript"],
    antiPatterns: ["React", "Vue.js", "Angular"],
    modernSince: 2019,
  },
  {
    name: "HTML/CSS",
    aliases: ["html", "css", "html5", "css3", "semantic html"],
    category: "frontend",
    baseWeight: 4,
    related: ["Tailwind CSS", "SCSS"],
  },
  {
    name: "Tailwind CSS",
    aliases: ["tailwind", "tailwindcss", "tailwind css"],
    category: "frontend",
    baseWeight: 5,
    prerequisites: ["HTML/CSS"],
    related: ["React", "Next.js"],
    modernSince: 2019,
  },
  {
    name: "SCSS/Sass",
    aliases: ["scss", "sass", "less", "css preprocessor"],
    category: "frontend",
    baseWeight: 4,
    prerequisites: ["HTML/CSS"],
  },
  {
    name: "Redux",
    aliases: ["redux", "redux toolkit", "rtk", "react-redux"],
    category: "frontend",
    baseWeight: 5,
    prerequisites: ["React"],
    modernSince: 2015,
  },
  {
    name: "React Query",
    aliases: ["react query", "tanstack query", "@tanstack/react-query", "react-query"],
    category: "frontend",
    baseWeight: 5,
    prerequisites: ["React"],
    modernSince: 2020,
  },
  {
    name: "Zustand",
    aliases: ["zustand"],
    category: "frontend",
    baseWeight: 4,
    prerequisites: ["React"],
    modernSince: 2021,
  },
  {
    name: "Webpack",
    aliases: ["webpack"],
    category: "frontend",
    baseWeight: 4,
    related: ["Vite", "esbuild"],
  },
  {
    name: "Vite",
    aliases: ["vite", "vitejs"],
    category: "frontend",
    baseWeight: 4,
    related: ["Webpack", "esbuild"],
    modernSince: 2020,
  },

  // === BACKEND ===
  {
    name: "Node.js",
    aliases: ["node", "nodejs", "node.js", "express", "expressjs", "express.js", "fastify", "koa"],
    category: "backend",
    baseWeight: 7,
    prerequisites: ["JavaScript"],
    related: ["TypeScript", "REST API", "GraphQL"],
  },
  {
    name: "NestJS",
    aliases: ["nestjs", "nest.js", "nest"],
    category: "backend",
    baseWeight: 6,
    prerequisites: ["Node.js", "TypeScript"],
    modernSince: 2018,
  },
  {
    name: "Python",
    aliases: ["python", "python3", "py"],
    category: "backend",
    baseWeight: 7,
    related: ["Django", "FastAPI", "Flask", "Machine Learning"],
  },
  {
    name: "Django",
    aliases: ["django", "django rest framework", "drf"],
    category: "backend",
    baseWeight: 6,
    prerequisites: ["Python"],
  },
  {
    name: "FastAPI",
    aliases: ["fastapi", "fast api"],
    category: "backend",
    baseWeight: 6,
    prerequisites: ["Python"],
    modernSince: 2019,
  },
  {
    name: "Flask",
    aliases: ["flask"],
    category: "backend",
    baseWeight: 5,
    prerequisites: ["Python"],
  },
  {
    name: "Go",
    aliases: ["go", "golang", "go lang"],
    category: "backend",
    baseWeight: 7,
    related: ["Microservices", "Kubernetes"],
  },
  {
    name: "Rust",
    aliases: ["rust", "rustlang"],
    category: "backend",
    baseWeight: 6,
    related: ["Systems Programming", "WebAssembly"],
    modernSince: 2015,
  },
  {
    name: "Java",
    aliases: ["java", "jvm", "jdk"],
    category: "backend",
    baseWeight: 7,
    related: ["Spring", "Kotlin"],
  },
  {
    name: "Spring",
    aliases: ["spring", "spring boot", "springboot", "spring framework", "spring mvc"],
    category: "backend",
    baseWeight: 6,
    prerequisites: ["Java"],
  },
  {
    name: "Kotlin",
    aliases: ["kotlin"],
    category: "backend",
    baseWeight: 6,
    related: ["Java", "Android"],
    modernSince: 2016,
  },
  {
    name: "C#",
    aliases: ["c#", "csharp", "c sharp"],
    category: "backend",
    baseWeight: 6,
    related: [".NET"],
  },
  {
    name: ".NET",
    aliases: [".net", "dotnet", "asp.net", "asp.net core", ".net core", ".net 6", ".net 7", ".net 8"],
    category: "backend",
    baseWeight: 6,
    prerequisites: ["C#"],
  },
  {
    name: "Ruby",
    aliases: ["ruby"],
    category: "backend",
    baseWeight: 5,
    related: ["Rails"],
  },
  {
    name: "Rails",
    aliases: ["rails", "ruby on rails", "ror"],
    category: "backend",
    baseWeight: 6,
    prerequisites: ["Ruby"],
  },
  {
    name: "PHP",
    aliases: ["php", "php8"],
    category: "backend",
    baseWeight: 5,
    related: ["Laravel"],
  },
  {
    name: "Laravel",
    aliases: ["laravel"],
    category: "backend",
    baseWeight: 5,
    prerequisites: ["PHP"],
  },
  {
    name: "Elixir",
    aliases: ["elixir", "phoenix", "phoenix framework"],
    category: "backend",
    baseWeight: 5,
    modernSince: 2014,
  },
  {
    name: "GraphQL",
    aliases: ["graphql", "graph ql", "apollo", "apollo graphql", "hasura", "relay"],
    category: "backend",
    baseWeight: 6,
    related: ["React", "Node.js"],
    modernSince: 2015,
  },
  {
    name: "REST API",
    aliases: ["rest", "restful", "rest api", "restful api", "api design", "openapi", "swagger"],
    category: "backend",
    baseWeight: 5,
    related: ["Node.js", "Python", "Go"],
  },
  {
    name: "gRPC",
    aliases: ["grpc", "protocol buffers", "protobuf"],
    category: "backend",
    baseWeight: 5,
    related: ["Microservices", "Go"],
    modernSince: 2016,
  },
  {
    name: "WebSockets",
    aliases: ["websocket", "websockets", "socket.io", "ws", "real-time"],
    category: "backend",
    baseWeight: 4,
  },
  {
    name: "Microservices",
    aliases: ["microservices", "microservice", "service-oriented", "soa", "distributed systems"],
    category: "backend",
    baseWeight: 6,
    related: ["Kubernetes", "Docker", "Go"],
  },

  // === DATA ===
  {
    name: "SQL",
    aliases: ["sql", "relational database", "rdbms"],
    category: "data",
    baseWeight: 6,
    related: ["PostgreSQL", "MySQL"],
  },
  {
    name: "PostgreSQL",
    aliases: ["postgres", "postgresql", "psql", "pg"],
    category: "data",
    baseWeight: 6,
    prerequisites: ["SQL"],
  },
  {
    name: "MySQL",
    aliases: ["mysql", "mariadb"],
    category: "data",
    baseWeight: 5,
    prerequisites: ["SQL"],
  },
  {
    name: "MongoDB",
    aliases: ["mongodb", "mongo", "mongoose"],
    category: "data",
    baseWeight: 5,
    related: ["NoSQL"],
  },
  {
    name: "Redis",
    aliases: ["redis", "redis cache", "redis queue"],
    category: "data",
    baseWeight: 5,
    related: ["Caching"],
  },
  {
    name: "Elasticsearch",
    aliases: ["elasticsearch", "elastic", "elastic search", "opensearch", "elk"],
    category: "data",
    baseWeight: 5,
  },
  {
    name: "DynamoDB",
    aliases: ["dynamodb", "dynamo"],
    category: "data",
    baseWeight: 5,
    prerequisites: ["AWS"],
    modernSince: 2012,
  },
  {
    name: "Cassandra",
    aliases: ["cassandra", "apache cassandra", "scylla"],
    category: "data",
    baseWeight: 5,
  },
  {
    name: "Prisma",
    aliases: ["prisma", "prisma orm"],
    category: "data",
    baseWeight: 4,
    prerequisites: ["TypeScript"],
    modernSince: 2019,
  },
  {
    name: "Drizzle",
    aliases: ["drizzle", "drizzle orm"],
    category: "data",
    baseWeight: 4,
    prerequisites: ["TypeScript"],
    modernSince: 2022,
  },

  // === INFRASTRUCTURE ===
  {
    name: "AWS",
    aliases: [
      "aws",
      "amazon web services",
      "ec2",
      "s3",
      "lambda",
      "cloudfront",
      "iam",
      "sqs",
      "sns",
      "rds",
      "ecs",
      "eks",
    ],
    category: "infra",
    baseWeight: 7,
    related: ["Docker", "Kubernetes", "Terraform"],
  },
  {
    name: "GCP",
    aliases: ["gcp", "google cloud", "google cloud platform", "bigquery", "cloud run", "gke", "cloud functions"],
    category: "infra",
    baseWeight: 6,
    related: ["Kubernetes"],
    antiPatterns: ["AWS", "Azure"],
  },
  {
    name: "Azure",
    aliases: ["azure", "microsoft azure", "azure devops", "azure functions"],
    category: "infra",
    baseWeight: 6,
    antiPatterns: ["AWS", "GCP"],
  },
  {
    name: "Vercel",
    aliases: ["vercel"],
    category: "infra",
    baseWeight: 4,
    prerequisites: ["Next.js"],
    modernSince: 2020,
  },
  {
    name: "Docker",
    aliases: ["docker", "container", "containers", "containerization", "dockerfile"],
    category: "infra",
    baseWeight: 6,
    related: ["Kubernetes"],
  },
  {
    name: "Kubernetes",
    aliases: ["kubernetes", "k8s", "helm", "kubectl", "eks", "gke", "aks"],
    category: "infra",
    baseWeight: 7,
    prerequisites: ["Docker"],
    related: ["Docker", "Microservices"],
  },
  {
    name: "CI/CD",
    aliases: [
      "ci/cd",
      "cicd",
      "ci cd",
      "continuous integration",
      "continuous deployment",
      "continuous delivery",
      "github actions",
      "gitlab ci",
      "jenkins",
      "circleci",
      "travis",
      "buildkite",
    ],
    category: "infra",
    baseWeight: 5,
    related: ["Git", "Docker"],
  },
  {
    name: "Terraform",
    aliases: ["terraform", "infrastructure as code", "iac"],
    category: "infra",
    baseWeight: 6,
    related: ["AWS", "GCP", "Azure"],
    modernSince: 2014,
  },
  {
    name: "Pulumi",
    aliases: ["pulumi"],
    category: "infra",
    baseWeight: 5,
    related: ["Terraform"],
    modernSince: 2018,
  },
  {
    name: "Linux",
    aliases: ["linux", "unix", "ubuntu", "debian", "centos", "rhel"],
    category: "infra",
    baseWeight: 5,
    related: ["Bash"],
  },
  {
    name: "Bash",
    aliases: ["bash", "shell", "shell scripting", "zsh", "command line", "cli", "terminal"],
    category: "infra",
    baseWeight: 4,
    prerequisites: ["Linux"],
  },
  {
    name: "Nginx",
    aliases: ["nginx", "reverse proxy", "load balancer"],
    category: "infra",
    baseWeight: 4,
  },
  {
    name: "Serverless",
    aliases: ["serverless", "lambda", "cloud functions", "faas", "function as a service"],
    category: "infra",
    baseWeight: 5,
    modernSince: 2015,
  },

  // === PROCESS & QUALITY ===
  {
    name: "Testing",
    aliases: ["testing", "unit testing", "integration testing", "e2e testing", "test-driven", "tdd", "bdd"],
    category: "process",
    baseWeight: 6,
    related: ["Jest", "Cypress", "Playwright"],
  },
  {
    name: "Jest",
    aliases: ["jest"],
    category: "process",
    baseWeight: 4,
    prerequisites: ["Testing", "JavaScript"],
    modernSince: 2016,
  },
  {
    name: "Cypress",
    aliases: ["cypress"],
    category: "process",
    baseWeight: 4,
    prerequisites: ["Testing"],
    modernSince: 2017,
  },
  {
    name: "Playwright",
    aliases: ["playwright"],
    category: "process",
    baseWeight: 4,
    prerequisites: ["Testing"],
    modernSince: 2020,
  },
  {
    name: "Vitest",
    aliases: ["vitest"],
    category: "process",
    baseWeight: 4,
    prerequisites: ["Testing", "Vite"],
    modernSince: 2022,
  },
  {
    name: "Git",
    aliases: ["git", "version control", "github", "gitlab", "bitbucket", "git flow"],
    category: "process",
    baseWeight: 4,
  },
  {
    name: "Agile",
    aliases: ["agile", "scrum", "kanban", "sprint", "standup", "retrospective", "user stories"],
    category: "process",
    baseWeight: 4,
  },
  {
    name: "Code Review",
    aliases: ["code review", "peer review", "pr review", "pull request"],
    category: "process",
    baseWeight: 3,
  },
  {
    name: "Security",
    aliases: ["security", "owasp", "penetration testing", "vulnerability", "secure coding", "appsec", "devsecops"],
    category: "infra",
    baseWeight: 5,
  },
  {
    name: "Authentication",
    aliases: ["authentication", "auth", "oauth", "oauth2", "oidc", "saml", "sso", "jwt", "session management"],
    category: "backend",
    baseWeight: 5,
  },
  {
    name: "Observability",
    aliases: [
      "observability",
      "monitoring",
      "logging",
      "metrics",
      "tracing",
      "datadog",
      "prometheus",
      "grafana",
      "newrelic",
      "splunk",
      "cloudwatch",
      "apm",
    ],
    category: "infra",
    baseWeight: 5,
  },
  {
    name: "Performance",
    aliases: [
      "performance",
      "optimization",
      "performance tuning",
      "profiling",
      "lighthouse",
      "core web vitals",
      "latency",
    ],
    category: "process",
    baseWeight: 5,
  },

  // === AI/ML ===
  {
    name: "Machine Learning",
    aliases: ["machine learning", "ml", "deep learning", "neural networks", "model training"],
    category: "ai",
    baseWeight: 7,
    related: ["Python", "TensorFlow", "PyTorch"],
  },
  {
    name: "TensorFlow",
    aliases: ["tensorflow", "tf", "keras"],
    category: "ai",
    baseWeight: 6,
    prerequisites: ["Machine Learning", "Python"],
  },
  {
    name: "PyTorch",
    aliases: ["pytorch", "torch"],
    category: "ai",
    baseWeight: 6,
    prerequisites: ["Machine Learning", "Python"],
    modernSince: 2016,
  },
  {
    name: "LLM/GenAI",
    aliases: [
      "llm",
      "large language model",
      "generative ai",
      "genai",
      "gpt",
      "chatgpt",
      "openai",
      "langchain",
      "llama",
      "claude",
      "ai sdk",
    ],
    category: "ai",
    baseWeight: 7,
    modernSince: 2022,
  },
  {
    name: "NLP",
    aliases: ["nlp", "natural language processing", "text processing", "sentiment analysis"],
    category: "ai",
    baseWeight: 5,
    prerequisites: ["Machine Learning"],
  },
  {
    name: "Computer Vision",
    aliases: ["computer vision", "cv", "image recognition", "object detection", "opencv"],
    category: "ai",
    baseWeight: 5,
    prerequisites: ["Machine Learning"],
  },
  {
    name: "MLOps",
    aliases: ["mlops", "ml ops", "ml engineering", "model deployment", "model serving"],
    category: "ai",
    baseWeight: 5,
    prerequisites: ["Machine Learning"],
    modernSince: 2019,
  },

  // === DATA ENGINEERING ===
  {
    name: "Data Engineering",
    aliases: ["data engineering", "data pipeline", "etl", "elt", "data warehouse"],
    category: "data",
    baseWeight: 6,
  },
  {
    name: "Apache Spark",
    aliases: ["spark", "apache spark", "pyspark"],
    category: "data",
    baseWeight: 6,
    prerequisites: ["Python"],
  },
  {
    name: "Apache Kafka",
    aliases: ["kafka", "apache kafka", "event streaming", "message queue", "pub/sub"],
    category: "data",
    baseWeight: 6,
  },
  {
    name: "Airflow",
    aliases: ["airflow", "apache airflow", "dag", "workflow orchestration"],
    category: "data",
    baseWeight: 5,
    prerequisites: ["Python"],
  },
  {
    name: "dbt",
    aliases: ["dbt", "data build tool"],
    category: "data",
    baseWeight: 5,
    modernSince: 2018,
  },
  {
    name: "Snowflake",
    aliases: ["snowflake"],
    category: "data",
    baseWeight: 5,
    modernSince: 2015,
  },
  {
    name: "BigQuery",
    aliases: ["bigquery", "big query"],
    category: "data",
    baseWeight: 5,
    prerequisites: ["GCP"],
  },

  // === MOBILE ===
  {
    name: "React Native",
    aliases: ["react native", "react-native", "rn"],
    category: "frontend",
    baseWeight: 6,
    prerequisites: ["React"],
    modernSince: 2015,
  },
  {
    name: "Flutter",
    aliases: ["flutter", "dart"],
    category: "frontend",
    baseWeight: 6,
    modernSince: 2018,
  },
  {
    name: "iOS",
    aliases: ["ios", "swift", "swiftui", "uikit", "xcode"],
    category: "frontend",
    baseWeight: 6,
  },
  {
    name: "Android",
    aliases: ["android", "kotlin", "jetpack compose", "android studio"],
    category: "frontend",
    baseWeight: 6,
  },

  // === DESIGN ===
  {
    name: "Figma",
    aliases: ["figma"],
    category: "design",
    baseWeight: 5,
    modernSince: 2016,
  },
  {
    name: "UI/UX Design",
    aliases: ["ui", "ux", "ui/ux", "user interface", "user experience", "design systems", "wireframe", "prototype"],
    category: "design",
    baseWeight: 6,
  },
  {
    name: "Accessibility",
    aliases: ["accessibility", "a11y", "wcag", "aria", "screen reader"],
    category: "design",
    baseWeight: 5,
  },

  // === SOFT SKILLS ===
  {
    name: "Leadership",
    aliases: ["leadership", "lead", "tech lead", "team lead", "engineering manager", "manager", "director"],
    category: "soft",
    baseWeight: 7,
  },
  {
    name: "Mentorship",
    aliases: ["mentor", "mentoring", "mentorship", "coaching", "training"],
    category: "soft",
    baseWeight: 5,
  },
  {
    name: "Communication",
    aliases: ["communication", "written communication", "verbal communication", "presentation", "public speaking"],
    category: "soft",
    baseWeight: 5,
  },
  {
    name: "Teamwork",
    aliases: ["teamwork", "collaboration", "cross-functional", "team player", "cooperative"],
    category: "soft",
    baseWeight: 4,
  },
  {
    name: "Problem Solving",
    aliases: ["problem solving", "analytical", "critical thinking", "debugging", "troubleshooting"],
    category: "soft",
    baseWeight: 5,
  },
  {
    name: "System Design",
    aliases: [
      "system design",
      "architecture",
      "technical architecture",
      "solution architecture",
      "distributed",
      "scalable",
      "high availability",
    ],
    category: "backend",
    baseWeight: 7,
  },

  // === PRODUCT ===
  {
    name: "Product Sense",
    aliases: ["product sense", "product thinking", "product-minded", "customer focus", "user research"],
    category: "product",
    baseWeight: 5,
  },
  {
    name: "Stakeholder Management",
    aliases: ["stakeholder", "stakeholder management", "executive communication", "business acumen"],
    category: "product",
    baseWeight: 5,
  },
]

// Create lookup for fast access
const SKILL_MAP = new Map<string, SkillEntry>()
const ALIAS_MAP = new Map<string, string>() // alias -> canonical name

for (const skill of SKILL_DICTIONARY) {
  SKILL_MAP.set(skill.name, skill)
  for (const alias of skill.aliases) {
    ALIAS_MAP.set(alias.toLowerCase(), skill.name)
  }
}

// =============================================================================
// IMPORTANCE PATTERNS - Used to determine if a skill is core/required/preferred
// =============================================================================

const CORE_PATTERNS = [
  /\b(?:core|primary|main|key|critical|essential)\s+(?:skill|requirement|technology|expertise)/gi,
  /\b(?:day-to-day|daily|regularly|primarily|mainly)\s+(?:work|use|build|develop)/gi,
  /\b(?:you will|you'll)\s+(?:be\s+)?(?:building|developing|architecting|designing)/gi,
]

const REQUIRED_PATTERNS = [
  /\b(?:must have|must-have|required|essential|mandatory|need|needs)\b/gi,
  /\b(?:minimum|at least)\s+\d+\s*(?:\+)?\s*years?/gi,
  /\brequirements?\s*:/gi,
  /\bwhat you['']ll need\b/gi,
]

const PREFERRED_PATTERNS = [
  /\b(?:preferred|ideally|preferably|strong|solid|good|excellent)\b/gi,
  /\b(?:experience with|familiarity with|knowledge of)\b/gi,
]

const BONUS_PATTERNS = [
  /\b(?:nice to have|nice-to-have|bonus|plus|would be great|beneficial|advantageous)\b/gi,
  /\b(?:not required but|optional|extra credit)\b/gi,
  /\bbonus points?\b/gi,
]

// =============================================================================
// YEARS OF EXPERIENCE EXTRACTION
// =============================================================================

function extractYearsRequired(context: string): number | undefined {
  // Match patterns like "5+ years", "3-5 years", "minimum 4 years"
  const patterns = [/(\d+)\s*\+?\s*years?/gi, /(\d+)\s*-\s*\d+\s*years?/gi, /(?:minimum|at least)\s*(\d+)\s*years?/gi]

  for (const pattern of patterns) {
    const match = pattern.exec(context)
    if (match) {
      return Number.parseInt(match[1], 10)
    }
  }
  return undefined
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

export function extractSkillsDeterministic(description: string): ExtractedSkill[] {
  const lowerDesc = description.toLowerCase()
  const lines = description.split("\n")

  let currentSection: "required" | "optional" | "unknown" = "unknown"
  const sectionMap = new Map<number, "required" | "optional" | "unknown">()

  const REQUIRED_SECTION_PATTERNS = [
    /^\s*(?:#+\s*)?(?:must[\s-]?have|required|requirements|non[\s-]?negotiable|core[\s-]?requirements|what you['']?ll need|qualifications)/i,
    /^\s*(?:#+\s*)?(?:minimum requirements|essential skills|key requirements)/i,
  ]

  const OPTIONAL_SECTION_PATTERNS = [
    /^\s*(?:#+\s*)?(?:nice[\s-]?to[\s-]?have|preferred|bonus|optional|plus|extra credit|would be great)/i,
    /^\s*(?:#+\s*)?(?:preferred qualifications|nice to haves|bonuses)/i,
  ]

  lines.forEach((line, index) => {
    if (REQUIRED_SECTION_PATTERNS.some((p) => p.test(line))) {
      currentSection = "required"
    } else if (OPTIONAL_SECTION_PATTERNS.some((p) => p.test(line))) {
      currentSection = "optional"
    }
    sectionMap.set(index, currentSection)
  })

  // Track found skills with their metadata
  const skillScores = new Map<
    string,
    {
      mentions: number
      importance: SkillImportance
      confidence: SkillConfidence
      yearsRequired?: number
      contextSnippets: string[]
      inBullet: boolean
      category: SkillCategory
      baseWeight: number
      isRequired?: boolean
      lineIndices: number[]
    }
  >()

  // =============================================================================
  // STEP 1: Detect all skills and their contexts
  // =============================================================================

  for (const skill of SKILL_DICTIONARY) {
    let mentions = 0
    let importance: SkillImportance = "preferred"
    let highestConfidence: SkillConfidence = "low"
    let yearsRequired: number | undefined
    const contextSnippets: string[] = []
    let inBullet = false
    const lineIndices: number[] = []

    for (const alias of skill.aliases) {
      // Create word boundary regex
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const aliasRegex = new RegExp(`\\b${escapedAlias}\\b`, "gi")

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex]
        const lowerLine = line.toLowerCase()
        if (aliasRegex.test(lowerLine)) {
          mentions++
          lineIndices.push(lineIndex)

          // Check if in bullet point
          if (/^[\s]*[-•*]\s*/.test(line) || /^\s*\d+\.\s*/.test(line)) {
            inBullet = true
          }

          // Get context (the full line + adjacent lines for context)
          const contextStart = Math.max(0, lineIndex - 1)
          const contextEnd = Math.min(lines.length, lineIndex + 2)
          const context = lines.slice(contextStart, contextEnd).join(" ").toLowerCase()

          const sectionContext = sectionMap.get(lineIndex) || "unknown"
          if (sectionContext === "optional") {
            importance = "bonus"
          } else if (sectionContext === "required") {
            if (importance !== "core") importance = "required"
            if (highestConfidence !== "high") highestConfidence = "high"
          }

          // Determine importance from inline context (can override section)
          if (CORE_PATTERNS.some((p) => p.test(context))) {
            importance = "core"
            highestConfidence = "high"
          } else if (REQUIRED_PATTERNS.some((p) => p.test(context))) {
            if (importance !== "core" && sectionContext !== "optional") importance = "required"
            if (highestConfidence !== "high") highestConfidence = "high"
          } else if (BONUS_PATTERNS.some((p) => p.test(context))) {
            if (importance === "preferred") importance = "bonus"
          }

          // Extract years
          const years = extractYearsRequired(context)
          if (years !== undefined && (yearsRequired === undefined || years > yearsRequired)) {
            yearsRequired = years
            highestConfidence = "high"
          }

          // Store context snippet
          if (contextSnippets.length < 3) {
            contextSnippets.push(line.trim().slice(0, 100))
          }
        }
      }
    }

    if (mentions > 0) {
      // Adjust confidence based on mentions and context
      if (mentions >= 3) highestConfidence = "high"
      else if (mentions >= 2 && highestConfidence !== "high") highestConfidence = "medium"
      else if (inBullet && highestConfidence === "low") highestConfidence = "medium"

      skillScores.set(skill.name, {
        mentions,
        importance,
        confidence: highestConfidence,
        yearsRequired,
        contextSnippets,
        inBullet,
        category: skill.category,
        baseWeight: skill.baseWeight,
        isRequired: importance === "core" || importance === "required",
        lineIndices,
      })
    }
  }

  // =============================================================================
  // STEP 2: Apply relationship bonuses
  // =============================================================================

  for (const [skillName, data] of skillScores.entries()) {
    const skill = SKILL_MAP.get(skillName)
    if (!skill) continue

    // Boost if prerequisite is also present
    if (skill.prerequisites) {
      for (const prereq of skill.prerequisites) {
        if (skillScores.has(prereq)) {
          data.baseWeight += 1 // Small boost for having prereq
        }
      }
    }

    // Boost if related skills are present
    if (skill.related) {
      let relatedCount = 0
      for (const related of skill.related) {
        if (skillScores.has(related)) {
          relatedCount++
        }
      }
      if (relatedCount >= 2) {
        data.baseWeight += 2 // Stack synergy boost
      }
    }
  }

  // =============================================================================
  // STEP 3: Calculate final weights
  // =============================================================================

  const skills: ExtractedSkill[] = []

  for (const [name, data] of skillScores.entries()) {
    // Base weight from dictionary
    let weight = data.baseWeight

    // Importance multipliers
    switch (data.importance) {
      case "core":
        weight *= 2.5
        break
      case "required":
        weight *= 1.8
        break
      case "preferred":
        weight *= 1.2
        break
      case "bonus":
        weight *= 0.6
        break
    }

    // Mention frequency boost (diminishing returns)
    if (data.mentions >= 4) weight *= 1.3
    else if (data.mentions >= 2) weight *= 1.15

    // Bullet point presence boost
    if (data.inBullet) weight *= 1.1

    // Years of experience boost (indicates seniority/importance)
    if (data.yearsRequired && data.yearsRequired >= 5) weight *= 1.2
    else if (data.yearsRequired && data.yearsRequired >= 3) weight *= 1.1

    // Generate context explanation
    let context = `${data.importance}`
    if (data.yearsRequired) context += `, ${data.yearsRequired}+ years`
    if (data.mentions > 1) context += `, ${data.mentions} mentions`

    skills.push({
      name,
      weight: Math.round(weight * 10) / 10, // Keep precision for now
      confidence: data.confidence,
      category: data.category,
      importance: data.importance,
      yearsRequired: data.yearsRequired,
      context,
      isRequired: data.importance === "core" || data.importance === "required",
    })
  }

  // =============================================================================
  // STEP 4: Sort and limit
  // =============================================================================

  // Sort by weight descending
  skills.sort((a, b) => b.weight - a.weight)

  // Keep top skills but ensure diversity across categories
  const topSkills: ExtractedSkill[] = []
  const categoryCounts = new Map<SkillCategory, number>()
  const maxPerCategory = 3
  const maxTotal = 10

  for (const skill of skills) {
    if (topSkills.length >= maxTotal) break

    const cat = skill.category || "soft"
    const count = categoryCounts.get(cat) || 0

    // Allow more of a category if it's clearly dominant
    const isDominant = skills.filter((s) => s.category === cat && s.importance === "core").length >= 2
    const limit = isDominant ? maxPerCategory + 2 : maxPerCategory

    if (count < limit) {
      topSkills.push(skill)
      categoryCounts.set(cat, count + 1)
    }
  }

  // =============================================================================
  // STEP 5: Fallback if nothing detected
  // =============================================================================

  if (topSkills.length === 0) {
    return [
      {
        name: "JavaScript",
        weight: 20,
        confidence: "low",
        category: "frontend",
        context: "fallback",
        isRequired: false,
      },
      { name: "React", weight: 20, confidence: "low", category: "frontend", context: "fallback", isRequired: false },
      { name: "Node.js", weight: 20, confidence: "low", category: "backend", context: "fallback", isRequired: false },
      { name: "SQL", weight: 20, confidence: "low", category: "data", context: "fallback", isRequired: false },
      { name: "Git", weight: 20, confidence: "low", category: "process", context: "fallback", isRequired: false },
    ]
  }

  // =============================================================================
  // STEP 6: Normalize weights to 100%
  // =============================================================================

  return normalizeWeights(topSkills)
}

/**
 * Normalize skill weights to sum to exactly 100
 */
export function normalizeWeights(skills: ExtractedSkill[]): ExtractedSkill[] {
  if (skills.length === 0) return skills

  const totalWeight = skills.reduce((sum, s) => sum + s.weight, 0)

  if (totalWeight === 0) {
    // Edge case: all weights are 0, distribute evenly
    const evenWeight = Math.floor(100 / skills.length)
    return skills.map((s, i) => ({
      ...s,
      weight: i === 0 ? evenWeight + (100 - evenWeight * skills.length) : evenWeight,
    }))
  }

  // Calculate proportional weights with higher precision
  const normalized = skills.map((s) => ({
    ...s,
    weight: Math.round((s.weight / totalWeight) * 100),
  }))

  // Fix rounding drift
  const total = normalized.reduce((sum, s) => sum + s.weight, 0)
  const drift = 100 - total

  if (drift !== 0) {
    // Add/remove from highest weight skill(s) to fix drift
    const sorted = [...normalized].sort((a, b) => b.weight - a.weight)
    let remaining = Math.abs(drift)
    const direction = drift > 0 ? 1 : -1

    for (let i = 0; remaining > 0 && i < sorted.length; i++) {
      const target = normalized.find((s) => s.name === sorted[i].name)
      if (target && target.weight + direction >= 1) {
        target.weight += direction
        remaining--
      }
    }
  }

  return normalized
}

/**
 * Enhanced JD Critique with more intelligence
 */
export function critiqueJD(description: string, skills: ExtractedSkill[]): JDCritique {
  const lowerDesc = description.toLowerCase()
  const issues: JDCritiqueIssue[] = []
  const suggestions: string[] = []
  let score = 90

  // =============================================================================
  // Check for biased/exclusionary language
  // =============================================================================

  const biasTerms = [
    {
      term: "rockstar",
      severity: "high" as const,
      message: '"Rockstar" is exclusionary and vague - what specific skills matter?',
    },
    {
      term: "ninja",
      severity: "high" as const,
      message: '"Ninja" discourages diverse candidates. Be specific about skills.',
    },
    { term: "guru", severity: "medium" as const, message: '"Guru" is subjective. Define expertise level clearly.' },
    {
      term: "wizard",
      severity: "medium" as const,
      message: '"Wizard" is vague. What exactly should they be excellent at?',
    },
    { term: "unicorn", severity: "high" as const, message: '"Unicorn" signals unrealistic expectations.' },
    {
      term: "young and hungry",
      severity: "high" as const,
      message: '"Young" is age discrimination. Focus on energy/drive instead.',
    },
    {
      term: "digital native",
      severity: "high" as const,
      message: '"Digital native" discriminates by age. Focus on actual skills.',
    },
    {
      term: "culture fit",
      severity: "medium" as const,
      message: '"Culture fit" can mask bias. Use "culture add" instead.',
    },
    {
      term: "fast-paced",
      severity: "low" as const,
      message: '"Fast-paced" is overused. Be specific about what this means.',
    },
  ]

  for (const { term, severity, message } of biasTerms) {
    if (lowerDesc.includes(term)) {
      score -= severity === "high" ? 12 : severity === "medium" ? 7 : 4
      issues.push({ type: "bias", text: message, severity })
    }
  }

  // =============================================================================
  // Check for unrealistic experience requirements
  // =============================================================================

  const yearsMatch = description.match(/(\d+)\s*\+?\s*years?/gi)
  if (yearsMatch) {
    for (const skill of skills) {
      const skillEntry = SKILL_MAP.get(skill.name)
      if (skillEntry?.modernSince && skill.yearsRequired) {
        const maxPossibleYears = new Date().getFullYear() - skillEntry.modernSince
        if (skill.yearsRequired > maxPossibleYears) {
          score -= 15
          issues.push({
            type: "unrealistic",
            text: `${skill.yearsRequired}+ years of ${skill.name} is impossible (technology released in ${skillEntry.modernSince}).`,
            severity: "high",
          })
        } else if (skill.yearsRequired > maxPossibleYears - 2) {
          score -= 8
          issues.push({
            type: "unrealistic",
            text: `${skill.yearsRequired}+ years of ${skill.name} is near the maximum possible (released ${skillEntry.modernSince}).`,
            severity: "medium",
          })
        }
      }
    }
  }

  // =============================================================================
  // Check for skill contradictions/anti-patterns
  // =============================================================================

  const skillNames = new Set(skills.map((s) => s.name))
  for (const skill of skills) {
    const skillEntry = SKILL_MAP.get(skill.name)
    if (skillEntry?.antiPatterns) {
      for (const antiPattern of skillEntry.antiPatterns) {
        if (skillNames.has(antiPattern)) {
          score -= 5
          issues.push({
            type: "contradiction",
            text: `Requiring both ${skill.name} and ${antiPattern} is unusual - these are typically alternative choices.`,
            severity: "low",
          })
        }
      }
    }
  }

  // =============================================================================
  // Check for missing important elements
  // =============================================================================

  const hasTestingSkill = skills.some((s) => s.name === "Testing" || s.name.includes("Test"))
  const hasTestingMention = /\btest/i.test(description)
  if (!hasTestingSkill && !hasTestingMention) {
    score -= 8
    issues.push({
      type: "missing",
      text: "No testing expectations mentioned. Quality-focused candidates may skip this.",
      severity: "medium",
    })
    suggestions.push("Add testing requirements (e.g., 'Experience with unit and integration testing')")
  }

  const hasSoftSkill = skills.some((s) => s.category === "soft")
  if (!hasSoftSkill) {
    score -= 5
    issues.push({
      type: "missing",
      text: "No soft skills mentioned. Consider adding communication, collaboration, or leadership.",
      severity: "low",
    })
    suggestions.push("Add soft skill requirements relevant to the role level")
  }

  const hasSecurityMention = /\bsecur/i.test(description)
  const isBackendHeavy = skills.filter((s) => s.category === "backend").length >= 2
  if (!hasSecurityMention && isBackendHeavy) {
    score -= 5
    issues.push({
      type: "missing",
      text: "No security awareness mentioned for a backend-heavy role.",
      severity: "low",
    })
  }

  // =============================================================================
  // Check for vague language
  // =============================================================================

  const vaguePatterns = [
    { pattern: /\betc\.?\b/gi, message: "'etc' leaves requirements ambiguous" },
    { pattern: /\band more\b/gi, message: "'and more' is vague - what else exactly?" },
    { pattern: /\bvarious\b/gi, message: "'various' is unspecific" },
    { pattern: /\bsome experience\b/gi, message: "'some experience' - how much?" },
    { pattern: /\bgood understanding\b/gi, message: "'good understanding' is subjective - define what this means" },
  ]

  for (const { pattern, message } of vaguePatterns) {
    if (pattern.test(description)) {
      score -= 4
      issues.push({ type: "vague", text: message, severity: "low" })
    }
  }

  // =============================================================================
  // Check for positive signals (boost score)
  // =============================================================================

  if (/\bremote\b/i.test(description)) score += 3
  if (/\bsalary\s*(?:range|:|\$)/i.test(description)) score += 5
  if (/\bdiversity\b/i.test(description) || /\binclusive\b/i.test(description)) score += 3
  if (/\bgrowth\b/i.test(description) && /\blearn/i.test(description)) score += 2

  // =============================================================================
  // Generate suggestions
  // =============================================================================

  if (issues.some((i) => i.type === "bias")) {
    suggestions.push("Replace subjective terms with specific, measurable skills")
  }

  if (skills.length < 4) {
    suggestions.push("Add more specific technical requirements to attract qualified candidates")
  }

  const coreSkills = skills.filter((s) => s.importance === "core")
  if (coreSkills.length === 0) {
    suggestions.push("Clearly mark 2-3 core skills as non-negotiable to focus candidates")
  }

  // Cap score
  score = Math.max(0, Math.min(100, score))

  return {
    score,
    issues: issues.slice(0, 6), // Limit to top 6 issues
    suggestions: suggestions.slice(0, 4),
  }
}

// Export the skill dictionary for use elsewhere
export { SKILL_MAP, ALIAS_MAP }

export function markTopNAsRequired(skills: ExtractedSkill[], n = 5): ExtractedSkill[] {
  // Sort by weight descending
  const sorted = [...skills].sort((a, b) => b.weight - a.weight)
  const topNames = new Set(sorted.slice(0, n).map((s) => s.name))

  return skills.map((skill) => ({
    ...skill,
    isRequired: topNames.has(skill.name),
  }))
}

export function countRequired(skills: ExtractedSkill[]): { required: number; optional: number } {
  const required = skills.filter((s) => s.isRequired).length
  return { required, optional: skills.length - required }
}
