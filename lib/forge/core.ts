// FORGE v3 - Receipts-Backed Capability Scoring (RBCS)
// Major improvements over v2:
// 1. CLAIM_ONLY now contributes 0.15x (not 0x)
// 2. Pool-relative tau with soft fallback
// 3. Corroboration boost (resume + GitHub = upgrade)
// 4. Soft must-haves (penalty, not auto-fail)
// 5. Learning velocity from forks
// 6. Gradual recency decay

import { z } from "zod"

/** -------------------------
 *  Types & Schemas
 *  ------------------------- */

export const ProofTierSchema = z.enum(["VERIFIED_ARTIFACT", "STRONG_SIGNAL", "WEAK_SIGNAL", "CLAIM_ONLY", "NONE"])
export type ProofTier = z.infer<typeof ProofTierSchema>

export const RequirementSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["skill", "experience", "responsibility", "constraint"]),
  importance: z.enum(["must", "should", "nice"]),
  weight: z.number().min(0).max(1),
  synonyms: z.array(z.string()).optional(),
  evidenceHints: z.array(z.string()).optional(),
})
export type Requirement = z.infer<typeof RequirementSchema>

export const JobSpecSchema = z.object({
  title: z.string(),
  seniority: z.enum(["intern", "junior", "mid", "senior", "staff", "lead"]).optional(),
  domain: z.string().optional(),
  requirements: z.array(RequirementSchema),
})
export type JobSpec = z.infer<typeof JobSpecSchema>

export const ArtifactChunkSchema = z.object({
  id: z.string(),
  source: z.enum(["resume", "github", "portfolio", "writing", "linkedin", "other"]),
  url: z.string().optional(),
  text: z.string(),
})
export type ArtifactChunk = z.infer<typeof ArtifactChunkSchema>

export const EvidenceItemSchema = z.object({
  requirementId: z.string(),
  proofTier: ProofTierSchema,
  strength: z.number().min(0).max(1),
  relevance: z.number().min(0).max(1),
  recency: z.number().min(0).max(1),
  snippet: z.string().min(1),
  source: ArtifactChunkSchema.shape.source,
  url: z.string().optional(),
  notes: z.string().optional(),
  corroboratedBy: z.array(z.string()).optional(), // e.g., ["github", "portfolio"]
})
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>

export const RequirementEvidenceSchema = z.object({
  requirementId: z.string(),
  items: z.array(EvidenceItemSchema),
})
export type RequirementEvidence = z.infer<typeof RequirementEvidenceSchema>

export type ContextWeights = {
  teamwork: number
  communication: number
  adaptability: number
  ownership: number
}

export type ContextScores = {
  teamwork: number
  communication: number
  adaptability: number
  ownership: number
}

export type ForgeConfig = {
  capabilityThreshold: number // τ, 0..100 (default 40, was 65)
  topKChunksPerReq: number
  strictEvidenceMode?: boolean
  poolRelativeTau?: boolean // Auto-adjust tau based on pool quality
  softMustHaves?: boolean // Missing must-haves = penalty, not auto-fail
  corroborationBoost?: boolean // Resume + GitHub = upgrade tier
  learningVelocityBoost?: boolean // Forks with changes = bonus
}

export type ForgeResult = {
  capabilityScoreVerified: number
  capabilityScoreTotal: number // New: includes claims
  passGate: boolean
  missingMustHaves: string[]
  mustHavePenalty: number // New: how much penalty was applied
  contextScores: ContextScores
  contextScore: number
  forgeScore: number
  confidence: number
  evidenceMatrix: RequirementEvidence[]
  debug: {
    tauUsed: number
    tauSource: "fixed" | "pool_relative" | "fallback"
    corroborationsApplied: number
    learningVelocityBonus: number
  }
}

export type InterviewPack = {
  plan15: string[]
  plan30: string[]
  plan60: string[]
  miniTasks: string[]
  screeningQuestions: string[]
}

/** -------------------------
 *  Proof tier multipliers - v3 UPDATED
 *  CLAIM_ONLY now contributes 0.15 (was 0.0)
 *  ------------------------- */

