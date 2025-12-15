// FORGE Candidate Scoring Engine
// Implements the exact FORGE algorithm: CS × XS with tau gate

import type { GitHubRepo, GitHubUser } from "@/lib/github"
import { daysSince, yearsActive as calcYearsActive } from "@/lib/time"
import { buildExplanations, computeProofConfidence } from "@/lib/explanations"
import { buildSkillVerifications } from "@/lib/verification"
import type { CandidateVerification } from "@/lib/types"
import type { RiskItem, InterviewQuestion } from "./types"
import { type CompFit, calculateCompFit, calculateCompBenchmark, type CompBenchmarkResult } from "./compensation"

// ============================================
// TYPES
// ============================================

export type SkillStatus = "Proven" | "Weak" | "Missing"
export type EvidenceTier = "owned" | "major" | "minor" | "inferred"
export type GateStatus = "ranked" | "filtered"
export type DataQuality = "full" | "partial" | "fallback"

// Tier floors: minimum scores based on best proof tier present
export const TIER_FLOORS: Record<string, number> = {
  owned: 0.8, // VERIFIED_ARTIFACT
  major: 0.6, // STRONG_SIGNAL
  minor: 0.3, // WEAK_SIGNAL
  inferred: 0.1, // CLAIM_ONLY
}

// Tier weights for raw score calculation
export const TIER_WEIGHTS: Record<string, number> = {
  owned: 1.0, // VERIFIED_ARTIFACT
  major: 0.7, // STRONG_SIGNAL
  minor: 0.4, // WEAK_SIGNAL
  inferred: 0.15, // CLAIM_ONLY
}

// Skill clusters for partial credit
export const SKILL_CLUSTERS: Record<string, { related: string; credit: number }[]> = {
  "Node.js": [
    { related: "REST API", credit: 0.6 },
    { related: "Express", credit: 0.5 },
  ],
  "REST API": [{ related: "Node.js", credit: 0.5 }],
  TypeScript: [{ related: "JavaScript", credit: 0.8 }],
  JavaScript: [{ related: "TypeScript", credit: 0.4 }], // JS doesn't fully imply TS
  PostgreSQL: [
    { related: "SQL", credit: 0.7 },
    { related: "MySQL", credit: 0.5 },
  ],
  SQL: [
    { related: "PostgreSQL", credit: 0.5 },
    { related: "MySQL", credit: 0.5 },
  ],
  React: [{ related: "Next.js", credit: 0.4 }],
  "Next.js": [{ related: "React", credit: 0.7 }],
}

export interface SkillScore {
  name: string
  score: number // 0-1
  confidence: number // 0-1
  evidenceCount: number
  status: SkillStatus
  reason: string
  evidenceTier: EvidenceTier
  weight: number // normalized 0-100
  evidence: any[]
  isRequired?: boolean // true = gates tau, false = optional/bonus
}

export interface CandidateAnalysis {
  id: string
  name: string
  github: string
  linkedin: string
  portfolio: string | null
  avatar: string
  headline: string

  // FORGE Algorithm outputs
  capabilityScore: number
  contextScore: number
  forgeScore: number
  gateStatus: GateStatus
  tau: number
  dataQuality: DataQuality

  // Legacy compatibility
  overallScore: number
  finalScore: number
  verdict: any
  confidence: number
  proofConfidence: number

  yearsActive: number
  activityTrend: number[]
  learningVelocityBonus: number

  capability: {
    status: string
    score: number
    confidence: number
    skills: SkillScore[]
  }

  context: {
    teamwork: any
    communication: any
    adaptability: any
    ownership: any
  }

  evidence: any[]
  explanations: any
  explanation: {
    summary: string
    oneLiner: string
    strengths: string[]
    weaknesses: string[]
    flags: string[]
  }
  risks: RiskItem[]
  interviewGuidance: {
    questions: InterviewQuestion[]
    areasToProbe: string[]
    suggestedTasks: string[]
  }
  evidenceTimeline: Array<{ year: number; skills: string[] }>
  verification: CandidateVerification
  compFit: CompFit
  salaryExpectation: CompBenchmarkResult
}

// ============================================
// SKILL DETECTION PATTERNS
// ============================================

