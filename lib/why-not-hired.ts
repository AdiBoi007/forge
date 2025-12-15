// FORGE - "Why Not Hired" Auto-Report
// Generates actionable feedback for candidates who didn't pass tau gate

import type { CandidateAnalysis } from "./scoring"
import type { CandidateVerification } from "@/lib/types"

export interface WhyNotHiredReport {
  candidateId: string
  candidateName: string
  summary: string
  missingProof: Array<{
    skill: string
    currentStatus: string
    currentScore: number
    gapPoints: number
    artifactsNeeded: string[]
    verificationNote?: string
  }>
  nextSteps: string[]
  estimatedTimeToQualify: string
  encouragement: string
}

const ARTIFACT_SUGGESTIONS: Record<string, string[]> = {
  React: [
    "Build a React app with state management (Redux/Zustand) and push to GitHub",
    "Contribute to a popular React open-source project with a merged PR",
    "Create a reusable component library published to npm",
  ],
  TypeScript: [
    "Convert an existing JavaScript project to TypeScript with strict mode",
    "Build a CLI tool in TypeScript with proper types throughout",
    "Contribute typed definitions to DefinitelyTyped",
  ],
  "Node.js": [
    "Build a REST API with authentication and database integration",
    "Create a backend service with proper error handling and tests",
    "Contribute to a Node.js framework or tooling project",
  ],
  Python: [
    "Build a data pipeline or automation script with documentation",
    "Create a Flask/FastAPI service with proper typing (mypy)",
    "Contribute to a Python open-source project",
  ],
  "System Design": [
    "Write a detailed architecture doc for one of your projects (ADR format)",
    "Create a public blog post explaining a scaling challenge you solved",
    "Document database schema decisions and tradeoffs",
  ],
  Leadership: [
    "Mentor junior developers and get testimonials on LinkedIn",
    "Lead a team project and document the process publicly",
    "Create technical documentation or runbooks for your team",
  ],
  Testing: [
    "Add comprehensive tests to an existing project (aim for 80%+ coverage)",
    "Set up CI/CD with automated testing in a public repo",
    "Write about your testing philosophy in a blog post",
  ],
  "CI/CD": [
    "Set up GitHub Actions with build, test, and deploy stages",
    "Create a multi-environment deployment pipeline",
    "Document your CI/CD setup in a README or blog post",
  ],
  Docker: [
    "Containerize an application with multi-stage builds",
    "Create a docker-compose setup for local development",
    "Publish a useful Docker image to Docker Hub",
  ],
  AWS: [
    "Build and deploy a project using AWS services (Lambda, S3, etc.)",
    "Get AWS certifications and link them to your profile",
    "Write about AWS architecture decisions in a blog post",
  ],
  Figma: [
    "Create a complete design system in Figma and share publicly",
    "Redesign a popular app and document your process",
    "Contribute to Figma Community with templates or plugins",
  ],
  "User Research": [
    "Publish a case study with real user research findings",
    "Create a portfolio piece showing research → design → outcome",
    "Write about your research methodology",
  ],
  default: [
    "Build a project demonstrating this skill and push to GitHub",
    "Write a blog post or tutorial about this skill",
    "Contribute to an open-source project using this skill",
  ],
}

