import type { DemoStep } from "@/components/guided-demo-overlay"

// Comprehensive demo job description
export const DEMO_JOB_DESCRIPTION = `Senior Frontend Engineer - Growth Team

About the Role:
We're looking for a Senior Frontend Engineer to join our Growth team. You'll be building high-performance, accessible web experiences that directly impact our key metrics.

Requirements:
- 5+ years of experience with React.js and modern frontend development
- Strong TypeScript skills (must have)
- Experience with Next.js, including SSR/SSG patterns
- Proven track record of performance optimization (Core Web Vitals)
- Experience with testing (Jest, React Testing Library, Cypress)
- Understanding of accessibility standards (WCAG 2.1 AA)
- CI/CD experience (GitHub Actions preferred)
- Strong communication skills and ability to mentor junior engineers

Nice to have:
- Experience with design systems
- GraphQL experience
- Previous work at high-growth startups

Compensation: $180,000 - $240,000 + equity
Location: San Francisco or Remote (US)
`

// Demo candidates with diverse outcomes
export const DEMO_CANDIDATES_FULL = [
  {
    id: "demo-elena",
    name: "Elena Rodriguez",
    email: "elena@example.com",
    github: "elenarodriguez",
    portfolio: "https://elena.dev",
    roleType: "engineer" as const,
    salaryExpectation: { min: 190000, max: 220000, target: 205000, currency: "USD" },
    resumeText: `
ELENA RODRIGUEZ
Staff Frontend Engineer | San Francisco, CA

EXPERIENCE

Meta (2019-Present) - Staff Frontend Engineer
• Architected React-based design system serving 200+ engineers with comprehensive TypeScript types
• Led performance initiative reducing First Contentful Paint by 60% across Instagram web
• Designed A/B testing framework with React hooks, running 50+ experiments monthly
• Published internal RFC for micro-frontend architecture, adopted by 3 product teams
• Mentored 8 engineers, with 3 promoted to senior level

Google (2016-2019) - Senior Software Engineer
• Built accessibility tools for Google Workspace achieving WCAG AAA compliance
• Developed Next.js-based internal tools with SSR and ISR caching
• Created automated visual regression testing pipeline with 99.9% accuracy
• Contributed to open-source React testing utilities (2k+ GitHub stars)

SKILLS
React, TypeScript, Next.js, GraphQL, Performance Optimization, Design Systems, 
Accessibility (WCAG), Testing (Jest, Playwright, Cypress), CI/CD (GitHub Actions)

EDUCATION
MS Computer Science, UC Berkeley
BS Computer Science, Stanford University

PUBLICATIONS
• "Scaling Design Systems at Meta" - React Conf 2023
• "Micro-frontends in Practice" - Frontend Masters workshop
    `,
    // Expected outcome: STRONG HIRE (78 score)
    // - Verified artifacts: React design system, performance work
    // - Strong signals: Testing framework, mentorship
    // - Comp fit: In band (target $205k vs $180-240k budget)
  },
  {
    id: "demo-sarah",
    name: "Sarah Chen",
    email: "sarah@example.com",
    github: "sarahchen-dev",
    portfolio: "https://sarahchen.io",
    roleType: "engineer" as const,
    salaryExpectation: { min: 175000, max: 200000, target: 185000, currency: "USD" },
    resumeText: `
SARAH CHEN
Senior Frontend Engineer | New York, NY

EXPERIENCE

Stripe (2021-Present) - Senior Frontend Engineer
• Led redesign of Stripe Dashboard using React 18 and TypeScript, improving load times by 40%
• Architected component library used by 15+ teams, with 95% test coverage using Jest
• Mentored 4 junior engineers and established code review guidelines
• Implemented performance monitoring using Core Web Vitals, achieving 98+ Lighthouse scores

Airbnb (2018-2021) - Frontend Engineer
• Built booking flow using React hooks and Next.js with SSR
• Reduced bundle size by 35% through code splitting and lazy loading
• Collaborated with design team on accessibility improvements, achieving WCAG AA compliance
• Set up CI/CD pipelines with GitHub Actions for automated testing and deployment

SKILLS
React.js, TypeScript, Next.js, Node.js, GraphQL, Jest, Vitest, Playwright, Tailwind CSS

EDUCATION
BS Computer Science, Stanford University
    `,
    // Expected outcome: HIRE (62 score)
    // - Verified artifacts: Dashboard work, component library
    // - Strong signals: Performance, testing
    // - Comp fit: In band (slight underask = good deal)
  },
  {
    id: "demo-marcus",
    name: "Marcus Johnson",
    email: "marcus@example.com",
    github: "marcusj-code",
    portfolio: "",
    roleType: "engineer" as const,
    salaryExpectation: { min: 160000, max: 190000, target: 175000, currency: "USD" },
    resumeText: `
MARCUS JOHNSON
Frontend Developer | Austin, TX

EXPERIENCE

TechStartup Inc (2022-Present) - Frontend Developer
• Developed web applications using React and JavaScript
• Worked on improving user interfaces
• Participated in code reviews

Freelance (2020-2022)
• Built websites for small businesses
• Used various technologies including React

SKILLS
React, JavaScript, HTML, CSS, Git

EDUCATION
Bootcamp Graduate, General Assembly (2020)
    `,
    // Expected outcome: NO HIRE (28 score, filtered)
    // - Missing: TypeScript (claims none, has none)
    // - Missing: Next.js, Testing, CI/CD
    // - Weak signals: Vague experience, no metrics
    // - Comp fit: In band but doesn't matter (filtered by gate)
    // - Why not hired: Missing core skills, no proof of senior-level work
  },
  {
    id: "demo-priya",
    name: "Priya Sharma",
    email: "priya@example.com",
    github: "priyasharma-dev",
    portfolio: "https://priya.codes",
    roleType: "engineer" as const,
    salaryExpectation: { min: 250000, max: 280000, target: 265000, currency: "USD" },
    resumeText: `
PRIYA SHARMA
Principal Engineer | San Francisco, CA

EXPERIENCE

Netflix (2018-Present) - Principal Engineer
• Led frontend architecture for Netflix's streaming platform serving 200M+ users
• Built React component library with TypeScript, used across 50+ teams
• Reduced time-to-interactive by 45% through advanced code splitting strategies
• Designed GraphQL federation layer handling 10B+ queries/day
• Led accessibility initiative achieving WCAG AAA across all surfaces

Amazon (2014-2018) - Senior Software Engineer
• Built Next.js-based e-commerce features for Prime Video
• Implemented real-time inventory system with React and WebSockets
• Created testing framework used by 200+ engineers

SKILLS
React, TypeScript, Next.js, GraphQL, System Design, Performance, Accessibility, 
Node.js, AWS, Kubernetes, Testing (Jest, Cypress, Playwright)

EDUCATION
MS Computer Science, MIT
BS Computer Science, IIT Delhi
    `,
    // Expected outcome: POSSIBLE (45 score) despite high skills
    // - Skills are excellent (would be Strong Hire otherwise)
    // - BUT: Comp fit = WAY ABOVE (asking $265k vs $240k max = -8% XS penalty)
    // - Shows how compensation misalignment affects scoring
  },
  {
    id: "demo-alex",
    name: "Alex Rivera",
    email: "alex@example.com",
    github: "alexrivera-ux",
    portfolio: "https://alexrivera.design",
    roleType: "designer" as const,
    salaryExpectation: { min: 140000, max: 170000, target: 155000, currency: "USD" },
    resumeText: `
ALEX RIVERA
Senior Product Designer | Remote

EXPERIENCE

Figma (2020-Present) - Senior Product Designer
• Led design system for Figma's developer tools
• Created component documentation and accessibility guidelines
• Collaborated with engineering on React component implementations

Notion (2018-2020) - Product Designer
• Designed database features used by millions
• Built design system from scratch

SKILLS
UI/UX Design, Figma, Design Systems, Prototyping, User Research, Accessibility,
HTML, CSS, Basic React

EDUCATION
BFA Graphic Design, RISD
    `,
    // Expected outcome: RISKY (22 score, filtered)
    // - Wrong role type: Designer applying to Frontend Engineer role
    // - Some overlap (design systems, accessibility) but missing core engineering skills
    // - Why not hired: Role mismatch, missing React/TypeScript depth
  },
]

