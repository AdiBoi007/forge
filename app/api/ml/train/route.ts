// POST /api/ml/train
// Train logistic regression model from labeled examples
// ============================================

import { NextResponse } from "next/server"
import type { CandidateAnalysis } from "@/lib/scoring"
import type { TrainingExample } from "@/lib/types"
import { fit, createTrainedModel } from "@/lib/ml/logreg"
import { buildFeatureVector, getFeatureOrder } from "@/lib/ml/features"

interface TrainRequest {
  // Option 1: Pass candidate analyses with labels
  examples?: Array<{ candidate: CandidateAnalysis; label: 0 | 1 }>
  // Option 2: Pass pre-computed feature vectors
  featureVectors?: TrainingExample[]
}

export async function POST(request: Request) {
  try {
    const body: TrainRequest = await request.json()

    let trainingData: TrainingExample[]

    if (body.featureVectors && body.featureVectors.length > 0) {
      trainingData = body.featureVectors
    } else if (body.examples && body.examples.length > 0) {
      trainingData = body.examples.map(({ candidate, label }) => ({
        features: buildFeatureVector(candidate).features,
        label,
      }))
    } else {
      return NextResponse.json({ success: false, error: "Either examples or featureVectors required" }, { status: 400 })
    }

    // Minimum data requirement
    if (trainingData.length < 12) {
      return NextResponse.json(
        {
          success: false,
          error: `Calibration data too small: ${trainingData.length} examples (minimum 12 required)`,
        },
        { status: 400 },
      )
    }

    // Train model
    const fitResult = fit(trainingData)
    const model = createTrainedModel(fitResult, getFeatureOrder(), "calib")

    return NextResponse.json({
      success: true,
      model,
      meta: {
        trainingSize: trainingData.length,
        testSize: trainingData.length >= 20 ? Math.floor(trainingData.length * 0.2) : 0,
        featureCount: getFeatureOrder().length,
      },
    })
  } catch (error) {
    console.error("ML training error:", error)
    return NextResponse.json({ success: false, error: "Training failed" }, { status: 500 })
  }
}