export function generateWhyNotHiredReport(
  candidate: CandidateAnalysis,
  tau: number,
  verification?: CandidateVerification, // Add optional verification param
): WhyNotHiredReport {
  const csScore = candidate.capabilityScore || 0
  const gapToTau = Math.max(0, tau - csScore)
  const gapPercent = Math.round(gapToTau * 100)

  // Find skills that need improvement
  const missingProof = candidate.capability.skills
    .filter((s) => s.status === "Weak" || s.status === "Missing")
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 4)
    .map((skill) => {
      const suggestions = ARTIFACT_SUGGESTIONS[skill.name] || ARTIFACT_SUGGESTIONS.default

      const verificationSkill = verification?.skills.find((v) => v.skill === skill.name)
      const verificationNote =
        verificationSkill?.support === "unverified"
          ? "No linked artifacts found"
          : verificationSkill?.support === "partial"
            ? "Only weak evidence available"
            : undefined

      return {
        skill: skill.name,
        currentStatus: skill.status,
        currentScore: Math.round(skill.score * 100),
        gapPoints: Math.round((tau * 100 - skill.score * 100) * ((skill.weight || 10) / 100)),
        artifactsNeeded: suggestions.slice(0, 2),
        verificationNote, // Add verification note
      }
    })

  // Estimate time based on gap size
  let estimatedTime: string
  if (gapPercent <= 10) {
    estimatedTime = "2-4 weeks with focused effort"
  } else if (gapPercent <= 25) {
    estimatedTime = "1-2 months with consistent work"
  } else if (gapPercent <= 40) {
    estimatedTime = "2-4 months of dedicated practice"
  } else {
    estimatedTime = "4-6 months to build sufficient evidence"
  }

  // Generate next steps
  const nextSteps: string[] = []

  if (missingProof.length > 0) {
    nextSteps.push(`Focus on building proof for ${missingProof[0].skill} first (highest impact)`)
  }

  nextSteps.push("Push all projects to GitHub with detailed READMEs")
  nextSteps.push("Add descriptions and documentation to existing repos")

  if (candidate.context.communication.score < 50) {
    nextSteps.push("Write technical blog posts to demonstrate communication skills")
  }

  if (candidate.yearsActive < 2) {
    nextSteps.push("Increase activity consistency - aim for weekly commits")
  }

  if (verification) {
    const unverifiedSkills = verification.skills.filter((s) => s.support === "unverified")
    if (unverifiedSkills.length > 0) {
      nextSteps.unshift(
        `Add linked artifacts for unverified skills: ${unverifiedSkills.map((s) => s.skill).join(", ")}`,
      )
    }
  }

  nextSteps.push("Re-apply once you have verifiable artifacts for the missing skills")

  // Summary
  const summary = `Your capability score (${Math.round(csScore * 100)}%) is ${gapPercent}% below our verification threshold (${Math.round(tau * 100)}%). This isn't about your ability - it's about what we can verify. ${missingProof.length > 0 ? `We couldn't find sufficient proof for: ${missingProof.map((s) => s.skill).join(", ")}.` : "We need more verifiable evidence of your skills."}`

  // Encouragement based on score
  let encouragement: string
  if (csScore >= 0.5) {
    encouragement = "You're close! A few targeted projects could get you over the threshold."
  } else if (csScore >= 0.3) {
    encouragement = "You have a foundation to build on. Focus on the suggested artifacts and you'll get there."
  } else {
    encouragement = "Everyone starts somewhere. Building public proof takes time but compounds over your career."
  }

  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    summary,
    missingProof,
    nextSteps: nextSteps.slice(0, 5),
    estimatedTimeToQualify: estimatedTime,
    encouragement,
  }
}

export function formatWhyNotHiredEmail(report: WhyNotHiredReport, companyName: string): string {
  return `Hi ${report.candidateName.split(" ")[0]},

Thank you for your interest in joining ${companyName}. After reviewing your profile through our proof-based evaluation system, we've decided not to move forward at this time.

**Why?**
${report.summary}

**What's Missing:**
${report.missingProof
  .map(
    (s) => `- ${s.skill}: Currently ${s.currentStatus.toLowerCase()} (${s.currentScore}%)
  → ${s.artifactsNeeded[0]}
  ${s.verificationNote ? `(${s.verificationNote})` : ""}`,
  )
  .join("\n")}

**Next Steps to Strengthen Your Profile:**
${report.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

**Estimated Time to Qualify:** ${report.estimatedTimeToQualify}

${report.encouragement}

We encourage you to re-apply once you've built more verifiable evidence. Our system will automatically detect improvements.

Best,
${companyName} Hiring Team`
}
