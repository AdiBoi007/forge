import { generateText } from "ai"
import { z } from "zod"
import {
  JobSpecSchema,
  RequirementEvidenceSchema,
  type JobSpec,
  type RequirementEvidence,
  type Requirement,
  type ArtifactChunk,
  type InterviewPack,
  type ForgeLLM,
} from "./core"
import { promptExtractJobSpec, promptScoreRequirementEvidence, promptInterviewPack } from "./prompts"

const InterviewPackSchema = z.object({
  plan15: z.array(z.string()),
  plan30: z.array(z.string()),
  plan60: z.array(z.string()),
  miniTasks: z.array(z.string()),
  screeningQuestions: z.array(z.string()),
})

function parseJSON<T>(text: string, schema: z.ZodSchema<T>): T | null {
  try {
    // Try to extract JSON from the response
    let jsonStr = text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    const parsed = JSON.parse(jsonStr)
    return schema.parse(parsed)
  } catch {
    return null
  }
}

async function callLLM(prompt: string, maxTokens = 2000): Promise<string> {
  const model = process.env.FORGE_AI_MODEL || "openai/gpt-4o-mini"

  try {
    const { text } = await generateText({
      model,
      prompt,
      maxTokens,
      temperature: 0.1,
    })
    return text
  } catch (error) {
    console.error("[FORGE LLM] Error:", error)
    throw error
  }
}

async function callLLMWithRetry<T>(prompt: string, schema: z.ZodSchema<T>, maxTokens = 2000): Promise<T> {
  // First attempt
  const text1 = await callLLM(prompt, maxTokens)
  const result1 = parseJSON(text1, schema)
  if (result1) return result1

  // Retry with repair prompt
  const repairPrompt = `${prompt}\n\nYour previous response was not valid JSON. Return ONLY valid JSON, no explanation.`
  const text2 = await callLLM(repairPrompt, maxTokens)
  const result2 = parseJSON(text2, schema)
  if (result2) return result2

  throw new Error("Failed to parse LLM response after retry")
}

export async function extractJobSpecFromJD(args: { jobTitle: string; jobDescription: string }): Promise<JobSpec> {
  const prompt = promptExtractJobSpec(args)
  return callLLMWithRetry(prompt, JobSpecSchema, 3000)
}

export async function scoreRequirementEvidence(args: {
  requirement: Requirement
  retrievedChunks: ArtifactChunk[]
}): Promise<RequirementEvidence> {
  const prompt = promptScoreRequirementEvidence({
    requirementJson: JSON.stringify(args.requirement),
    chunksJson: JSON.stringify(args.retrievedChunks.map((c) => ({ source: c.source, url: c.url, text: c.text }))),
  })
  return callLLMWithRetry(prompt, RequirementEvidenceSchema, 1500)
}

export async function generateInterviewPack(args: {
  job: JobSpec
  evidenceMatrix: RequirementEvidence[]
  missingMustHaves: string[]
}): Promise<InterviewPack> {
  const prompt = promptInterviewPack({
    jobSpecJson: JSON.stringify(args.job),
    evidenceMatrixJson: JSON.stringify(args.evidenceMatrix),
    missingMustHavesJson: JSON.stringify(args.missingMustHaves),
  })
  return callLLMWithRetry(prompt, InterviewPackSchema, 2000)
}

export const forgeLLM: ForgeLLM = {
  extractJobSpecFromJD,
  scoreRequirementEvidence,
  generateInterviewPack,
}

// Check if LLM is available
export function hasLLM(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.FORGE_AI_MODEL)
}