const SKILL_INDICATORS: Record<string, { languages: string[]; keywords: RegExp[] }> = {
  React: {
    languages: ["JavaScript", "TypeScript"],
    keywords: [/react/i, /next/i, /jsx/i, /frontend/i, /component/i, /hook/i],
  },
  TypeScript: {
    languages: ["TypeScript"],
    keywords: [/typescript/i, /\.ts/i, /typed/i, /types/i],
  },
  JavaScript: {
    languages: ["JavaScript"],
    keywords: [/javascript/i, /\.js/i, /node/i, /npm/i],
  },
  "Node.js": {
    languages: ["JavaScript", "TypeScript"],
    keywords: [/node/i, /express/i, /nest/i, /fastify/i, /api/i, /server/i, /backend/i],
  },
  Python: {
    languages: ["Python"],
    keywords: [/python/i, /django/i, /flask/i, /fastapi/i, /pytorch/i, /tensorflow/i],
  },
  Go: {
    languages: ["Go"],
    keywords: [/golang/i, /go-/i, /-go/i],
  },
  Rust: {
    languages: ["Rust"],
    keywords: [/rust/i, /cargo/i],
  },
  SQL: {
    languages: [],
    keywords: [/sql/i, /postgres/i, /mysql/i, /database/i, /prisma/i, /drizzle/i, /supabase/i],
  },
  AWS: {
    languages: [],
    keywords: [/aws/i, /lambda/i, /s3/i, /terraform/i, /cdk/i, /cloudformation/i, /ec2/i],
  },
  Docker: {
    languages: [],
    keywords: [/docker/i, /container/i, /kubernetes/i, /k8s/i, /helm/i],
  },
  "REST API": {
    languages: [],
    keywords: [/api/i, /rest/i, /http/i, /endpoint/i, /graphql/i],
  },
  "System Design": {
    languages: [],
    keywords: [/distributed/i, /scalable/i, /microservice/i, /architecture/i, /system/i, /design/i],
  },
  Testing: {
    languages: [],
    keywords: [/test/i, /jest/i, /cypress/i, /playwright/i, /vitest/i, /mocha/i, /spec/i],
  },
  "CI/CD": {
    languages: [],
    keywords: [/ci/i, /cd/i, /github.action/i, /workflow/i, /deploy/i, /pipeline/i],
  },
  "Machine Learning": {
    languages: ["Python", "Jupyter Notebook"],
    keywords: [/ml/i, /machine.learning/i, /ai/i, /model/i, /neural/i, /deep.learning/i],
  },
  Vue: {
    languages: ["Vue", "JavaScript", "TypeScript"],
    keywords: [/vue/i, /nuxt/i, /vuex/i],
  },
  Angular: {
    languages: ["TypeScript"],
    keywords: [/angular/i, /ng-/i, /rxjs/i],
  },
  CSS: {
    languages: ["CSS", "SCSS"],
    keywords: [/css/i, /tailwind/i, /sass/i, /scss/i, /styled/i, /emotion/i],
  },
  GraphQL: {
    languages: [],
    keywords: [/graphql/i, /apollo/i, /relay/i, /hasura/i],
  },
  MongoDB: {
    languages: [],
    keywords: [/mongo/i, /mongoose/i, /nosql/i],
  },
}

// ============================================
// VALIDATION PENALTIES (AI Slop Detection)
// ============================================

interface ValidationPenalties {
  forkRatio: number // 0-1, high = bad
  burstActivity: boolean // suspicious burst patterns
  missingDescriptions: number // count of repos without README/desc
  staleActivity: boolean // no push in >365 days
  aiSlopIndicators: number // repetitive/template repos
}

function detectValidationPenalties(repos: GitHubRepo[], username: string): ValidationPenalties {
  const safeUsername = typeof username === "string" ? username.toLowerCase() : ""

  const ownedRepos = repos.filter((r) => {
    const ownerLogin = r.owner?.login
    if (!ownerLogin) return false
    return String(ownerLogin).toLowerCase() === safeUsername
  })
  const forks = repos.filter((r) => r.fork)
  const forkRatio = repos.length > 0 ? forks.length / repos.length : 0

  // Detect burst activity (many repos created in short window)
  const createdDates = ownedRepos.map((r) => new Date(r.created_at).getTime())
  const sortedDates = [...createdDates].sort((a, b) => a - b)
  let burstActivity = false
  for (let i = 0; i < sortedDates.length - 5; i++) {
    const window = sortedDates[i + 5] - sortedDates[i]
    if (window < 7 * 24 * 60 * 60 * 1000) {
      // 5 repos in 7 days
      burstActivity = true
      break
    }
  }

  // Missing descriptions
  const missingDescriptions = ownedRepos.filter((r) => !r.description || r.description.length < 10).length

  // Stale activity
  const mostRecent = repos.length > 0 ? Math.min(...repos.map((r) => daysSince(r.pushed_at))) : 999
  const staleActivity = mostRecent > 365

  // AI slop indicators: repetitive names, tiny repos, template patterns
  const repoNames = ownedRepos.map((r) => r.name.toLowerCase())
  const templatePatterns = [/^my-/, /^test-/, /-demo$/, /-example$/, /^untitled/i, /^project\d/i]
  const templateCount = repoNames.filter((name) => templatePatterns.some((p) => p.test(name))).length

  return {
    forkRatio,
    burstActivity,
    missingDescriptions,
    staleActivity,
    aiSlopIndicators: templateCount,
  }
}

function computeConfidencePenalty(penalties: ValidationPenalties): number {
  let penalty = 0

  // Fork-heavy: up to -0.3
  penalty += Math.min(penalties.forkRatio * 0.4, 0.3)

  // Burst activity: -0.15
  if (penalties.burstActivity) penalty += 0.15

  // Missing descriptions: up to -0.2
  penalty += Math.min(penalties.missingDescriptions * 0.02, 0.2)

  // Stale activity: -0.2
  if (penalties.staleActivity) penalty += 0.2

  // AI slop: up to -0.15
  penalty += Math.min(penalties.aiSlopIndicators * 0.03, 0.15)

  return Math.min(penalty, 0.7) // Cap at 70% penalty
}

// ============================================
// RECENCY SCORING (Logistic Decay)
// ============================================

function recencyScore(pushedAt: string): number {
  const days = daysSince(pushedAt)
  // Logistic decay: 1 / (1 + e^((days - 180) / 60))
  // Gives ~0.95 at 0 days, ~0.5 at 180 days, ~0.05 at 360 days
  return 1 / (1 + Math.exp((days - 180) / 60))
}

// ============================================
// SKILL EVIDENCE QUALITY SCORING
// ============================================

function repoMatchesSkill(repo: GitHubRepo, skillName: string): boolean {
  const indicators = SKILL_INDICATORS[skillName]
  if (!indicators) return false

  if (indicators.languages.length > 0 && repo.language) {
    if (indicators.languages.includes(repo.language)) return true
  }

  const text = `${repo.name} ${repo.description || ""}`.toLowerCase()
  for (const pattern of indicators.keywords) {
    if (pattern.test(text)) return true
  }

  return false
}

