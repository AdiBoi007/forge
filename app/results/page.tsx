"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Brain,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Copy,
  Loader2,
  Clock,
  Eye,
  Settings,
  Mail,
  ShieldCheck,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CandidateAnalysis } from "@/lib/scoring"
import { DEFAULT_TAU } from "@/lib/scoring"
import { EvidenceHeatmap } from "@/components/evidence-heatmap"
import { InterviewPlanViewer } from "@/components/interview-plan-viewer"
import { generateInterviewPlans } from "@/lib/interview-plans"
import { generateRejectionEmail, generateInviteEmail } from "@/lib/email-templates"
import { AskEvidenceChat } from "@/components/ask-evidence-chat"
import { LinkVerifierPanel } from "@/components/link-verifier-panel"
import { WhyNotHiredPanel } from "@/components/why-not-hired-panel"
import { HiringPacketExport } from "@/components/hiring-packet-export"
import { ShareableLinkPanel } from "@/components/shareable-link-panel"
import { EmailComposer } from "@/components/email-composer" // Import EmailComposer
import { VerificationPanel } from "@/components/verification-panel" // Import VerificationPanel
import { CompFitBadge } from "@/components/comp-fit-badge" // Import CompFitBadge

type Tab = "overview" | "evidence" | "interview" | "verification" | "tools"

interface GateConfig {
  tauHigh: number
  tauLow: number
  autoCalibrate: boolean
  minShortlist: number
}

// Helper functions for formatting scores and confidence
function formatScore(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) return 0
  // If value is between 0-1, it's a decimal that needs *100
  // If value is > 1, it's already a percentage
  const normalized = value <= 1 && value > 0 ? value * 100 : value
  // Clamp to 0-100 and round
  return Math.round(Math.max(0, Math.min(100, normalized)))
}

function formatConfidence(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) return 0
  // Same logic - handle both 0-1 and 0-100 scales
  const normalized = value <= 1 && value > 0 ? value * 100 : value
  return Math.round(Math.max(0, Math.min(100, normalized)))
}

