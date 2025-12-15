// POST /api/candidates/analyze
// Full candidate analysis endpoint with FORGE algorithm

import { NextResponse } from "next/server"
import { getUser, getRepos, GitHubError, normalizeGitHubUsername, isValidGitHubUsername } from "@/lib/github"
import { analyzeCandidate, type CandidateAnalysis, DEFAULT_TAU } from "@/lib/scoring"

interface CandidateInput {
  id?: string
  name?: string
  roleType?: string
  github?: string
  salaryExpectation?: {
    min?: number
    max?: number
    target?: number
    currency?: string
  }
  signals?: {
    githubUsername?: string
    portfolioUrl?: string
    writingLinks?: string[]
    resumeText?: string
    linkedinText?: string
    extracurricularText?: string
  }
}

interface AnalyzeRequest {
  skills: Array<{
    name: string
    weight: number
    isRequired?: boolean
    importance?: string
    category?: string
  }>
  candidates: (string | CandidateInput)[]
  job?: { title?: string; description?: string }
  tau?: number
  jobConfig?: {
    roleTitle?: string
    location?: string
    seniority?: string
    industry?: string
    companySize?: string
    budget?: { min?: number; max?: number }
    gateThreshold?: number // Single source of truth for tau
  }
}

function createNonGitHubAnalysis(
  candidate: CandidateInput,
  skills: Array<{ name: string; weight: number; isRequired?: boolean }>,
  tau: number,
): CandidateAnalysis {
  const name = candidate.name || "Unknown"
  const roleType = candidate.roleType || "unknown"

  const hasPortfolio = !!candidate.signals?.portfolioUrl
  const hasWriting = (candidate.signals?.writingLinks?.length ?? 0) > 0
  const hasResume = !!candidate.signals?.resumeText
  const hasLinkedIn = !!candidate.signals?.linkedinText
  const hasExtracurricular = !!candidate.signals?.extracurricularText

  const signalCount = [hasPortfolio, hasWriting, hasResume, hasLinkedIn, hasExtracurricular].filter(Boolean).length

  const baseCapability = Math.min(0.4 + signalCount * 0.1, 0.7)
  const baseContext = Math.min(0.5 + signalCount * 0.08, 0.8)

  const capabilityScore = baseCapability
  const contextScore = baseContext
  const forgeScore = capabilityScore * contextScore
  const gateStatus = capabilityScore >= tau ? "ranked" : "review"

  return {
    id: candidate.id || `cand_${name.replace(/\s+/g, "_").toLowerCase()}`,
    name,
    github: "",
    linkedin: candidate.signals?.linkedinText ? "provided" : "",
    portfolio: candidate.signals?.portfolioUrl || null,
    avatar: "",
    headline: `${roleType.charAt(0).toUpperCase() + roleType.slice(1)} - Non-GitHub evaluation`,

    capabilityScore,
    contextScore,
    forgeScore,
    gateStatus: gateStatus as "ranked" | "review" | "filtered",
    tau,
    dataQuality: "partial" as const,

    overallScore: Math.round(forgeScore * 100),
    finalScore: forgeScore,
    verdict: gateStatus === "ranked" ? "Review" : "Needs More Proof",
    confidence: Math.round(signalCount * 15),
    proofConfidence: signalCount * 0.15,
    yearsActive: 0,
    activityTrend: [0, 0, 0, 0, 0, 0],
    learningVelocityBonus: 0,

    capability: {
      status: gateStatus === "ranked" ? "Review" : "Weak",
      score: capabilityScore,
      confidence: signalCount * 0.15,
      skills: skills.map((s) => ({
        name: s.name,
        score: baseCapability * 100,
        confidence: signalCount * 0.12,
        evidenceCount: signalCount,
        status: "Weak" as const,
        reason: "No GitHub proof - requires manual review",
        evidenceTier: "claimed" as const,
        weight: s.weight,
        evidence: [],
        isRequired: s.isRequired,
      })),
    },
    context: {
      teamwork: { name: "Teamwork", score: hasLinkedIn ? 50 : 30, raw: 0, source: "Limited data" },
      communication: {
        name: "Communication",
        score: hasWriting ? 60 : 30,
        raw: 0,
        source: hasWriting ? "Writing samples provided" : "Limited data",
      },
      adaptability: { name: "Adaptability", score: hasPortfolio ? 55 : 30, raw: 0, source: "Limited data" },
      ownership: {
        name: "Ownership",
        score: hasExtracurricular ? 55 : 30,
        raw: 0,
        source: hasExtracurricular ? "Extracurricular provided" : "Limited data",
      },
    },
    evidence: [
      ...(hasPortfolio
        ? [
            {
              id: "ev_portfolio",
              type: "portfolio" as const,
              title: "Portfolio Provided",
              description: candidate.signals?.portfolioUrl || "",
              url: candidate.signals?.portfolioUrl || "",
              skill: "General",
              impact: "medium" as const,
              date: new Date().toISOString().split("T")[0],
              metrics: {},
              whyThisMatters: "Portfolio link provided for manual review",
              proofTier: "strong_signal" as const,
              reliability: 0.6,
            },
          ]
        : []),
      ...(hasWriting
        ? [
            {
              id: "ev_writing",
              type: "documentation" as const,
              title: "Writing Samples",
              description: `${candidate.signals?.writingLinks?.length} writing link(s) provided`,
              url: candidate.signals?.writingLinks?.[0] || "",
              skill: "Communication",
              impact: "medium" as const,
              date: new Date().toISOString().split("T")[0],
              metrics: {},
              whyThisMatters: "Writing samples for manual review",
              proofTier: "strong_signal" as const,
              reliability: 0.5,
            },
          ]
        : []),
      ...(hasResume
        ? [
            {
              id: "ev_resume",
              type: "documentation" as const,
              title: "Resume Text",
              description: "Resume content provided",
              url: "",
              skill: "General",
              impact: "low" as const,
              date: new Date().toISOString().split("T")[0],
              metrics: {},
              whyThisMatters: "Self-reported - requires verification",
              proofTier: "claim_only" as const,
              reliability: 0.3,
            },
          ]
        : []),
    ],
    explanations: {
      topReasons: [
        `${roleType} role - evaluated via non-GitHub signals`,
        hasPortfolio ? "Portfolio provided for review" : "No portfolio link",
        hasWriting ? "Writing samples available" : "No writing samples",
      ],
      risks: [
        "No GitHub proof available",
        "Requires manual verification of claims",
        signalCount < 2 ? "Very limited signal data" : undefined,
      ].filter(Boolean) as string[],
      missingProof: ["GitHub activity", "Verified code contributions"],
    },
    explanation: {
      summary: `Non-dev candidate with ${signalCount} signal(s). Requires manual review.`,
      oneLiner: `${roleType} - ${signalCount} signals, needs review`,
      strengths: [
        hasPortfolio ? "Portfolio provided" : null,
        hasWriting ? "Writing samples available" : null,
        hasExtracurricular ? "Extracurricular activities noted" : null,
      ].filter(Boolean) as string[],
      weaknesses: ["No GitHub verification possible"],
      flags: signalCount < 2 ? ["Very limited proof"] : [],
    },
    risks: [{ type: "ProofGap", severity: "medium" as const, description: "Cannot verify skills via GitHub" }],
    interviewGuidance: {
      questions: [
        {
          id: "q1",
          type: "gap-probe" as const,
          question: `Walk me through a specific ${roleType} project you're proud of.`,
          context: "No GitHub proof available - need verbal verification",
          expectedDepth: "Concrete examples with outcomes",
        },
      ],
      areasToProbe: ["Verify claimed experience", "Ask for work samples", "Check references"],
      suggestedTasks: [`${roleType}-specific take-home task`],
    },
    evidenceTimeline: [],
  }
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeRequest = await request.json()

    if (!body.skills || !Array.isArray(body.skills) || body.skills.length === 0) {
      return NextResponse.json({ success: false, error: "Skills array is required" }, { status: 400 })
    }

    if (!body.candidates || !Array.isArray(body.candidates) || body.candidates.length === 0) {
      return NextResponse.json({ success: false, error: "Candidates array is required" }, { status: 400 })
    }

    if (body.candidates.length > 10) {
      return NextResponse.json({ success: false, error: "Maximum 10 candidates per request" }, { status: 400 })
    }

    const tau = body.jobConfig?.gateThreshold ?? body.tau ?? DEFAULT_TAU

    const jobConfig = body.jobConfig || {
      roleTitle: body.job?.title || "Software Engineer",
      location: "Remote",
      seniority: "Mid",
    }

    const results: CandidateAnalysis[] = []
    const errors: Array<{ username: string; error: string }> = []

    for (const candidate of body.candidates) {
      let githubUsername: string | null = null
      let candidateName: string | undefined
      let roleType: string | undefined
      let candidateInput: CandidateInput | undefined
      let salaryExpectation: CandidateInput["salaryExpectation"] | undefined

      if (typeof candidate === "string") {
        githubUsername = normalizeGitHubUsername(candidate)
        candidateName = candidate
      } else if (candidate && typeof candidate === "object") {
        candidateInput = candidate
        candidateName = candidate.name
        roleType = candidate.roleType
        salaryExpectation = candidate.salaryExpectation

        const rawGithub = candidate.github || candidate.signals?.githubUsername || ""
        githubUsername = rawGithub ? normalizeGitHubUsername(rawGithub) : null
      } else {
        errors.push({ username: "unknown", error: "Invalid candidate format" })
        continue
      }

      if (!githubUsername) {
        if (candidateInput) {
          const analysis = createNonGitHubAnalysis(candidateInput, body.skills, tau)
          results.push(analysis)
        } else {
          errors.push({
            username: candidateName || "unknown",
            error: "No GitHub username provided",
          })
        }
        continue
      }

      if (!isValidGitHubUsername(githubUsername)) {
        if (candidateInput) {
          const analysis = createNonGitHubAnalysis(candidateInput, body.skills, tau)
          results.push(analysis)
        } else {
          errors.push({
            username: githubUsername,
            error: `Invalid GitHub username format: "${githubUsername}"`,
          })
        }
        continue
      }

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        const user = await getUser(githubUsername)
        const repos = await getRepos(githubUsername)

        clearTimeout(timeout)

        const analysis = await analyzeCandidate(
          user.login,
          body.skills.map((s) => ({
            name: s.name,
            weight: s.weight,
            priority: s.importance || "required",
            category: s.category || "technical",
            isRequired: s.isRequired,
            importance: s.importance,
          })),
          user,
          repos,
          tau,
          salaryExpectation,
          jobConfig,
        )

        if (candidateName && !analysis.name) {
          analysis.name = candidateName
        }

        results.push(analysis)
      } catch (error) {
        if (error instanceof GitHubError) {
          errors.push({ username: githubUsername, error: error.message })

          if (candidateInput && (candidateInput.signals?.portfolioUrl || candidateInput.signals?.resumeText)) {
            const analysis = createNonGitHubAnalysis(candidateInput, body.skills, tau)
            analysis.explanation.summary = `GitHub fetch failed: ${error.message}. Evaluated via other signals.`
            results.push(analysis)
          } else {
            results.push({
              id: `cand_${githubUsername}_error`,
              name: candidateName || githubUsername,
              github: `https://github.com/${githubUsername}`,
              linkedin: "",
              portfolio: null,
              avatar: "",
              headline: "Failed to fetch GitHub data",
              capabilityScore: 0,
              contextScore: 0,
              forgeScore: 0,
              gateStatus: "filtered",
              tau,
              dataQuality: "fallback",
              overallScore: 0,
              finalScore: 0,
              verdict: "Reject",
              confidence: 0,
              proofConfidence: 0,
              yearsActive: 0,
              activityTrend: [0, 0, 0, 0, 0, 0],
              learningVelocityBonus: 0,
              capability: {
                status: "Fail",
                score: 0,
                confidence: 0,
                skills: body.skills.map((s) => ({
                  name: s.name,
                  score: 0,
                  confidence: 0,
                  evidenceCount: 0,
                  status: "Missing" as const,
                  reason: error.message,
                  evidenceTier: "inferred" as const,
                  weight: s.weight,
                  evidence: [],
                  isRequired: s.isRequired,
                })),
              },
              context: {
                teamwork: { name: "Teamwork", score: 0, raw: 0, source: "N/A" },
                communication: { name: "Communication", score: 0, raw: 0, source: "N/A" },
                adaptability: { name: "Adaptability", score: 0, raw: 0, source: "N/A" },
                ownership: { name: "Ownership", score: 0, raw: 0, source: "N/A" },
              },
              evidence: [],
              explanations: {
                topReasons: ["Failed to fetch data", "Cannot evaluate", "Try again later"],
                risks: [error.message, "No data available"],
                missingProof: body.skills.map((s) => s.name),
              },
              explanation: {
                summary: `Error: ${error.message}`,
                oneLiner: "Could not analyze candidate",
                strengths: [],
                weaknesses: [error.message],
                flags: [error.message],
              },
              risks: [{ type: "Error", severity: "high", description: error.message }],
              interviewGuidance: { questions: [], areasToProbe: [error.message], suggestedTasks: [] },
              evidenceTimeline: [],
            })
          }
        } else {
          throw error
        }
      }
    }

    const ranked = results.filter((r) => r.gateStatus === "ranked").sort((a, b) => b.forgeScore - a.forgeScore)
    const review = results.filter((r) => r.gateStatus === "review").sort((a, b) => b.forgeScore - a.forgeScore)
    const filtered = results
      .filter((r) => r.gateStatus === "filtered")
      .sort((a, b) => b.capabilityScore - a.capabilityScore)
    const sortedResults = [...ranked, ...review, ...filtered]

    return NextResponse.json({
      success: true,
      candidates: sortedResults,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        mode: "live",
        analyzedAt: new Date().toISOString(),
        skillsEvaluated: body.skills.length,
        candidatesAnalyzed: results.filter((r) => r.dataQuality !== "fallback").length,
        tau,
        ranked: ranked.length,
        review: review.length,
        filtered: filtered.length,
        formula: "FORGE_SCORE = CS × XS where CS_required ≥ τ",
      },
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze candidates" }, { status: 500 })
  }
}
