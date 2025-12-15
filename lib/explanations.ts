// FORGE Explainability Engine
// Generates "Top reasons", "Risks", "Missing proof" for candidates

import type { SkillScore, ContextSignal, Evidence, GateStatus } from "@/lib/scoring"

export interface CandidateExplanations {
  topReasons: string[] // exactly 3 short bullets
  risks: string[] // exactly 2 bullets
  missingProof: string[] // skills with weak/missing evidence (max 4)
}

export function buildExplanations(params: {
  candidate: { name: string; github: string }
  skillScores: SkillScore[]
  contextSignals: {
    teamwork: ContextSignal
    communication: ContextSignal
    adaptability: ContextSignal
    ownership: ContextSignal
  }
  evidence: Evidence[]
  gateStatus: GateStatus
  forgeScore: number
  cs: number // Capability Score
  xs: number // Context Score
  tau: number
}): CandidateExplanations {
  const { skillScores, contextSignals, evidence, gateStatus, forgeScore, cs, xs, tau } = params

  const provenSkills = skillScores.filter((s) => s.status === "Proven")
  const weakSkills = skillScores.filter((s) => s.status === "Weak")
  const missingSkills = skillScores.filter((s) => s.status === "Missing")

  const totalEvidence = evidence.length
  const ownedEvidence = evidence.filter((e) => e.evidenceTier === "owned").length

  // Build top reasons (exactly 3)
  const topReasons: string[] = []

  // Reason 1: Gate status and CS
  if (gateStatus === "ranked") {
    if (provenSkills.length > 0) {
      const skillNames = provenSkills
        .slice(0, 3)
        .map((s) => s.name)
        .join(", ")
      topReasons.push(`Passed gate (CS=${Math.round(cs * 100)}% ≥ τ=${tau * 100}%) with ${skillNames} proven.`)
    } else {
      topReasons.push(`Passed capability gate with CS=${Math.round(cs * 100)}%.`)
    }
  } else {
    topReasons.push(`Filtered: CS=${Math.round(cs * 100)}% below threshold τ=${tau * 100}%.`)
  }

  // Reason 2: Evidence quality
  if (ownedEvidence >= 3) {
    topReasons.push(`${ownedEvidence} owned repositories provide high-confidence evidence.`)
  } else if (totalEvidence >= 5) {
    topReasons.push(`${totalEvidence} evidence pieces analyzed across public activity.`)
  } else if (totalEvidence > 0) {
    topReasons.push(`Limited evidence (${totalEvidence} repos) — confidence is lower.`)
  } else {
    topReasons.push(`No qualifying evidence found in public repositories.`)
  }

  // Reason 3: Context score
  const strongContexts = [
    { name: "Ownership", score: contextSignals.ownership.score },
    { name: "Teamwork", score: contextSignals.teamwork.score },
    { name: "Communication", score: contextSignals.communication.score },
    { name: "Adaptability", score: contextSignals.adaptability.score },
  ].filter((c) => c.score >= 0.6)

  if (strongContexts.length > 0) {
    const best = strongContexts.sort((a, b) => b.score - a.score)[0]
    topReasons.push(
      `Strong ${best.name.toLowerCase()} (${Math.round(best.score * 100)}%) boosts XS=${Math.round(xs * 100)}%.`,
    )
  } else {
    topReasons.push(`Context score XS=${Math.round(xs * 100)}% — FORGE=${Math.round(forgeScore * 100)}%.`)
  }

  // Ensure exactly 3 reasons
  while (topReasons.length < 3) {
    topReasons.push(`FORGE_SCORE = CS × XS = ${Math.round(forgeScore * 100)}%.`)
  }

  // Build risks (exactly 2)
  const risks: string[] = []

  // Risk 1: Skill gaps or gate failure
  if (gateStatus === "filtered") {
    risks.push(`Failed capability gate — cannot be ranked until CS ≥ ${tau * 100}%.`)
  } else if (missingSkills.length > 0) {
    risks.push(
      `Missing evidence for: ${missingSkills
        .map((s) => s.name)
        .slice(0, 2)
        .join(", ")}.`,
    )
  } else if (weakSkills.length > 0) {
    risks.push(
      `Weak evidence for ${weakSkills[0].name} (${Math.round(weakSkills[0].score * 100)}%) needs verification.`,
    )
  } else {
    risks.push(`All skills proven — low risk on capability.`)
  }

  // Risk 2: Context or confidence issues
  if (contextSignals.teamwork.score < 0.4) {
    risks.push(
      `Low teamwork signal (${Math.round(contextSignals.teamwork.score * 100)}%) — limited collaboration evidence.`,
    )
  } else if (ownedEvidence < 2) {
    risks.push(`Few owned repos — evidence relies on contributions to others' projects.`)
  } else {
    risks.push(`Verify recency of skills if last activity was >6 months ago.`)
  }

  // Ensure exactly 2 risks
  while (risks.length < 2) {
    risks.push(`Standard interview verification recommended.`)
  }

  // Missing proof (max 4)
  const missingProof = [...missingSkills, ...weakSkills].slice(0, 4).map((s) => s.name)

  return {
    topReasons: topReasons.slice(0, 3),
    risks: risks.slice(0, 2),
    missingProof,
  }
}

/**
 * Compute proof confidence based on evidence quality (not identity verification)
 */
export function computeProofConfidence(params: {
  totalRepos: number
  recentRepos: number
  ownedWithDescription: number
  hasHighStarRepo: boolean
  forkRatio: number
  daysSinceLastPush: number
}): number {
  let confidence = 40

  if (params.totalRepos >= 8) confidence += 20
  if (params.recentRepos >= 3) confidence += 15
  if (params.ownedWithDescription >= 3) confidence += 10
  if (params.hasHighStarRepo) confidence += 10
  if (params.forkRatio > 0.5) confidence -= 20
  if (params.daysSinceLastPush > 365) confidence -= 15

  return Math.max(0, Math.min(100, confidence))
}