// Demo job configuration
export const DEMO_JOB_CONFIG = {
  title: "Senior Frontend Engineer",
  description: DEMO_JOB_DESCRIPTION,
  roleTitle: "Senior Frontend Engineer",
  location: "San Francisco",
  seniority: "Senior" as const,
  industry: "Enterprise SaaS",
  companySize: "201-1000" as const,
  budget: { min: 180000, max: 240000, currency: "USD" },
  skills: [
    { name: "React", weight: 18, priority: "core" as const, category: "frontend" },
    { name: "TypeScript", weight: 16, priority: "core" as const, category: "frontend" },
    { name: "Next.js", weight: 12, priority: "required" as const, category: "frontend" },
    { name: "Testing", weight: 10, priority: "required" as const, category: "process" },
    { name: "Performance", weight: 10, priority: "required" as const, category: "frontend" },
    { name: "Accessibility", weight: 8, priority: "required" as const, category: "frontend" },
    { name: "CI/CD", weight: 8, priority: "preferred" as const, category: "infrastructure" },
    { name: "GraphQL", weight: 6, priority: "preferred" as const, category: "backend" },
    { name: "Design Systems", weight: 6, priority: "preferred" as const, category: "design" },
    { name: "Mentorship", weight: 6, priority: "preferred" as const, category: "soft" },
  ],
}