function computeRepoQuality(
  repo: GitHubRepo,
  username: string,
): {
  quality: number // 0-1
  tier: EvidenceTier
} {
  const isOwned = repo.owner.login.toLowerCase() === username.toLowerCase()
  const isFork = repo.fork
  const hasDescription = repo.description && repo.description.length > 20
  const stars = repo.stargazers_count
  const recency = recencyScore(repo.pushed_at)

  let quality = 0
  let tier: EvidenceTier = "inferred"

  // Ownership bonus
  if (isOwned && !isFork) {
    quality += 0.4
    tier = "owned"
  } else if (!isFork) {
    quality += 0.2
    tier = "major"
  } else {
    tier = "minor"
  }

  // Substance proxy
  if (hasDescription) quality += 0.1
  if (stars >= 10) quality += 0.1
  if (stars >= 50) quality += 0.1
  if (stars >= 100) quality += 0.1

  // Recency
  quality += recency * 0.2

  return { quality: Math.min(quality, 1), tier }
}

function generateWhyThisMatters(repo: GitHubRepo, username: string, tier: EvidenceTier): string {
  const isOwned = repo.owner.login.toLowerCase() === username.toLowerCase()
  const isRecent = daysSince(repo.pushed_at) < 90
  const hasStars = repo.stargazers_count >= 50

  if (tier === "owned" && isRecent && hasStars) {
    return "Owned, actively maintained, and externally validated — strongest proof of ability."
  } else if (tier === "owned" && isRecent) {
    return "Owned and actively maintained — strong proof of current capability."
  } else if (tier === "owned" && hasStars) {
    return "Owned with external adoption (stars) — demonstrates impact and quality."
  } else if (tier === "owned") {
    return "Original work owned by candidate — direct evidence of capability."
  } else if (tier === "major") {
    return "Significant contribution to established project — shows collaborative ability."
  } else if (tier === "minor") {
    return "Fork or minor contribution — lower ownership confidence."
  } else {
    return "Inferred from activity patterns — needs verification."
  }
}

// ============================================
// CAPABILITY SCORE (CS) CALCULATION
// ============================================

export const DEFAULT_TAU = 0.4 // Lowered from 0.65 to be more realistic

export const PROOF_TIER_WEIGHTS: Record<string, number> = {
  owned: 1.0,
  major: 0.7,
  minor: 0.5,
  inferred: 0.15, // Was 0, now 0.15
}

export function getSkillStatus(score: number): SkillStatus {
  if (score >= 0.6) return "Proven"
  if (score >= 0.2) return "Weak"
  return "Missing"
}

// Uses formula: score = 1 - Π(1 - tierWeight_i * relevance_i)
function aggregateReceipts(evidenceItems: Array<{ tierWeight: number; relevance: number }>): number {
  if (evidenceItems.length === 0) return 0

  let product = 1
  for (const item of evidenceItems) {
    const contribution = item.tierWeight * item.relevance
    product *= 1 - Math.min(contribution, 0.95) // Cap individual contribution
  }
  return 1 - product
}

