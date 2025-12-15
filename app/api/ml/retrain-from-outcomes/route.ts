// POST /api/ml/retrain-from-outcomes
// ============================================

import { NextResponse } from "next/server"
import type { EmployeeOutcome, TrainedModel, TrainingExample, ModelUpdateReport } from "@/lib/types"
import { fit, createTrainedModel } from "@/lib/ml/logreg"
import { getFeatureOrder } from "@/lib/ml/features"

interface RetrainRequest {
  outcomes: EmployeeOutcome[]
  minSamples?: number
  oldModel?: TrainedModel
}

export async function POST(request: Request) {
  try {
    const body: RetrainRequest = await request.json()
    const minSamples = body.minSamples ?? 12

    if (!body.outcomes || body.outcomes.length === 0) {
      return NextResponse.json({ success: false, error: "outcomes array is required" }, { status: 400 })
    }

    // Build training data from featureSnapshot
    // Label rule: probationPassed && managerRating1to5 >= 4 && !regrettedHire
    const trainingData: TrainingExample[] = []

    for (const o of body.outcomes) {
      const snap = o.featureSnapshot
      const label = o.outcome.probationPassed && o.outcome.managerRating1to5 >= 4 && !o.outcome.regrettedHire ? 1 : 0

      // Build 14-feature vector matching lib/ml/features.ts order
      const features = [
        snap.cs_total, // cs
        snap.xs, // xs
        snap.forgeScore, // forgeScore
        snap.proofConfidence, // proofConfidence
        snap.forkRatio, // forkRatio
        snap.burstiness, // burstActivity
        snap.recency, // recency
        snap.teamwork, // teamwork
        snap.communication, // communication
        snap.adaptability, // adaptability
        snap.ownership, // ownership
        snap.missingSkillsCount / 5, // missingRatio (normalize)
        snap.weakSkillsCount / 5, // weakRatio (normalize)
        snap.nonGithubSignalsPresent, // nonGithubPresent
      ]

      trainingData.push({ features, label: label as 0 | 1 })
    }

    if (trainingData.length < minSamples) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient outcome data: ${trainingData.length} examples (minimum ${minSamples} required)`,
        },
        { status: 400 },
      )
    }

    // Train model
    const fitResult = fit(trainingData)
    const model = createTrainedModel(fitResult, getFeatureOrder(), "outcomes")

    // Determine confidence band
    const confidenceBand: "LOW" | "MED" | "HIGH" =
      trainingData.length >= 40 ? "HIGH" : trainingData.length >= 20 ? "MED" : "LOW"

    // Build report
    const report: ModelUpdateReport = {
      oldVersion: body.oldModel?.version,
      newVersion: model.version,
      datasetSize: trainingData.length,
      confidence: confidenceBand,
      topChanges: [],
      notes: [],
    }

    // Top positive/negative weights
    const featureOrder = getFeatureOrder()
    const weightedFeatures = featureOrder
      .map((name, i) => ({
        feature: name,
        weight: model.weights[i],
      }))
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))

    report.topChanges = weightedFeatures.slice(0, 5).map((w) => ({
      feature: w.feature,
      delta: w.weight,
    }))

    // Good hire rate
    const goodHires = trainingData.filter((d) => d.label === 1).length
    report.notes.push(`Good hire rate: ${Math.round((goodHires / trainingData.length) * 100)}%`)
    report.notes.push(`${body.outcomes.length} historical outcomes processed`)

    // Suggested tau (optional)
    const csIdx = featureOrder.indexOf("cs")
    let suggestedTau = 0.65
    if (csIdx >= 0) {
      // If CS weight is very high, model thinks capability matters more
      const csWeight = model.weights[csIdx]
      suggestedTau = Math.max(0.5, Math.min(0.8, 0.65 + csWeight * 0.05))
    }

    return NextResponse.json({
      success: true,
      model,
      report,
      suggestedTau: Math.round(suggestedTau * 100) / 100,
      confidenceBand,
    })
  } catch (error) {
    console.error("ML retrain error:", error)
    return NextResponse.json({ success: false, error: "Retraining failed" }, { status: 500 })
  }
}
