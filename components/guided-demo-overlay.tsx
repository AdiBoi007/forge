"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  ChevronRight,
  Play,
  Pause,
  X,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Eye,
  GitBranch,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface DemoStep {
  id: string
  phase: "intro" | "job" | "candidates" | "analysis" | "results" | "features" | "outro"
  title: string
  subtitle: string
  narration: string
  highlight?: string // CSS selector or feature name to highlight
  duration: number // ms to auto-advance (0 = manual)
  action?: () => Promise<void> // async action to run
  visual?:
    | "job-extraction"
    | "candidate-cards"
    | "scoring"
    | "proof-tiers"
    | "comp-fit"
    | "evidence"
    | "why-not-hired"
    | "verdict"
}

interface GuidedDemoOverlayProps {
  isOpen: boolean
  onClose: () => void
  steps: DemoStep[]
  onStepComplete?: (stepId: string) => void
  onDemoComplete?: () => void
}

const PHASE_ICONS = {
  intro: Sparkles,
  job: FileText,
  candidates: Users,
  analysis: Zap,
  results: BarChart3,
  features: Eye,
  outro: Award,
}

const PHASE_COLORS = {
  intro: "text-amber-400",
  job: "text-blue-400",
  candidates: "text-purple-400",
  analysis: "text-orange-400",
  results: "text-emerald-400",
  features: "text-cyan-400",
  outro: "text-amber-400",
}