export const PROOF_MULTIPLIER: Record<ProofTier, number> = {
  VERIFIED_ARTIFACT: 1.0, // Owned GitHub repos, deployed projects
  STRONG_SIGNAL: 0.7, // Portfolio, contributions, corroborated claims
  WEAK_SIGNAL: 0.4, // LinkedIn, uncorroborated but plausible
  CLAIM_ONLY: 0.15, // Was 0.0, now 0.15 - claims still count for something
  NONE: 0.0,
}

export const PROOF_MULTIPLIER_VERIFIED: Record<ProofTier, number> = {
  VERIFIED_ARTIFACT: 1.0,
  STRONG_SIGNAL: 0.7,
  WEAK_SIGNAL: 0.4,
  CLAIM_ONLY: 0.0, // Claims don't count toward verified score
  NONE: 0.0,
}

/** -------------------------
 *  Utilities
 *  ------------------------- */

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim()
}

/**
 * New: Corroboration detection
 * If a claim in resume is also found in GitHub/portfolio, upgrade its tier
 */
export function detectCorroboration(items: EvidenceItem[], allChunks: ArtifactChunk[]): EvidenceItem[] {
  const githubChunks = allChunks.filter((c) => c.source === "github")
  const portfolioChunks = allChunks.filter((c) => c.source === "portfolio")
  const githubText = normalizeText(githubChunks.map((c) => c.text).join(" "))
  const portfolioText = normalizeText(portfolioChunks.map((c) => c.text).join(" "))

  return items.map((item) => {
    if (item.proofTier !== "CLAIM_ONLY" && item.proofTier !== "WEAK_SIGNAL") {
      return item
    }

    // Extract key terms from the snippet
    const snippetTerms = normalizeText(item.snippet)
      .split(/\s+/)
      .filter((t) => t.length > 3)
      .slice(0, 10)

    const corroboratedBy: string[] = []

    // Check if terms appear in GitHub
    const githubMatches = snippetTerms.filter((t) => githubText.includes(t)).length
    if (githubMatches >= 3) {
      corroboratedBy.push("github")
    }

    // Check if terms appear in portfolio
    const portfolioMatches = snippetTerms.filter((t) => portfolioText.includes(t)).length
    if (portfolioMatches >= 2) {
      corroboratedBy.push("portfolio")
    }

    if (corroboratedBy.length > 0) {
      // Upgrade tier
      let newTier: ProofTier = item.proofTier
      if (item.proofTier === "CLAIM_ONLY") {
        newTier = corroboratedBy.includes("github") ? "STRONG_SIGNAL" : "WEAK_SIGNAL"
      } else if (item.proofTier === "WEAK_SIGNAL" && corroboratedBy.includes("github")) {
        newTier = "STRONG_SIGNAL"
      }

      return {
        ...item,
        proofTier: newTier,
        corroboratedBy,
        notes: (item.notes || "") + ` | Corroborated by: ${corroboratedBy.join(", ")}`,
      }
    }

    return item
  })
}

/**
 * Verify that the LLM-provided snippet is actually present in the retrieved chunks.
 * If not, we downgrade it (anti-hallucination).
 */
export function verifyEvidenceSnippets(
  reqEvidence: RequirementEvidence,
  retrievedChunks: ArtifactChunk[],
  strictEvidenceMode = false,
): RequirementEvidence {
  const corpus = normalizeText(retrievedChunks.map((c) => c.text).join("\n"))

  const fixed: EvidenceItem[] = reqEvidence.items.map((it) => {
    const snippet = normalizeText(it.snippet)
    const snippetTerms = snippet.split(/\s+/).filter((t) => t.length > 4)
    const matchedTerms = snippetTerms.filter((t) => corpus.includes(t))
    const matchRatio = snippetTerms.length > 0 ? matchedTerms.length / snippetTerms.length : 0

    const ok = matchRatio >= 0.5 || (snippet.length >= 8 && corpus.includes(snippet))
    if (ok) return it

    if (strictEvidenceMode) {
      return {
        ...it,
        proofTier: "NONE",
        strength: 0,
        relevance: 0,
        recency: 0,
        snippet: it.snippet,
        notes: (it.notes ? it.notes + " | " : "") + "Snippet not found; strict mode => NONE.",
      }
    }

    return {
      ...it,
      proofTier:
        it.proofTier === "VERIFIED_ARTIFACT"
          ? "STRONG_SIGNAL"
          : it.proofTier === "STRONG_SIGNAL"
            ? "WEAK_SIGNAL"
            : "CLAIM_ONLY",
      strength: Math.min(it.strength, 0.5), // Was 0.3
      relevance: Math.min(it.relevance, 0.6), // Was 0.5
      notes: (it.notes ? it.notes + " | " : "") + "Snippet partially matched; downgraded.",
    }
  })

  return { ...reqEvidence, items: fixed }
}

