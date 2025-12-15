import { type NextRequest, NextResponse } from "next/server"
import { extractSkillsDeterministic, critiqueJD, normalizeWeights } from "@/lib/skills"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description } = body

    // Validate input
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Job description is required" }, { status: 400 })
    }

    // Always run deterministic extraction first
    let skills = extractSkillsDeterministic(description)
    const mode: "deterministic" | "ai" = "deterministic"

    // Optional: If OpenAI key exists, try to refine (not implemented for MVP)
    // This is where you'd call OpenAI to improve skill detection
    // For now, we stick with deterministic which is reliable and fast

    // Generate JD critique
    const critique = critiqueJD(description, skills)

    // Ensure weights are normalized (defensive)
    skills = normalizeWeights(skills)

    return NextResponse.json({
      success: true,
      skills,
      critique,
      meta: { mode },
    })
  } catch (error) {
    console.error("[extract-skills] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to extract skills" }, { status: 500 })
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 })
}

/*
How to test:

curl -X POST http://localhost:3000/api/job/extract-skills \
  -H "Content-Type: application/json" \
  -d '{
    "description": "We are looking for a Senior Frontend Engineer with 5+ years of experience in React and TypeScript. Must have experience with Node.js backends and REST APIs. Experience with AWS, Docker, and CI/CD pipelines is required. Nice to have: GraphQL, testing experience with Jest or Cypress."
  }'
*/