function calculateSkillScore(
  skill: {
    name: string
    weight: number
    priority?: string
    category?: string
    isRequired?: boolean
    importance?: string
  },
  repos: GitHubRepo[],
  username: string,
): SkillScore {
  const skillLower = skill.name.toLowerCase()

  let baseScore = 0
  let confidence = 0
  let evidenceCount = 0
  let reason = `No evidence found for ${skill.name}`
  let evidenceTier: EvidenceTier = "inferred"
  const matchingEvidence: any[] = []

  const matchingRepos = repos.filter((repo) => {
    const repoText = `${repo.name} ${repo.description || ""} ${repo.language || ""}`.toLowerCase()
    const skillTerms = skillLower.split(/[\s/-]+/).filter((t) => t.length > 2)
    return skillTerms.some((term) => repoText.includes(term))
  })

  const evidenceItems: Array<{ tierWeight: number; relevance: number }> = []
  let bestTier: EvidenceTier = "inferred"

  if (matchingRepos.length > 0) {
    evidenceCount = matchingRepos.length

    const ownedMatches = matchingRepos.filter((r) => r.owner.login.toLowerCase() === username.toLowerCase() && !r.fork)
    const starredMatches = matchingRepos.filter((r) => r.stargazers_count >= 10)
    const recentMatches = matchingRepos.filter((r) => daysSince(r.pushed_at) < 180)

    if (ownedMatches.length > 0) {
      // Strong evidence - owned repos
      bestTier = "owned"
      evidenceTier = "owned"

      for (const repo of ownedMatches) {
        const relevance = Math.min(
          1,
          0.6 +
            (repo.stargazers_count > 50 ? 0.3 : repo.stargazers_count > 10 ? 0.15 : 0) +
            (daysSince(repo.pushed_at) < 90 ? 0.1 : 0),
        )
        evidenceItems.push({ tierWeight: TIER_WEIGHTS.owned, relevance })
      }

      const bestRepo = ownedMatches.sort((a, b) => b.stargazers_count - a.stargazers_count)[0]
      confidence = Math.min(1, 0.6 + ownedMatches.length * 0.1)
      reason = `${ownedMatches.length} owned repo${ownedMatches.length > 1 ? "s" : ""} demonstrate ${skill.name}`
      matchingEvidence.push(
        ...ownedMatches.map((repo) => ({
          id: repo.id,
          type: "repository",
          title: repo.name,
          description: repo.description || null,
          url: repo.html_url,
          skill: skill.name,
          impact: "high",
          date: repo.pushed_at,
          metrics: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            openIssues: repo.open_issues_count,
            language: repo.language,
            lastPushedDays: daysSince(repo.pushed_at),
            owned: true,
          },
          whyThisMatters: generateWhyThisMatters(repo, username, evidenceTier),
          evidenceTier,
          proofTier: "owned",
          reliability: 1,
        })),
      )
    } else if (starredMatches.length > 0 || recentMatches.length > 0) {
      // Medium evidence - contributed or recent forks
      bestTier = "major"
      evidenceTier = "major"

      for (const repo of matchingRepos) {
        const relevance = Math.min(
          1,
          0.5 + (repo.stargazers_count >= 10 ? 0.2 : 0) + (daysSince(repo.pushed_at) < 180 ? 0.1 : 0),
        )
        evidenceItems.push({ tierWeight: TIER_WEIGHTS.major, relevance })
      }

      confidence = 0.5
      reason = `${matchingRepos.length} repo${matchingRepos.length > 1 ? "s" : ""} show ${skill.name} usage`
      matchingEvidence.push(
        ...matchingRepos.map((repo) => ({
          id: repo.id,
          type: "repository",
          title: repo.name,
          description: repo.description || null,
          url: repo.html_url,
          skill: skill.name,
          impact: "medium",
          date: repo.pushed_at,
          metrics: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            openIssues: repo.open_issues_count,
            language: repo.language,
            lastPushedDays: daysSince(repo.pushed_at),
            owned: false,
          },
          whyThisMatters: generateWhyThisMatters(repo, username, evidenceTier),
          evidenceTier,
          proofTier: "major",
          reliability: 0.8,
        })),
      )
    } else {
      bestTier = "minor"
      evidenceTier = "minor"

      for (const repo of matchingRepos) {
        evidenceItems.push({ tierWeight: TIER_WEIGHTS.minor, relevance: 0.5 })
      }

      confidence = 0.35
      reason = `${matchingRepos.length} repo${matchingRepos.length > 1 ? "s" : ""} mention ${skill.name}`
      evidenceCount = matchingRepos.length
      matchingEvidence.push(
        ...matchingRepos.map((repo) => ({
          id: repo.id,
          type: "repository",
          title: repo.name,
          description: repo.description || null,
          url: repo.html_url,
          skill: skill.name,
          impact: "low",
          date: repo.pushed_at,
          metrics: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            openIssues: repo.open_issues_count,
            language: repo.language,
            lastPushedDays: daysSince(repo.pushed_at),
            owned: false,
          },
          whyThisMatters: generateWhyThisMatters(repo, username, evidenceTier),
          evidenceTier,
          proofTier: "minor",
          reliability: 0.5,
        })),
      )
    }
  } else {
    // Check for related skills (fix #4 - partial credit)
    const relatedSkills = getRelatedSkills(skill.name)
    const relatedMatches = repos.filter((repo) => {
      const repoText = `${repo.name} ${repo.description || ""} ${repo.language || ""}`.toLowerCase()
      return relatedSkills.some((related) => repoText.includes(related.toLowerCase()))
    })

    if (relatedMatches.length > 0) {
      bestTier = "inferred"
      evidenceTier = "inferred"

      for (const repo of relatedMatches) {
        evidenceItems.push({ tierWeight: TIER_WEIGHTS.inferred, relevance: 0.5 })
      }

      confidence = 0.25
      reason = `Related skills found (${relatedSkills.slice(0, 2).join(", ")})`
      evidenceCount = relatedMatches.length
      matchingEvidence.push(
        ...relatedMatches.map((repo) => ({
          id: repo.id,
          type: "repository",
          title: repo.name,
          description: repo.description || null,
          url: repo.html_url,
          skill: skill.name,
          impact: "low",
          date: repo.pushed_at,
          metrics: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            openIssues: repo.open_issues_count,
            language: repo.language,
            lastPushedDays: daysSince(repo.pushed_at),
            owned: false,
          },
          whyThisMatters: generateWhyThisMatters(repo, username, evidenceTier),
          evidenceTier,
          proofTier: "inferred",
          reliability: 0.3,
        })),
      )
    }
  }

  if (evidenceItems.length > 0) {
    const rawScore = aggregateReceipts(evidenceItems)
    const tierFloor = TIER_FLOORS[bestTier] || 0
    baseScore = Math.max(rawScore, tierFloor)
    baseScore = Math.min(baseScore, 1) // Clamp to [0, 1]
  }

  const status = getSkillStatus(baseScore)

  return {
    name: skill.name,
    score: baseScore,
    confidence,
    evidenceCount,
    status,
    reason,
    evidenceTier,
    weight: skill.weight, // Include weight field
    evidence: matchingEvidence,
    isRequired: skill.isRequired, // Added isRequired field
  }
}

function getRelatedSkills(skill: string): string[] {
  const skillMap: Record<string, string[]> = {
    react: ["javascript", "typescript", "jsx", "frontend"],
    vue: ["javascript", "typescript", "frontend"],
    angular: ["typescript", "javascript", "frontend"],
    "node.js": ["javascript", "typescript", "express", "backend"],
    python: ["django", "flask", "fastapi"],
    java: ["spring", "maven", "gradle"],
    kubernetes: ["docker", "k8s", "helm", "devops"],
    docker: ["container", "kubernetes", "devops"],
    aws: ["cloud", "ec2", "s3", "lambda"],
    postgresql: ["postgres", "sql", "database"],
    mongodb: ["mongo", "nosql", "database"],
    graphql: ["apollo", "api", "query"],
    "rest api": ["api", "http", "endpoint"],
    "ci/cd": ["github actions", "jenkins", "pipeline", "devops"],
    testing: ["jest", "pytest", "test", "spec"],
  }

  const lower = skill.toLowerCase()
  for (const [key, related] of Object.entries(skillMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return related
    }
  }
  return []
}

// ============================================
// CONTEXT SCORE (XS) CALCULATION
// ============================================

