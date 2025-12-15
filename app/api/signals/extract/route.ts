// POST /api/signals/extract
// Extract signals from non-GitHub sources
// ============================================

import { NextResponse } from "next/server"
import type { CandidateSignals } from "@/lib/types"
import { extractSignals } from "@/lib/signals-extract"

interface ExtractRequest {
  candidate: CandidateSignals
  job: {
    title: string
    description: string
    skills: Array<{ name: string; weight: number }>
  }
}

export async function POST(request: Request) {
  try {
    const body: ExtractRequest = await request.json()

    if (!body.candidate) {
      return NextResponse.json({ success: false, error: "candidate is required" }, { status: 400 })
    }

    if (!body.job || !body.job.skills) {
      return NextResponse.json({ success: false, error: "job with skills is required" }, { status: 400 })
    }

    const result = await extractSignals(body.candidate, body.job)

    return NextResponse.json({
      success: true,
      signals: result.signals,
      reliability: result.reliability,
      debug: result.debug,
    })
  } catch (error) {
    console.error("Signal extraction error:", error)
    return NextResponse.json({ success: false, error: "Failed to extract signals" }, { status: 500 })
  }
}
