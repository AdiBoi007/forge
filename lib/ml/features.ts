// Feature Engineering for ML Calibration
// ============================================

import type { CandidateAnalysis } from "@/lib/scoring"

// Feature order must be consistent across training and prediction
export const FEATURE_ORDER = [
  "cs", // Capability Score
  "xs", // Context Score
  "forgeScore", // CS × XS
  "proofConfidence", // 0-100 normalized to 0-1
  "forkRatio", // 0-1, high = bad
  "burstiness", // 0 or 1
  "recency", // 0-1, higher = more recent
  "teamwork", // 0-1
  "communication", // 0-1
  "adaptability", // 0-1
  "ownership", // 0-1
  "missingSkillsCount", // normalized by total skills
  "weakSkillsCount", // normalized by total skills
  "nonGithubSignalsPresent", // 0 or 1
] as const

export type FeatureName = (typeof FEATURE_ORDER)[number]

export function buildFeatureVector(
  analysis: CandidateAnalysis,
  debug = false,
): { features: number[]; debugInfo?: Record<string, number> } {
  const totalSkills = analysis.capability.skills.length || 1
  const missingCount = analysis.capability.skills.filter((s) => s.status === "Missing").length
  const weakCount = analysis.capability.skills.filter((s) => s.status === "Weak").length

  // Estimate recency from activity trend (higher recent = better)
  const trend = analysis.activityTrend || [0, 0, 0, 0, 0, 0]
  const recentActivity = trend.slice(-2).reduce((a, b) => a + b, 0)
  const totalActivity = trend.reduce((a, b) => a + b, 0)
  const recency = totalActivity > 0 ? recentActivity / totalActivity : 0.5

  // Estimate fork ratio and burstiness from data quality
  const forkRatio = analysis.dataQuality === "fallback" ? 0.5 : 0.1
  const burstiness = analysis.dataQuality === "fallback" ? 1 : 0

  // Check for non-GitHub signals
  const hasNonGithub = !!(analysis.linkedin || analysis.portfolio)

  const features: number[] = [
    analysis.capabilityScore, // cs
    analysis.contextScore, // xs
    analysis.forgeScore, // forgeScore
    analysis.proofConfidence / 100, // proofConfidence normalized
    forkRatio, // forkRatio
    burstiness, // burstiness
    recency, // recency
    analysis.context.teamwork.score, // teamwork
    analysis.context.communication.score, // communication
    analysis.context.adaptability.score, // adaptability
    analysis.context.ownership.score, // ownership
    missingCount / totalSkills, // missingSkillsCount normalized
    weakCount / totalSkills, // weakSkillsCount normalized
    hasNonGithub ? 1 : 0, // nonGithubSignalsPresent
  ]

  if (debug) {
    const debugInfo: Record<string, number> = {}
    FEATURE_ORDER.forEach((name, i) => {
      debugInfo[name] = features[i]
    })
    return { features, debugInfo }
  }

  return { features }
}

export function getFeatureOrder(): string[] {
  return [...FEATURE_ORDER]
}