function calculateContextSignals(
  repos: GitHubRepo[],
  user: GitHubUser,
  username: string,
): {
  teamwork: any
  communication: any
  adaptability: any
  ownership: any
  xs: number // XS score 0-1
} {
  const ownedRepos = repos.filter((r) => r.owner.login.toLowerCase() === username.toLowerCase())
  const contributedRepos = repos.filter((r) => r.owner.login.toLowerCase() !== username.toLowerCase())
  const recentRepos = repos.filter((r) => daysSince(r.pushed_at) < 180)
  const languages = new Set(repos.map((r) => r.language).filter(Boolean))
  const reposWithDesc = repos.filter((r) => r.description && r.description.length > 20)

  // Raw scores (0-100)
  const teamworkRaw = Math.min(100, contributedRepos.length * 15 + Math.min(user.followers / 5, 20))
  const communicationRaw = Math.min(100, (reposWithDesc.length / Math.max(repos.length, 1)) * 100)
  const adaptabilityRaw = Math.min(100, languages.size * 12)
  const totalStars = ownedRepos.reduce((acc, r) => acc + r.stargazers_count, 0)
  const ownershipRaw = Math.min(100, ownedRepos.length * 8 + Math.log10(totalStars + 1) * 10 + recentRepos.length * 5)

  // Normalize to 0-1
  const teamworkScore = teamworkRaw / 100
  const communicationScore = communicationRaw / 100
  const adaptabilityScore = adaptabilityRaw / 100
  const ownershipScore = ownershipRaw / 100

  // Default context weights (equal)
  const alpha = { own: 0.25, com: 0.25, adapt: 0.25, team: 0.25 }

  // XS = weighted sum
  const xs =
    alpha.own * ownershipScore +
    alpha.com * communicationScore +
    alpha.adapt * adaptabilityScore +
    alpha.team * teamworkScore

  return {
    teamwork: {
      name: "Teamwork",
      score: teamworkScore,
      raw: Math.round(teamworkRaw),
      source: `${contributedRepos.length} contributions, ${user.followers} followers`,
    },
    communication: {
      name: "Communication",
      score: communicationScore,
      raw: Math.round(communicationRaw),
      source: `${reposWithDesc.length}/${repos.length} repos with descriptions`,
    },
    adaptability: {
      name: "Adaptability",
      score: adaptabilityScore,
      raw: Math.round(adaptabilityRaw),
      source: `${languages.size} languages used`,
    },
    ownership: {
      name: "Ownership",
      score: ownershipScore,
      raw: Math.round(ownershipRaw),
      source: `${ownedRepos.length} owned repos, ${totalStars} total stars`,
    },
    xs,
  }
}

// ============================================
// LEARNING VELOCITY BONUS
// ============================================

function calculateLearningVelocity(repos: GitHubRepo[]): number {
  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000
  const recentRepos = repos.filter((r) => new Date(r.pushed_at).getTime() > sixMonthsAgo)
  const olderRepos = repos.filter((r) => new Date(r.pushed_at).getTime() <= sixMonthsAgo)

  const recentLanguages = new Set(recentRepos.map((r) => r.language).filter(Boolean))
  const olderLanguages = new Set(olderRepos.map((r) => r.language).filter(Boolean))

  // New languages learned recently
  const newLanguages = [...recentLanguages].filter((l) => !olderLanguages.has(l)).length

  // Activity increase
  const recentActivity = recentRepos.length
  const expectedActivity = olderRepos.length / 3 // 6 months vs ~18 months older

  let bonus = 0

  // New languages bonus
  if (newLanguages >= 2) bonus += 0.02
  else if (newLanguages >= 1) bonus += 0.01

  // Activity increase bonus
  if (recentActivity > expectedActivity * 1.5) bonus += 0.02
  else if (recentActivity > expectedActivity) bonus += 0.01

  // Cap at 0.05
  return Math.min(bonus, 0.05)
}

// ============================================
// INTERVIEW & RISK GENERATION
// ============================================

function generateInterviewQuestions(
  skills: Array<{
    name: string
    weight: number
    priority?: string
    category?: string
    isRequired?: boolean
    importance?: string
  }>,
  skillScores: SkillScore[],
  evidence: any[],
): { questions: InterviewQuestion[]; areasToProbe: string[]; suggestedTasks: string[] } {
  const questions: InterviewQuestion[] = []
  const areasToProbe: string[] = []
  const suggestedTasks: string[] = []

  const topEvidence = evidence.filter((e) => e.evidenceTier === "owned").slice(0, 2)
  for (const ev of topEvidence) {
    questions.push({
      type: "technical",
      question: `Tell me about your ${ev.title} project. What was the most challenging technical decision you made?`,
      context: `Based on their ${ev.skill} work with ${ev.metrics.stars || 0} stars`,
    })
  }

  const weakSkills = skillScores.filter((s) => s.status === "Weak" || s.status === "Missing")
  const highWeightWeak = weakSkills.filter((s) => {
    const skillConfig = skills.find((sk) => sk.name === s.name)
    return skillConfig && skillConfig.weight >= 15
  })

  if (highWeightWeak.length > 0) {
    const weakest = highWeightWeak[0]
    questions.push({
      type: "gap-probe",
      question: `We didn't find much evidence of ${weakest.name} in your public work. Can you walk me through your experience with it?`,
      context: `${weakest.name} is weighted at ${skills.find((s) => s.name === weakest.name)?.weight}% but scored ${Math.round(weakest.score * 100)}`,
    })
    areasToProbe.push(`${weakest.name}: ${weakest.reason}`)
  }

  if (evidence.length > 0) {
    questions.push({
      type: "architecture",
      question: `If you were to rebuild ${evidence[0].title} today to handle 100x the traffic, what would you change?`,
      context: "Tests system design thinking",
    })
  }

  const strongSkill = skillScores.find((s) => s.status === "Proven")
  if (strongSkill) {
    suggestedTasks.push(`Extend one of your ${strongSkill.name} projects with a new feature we specify`)
  }
  if (highWeightWeak.length > 0) {
    suggestedTasks.push(`Write a small ${highWeightWeak[0].name} module to demonstrate capability`)
  }

  return { questions, areasToProbe, suggestedTasks }
}