export function GuidedDemoOverlay({ isOpen, onClose, steps, onStepComplete, onDemoComplete }: GuidedDemoOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [stepProgress, setStepProgress] = useState(0)
  const [isExecutingAction, setIsExecutingAction] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const currentStep = steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || !isPlaying || !currentStep || currentStep.duration === 0) return

    const startTime = Date.now()
    const duration = currentStep.duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      setStepProgress(progress)

      if (elapsed >= duration) {
        clearInterval(interval)
        handleNextStep()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [currentStepIndex, isPlaying, isOpen])

  // Execute step action
  useEffect(() => {
    if (!currentStep?.action || isExecutingAction) return

    const executeAction = async () => {
      setIsExecutingAction(true)
      try {
        await currentStep.action!()
      } catch (e) {
        console.error("Demo action failed:", e)
      }
      setIsExecutingAction(false)
    }

    executeAction()
  }, [currentStepIndex])

  const handleNextStep = () => {
    if (currentStep) {
      setCompletedSteps((prev) => new Set([...prev, currentStep.id]))
      onStepComplete?.(currentStep.id)
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
      setStepProgress(0)
    } else {
      onDemoComplete?.()
    }
  }

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
      setStepProgress(0)
    }
  }

  const handleSkipToPhase = (phase: DemoStep["phase"]) => {
    const phaseIndex = steps.findIndex((s) => s.phase === phase)
    if (phaseIndex >= 0) {
      setCurrentStepIndex(phaseIndex)
      setStepProgress(0)
    }
  }

  if (!isOpen || !currentStep) return null

  const PhaseIcon = PHASE_ICONS[currentStep.phase]
  const phaseColor = PHASE_COLORS[currentStep.phase]

  // Group steps by phase for progress indicator
  const phases = ["intro", "job", "candidates", "analysis", "results", "features", "outro"] as const
  const currentPhaseIndex = phases.indexOf(currentStep.phase)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-md"
      >
        {/* Top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Phase navigation */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {phases.map((phase, i) => {
            const Icon = PHASE_ICONS[phase]
            const isActive = i === currentPhaseIndex
            const isCompleted = i < currentPhaseIndex
            return (
              <button
                key={phase}
                onClick={() => handleSkipToPhase(phase)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                  isActive
                    ? "bg-foreground text-background scale-110"
                    : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50",
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline capitalize">{phase}</span>
              </button>
            )
          })}
        </div>

        {/* Main content */}
        <div className="h-full flex flex-col items-center justify-center px-8 pt-16 pb-24">
          {/* Phase icon */}
          <motion.div
            key={currentStep.id + "-icon"}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("mb-6", phaseColor)}
          >
            <div className="p-4 rounded-3xl bg-current/10 border-2 border-current/30">
              <PhaseIcon className="h-12 w-12" />
            </div>
          </motion.div>

          {/* Step content */}
          <motion.div
            key={currentStep.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-3xl"
          >
            {/* Step counter */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="font-mono text-xs">
                {currentStepIndex + 1} / {steps.length}
              </Badge>
              <Badge className={cn("capitalize", phaseColor.replace("text-", "bg-").replace("-400", "-500/20"))}>
                {currentStep.phase}
              </Badge>
            </div>

            {/* Title */}
            <h2 className="text-4xl font-black text-foreground mb-3">{currentStep.title}</h2>

            {/* Subtitle */}
            <p className="text-xl font-bold text-muted-foreground mb-6">{currentStep.subtitle}</p>

            {/* Narration box */}
            <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 mb-8 text-left">
              <p className="text-lg text-foreground/90 leading-relaxed">{currentStep.narration}</p>
            </div>

            {/* Visual indicator */}
            {currentStep.visual && (
              <div className="mb-8">
                <DemoVisual type={currentStep.visual} />
              </div>
            )}

            {/* Step progress bar (for timed steps) */}
            {currentStep.duration > 0 && isPlaying && (
              <div className="w-full max-w-md mx-auto mb-6">
                <Progress value={stepProgress} className="h-1" />
              </div>
            )}

            {/* Action indicator */}
            {isExecutingAction && (
              <div className="flex items-center justify-center gap-2 text-amber-400 mb-6">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-sm font-bold">Executing...</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {/* Prev button */}
            <Button variant="ghost" onClick={handlePrevStep} disabled={currentStepIndex === 0} className="font-bold">
              Back
            </Button>

            {/* Play/pause controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsPlaying(!isPlaying)} className="rounded-full">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <span className="text-sm text-muted-foreground font-mono">{isPlaying ? "Auto-advancing" : "Paused"}</span>
            </div>

            {/* Next button */}
            <Button onClick={handleNextStep} className="font-bold gap-2">
              {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Visual component for different demo stages
function DemoVisual({ type }: { type: DemoStep["visual"] }) {
  const visuals: Record<NonNullable<DemoStep["visual"]>, React.ReactNode> = {
    "job-extraction": (
      <div className="flex items-center gap-4 justify-center">
        <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-xs mt-2 font-bold">Job Description</p>
        </div>
        <ChevronRight className="h-6 w-6 text-muted-foreground" />
        <div className="flex flex-wrap gap-2 max-w-xs">
          {["React", "TypeScript", "Node.js", "PostgreSQL", "CI/CD"].map((skill) => (
            <Badge key={skill} variant="secondary" className="font-bold">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    ),
    "candidate-cards": (
      <div className="flex items-center gap-3 justify-center">
        {[
          { name: "Elena R.", score: 78, verdict: "Strong Hire" },
          { name: "Sarah C.", score: 62, verdict: "Hire" },
          { name: "Marcus J.", score: 28, verdict: "No Hire" },
        ].map((c) => (
          <div key={c.name} className="p-3 bg-muted/50 rounded-xl border border-border/50 text-center min-w-[100px]">
            <p className="font-black text-lg">{c.score}</p>
            <p className="text-xs font-bold text-muted-foreground">{c.name}</p>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] mt-1",
                c.verdict === "Strong Hire" && "border-emerald-500 text-emerald-400",
                c.verdict === "Hire" && "border-blue-500 text-blue-400",
                c.verdict === "No Hire" && "border-red-500 text-red-400",
              )}
            >
              {c.verdict}
            </Badge>
          </div>
        ))}
      </div>
    ),
    scoring: (
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50 font-mono text-sm">
        <p className="text-amber-400 font-bold mb-2">FORGE = CS × XS + LV</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-foreground">0.72</p>
            <p className="text-xs text-muted-foreground">CS</p>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">0.85</p>
            <p className="text-xs text-muted-foreground">XS</p>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">+0.03</p>
            <p className="text-xs text-muted-foreground">LV</p>
          </div>
        </div>
      </div>
    ),
    "proof-tiers": (
      <div className="flex items-center gap-2 justify-center flex-wrap">
        {[
          { tier: "Verified", mult: "1.0x", color: "bg-emerald-500" },
          { tier: "Strong", mult: "0.7x", color: "bg-blue-500" },
          { tier: "Weak", mult: "0.4x", color: "bg-amber-500" },
          { tier: "Claim", mult: "0.15x", color: "bg-orange-500" },
          { tier: "None", mult: "0x", color: "bg-red-500" },
        ].map((t) => (
          <div key={t.tier} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg">
            <div className={cn("h-2 w-2 rounded-full", t.color)} />
            <span className="text-xs font-bold">{t.tier}</span>
            <span className="text-xs text-muted-foreground font-mono">{t.mult}</span>
          </div>
        ))}
      </div>
    ),
    "comp-fit": (
      <div className="flex items-center gap-6 justify-center">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Budget</p>
          <p className="font-black">$180k - $240k</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Candidate Asks</p>
          <p className="font-black">$195k</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">In Band</Badge>
      </div>
    ),
    evidence: (
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <GitBranch className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div>
            <p className="font-bold text-sm">sarahchen/react-dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">
              "Built with React 18, TypeScript, Tailwind CSS. Features real-time data sync..."
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-400">
                Verified Artifact
              </Badge>
              <span className="text-[10px] text-muted-foreground">142 commits</span>
            </div>
          </div>
        </div>
      </div>
    ),
    "why-not-hired": (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-red-400">Missing Core Evidence</p>
            <p className="text-xs text-muted-foreground mt-1">
              No TypeScript repos found. Candidate claims "3 years TypeScript" but GitHub shows only JavaScript
              projects.
            </p>
            <p className="text-xs text-foreground mt-2 font-bold">
              Next step: Ship a TypeScript project to prove proficiency
            </p>
          </div>
        </div>
      </div>
    ),
    verdict: (
      <div className="flex items-center gap-8 justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2">
            <ThumbsUp className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="font-bold text-emerald-400">Strong Hire</p>
          <p className="text-xs text-muted-foreground">Elena R.</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center mx-auto mb-2">
            <Check className="h-8 w-8 text-blue-400" />
          </div>
          <p className="font-bold text-blue-400">Hire</p>
          <p className="text-xs text-muted-foreground">Sarah C.</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-2">
            <ThumbsDown className="h-8 w-8 text-red-400" />
          </div>
          <p className="font-bold text-red-400">No Hire</p>
          <p className="text-xs text-muted-foreground">Marcus J.</p>
        </div>
      </div>
    ),
  }

  return visuals[type] || null
}
