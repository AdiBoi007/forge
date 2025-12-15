// POST /api/ml/predict
// Predict hire probability using trained model
// ============================================

import { NextResponse } from "next/server"
import type { CandidateAnalysis } from "@/lib/scoring"
import type { TrainedModel } from "@/lib/types"
import { predictProba } from "@/lib/ml/logreg"
import { buildFeatureVector } from "@/lib/ml/features"

interface PredictRequest {
  model: TrainedModel
  candidates: CandidateAnalysis[]
}

export async function POST(request: Request) {
  try {
    const body: PredictRequest = await request.json()

    if (!body.model || !body.model.weights) {
      return NextResponse.json({ success: false, error: "model is required" }, { status: 400 })
    }

    if (!body.candidates || body.candidates.length === 0) {
      return NextResponse.json({ success: false, error: "candidates array is required" }, { status: 400 })
    }

    const predictions = body.candidates.map((candidate) => {
      const { features } = buildFeatureVector(candidate)
      const pHire = predictProba(features, body.model)

      return {
        candidateId: candidate.id,
        pHire: Math.round(pHire * 1000) / 1000, // Round to 3 decimals
      }
    })

    return NextResponse.json({
      success: true,
      predictions,
      meta: {
        modelVersion: body.model.version,
        modelMetrics: body.model.metrics,
      },
    })
  } catch (error) {
    console.error("ML prediction error:", error)
    return NextResponse.json({ success: false, error: "Prediction failed" }, { status: 500 })
  }
}