/** -------------------------
 *  Requirement + Capability scoring - v3 UPDATED
 *  ------------------------- */

export function scoreRequirement(items: EvidenceItem[], useVerifiedOnly = false): number {
  const multipliers = useVerifiedOnly ? PROOF_MULTIPLIER_VERIFIED : PROOF_MULTIPLIER

  const scores = items
    .map((it) => {
      const tier = multipliers[it.proofTier]
      const s = clamp01(it.strength)
      const r = clamp01(it.relevance)
      const rec = clamp01(it.recency)
      const recencyFactor = 0.3 + 0.7 * Math.sqrt(rec)
      return tier * s * r * recencyFactor
    })
    .sort((a, b) => b - a)

  if (scores.length === 0) return 0
  if (scores.length === 1) return scores[0]

  // Weighted average: best = 60%, second = 30%, third = 10%
  const weights = [0.6, 0.3, 0.1]
  let total = 0
  let weightSum = 0
  for (let i = 0; i < Math.min(3, scores.length); i++) {
    total += scores[i] * weights[i]
    weightSum += weights[i]
  }

  return total / weightSum
}

export function scoreCapability(
  job: JobSpec,
  matrix: RequirementEvidence[],
  config?: { softMustHaves?: boolean },
): {
  capabilityScoreVerified: number
  capabilityScoreTotal: number
  missingMustHaves: string[]
  mustHavePenalty: number
} {
  const byReq = new Map(matrix.map((m) => [m.requirementId, m]))

  let weightedSumVerified = 0
  let weightedSumTotal = 0
  let weightTotal = 0
  const missingMustHaves: string[] = []

  for (const req of job.requirements) {
    const m = byReq.get(req.id)
    const reqScoreVerified = m ? scoreRequirement(m.items, true) : 0
    const reqScoreTotal = m ? scoreRequirement(m.items, false) : 0

    weightedSumVerified += req.weight * reqScoreVerified
    weightedSumTotal += req.weight * reqScoreTotal
    weightTotal += req.weight

    if (req.importance === "must" && reqScoreVerified < 0.25) {
      missingMustHaves.push(req.label)
    }
  }

  const scoreVerified = weightTotal > 0 ? (weightedSumVerified / weightTotal) * 100 : 0
  const scoreTotal = weightTotal > 0 ? (weightedSumTotal / weightTotal) * 100 : 0

  let mustHavePenalty = 0
  if (config?.softMustHaves && missingMustHaves.length > 0) {
    // Each missing must-have reduces score by 15%, max 45% total penalty
    mustHavePenalty = Math.min(missingMustHaves.length * 15, 45)
  }

  return {
    capabilityScoreVerified: Math.round(Math.max(0, scoreVerified - mustHavePenalty)),
    capabilityScoreTotal: Math.round(scoreTotal),
    missingMustHaves,
    mustHavePenalty,
  }
}

/** -------------------------
 *  Context scoring - v3 ENHANCED
 *  ------------------------- */

