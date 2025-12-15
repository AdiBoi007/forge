// FORGE Mock Data - Full rich dataset for decision engine demo
export interface Skill {
  name: string
  status: "Proven" | "Weak" | "Missing"
  confidence: number
  evidence: {
    repo: string
    description: string
    commits: number
    ownership: string
    language: string
    lastUpdated: string
    whyItMatters: string
  } | null
}

export interface ContextSignal {
  raw: number
  weighted: number
  signals: string[]
  evidenceSources: string[]
}

export interface RiskItem {
  type: "low_confidence" | "conflicting" | "missing_proof"
  description: string
  severity: "low" | "medium" | "high"
}

export interface InterviewQuestion {
  question: string
  context: string
  linkedProject?: string
}

export interface InterviewGuidance {
  questionsToAsk: InterviewQuestion[]
  areasToProbe: string[]
  suggestedTask: {
    type: "pr_review" | "architecture" | "written_reasoning"
    description: string
  }
}

export interface EvidenceTimeline {
  year: number
  skills: string[]
  velocity: "accelerating" | "steady" | "slowing"
}

export interface CandidateResult {
  id: string
  name: string
  linkedin: string
  github: string
  portfolio: string | null
  verdict: "Strong Hire" | "Possible" | "Risky but High Potential" | "Reject"
  capability: {
    status: "Pass" | "Fail"
    score: number
    confidence: number
    skills: Skill[]
  }
  context: {
    teamwork: ContextSignal
    communication: ContextSignal
    adaptability: ContextSignal
    ownership: ContextSignal
  }
  finalScore: number
  explanation: {
    summary: string
    oneLiner: string
    strengths: string[]
    weaknesses: string[]
    flags: string[]
  }
  risks: RiskItem[]
  interviewGuidance: InterviewGuidance
  evidenceTimeline: EvidenceTimeline[]
}

export interface JDCritique {
  type: "warning" | "suggestion" | "info"
  message: string
}

export const jobConfig = {
  id: "job_001",
  title: "Senior Full-Stack Engineer",
  description: `Build and maintain scalable web applications using React, Node.js, AWS, SQL, and REST APIs.

Key requirements:
- 5+ years of experience with React and TypeScript
- Strong backend development skills with Node.js
- Experience with AWS or similar cloud platforms
- SQL database design and optimization
- RESTful API design

You'll be working closely with product and design teams to ship features that delight our users.`,
  requiredSkills: ["React", "TypeScript", "Node.js", "AWS", "SQL", "REST API"],
  capabilityThreshold: 0.6,
  confidenceTolerance: "balanced" as "strict" | "balanced" | "permissive",
  contextWeights: {
    teamwork: 20,
    communication: 25,
    adaptability: 30,
    ownership: 25,
  },
}

export const jdCritiques: JDCritique[] = [
  {
    type: "warning",
    message: "This JD heavily favours years of experience over demonstrated capability",
  },
  {
    type: "suggestion",
    message: "Consider removing '5+ years' requirement — it may filter adaptable candidates",
  },
  {
    type: "info",
    message: "Required skills align with typical full-stack project scope",
  },
]