function generateTimeline(repos: GitHubRepo[]): Array<{ year: number; skills: string[] }> {
  const yearMap = new Map<number, Set<string>>()

  for (const repo of repos) {
    const year = new Date(repo.pushed_at).getFullYear()
    if (!yearMap.has(year)) yearMap.set(year, new Set())

    for (const [skillName] of Object.entries(SKILL_INDICATORS)) {
      if (repoMatchesSkill(repo, skillName)) {
        yearMap.get(year)!.add(skillName)
      }
    }
  }

  return Array.from(yearMap.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-5)
    .map(([year, skills]) => ({ year, skills: Array.from(skills) }))
}

function generateActivityTrend(repos: GitHubRepo[]): number[] {
  const now = Date.now()
  const periods = 6
  const periodLength = 60 * 24 * 60 * 60 * 1000

  return Array.from({ length: periods }, (_, i) => {
    const periodStart = now - (periods - i) * periodLength
    const periodEnd = now - (periods - i - 1) * periodLength

    const reposInPeriod = repos.filter((r) => {
      const pushed = new Date(r.pushed_at).getTime()
      return pushed >= periodStart && pushed < periodEnd
    })

    return Math.min(100, reposInPeriod.length * 15 + Math.random() * 10)
  }).map(Math.round)
}

