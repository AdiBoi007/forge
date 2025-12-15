// FORGE Hiring Summary
// Generate recruiter-ready bullets from analysis

import type { CandidateAnalysis } from "@/lib/scoring"

export interface HiringSummary {
  oneLiner: string
  bullets: string[]
  recommendation: string
}

export function buildHiringSummary(input: {
  jobTitle: string
  requiredSkills: Array<{ name: string; weight: number }>
  candidate: CandidateAnalysis
}): HiringSummary {
  const { jobTitle, requiredSkills, candidate } = input
  const bullets: string[] = []

  // Bullet 1-2: Why strong (from explanations.topReasons)
  if (candidate.explanations?.topReasons) {
    candidate.explanations.topReasons.slice(0, 2).forEach((reason) => {
      bullets.push(`✓ ${reason}`)
    })
  } else if (candidate.explanation?.strengths) {
    candidate.explanation.strengths.slice(0, 2).forEach((strength) => {
      bullets.push(`✓ ${strength}`)
    })
  }

  // Bullet 3-4: Proof receipts (repo names + recency)
  const topEvidence = candidate.evidence.slice(0, 2)
  topEvidence.forEach((ev) => {
    const recency =
      ev.metrics.lastPushedDays !== undefined
        ? ev.metrics.lastPushedDays < 30
          ? "active"
          : ev.metrics.lastPushedDays < 90
            ? "recent"
            : "older"
        : "unknown"
    const stars = ev.metrics.stars ? ` (${ev.metrics.stars} stars)` : ""
    bullets.push(`📦 ${ev.title}${stars} — ${recency} ${ev.skill} work`)
  })

  // Bullet 5-6: Risks (from explanations.risks)
  if (candidate.explanations?.risks) {
    candidate.explanations.risks.slice(0, 2).forEach((risk) => {
      bullets.push(`⚠️ ${risk}`)
    })
  } else if (candidate.risks) {
    candidate.risks.slice(0, 2).forEach((risk) => {
      bullets.push(`⚠️ ${risk.description}`)
    })
  }

  // Bullet 7+: Interview focus + mini task
  if (candidate.interviewGuidance?.areasToProbe?.length > 0) {
    bullets.push(`🎯 Interview focus: ${candidate.interviewGuidance.areasToProbe[0]}`)
  }
  if (candidate.interviewGuidance?.suggestedTasks?.length > 0) {
    bullets.push(`📝 Suggested task: ${candidate.interviewGuidance.suggestedTasks[0]}`)
  }

  // Proof confidence bullet
  bullets.push(
    `🔍 Proof confidence: ${candidate.proofConfidence}% based on ${candidate.evidence.length} evidence items`,
  )

  // One-liner
  const oneLiner =
    candidate.explanation?.oneLiner ||
    `${candidate.name} scored ${candidate.finalScore}/100 for ${jobTitle} with verdict: ${candidate.verdict}`

  // Recommendation
  let recommendation: string
  switch (candidate.verdict) {
    case "Strong Hire":
      recommendation = `Strong recommendation to proceed. Schedule technical interview immediately.`
      break
    case "Possible":
      recommendation = `Worth interviewing. Focus on verifying ${candidate.capability.skills.find((s) => s.status === "Weak")?.name || "weak areas"}.`
      break
    case "Risky but High Potential":
      recommendation = `High-risk, high-reward. Consider for junior-friendly role or with strong mentorship.`
      break
    default:
      recommendation = `Does not meet the bar. Consider for future roles or different positions.`
  }

  return { oneLiner, bullets, recommendation }
}

export function formatSummaryAsText(summary: HiringSummary, candidateName: string): string {
  return `
FORGE Hiring Summary: ${candidateName}
${"=".repeat(40)}

${summary.oneLiner}

Key Points:
${summary.bullets.map((b) => `  ${b}`).join("\n")}

Recommendation:
${summary.recommendation}
`.trim()
}

export function copySummaryToClipboard(summary: HiringSummary, candidateName: string): void {
  navigator.clipboard.writeText(formatSummaryAsText(summary, candidateName))
}

export function downloadSummaryAsText(summary: HiringSummary, candidateName: string): void {
  const text = formatSummaryAsText(summary, candidateName)
  const blob = new Blob([text], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `forge-summary-${candidateName.replace(/\s+/g, "-").toLowerCase()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