const SIGNALS = {
  teamwork: {
    strong: ["collaborated", "cross-functional", "pair programming", "code review", "mentored", "team lead"],
    medium: ["team", "worked with", "alongside", "together", "group"],
    weak: ["we", "our", "helped"],
  },
  communication: {
    strong: ["documentation", "technical writing", "design doc", "rfc", "presented", "blog post", "published"],
    medium: ["readme", "explained", "stakeholder", "communicated", "wrote"],
    weak: ["meeting", "discussed", "shared"],
  },
  adaptability: {
    strong: ["migrated", "refactored", "learned new", "pivoted", "transformed", "modernized"],
    medium: ["adapted", "multiple stacks", "various technologies", "different", "switched"],
    weak: ["changed", "updated", "new"],
  },
  ownership: {
    strong: ["owned end-to-end", "led", "architected", "launched", "shipped to production", "drove"],
    medium: ["responsible for", "maintained", "primary owner", "built"],
    weak: ["worked on", "contributed", "involved"],
  },
} as const

function enhancedKeywordScore(
  text: string,
  signals: { strong: readonly string[]; medium: readonly string[]; weak: readonly string[] },
): number {
  const t = normalizeText(text)
  let score = 0

  // Strong signals: 3 points each, max 5 matches
  for (const needle of signals.strong) {
    if (t.includes(needle)) score += 3
  }
  score = Math.min(score, 15)

  // Medium signals: 1.5 points each, max 5 matches
  let mediumScore = 0
  for (const needle of signals.medium) {
    if (t.includes(needle)) mediumScore += 1.5
  }
  score += Math.min(mediumScore, 7.5)

  // Weak signals: 0.5 points each, max 3 matches
  let weakScore = 0
  for (const needle of signals.weak) {
    if (t.includes(needle)) weakScore += 0.5
  }
  score += Math.min(weakScore, 1.5)

  // Normalize to 0-1 (max possible ~24)
  return clamp01(score / 24)
}

export function scoreContextFromText(
  combinedText: string,
  weights: ContextWeights,
): { contextScores: ContextScores; contextScore: number } {
  const raw: ContextScores = {
    teamwork: enhancedKeywordScore(combinedText, SIGNALS.teamwork),
    communication: enhancedKeywordScore(combinedText, SIGNALS.communication),
    adaptability: enhancedKeywordScore(combinedText, SIGNALS.adaptability),
    ownership: enhancedKeywordScore(combinedText, SIGNALS.ownership),
  }

  const wSum = weights.teamwork + weights.communication + weights.adaptability + weights.ownership
  const contextScore =
    wSum > 0
      ? (raw.teamwork * weights.teamwork +
          raw.communication * weights.communication +
          raw.adaptability * weights.adaptability +
          raw.ownership * weights.ownership) /
        wSum
      : 0

  return { contextScores: raw, contextScore: clamp01(contextScore * 1.15) }
}

/** -------------------------
 *  Pool-relative tau calculation
 *  ------------------------- */

export function computePoolRelativeTau(
  candidateScores: number[],
  defaultTau = 40,
): { tau: number; source: "pool_relative" | "fixed" | "fallback" } {
  if (candidateScores.length < 3) {
    return { tau: defaultTau, source: "fixed" }
  }

  const sorted = [...candidateScores].sort((a, b) => a - b)

  // Use p40 of pool as tau (so ~60% of candidates pass if evenly distributed)
  const p40Index = Math.floor(sorted.length * 0.4)
  const p40 = sorted[p40Index]

  // Clamp tau between 25 and 60
  const tau = Math.max(25, Math.min(60, p40))

  return { tau, source: "pool_relative" }
}

/** -------------------------
 *  Learning velocity from forks
 *  ------------------------- */

export function calculateLearningVelocity(chunks: ArtifactChunk[]): number {
  const githubChunks = chunks.filter((c) => c.source === "github")
  const text = normalizeText(githubChunks.map((c) => c.text).join(" "))

  // Look for learning indicators
  const learningSignals = [
    "forked from",
    "based on",
    "inspired by",
    "learning",
    "tutorial",
    "course",
    "bootcamp",
    "self-taught",
    "practicing",
    "experimenting",
  ]

  // Look for modification indicators (they didn't just fork, they changed things)
  const modificationSignals = [
    "modified",
    "customized",
    "extended",
    "added",
    "improved",
    "refactored",
    "updated",
    "enhanced",
    "built on top",
  ]

  let learningScore = 0
  let modScore = 0

  for (const signal of learningSignals) {
    if (text.includes(signal)) learningScore += 1
  }
  for (const signal of modificationSignals) {
    if (text.includes(signal)) modScore += 1
  }

  // If they have both learning indicators AND modification indicators, bonus
  if (learningScore > 0 && modScore > 0) {
    return clamp01((learningScore + modScore * 2) / 10)
  }

  return 0
}