function identifyRisks(
  skillScores: SkillScore[],
  contextSignals: ReturnType<typeof calculateContextSignals>,
  csConf: number,
  gateStatus: GateStatus,
): RiskItem[] {
  const risks: RiskItem[] = []

  if (gateStatus === "filtered") {
    risks.push({
      type: "Gate Failure",
      severity: "high",
      description: "Capability score below threshold — insufficient verified proof",
    })
  }

  const missingSkills = skillScores.filter((s) => s.status === "Missing")
  if (missingSkills.length > 0) {
    risks.push({
      type: "Skill Gap",
      severity: missingSkills.length > 2 ? "high" : "medium",
      description: `Missing evidence for: ${missingSkills.map((s) => s.name).join(", ")}`,
    })
  }

  if (contextSignals.teamwork.score < 0.4) {
    risks.push({
      type: "Collaboration",
      severity: "medium",
      description: "Limited evidence of team collaboration in public work",
    })
  }

  if (csConf < 0.5) {
    risks.push({
      type: "Confidence",
      severity: "high",
      description: "Low overall confidence due to validation penalties or limited activity",
    })
  }

  return risks
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

export async function analyzeCandidate(
  username: string,
  skills: {
    name: string
    weight: number
    priority?: string
    category?: string
    isRequired?: boolean
    importance?: string
  }[],
  existingUser?: GitHubUser | null,
  existingRepos?: GitHubRepo[] | null,
  tau: number = DEFAULT_TAU,
  salaryExpectation?: { min?: number; max?: number; target?: number; currency?: string },
  jobConfig?: {
    roleTitle?: string
    location?: string
    seniority?: string
    industry?: string
    companySize?: string
    budget?: { min?: number; max?: number }
  },
): Promise<CandidateAnalysis> {
  const user = existingUser || (await fetchGitHubUser(username))
  const repos = existingRepos || (await fetchGitHubRepos(username))

  if (user && (user as any).type === "Organization") {
    throw new Error("Cannot analyze GitHub organizations, only user accounts")
  }

  // Efficiency: top 30 repos by recency
  const topRepos = [...repos]
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 30)

  // Detect validation penalties
  const validationPenalties = detectValidationPenalties(topRepos, username)

  const repoLanguages = topRepos.map((r) => r.language || "").filter(Boolean)
  const repoDescriptions = topRepos.map((r) => r.description || "").filter(Boolean)

  // Calculate per-skill scores with synonym boost
  const allEvidence: any[] = []
  const skillScores: SkillScore[] = skills.map((skill) => {
    const result = calculateSkillScore(skill, topRepos, username)

    if (result.score < 0.5) {
      // Use score < 0.5 for threshold, as score is 0-1
      const relatedBoost = getRelatedSkillBoost(skill.name, repoLanguages, repoDescriptions)
      if (relatedBoost > 0) {
        result.score = Math.min(1, result.score + relatedBoost) // Add boost to score
        result.reason = result.reason + ` (+${Math.round(relatedBoost * 100)}% from related skills)`
      }
    }

    allEvidence.push(...result.evidence)
    return result
  })

  const { cs, csRequired, csOptional, csRank, passGate, gateReason } = computeCapabilityScore(skillScores, tau)

  // Context signals and XS
  const contextResult = calculateContextSignals(topRepos, user, username)
  let xs = contextResult.xs

  // Learning velocity bonus
  const lvBonus = calculateLearningVelocity(topRepos)

  // FORGE = CS_rank * (0.6 + 0.4 * XS) + 0.05 * LV
  // This makes XS a modifier in [0.6, 1.0] range instead of direct multiplier
  let forgeScoreRaw = csRank * (0.6 + 0.4 * xs) + 0.05 * lvBonus
  let forgeScore = Math.min(1, Math.max(0, forgeScoreRaw))

  const gateStatus = passGate ? "ranked" : "filtered"
  const verdict = getVerdict(forgeScore * 100, gateStatus)

  // CompFit
  let compFit: CompFit | undefined = undefined

  if (salaryExpectation && jobConfig?.roleTitle) {
    const benchmark = calculateCompBenchmark({
      roleTitle: jobConfig.roleTitle || "Software Engineer",
      location: jobConfig.location || "Remote",
      currency: salaryExpectation.currency || "USD",
      seniority: jobConfig.seniority || "Mid",
      skills: skills.map((s) => s.name),
      industry: jobConfig.industry,
      companySize: jobConfig.companySize,
    })

    const candidateAsk = salaryExpectation.target || salaryExpectation.max || salaryExpectation.min || 0

    if (candidateAsk > 0 && benchmark.p50 > 0) {
      compFit = calculateCompFit(candidateAsk, benchmark)
      xs = xs * compFit.xsMultiplier
      forgeScoreRaw = csRank * (0.6 + 0.4 * xs) + 0.05 * lvBonus
      forgeScore = Math.min(1, Math.max(0, forgeScoreRaw))
    }
  }

  // Determine data quality
  const dataQuality: DataQuality = topRepos.length >= 10 ? "full" : topRepos.length >= 3 ? "partial" : "fallback"

  // Proof confidence (0-100)
  const ownedRepos = topRepos.filter((r) => r.owner.login.toLowerCase() === username.toLowerCase() && !r.fork)
  const recentRepos = topRepos.filter((r) => daysSince(r.pushed_at) < 90)
  const ownedWithDesc = ownedRepos.filter((r) => r.description && r.description.length > 20)
  const hasHighStarRepo = topRepos.some((r) => r.stargazers_count >= 50)
  const forkRatio = topRepos.filter((r) => r.fork).length / Math.max(topRepos.length, 1)
  const lastPushDays = topRepos.length > 0 ? daysSince(topRepos[0].pushed_at) : 999

  const csVerified = computeProofConfidence({
    totalRepos: topRepos.length,
    recentRepos: recentRepos.length,
    ownedWithDescription: ownedWithDesc.length,
    hasHighStarRepo,
    forkRatio,
    daysSinceLastPush: lastPushDays,
  })

  // Generate supporting data
  const interviewGuidance = generateInterviewQuestions(skills, skillScores, allEvidence)
  const timeline = generateTimeline(topRepos)
  const activityTrend = generateActivityTrend(topRepos)
  const risks = identifyRisks(skillScores, contextResult, csVerified, gateStatus)

  // Explanations
  const provenSkills = skillScores.filter((s) => s.status === "Proven")
  const weakSkills = skillScores.filter((s) => s.status === "Weak")
  const missingSkills = skillScores.filter((s) => s.status === "Missing")

  const strengths = provenSkills.map(
    (s) => `Strong ${s.name} evidence (${s.evidenceCount} repos, ${Math.round(s.score * 100)}%)`,
  )
  const weaknesses = [
    ...weakSkills.map((s) => `${s.name} needs verification (${Math.round(s.score * 100)}%)`),
    ...missingSkills.map((s) => `No ${s.name} evidence found`),
  ]
  const flags = risks.filter((r) => r.severity === "high").map((r) => r.description)

  const yearsActive = calcYearsActive(user.created_at)

  const explanations = buildExplanations({
    candidate: { name: user.name || username, github: username },
    skillScores,
    contextSignals: contextResult,
    evidence: allEvidence,
    gateStatus,
    forgeScore,
    cs,
    xs,
    tau,
  })

  const githubSummary = {
    hasRepos: topRepos.length > 0,
    repoCount: topRepos.length,
    languages: [...new Set(topRepos.map((r) => r.language).filter(Boolean))] as string[],
    topRepos: topRepos.slice(0, 5).map((r) => ({
      name: r.name,
      language: r.language || undefined,
      stars: r.stargazers_count,
    })),
  }

  const verification = buildSkillVerifications({
    jobSkills: skills,
    mergedEvidence: allEvidence.map((e) => ({
      skill: (e as any).skill || "",
      source: e.type || "github",
      proofTier: e.proofTier,
      reliability: e.reliability,
      description: e.description,
      title: e.title,
      url: e.url,
    })),
    githubSummary,
  })

  // Capability status based on gate status
  const capabilityStatus = gateStatus === "ranked" ? "Pass" : "Fail"

  // Salary expectation benchmark
  const salaryBenchmark =
    salaryExpectation ||
    calculateCompBenchmark({
      roleTitle: jobConfig?.roleTitle || "Software Engineer",
      location: jobConfig?.location || "Remote",
      currency: "USD",
      seniority: jobConfig?.seniority || "Mid",
      industry: jobConfig?.industry,
      companySize: jobConfig?.companySize,
      skills: skills.map((s) => s.name),
    })

  return {
    id: `${username}-${Date.now()}`,
    name: user.name || username,
    github: username,
    linkedin: "",
    portfolio: user.blog || null,
    avatar: user.avatar_url,
    headline: user.bio || `${user.public_repos} public repos · ${user.followers} followers`,

    capabilityScore: cs,
    contextScore: xs,
    forgeScore,
    gateStatus,
    tau,
    dataQuality,

    overallScore: Math.round(forgeScore * 100),
    finalScore: Math.round(forgeScore * 100),
    verdict,
    confidence: Math.round(csVerified * 100),
    proofConfidence: csVerified,

    yearsActive,
    activityTrend,
    learningVelocityBonus: lvBonus,

    capability: {
      status: capabilityStatus,
      score: Math.round(cs * 100),
      confidence: csVerified,
      skills: skillScores,
    },

    context: contextResult,
    evidence: allEvidence,
    explanations,
    explanation: {
      summary: `${verdict}: CS=${Math.round(cs * 100)}%, XS=${Math.round(xs * 100)}%, FORGE=${Math.round(forgeScore * 100)}%`,
      oneLiner:
        gateStatus === "ranked"
          ? `Passed gate (CS≥${tau * 100}%) with ${skillScores.filter((s) => s.status === "Proven").length}/${skills.length} proven skills`
          : `Filtered: CS ${Math.round(cs * 100)}% below τ=${tau * 100}%`,
      strengths,
      weaknesses,
      flags,
    },
    risks,
    interviewGuidance,
    evidenceTimeline: timeline,
    verification,
    compFit,
    salaryExpectation: salaryBenchmark,
  }
}