export default function ResultsPage() {
  const [candidateResults, setCandidateResults] = useState<CandidateAnalysis[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [isLiveData, setIsLiveData] = useState(false)
  const [jobConfig, setJobConfig] = useState<{
    title: string
    description: string
    skills: any[]
    gateThreshold?: number
  } | null>(null)
  const [isGeneratingPack, setIsGeneratingPack] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())
  const [decisionFilter, setDecisionFilter] = useState<"all" | "shortlisted" | "rejected" | "review">("all")
  const [decisions, setDecisions] = useState<Record<string, { status: string; notes: string }>>({})
  const [showGateControls, setShowGateControls] = useState(false)
  const [gateConfig, setGateConfig] = useState<GateConfig>({
    tauHigh: DEFAULT_TAU,
    tauLow: 0.3,
    autoCalibrate: true,
    minShortlist: 2,
  })

  // Tool panel states
  const [showAskEvidence, setShowAskEvidence] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState<"rejection" | "invite" | null>(null)

  const handleDecision = (candidateId: string, status: "shortlisted" | "rejected" | null, notes?: string) => {
    setDecisions((prev) => {
      const updated = { ...prev }
      if (status === null) {
        // Undo - remove decision
        delete updated[candidateId]
      } else {
        updated[candidateId] = { status, notes: notes || "" }
      }
      // Persist to localStorage
      localStorage.setItem("forge_decisions", JSON.stringify(updated))
      return updated
    })
  }

  // Load data from localStorage
  useEffect(() => {
    const analysisStr = localStorage.getItem("forge_analysis")
    if (analysisStr) {
      try {
        const analysis = JSON.parse(analysisStr)
        setCandidateResults(analysis.candidates || [])
        setIsLiveData(analysis.isLive || false)
        if (analysis.candidates?.length > 0) {
          setSelectedCandidate(analysis.candidates[0])
        }
        if (analysis.meta?.tau) {
          setGateConfig((prev) => ({
            ...prev,
            tauHigh: analysis.meta.tau,
          }))
        }
      } catch (e) {
        console.error("Failed to parse analysis:", e)
      }
    }

    const jobStr = localStorage.getItem("forge_job_config")
    if (jobStr) {
      try {
        const parsed = JSON.parse(jobStr)
        setJobConfig(parsed)
        if (parsed.gateThreshold !== undefined) {
          setGateConfig((prev) => ({
            ...prev,
            tauHigh: parsed.gateThreshold,
          }))
        }
      } catch (e) {
        console.error("Failed to parse job config:", e)
      }
    }

    const decisionsStr = localStorage.getItem("forge_decisions")
    if (decisionsStr) {
      try {
        setDecisions(JSON.parse(decisionsStr))
      } catch (e) {
        console.error("Failed to parse decisions:", e)
      }
    }

    const gateStr = localStorage.getItem("forge_gate_config")
    if (gateStr) {
      try {
        setGateConfig(JSON.parse(gateStr))
      } catch (e) {
        console.error("Failed to parse gate config:", e)
      }
    }
  }, [])

  // Bucket candidates by gate status
  const { autoPassed, reviewLane, autoRejected } = useMemo(() => {
    const autoPassed: CandidateAnalysis[] = []
    const reviewLane: CandidateAnalysis[] = []
    const autoRejected: CandidateAnalysis[] = []

    candidateResults.forEach((c) => {
      // gateStatus is "ranked" or "filtered" from lib/scoring.ts
      if (c.gateStatus === "ranked") {
        // Ranked candidates with high scores go to auto-pass, others to review
        if (c.finalScore >= 60) {
          autoPassed.push(c)
        } else {
          reviewLane.push(c)
        }
      } else {
        // "filtered" = below tau gate
        autoRejected.push(c)
      }
    })

    return { autoPassed, reviewLane, autoRejected }
  }, [candidateResults])

  // Filter by decision
  const filteredCandidates = useMemo(() => {
    let candidates = candidateResults

    if (decisionFilter === "shortlisted") {
      candidates = candidates.filter((c) => decisions[c.id]?.status === "shortlisted")
    } else if (decisionFilter === "rejected") {
      candidates = candidates.filter((c) => decisions[c.id]?.status === "rejected")
    } else if (decisionFilter === "review") {
      candidates = candidates.filter((c) => c.gateStatus === "ranked" && c.finalScore < 60)
    }

    return candidates
  }, [candidateResults, decisionFilter, decisions])

  const handleGenerateInterviewPack = async () => {
    if (!selectedCandidate || !jobConfig) return

    setIsGeneratingPack(true)
    try {
      const response = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: jobConfig,
          candidate: selectedCandidate,
          mode: "auto",
        }),
      })

      const data = await response.json()
      if (data.success && data.pack) {
        const updatedCandidate = { ...selectedCandidate, interviewPack: data.pack }
        setSelectedCandidate(updatedCandidate)

        const analysisStr = localStorage.getItem("forge_analysis")
        if (analysisStr) {
          const analysis = JSON.parse(analysisStr)
          const updatedCandidates = analysis.candidates.map((c: CandidateAnalysis) =>
            c.id === selectedCandidate.id ? updatedCandidate : c,
          )
          localStorage.setItem("forge_analysis", JSON.stringify({ ...analysis, candidates: updatedCandidates }))
          setCandidateResults(updatedCandidates)
        }
      }
    } catch (error) {
      console.error("Failed to generate interview pack:", error)
    } finally {
      setIsGeneratingPack(false)
    }
  }

  const handleCopyAllQuestions = () => {
    if (!selectedCandidate?.interviewPack) return
    const pack = selectedCandidate.interviewPack
    const questions = [
      ...pack.sections.deepDives.map((q) => `[Deep Dive] ${q.question}`),
      ...pack.sections.riskProbes.map((q) => `[Risk Probe] ${q.question}`),
    ].join("\n\n")
    navigator.clipboard.writeText(questions)
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Strong Hire":
        return "text-success"
      case "Hire":
      case "Possible":
        return "text-foreground"
      case "Risky but High Potential":
        return "text-warning"
      default:
        return "text-destructive"
    }
  }

  const getGateStatusColor = (status: string) => {
    switch (status) {
      case "auto-pass":
        return "bg-success/20 text-success border-success/30"
      case "review":
        return "bg-warning/20 text-warning border-warning/30"
      default:
        return "bg-destructive/20 text-destructive border-destructive/30"
    }
  }

  if (candidateResults.length === 0) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-8">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-black text-foreground mb-2">No Analysis Results</h2>
            <p className="text-muted-foreground font-bold mb-6">Run an analysis from the Candidates page first</p>
            <Button
              onClick={() => (window.location.href = "/candidates")}
              className="rounded-xl font-black bg-primary hover:bg-primary/90"
            >
              Go to Candidates
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b-3 border-border bg-surface/50">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-foreground">Decision Cockpit</h1>
                </div>
                <p className="text-sm text-muted-foreground font-bold">
                  {jobConfig?.title || "Analysis"} • {candidateResults.length} candidates analyzed
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Gate Controls Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGateControls(!showGateControls)}
                  className="border-2 border-border rounded-xl font-bold bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gate Controls
                </Button>

                {/* Filter */}
                <div className="flex items-center gap-2 bg-surface border-2 border-border rounded-xl p-1">
                  {(["all", "shortlisted", "rejected", "review"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDecisionFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        decisionFilter === f
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FORGE Formula Banner - Clearer CS_required vs tau display */}
            <div className="mt-4 p-3 bg-black/50 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-6">
                <code className="text-sm font-mono text-primary">FORGE = CS × XS + LV</code>
                <span className="text-xs text-muted-foreground">|</span>
                <code className="text-sm font-mono text-muted-foreground">
                  Gate: CS<sub>required</sub> ≥ τ = {Math.round(gateConfig.tauHigh * 100)}%
                </code>
                <span className="text-xs text-muted-foreground italic">(only required skills count toward gate)</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-success font-bold">{autoPassed.length} Auto-Pass</span>
                <span className="text-warning font-bold">{reviewLane.length} Review</span>
                <span className="text-destructive font-bold">{autoRejected.length} Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gate Controls Panel */}
        {showGateControls && (
          <div className="border-b-2 border-border bg-surface/30">
            <div className="max-w-[1600px] mx-auto px-6 py-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">τ High (Auto-Pass)</label>
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.05"
                    value={gateConfig.tauHigh}
                    onChange={(e) => setGateConfig((prev) => ({ ...prev, tauHigh: Number.parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm font-mono text-foreground">{Math.round(gateConfig.tauHigh * 100)}%</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">τ Low (Review)</label>
                  <input
                    type="range"
                    min="0.2"
                    max="0.7"
                    step="0.05"
                    value={gateConfig.tauLow}
                    onChange={(e) => setGateConfig((prev) => ({ ...prev, tauLow: Number.parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-sm font-mono text-foreground">{Math.round(gateConfig.tauLow * 100)}%</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Min Shortlist</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={gateConfig.minShortlist}
                    onChange={(e) =>
                      setGateConfig((prev) => ({ ...prev, minShortlist: Number.parseInt(e.target.value) || 2 }))
                    }
                    className="w-20 bg-black border-2 border-border rounded-lg px-3 py-1 text-sm font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoCalibrate"
                    checked={gateConfig.autoCalibrate}
                    onChange={(e) => setGateConfig((prev) => ({ ...prev, autoCalibrate: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="autoCalibrate" className="text-sm font-bold text-foreground">
                    Auto-calibrate from pool
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel - Candidate List */}
            <div className="col-span-4 space-y-4">
              {/* Auto-Pass Section */}
              {autoPassed.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-sm font-black text-success">Auto-Pass ({autoPassed.length})</span>
                  </div>
                  <div className="space-y-2">
                    {autoPassed
                      .filter((c) => decisionFilter === "all" || filteredCandidates.includes(c))
                      .map((candidate) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          isSelected={selectedCandidate?.id === candidate.id}
                          onClick={() => setSelectedCandidate(candidate)}
                          decision={decisions[candidate.id]}
                          handleDecision={handleDecision}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Review Section */}
              {reviewLane.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-warning" />
                    <span className="text-sm font-black text-warning">Review ({reviewLane.length})</span>
                  </div>
                  <div className="space-y-2">
                    {reviewLane
                      .filter((c) => decisionFilter === "all" || filteredCandidates.includes(c))
                      .map((candidate) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          isSelected={selectedCandidate?.id === candidate.id}
                          onClick={() => setSelectedCandidate(candidate)}
                          decision={decisions[candidate.id]}
                          handleDecision={handleDecision}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Rejected Section */}
              {autoRejected.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-black text-destructive">Below τ ({autoRejected.length})</span>
                  </div>
                  <div className="space-y-2">
                    {autoRejected
                      .filter((c) => decisionFilter === "all" || filteredCandidates.includes(c))
                      .map((candidate) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          isSelected={selectedCandidate?.id === candidate.id}
                          onClick={() => setSelectedCandidate(candidate)}
                          decision={decisions[candidate.id]}
                          handleDecision={handleDecision}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Detail View */}
            <div className="col-span-8">
              {selectedCandidate ? (
                <div className="bg-surface border-3 border-border rounded-2xl p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {selectedCandidate.avatar && (
                        <img
                          src={selectedCandidate.avatar || "/placeholder.svg"}
                          alt={selectedCandidate.name}
                          className="h-16 w-16 rounded-2xl border-3 border-border"
                        />
                      )}
                      <div>
                        <h2 className="text-2xl font-black text-foreground">{selectedCandidate.name}</h2>
                        <p className="text-sm text-muted-foreground font-bold">{selectedCandidate.headline}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={cn(
                              "font-black text-xs border-2",
                              // Fixed gate status color display - using "ranked" for auto-pass/review
                              selectedCandidate.gateStatus === "ranked" && selectedCandidate.finalScore >= 60
                                ? "bg-success/20 text-success border-success/30"
                                : selectedCandidate.gateStatus === "ranked" && selectedCandidate.finalScore < 60
                                  ? "bg-warning/20 text-warning border-warning/30"
                                  : "bg-destructive/20 text-destructive border-destructive/30",
                            )}
                          >
                            {selectedCandidate.gateStatus === "ranked" && selectedCandidate.finalScore >= 60
                              ? "AUTO-PASS"
                              : selectedCandidate.gateStatus === "ranked" && selectedCandidate.finalScore < 60
                                ? "REVIEW"
                                : "FILTERED"}
                          </Badge>
                          <span className={cn("font-black", getVerdictColor(selectedCandidate.verdict))}>
                            {selectedCandidate.verdict}
                          </span>
                          {selectedCandidate.compFit && <CompFitBadge compFit={selectedCandidate.compFit} />}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-4xl font-black text-foreground">
                        {formatScore(selectedCandidate.finalScore)}
                      </div>
                      <div className="text-xs text-muted-foreground font-bold">
                        CS: {formatScore(selectedCandidate.capabilityScore)}% × XS:{" "}
                        {formatScore(selectedCandidate.contextScore)}%
                        {(selectedCandidate.learningVelocityBonus ?? 0) > 0 && (
                          <span className="text-amber-400">
                            {" "}
                            + LV: +{Math.round((selectedCandidate.learningVelocityBonus ?? 0) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Proof Confidence: {formatConfidence(selectedCandidate.proofConfidence)}%
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="bg-black/30 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        FORGE = CS_rank × (0.6 + 0.4×XS) + 0.05×LV
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* CS Required */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">CS Required</div>
                        <div className="text-xl font-black text-foreground">
                          {formatScore(selectedCandidate.csRequired ?? selectedCandidate.capabilityScore)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {selectedCandidate.gateStatus === "ranked" ? "≥" : "<"} τ (
                          {Math.round((selectedCandidate.tau ?? 0.4) * 100)}%)
                        </div>
                      </div>

                      {/* CS Optional */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">CS Optional</div>
                        <div className="text-xl font-black text-foreground">
                          {formatScore(selectedCandidate.csOptional ?? 0)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">bonus skills</div>
                      </div>

                      {/* CS Rank */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">CS Rank</div>
                        <div className="text-xl font-black text-foreground">
                          {formatScore(selectedCandidate.csRank ?? selectedCandidate.capabilityScore)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">= CS_req + 0.25×CS_opt</div>
                      </div>

                      {/* XS */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Context (XS)</div>
                        <div className="text-xl font-black text-foreground">
                          {formatScore(selectedCandidate.contextScore)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">soft signals</div>
                      </div>

                      {/* LV */}
                      {(selectedCandidate.learningVelocityBonus ?? 0) > 0 && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Learning (LV)</div>
                          <div className="text-xl font-black text-amber-400">
                            +{Math.round((selectedCandidate.learningVelocityBonus ?? 0) * 100)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">growth bonus</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-muted/30 rounded-xl border-2 border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground">AI Recommendation:</span>
                        <span className={cn("font-black", getVerdictColor(selectedCandidate.verdict))}>
                          {selectedCandidate.verdict}
                        </span>
                      </div>
                      {decisions[selectedCandidate.id] && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground">Your Decision:</span>
                          {decisions[selectedCandidate.id].status === "shortlisted" ? (
                            <Badge className="bg-success text-white font-black border-0">
                              <Check className="h-3 w-3 mr-1" />
                              SELECTED
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive text-white font-black border-0">
                              <X className="h-3 w-3 mr-1" />
                              REJECTED
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {decisions[selectedCandidate.id]?.status === "shortlisted" ? (
                        <>
                          <Button
                            onClick={() => handleDecision(selectedCandidate.id, null)}
                            variant="outline"
                            className="flex-1 border-2 border-border rounded-xl font-bold"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Undo Selection
                          </Button>
                          <Button
                            onClick={() => handleDecision(selectedCandidate.id, "rejected")}
                            className="flex-1 bg-destructive hover:bg-destructive/90 rounded-xl font-bold"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject Instead
                          </Button>
                        </>
                      ) : decisions[selectedCandidate.id]?.status === "rejected" ? (
                        <>
                          <Button
                            onClick={() => handleDecision(selectedCandidate.id, "shortlisted")}
                            className="flex-1 bg-success hover:bg-success/90 rounded-xl font-bold"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Select Instead
                          </Button>
                          <Button
                            onClick={() => handleDecision(selectedCandidate.id, null)}
                            variant="outline"
                            className="flex-1 border-2 border-border rounded-xl font-bold"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Undo Rejection
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleDecision(selectedCandidate.id, "rejected")}
                            variant="outline"
                            className="flex-1 border-2 border-destructive/50 text-destructive hover:bg-destructive/10 rounded-xl font-bold"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleDecision(selectedCandidate.id, "shortlisted")}
                            className="flex-1 bg-success hover:bg-success/90 rounded-xl font-bold"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Select for Interview
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Optional notes input */}
                    {decisions[selectedCandidate.id] && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Add notes about your decision..."
                          value={decisions[selectedCandidate.id]?.notes || ""}
                          onChange={(e) =>
                            handleDecision(
                              selectedCandidate.id,
                              decisions[selectedCandidate.id].status as "shortlisted" | "rejected",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 text-sm bg-background border-2 border-border rounded-lg focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                  </div>

                  {/* Why This Score */}
                  {selectedCandidate.explanations && (
                    <div className="bg-black/30 rounded-xl p-4 border border-border">
                      <h4 className="font-black text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Why This Score
                      </h4>
                      <div className="space-y-2">
                        {selectedCandidate.explanations.topReasons?.map((reason, i) => (
                          <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                            {reason}
                          </p>
                        ))}
                        {selectedCandidate.explanations.risks?.map((risk, i) => (
                          <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                            {risk}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Grid */}
                  <div>
                    <h4 className="font-black text-foreground mb-3">Skill Breakdown</h4>
                    {(() => {
                      const requiredSkills = selectedCandidate.capability.skills.filter((s) => s.isRequired !== false)
                      const optionalSkills = selectedCandidate.capability.skills.filter((s) => s.isRequired === false)
                      const totalWeight = selectedCandidate.capability.skills.reduce(
                        (acc, s) => acc + (s.weight || 10),
                        0,
                      )

                      const renderSkillCard = (skill: (typeof selectedCandidate.capability.skills)[0]) => {
                        const normalizedWeight =
                          totalWeight > 0 ? Math.round(((skill.weight || 10) / totalWeight) * 100) : 0
                        const displayScore = formatScore(skill.score)
                        const contribution = Math.round((normalizedWeight * displayScore) / 100)

                        return (
                          <div
                            key={skill.name}
                            className="bg-black/30 rounded-xl p-3 border border-border group relative"
                            title={`Score: ${displayScore}% | Weight: ${normalizedWeight}% | Contribution: ${contribution}%`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm">{skill.name}</span>
                                {skill.isRequired !== false && (
                                  <span className="text-[10px] text-destructive font-bold">REQ</span>
                                )}
                              </div>
                              <Badge
                                className={cn(
                                  "text-xs font-bold",
                                  skill.status === "Proven"
                                    ? "bg-success/20 text-success"
                                    : skill.status === "Weak"
                                      ? "bg-warning/20 text-warning"
                                      : "bg-destructive/20 text-destructive",
                                )}
                              >
                                {skill.status}
                              </Badge>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  skill.status === "Proven"
                                    ? "bg-success"
                                    : skill.status === "Weak"
                                      ? "bg-warning"
                                      : "bg-destructive",
                                )}
                                style={{ width: `${Math.min(displayScore, 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">{normalizedWeight}% weight</span>
                              <span className="text-xs font-mono text-foreground" title="Evidence strength">
                                {displayScore}% evidence
                              </span>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              Score: {displayScore}% × Weight: {normalizedWeight}% = {contribution}% contribution
                            </div>
                          </div>
                        )
                      }

                      return (
                        <>
                          {/* Required Skills Section */}
                          {requiredSkills.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-destructive uppercase tracking-wide">
                                  Required Skills
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({requiredSkills.filter((s) => s.status === "Proven").length}/{requiredSkills.length}{" "}
                                  proven)
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">{requiredSkills.map(renderSkillCard)}</div>
                            </div>
                          )}

                          {/* Optional Skills Section */}
                          {optionalSkills.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                  Optional Skills
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({optionalSkills.filter((s) => s.status === "Proven").length}/{optionalSkills.length}{" "}
                                  proven)
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">{optionalSkills.map(renderSkillCard)}</div>
                            </div>
                          )}

                          {/* Fallback if no grouping */}
                          {requiredSkills.length === 0 && optionalSkills.length === 0 && (
                            <div className="grid grid-cols-2 gap-3">
                              {selectedCandidate.capability.skills.map(renderSkillCard)}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* Context Signals */}
                  <div>
                    <h4 className="font-black text-foreground mb-3">Context Signals (XS)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedCandidate.context).map(([key, signal]) => (
                        <div key={key} className="bg-black/30 rounded-xl p-3 border border-border">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-sm capitalize">{key}</span>
                            <span className="font-mono text-foreground">{formatScore(signal.score)}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{signal.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Heatmap */}
                  <EvidenceHeatmap candidate={selectedCandidate} />

                  {/* Why Not Hired (for rejected candidates) */}
                  {selectedCandidate.gateStatus === "filtered" && (
                    <WhyNotHiredPanel
                      candidate={selectedCandidate}
                      tau={gateConfig.tauHigh}
                      companyName={jobConfig?.title ? `${jobConfig.title} Team` : "Your Company"}
                    />
                  )}
                </div>
              ) : (
                <div className="min-h-[400px] flex items-center justify-center bg-surface border-3 border-border rounded-2xl">
                  <p className="text-lg font-bold text-muted-foreground">Select a candidate to view details</p>
                </div>
              )}

              {/* Tab Content */}
              <div className="mt-6">
                <div className="flex items-center gap-4 border-b-2 border-border pb-3 mb-4">
                  {(["overview", "evidence", "interview", "verification", "tools"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "text-base font-black transition-all",
                        activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {/* This section can be used for a summary or overview components */}
                    {/* For now, we'll keep it simple */}
                    <div className="p-8 bg-surface border-2 border-border rounded-xl text-center">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-black text-foreground mb-2">Candidate Overview</h3>
                      <p className="text-sm text-muted-foreground font-bold">
                        Key insights and scores are displayed above. Select a tab below for more details.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "evidence" && (
                  <div className="space-y-4">
                    {/* Link Verifier */}
                    <LinkVerifierPanel candidate={selectedCandidate} />

                    {/* Evidence List */}
                    <div>
                      <h4 className="font-black text-foreground mb-3">Evidence Receipts</h4>
                      <div className="space-y-3">
                        {selectedCandidate?.evidence.map((ev, i) => (
                          <div key={i} className="bg-black/30 rounded-xl p-4 border border-border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded font-bold uppercase",
                                      ev.impact === "high"
                                        ? "bg-success/20 text-success"
                                        : ev.impact === "medium"
                                          ? "bg-primary/20 text-primary"
                                          : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {ev.impact}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{ev.skill}</span>
                                  {ev.proofTier && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {ev.proofTier.replace(/_/g, " ")}
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-bold text-foreground">{ev.title}</h5>
                                {ev.whyThisMatters && (
                                  <p className="text-sm text-muted-foreground mt-1">{ev.whyThisMatters}</p>
                                )}
                                {ev.metrics && (
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    {ev.metrics.stars && <span>⭐ {ev.metrics.stars}</span>}
                                    {ev.metrics.commits && <span>📝 {ev.metrics.commits} commits</span>}
                                    {ev.metrics.lines && <span>📄 {ev.metrics.lines} lines</span>}
                                  </div>
                                )}
                              </div>
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "interview" && (
                  <div className="space-y-4">
                    {!selectedCandidate?.interviewPack ? (
                      <div className="p-6 bg-surface border-3 border-border rounded-2xl text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-black text-foreground mb-2">Generate Interview Pack</h3>
                        <p className="text-sm text-muted-foreground font-bold mb-4">
                          Create tailored questions based on this candidate&apos;s evidence
                        </p>
                        <Button
                          onClick={handleGenerateInterviewPack}
                          disabled={isGeneratingPack}
                          className="bg-primary hover:bg-primary/90 text-background rounded-xl font-black"
                        >
                          {isGeneratingPack ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Questions
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Interview Plans */}
                        <div>
                          <h4 className="font-black text-foreground mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Interview Time Plans
                          </h4>
                          <InterviewPlanViewer
                            plans={generateInterviewPlans(selectedCandidate, jobConfig?.skills || [])}
                            candidateName={selectedCandidate.name}
                          />
                        </div>

                        {/* Questions */}
                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-black text-foreground">Generated Questions</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCopyAllQuestions}
                              className="border-2 border-border rounded-lg font-bold bg-transparent"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy All
                            </Button>
                          </div>

                          {selectedCandidate.interviewPack.sections.deepDives.map((q, i) => (
                            <div key={i} className="p-4 bg-black/30 border border-border rounded-xl mb-2">
                              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase">
                                Deep Dive
                              </span>
                              <p className="font-bold text-foreground text-sm mt-2">{q.question}</p>
                              <p className="text-xs text-muted-foreground mt-1">{q.whyAsk}</p>
                            </div>
                          ))}

                          {selectedCandidate.interviewPack.sections.riskProbes.map((q, i) => (
                            <div key={i} className="p-4 bg-destructive/5 border border-destructive/30 rounded-xl mb-2">
                              <span className="px-2 py-0.5 rounded bg-destructive/20 text-destructive text-[10px] font-black uppercase">
                                Risk Probe
                              </span>
                              <p className="font-bold text-foreground text-sm mt-2">{q.question}</p>
                              <p className="text-xs text-muted-foreground mt-1">{q.whyAsk}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "verification" && (
                  <div className="space-y-4">
                    {selectedCandidate?.verification ? (
                      <VerificationPanel verification={selectedCandidate.verification} />
                    ) : (
                      <div className="p-8 bg-surface border-2 border-border rounded-xl text-center">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-black text-foreground mb-2">No Verification Data</h3>
                        <p className="text-sm text-muted-foreground font-bold">
                          Verification requires resume text and linked artifacts to cross-check claims.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Add portfolio URLs, writing links, or paste resume text on the Candidates page.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "tools" && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Export Packet */}
                      <HiringPacketExport
                        candidate={selectedCandidate}
                        jobTitle={jobConfig?.title || "Position"}
                        interviewPack={selectedCandidate?.interviewPack}
                      />

                      {/* Shareable Link */}
                      <ShareableLinkPanel candidates={[selectedCandidate]} jobTitle={jobConfig?.title || "Position"} />
                    </div>

                    {/* Ask Evidence Chat */}
                    <AskEvidenceChat candidate={selectedCandidate} />

                    {/* Email Templates */}
                    <div className="bg-surface rounded-xl border-2 border-border p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Mail className="h-5 w-5 text-primary" />
                        <h4 className="font-black text-foreground">Email Templates</h4>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowEmailComposer(showEmailComposer === "rejection" ? null : "rejection")}
                          className="flex-1 border-2 border-destructive/30 rounded-xl font-bold bg-transparent text-destructive hover:bg-destructive/10"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Rejection Email
                        </Button>
                        <Button
                          onClick={() => setShowEmailComposer(showEmailComposer === "invite" ? null : "invite")}
                          className="flex-1 bg-success hover:bg-success/90 rounded-xl font-bold"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Interview Invite
                        </Button>
                      </div>

                      {showEmailComposer === "rejection" && (
                        <div className="mt-4">
                          <EmailComposer
                            template={generateRejectionEmail(selectedCandidate, jobConfig?.title || "Position")}
                            type="rejection"
                            onClose={() => setShowEmailComposer(null)}
                          />
                        </div>
                      )}

                      {showEmailComposer === "invite" && (
                        <div className="mt-4">
                          <EmailComposer
                            template={generateInviteEmail(
                              selectedCandidate,
                              "Your Company",
                              jobConfig?.title || "Position",
                              generateInterviewPlans(selectedCandidate, jobConfig?.skills || {})["30min"],
                              "Hiring Manager",
                            )}
                            type="invite"
                            onClose={() => setShowEmailComposer(null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// Candidate Card Component
function CandidateCard({
  candidate,
  isSelected,
  onClick,
  decision,
  handleDecision,
}: {
  candidate: CandidateAnalysis
  isSelected: boolean
  onClick: () => void
  decision?: { status: string; notes: string }
  handleDecision: (candidateId: string, status: "shortlisted" | "rejected" | null, notes?: string) => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border-2 transition-all",
        isSelected ? "bg-primary/10 border-primary" : "bg-surface border-border hover:border-muted-foreground",
      )}
    >
      <div className="flex items-center gap-3">
        {candidate.avatar && (
          <img src={candidate.avatar || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-lg" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground truncate">{candidate.name}</span>
            {decision?.status === "shortlisted" && <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />}
            {decision?.status === "rejected" && <X className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{candidate.headline}</p>
          {candidate.compFit && candidate.compFit.status !== "unknown" && (
            <span
              className={cn(
                "text-xs",
                candidate.compFit.status === "in-band" && "text-emerald-400",
                candidate.compFit.status === "slightly-above" && "text-amber-400",
                candidate.compFit.status === "way-above" && "text-rose-400",
                candidate.compFit.status.includes("below") && "text-cyan-400",
              )}
            >
              {candidate.compFit.icon} {candidate.compFit.label}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-foreground">{formatScore(candidate.finalScore)}</div>
          <div className="text-xs text-muted-foreground">{formatConfidence(candidate.proofConfidence)}% conf</div>
        </div>
      </div>
    </button>
  )
}