/** -------------------------
 *  Confidence scoring
 *  ------------------------- */

export function computeConfidence(job: JobSpec, matrix: RequirementEvidence[]): number {
  const byReq = new Map(matrix.map((m) => [m.requirementId, m]))

  let covered = 0
  let strongCovered = 0
  for (const req of job.requirements) {
    const m = byReq.get(req.id)
    const hasEvidence = m?.items?.some((it) => it.proofTier !== "NONE" && it.proofTier !== "CLAIM_ONLY")
    const hasStrong = m?.items?.some((it) => it.proofTier === "VERIFIED_ARTIFACT" || it.proofTier === "STRONG_SIGNAL")
    if (hasEvidence) covered += 1
    if (hasStrong) strongCovered += 1
  }

  const coverage = job.requirements.length > 0 ? covered / job.requirements.length : 0
  const strongCoverage = job.requirements.length > 0 ? strongCovered / job.requirements.length : 0

  const totalItems = matrix.reduce((acc, m) => acc + m.items.length, 0)
  const depth = clamp01(Math.log1p(totalItems) / Math.log1p(40))

  return clamp01(0.4 * coverage + 0.35 * strongCoverage + 0.25 * depth)
}

/** -------------------------
 *  Retrieval (keyword baseline)
 *  ------------------------- */

function tokenize(s: string): string[] {
  return normalizeText(s)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(" ")
    .filter(Boolean)
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a)
  const B = new Set(b)
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  const union = A.size + B.size - inter
  return union === 0 ? 0 : inter / union
}

export function retrieveTopChunks(requirement: Requirement, chunks: ArtifactChunk[], k = 8): ArtifactChunk[] {
  const query = [requirement.label, ...(requirement.synonyms ?? []), ...(requirement.evidenceHints ?? [])].join(" ")
  const qTok = tokenize(query)

  return chunks
    .map((c) => ({ c, s: jaccard(qTok, tokenize(c.text)) }))
    .sort((x, y) => y.s - x.s)
    .slice(0, k)
    .map((x) => x.c)
}

/** -------------------------
 *  Chunking utilities
 *  ------------------------- */

export function chunkText(text: string, source: ArtifactChunk["source"], baseUrl?: string): ArtifactChunk[] {
  const chunks: ArtifactChunk[] = []
  const lines = text.split("\n")
  let buffer = ""
  let chunkIndex = 0

  for (const line of lines) {
    buffer += line + "\n"
    if (buffer.length >= 800) {
      chunks.push({
        id: `${source}-chunk-${chunkIndex++}`,
        source,
        url: baseUrl,
        text: buffer.trim(),
      })
      buffer = ""
    }
  }

  if (buffer.trim()) {
    chunks.push({
      id: `${source}-chunk-${chunkIndex}`,
      source,
      url: baseUrl,
      text: buffer.trim(),
    })
  }

  return chunks
}

/** -------------------------
 *  End-to-end scoring (LLM plugs in here)
 *  ------------------------- */

export type ForgeLLM = {
  scoreRequirementEvidence: (args: {
    requirement: Requirement
    retrievedChunks: ArtifactChunk[]
  }) => Promise<RequirementEvidence>
  extractJobSpecFromJD: (args: { jobTitle: string; jobDescription: string }) => Promise<JobSpec>
  generateInterviewPack: (args: {
    job: JobSpec
    evidenceMatrix: RequirementEvidence[]
    missingMustHaves: string[]
  }) => Promise<InterviewPack>
}

