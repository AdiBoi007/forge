// FORGE Core Types - Multi-Signal + ML Support + Proof Hierarchy
// ============================================

export type EvidenceSource = "github" | "portfolio" | "writing" | "linkedin" | "resume" | "extracurricular" | "other"
export type ProofTier = "owned_artifact" | "linked_artifact" | "third_party" | "claim_only"
export type VerificationStatus = "unverified" | "needs_review" | "verified"

export type CandidateSignals = {
  githubUsername?: string
  linkedinUrl?: string
  linkedinText?: string
  resumeText?: string
  portfolioUrl?: string
  writingLinks?: string[]
  extracurricularText?: string
}

export type RoleType = "engineer" | "designer" | "pm" | "recruiter" | "marketing" | "data" | "ops" | "other"

export type CandidateInput = {
  id: string
  name: string
  roleType?: RoleType
  signals: CandidateSignals
}

export type ExtractedSkill = {
  name: string
  strength: number // 0-1
  proofTier: ProofTier
  source: EvidenceSource
  receipts: string[]
  reliability: number // 0-1
}

export type ExtractedProof = {
  type:
    | "case_study"
    | "deck"
    | "paper"
    | "design"
    | "campaign"
    | "ops"
    | "product"
    | "research"
    | "certification"
    | "award"
    | "talk"
    | "publication"
  title: string
  url?: string
  claimedImpact: string
  mappedSkills: string[]
  proofTier: ProofTier
  receipts: string[]
  reliability: number
}

export type ExtractedTrait = {
  score: number
  proofTier: ProofTier
  receipts: string[]
  reliability: number
}

export type ExtractedSignals = {
  skills: ExtractedSkill[]
  proof: ExtractedProof[]
  traits: {
    teamwork: ExtractedTrait
    communication: ExtractedTrait
    adaptability: ExtractedTrait
    ownership: ExtractedTrait
  }
  warnings: string[]
}

export type ReliabilityReport = {
  overall: number // 0..1
  sources: { source: EvidenceSource; reliability: number; note?: string }[]
}

export type TrainingExample = {
  features: number[]
  label: 0 | 1
}

export type TrainedModel = {
  version: string
  trainedAt: string
  weights: number[] // length = N_FEATURES
  bias: number
  featureOrder: string[]
  metrics: {
    accuracy: number
    precision: number
    recall: number
    f1: number
    n: number
  }
}

export type CalibrationLabel = {
  candidateId: string
  jobHash: string
  outcome: "hired" | "rejected" | "good_hire" | "bad_hire"
  labeledAt: string
}

export type OutcomeRecord = {
  candidateId: string
  analysisId?: string
  hiredAt: string
  probationPassed: boolean
  managerRating: 1 | 2 | 3 | 4 | 5
  retention3mo?: boolean
  timeToProductivityDays?: number
  traitRatings?: {
    ownership: 1 | 2 | 3 | 4 | 5
    communication: 1 | 2 | 3 | 4 | 5
    teamwork: 1 | 2 | 3 | 4 | 5
    adaptability: 1 | 2 | 3 | 4 | 5
  }
  notes?: string
}

export type ModelUpdateReport = {
  oldVersion?: string
  newVersion: string
  datasetSize: number
  confidence: "LOW" | "MED" | "HIGH"
  topChanges: { feature: string; delta: number }[]
  notes: string[]
}

// Signal badge for UI
export type SignalBadge = "GitHub-backed" | "Portfolio-backed" | "Mixed" | "Claim-only"

export const SOURCE_WEIGHTS: Record<EvidenceSource, number> = {
  github: 1.0,
  portfolio: 0.6,
  writing: 0.5,
  extracurricular: 0.35,
  linkedin: 0.1,
  resume: 0.1,
  other: 0.2,
}

export const PROOF_TIER_WEIGHTS: Record<ProofTier, number> = {
  owned_artifact: 1.0,
  linked_artifact: 0.7,
  third_party: 0.5,
  claim_only: 0.15,
}

export type ResumeExtractMeta = {
  fileName?: string
  mimeType?: string
  charCount: number
  isLikelyScanned: boolean
  extractionMethod: "pdf-parse" | "mammoth" | "fallback"
  warnings?: string[]
}

export type ResumeExtractResponse = {
  success: boolean
  text: string
  meta: ResumeExtractMeta
  error?: string
}

export type SupportLevel = "supported" | "partial" | "unverified"

export type VerificationReceipt = {
  source: EvidenceSource
  proofTier?: ProofTier
  reliability?: number
  text: string
  url?: string
}

export type SkillVerification = {
  skill: string
  support: SupportLevel
  confidence: "high" | "medium" | "low"
  receipts: VerificationReceipt[]
  notes?: string[]
}

export type VerificationSummary = {
  supportedCount: number
  partialCount: number
  unverifiedCount: number
  overallSupportScore: number // 0-100
  warnings: string[]
}

export type CandidateVerification = {
  summary: VerificationSummary
  skills: SkillVerification[]
}

export type EmployeeOutcome = {
  employeeId: string
  hiredAt: string
  department:
    | "Engineering"
    | "Product"
    | "Design"
    | "Recruiting"
    | "Marketing"
    | "Sales"
    | "Data"
    | "Operations"
    | "CustomerSuccess"
  role: string
  level: "Intern" | "Junior" | "Mid" | "Senior" | "Lead"
  team: string

  featureSnapshot: {
    cs_verified: number
    cs_total: number
    xs: number
    forgeScore: number
    proofConfidence: number
    forkRatio: number
    burstiness: number
    recency: number
    teamwork: number
    communication: number
    adaptability: number
    ownership: number
    missingSkillsCount: number
    weakSkillsCount: number
    nonGithubSignalsPresent: 0 | 1
  }

  outcome: {
    probationPassed: boolean
    managerRating1to5: number
    rampTimeDays: number
    regrettedHire: boolean
    notes?: string
  }
}
