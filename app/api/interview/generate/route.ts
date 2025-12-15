// POST /api/interview/generate
// Generate interview pack for a candidate

import { NextResponse } from "next/server"
import { generateInterviewPack } from "@/lib/interview-pack"
import type { CandidateAnalysis } from "@/lib/scoring"

interface GenerateRequest {
  job: {
    title: string
    description: string
    skills: Array<{ name: string; weight: number }>
  }
  candidate: CandidateAnalysis
  mode?: "auto" | "ai" | "template"
}

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json()

    // Validate input
    if (!body.job || !body.job.title || !body.job.skills) {
      return NextResponse.json({ success: false, error: "Job configuration is required" }, { status: 400 })
    }

    if (!body.candidate || !body.candidate.id) {
      return NextResponse.json({ success: false, error: "Candidate data is required" }, { status: 400 })
    }

    // Default mode to auto
    const mode = body.mode || "auto"
    if (!["auto", "ai", "template"].includes(mode)) {
      return NextResponse.json(
        { success: false, error: "Invalid mode. Must be 'auto', 'ai', or 'template'" },
        { status: 400 },
      )
    }

    // Generate interview pack
    const pack = await generateInterviewPack({
      jobTitle: body.job.title,
      jobDescription: body.job.description || "",
      requiredSkills: body.job.skills,
      candidate: body.candidate,
      mode: mode as "auto" | "ai" | "template",
    })

    return NextResponse.json({
      success: true,
      pack,
    })
  } catch (error) {
    console.error("Interview pack generation error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate interview pack" }, { status: 500 })
  }
}
