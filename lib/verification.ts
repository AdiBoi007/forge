// FORGE - Skill Verification / Corroboration Layer
// Cross-checks resume claims against provided artifacts (GitHub, portfolio, writing, LinkedIn)
// We only parse candidate-provided data + links. No scraping, no identity verification.
//
// TESTING CHECKLIST:
// 1. Resume-only candidate → mostly claim_only, fails tau
// 2. Add portfolio link → some skills become partial/supported
// 3. GitHub + resume → verification shows supported GitHub receipts

import type {
  SupportLevel,
  VerificationReceipt,
  SkillVerification,
  CandidateVerification,
  ProofTier,
  EvidenceSource,
} from "@/lib/types"
import type { PortfolioExtraction } from "@/lib/portfolio-extract"
import { portfolioToEvidence } from "@/lib/portfolio-extract"

interface JobSkill {
  name: string
  weight: number
}

interface EvidenceItem {
  skill: string
  source: string
  proofTier?: ProofTier
  reliability?: number
  description?: string
  title?: string
  url?: string
}

interface SignalItem {
  name: string
  proofTier: ProofTier
  source: EvidenceSource
  receipts: string[]
  reliability: number
}

interface GitHubSummary {
  hasRepos: boolean
  repoCount: number
  languages: string[]
  topRepos: Array<{ name: string; language?: string; stars: number }>
}

