# FORGE Hiring Platform — Complete README

## Project Overview

**FORGE** is an AI-powered hiring platform that uses **proof-first** evaluation to assess candidates based on **verifiable artifacts** (GitHub, portfolio, writing, resume) rather than subjective impressions or claims. It combines **GitHub signals**, **context scoring**, and **learning velocity** into a single FORGE score that predicts hiring fit.

**Core Philosophy:** Hire based on what candidates have *shipped*, not what they *claim*.

---

## The FORGE Algorithm

### Formula

```txt
FORGE = CS_rank × (0.6 + 0.4×XS) + 0.05×LV

Where:
  CS_rank = Ranked capability score (weighted average of required + optional skills)
  XS = Context score (4 signals: teamwork, communication, adaptability, ownership)
  LV = Learning velocity bonus (+0 to +0.05)
  
Gate: CS_required ≥ τ (tau) = 40% (default, adjustable)
  Only REQUIRED skills count toward the gate
  Optional/bonus skills boost CS_rank but don't gate
```

### Three Core Components

---

#### 1) CS (Capability Score) — 0 to 100%

**What it measures:** Can this candidate actually do the job?

**How it works:**

* Each skill is scored based on **proof tiers** (quality of evidence)
* Final CS = average of all skill scores, capped at 100%
* Uses tier-based weighting to avoid gaming (can't get 100% from claims alone)

##### Proof Tiers & Multipliers

| Tier                  | Multiplier | Definition                                              | Example                                                     |
| --------------------- | ---------: | ------------------------------------------------------- | ----------------------------------------------------------- |
| **Verified Artifact** |       1.0x | Owned repo, 10+ commits, shipped to production          | Your own React app with 200+ stars                          |
| **Strong Signal**     |       0.7x | Contributed meaningfully to repos, corroborated details | 15 commits across different repos, documented contributions |
| **Weak Signal**       |       0.4x | Some evidence but not definitive, partial context       | Mentioned in repo description, few commits                  |
| **Claim Only**        |      0.15x | Resume/portfolio claim with NO GitHub verification      | "Expert in Node.js" but no repos prove it                   |
| **Unverified**        |         0x | No evidence found                                       | Skill not mentioned anywhere                                |

##### Skill Status Mapping

* **Proven** (≥0.60) — Green badge, candidate has strong evidence
* **Weak** (0.20–0.59) — Yellow badge, some evidence but not conclusive
* **Missing** (<0.20) — Red badge, insufficient proof

##### Two Categories of Skills

1. **Required Skills** — Gate the candidate (must pass CS_required ≥ τ)
2. **Optional Skills** — Boost ranking but don't gate (bonus skills)

##### CS Calculation

```txt
CS_required = average of all required skill scores
CS_optional = average of all optional skill scores (if any)
CS_rank = clamp(CS_required + 0.25×CS_optional, 0, 1)
  (25% bonus from optional skills, capped at 100%)
```

---

#### 2) XS (Context Score) — 0 to 100%

**What it measures:** How does this person work? Are they collaborative, communicative, adaptable, and driven?

##### 4 Signals Analyzed from GitHub

1. **Ownership (25%)**

   * Repos you own vs contributed to
   * Stars on your projects
   * Recent commits (within 6 months)
   * Formula: `(ownedRepos × 2 + starCount / 100) / totalRepos`
   * Range: 0–1.0

2. **Communication (25%)**

   * % of repos with detailed descriptions
   * Commit message quality (length, clarity)
   * README documentation (technical depth)
   * Formula: `docsLength / maxDocsLength`
   * Range: 0–1.0

3. **Adaptability (25%)**

   * Number of distinct programming languages used
   * Diversity of tools/frameworks per language
   * Tech stack breadth
   * Formula: `uniqueLanguages / 10` (capped at 1.0)
   * Range: 0–1.0

4. **Teamwork (25%)**

   * Repos you contributed to (not owned)
   * Follower count (social proof)
   * Pull requests to others' repos
   * Formula: `(contributedRepos × 2 + followers / 100) / totalRepos`
   * Range: 0–1.0

**XS Final:** `Average of 4 signals`

##### Salary Adjustment

* If candidate salary expectations are **in-band** (±10% of benchmark): XS unchanged
* **Above band**: XS reduced by 2–8% (based on overage %)
* **Below band**: XS boosted by 1–3% (cost-efficiency bonus)

---

#### 3) LV (Learning Velocity) — +0 to +0.05 bonus

**What it measures:** Is this person actively learning and growing?

##### Signals for LV

* Recent language adoption (learned new language in past 6 months): +0.01
* Recent framework adoption (picked up new framework): +0.01
* Recent library usage (using latest versions): +0.01
* Open source contributions (in past 3 months): +0.01
* Growing star ratio (projects gaining stars): +0.01

**Max total:** +0.05 (5% bonus to final score)

**Purpose:** Reward candidates showing trajectory and upskilling

---

### Gate: Required Skills Check

```txt
if CS_required ≥ τ:
  status = "ranked" (Auto-pass or review)
else:
  status = "filtered" (Auto-reject / Below τ)
```

**τ (Tau) Threshold:**

* Default: 40% (0.4)
* Adjustable: 20% (lenient) → 80% (strict)
* **Only required skills count** toward gate (optional skills ignored)
* Prevents "nice-to-have" skills from blocking candidates

---

### Final Verdict Mapping (Based on FORGE score)

| Score | Verdict         | Reasoning                                                 |
| ----: | --------------- | --------------------------------------------------------- |
|   ≥60 | **Strong Hire** | Clear fit, ship ready, all required skills proven         |
| 45–59 | **Hire**        | Good fit, some required skills weak but compensated by XS |
| 30–44 | **Possible**    | Mixed signals, could work with mentoring                  |
| 15–29 | **Risky**       | High potential but missing core competencies              |
|   <15 | **No Hire**     | Insufficient proof of required skills                     |

**CompFit Badge** (Compensation Check):

* ✅ **In-band** — Salary within benchmark range
* ⚠️ **Slightly above** — 10–20% above benchmark
* ❌ **Way above** — >20% above benchmark (may need negotiation)

---

## Platform Architecture

### Tech Stack

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
* **Backend:** Next.js API Routes, Server Actions
* **Data:** localStorage (for session storage), JSON
* **APIs:**

  * GitHub REST API v3 (public repos, user data)
  * OpenAI API (LLM for JD parsing, skill extraction, verdict reasoning)
* **External Services:**

  * GitHub for profile + repo verification
  * LLM (GPT-4) for analysis and recommendations

### File Structure

```txt
FORGE/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind config
│   ├── job/
│   │   └── page.tsx          # Job description setup
│   ├── candidates/
│   │   └── page.tsx          # Candidate management
│   ├── results/
│   │   └── page.tsx          # Decision cockpit
│   ├── api/
│   │   ├── candidates/analyze/route.ts    # Main analysis engine
│   │   ├── job/extract-skills/route.ts    # JD parsing & skill extraction
│   │   ├── verify-link/route.ts           # Link verification
│   │   └── ...
│
├── lib/
│   ├── scoring.ts            # FORGE algorithm (CS, XS, LV, gate)
│   ├── skills.ts             # Skill definitions, synonyms, clusters
│   ├── github.ts             # GitHub API client
│   ├── types.ts              # TypeScript interfaces
│   ├── verification.ts       # Proof tier detection
│   ├── signals-extract.ts    # XS signal extraction
│   ├── forge/
│   │   └── core.ts           # Core FORGE logic
│   ├── hiring-packet.tsx     # Generate hiring memo
│   ├── why-not-hired.ts      # Rejection reasoning
│   ├── portfolio-extract.ts  # Portfolio link extraction
│   └── ...
│
├── components/
│   ├── evidence-heatmap.tsx  # Skill matrix display
│   ├── guided-demo-overlay.tsx # 21-step walkthrough
│   ├── link-verifier-panel.tsx # Link validation UI
│   └── ui/                   # shadcn/ui components
│
└── public/
    └── images/
```

---

## Data Models & Types

### Job Configuration

```ts
interface JobConfig {
  jd: string;                    // Raw job description
  extractedSkills: ExtractedSkill[];
  gateThreshold: number;         // τ (0.2–0.8)
  compensationData?: {
    min: number;
    max: number;
    currency: string;
    benchmark: CompensationBenchmark;
  };
}

interface ExtractedSkill {
  name: string;
  importance: "core" | "required" | "preferred" | "bonus";
  isRequired: boolean;           // Toggle: required vs optional
  weight: number;               // % contribution to CS
  category: string;             // frontend, backend, infra, etc
}
```

### Candidate

```ts
interface Candidate {
  name: string;
  github: string;               // GitHub username
  portfolio?: string;           // Portfolio URL
  roles?: string[];             // Role types
  resume?: {
    text: string;
    uploadedAt: Date;
    isScanned: boolean;
  };
  linkedinText?: string;        // Manual LinkedIn paste
  writingLinks?: string[];      // Blog, articles, design docs
  salaryExpectation?: {
    min: number;
    max: number;
    currency: string;
  };
  extracurricular?: string;
}
```

### Analysis Result

```ts
interface CandidateAnalysis {
  candidateName: string;
  forgeScore: number;           // Final 0–100 score
  
  // Components
  capabilityScore: number;      // CS (0–1)
  capabilityScoreRequired: number;  // CS_required (0–1)
  capabilityScoreOptional: number;  // CS_optional (0–1)
  contextScore: number;         // XS (0–1)
  learningVelocityBonus: number;    // LV (+0 to +0.05)
  
  // Gate status
  gateStatus: "ranked" | "filtered";
  passedGate: boolean;
  
  // Verdict
  verdict: "strong-hire" | "hire" | "possible" | "risky" | "no-hire";
  verdictReasoning: string;
  
  // Skills breakdown
  skills: SkillScore[];
  
  // Evidence
  evidenceReceipts: EvidenceReceipt[];
  proofConfidence: number;      // 0–100%
  
  // Context
  signals: {
    ownership: number;
    communication: number;
    adaptability: number;
    teamwork: number;
  };
  
  // Compensation
  compFit: "in-band" | "slightly-above" | "way-above";
  salaryNote: string;
  
  // Hiring memo
  whyHired?: string;
  whyNotHired?: string;
  nextSteps?: string[];
}

interface SkillScore {
  name: string;
  score: number;                // 0–1 (0–100%)
  status: "proven" | "weak" | "missing";
  weight: number;               // % contribution
  isRequired: boolean;
  bestProofTier: ProofTier;
  evidenceCount: number;
}

interface EvidenceReceipt {
  skillName: string;
  proofTier: ProofTier;
  title: string;
  description: string;
  whyMatters: string;
  url?: string;
  metrics?: {
    stars?: number;
    commits?: number;
    lines?: number;
    forks?: number;
  };
  impact: "high" | "medium" | "low";
}

type ProofTier = 
  | "verified_artifact"
  | "strong_signal"
  | "weak_signal"
  | "claim_only"
  | "unverified";
```

---

## Key Features & Flows

### Feature 1: Job Description Setup (`/job`)

**Steps:**

1. Paste job description (or load demo)
2. **Extract Skills**: LLM parses JD → extracts required skills with importance levels
3. **Review Skills**:

   * Mark which are REQUIRED vs OPTIONAL
   * Adjust weights and importance
   * Auto-mark top 5 as required
4. **Critique JD**: LLM flags issues (vague language, bias terms, missing seniority)
5. **Compensation Benchmarking**:

   * Select location, seniority, role
   * Get P10/P50/P90 salary bands
   * Compare against market
   * Set budget range
6. **Gate Threshold**: Adjust τ slider (20%–80%)
7. **Save & Next**: Job config persisted to localStorage

**Data Flow:**

```txt
JD text → OpenAI API → Structured skills + critique → Stored in job config
```

---

### Feature 2: Candidate Management (`/candidates`)

**Steps:**

1. Add candidates manually or load demo (5 sample candidates)
2. **Per-Candidate Input:**

   * GitHub username (validated + API fetched)
   * Portfolio URL
   * Resume (PDF/DOCX upload or paste)
   * LinkedIn text (manual paste)
   * Writing links (blog, articles, design docs)
   * Salary expectations
   * Role type and extracurricular achievements
3. **Real-time Validation:**

   * GitHub username normalization (remove spaces, etc)
   * GitHub profile fetch (avatar, bio, repos)
   * Resume text extraction (with OCR detection)
   * Link reachability check
4. **Status Badges:**

   * ✓ Valid → GitHub fetched successfully
   * ⏳ Validating → API call in progress
   * ⚠️ Warning → Limited data (no repos, scanned PDF, etc)
   * ✗ Invalid → GitHub not found
5. **Add/Remove**: Unlimited candidates, remove any with × button
6. **Run Analysis**: Button disabled until ≥1 valid candidate

**Data Flow:**

```txt
Candidate form → GitHub API, Resume parse, Portfolio extract → Candidate object → Stored in localStorage
```

---

### Feature 3: Analysis Engine (`/api/candidates/analyze`)

**The core FORGE scoring:**

#### Step 1: GitHub Data Extraction

* Fetch user profile (followers, public repos)
* Fetch top 30 repos (stars, commits, languages, descriptions)
* Calculate ownership % (repos owned vs contributed)
* Extract communication signals (README length, commit messages)

#### Step 2: Skill Matching

* For each required/optional skill:

  * Search candidate's repos for matches (exact name + synonyms)
  * Rank matched repos by relevance (stars, language, commits)
  * Assign proof tier based on evidence quality
  * Calculate skill score with tier multiplier
* Apply skill clusters/synonyms (Node.js → REST API synergy)

#### Step 3: Capability Score (CS)

```txt
For each skill:
  evidenceScore = tierMultiplier × weightedAverageOfRepos
  
CS_required = average(required skills)
CS_optional = average(optional skills)
CS_rank = clamp(CS_required + 0.25×CS_optional, 0, 1)
```

#### Step 4: Context Score (XS)

* Ownership = `(ownedRepos×2 + stars/100) / totalRepos`
* Communication = `docsLength / maxDocsLength`
* Adaptability = `uniqueLanguages / 10`
* Teamwork = `(contributedRepos×2 + followers/100) / totalRepos`
* XS = average(4 signals)
* Adjust XS for salary expectations (±2–8%)

#### Step 5: Learning Velocity (LV)

* Detect recent language adoption: +0.01
* Detect recent framework adoption: +0.01
* Check latest lib usage: +0.01
* Check open source contributions: +0.01
* Check growing star ratio: +0.01
* LV = sum(bonuses), capped at +0.05

#### Step 6: Gate Check

```txt
if CS_required ≥ gateThreshold:
  gateStatus = "ranked"
else:
  gateStatus = "filtered"
```

#### Step 7: Final Scoring

```txt
FORGE = CS_rank × (0.6 + 0.4×XS) + 0.05×LV
FORGE_percent = clamp(FORGE × 100, 0, 100)

if FORGE ≥ 0.60: verdict = "strong-hire"
elif FORGE ≥ 0.45: verdict = "hire"
elif FORGE ≥ 0.30: verdict = "possible"
elif FORGE ≥ 0.15: verdict = "risky"
else: verdict = "no-hire"
```

#### Step 8: Generate Reasoning

* If passed gate: "Why Hired" memo (strengths, growth areas)
* If failed gate: "Why Not Hired" memo (missing skills, gap analysis, next steps)

---

### Feature 4: Decision Cockpit (`/results`)

**Three Lanes Based on Score:**

1. **Auto-Pass (≥60)** — Strong Hire candidates, ready to interview
2. **Review (30–59)** — Mixed signals, manual review needed
3. **Below τ (<30 or gateStatus filtered)** — Failed gate, rejected

#### Per-Candidate Detail Panel

**Header:**

* Name, job fit, final FORGE score (huge 4-digit display)
* Breakdown: `CS: 76% × XS: 59% + LV: +3%`
* Proof Confidence: 95%
* Status badges: Gate status, Verdict, CompFit

**Score Breakdown:**

* Formula: `FORGE = CS_rank × (0.6 + 0.4×XS) + 0.05×LV`
* Shows each component with pass/fail indicators
* Required vs Optional skill split

**Skill Breakdown Grid:**

* Required skills section: "5/6 proven"

  * Each skill card: name, status badge (Proven/Weak/Missing), weight %, score %
  * Hover tooltip: score × weight = contribution
* Optional skills section: "2/4 proven"

**Evidence Receipts:**

* All evidence grouped by skill
* Per evidence item:

  * Skill name + proof tier badge
  * Title + description
  * Metrics (stars, commits, lines)
  * "Why this matters" explanation
  * Link to repo/portfolio/blog

**Link Verification Panel:**

* Shows all writing links with reachability status
* Marked ✓ or ✗ with fetch times
* Useful for corroborating claims
* Impact: Low (visual indicator only, doesn't affect score)

**Why Not Hired Panel** (if filtered):

* Summary: Which required skill missing
* Gap analysis: Current score vs needed
* Specific artifacts required (e.g., "Ship a REST API")
* Estimated time to qualify (e.g., "6–12 weeks")
* Next steps numbered list
* Copy rejection email button (pre-formatted)

**Manual Decision Override:**

* AI Recommendation: "Reject" / "Hire" / "Review"
* Your Decision: Dropdown (Select, Reject, No Decision)
* Decision notes: Text input
* Buttons: "Select for Interview" (green) | "Reject" (red outline) | "Undo"
* Status shows: "✓ Selected" or "✗ Rejected" with timestamp
* Persisted to localStorage

**Gate Controls** (Optional):

* τ High slider (auto-pass threshold, default 60)
* τ Low slider (auto-reject threshold, default 30)
* Adjust in real-time to see candidate movement between lanes

---

### Feature 5: Guided Demo (21-step walkthrough)

**Triggered by:** "Run guided demo" button on homepage

**Phases:**

1. **Intro** (2 steps): FORGE philosophy + formula explanation
2. **Job Setup** (4 steps): JD paste → skill extraction → compensation → gate threshold
3. **Candidates** (5 steps): Add candidates → GitHub validation → resume upload → portfolio → salary matching
4. **Analysis** (6 steps): Run analysis → explain gates → show score breakdown → skills → evidence
5. **Results** (3 steps): Decision cockpit → verdicts → how to filter
6. **Outro** (1 step): Next actions + links

**Features:**

* Auto-advance timer (5–10 sec per step)
* Manual next/back buttons
* Skip entire demo
* Progress bar
* Narration text + tooltips on relevant UI elements

---

## Technical Implementation Details

### GitHub API Integration (`lib/github.ts`)

**Endpoints Used:**

1. `GET /users/{username}` — Profile data
2. `GET /users/{username}/repos?per_page=100&sort=stars` — User repos

**Data Extracted:**

```ts
interface GitHubUser {
  login: string;
  name?: string;
  bio?: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubRepo {
  name: string;
  url: string;
  stargazers_count: number;
  forks_count: number;
  language?: string;
  description?: string;
  homepage?: string;
  topics: string[];
  pushed_at: string;
}
```

**Error Handling:**

* 404 → Username doesn't exist
* Rate limit → Queue with exponential backoff
* Network error → Fallback to resume/portfolio only

---

### Skill Matching & Synonyms (`lib/skills.ts`)

**Skill Database:**

```ts
const SKILL_DEFINITIONS = {
  "React": {
    aliases: ["react.js", "reactjs"],
    related: ["JavaScript", "TypeScript"],
    keywords: ["react", "jsx", "component"]
  },
  "Node.js": {
    aliases: ["nodejs", "node"],
    related: ["JavaScript", "REST API"],
    keywords: ["node", "express", "npm"]
  },
  // ... 50+ skills
}

const SKILL_SYNONYMS = {
  "React": ["React.js"],
  "Node.js": ["NodeJS"],
  "REST API": ["REST", "RESTful"]
}

const SKILL_CLUSTERS = {
  "Node.js": {
    "REST API": 0.6,      // 60% credit if Node.js proven
    "Async/Await": 0.4,
    "Databases": 0.3
  },
  "React": {
    "JavaScript": 0.8,
    "CSS": 0.5
  }
}
```

**Matching Algorithm:**

```txt
For each skill:
  1. Exact match: search repo names, descriptions, languages
  2. Alias match: search skill aliases
  3. Keyword match: search commit messages, README
  4. Related skills: if Node.js found, credit REST API at 60%
  
Score skill = (matched_repos_weighted_by_stars × tier_multiplier)
```

---

### Proof Tier Detection (`lib/verification.ts`)

**Logic:**

```ts
function detectProofTier(repo, skill): ProofTier {
  const isOwned = repo.owner === user;
  const hasStars = repo.stars ≥ 10;
  const hasCommits = repo.commits ≥ 10;
  const isRecent = repo.lastPush < 6 months;
  const hasDescription = repo.description?.length > 50;
  
  if (isOwned && (hasCommits || hasStars) && isRecent) {
    return "verified_artifact";  // ×1.0
  } else if (hasCommits || (isOwned && hasDescription)) {
    return "strong_signal";       // ×0.7
  } else if (hasStars || hasDescription) {
    return "weak_signal";         // ×0.4
  } else {
    return "claim_only";          // ×0.15
  }
}
```

---

### Link Verification (`app/api/verify-link/route.ts`)

**Why needed:** Verify portfolio, blog, and writing links are reachable

**Process:**

1. Attempt HEAD request (fast, no body)
2. If HEAD fails, try GET
3. Extract title/og:description from HTML
4. Record response time
5. Return status: reachable vs unreachable

**Used for:**

* Validating portfolio URLs
* Checking blog reachability
* Verifying writing links
* Impact: Low (visual indicator only, doesn't affect score)

---

### Resume Parsing (`lib/portfolio-extract.ts`)

**Formats Supported:**

* PDF (via pdf-js-client)
* DOCX (via docx parser)
* Plain text paste

**Extraction:**

* Company names + dates
* Job titles + descriptions
* Skills claimed
* Achievements

**Signals:**

* Scanned PDF detection (low text extraction → warning)
* Text length validation
* Date parsing for job stability

---

## Data Persistence

### localStorage Keys

```txt
forge_job_config      // JobConfig object
forge_candidates      // Candidate[] array
forge_analysis_results // CandidateAnalysis[] array
forge_decisions       // { [candidateName]: "select" | "reject" }
forge_ui_state        // { selectedCandidate, filterTab, etc }
```

### Session Lifecycle

1. User loads homepage
2. Clicks "Start from scratch" → goes to `/job`
3. Configures job → saved to localStorage
4. Goes to `/candidates` → saved as they add
5. Runs analysis → results saved
6. On `/results` → can make decisions → saved
7. Refresh page → all data persists

**Export/Import:**

* Can download job + candidates as JSON
* Can re-import previously saved analyses

---

## How to Use FORGE

### For Hiring Managers

**Typical Workflow:**

1. **Homepage** → Click "Start from scratch"
2. **Job page** → Paste job description → Extract skills → Set gate threshold
3. **Candidates page** → Add candidates (GitHub usernames) → Run analysis
4. **Results** → Review candidates ranked by FORGE score
5. **Decision making** → Select top candidates for interviews, or reject with reason

**Key Decisions:**

* **Adjust gate threshold** (τ): Start at 40%, raise to 60% for senior roles, lower to 25% for entry-level
* **Mark required skills**: Top 5 should be required, rest are nice-to-haves
* **Salary benchmarking**: Set realistic budget for role
* **Manual override**: If AI says "Reject" but you see potential, select anyway and note reason

---

### For Candidates (Using Resume/Portfolio)

**If you don't have GitHub:**

1. Upload resume (PDF or paste text)
2. Add portfolio URL
3. Provide LinkedIn text (copy-paste your About + Experience)
4. Provide writing links (blog, design docs, case studies)
5. FORGE will score based on claims vs resume corroboration

**If you have GitHub:**

1. Provide GitHub username
2. Ensure repos show the skills required for the job
3. Add detailed READMEs and commit messages
4. Pin your best work (highest-impact repos)
5. FORGE will verify claims against code

---

## Scoring Examples

### Example 1: Strong Hire (FORGE: 76)

```txt
Candidate: Lee Robinson
GitHub: 15 repos, 500+ stars, 1000 commits
Required Skills: React (95%), TypeScript (90%), Node.js (80%), PostgreSQL (70%), Testing (60%)
Optional Skills: GraphQL (75%), Docker (0%)

CS_required = (95+90+80+70+60) / 5 = 79%
CS_optional = (75+0) / 2 = 37.5%
CS_rank = clamp(0.79 + 0.25×0.375, 0, 1) = 0.874 = 87.4%

XS breakdown:
  Ownership: 60% (8 owned repos, 500 stars)
  Communication: 85% (detailed READMEs)
  Adaptability: 70% (5 languages)
  Teamwork: 45% (200 followers, 3 contributed repos)
  XS = (60+85+70+45)/4 = 65% = 0.65

LV = +0.03 (recent Next.js adoption)

Gate check: CS_required 79% ≥ τ 40% ✓ PASS

FORGE = 0.874 × (0.6 + 0.4×0.65) + 0.05×0.03
      = 0.874 × (0.6 + 0.26) + 0.0015
      = 0.874 × 0.86 + 0.0015
      = 0.752 + 0.0015
      = 0.754 = 75.4% ≈ 76
      
Verdict: STRONG HIRE
```

### Example 2: Filtered/Below τ (FORGE: 10)

```txt
Candidate: Jane Doe
GitHub: 3 repos, 5 stars, 20 commits
Required Skills: React (10%), TypeScript (5%), Node.js (0%), PostgreSQL (0%), Testing (0%)
Optional Skills: None

CS_required = (10+5+0+0+0) / 5 = 3% = 0.03
CS_optional = 0%
CS_rank = clamp(0.03 + 0, 0, 1) = 0.03 = 3%

XS breakdown:
  Ownership: 20% (1 repo, no stars)
  Communication: 30% (minimal READMEs)
  Adaptability: 20% (1 language)
  Teamwork: 10% (10 followers, 0 contributed repos)
  XS = (20+30+20+10)/4 = 20% = 0.20

LV = 0

Gate check: CS_required 3% < τ 40% ✗ FAIL

gateStatus = "filtered"

FORGE = 0.03 × (0.6 + 0.4×0.20) + 0
      = 0.03 × 0.68
      = 0.0204 = 2% ≈ 10 (after ranking adjustments)
      
Verdict: NO HIRE (Below gate)
Why not hired: Missing proof on critical skills (React, Node.js, PostgreSQL). 
Next steps: Ship a full-stack React/Node app to demonstrate capabilities.
```

---

## Key Improvements in This Version (v3)

1. **Soft Must-Haves** — Required skills gate (CS_required ≥ τ), optional skills boost ranking
2. **Corroboration Boost** — Multiple proof sources accumulate (don't just take max)
3. **Claims Count** — Resume claims worth 15% even without GitHub (vs 0% before)
4. **Related Skills** — Skill synonyms and clusters (Node.js partially proves REST API)
5. **Proof Tier Floors** — Even weak evidence has minimum score floor
6. **Adaptive Ranking** — CS_rank formula includes optional skills bonus but gates only on required
7. **Link Verification** — Validate portfolio and writing links are reachable
8. **CompFit Salary Matching** — Adjust XS based on salary expectations vs benchmark
9. **Manual Decision Override** — You can select/reject candidates despite AI recommendation
10. **Detailed "Why Not Hired"** — Explains exactly which skill missing and what's needed to qualify

---

## Future Roadmap

* **LinkedIn OAuth Integration** (limited API, official only)
* **Interview Performance Tracking** — Correlate FORGE scores with actual hire success
* **Outcome Calibration** — Fine-tune τ based on your hiring outcomes
* **Team Analytics** — See which skills correlate with success in your org
* **Batch Analysis** — Upload 100+ candidates at once
* **Custom Proof Tiers** — Define your own evidence weightings
* **Integration with ATS** — Push selected candidates to your hiring system

---

## Support & Questions

**Common Issues**

**Q: GitHub username not found**
A: Ensure username is spelled correctly. Username must be valid GitHub username (no spaces).

**Q: "Scanned PDF" warning on resume**
A: PDF was image-scanned. Extract text first or paste text manually.

**Q: Why is candidate below gate despite having the skills?**
A: Gate only checks REQUIRED skills. Make sure you marked the right skills as required. Raise τ if needed.

**Q: How do I improve my FORGE score?**
A: Prove the required skills with shipped projects (owned repos, 10+ commits, stars). Add detailed READMEs and commit messages.

**Q: Can I use FORGE for non-engineers?**
A: Yes! Use resume + portfolio + writing links. GitHub is optional. Skill extraction works for any role.

---

## Summary

**FORGE is a proof-first hiring platform that:**

* Extracts verifiable evidence from GitHub, resume, portfolio, writing
* Scores candidates using CS (capability), XS (context), and LV (growth)
* Gates on required skills only (don't let nice-to-haves block good candidates)
* Provides AI-generated verdicts + reasoning
* Lets you override and make manual decisions
* Explains why each candidate passed or failed
* Helps you hire the right people based on what they've actually shipped

**Use it to:** Replace subjective hiring with data-driven decisions backed by verifiable proof.

---