// Dummy fetch functions for illustration purposes
async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  // Placeholder implementation
  return {
    id: "12345",
    name: "John Doe",
    login: username,
    avatar_url: "https://example.com/avatar.jpg",
    bio: "Software Developer",
    blog: "https://example.com",
    followers: 100,
    public_repos: 50,
    created_at: "2015-01-01T00:00:00Z",
    type: "User", // Ensuring type is User
  }
}

async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  // Placeholder implementation
  return [
    {
      id: "67890",
      name: "Project1",
      description: "A project in JavaScript",
      html_url: "https://github.com/user/Project1",
      owner: { login: username },
      language: "JavaScript",
      stargazers_count: 50,
      forks_count: 10,
      watchers_count: 20,
      open_issues_count: 5,
      pushed_at: "2023-01-01T00:00:00Z",
      fork: false,
    },
    // Additional repos...
  ]
}

// Helper functions for required-only gating
function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x))
}

export function computeCapabilityScore(
  skillScores: SkillScore[],
  tau: number = DEFAULT_TAU,
): {
  cs: number
  csRequired: number
  csOptional: number
  csRank: number
  passGate: boolean
  gateReason: string
} {
  const requiredSkills = skillScores.filter((s) => s.isRequired !== false)
  const optionalSkills = skillScores.filter((s) => s.isRequired === false)

  // Calculate weighted average for required skills
  let requiredWeightSum = 0
  let requiredScoreSum = 0
  for (const skill of requiredSkills) {
    const weight = skill.weight || 10
    requiredWeightSum += weight
    requiredScoreSum += weight * skill.score
  }
  const csRequired = requiredWeightSum > 0 ? requiredScoreSum / requiredWeightSum : 0

  // Calculate weighted average for optional skills
  let optionalWeightSum = 0
  let optionalScoreSum = 0
  for (const skill of optionalSkills) {
    const weight = skill.weight || 10
    optionalWeightSum += weight
    optionalScoreSum += weight * skill.score
  }
  const csOptional = optionalWeightSum > 0 ? optionalScoreSum / optionalWeightSum : 0

  // CS_rank = clamp(CS_required + 0.25 * CS_optional, 0, 1)
  const csRank = Math.min(1, Math.max(0, csRequired + 0.25 * csOptional))

  // Gate is based on CS_required only
  const passGate = csRequired >= tau
  const gateReason = passGate
    ? `CS_required (${Math.round(csRequired * 100)}%) >= τ (${Math.round(tau * 100)}%)`
    : `CS_required (${Math.round(csRequired * 100)}%) < τ (${Math.round(tau * 100)}%) - insufficient verified proof on required skills`

  // Overall CS is weighted combination
  const totalWeight = requiredWeightSum + optionalWeightSum
  const cs = totalWeight > 0 ? (requiredScoreSum + optionalScoreSum) / totalWeight : 0

  return {
    cs,
    csRequired,
    csOptional,
    csRank,
    passGate,
    gateReason,
  }
}

// Skill synonym/bridge scoring - give partial credit for related skills
const SKILL_SYNONYMS: Record<string, string[]> = {
  "Node.js": ["REST API", "Express", "Fastify", "Hono", "API Routes", "Backend", "Server"],
  "REST API": ["Node.js", "Express", "FastAPI", "Django", "Rails", "Backend", "API"],
  React: ["JavaScript", "Frontend", "JSX", "React Native"],
  TypeScript: ["JavaScript", "Typed JavaScript"],
  JavaScript: ["TypeScript", "ES6", "Frontend"],
  "Next.js": ["React", "Vercel", "SSR", "App Router"],
  PostgreSQL: ["SQL", "Database", "Postgres", "Relational DB"],
  Docker: ["Containers", "Kubernetes", "DevOps", "CI/CD"],
  Kubernetes: ["Docker", "K8s", "Container Orchestration", "DevOps"],
  AWS: ["Cloud", "GCP", "Azure", "Infrastructure"],
  Testing: ["Jest", "Cypress", "Unit Testing", "E2E", "TDD"],
  Jest: ["Testing", "Unit Testing", "JavaScript Testing"],
  "CI/CD": ["GitHub Actions", "Jenkins", "DevOps", "Automation"],
}

export function getRelatedSkillBoost(skillName: string, repoLanguages: string[], repoDescriptions: string[]): number {
  // Use SKILL_CLUSTERS for more precise related skill boosting
  const clusters = SKILL_CLUSTERS[skillName] || []
  if (clusters.length === 0) return 0

  const allText = [...repoLanguages, ...repoDescriptions].join(" ").toLowerCase()

  let totalCredit = 0
  for (const cluster of clusters) {
    if (allText.includes(cluster.related.toLowerCase())) {
      totalCredit += cluster.credit
    }
  }

  // Max boost is limited by the cluster definition and capped at 0.3
  return Math.min(0.3, totalCredit)
}

function getVerdict(score: number, gateStatus: GateStatus): any {
  if (gateStatus === "filtered") {
    return "Reject"
  } else if (score >= 0.6) {
    return "Strong Hire"
  } else if (score >= 0.4) {
    return "Possible"
  } else if (score >= 0.25) {
    return "Risky but High Potential"
  } else {
    return "Reject"
  }
}
