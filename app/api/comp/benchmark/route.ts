import { type NextRequest, NextResponse } from "next/server"
import { calculateCompBenchmark, type CompBenchmarkRequest } from "@/lib/compensation"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompBenchmarkRequest

    // Validate required fields
    if (!body.roleTitle || !body.location || !body.currency || !body.seniority) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: roleTitle, location, currency, seniority" },
        { status: 400 },
      )
    }

    const result = calculateCompBenchmark(body)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Compensation benchmark error:", error)
    return NextResponse.json({ success: false, error: "Failed to calculate benchmark" }, { status: 500 })
  }
}