export async function runForgeAnalysis(args: {
  job: JobSpec
  chunks: ArtifactChunk[]
  contextWeights: ContextWeights
  cfg: ForgeConfig
  llm: ForgeLLM
  poolScores?: number[] // For pool-relative tau
}): Promise<ForgeResult> {
  const { job, chunks, contextWeights, cfg, llm, poolScores } = args

  const evidenceMatrix: RequirementEvidence[] = []

  for (const req of job.requirements) {
    const topChunks = retrieveTopChunks(req, chunks, cfg.topKChunksPerReq)
    const raw = await llm.scoreRequirementEvidence({ requirement: req, retrievedChunks: topChunks })
    let fixed = verifyEvidenceSnippets(raw, topChunks, !!cfg.strictEvidenceMode)

    if (cfg.corroborationBoost !== false) {
      fixed = { ...fixed, items: detectCorroboration(fixed.items, chunks) }
    }

    evidenceMatrix.push(fixed)
  }

  const { capabilityScoreVerified, capabilityScoreTotal, missingMustHaves, mustHavePenalty } = scoreCapability(
    job,
    evidenceMatrix,
    { softMustHaves: cfg.softMustHaves !== false },
  )

  let tauResult: { tau: number; source: "pool_relative" | "fixed" | "fallback" }
  if (cfg.poolRelativeTau && poolScores && poolScores.length >= 3) {
    tauResult = computePoolRelativeTau(poolScores, cfg.capabilityThreshold)
  } else {
    tauResult = { tau: cfg.capabilityThreshold, source: "fixed" }
  }

  const passGate = capabilityScoreVerified >= tauResult.tau

  const combinedText = chunks.map((c) => c.text).join("\n")
  const { contextScores, contextScore } = scoreContextFromText(combinedText, contextWeights)

  const learningVelocityBonus = cfg.learningVelocityBoost !== false ? calculateLearningVelocity(chunks) * 5 : 0

  const forgeScore = Math.round((capabilityScoreVerified + learningVelocityBonus) * contextScore)
  const confidence = computeConfidence(job, evidenceMatrix)

  // Count corroborations
  const corroborationsApplied = evidenceMatrix.reduce(
    (acc, m) => acc + m.items.filter((it) => it.corroboratedBy && it.corroboratedBy.length > 0).length,
    0,
  )

  return {
    capabilityScoreVerified,
    capabilityScoreTotal,
    passGate,
    missingMustHaves,
    mustHavePenalty,
    contextScores,
    contextScore,
    forgeScore,
    confidence,
    evidenceMatrix,
    debug: {
      tauUsed: tauResult.tau,
      tauSource: tauResult.source,
      corroborationsApplied,
      learningVelocityBonus,
    },
  }
}

/** -------------------------
 *  Deterministic fallback (no LLM) - v3 UPDATED
 *  ------------------------- */

