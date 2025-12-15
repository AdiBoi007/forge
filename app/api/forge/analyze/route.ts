import { type NextRequest, NextResponse } from "next/server"
import {
  type JobSpec,
  type ContextWeights,
  type ForgeConfig,
  type ForgeResult,
  type InterviewPack,
  runForgeAnalysis,
  runForgeAnalysisDeterministic,
} from "@/lib/forge/core"
import { forgeLLM, hasLLM, extractJobSpecFromJD, generateInterviewPack } from "@/lib/forge/llm"
import { ingestAllSources } from "@/lib/forge/ingest"
import { extractJobSpecDeterministic } from "@/lib/forge/deterministic"

export type CandidateInput = {
  id: string
  name?: string
  resumeText: string
  githubUrl?: string
  portfolioUrls?: string[]
  portfolioText?: string
  writingText?: string
}

export type ForgeAnalyzeRequest = {
  jobTitle: string
  jobDescription: string
  jobSpec?: JobSpec // Optional pre-extracted job spec
  contextWeights: ContextWeights
  capabilityThreshold: number
  strictEvidenceMode?: boolean
  candidates: CandidateInput[]
  useLLM?: boolean
}

export type CandidateResult = {
  candidateId: string
  candidateName?: string
  forgeResult: ForgeResult
  interviewPack?: InterviewPack
  chunksUsed: number
}

export type ForgeAnalyzeResponse = {
  success: boolean
  jobSpec: JobSpec
  results: CandidateResult[]
  usedLLM: boolean
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ForgeAnalyzeRequest = await req.json()

    const {
      jobTitle,
      jobDescription,
      jobSpec: providedJobSpec,
      contextWeights,
      capabilityThreshold,
      strictEvidenceMode = false,
      candidates,
      useLLM = true,
    } = body

    // Validate inputs
    if (!jobTitle || !jobDescription) {
      return NextResponse.json({ success: false, error: "Job title and description required" }, { status: 400 })
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: false, error: "At least one candidate required" }, { status: 400 })
    }

    const cfg: ForgeConfig = {
      capabilityThreshold,
      topKChunksPerReq: 8,
      strictEvidenceMode,
    }

    const llmAvailable = hasLLM() && useLLM
    let jobSpec: JobSpec

    // Extract job spec
    if (providedJobSpec) {
      jobSpec = providedJobSpec
    } else if (llmAvailable) {
      try {
        jobSpec = await extractJobSpecFromJD({ jobTitle, jobDescription })
      } catch (error) {
        console.error("[FORGE] LLM job extraction failed, falling back to deterministic:", error)
        jobSpec = extractJobSpecDeterministic({ jobTitle, jobDescription })
      }
    } else {
      jobSpec = extractJobSpecDeterministic({ jobTitle, jobDescription })
    }

    // Analyze each candidate
    const results: CandidateResult[] = []

    for (const candidate of candidates) {
      try {
        // Ingest all sources
        const chunks = await ingestAllSources({
          resumeText: candidate.resumeText,
          githubUsername: candidate.githubUrl,
          portfolioText: candidate.portfolioText,
          writingText: candidate.writingText,
        })

        if (chunks.length === 0) {
          results.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            forgeResult: {
              capabilityScoreVerified: 0,
              passGate: false,
              missingMustHaves: jobSpec.requirements.filter((r) => r.importance === "must").map((r) => r.label),
              contextScores: { teamwork: 0, communication: 0, adaptability: 0, ownership: 0 },
              contextScore: 0,
              forgeScore: 0,
              confidence: 0,
              evidenceMatrix: [],
            },
            chunksUsed: 0,
          })
          continue
        }

        // Run analysis
        let forgeResult: ForgeResult
        if (llmAvailable) {
          try {
            forgeResult = await runForgeAnalysis({
              job: jobSpec,
              chunks,
              contextWeights,
              cfg,
              llm: forgeLLM,
            })
          } catch (error) {
            console.error(`[FORGE] LLM analysis failed for ${candidate.id}, using deterministic:`, error)
            forgeResult = runForgeAnalysisDeterministic({
              job: jobSpec,
              chunks,
              contextWeights,
              cfg,
            })
          }
        } else {
          forgeResult = runForgeAnalysisDeterministic({
            job: jobSpec,
            chunks,
            contextWeights,
            cfg,
          })
        }

        // Generate interview pack for passing candidates
        let interviewPack: InterviewPack | undefined
        if (forgeResult.passGate && llmAvailable) {
          try {
            interviewPack = await generateInterviewPack({
              job: jobSpec,
              evidenceMatrix: forgeResult.evidenceMatrix,
              missingMustHaves: forgeResult.missingMustHaves,
            })
          } catch (error) {
            console.error(`[FORGE] Interview pack generation failed for ${candidate.id}:`, error)
          }
        }

        results.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          forgeResult,
          interviewPack,
          chunksUsed: chunks.length,
        })
      } catch (error) {
        console.error(`[FORGE] Error analyzing candidate ${candidate.id}:`, error)
        results.push({
          candidateId: candidate.id,
          candidateName: candidate.name,
          forgeResult: {
            capabilityScoreVerified: 0,
            passGate: false,
            missingMustHaves: [],
            contextScores: { teamwork: 0, communication: 0, adaptability: 0, ownership: 0 },
            contextScore: 0,
            forgeScore: 0,
            confidence: 0,
            evidenceMatrix: [],
          },
          chunksUsed: 0,
        })
      }
    }

    // Sort results
    results.sort((a, b) => {
      // Pass gate first
      if (a.forgeResult.passGate !== b.forgeResult.passGate) {
        return a.forgeResult.passGate ? -1 : 1
      }
      // Then by forgeScore
      if (a.forgeResult.forgeScore !== b.forgeResult.forgeScore) {
        return b.forgeResult.forgeScore - a.forgeResult.forgeScore
      }
      // Then by capabilityScoreVerified
      if (a.forgeResult.capabilityScoreVerified !== b.forgeResult.capabilityScoreVerified) {
        return b.forgeResult.capabilityScoreVerified - a.forgeResult.capabilityScoreVerified
      }
      // Then by confidence
      return b.forgeResult.confidence - a.forgeResult.confidence
    })

    return NextResponse.json({
      success: true,
      jobSpec,
      results,
      usedLLM: llmAvailable,
    })
  } catch (error) {
    console.error("[FORGE] API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    )
  }
}
