"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  Loader2,
  Brain,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Database,
  Sparkles,
} from "lucide-react"
import type { CandidateAnalysis } from "@/lib/scoring"
import type { TrainedModel, CalibrationLabel, EmployeeOutcome } from "@/lib/types"
import { SEED_OUTCOMES, SEED_OUTCOMES_META } from "@/lib/ml/seed-outcomes"

interface CalibrationPanelProps {
  candidates: CandidateAnalysis[]
  jobHash: string
  onCalibrationToggle: (enabled: boolean, model: TrainedModel | null) => void
}

const STORAGE_KEY_LABELS = "forge_labels"
const STORAGE_KEY_MODEL = "forge_trained_model"
const STORAGE_KEY_OUTCOMES = "forge_seed_outcomes"
const MIN_LABELS_TO_TRAIN = 12

export function CalibrationPanel({ candidates, jobHash, onCalibrationToggle }: CalibrationPanelProps) {
  const [labels, setLabels] = useState<Record<string, CalibrationLabel>>({})
  const [model, setModel] = useState<TrainedModel | null>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [calibrationEnabled, setCalibrationEnabled] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [trainingError, setTrainingError] = useState<string | null>(null)
  const [seedOutcomes, setSeedOutcomes] = useState<EmployeeOutcome[] | null>(null)
  const [seedLoaded, setSeedLoaded] = useState(false)
  const [outcomeTrainingMode, setOutcomeTrainingMode] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const storedLabels = localStorage.getItem(STORAGE_KEY_LABELS)
      if (storedLabels) {
        setLabels(JSON.parse(storedLabels))
      }
      const storedModel = localStorage.getItem(STORAGE_KEY_MODEL)
      if (storedModel) {
        setModel(JSON.parse(storedModel))
      }
      const storedOutcomes = localStorage.getItem(STORAGE_KEY_OUTCOMES)
      if (storedOutcomes) {
        setSeedOutcomes(JSON.parse(storedOutcomes))
        setSeedLoaded(true)
      }
    } catch (e) {
      console.error("Failed to load calibration data:", e)
    }
  }, [])

  // Save labels to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LABELS, JSON.stringify(labels))
  }, [labels])

  const labelCandidate = (candidateId: string, outcome: CalibrationLabel["outcome"]) => {
    const key = `${candidateId}_${jobHash}`
    setLabels((prev) => ({
      ...prev,
      [key]: {
        candidateId,
        jobHash,
        outcome,
        labeledAt: new Date().toISOString(),
      },
    }))
  }

  const getLabel = (candidateId: string): CalibrationLabel["outcome"] | null => {
    const key = `${candidateId}_${jobHash}`
    return labels[key]?.outcome || null
  }

  const labeledCount = Object.values(labels).filter((l) => l.jobHash === jobHash).length
  const canTrain = labeledCount >= MIN_LABELS_TO_TRAIN

  const handleLoadSeedOutcomes = () => {
    localStorage.setItem(STORAGE_KEY_OUTCOMES, JSON.stringify(SEED_OUTCOMES))
    setSeedOutcomes(SEED_OUTCOMES)
    setSeedLoaded(true)
  }

  const handleTrainFromOutcomes = async () => {
    if (!seedOutcomes || seedOutcomes.length < MIN_LABELS_TO_TRAIN) return

    setIsTraining(true)
    setTrainingError(null)
    setOutcomeTrainingMode(true)

    try {
      const response = await fetch("/api/ml/retrain-from-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcomes: seedOutcomes,
          minSamples: MIN_LABELS_TO_TRAIN,
          oldModel: model,
        }),
      })

      const data = await response.json()

      if (data.success && data.model) {
        setModel(data.model)
        localStorage.setItem(STORAGE_KEY_MODEL, JSON.stringify(data.model))
      } else {
        setTrainingError(data.error || "Training failed")
      }
    } catch (error) {
      console.error("Training error:", error)
      setTrainingError("Failed to train model")
    }

    setIsTraining(false)
  }

  const handleTrain = async () => {
    setIsTraining(true)
    setTrainingError(null)
    setOutcomeTrainingMode(false)

    try {
      const labeledCandidates = candidates.filter((c) => getLabel(c.id) !== null)

      const featureVectors = labeledCandidates.map((c) => {
        const label = getLabel(c.id)
        const binaryLabel = label === "hired" || label === "good_hire" ? 1 : 0

        const features = [
          c.capabilityScore,
          c.contextScore,
          c.forgeScore,
          c.proofConfidence / 100,
          0.1,
          0,
          0.8,
          c.context.teamwork.score,
          c.context.communication.score,
          c.context.adaptability.score,
          c.context.ownership.score,
          c.capability.skills.filter((s) => s.status === "Missing").length / Math.max(c.capability.skills.length, 1),
          c.capability.skills.filter((s) => s.status === "Weak").length / Math.max(c.capability.skills.length, 1),
          0,
        ]

        return { features, label: binaryLabel as 0 | 1 }
      })

      const response = await fetch("/api/ml/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureVectors }),
      })

      const data = await response.json()

      if (data.success && data.model) {
        setModel(data.model)
        localStorage.setItem(STORAGE_KEY_MODEL, JSON.stringify(data.model))
      } else {
        setTrainingError(data.error || "Training failed")
      }
    } catch (error) {
      console.error("Training error:", error)
      setTrainingError("Failed to train model")
    }

    setIsTraining(false)
  }

  const handleCalibrationToggle = (enabled: boolean) => {
    setCalibrationEnabled(enabled)
    onCalibrationToggle(enabled, enabled ? model : null)
  }

  const getConfidenceLevel = (): "LOW" | "MED" | "HIGH" => {
    if (seedLoaded && seedOutcomes) {
      if (seedOutcomes.length >= 40) return "HIGH"
      if (seedOutcomes.length >= 20) return "MED"
    }
    if (labeledCount < 20) return "LOW"
    if (labeledCount < 50) return "MED"
    return "HIGH"
  }

  const confidenceLevel = getConfidenceLevel()

  return (
    <div className="bg-muted/30 border-3 border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-foreground" />
          <span className="font-bold text-foreground">Calibration</span>
          {seedLoaded && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400">
              {seedOutcomes?.length} outcomes loaded
            </span>
          )}
          {!seedLoaded && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-muted text-muted-foreground">
              {labeledCount} labeled
            </span>
          )}
          {model && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400">
              Calibrated from {outcomeTrainingMode ? "outcomes" : "labels"}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 py-4 border-t border-border space-y-4">
          <div className="p-3 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-sm text-foreground">Historical Outcomes</span>
              </div>
              {!seedLoaded ? (
                <Button
                  onClick={handleLoadSeedOutcomes}
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-bold text-xs bg-transparent"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Load Seed Data
                </Button>
              ) : (
                <Button
                  onClick={handleTrainFromOutcomes}
                  disabled={isTraining}
                  size="sm"
                  className="rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {isTraining && outcomeTrainingMode ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Training...
                    </>
                  ) : (
                    "Train from Outcomes"
                  )}
                </Button>
              )}
            </div>

            {seedLoaded && seedOutcomes && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-background rounded-lg">
                    <div className="font-bold text-foreground">{SEED_OUTCOMES_META.n}</div>
                    <div className="text-muted-foreground">Employees</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded-lg">
                    <div className="font-bold text-foreground">{SEED_OUTCOMES_META.avgRating}</div>
                    <div className="text-muted-foreground">Avg Rating</div>
                  </div>
                  <div className="text-center p-2 bg-background rounded-lg">
                    <div className="font-bold text-foreground">{SEED_OUTCOMES_META.successRate}%</div>
                    <div className="text-muted-foreground">Success Rate</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(SEED_OUTCOMES_META.byDept).map(([dept, count]) => (
                    <span key={dept} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      {dept}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Labeling Section */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Or Label Current Candidates</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {candidates
                .filter((c) => c.gateStatus === "ranked")
                .map((candidate) => {
                  const currentLabel = getLabel(candidate.id)
                  return (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between py-2 border-b border-border/50"
                    >
                      <span className="text-sm font-medium text-foreground">{candidate.name}</span>
                      <div className="flex items-center gap-2">
                        {(["hired", "rejected"] as const).map((outcome) => (
                          <button
                            key={outcome}
                            onClick={() => labelCandidate(candidate.id, outcome)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                              currentLabel === outcome
                                ? outcome === "hired"
                                  ? "bg-emerald-500 text-black"
                                  : "bg-red-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                          >
                            {outcome === "hired" ? "Hired" : "Rejected"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Training Section (for manual labels) */}
          {!seedLoaded && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Train Model</h4>
                  <p className="text-xs text-muted-foreground">
                    Need {MIN_LABELS_TO_TRAIN}+ labels. You have {labeledCount}.
                  </p>
                </div>
                <Button
                  onClick={handleTrain}
                  disabled={!canTrain || isTraining}
                  size="sm"
                  className="rounded-xl font-bold"
                >
                  {isTraining && !outcomeTrainingMode ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Training...
                    </>
                  ) : (
                    "Train"
                  )}
                </Button>
              </div>
            </div>
          )}

          {trainingError && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              {trainingError}
            </div>
          )}

          {model && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <CheckCircle className="h-4 w-4" />
                Calibrated from {model.metrics.n} labeled outcomes
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-foreground">{(model.metrics.accuracy * 100).toFixed(0)}%</div>
                  <div className="text-muted-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-foreground">{(model.metrics.precision * 100).toFixed(0)}%</div>
                  <div className="text-muted-foreground">Precision</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-foreground">{(model.metrics.recall * 100).toFixed(0)}%</div>
                  <div className="text-muted-foreground">Recall</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-foreground">{model.metrics.n}</div>
                  <div className="text-muted-foreground">Samples</div>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-center gap-2 text-xs p-2 rounded-lg",
                  confidenceLevel === "LOW"
                    ? "bg-amber-500/10 text-amber-400"
                    : confidenceLevel === "MED"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-emerald-500/10 text-emerald-400",
                )}
              >
                <Info className="h-3 w-3" />
                Calibration confidence: {confidenceLevel}
                {confidenceLevel === "LOW" && " — treat as directional only"}
              </div>
            </div>
          )}

          {/* Enable Calibration Toggle */}
          {model && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Use Calibration (Ranking Assist)</h4>
                  <p className="text-xs text-muted-foreground">
                    Adds p(Hire Success) as tie-breaker. Does NOT replace FORGE score.
                  </p>
                </div>
                <Switch checked={calibrationEnabled} onCheckedChange={handleCalibrationToggle} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