export function scoreRequirementDeterministic(requirement: Requirement, chunks: ArtifactChunk[]): RequirementEvidence {
  const items: EvidenceItem[] = []
  const query = [requirement.label, ...(requirement.synonyms ?? [])].map((s) => normalizeText(s))

  for (const chunk of chunks) {
    const text = normalizeText(chunk.text)
    for (const q of query) {
      const idx = text.indexOf(q)
      if (idx !== -1) {
        const start = Math.max(0, idx - 50)
        const end = Math.min(text.length, idx + q.length + 100)
        const snippet = chunk.text.substring(start, end).trim()

        let proofTier: ProofTier = "WEAK_SIGNAL"
        if (chunk.source === "github") proofTier = "VERIFIED_ARTIFACT"
        else if (chunk.source === "portfolio") proofTier = "STRONG_SIGNAL"
        else if (chunk.source === "writing") proofTier = "STRONG_SIGNAL"
        else if (chunk.source === "linkedin") proofTier = "WEAK_SIGNAL"
        else if (chunk.source === "resume") proofTier = "CLAIM_ONLY" // Will be upgraded if corroborated

        // Check for URLs in snippet for upgrade
        if (snippet.includes("http") || snippet.includes("github.com") || snippet.includes("deployed")) {
          if (proofTier === "CLAIM_ONLY") proofTier = "WEAK_SIGNAL"
          if (proofTier === "WEAK_SIGNAL") proofTier = "STRONG_SIGNAL"
        }

        const matchQuality = q.length > 10 ? 0.9 : q.length > 5 ? 0.7 : 0.5
        const baseStrength =
          proofTier === "VERIFIED_ARTIFACT"
            ? 0.9
            : proofTier === "STRONG_SIGNAL"
              ? 0.75
              : proofTier === "WEAK_SIGNAL"
                ? 0.5
                : 0.3

        items.push({
          requirementId: requirement.id,
          proofTier,
          strength: baseStrength * matchQuality,
          relevance: 0.8,
          recency: 0.7,
          snippet,
          source: chunk.source,
          url: chunk.url,
        })
        break
      }
    }
  }

  // If no matches, add a NONE item but with partial score if claim exists
  if (items.length === 0) {
    const allText = normalizeText(chunks.map((c) => c.text).join(" "))
    const hasRelatedMention = query.some((q) => {
      const terms = q.split(" ").filter((t) => t.length > 3)
      return terms.some((t) => allText.includes(t))
    })

    items.push({
      requirementId: requirement.id,
      proofTier: hasRelatedMention ? "CLAIM_ONLY" : "NONE",
      strength: hasRelatedMention ? 0.2 : 0,
      relevance: hasRelatedMention ? 0.3 : 0,
      recency: 0.5,
      snippet: hasRelatedMention ? "Related terms found but no direct match" : "No evidence found",
      source: "other",
    })
  }

  return { requirementId: requirement.id, items }
}

export function runForgeAnalysisDeterministic(args: {
  job: JobSpec
  chunks: ArtifactChunk[]
  contextWeights: ContextWeights
  cfg: ForgeConfig
  poolScores?: number[]
}): ForgeResult {
  const { job, chunks, contextWeights, cfg, poolScores } = args

  let evidenceMatrix: RequirementEvidence[] = job.requirements.map((req) => {
    const topChunks = retrieveTopChunks(req, chunks, cfg.topKChunksPerReq)
    return scoreRequirementDeterministic(req, topChunks)
  })

  if (cfg.corroborationBoost !== false) {
    evidenceMatrix = evidenceMatrix.map((m) => ({
      ...m,
      items: detectCorroboration(m.items, chunks),
    }))
  }

  const { capabilityScoreVerified, capabilityScoreTotal, missingMustHaves, mustHavePenalty } = scoreCapability(
    job,
    evidenceMatrix,
    { softMustHaves: cfg.softMustHaves !== false },
  )

  let tauResult: { tau: number; source: "pool_relative" | "fixed" | "fallback" }
  if (cfg.poolRelativeTau && poolScores && poolScores.length >= 3) {
    tauResult = computePoolRelativeTau(poolScores, cfg.capabilityThreshold)
  } else {
    tauResult = { tau: cfg.capabilityThreshold, source: "fixed" }
  }

  const passGate = capabilityScoreVerified >= tauResult.tau

  const combinedText = chunks.map((c) => c.text).join("\n")
  const { contextScores, contextScore } = scoreContextFromText(combinedText, contextWeights)

  const learningVelocityBonus = cfg.learningVelocityBoost !== false ? calculateLearningVelocity(chunks) * 5 : 0

  const forgeScore = Math.round((capabilityScoreVerified + learningVelocityBonus) * contextScore)
  const confidence = computeConfidence(job, evidenceMatrix)

  const corroborationsApplied = evidenceMatrix.reduce(
    (acc, m) => acc + m.items.filter((it) => it.corroboratedBy && it.corroboratedBy.length > 0).length,
    0,
  )

  return {
    capabilityScoreVerified,
    capabilityScoreTotal,
    passGate,
    missingMustHaves,
    mustHavePenalty,
    contextScores,
    contextScore,
    forgeScore,
    confidence,
    evidenceMatrix,
    debug: {
      tauUsed: tauResult.tau,
      tauSource: tauResult.source,
      corroborationsApplied,
      learningVelocityBonus,
    },
  }
}