export function buildSkillVerifications(params: {
  jobSkills: JobSkill[]
  resumeSignals?: { skills: SignalItem[] }
  mergedEvidence: EvidenceItem[]
  githubSummary?: GitHubSummary
  portfolioExtraction?: PortfolioExtraction // New parameter
}): CandidateVerification {
  const { jobSkills, resumeSignals, mergedEvidence, githubSummary, portfolioExtraction } = params

  let allEvidence = [...mergedEvidence]
  if (portfolioExtraction) {
    const portfolioEvidence = portfolioToEvidence(portfolioExtraction)
    allEvidence = [...allEvidence, ...portfolioEvidence]
  }

  const skillVerifications: SkillVerification[] = []
  const warnings: string[] = []

  let supportedCount = 0
  let partialCount = 0
  let unverifiedCount = 0

  for (const skill of jobSkills) {
    const receipts: VerificationReceipt[] = []
    const notes: string[] = []

    // 1. Check merged evidence for this skill (now includes portfolio)
    const skillEvidence = allEvidence.filter(
      (e) =>
        e.skill?.toLowerCase() === skill.name.toLowerCase() ||
        e.description?.toLowerCase().includes(skill.name.toLowerCase()) ||
        e.title?.toLowerCase().includes(skill.name.toLowerCase()),
    )

    for (const ev of skillEvidence) {
      receipts.push({
        source: (ev.source as EvidenceSource) || "other",
        proofTier: ev.proofTier,
        reliability: ev.reliability,
        text: ev.description || ev.title || `Evidence from ${ev.source}`,
        url: ev.url,
      })
    }

    // 2. Check resume signals for this skill
    if (resumeSignals?.skills) {
      const resumeSkill = resumeSignals.skills.find((s) => s.name.toLowerCase() === skill.name.toLowerCase())
      if (resumeSkill) {
        receipts.push({
          source: resumeSkill.source,
          proofTier: resumeSkill.proofTier,
          reliability: resumeSkill.reliability,
          text: resumeSkill.receipts[0] || "Mentioned in resume",
        })

        if (resumeSkill.proofTier === "claim_only") {
          notes.push("Claim-only in resume - needs verification")
        }
      }
    }

    // 3. Check GitHub summary for language match
    if (githubSummary?.hasRepos) {
      const skillLower = skill.name.toLowerCase()
      const languageMatch = githubSummary.languages.some(
        (lang) =>
          lang.toLowerCase() === skillLower ||
          (skillLower === "react" && lang.toLowerCase() === "javascript") ||
          (skillLower === "node.js" && lang.toLowerCase() === "javascript") ||
          (skillLower === "typescript" && lang.toLowerCase() === "typescript"),
      )

      if (languageMatch) {
        const relevantRepo = githubSummary.topRepos.find(
          (r) =>
            r.language?.toLowerCase() === skillLower ||
            (skillLower === "react" && r.language?.toLowerCase() === "javascript") ||
            (skillLower === "node.js" && r.language?.toLowerCase() === "javascript"),
        )

        receipts.push({
          source: "github",
          proofTier: "owned_artifact",
          reliability: 0.8,
          text: relevantRepo
            ? `${relevantRepo.name} (${relevantRepo.stars} stars)`
            : `${githubSummary.repoCount} repos with ${skill.name}`,
        })
      }
    }

    if (portfolioExtraction) {
      const portfolioSkill = portfolioExtraction.skills.find((s) => s.skill.toLowerCase() === skill.name.toLowerCase())
      if (portfolioSkill) {
        receipts.push({
          source: "portfolio",
          proofTier: portfolioSkill.hasProject ? "linked_artifact" : "claim_only",
          reliability: portfolioSkill.hasProject ? 0.6 : 0.2,
          text: portfolioSkill.hasProject
            ? `Demonstrated in portfolio project`
            : `Mentioned ${portfolioSkill.frequency}x in portfolio`,
          url: portfolioExtraction.url,
        })
      }
    }

    // Determine support level
    const verifiedReceipts = receipts.filter((r) => r.proofTier !== "claim_only" && (r.reliability || 0) >= 0.4)
    const weakReceipts = receipts.filter((r) => r.proofTier !== "claim_only" && (r.reliability || 0) < 0.4)
    const claimOnlyReceipts = receipts.filter((r) => r.proofTier === "claim_only")

    let support: SupportLevel
    let confidence: "high" | "medium" | "low"

    if (verifiedReceipts.length >= 1) {
      support = "supported"
      confidence = verifiedReceipts.length >= 2 ? "high" : "medium"
      supportedCount++
    } else if (weakReceipts.length >= 1) {
      support = "partial"
      confidence = "low"
      partialCount++
      notes.push("Only weak/stale evidence found")
    } else {
      support = "unverified"
      confidence = "low"
      unverifiedCount++
      if (claimOnlyReceipts.length > 0) {
        notes.push("Only resume claims - no linked artifacts")
      } else {
        notes.push("No evidence found for this skill")
      }
    }

    skillVerifications.push({
      skill: skill.name,
      support,
      confidence,
      receipts: receipts.slice(0, 5), // Limit to 5 receipts
      notes: notes.length > 0 ? notes : undefined,
    })
  }

  // Generate warnings
  if (unverifiedCount > jobSkills.length / 2) {
    warnings.push("Resume claims exceed available artifacts")
  }

  if (resumeSignals?.skills && !githubSummary?.hasRepos) {
    const allClaimOnly = resumeSignals.skills.every((s) => s.proofTier === "claim_only")
    if (allClaimOnly) {
      warnings.push("All skills are claim-only - add linked artifacts for higher reliability")
    }
  }

  if (!githubSummary?.hasRepos && !mergedEvidence.some((e) => e.source === "portfolio")) {
    warnings.push("No GitHub or portfolio found - verification is limited")
  }

  if (portfolioExtraction && portfolioExtraction.overallQuality === "low") {
    warnings.push("Portfolio quality is low - limited verification value")
  }

  // Calculate overall support score
  const overallSupportScore = Math.round(
    ((supportedCount * 1.0 + partialCount * 0.5 + unverifiedCount * 0) / Math.max(jobSkills.length, 1)) * 100,
  )

  return {
    summary: {
      supportedCount,
      partialCount,
      unverifiedCount,
      overallSupportScore,
      warnings,
    },
    skills: skillVerifications,
  }
}

export function getVerificationProbeQuestions(verification: CandidateVerification): string[] {
  const probes: string[] = []

  for (const skill of verification.skills) {
    if (skill.support === "unverified") {
      probes.push(`Your resume lists ${skill.skill} — show an artifact or walk through a real example.`)
    } else if (skill.support === "partial") {
      probes.push(`We found limited ${skill.skill} evidence. Can you demonstrate depth with a specific project?`)
    }
  }

  return probes.slice(0, 4) // Max 4 probes
}

export function getArtifactSuggestions(skill: SkillVerification): string[] {
  const suggestions: Record<string, string[]> = {
    React: ["Add a React project link to your portfolio", "Push React code to GitHub"],
    TypeScript: ["Add TypeScript projects to GitHub", "Share a portfolio case study"],
    "Node.js": ["Link a backend API project", "Add server-side code to GitHub"],
    Python: ["Share a Python project or script", "Link a data analysis notebook"],
    Figma: ["Add Figma portfolio link", "Share design case study"],
    default: ["Add a portfolio case study link", "Add a writing sample link", "Add a GitHub repo"],
  }

  return suggestions[skill.skill] || suggestions.default
}