export const candidateResults: CandidateResult[] = [
  {
    id: "cand_001",
    name: "Sarah Chen",
    linkedin: "https://linkedin.com/in/sarah-chen",
    github: "https://github.com/sarahchen",
    portfolio: "https://sarahchen.dev",
    verdict: "Strong Hire",
    capability: {
      status: "Pass",
      score: 0.95,
      confidence: 0.92,
      skills: [
        {
          name: "React",
          status: "Proven",
          confidence: 0.95,
          evidence: {
            repo: "react-dashboard",
            description: "Sustained React usage across 12 production repositories",
            commits: 450,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "2 days ago",
            whyItMatters: "Shows sustained, production-level React expertise with modern patterns",
          },
        },
        {
          name: "TypeScript",
          status: "Proven",
          confidence: 0.93,
          evidence: {
            repo: "ts-utils",
            description: "Advanced TypeScript patterns used in 8 projects",
            commits: 320,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "1 week ago",
            whyItMatters: "Demonstrates advanced type system understanding and library authorship",
          },
        },
        {
          name: "Node.js",
          status: "Proven",
          confidence: 0.91,
          evidence: {
            repo: "api-server",
            description: "Built and maintained 3 Node.js backend services",
            commits: 290,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "3 days ago",
            whyItMatters: "Production backend experience with performance considerations",
          },
        },
        {
          name: "AWS",
          status: "Proven",
          confidence: 0.88,
          evidence: {
            repo: "infra-config",
            description: "IaC for multi-environment AWS deployments",
            commits: 180,
            ownership: "Primary owner",
            language: "HCL",
            lastUpdated: "2 weeks ago",
            whyItMatters: "Infrastructure ownership shows senior-level cloud competency",
          },
        },
        {
          name: "SQL",
          status: "Proven",
          confidence: 0.9,
          evidence: {
            repo: "db-migrations",
            description: "Schema design and query optimisation across 5 systems",
            commits: 150,
            ownership: "Primary owner",
            language: "SQL",
            lastUpdated: "1 week ago",
            whyItMatters: "Database design and optimization indicates architectural thinking",
          },
        },
        {
          name: "REST API",
          status: "Proven",
          confidence: 0.92,
          evidence: {
            repo: "api-server",
            description: "Designed REST APIs following best practices",
            commits: 290,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "3 days ago",
            whyItMatters: "API design shows understanding of contracts and documentation",
          },
        },
      ],
    },
    context: {
      teamwork: {
        raw: 85,
        weighted: 17,
        signals: ["Long-term contributor to 3 team repositories", "Consistent collaboration across projects"],
        evidenceSources: ["GitHub collaboration graphs", "PR review patterns"],
      },
      communication: {
        raw: 90,
        weighted: 22.5,
        signals: ["Clear READMEs and architectural docs", "Technical blog posts explaining decisions"],
        evidenceSources: ["Repository documentation", "Linked blog posts"],
      },
      adaptability: {
        raw: 88,
        weighted: 26.4,
        signals: ["Worked across frontend, backend, and infrastructure", "Evolving tech stack over time"],
        evidenceSources: ["Language diversity", "Project type variety"],
      },
      ownership: {
        raw: 92,
        weighted: 23,
        signals: ["Primary owner of multiple production systems", "Initiated and maintained long-lived projects"],
        evidenceSources: ["Commit frequency", "Repository creation patterns"],
      },
    },
    finalScore: 92,
    explanation: {
      summary:
        "Ranked highest due to consistent ownership of production-level repositories across all required skills with high confidence signals.",
      oneLiner: "High ownership, excellent communication, strong adaptability.",
      strengths: [
        "Strong evidence across all required skills",
        "High ownership and communication signals",
        "Consistent activity over 3+ years",
      ],
      weaknesses: [],
      flags: [],
    },
    risks: [],
    interviewGuidance: {
      questionsToAsk: [
        {
          question:
            "Walk me through your architecture decisions in the api-server project. What trade-offs did you make?",
          context: "Validates depth of backend understanding beyond code contribution",
          linkedProject: "api-server",
        },
        {
          question: "How did you handle schema migrations in db-migrations when you needed to minimize downtime?",
          context: "Tests operational maturity and production experience",
          linkedProject: "db-migrations",
        },
        {
          question: "Tell me about a time when you had to push back on a product decision for technical reasons.",
          context: "Assesses communication and stakeholder management",
        },
      ],
      areasToProbe: ["Team leadership experience", "Conflict resolution in code reviews"],
      suggestedTask: {
        type: "architecture",
        description: "Review a system design proposal and identify potential scaling issues",
      },
    },
    evidenceTimeline: [
      { year: 2021, skills: ["React", "JavaScript"], velocity: "steady" },
      { year: 2022, skills: ["React", "TypeScript", "Node.js"], velocity: "accelerating" },
      { year: 2023, skills: ["React", "TypeScript", "Node.js", "AWS", "SQL"], velocity: "accelerating" },
      { year: 2024, skills: ["React", "TypeScript", "Node.js", "AWS", "SQL", "REST API"], velocity: "steady" },
    ],
  },
  {
    id: "cand_002",
    name: "James Rodriguez",
    linkedin: "https://linkedin.com/in/james-rodriguez",
    github: "https://github.com/jrodriguez",
    portfolio: null,
    verdict: "Strong Hire",
    capability: {
      status: "Pass",
      score: 0.92,
      confidence: 0.85,
      skills: [
        {
          name: "React",
          status: "Proven",
          confidence: 0.9,
          evidence: {
            repo: "web-platform",
            description: "Lead developer on enterprise React application",
            commits: 380,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "5 days ago",
            whyItMatters: "Enterprise-scale React experience with team coordination",
          },
        },
        {
          name: "TypeScript",
          status: "Proven",
          confidence: 0.88,
          evidence: {
            repo: "type-library",
            description: "Created reusable TypeScript libraries",
            commits: 220,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "1 week ago",
            whyItMatters: "Library authorship shows advanced TypeScript patterns",
          },
        },
        {
          name: "Node.js",
          status: "Proven",
          confidence: 0.92,
          evidence: {
            repo: "backend-api",
            description: "Built scalable Node.js services",
            commits: 310,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "3 days ago",
            whyItMatters: "Strong backend focus with scalability considerations",
          },
        },
        {
          name: "AWS",
          status: "Weak",
          confidence: 0.45,
          evidence: {
            repo: "deploy-scripts",
            description: "Some AWS configuration work",
            commits: 45,
            ownership: "Contributor",
            language: "Shell",
            lastUpdated: "2 months ago",
            whyItMatters: "Limited AWS exposure, mostly deployment scripts",
          },
        },
        {
          name: "SQL",
          status: "Proven",
          confidence: 0.87,
          evidence: {
            repo: "analytics",
            description: "Complex analytical queries and optimization",
            commits: 180,
            ownership: "Primary owner",
            language: "SQL",
            lastUpdated: "2 weeks ago",
            whyItMatters: "Analytical SQL work shows advanced query capabilities",
          },
        },
        {
          name: "REST API",
          status: "Proven",
          confidence: 0.91,
          evidence: {
            repo: "backend-api",
            description: "Versioned API design with OpenAPI docs",
            commits: 310,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "3 days ago",
            whyItMatters: "API documentation and versioning shows maturity",
          },
        },
      ],
    },
    context: {
      teamwork: {
        raw: 88,
        weighted: 17.6,
        signals: ["Active code reviewer on team projects", "Mentored junior developers"],
        evidenceSources: ["PR review count", "Contributor onboarding patterns"],
      },
      communication: {
        raw: 82,
        weighted: 20.5,
        signals: ["Good commit messages", "API documentation strong, less public writing"],
        evidenceSources: ["Commit message quality", "Repository documentation"],
      },
      adaptability: {
        raw: 75,
        weighted: 22.5,
        signals: ["Primarily backend focused", "Some frontend work when needed"],
        evidenceSources: ["Project type distribution"],
      },
      ownership: {
        raw: 85,
        weighted: 21.25,
        signals: ["Strong backend ownership", "Shared frontend responsibilities"],
        evidenceSources: ["Repository ownership patterns"],
      },
    },
    finalScore: 88,
    explanation: {
      summary:
        "Strong technical capability with solid team collaboration. Minor gap in AWS experience could be addressed in interview.",
      oneLiner: "Strong backend focus, excellent teamwork, moderate AWS gap.",
      strengths: ["Consistent backend ownership", "Strong mentorship signals", "Excellent API design"],
      weaknesses: ["AWS experience limited to contributor role"],
      flags: ["AWS confidence below threshold"],
    },
    risks: [
      {
        type: "low_confidence",
        description: "AWS experience shows contributor-level involvement only",
        severity: "medium",
      },
    ],
    interviewGuidance: {
      questionsToAsk: [
        {
          question: "Tell me about your experience scaling the backend-api service. What challenges did you face?",
          context: "Validates depth of backend expertise",
          linkedProject: "backend-api",
        },
        {
          question: "How would you approach setting up a new AWS environment from scratch?",
          context: "Tests AWS knowledge depth given limited evidence",
        },
        {
          question: "Describe your code review philosophy. How do you balance velocity with code quality?",
          context: "Assesses mentorship and team collaboration approach",
        },
      ],
      areasToProbe: ["AWS infrastructure experience", "Full-stack breadth beyond backend"],
      suggestedTask: {
        type: "pr_review",
        description: "Review a PR with infrastructure changes to assess AWS understanding",
      },
    },
    evidenceTimeline: [
      { year: 2021, skills: ["Node.js", "JavaScript"], velocity: "steady" },
      { year: 2022, skills: ["Node.js", "TypeScript", "SQL"], velocity: "accelerating" },
      { year: 2023, skills: ["Node.js", "TypeScript", "SQL", "React"], velocity: "steady" },
      { year: 2024, skills: ["Node.js", "TypeScript", "SQL", "React", "REST API"], velocity: "steady" },
    ],
  },
  {
    id: "cand_003",
    name: "Alex Kumar",
    linkedin: "https://linkedin.com/in/alex-kumar",
    github: "https://github.com/alexkumar",
    portfolio: "https://alexkumar.io",
    verdict: "Risky but High Potential",
    capability: {
      status: "Pass",
      score: 0.72,
      confidence: 0.65,
      skills: [
        {
          name: "React",
          status: "Proven",
          confidence: 0.82,
          evidence: {
            repo: "portfolio-site",
            description: "Solid React usage across 6 projects",
            commits: 180,
            ownership: "Primary owner",
            language: "JavaScript",
            lastUpdated: "1 week ago",
            whyItMatters: "Consistent React usage with modern patterns",
          },
        },
        {
          name: "TypeScript",
          status: "Weak",
          confidence: 0.35,
          evidence: {
            repo: "ts-experiment",
            description: "Limited TypeScript, primarily JavaScript",
            commits: 35,
            ownership: "Primary owner",
            language: "TypeScript",
            lastUpdated: "3 months ago",
            whyItMatters: "TypeScript adoption in progress but not yet mature",
          },
        },
        {
          name: "Node.js",
          status: "Proven",
          confidence: 0.78,
          evidence: {
            repo: "express-api",
            description: "Built several Express-based APIs",
            commits: 150,
            ownership: "Primary owner",
            language: "JavaScript",
            lastUpdated: "2 weeks ago",
            whyItMatters: "Backend capability demonstrated, room for growth",
          },
        },
        {
          name: "AWS",
          status: "Proven",
          confidence: 0.75,
          evidence: {
            repo: "lambda-functions",
            description: "Deployed serverless functions on AWS Lambda",
            commits: 90,
            ownership: "Primary owner",
            language: "JavaScript",
            lastUpdated: "1 month ago",
            whyItMatters: "Serverless experience shows modern cloud patterns",
          },
        },
        {
          name: "SQL",
          status: "Weak",
          confidence: 0.4,
          evidence: {
            repo: "express-api",
            description: "Basic queries, no complex schema design",
            commits: 40,
            ownership: "Contributor",
            language: "SQL",
            lastUpdated: "2 months ago",
            whyItMatters: "SQL usage is basic, would need development",
          },
        },
        {
          name: "REST API",
          status: "Proven",
          confidence: 0.8,
          evidence: {
            repo: "express-api",
            description: "Standard RESTful patterns",
            commits: 150,
            ownership: "Primary owner",
            language: "JavaScript",
            lastUpdated: "2 weeks ago",
            whyItMatters: "Solid API design fundamentals",
          },
        },
      ],
    },
    context: {
      teamwork: {
        raw: 70,
        weighted: 14,
        signals: ["Primarily solo projects", "Some open source contributions"],
        evidenceSources: ["Collaboration patterns limited"],
      },
      communication: {
        raw: 75,
        weighted: 18.75,
        signals: ["Basic documentation", "Active on technical forums"],
        evidenceSources: ["Repository READMEs", "External forum activity"],
      },
      adaptability: {
        raw: 92,
        weighted: 27.6,
        signals: ["Wide range of project types", "Rapid learning velocity", "Tech stack evolving quickly"],
        evidenceSources: ["Project diversity", "Skill acquisition timeline"],
      },
      ownership: {
        raw: 72,
        weighted: 18,
        signals: ["Mostly contributor roles historically", "Recent shift to ownership"],
        evidenceSources: ["Ownership pattern changes over time"],
      },
    },
    finalScore: 75,
    explanation: {
      summary:
        "Strong learning velocity and adaptability signals despite incomplete proof in TypeScript and SQL. Worth a structured interview to validate potential.",
      oneLiner: "High adaptability, strong learning signals, incomplete technical proof.",
      strengths: ["Exceptional learning velocity", "Wide project diversity", "Strong adaptability"],
      weaknesses: ["TypeScript experience limited", "SQL knowledge basic", "Limited team collaboration evidence"],
      flags: ["Lower confidence in core skills", "Potential exceeds current evidence"],
    },
    risks: [
      {
        type: "low_confidence",
        description: "TypeScript experience shows experimentation, not production usage",
        severity: "medium",
      },
      {
        type: "missing_proof",
        description: "No evidence of complex SQL schema design or optimization",
        severity: "medium",
      },
      {
        type: "low_confidence",
        description: "Limited collaboration evidence — mostly solo work",
        severity: "low",
      },
    ],
    interviewGuidance: {
      questionsToAsk: [
        {
          question: "What drew you to explore TypeScript? Walk me through your learning process.",
          context: "Validates learning approach and growth mindset",
          linkedProject: "ts-experiment",
        },
        {
          question: "How would you design a database schema for a multi-tenant SaaS application?",
          context: "Tests SQL design thinking beyond basic usage",
        },
        {
          question: "Describe a project where you had to collaborate closely with other engineers.",
          context: "Probes teamwork experience given limited evidence",
        },
      ],
      areasToProbe: [
        "TypeScript depth and production readiness",
        "Team collaboration experience",
        "SQL design capabilities",
      ],
      suggestedTask: {
        type: "written_reasoning",
        description: "Write a technical design doc for a feature requiring database schema changes",
      },
    },
    evidenceTimeline: [
      { year: 2022, skills: ["JavaScript", "React"], velocity: "steady" },
      { year: 2023, skills: ["JavaScript", "React", "Node.js", "AWS"], velocity: "accelerating" },
      { year: 2024, skills: ["JavaScript", "React", "Node.js", "AWS", "TypeScript"], velocity: "accelerating" },
    ],
  },
  {
    id: "cand_004",
    name: "Emily Zhang",
    linkedin: "https://linkedin.com/in/emily-zhang",
    github: "https://github.com/emilyzhang",
    portfolio: "https://emilyzhang.com",
    verdict: "Reject",
    capability: {
      status: "Fail",
      score: 0.45,
      confidence: 0.52,
      skills: [
        {
          name: "React",
          status: "Weak",
          confidence: 0.45,
          evidence: {
            repo: "personal-site",
            description: "Some React code but inconsistent patterns",
            commits: 45,
            ownership: "Primary owner",
            language: "JavaScript",
            lastUpdated: "3 weeks ago",
            whyItMatters: "React usage present but not production-ready patterns",
          },
        },
        {
          name: "TypeScript",
          status: "Missing",
          confidence: 0,
          evidence: null,
        },
        {
          name: "Node.js",
          status: "Weak",
          confidence: 0.35,
          evidence: {
            repo: "starter-api",
            description: "Basic Node.js setup, minimal production code",
            commits: 25,
            ownership: "Primary owner",
            language: "JavaScript",
            lastUpdated: "2 months ago",
            whyItMatters: "Starter-level backend work only",
          },
        },
        {
          name: "AWS",
          status: "Missing",
          confidence: 0,
          evidence: null,
        },
        {
          name: "SQL",
          status: "Missing",
          confidence: 0,
          evidence: null,
        },
        {
          name: "REST API",
          status: "Weak",
          confidence: 0.4,
          evidence: {
            repo: "starter-api",
            description: "Basic endpoints, no comprehensive design",
            commits: 25,
            ownership: "Primary owner",
            language: "JavaScript",
            lastUpdated: "2 months ago",
            whyItMatters: "API patterns are basic, would need significant development",
          },
        },
      ],
    },
    context: {
      teamwork: {
        raw: 55,
        weighted: 11,
        signals: ["Limited collaborative projects visible", "Mostly individual work"],
        evidenceSources: ["GitHub activity shows solo work only"],
      },
      communication: {
        raw: 60,
        weighted: 15,
        signals: ["Design-focused portfolio", "Limited technical writing"],
        evidenceSources: ["Portfolio site", "Repository documentation sparse"],
      },
      adaptability: {
        raw: 65,
        weighted: 19.5,
        signals: ["Some variety in projects", "Recent activity increase"],
        evidenceSources: ["Project type distribution"],
      },
      ownership: {
        raw: 50,
        weighted: 12.5,
        signals: ["Sparse commit history", "No long-term maintained projects"],
        evidenceSources: ["Commit patterns", "Repository age vs activity"],
      },
    },
    finalScore: 52,
    explanation: {
      summary:
        "Insufficient evidence for required skills. Multiple core capabilities missing or below threshold. Does not meet capability gate.",
      oneLiner: "Insufficient technical evidence, fails capability gate.",
      strengths: ["Design sensibility visible in portfolio"],
      weaknesses: ["TypeScript, AWS, SQL all missing", "Sparse GitHub activity", "No production-level code evidence"],
      flags: ["Fails capability gate", "Skill claims exceed demonstrated usage", "Low activity confidence"],
    },
    risks: [
      {
        type: "missing_proof",
        description: "No evidence of TypeScript usage in any public repository",
        severity: "high",
      },
      {
        type: "missing_proof",
        description: "No evidence of AWS or cloud infrastructure experience",
        severity: "high",
      },
      {
        type: "missing_proof",
        description: "No evidence of SQL or database work",
        severity: "high",
      },
      {
        type: "conflicting",
        description: "Portfolio claims full-stack experience but GitHub shows frontend-only",
        severity: "medium",
      },
    ],
    interviewGuidance: {
      questionsToAsk: [],
      areasToProbe: [],
      suggestedTask: {
        type: "written_reasoning",
        description: "N/A — candidate does not pass capability gate",
      },
    },
    evidenceTimeline: [
      { year: 2023, skills: ["JavaScript", "React"], velocity: "slowing" },
      { year: 2024, skills: ["JavaScript", "React"], velocity: "slowing" },
    ],
  },
]

export const analysisMetadata = {
  runtimeMs: 842,
  candidatesAnalyzed: 4,
  confidenceNote: "Scores reflect public, verifiable signals only.",
}
