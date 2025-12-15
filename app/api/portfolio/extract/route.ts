// FORGE - Portfolio Extraction API
// POST /api/portfolio/extract
// Fetches and analyzes a portfolio website

import { NextResponse } from "next/server"
import { extractPortfolio, portfolioToEvidence } from "@/lib/portfolio-extract"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 })
    }

    const extraction = await extractPortfolio(url)
    const evidence = portfolioToEvidence(extraction)

    return NextResponse.json({
      success: true,
      extraction,
      evidence,
      summary: {
        projectCount: extraction.projectCount,
        skillCount: extraction.skills.length,
        testimonialCount: extraction.testimonialCount,
        quality: extraction.overallQuality,
        proofTier: extraction.proofTier,
        reliability: extraction.reliability,
      },
    })
  } catch (error) {
    console.error("Portfolio extraction error:", error)
    return NextResponse.json({ success: false, error: "Failed to extract portfolio" }, { status: 500 })
  }
}