// Compensation benchmark result for demo
export const DEMO_COMP_BENCHMARK = {
  p10: 175000,
  p50: 220000,
  p90: 280000,
  confidence: "HIGH" as const,
  currency: "USD",
  matchedRoles: 5,
  drivers: [
    "React premium (+2%)",
    "TypeScript premium (+3%)",
    "Senior level baseline",
    "San Francisco market (top tier)",
    "Enterprise SaaS industry (+2%)",
  ],
  sourceNotes: ["Matched 5 similar roles", "Based on Levels.fyi, Glassdoor, LinkedIn Salary data"],
}

// Generate the comprehensive demo steps
export function generateDemoSteps(actions: {
  loadJobDescription: () => Promise<void>
  extractSkills: () => Promise<void>
  showCompBenchmark: () => Promise<void>
  loadCandidates: () => Promise<void>
  runAnalysis: () => Promise<void>
  navigateToResults: () => Promise<void>
  selectCandidate: (id: string) => Promise<void>
  showEvidenceTab: () => Promise<void>
  showWhyNotHired: () => Promise<void>
  showCompFit: () => Promise<void>
  showInterviewPack: () => Promise<void>
}): DemoStep[] {
  return [
    // INTRO PHASE (2 steps)
    {
      id: "intro-1",
      phase: "intro",
      title: "Welcome to FORGE",
      subtitle: "Proof-First Hiring in 60 Seconds",
      narration:
        "FORGE is a hiring platform that analyzes candidates based on VERIFIABLE PROOF, not just resume claims. We'll walk through a complete hiring flow: from job description to final verdicts, showing you every feature along the way.",
      duration: 5000,
    },
    {
      id: "intro-2",
      phase: "intro",
      title: "The FORGE Algorithm",
      subtitle: "CS × XS + LV with Smart Gate (τ)",
      narration:
        "FORGE scores candidates using three components: Capability Score (CS) from skill evidence, Context Score (XS) from soft signals like teamwork and communication, and Learning Velocity (LV) bonus for growth. A smart gate (τ = 40%) filters out candidates without enough verified proof.",
      visual: "scoring",
      duration: 6000,
    },

    // JOB PHASE (4 steps)
    {
      id: "job-1",
      phase: "job",
      title: "Step 1: Define the Role",
      subtitle: "Paste Your Job Description",
      narration:
        "We start by pasting a job description. FORGE will extract skills, weights, and requirements automatically. This JD is for a Senior Frontend Engineer at a growth-stage company.",
      duration: 4000,
      action: actions.loadJobDescription,
    },
    {
      id: "job-2",
      phase: "job",
      title: "Skill Extraction",
      subtitle: "AI-Powered JD Analysis",
      narration:
        "FORGE extracts 10 skills from the JD: React (18%), TypeScript (16%), Next.js (12%), and others. Each skill is weighted by importance. Core skills are must-haves, while preferred skills boost the score but aren't required.",
      visual: "job-extraction",
      duration: 5000,
      action: actions.extractSkills,
    },
    {
      id: "job-3",
      phase: "job",
      title: "Compensation Benchmarking",
      subtitle: "Know the Market Before You Hire",
      narration:
        "Based on 'Senior Frontend Engineer' in San Francisco with React/TypeScript skills, FORGE benchmarks compensation: P10 = $175k, P50 = $220k, P90 = $280k. The job's budget ($180-240k) is set accordingly. This will be used to evaluate candidate comp fit later.",
      visual: "comp-fit",
      duration: 6000,
      action: actions.showCompBenchmark,
    },
    {
      id: "job-4",
      phase: "job",
      title: "Proof Tier System",
      subtitle: "Not All Evidence Is Equal",
      narration:
        "FORGE ranks evidence on 5 tiers: Verified Artifact (1.0x) for shipped code, Strong Signals (0.7x) for contributions, Weak Signals (0.4x) for partial matches, Claim Only (0.15x) for unverified resume claims, and None (0x) for missing skills. This is the core innovation.",
      visual: "proof-tiers",
      duration: 6000,
    },

    // CANDIDATES PHASE (3 steps)
    {
      id: "candidates-1",
      phase: "candidates",
      title: "Step 2: Add Candidates",
      subtitle: "5 Diverse Applicants",
      narration:
        "We're loading 5 candidates with different backgrounds: Elena (Staff at Meta), Sarah (Senior at Stripe), Marcus (Bootcamp grad), Priya (Principal at Netflix but overpriced), and Alex (Designer, wrong role). Each has GitHub, portfolio, resume, and salary expectations.",
      duration: 5000,
      action: actions.loadCandidates,
    },
    {
      id: "candidates-2",
      phase: "candidates",
      title: "Multi-Signal Intake",
      subtitle: "GitHub + Portfolio + Resume + More",
      narration:
        "FORGE ingests multiple data sources per candidate: GitHub repos (code evidence), portfolio (projects), resume text (claims to verify), LinkedIn, and salary expectations. This creates a complete picture for evidence-based scoring.",
      visual: "evidence",
      duration: 5000,
    },
    {
      id: "candidates-3",
      phase: "candidates",
      title: "Salary Expectations",
      subtitle: "Comp Fit Is a Signal, Not a Gate",
      narration:
        "Each candidate provides salary expectations. Elena asks $190-220k (in band), Sarah asks $175-200k (slight underask), Marcus asks $160-190k (in band), Priya asks $250-280k (way above budget), Alex asks $140-170k (in band but wrong role). Comp fit adjusts XS score by ±8%.",
      visual: "comp-fit",
      duration: 5000,
    },

    // ANALYSIS PHASE (3 steps)
    {
      id: "analysis-1",
      phase: "analysis",
      title: "Step 3: Run Analysis",
      subtitle: "FORGE Algorithm in Action",
      narration:
        "Clicking 'Run Analysis' triggers the FORGE algorithm. For each candidate, we: 1) Fetch GitHub data, 2) Extract evidence for each skill, 3) Assign proof tiers, 4) Calculate CS/XS/LV, 5) Apply comp fit adjustment, 6) Check gate (τ = 40%), 7) Assign verdict.",
      duration: 5000,
      action: actions.runAnalysis,
    },
    {
      id: "analysis-2",
      phase: "analysis",
      title: "Evidence Verification",
      subtitle: "Anti-Hallucination Built In",
      narration:
        "FORGE verifies every evidence snippet against the source. If the LLM claims 'built React dashboard' but GitHub doesn't show it, the evidence is downgraded. This prevents AI hallucinations from inflating scores. Only real, verifiable proof counts.",
      visual: "proof-tiers",
      duration: 5000,
    },
    {
      id: "analysis-3",
      phase: "analysis",
      title: "Pool-Relative Scoring",
      subtitle: "Smart Gate Adjusts to Your Pool",
      narration:
        "The gate threshold (τ) can auto-adjust based on your candidate pool quality. If all candidates are weak, τ lowers to still surface the best. If all are strong, τ raises to be more selective. Default is 40% verified evidence required.",
      duration: 5000,
    },

    // RESULTS PHASE (6 steps)
    {
      id: "results-1",
      phase: "results",
      title: "Step 4: Decision Cockpit",
      subtitle: "Ranked Candidates with Verdicts",
      narration:
        "The results page shows all candidates ranked by FORGE score. Elena leads with 78 (Strong Hire), Sarah follows at 62 (Hire), Priya at 45 (Possible despite skills), Marcus at 28 (No Hire), Alex at 22 (No Hire). Green = proceed, red = filtered by gate.",
      visual: "verdict",
      duration: 6000,
      action: actions.navigateToResults,
    },
    {
      id: "results-2",
      phase: "results",
      title: "Elena Rodriguez: Strong Hire",
      subtitle: "Score 78 | All Proof Verified",
      narration:
        "Elena scores highest because she has VERIFIED ARTIFACTS: React design system at Meta (1.0x), performance work with metrics (1.0x), TypeScript throughout (1.0x), testing frameworks (0.7x). Her comp ask of $205k is in the $180-240k band. Perfect candidate.",
      duration: 5000,
      action: () => actions.selectCandidate("demo-elena"),
    },
    {
      id: "results-3",
      phase: "results",
      title: "Evidence Receipts",
      subtitle: "Proof Grouped by Skill",
      narration:
        "Click 'Evidence' tab to see proof receipts grouped by skill. For React: 3 verified repos with code snippets. For TypeScript: component library with types. Each receipt shows proof tier, source link, and impact. This is the 'show your work' of hiring.",
      visual: "evidence",
      duration: 5000,
      action: actions.showEvidenceTab,
    },
    {
      id: "results-4",
      phase: "results",
      title: "Marcus Johnson: No Hire",
      subtitle: "Score 28 | Filtered by Gate",
      narration:
        "Marcus fails the τ gate. He claims 'React experience' but GitHub shows only HTML/CSS websites. No TypeScript repos at all despite claiming it. No testing, no CI/CD, no metrics. Resume is vague ('worked on improving UI'). Only 15% of claims are verifiable.",
      duration: 5000,
      action: () => actions.selectCandidate("demo-marcus"),
    },
    {
      id: "results-5",
      phase: "results",
      title: "Why Not Hired Panel",
      subtitle: "Actionable Rejection Feedback",
      narration:
        "For rejected candidates, FORGE generates actionable feedback: 'Missing TypeScript proof (0%). Need: Ship a TypeScript project. Missing Testing proof (0%). Need: Add Jest tests to a repo.' This helps candidates improve for next time. Includes a copy-paste rejection email.",
      visual: "why-not-hired",
      duration: 6000,
      action: actions.showWhyNotHired,
    },
    {
      id: "results-6",
      phase: "results",
      title: "Priya Sharma: Possible (Comp Issue)",
      subtitle: "Score 45 | Skills Great, Price Wrong",
      narration:
        "Priya has EXCELLENT skills (would be 70+ otherwise) but asks $265k against $240k max budget. Comp fit = 'Way Above' applies -8% XS penalty. She's ranked 'Possible' not 'Strong Hire'. Shows how FORGE uses comp as a signal, not just skills.",
      duration: 5000,
      action: () => actions.selectCandidate("demo-priya"),
    },

    // FEATURES PHASE (4 steps)
    {
      id: "features-1",
      phase: "features",
      title: "Comp Fit Badge",
      subtitle: "Salary Alignment at a Glance",
      narration:
        "Every candidate shows a Comp Fit badge: green 'In Band' (±2% XS), yellow 'Slightly Above' (-2% XS), or red 'Way Above' (-8% XS). This helps prioritize candidates who fit both skill AND budget requirements. Elena and Sarah are green. Priya is red.",
      visual: "comp-fit",
      duration: 5000,
      action: actions.showCompFit,
    },
    {
      id: "features-2",
      phase: "features",
      title: "Interview Pack Generator",
      subtitle: "Tailored Questions per Candidate",
      narration:
        "FORGE generates interview questions based on gaps in evidence. For Elena: probe design system scale, verify mentorship claims. For Sarah: dig into performance metrics. Questions are skill-specific and designed to verify what the algorithm couldn't verify from code alone.",
      duration: 5000,
      action: actions.showInterviewPack,
    },
    {
      id: "features-3",
      phase: "features",
      title: "Hiring Packet Export",
      subtitle: "Share with Your Team",
      narration:
        "Export a complete hiring packet as PDF or JSON: candidate ranking, evidence receipts, interview questions, comp fit analysis, and verdicts. Share with hiring managers, recruiters, or approval chain. Everything is documented and auditable.",
      duration: 5000,
    },
    {
      id: "features-4",
      phase: "features",
      title: "Email Templates",
      subtitle: "Rejection + Invite Emails Ready",
      narration:
        "One-click email generation: personalized rejection emails with improvement suggestions for filtered candidates, and interview invite emails for shortlisted ones. Based on the analysis, so every email is specific and actionable.",
      duration: 5000,
    },

    // OUTRO PHASE (2 steps)
    {
      id: "outro-1",
      phase: "outro",
      title: "The FORGE Difference",
      subtitle: "Proof Over Claims",
      narration:
        "You've seen FORGE analyze 5 candidates in seconds: 2 proceed (Elena, Sarah), 1 is borderline due to comp (Priya), 2 are filtered for missing proof (Marcus, Alex). Every decision is backed by verifiable evidence, transparent scoring, and actionable feedback.",
      visual: "verdict",
      duration: 6000,
    },
    {
      id: "outro-2",
      phase: "outro",
      title: "Start Hiring Smarter",
      subtitle: "Your Turn",
      narration:
        "That's FORGE: proof-first hiring that eliminates guesswork. Paste your JD, add your candidates, and let the algorithm surface the best fits with receipts. No more gut feelings, no more resume games. Just verified capability, transparent scoring, and confident decisions.",
      duration: 5000,
    },
  ]
}

// Write demo data to localStorage
export function writeDemoDataToLocalStorage() {
  // Write job config
  localStorage.setItem("forge_job_config", JSON.stringify(DEMO_JOB_CONFIG))

  // Write candidates
  localStorage.setItem("forge_candidates", JSON.stringify(DEMO_CANDIDATES_FULL))

  // Write comp benchmark
  localStorage.setItem("forge_comp_benchmark", JSON.stringify(DEMO_COMP_BENCHMARK))
}
